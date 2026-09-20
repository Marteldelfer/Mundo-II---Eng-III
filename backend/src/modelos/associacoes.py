from sqlalchemy import Table, Column, Integer, ForeignKey
from src.utils.database import Base

turma_aluno = Table(
    'turma_aluno',
    Base.metadata,
    Column('turma_id', Integer, ForeignKey('turmas.id'), primary_key=True),
    Column('aluno_id', Integer, ForeignKey('alunos.id'), primary_key=True),
)