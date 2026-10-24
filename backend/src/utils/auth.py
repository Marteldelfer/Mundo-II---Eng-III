"""
Módulo de autenticação JWT.
Responsável por gerar, verificar tokens e fornecer o usuário atual via Depends.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.modelos.user import User
from src.utils.database import get_db

# ---------- Configurações ----------
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # Fallback APENAS para desenvolvimento.
    # Em produção, defina SECRET_KEY no .env — se não estiver lá, o app avisa.
    SECRET_KEY = "dev-only-insecure-key-change-me"
    print(
        "⚠️  [auth.py] SECRET_KEY não encontrada no ambiente. "
        "Usando valor de desenvolvimento. NÃO USE EM PRODUÇÃO."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias

# ---------- Hash de senha ----------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt só aceita 72 BYTES. Truncamos em bytes (não em chars)
# porque caracteres UTF-8 podem ter múltiplos bytes.
BCRYPT_MAX_BYTES = 72


def _preparar_senha(senha: str) -> bytes:
    """
    Converte a senha em bytes e trunca em 72 bytes.
    Evita ValueError do bcrypt com senhas longas em Python 3.12+.
    """
    return senha.encode("utf-8")[:BCRYPT_MAX_BYTES]


def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Verifica se a senha plana corresponde ao hash."""
    return pwd_context.verify(_preparar_senha(senha_plana), senha_hash)


def gerar_hash_senha(senha: str) -> str:
    """Gera hash bcrypt da senha (truncada em 72 bytes)."""
    return pwd_context.hash(_preparar_senha(senha))


# ---------- JWT ----------
def criar_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT com os dados fornecidos.
    IMPORTANTE: a claim "sub" deve ser sempre STRING (RFC 7519).
    """
    to_encode = data.copy()

    # Garante que "sub" seja string, mesmo que o chamador passe int.
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str) -> Optional[dict]:
    """Decodifica e valida o token JWT. Retorna None se inválido."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ---------- Dependência para proteger endpoints ----------
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependência do FastAPI que extrai o token do header Authorization,
    valida e retorna o usuário correspondente.
    Lança 401 se o token for inválido ou ausente.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decodificar_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # "sub" vem como STRING (por causa da RFC). Convertemos para int.
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(User).filter(User.id == user_id).first()
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario