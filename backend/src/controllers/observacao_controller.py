from datetime import datetime
from typing import List
from fastapi import APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.modelos.observacao import Observacao
from src.modelos.aluno import Aluno
from src.modelos.user import User
from src.utils.database import get_db

router = APIRouter(
    prefix="/observacoes",
    tags=["Observacoes"]
)

class ObservacaoCreate(BaseModel):
    aluno_id: int
    professor_id: int
    texto: str

class ObservacaoUpdate(BaseModel):
    texto: str

@router.get("/aluno/{aluno_id}")
def get_observacoes_por_aluno_e_professor(aluno_id: int, professor_id: int, db: Session = Depends(get_db)):
    """Retorna apenas as observações do professor logado sobre o aluno."""
    aluno = db.query(Aluno).filter(Aluno.id == aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    
    professor = db.query(User).filter(User.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor não encontrado")
    
    observacoes = (
        db.query(Observacao)
        .filter(Observacao.aluno_id == aluno_id, Observacao.professor_id == professor_id)
        .order_by(Observacao.data_criacao.desc())
        .all()
    )
    
    return [
        {
            "id": obs.id,
            "aluno_id": obs.aluno_id,
            "professor_id": obs.professor_id,
            "texto": obs.texto,
            "data_criacao": obs.data_criacao.strftime("%d/%m/%Y %H:%M"),
            "data_edicao": obs.data_edicao.strftime("%d/%m/%Y %H:%M") if obs.data_edicao else None
        }
        for obs in observacoes
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_observacao(observacao: ObservacaoCreate, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.id == observacao.aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
    
    professor = db.query(User).filter(User.id == observacao.professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor não encontrado")
    
    if not observacao.texto or not observacao.texto.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Texto da observação é obrigatório")
    
    try:
        nova_observacao = Observacao(
            aluno_id=observacao.aluno_id,
            professor_id=observacao.professor_id,
            texto=observacao.texto.strip()
        )
        db.add(nova_observacao)
        db.commit()
        db.refresh(nova_observacao)
        
        return {
            "id": nova_observacao.id,
            "aluno_id": nova_observacao.aluno_id,
            "professor_id": nova_observacao.professor_id,
            "texto": nova_observacao.texto,
            "data_criacao": nova_observacao.data_criacao.strftime("%d/%m/%Y %H:%M"),
            "data_edicao": None
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno na criação da observação.")

@router.put("/{id}")
def update_observacao(id: int, observacao_data: ObservacaoUpdate, professor_id: int, db: Session = Depends(get_db)):
    """Só permite editar observação se for do professor logado."""
    observacao = db.query(Observacao).filter(Observacao.id == id).first()
    if not observacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observação não encontrada")
    
    if observacao.professor_id != professor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode editar suas próprias observações")
    
    if not observacao_data.texto or not observacao_data.texto.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Texto da observação é obrigatório")
    
    try:
        observacao.texto = observacao_data.texto.strip()
        observacao.data_edicao = datetime.utcnow()
        db.commit()
        db.refresh(observacao)
        
        return {
            "id": observacao.id,
            "aluno_id": observacao.aluno_id,
            "professor_id": observacao.professor_id,
            "texto": observacao.texto,
            "data_criacao": observacao.data_criacao.strftime("%d/%m/%Y %H:%M"),
            "data_edicao": observacao.data_edicao.strftime("%d/%m/%Y %H:%M") if observacao.data_edicao else None
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno na atualização da observação.")

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_observacao(id: int, professor_id: int, db: Session = Depends(get_db)):
    """Só permite deletar observação se for do professor logado."""
    observacao = db.query(Observacao).filter(Observacao.id == id).first()
    if not observacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observação não encontrada")
    
    if observacao.professor_id != professor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode excluir suas próprias observações")
    
    try:
        db.delete(observacao)
        db.commit()
        return {"mensagem": "Observação deletada com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno na deleção da observação.")