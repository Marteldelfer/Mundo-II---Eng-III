from sqlalchemy import Column, Integer, String, Text
from src.utils.database import Base

class Turma(Base):
    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    materia = Column(String, nullable=True)
    descricao = Column(Text, nullable=True)
    plano_ensino = Column(String, nullable=True)