from datetime import datetime
from fastapi import APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from src.modelos.aluno_turma import AlunoTurma
from src.modelos.observacao import Observacao
from src.modelos.turma import Turma
from src.modelos.user import User
from src.utils.database import get_db
from src.utils.auth import get_current_user


router = APIRouter(prefix="/observacoes", tags=["Observacoes"])


# ---------------- Schemas ----------------
class ObservacaoCreate(BaseModel):
    aluno_id: int
    turma_id: int
    texto: str

class ObservacaoUpdate(BaseModel):
    texto: str


# ---------------- Helpers ----------------
def _serializar(obs: Observacao) -> dict:
    return {
        "id": obs.id,
        "aluno_turma_id": obs.aluno_turma_id,
        "texto": obs.texto,
        "data_criacao": obs.data_criacao.strftime("%d/%m/%Y %H:%M"),
        "data_edicao": obs.data_edicao.strftime("%d/%m/%Y %H:%M") if obs.data_edicao else None,
    }


def _carregar_vinculo_do_usuario(
    aluno_id: int,
    turma_id: int,
    db: Session,
    usuario: User,
) -> AlunoTurma:
    """
    Carrega o vínculo Aluno↔Turma garantindo que a turma pertence ao usuário logado.
    Devolve 404 (não 403) para não vazar existência.
    """
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma or turma.user_id != usuario.id:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    vinculo = (
        db.query(AlunoTurma)
        .filter(
            AlunoTurma.aluno_id == aluno_id,
            AlunoTurma.turma_id == turma_id,
        )
        .first()
    )
    if not vinculo:
        raise HTTPException(status_code=404, detail="Aluno não está nesta turma")

    return vinculo


def _carregar_observacao_do_usuario(
    observacao_id: int,
    db: Session,
    usuario: User,
) -> Observacao:
    """
    Carrega a observação garantindo que a turma do vínculo pertence ao usuário.
    """
    obs = (
        db.query(Observacao)
        .options(
            joinedload(Observacao.vinculo).joinedload(AlunoTurma.turma),
        )
        .filter(Observacao.id == observacao_id)
        .first()
    )
    if not obs:
        raise HTTPException(status_code=404, detail="Observação não encontrada")

    if obs.vinculo.turma.user_id != usuario.id:
        # 404 para não vazar existência
        raise HTTPException(status_code=404, detail="Observação não encontrada")

    return obs


# ---------------- Endpoints ----------------

@router.get("/aluno/{aluno_id}/turma/{turma_id}", status_code=status.HTTP_200_OK)
def listar_observacoes(
    aluno_id: int,
    turma_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    """Lista todas as entradas de diário do aluno NAQUELA turma, mais recentes primeiro."""
    vinculo = _carregar_vinculo_do_usuario(aluno_id, turma_id, db, usuario_atual)

    observacoes = (
        db.query(Observacao)
        .filter(Observacao.aluno_turma_id == vinculo.id)
        .order_by(Observacao.data_criacao.desc())
        .all()
    )
    return [_serializar(o) for o in observacoes]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_observacao(
    observacao: ObservacaoCreate,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    if not observacao.texto or not observacao.texto.strip():
        raise HTTPException(400, "Texto da observação é obrigatório")

    vinculo = _carregar_vinculo_do_usuario(
        observacao.aluno_id, observacao.turma_id, db, usuario_atual,
    )

    try:
        nova = Observacao(
            aluno_turma_id=vinculo.id,
            texto=observacao.texto.strip(),
        )
        db.add(nova)
        db.commit()
        db.refresh(nova)
        return _serializar(nova)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao criar observação.")


@router.put("/{observacao_id}", status_code=status.HTTP_200_OK)
def atualizar_observacao(
    observacao_id: int,
    observacao_data: ObservacaoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    if not observacao_data.texto or not observacao_data.texto.strip():
        raise HTTPException(400, "Texto da observação é obrigatório")

    obs = _carregar_observacao_do_usuario(observacao_id, db, usuario_atual)

    try:
        obs.texto = observacao_data.texto.strip()
        obs.data_edicao = datetime.utcnow()
        db.commit()
        db.refresh(obs)
        return _serializar(obs)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao atualizar observação.")


@router.delete("/{observacao_id}", status_code=status.HTTP_200_OK)
def excluir_observacao(
    observacao_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    obs = _carregar_observacao_do_usuario(observacao_id, db, usuario_atual)

    try:
        db.delete(obs)
        db.commit()
        return {"mensagem": "Observação excluída com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao excluir observação.")