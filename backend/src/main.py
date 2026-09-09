import hashlib
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from src.database import engine, Base, SessionLocal
from src.modelos.user import User
from src.schemas import UserCreate, UserResponse
from src.utils.validation import validar_nome, validar_email, validar_senha
from src.schemas import UserCreate, UserResponse, UserLogin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Cadastro de Usuários")

# Libera o acesso para requisições vindas do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def gerar_hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode("utf-8")).hexdigest()


@app.post("/usuarios", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
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

@app.post("/login", status_code=status.HTTP_200_OK)
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