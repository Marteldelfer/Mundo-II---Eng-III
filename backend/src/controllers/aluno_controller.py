from typing import Optional, List
from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from src.modelos.aluno import Aluno
from src.modelos.turma import Turma
from src.utils.database import get_db
from src.services.openai_service import analisar_lista_pcd

router = APIRouter(
    prefix="/alunos",
    tags=["Alunos"]
)

# --- Schemas simplificados (sem relacionamento circular) ---
class TurmaResumo(BaseModel):
    id: int
    nome: str
    materia: Optional[str] = None

    class Config:
        from_attributes = True

class AlunoCreate(BaseModel):
    nome: str
    deficiencias: Optional[str] = None

class AlunoUpdate(BaseModel):
    nome: Optional[str] = None
    deficiencias: Optional[str] = None
    observacoes: Optional[str] = None
    engajamento: Optional[float] = None

class AlunoResponse(BaseModel):
    id: int
    nome: str
    deficiencias: Optional[str] = None
    observacoes: Optional[str] = None
    engajamento: float
    turmas: List[TurmaResumo] = []

    class Config:
        from_attributes = True

class VincularAluno(BaseModel):
    aluno_id: int

# --- Helpers ---
def _aluno_para_dict(aluno: Aluno) -> dict:
    return {
        "id": aluno.id,
        "nome": aluno.nome,
        "deficiencias": aluno.deficiencias,
        "engajamento": float(aluno.engajamento) if aluno.engajamento else 0.0,
        "turmas": [
            {"id": t.id, "nome": t.nome, "materia": t.materia}
            for t in (aluno.turmas or [])
        ],
    }

# --- Endpoints ---
@router.get("/", status_code=status.HTTP_200_OK)
def get_all_alunos(db: Session = Depends(get_db)):
    alunos = db.query(Aluno).options(joinedload(Aluno.turmas)).all()
    return [_aluno_para_dict(a) for a in alunos]

@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_aluno_por_id(id: int, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).options(joinedload(Aluno.turmas)).filter(Aluno.id == id).first()
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    return _aluno_para_dict(aluno)

@router.get("/turma/{id_turma}", status_code=status.HTTP_200_OK)
def get_all_alunos_por_turma(id_turma: int, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    return [_aluno_para_dict(a) for a in turma.alunos]

@router.post("/", response_model=AlunoResponse, status_code=status.HTTP_201_CREATED)
def create_aluno(aluno: AlunoCreate, db: Session = Depends(get_db)):
    if not aluno.nome or not aluno.nome.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome do aluno é obrigatório")
    try:
        novo_aluno = Aluno(
            nome=aluno.nome.strip(),
            deficiencias=aluno.deficiencias,
            engajamento=0.0,
        )
        db.add(novo_aluno)
        db.commit()
        db.refresh(novo_aluno)
        return _aluno_para_dict(novo_aluno)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno na criação do aluno.")

@router.post("/vincular/{id_turma}", status_code=status.HTTP_200_OK)
def vincular_aluno_a_turma(id_turma: int, dados: VincularAluno, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    aluno = db.query(Aluno).filter(Aluno.id == dados.aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    if aluno in turma.alunos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aluno já está vinculado a esta turma")
    try:
        turma.alunos.append(aluno)
        db.commit()
        return {"mensagem": "Aluno vinculado com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao vincular o aluno.")

@router.post("/upload-lista-pcd/{id_turma}", status_code=status.HTTP_201_CREATED)
async def upload_lista_pcd(id_turma: int, arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    nome_arquivo = arquivo.filename or ""
    extensao = "." + nome_arquivo.rsplit(".", 1)[-1].lower() if "." in nome_arquivo else ""
    if extensao not in {".pdf", ".docx", ".pptx", ".xlsx", ".csv"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de arquivo não suportado.")
    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O arquivo está vazio.")
    try:
        resultado = analisar_lista_pcd(conteudo=conteudo, nome_arquivo=nome_arquivo)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Não foi possível ler o arquivo.")
    alunos_criados = []
    try:
        for dados_aluno in resultado.get("alunos", []):
            novo_aluno = Aluno(
                nome=dados_aluno["nome"],
                deficiencias=", ".join(dados_aluno.get("deficiencias", [])) if dados_aluno.get("deficiencias") else None,
                engajamento=0.0,
            )
            db.add(novo_aluno)
            db.flush()
            turma.alunos.append(novo_aluno)
            alunos_criados.append(novo_aluno)
        db.commit()
        for aluno in alunos_criados:
            db.refresh(aluno)
        return {"mensagem": f"{len(alunos_criados)} aluno(s) cadastrado(s) com sucesso", "alunos": [_aluno_para_dict(a) for a in alunos_criados]}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao processar a lista.")

@router.put("/{id}", status_code=status.HTTP_200_OK)
def update_aluno(id: int, aluno_data: AlunoUpdate, db: Session = Depends(get_db)):
    aluno_db = db.query(Aluno).filter(Aluno.id == id).first()
    if not aluno_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    try:
        if aluno_data.nome is not None:
            aluno_db.nome = aluno_data.nome.strip()
        if aluno_data.deficiencias is not None:
            aluno_db.deficiencias = aluno_data.deficiencias
        if aluno_data.observacoes is not None:
            aluno_db.observacoes = aluno_data.observacoes
        if aluno_data.engajamento is not None:
            if not (0.0 <= aluno_data.engajamento <= 100.0):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O engajamento deve estar entre 0.0 e 100.0")
            aluno_db.engajamento = aluno_data.engajamento
        db.commit()
        db.refresh(aluno_db)
        return _aluno_para_dict(aluno_db)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno na atualização do aluno.")

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_aluno(id: int, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.id == id).first()
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    try:
        db.delete(aluno)
        db.commit()
        return {"mensagem": "Aluno deletado com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno na deleção do aluno.")

@router.delete("/desvincular/{id_turma}/{aluno_id}", status_code=status.HTTP_200_OK)
def desvincular_aluno_da_turma(id_turma: int, aluno_id: int, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id_turma).first()
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    
    aluno = db.query(Aluno).filter(Aluno.id == aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    
    if aluno not in turma.alunos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aluno não está vinculado a esta turma")
    
    try:
        turma.alunos.remove(aluno)
        db.commit()
        return {"mensagem": "Aluno removido da turma com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao remover o aluno da turma.")