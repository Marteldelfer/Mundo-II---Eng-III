from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from src.utils.database import Base

class Observacao(Base):
    __tablename__ = "observacoes"
    
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 👈 NOVO
    texto = Column(Text, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_edicao = Column(DateTime, nullable=True)
    
    # Relacionamentos
    aluno = relationship("Aluno", back_populates="observacoes")
    professor = relationship("User")