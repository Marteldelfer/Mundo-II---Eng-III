from typing import Optional
from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.modelos.turma import Turma
from src.utils.database import get_db

class TurmaCreate(BaseModel):
    nome: str
    materia: Optional[str] = None
    descricao: Optional[str] = None

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"]
)

@router.get("/") # getAll
def get_all_turmas(db: Session = Depends(get_db)):
    return db.query(Turma).all()

@router.get("/{id}") # get por id
def get_turma_por_id(id: int, db: Session = Depends(get_db)):
    turma = db.query(Turma).filter(Turma.id == id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    return turma

@router.post("/", status_code=status.HTTP_201_CREATED) # criar turma
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
            descricao=turma.descricao
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

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def create_turma_upload(
    nome: str = Form(...),
    materia: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
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
            plano_ensino=nome_arquivo
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

@router.put("/{id}") # update turma
def update_turma(id: int, db: Session = Depends(get_db)):
    pass

@router.delete("/{id}") # delete turma
def delete_turma(id: int, db: Session = Depends(get_db)):
    pass