import os
import io
import json
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from docx import Document
from docx.shared import Pt

from src.modelos.atividade import Atividade, AtividadeAdaptada
from src.modelos.aluno import Aluno
from src.modelos.aluno_turma import AlunoTurma
from src.modelos.turma import Turma
from src.modelos.user import User
from src.utils.database import get_db
from src.utils.auth import get_current_user
from src.services.openai_service import analisar_atividade, adaptar_atividade

router = APIRouter(prefix="/atividades", tags=["Atividades"])

# ---------------- Schemas ----------------
class AtividadeAdaptadaResponse(BaseModel):
    id: int
    nome_arquivo: str
    nome_original: str
    data_criacao: str
    download_url: Optional[str] = None
    conteudo_texto: Optional[str] = None

# ---------------- Helpers ----------------
def limpar_markdown(texto: str) -> str:
    """Remove formatações de Markdown para deixar o texto limpo."""
    if not texto:
        return ""
    texto = re.sub(r'^#{1,6}\s+', '', texto, flags=re.MULTILINE)
    texto = re.sub(r'(\*\*|__)(.*?)\1', r'\2', texto)
    texto = re.sub(r'(\*|_)(.*?)\1', r'\2', texto)
    texto = re.sub(r'^\s*[-*+]\s+', '• ', texto, flags=re.MULTILINE)
    texto = re.sub(r'```.*?```', '', texto, flags=re.DOTALL)
    texto = re.sub(r'^---+$', '', texto, flags=re.MULTILINE)
    texto = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', texto)
    return texto.strip()

def _validar_arquivo(arquivo: UploadFile):
    extensoes = {".txt", ".pdf", ".docx", ".pptx"}
    nome = arquivo.filename or ""
    ext = "." + nome.rsplit(".", 1)[-1].lower() if "." in nome else ""
    if ext not in extensoes:
        raise HTTPException(400, "Formato não suportado. Envie TXT, PDF, DOCX ou PPTX.")
    return nome

def _serializar_adaptada(adaptada: AtividadeAdaptada, atividade: Atividade) -> dict:
    # Garante que a URL de download aponte para o backend
    return {
        "id": adaptada.id,
        "nome_arquivo": adaptada.nome_arquivo,
        "nome_original": atividade.nome_original,
        "data_criacao": adaptada.data_criacao.strftime("%d/%m/%Y %H:%M"),
        "conteudo_texto": adaptada.conteudo_texto,
        "download_url": f"http://127.0.0.1:8000/atividades/{adaptada.id}/download",
    }

# ---------------- Endpoints ----------------

@router.post("/analisar", status_code=status.HTTP_200_OK)
async def analisar_atividade_individual(
    arquivo: UploadFile = File(...),
    aluno_id: int = Form(...),
    turma_id: int = Form(...),
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    _validar_arquivo(arquivo)
    
    vinculo = db.query(AlunoTurma).join(Turma).filter(
        AlunoTurma.aluno_id == aluno_id,
        AlunoTurma.turma_id == turma_id,
        Turma.user_id == usuario_atual.id
    ).first()
    if not vinculo:
        raise HTTPException(404, "Aluno ou turma não encontrados.")

    aluno = db.query(Aluno).filter(Aluno.id == aluno_id).first()
    deficiencias = [d.strip() for d in (aluno.deficiencias or "").split(",") if d.strip()]
    observacoes = [obs.texto for obs in vinculo.observacoes]

    conteudo = await arquivo.read()
    
    try:
        resultado = analisar_atividade(
            conteudo=conteudo,
            nome_arquivo=arquivo.filename,
            deficiencias=deficiencias,
            observacoes=observacoes
        )
        return resultado
    except Exception as e:
        raise HTTPException(500, f"Erro na IA: {str(e)}")

@router.post("/turma/{turma_id}/analisar", status_code=status.HTTP_200_OK)
async def analisar_atividade_turma(
    turma_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    _validar_arquivo(arquivo)
    
    turma = db.query(Turma).filter(Turma.id == turma_id, Turma.user_id == usuario_atual.id).first()
    if not turma:
        raise HTTPException(404, "Turma não encontrada.")

    deficiencias_set = set()
    observacoes_lista = []
    
    for vinculo in turma.vinculos:
        aluno = vinculo.aluno
        if aluno.deficiencias:
            for d in aluno.deficiencias.split(","):
                if d.strip(): deficiencias_set.add(d.strip())
        for obs in vinculo.observacoes:
            observacoes_lista.append(f"{aluno.nome}: {obs.texto}")

    conteudo = await arquivo.read()
    
    try:
        resultado = analisar_atividade(
            conteudo=conteudo,
            nome_arquivo=arquivo.filename,
            deficiencias=list(deficiencias_set),
            observacoes=observacoes_lista
        )
        return resultado
    except Exception as e:
        raise HTTPException(500, f"Erro na IA: {str(e)}")

@router.post("/adaptar", status_code=status.HTTP_200_OK)
async def adaptar_atividade_individual(
    arquivo: UploadFile = File(...),
    aluno_id: int = Form(...),
    turma_id: int = Form(...),
    melhorias: str = Form("[]"),
    notas_usuario: str = Form(""),
    formato_saida: str = Form("docx"), # 👈 Novo parâmetro
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    _validar_arquivo(arquivo)
    
    vinculo = db.query(AlunoTurma).join(Turma).filter(
        AlunoTurma.aluno_id == aluno_id,
        AlunoTurma.turma_id == turma_id,
        Turma.user_id == usuario_atual.id
    ).first()
    if not vinculo:
        raise HTTPException(404, "Aluno ou turma não encontrados.")

    aluno = db.query(Aluno).filter(Aluno.id == aluno_id).first()
    deficiencias = [d.strip() for d in (aluno.deficiencias or "").split(",") if d.strip()]
    melhorias_lista = json.loads(melhorias)

    conteudo = await arquivo.read()
    
    try:
        texto_adaptado = adaptar_atividade(
            conteudo=conteudo,
            nome_arquivo=arquivo.filename,
            deficiencias=deficiencias,
            melhorias_aprovadas=melhorias_lista,
            notas_usuario=notas_usuario
        )
        
        # Define a extensão correta
        extensao = ".docx" if formato_saida == "docx" else ".txt"
        nome_base = arquivo.filename.rsplit(".", 1)[0]
        nome_adaptado = f"{nome_base}_adaptada_{aluno.nome.lower().replace(' ', '_')}{extensao}"
        
        nova_atividade = Atividade(
            turma_id=turma_id,
            aluno_id=aluno_id,
            nome_original=arquivo.filename,
            conteudo_texto=texto_adaptado
        )
        db.add(nova_atividade)
        db.commit()
        db.refresh(nova_atividade)
        
        adaptada = AtividadeAdaptada(
            atividade_id=nova_atividade.id,
            nome_arquivo=nome_adaptado,
            conteudo_texto=texto_adaptado
        )
        db.add(adaptada)
        db.commit()
        db.refresh(adaptada)
        
        return _serializar_adaptada(adaptada, nova_atividade)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao adaptar: {str(e)}")

@router.post("/turma/{turma_id}/adaptar", status_code=status.HTTP_200_OK)
async def adaptar_atividade_turma(
    turma_id: int,
    arquivo: UploadFile = File(...),
    melhorias: str = Form("[]"),
    notas_usuario: str = Form(""),
    formato_saida: str = Form("docx"), # 👈 Novo parâmetro
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    _validar_arquivo(arquivo)
    
    turma = db.query(Turma).filter(Turma.id == turma_id, Turma.user_id == usuario_atual.id).first()
    if not turma:
        raise HTTPException(404, "Turma não encontrada.")

    deficiencias_set = set()
    for vinculo in turma.vinculos:
        if vinculo.aluno.deficiencias:
            for d in vinculo.aluno.deficiencias.split(","):
                if d.strip(): deficiencias_set.add(d.strip())
    
    melhorias_lista = json.loads(melhorias)
    conteudo = await arquivo.read()
    
    try:
        texto_adaptado = adaptar_atividade(
            conteudo=conteudo,
            nome_arquivo=arquivo.filename,
            deficiencias=list(deficiencias_set),
            melhorias_aprovadas=melhorias_lista,
            notas_usuario=notas_usuario
        )
        
        extensao = ".docx" if formato_saida == "docx" else ".txt"
        nome_base = arquivo.filename.rsplit(".", 1)[0]
        nome_adaptado = f"{nome_base}_adaptada_{turma.nome.lower().replace(' ', '_')}{extensao}"
        
        nova_atividade = Atividade(
            turma_id=turma_id,
            aluno_id=None,
            nome_original=arquivo.filename,
            conteudo_texto=texto_adaptado
        )
        db.add(nova_atividade)
        db.commit()
        db.refresh(nova_atividade)
        
        adaptada = AtividadeAdaptada(
            atividade_id=nova_atividade.id,
            nome_arquivo=nome_adaptado,
            conteudo_texto=texto_adaptado
        )
        db.add(adaptada)
        db.commit()
        db.refresh(adaptada)
        
        return _serializar_adaptada(adaptada, nova_atividade)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao adaptar: {str(e)}")

@router.get("/aluno/{aluno_id}/turma/{turma_id}")
def listar_atividades_aluno(
    aluno_id: int, turma_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    vinculo = db.query(AlunoTurma).join(Turma).filter(
        AlunoTurma.aluno_id == aluno_id,
        AlunoTurma.turma_id == turma_id,
        Turma.user_id == usuario_atual.id
    ).first()
    if not vinculo:
        raise HTTPException(404, "Aluno ou turma não encontrados.")

    atividades = db.query(Atividade).filter(
        Atividade.aluno_id == aluno_id,
        Atividade.turma_id == turma_id
    ).all()
    
    resultado = []
    for ativ in atividades:
        for adaptada in ativ.adaptacoes:
            resultado.append(_serializar_adaptada(adaptada, ativ))
    return resultado

@router.get("/turma/{turma_id}")
def listar_atividades_turma(
    turma_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    turma = db.query(Turma).filter(Turma.id == turma_id, Turma.user_id == usuario_atual.id).first()
    if not turma:
        raise HTTPException(404, "Turma não encontrada.")

    atividades = db.query(Atividade).filter(
        Atividade.turma_id == turma_id,
        Atividade.aluno_id == None
    ).all()
    
    resultado = []
    for ativ in atividades:
        for adaptada in ativ.adaptacoes:
            resultado.append(_serializar_adaptada(adaptada, ativ))
    return resultado

@router.get("/{id}/download")
def download_atividade(
    id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    adaptada = db.query(AtividadeAdaptada).options(
        joinedload(AtividadeAdaptada.atividade).joinedload(Atividade.turma)
    ).filter(AtividadeAdaptada.id == id).first()
    
    if not adaptada:
        raise HTTPException(404, "Atividade não encontrada.")
        
    if adaptada.atividade.turma.user_id != usuario_atual.id:
        raise HTTPException(403, "Sem permissão.")

    texto_limpo = limpar_markdown(adaptada.conteudo_texto)

    # Verifica a extensão para decidir o formato de saída
    if adaptada.nome_arquivo.endswith('.docx'):
        # Gera o arquivo Word
        doc = Document()
        titulo = doc.add_heading('Atividade Adaptada - AdaptEd', 0)
        titulo.alignment = 1
        doc.add_paragraph(f"Arquivo original: {adaptada.atividade.nome_original}")
        doc.add_paragraph(f"Gerado em: {adaptada.data_criacao.strftime('%d/%m/%Y às %H:%M')}")
        doc.add_paragraph("=" * 60)

        for linha in texto_limpo.split('\n'):
            p = doc.add_paragraph(linha)
            for run in p.runs:
                run.font.name = 'Arial'
                run.font.size = Pt(12)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{adaptada.nome_arquivo}"'}
        )
    else:
        # Gera o arquivo TXT puro
        buffer = io.BytesIO(texto_limpo.encode("utf-8"))
        return StreamingResponse(
            buffer,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{adaptada.nome_arquivo}"'}
        )