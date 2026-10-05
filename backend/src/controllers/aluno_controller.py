from typing import Optional, List
from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from src.modelos.aluno import Aluno
from src.modelos.aluno_turma import AlunoTurma
from src.modelos.turma import Turma
from src.modelos.user import User
from src.utils.database import get_db
from src.utils.auth import get_current_user
from src.services.openai_service import analisar_lista_pcd


router = APIRouter(prefix="/alunos", tags=["Alunos"])


# ---------------- Schemas ----------------
class TurmaResumo(BaseModel):
    id: int
    nome: str
    materia: Optional[str] = None
    class Config:
        from_attributes = True

class AlunoCreate(BaseModel):
    nome: str
    deficiencias: Optional[str] = None
    turma_id: int

class AlunoUpdate(BaseModel):
    """Atualização sempre no contexto de uma turma."""
    turma_id: int
    nome: Optional[str] = None
    deficiencias: Optional[str] = None
    engajamento: Optional[float] = None

class VincularAluno(BaseModel):
    aluno_id: int


# ---------------- Helpers ----------------
def _serializar_aluno(aluno: Aluno, usuario: User, turma_contexto: Optional[Turma] = None) -> dict:
    """
    Serializa o aluno.
    Se turma_contexto for informada, retorna os dados daquela turma
    (engajamento, observações). Senão, retorna os vínculos com o usuário.
    """
    vinculos_do_usuario = [
        v for v in aluno.vinculos
        if v.turma.user_id == usuario.id
    ]

    if turma_contexto is not None:
        vinculo = next(
            (v for v in vinculos_do_usuario if v.turma_id == turma_contexto.id),
            None,
        )
        return {
            "id": aluno.id,
            "nome": aluno.nome,
            "deficiencias": aluno.deficiencias,
            "turma_id": turma_contexto.id,
            "turma_nome": turma_contexto.nome,
            "engajamento": float(vinculo.engajamento) if vinculo else 0.0,
            "observacoes": vinculo.observacoes if vinculo else None,
        }

    return {
        "id": aluno.id,
        "nome": aluno.nome,
        "deficiencias": aluno.deficiencias,
        "vinculos": [
            {
                "turma_id": v.turma_id,
                "turma_nome": v.turma.nome,
                "turma_materia": v.turma.materia,
                "engajamento": float(v.engajamento),
                "observacoes": v.observacoes,
            }
            for v in vinculos_do_usuario
        ],
    }


def _carregar_turma_do_usuario(turma_id: int, db: Session, usuario: User) -> Turma:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(404, "Turma não encontrada")
    if turma.user_id != usuario.id:
        raise HTTPException(404, "Turma não encontrada")   # 404 proposital
    return turma


def _carregar_aluno_visivel(aluno_id: int, db: Session, usuario: User) -> Aluno:
    """Carrega o aluno garantindo que ele tem ao menos um vínculo do usuário."""
    aluno = (
        db.query(Aluno)
        .options(
            joinedload(Aluno.vinculos).joinedload(AlunoTurma.turma),
        )
        .filter(Aluno.id == aluno_id)
        .first()
    )
    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")

    if not any(v.turma.user_id == usuario.id for v in aluno.vinculos):
        raise HTTPException(404, "Aluno não encontrado")

    return aluno


# ---------------- Endpoints ----------------

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_alunos(
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    """Alunos que estão em pelo menos uma turma do usuário."""
    alunos = (
        db.query(Aluno)
        .join(Aluno.vinculos)
        .join(AlunoTurma.turma)
        .filter(Turma.user_id == usuario_atual.id)
        .options(joinedload(Aluno.vinculos).joinedload(AlunoTurma.turma))
        .distinct()
        .all()
    )
    return [_serializar_aluno(a, usuario_atual) for a in alunos]


@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_aluno_por_id(
    id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    aluno = _carregar_aluno_visivel(id, db, usuario_atual)
    return _serializar_aluno(aluno, usuario_atual)


@router.get("/{id}/turma/{turma_id}", status_code=status.HTTP_200_OK)
def get_aluno_na_turma(
    id: int,
    turma_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    """Visão do aluno específica para uma turma (engajamento + observações daquela turma)."""
    turma = _carregar_turma_do_usuario(turma_id, db, usuario_atual)
    aluno = _carregar_aluno_visivel(id, db, usuario_atual)
    return _serializar_aluno(aluno, usuario_atual, turma_contexto=turma)


@router.get("/turma/{id_turma}", status_code=status.HTTP_200_OK)
def get_all_alunos_por_turma(
    id_turma: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    turma = _carregar_turma_do_usuario(id_turma, db, usuario_atual)
    return [_serializar_aluno(v.aluno, usuario_atual, turma_contexto=turma) for v in turma.vinculos]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_aluno(
    aluno: AlunoCreate,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    if not aluno.nome or not aluno.nome.strip():
        raise HTTPException(400, "Nome do aluno é obrigatório")

    turma = _carregar_turma_do_usuario(aluno.turma_id, db, usuario_atual)

    try:
        # Reaproveita aluno existente com o mesmo nome nas turmas do usuário?
        existente = (
            db.query(Aluno)
            .join(Aluno.vinculos)
            .join(AlunoTurma.turma)
            .filter(
                Turma.user_id == usuario_atual.id,
                Aluno.nome == aluno.nome.strip(),
            )
            .options(joinedload(Aluno.vinculos).joinedload(AlunoTurma.turma))
            .first()
        )

        if existente:
            ja_tem = any(v.turma_id == turma.id for v in existente.vinculos)
            if not ja_tem:
                existente.vinculos.append(AlunoTurma(turma_id=turma.id))
                db.commit()
                db.refresh(existente)
            return _serializar_aluno(existente, usuario_atual, turma_contexto=turma)

        novo = Aluno(nome=aluno.nome.strip(), deficiencias=aluno.deficiencias)
        novo.vinculos.append(AlunoTurma(turma_id=turma.id))
        db.add(novo)
        db.commit()
        db.refresh(novo)
        return _serializar_aluno(novo, usuario_atual, turma_contexto=turma)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao criar aluno.")


@router.put("/{id}", status_code=status.HTTP_200_OK)
def update_aluno(
    id: int,
    aluno_data: AlunoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    turma = _carregar_turma_do_usuario(aluno_data.turma_id, db, usuario_atual)
    aluno = _carregar_aluno_visivel(id, db, usuario_atual)

    vinculo = next((v for v in aluno.vinculos if v.turma_id == turma.id), None)
    if not vinculo:
        raise HTTPException(404, "Aluno não está nesta turma")

    try:
        # Campos globais do aluno
        if aluno_data.nome is not None:
            aluno.nome = aluno_data.nome.strip()
        if aluno_data.deficiencias is not None:
            aluno.deficiencias = aluno_data.deficiencias

        # Campos por turma
        if aluno_data.engajamento is not None:
            if not (0.0 <= aluno_data.engajamento <= 100.0):
                raise HTTPException(400, "Engajamento deve estar entre 0.0 e 100.0")
            vinculo.engajamento = aluno_data.engajamento

        db.commit()
        db.refresh(aluno)
        return _serializar_aluno(aluno, usuario_atual, turma_contexto=turma)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao atualizar aluno.")


@router.post("/vincular/{id_turma}", status_code=status.HTTP_200_OK)
def vincular_aluno_a_turma(
    id_turma: int,
    dados: VincularAluno,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    turma = _carregar_turma_do_usuario(id_turma, db, usuario_atual)

    aluno = (
        db.query(Aluno)
        .options(joinedload(Aluno.vinculos).joinedload(AlunoTurma.turma))
        .filter(Aluno.id == dados.aluno_id)
        .first()
    )
    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")

    if not any(v.turma.user_id == usuario_atual.id for v in aluno.vinculos):
        raise HTTPException(404, "Aluno não encontrado")

    if any(v.turma_id == turma.id for v in aluno.vinculos):
        raise HTTPException(400, "Aluno já está vinculado a esta turma")

    try:
        aluno.vinculos.append(AlunoTurma(turma_id=turma.id))
        db.commit()
        return {"mensagem": "Aluno vinculado com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao vincular aluno.")


@router.delete("/desvincular/{id_turma}/{aluno_id}", status_code=status.HTTP_200_OK)
def desvincular_aluno_da_turma(
    id_turma: int,
    aluno_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    turma = _carregar_turma_do_usuario(id_turma, db, usuario_atual)

    vinculo = (
        db.query(AlunoTurma)
        .filter(AlunoTurma.aluno_id == aluno_id, AlunoTurma.turma_id == turma.id)
        .first()
    )
    if not vinculo:
        raise HTTPException(404, "Aluno não está nesta turma")

    try:
        db.delete(vinculo)
        db.commit()
        return {"mensagem": "Aluno removido da turma"}
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao remover aluno.")

@router.delete("/{id}/exclusao-inteligente/{turma_id}", status_code=status.HTTP_200_OK)
def exclusao_inteligente(
    id: int,
    turma_id: int,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    """
    Exclusão inteligente:
    - Valida que a turma é do usuário.
    - Valida que o aluno está nesta turma.
    - Se o aluno pertence APENAS a esta turma (globalmente) → DELETE real.
    - Se pertence a outras turmas → apenas desvincula desta turma.
    """
    turma = _carregar_turma_do_usuario(turma_id, db, usuario_atual)

    aluno = (
        db.query(Aluno)
        .options(joinedload(Aluno.vinculos).joinedload(AlunoTurma.turma))
        .filter(Aluno.id == id)
        .first()
    )
    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")

    # Aluno precisa estar nesta turma
    if not any(v.turma_id == turma.id for v in aluno.vinculos):
        raise HTTPException(404, "Aluno não está nesta turma")

    # Aluno precisa ser visível para o usuário logado
    if not any(v.turma.user_id == usuario_atual.id for v in aluno.vinculos):
        raise HTTPException(404, "Aluno não encontrado")

    try:
        # Só existe nesta turma? → delete real
        if len(aluno.vinculos) == 1:
            db.delete(aluno)
            db.commit()
            return {
                "acao": "deletado",
                "mensagem": "Aluno excluído do sistema.",
            }

        # Existe em outras turmas → apenas desvincula
        vinculo = next(v for v in aluno.vinculos if v.turma_id == turma.id)
        db.delete(vinculo)
        db.commit()
        return {
            "acao": "desvinculado",
            "mensagem": "Aluno removido da turma (ainda existe em outras turmas).",
        }
    except Exception:
        db.rollback()
        raise HTTPException(500, "Erro ao processar exclusão.")