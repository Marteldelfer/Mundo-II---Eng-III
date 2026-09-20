from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.utils.database import Base
from src.modelos.associacoes import turma_aluno

class Turma(Base):
    __tablename__ = "turmas"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    materia = Column(String, nullable=True)
    descricao = Column(Text, nullable=True)
    plano_ensino = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relacionamento many-to-many com alunos
    alunos = relationship("Aluno", secondary=turma_aluno, back_populates="turmas")