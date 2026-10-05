from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.utils.database import Base


class Turma(Base):
    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    materia = Column(String, nullable=True)
    descricao = Column(Text, nullable=True)
    plano_ensino = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    vinculos = relationship(
        "AlunoTurma",
        back_populates="turma",
        cascade="all, delete-orphan",
    )

    @property
    def alunos(self):
        return [v.aluno for v in self.vinculos]