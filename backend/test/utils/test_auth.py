"""
Testes unitários do módulo `src.utils.auth`.
Cobrem: hash de senha, geração/validação de JWT.
"""
import pytest
from datetime import timedelta

from src.utils.auth import (
    gerar_hash_senha,
    verificar_senha,
    criar_access_token,
    decodificar_token,
    BCRYPT_MAX_BYTES,
)


# ---------- Hash de senha ----------
def test_gerar_hash_senha_diferente_da_senha_plana():
    """O hash NÃO deve ser a senha em texto puro."""
    senha = "Senha@123"
    hash_ = gerar_hash_senha(senha)
    assert hash_ != senha
    assert hash_.startswith("$2b$")  # prefixo bcrypt


def test_gerar_hash_senha_gera_hashes_diferentes():
    """Duas chamadas com a mesma senha geram hashes diferentes (salt)."""
    senha = "Senha@123"
    h1 = gerar_hash_senha(senha)
    h2 = gerar_hash_senha(senha)
    assert h1 != h2


def test_verificar_senha_correta():
    senha = "Senha@123"
    hash_ = gerar_hash_senha(senha)
    assert verificar_senha(senha, hash_) is True


def test_verificar_senha_incorreta():
    hash_ = gerar_hash_senha("Senha@123")
    assert verificar_senha("OutraSenha@456", hash_) is False


def test_verificar_senha_longa_nao_quebra():
    """Senhas > 72 bytes devem ser truncadas silenciosamente."""
    senha_longa = "A" * 200
    hash_ = gerar_hash_senha(senha_longa)
    # A verificação com a senha original funciona
    assert verificar_senha(senha_longa, hash_) is True
    # E a mesma senha truncada em 72 bytes também bate
    assert verificar_senha("A" * BCRYPT_MAX_BYTES, hash_) is True


def test_verificar_senha_com_emoji_nao_quebra():
    """Emoji ocupa 4 bytes em UTF-8; deve truncar sem quebrar."""
    senha = "🔐" * 30  # 120 bytes
    hash_ = gerar_hash_senha(senha)
    assert verificar_senha(senha, hash_) is True


# ---------- JWT ----------
def test_criar_e_decodificar_token():
    token = criar_access_token({"sub": "1"})
    payload = decodificar_token(token)
    assert payload is not None
    assert payload["sub"] == "1"
    assert "exp" in payload


def test_criar_token_forca_sub_string():
    """O auth.py força `sub` a ser string, mesmo que passem int."""
    token = criar_access_token({"sub": 42})
    payload = decodificar_token(token)
    assert payload["sub"] == "42"
    assert isinstance(payload["sub"], str)


def test_decodificar_token_invalido_retorna_none():
    assert decodificar_token("token.invalido.aqui") is None
    assert decodificar_token("") is None
    assert decodificar_token("abc") is None


def test_decodificar_token_assinatura_adulterada():
    token = criar_access_token({"sub": "1"})
    # Troca um caractere da assinatura
    token_adulterado = token[:-5] + "AAAAA"
    assert decodificar_token(token_adulterado) is None


def test_token_expirado_retorna_none():
    """Token com expiração no passado deve ser rejeitado."""
    token = criar_access_token(
        {"sub": "1"},
        expires_delta=timedelta(seconds=-1),
    )
    assert decodificar_token(token) is None