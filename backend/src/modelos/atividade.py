# src/modelos/atividade.py
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.utils.database import Base

class Atividade(Base):
    """
    Representa o upload original da atividade feito pelo professor.
    Pode ser individual (aluno_id) ou coletiva (turma_id).
    """
    __tablename__ = "atividades"

    id = Column(Integer, primary_key=True, index=True)
    turma_id = Column(Integer, ForeignKey("turmas.id", ondelete="CASCADE"), nullable=False)
    aluno_id = Column(Integer, ForeignKey("alunos.id", ondelete="CASCADE"), nullable=True) # Null = coletiva
    
    nome_original = Column(String, nullable=False)
    nome_arquivo = Column(String, nullable=True) # Nome do arquivo salvo no disco
    conteudo_texto = Column(Text, nullable=True) # Texto extraído para a IA (opcional)
    
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos
    turma = relationship("Turma")
    aluno = relationship("Aluno")
    adaptacoes = relationship("AtividadeAdaptada", back_populates="atividade", cascade="all, delete-orphan")


class AtividadeAdaptada(Base):
    """
    Representa o resultado da adaptação da IA para um aluno específico
    ou para a turma inteira.
    """
    __tablename__ = "atividades_adaptadas"

    id = Column(Integer, primary_key=True, index=True)
    atividade_id = Column(Integer, ForeignKey("atividades.id", ondelete="CASCADE"), nullable=False)
    
    nome_arquivo = Column(String, nullable=False) # Ex: "prova_matematica_adaptada_joao.txt"
    conteudo_texto = Column(Text, nullable=False) # O texto adaptado gerado pela IA
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos
    atividade = relationship("Atividade", back_populates="adaptacoes")