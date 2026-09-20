from typing import Optional
from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.modelos.turma import Turma
from src.utils.database import get_db
from src.services.openai_service import analisar_plano_ensino

class TurmaCreate(BaseModel):
    nome: str
    materia: Optional[str] = None
    descricao: Optional[str] = None
    user_id: int

class TurmaUpdate(BaseModel):
    nome: Optional[str] = None
    materia: Optional[str] = None
    descricao: Optional[str] = None

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"]
)

@router.get("/")
def get_all_turmas(db: Session = Depends(get_db)):
    return db.query(Turma).all()

@router.get("/usuario/{user_id}")
def get_turmas_por_usuario(user_id: int, db: Session = Depends(get_db)):
    return db.query(Turma).filter(Turma.user_id == user_id).all()

@router.get("/{id}")
def get_turma_por_id(id: int, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    return turma

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_turma(turma: TurmaCreate, db: Session = Depends(get_db)):
    if not turma.nome or not turma.nome.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome da turma é obrigatório"
        )
    try:
        nova_turma = Turma(
            nome=turma.nome.strip(),
            materia=turma.materia,
            descricao=turma.descricao,
            user_id=turma.user_id
        )
        db.add(nova_turma)
        db.commit()
        db.refresh(nova_turma)
        return nova_turma
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno na criação da turma."
        )

EXTENSOES_PLANOS_PERMITIDAS = {".pdf", ".docx", ".pptx"}

@router.post("/analisar-plano")
async def analisar_plano(
    plano_ensino: UploadFile = File(...),
):
    nome_arquivo = plano_ensino.filename or ""
    extensao = "." + nome_arquivo.rsplit(".", 1)[-1].lower() if "." in nome_arquivo else ""
    
    if extensao not in EXTENSOES_PLANOS_PERMITIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo não suportado. Envie um arquivo PDF, DOCX ou PPTX."
        )
    
    conteudo = await plano_ensino.read()
    if not conteudo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo do plano de ensino está vazio."
        )
    
    try:
        return analisar_plano_ensino(
            conteudo=conteudo,
            nome_arquivo=nome_arquivo,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno. Tente novamente mais tarde"
        )

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def create_turma_upload(
    nome: str = Form(...),
    materia: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    user_id: int = Form(...),
    plano_ensino: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if not nome or not nome.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome da turma é obrigatório"
        )
    
    try:
        nome_arquivo = plano_ensino.filename if plano_ensino else None
        nova_turma = Turma(
            nome=nome.strip(),
            materia=materia,
            descricao=descricao,
            plano_ensino=nome_arquivo,
            user_id=user_id
        )
        db.add(nova_turma)
        db.commit()
        db.refresh(nova_turma)
        return nova_turma
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno na criação da turma."
        )

@router.put("/{id}")
def update_turma(id: int, turma_data: TurmaUpdate, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    try:
        if turma_data.nome is not None:
            turma.nome = turma_data.nome.strip()
        if turma_data.materia is not None:
            turma.materia = turma_data.materia
        if turma_data.descricao is not None:
            turma.descricao = turma_data.descricao
        
        db.commit()
        db.refresh(turma)
        return turma
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno na atualização da turma."
        )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_turma(id: int, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    try:
        db.delete(turma)
        db.commit()
        return {"mensagem": "Turma deletada com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno na deleção da turma."
        )

@router.get("/{id}/alunos")
def get_alunos_da_turma(id: int, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    return turma.alunos