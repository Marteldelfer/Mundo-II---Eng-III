from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session, joinedload
import traceback # 👈 IMPORTANTE

from src.modelos.turma import Turma
from src.modelos.aluno_turma import AlunoTurma
from src.modelos.user import User
from src.utils.database import get_db
from src.utils.auth import get_current_user
from src.services.openai_service import chat_adaptado

router = APIRouter(prefix="/chat", tags=["Chat IA"])

class MensagemChat(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    mensagens: List[MensagemChat]
    turma_id: int
    aluno_id: int = None

@router.post("/")
def enviar_mensagem(
    req: ChatRequest,
    db: Session = Depends(get_db),
    usuario_atual: User = Depends(get_current_user),
):
    turma = db.query(Turma).filter(Turma.id == req.turma_id, Turma.user_id == usuario_atual.id).first()
    if not turma:
        raise HTTPException(404, "Turma não encontrada.")

    if req.aluno_id:
        vinculo = db.query(AlunoTurma).options(joinedload(AlunoTurma.aluno), joinedload(AlunoTurma.observacoes)).filter(
            AlunoTurma.aluno_id == req.aluno_id,
            AlunoTurma.turma_id == req.turma_id
        ).first()
        
        if not vinculo:
            raise HTTPException(404, "Aluno não encontrado nesta turma.")

        aluno = vinculo.aluno
        observacoes = "; ".join([o.texto for o in vinculo.observacoes])
        
        contexto = f"Aluno: {aluno.nome}. Deficiências: {aluno.deficiencias or 'Não informadas'}. "
        if observacoes:
            contexto += f"Observações do professor: {observacoes}. "
        contexto += f"Engajamento atual: {vinculo.engajamento}%."
        
        tipo_contexto = "aluno"
    else:
        contexto = f"Turma: {turma.nome} (Matéria: {turma.materia or 'Geral'}). Alunos:\n"
        for v in turma.vinculos:
            contexto += f"- {v.aluno.nome}: {v.aluno.deficiencias or 'Sem deficiência informada'}. Obs: {'; '.join([o.texto for o in v.observacoes]) or 'Nenhuma'}.\n"
        
        tipo_contexto = "turma"

    try:
        historico = [{"role": m.role, "content": m.content} for m in req.mensagens]
        resposta_texto = chat_adaptado(
            mensagens=historico,
            contexto_texto=contexto,
            tipo_contexto=tipo_contexto
        )
        return {"resposta": resposta_texto}
    except Exception as e:
        # 👈 ISSO VAI MOSTRAR O ERRO NO TERMINAL DO BACKEND
        print("\n--- ERRO NO CHAT ---")
        traceback.print_exc()
        print("--------------------\n")
        raise HTTPException(500, f"Erro no chat: {str(e)}")