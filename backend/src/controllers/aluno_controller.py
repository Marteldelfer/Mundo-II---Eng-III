from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from src.modelos.user import *
from src.utils.database import get_db
from src.utils.validation import *

router = APIRouter(
    prefix="/alunos",
    tags=["Alunos"]
)

@router.get("/") # getAll
def get_all_alunos():
    pass

@router.get("/{id}") # get por id
def get_aluno_por_id(id: int):
    pass

@router.get("/turma/{id_turma}") # getAll por turma
def get_all_alunos_por_turma(id_turma: int):
    pass

@router.post("/") # criar aluno
def create_aluno():
    pass

@router.put("/{id}") # update aluno
def update_aluno(id: int):
    pass

@router.delete("/{id}") # delete aluno
def delete_aluno(id: int):
    pass