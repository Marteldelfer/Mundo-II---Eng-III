from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from src.modelos.user import *
from src.utils.database import get_db
from src.utils.validation import *
import hashlib

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

def gerar_hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode("utf-8")).hexdigest()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(usuario: UserCreate, db: Session = Depends(get_db)):
    erros = []
    erros.extend(validar_nome(usuario.nome))
    erros.extend(validar_email(usuario.email))
    erros.extend(validar_senha(usuario.senha))

    if erros:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=erros
        )

    usuario_existente = db.query(User).filter(User.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=["Este e-mail já está cadastrado no sistema."]
        )

    senha_criptografada = gerar_hash_senha(usuario.senha)

    novo_usuario = User(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_criptografada
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@router.post("/login", status_code=status.HTTP_200_OK)
def login(dados_login: UserLogin, db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.email == dados_login.email).first()

    # se o usuário não existir, retorna erro de credenciais inválidas
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email não encontrado"
        )

    senha_hash_enviada = gerar_hash_senha(dados_login.senha)

    if usuario.senha_hash != senha_hash_enviada:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    return {
        "mensagem": "Login realizado com sucesso",
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email
        }
    }