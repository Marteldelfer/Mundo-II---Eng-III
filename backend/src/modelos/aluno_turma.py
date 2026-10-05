from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from src.utils.database import Base


class AlunoTurma(Base):
    """
    Vínculo entre Aluno e Turma. Guarda dados que pertencem
    especificamente àquele vínculo (engajamento + diário de observações).
    """
    __tablename__ = "aluno_turma"

    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id", ondelete="CASCADE"), nullable=False)
    turma_id = Column(Integer, ForeignKey("turmas.id", ondelete="CASCADE"), nullable=False)

    engajamento = Column(Float, default=0.0, nullable=False)

    data_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_edicao = Column(DateTime, nullable=True)

    aluno = relationship("Aluno", back_populates="vinculos")
    turma = relationship("Turma", back_populates="vinculos")

    # 👇 Cada vínculo tem VÁRIAS observações (diário)
    observacoes = relationship(
        "Observacao",
        back_populates="vinculo",
        cascade="all, delete-orphan",
        order_by="desc(Observacao.data_criacao)",
    )

    __table_args__ = (
        UniqueConstraint("aluno_id", "turma_id", name="uq_aluno_turma"),
    )