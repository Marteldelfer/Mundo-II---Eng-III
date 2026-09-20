from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from src.utils.database import Base
from src.modelos.associacoes import turma_aluno

class Aluno(Base):
    __tablename__ = "alunos"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    deficiencias = Column(Text, nullable=True)
    engajamento = Column(Float, default=0.0)
    
    # Relacionamentos
    turmas = relationship("Turma", secondary=turma_aluno, back_populates="alunos")
    observacoes = relationship("Observacao", back_populates="aluno", cascade="all, delete-orphan")