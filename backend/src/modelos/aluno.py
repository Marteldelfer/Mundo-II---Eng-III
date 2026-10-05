from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from src.utils.database import Base


class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    deficiencias = Column(Text, nullable=True)

    vinculos = relationship(
        "AlunoTurma",
        back_populates="aluno",
        cascade="all, delete-orphan",
    )

    @property
    def turmas(self):
        return [v.turma for v in self.vinculos]