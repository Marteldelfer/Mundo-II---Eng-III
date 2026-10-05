from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.utils.database import Base


class Observacao(Base):
    """
    Entrada de diário: pertence a um vínculo Aluno↔Turma.
    Várias entradas por vínculo, cada uma editável/excluível individualmente.
    """
    __tablename__ = "observacoes"

    id = Column(Integer, primary_key=True, index=True)
    aluno_turma_id = Column(
        Integer,
        ForeignKey("aluno_turma.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    texto = Column(Text, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_edicao = Column(DateTime, nullable=True)

    vinculo = relationship("AlunoTurma", back_populates="observacoes")