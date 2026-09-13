from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from src.modelos.user import *
from src.utils.database import get_db
from src.utils.validation import *

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"]
)

@router.get("/") # getAll
def get_all_turmas():
    pass

@router.get("/{id}") # get por id
def get_turma_por_id(id: int):
    pass

@router.post("/") # criar turma
def create_turma():
    pass

@router.put("/{id}") # update turma
def update_turma(id: int):
    pass

@router.delete("/{id}") # delete turma
def delete_turma(id: int):
    pass