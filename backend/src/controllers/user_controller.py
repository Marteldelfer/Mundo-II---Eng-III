from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from src.modelos.user import *
from src.utils.database import get_db
from src.utils.validation import *
from src.utils.auth import gerar_hash_senha, verificar_senha, criar_access_token, get_current_user

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.post("/", response_model=UserResponseComToken, status_code=status.HTTP_201_CREATED)
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

    # ✅ sub como STRING (exigência da RFC 7519)
    token = criar_access_token(data={"sub": str(novo_usuario.id)})

    return {
        "id": novo_usuario.id,
        "nome": novo_usuario.nome,
        "email": novo_usuario.email,
        "token": token,
    }


@router.post("/login", status_code=status.HTTP_200_OK)
def login(dados_login: UserLogin, db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.email == dados_login.email).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email não encontrado"
        )

    if not verificar_senha(dados_login.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    # ✅ sub como STRING
    token = criar_access_token(data={"sub": str(usuario.id)})

    return {
        "mensagem": "Login realizado com sucesso",
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
        },
        "token": token,
    }


@router.get("/me", response_model=UserResponse)
def obter_usuario_atual(usuario_atual: User = Depends(get_current_user)):
    """Retorna o usuário autenticado com base no token."""
    return usuario_atual