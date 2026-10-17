'''Módulo para validação de campos'''
import re

MENSAGEM_EMAIL_INVALIDO = 'Email inválido'

MENSAGEM_SENHA_CURTA = 'A senha deve ter pelo menos 8 caracteres'
MENSAGEM_SENHA_SEM_MAIUSCULA = 'A senha deve ter pelo menos uma letra maiúscula'
MENSAGEM_SENHA_SEM_NUMERO = 'A senha deve ter pelo menos um número'
MENSAGEM_SENHA_SEM_CARACTERE_ESPECIAL = 'A senha deve ter pelo menos um caractere especial'

MENSAGEM_NOME_INVALIDO = 'O nome não pode conter caracteres especiais ou números'
MENSAGEM_NOME_VAZIO = 'O nome é obrigatório'


def validar_email(email: str) -> list[str]:
    """Retorna lista de mensagens de erro."""
    errors = []
    if not email or not re.fullmatch(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        email,
    ):
        errors.append(MENSAGEM_EMAIL_INVALIDO)
    return errors


def validar_senha(senha: str) -> list[str]:
    """Retorna lista de mensagens de erro."""
    errors = []
    senha = senha or ""  # proteção contra None

    if len(senha) < 8:
        errors.append(MENSAGEM_SENHA_CURTA)
    if not any(c.isupper() for c in senha):
        errors.append(MENSAGEM_SENHA_SEM_MAIUSCULA)
    if not any(c.isdigit() for c in senha):
        errors.append(MENSAGEM_SENHA_SEM_NUMERO)
    if not any(not c.isalnum() for c in senha):
        errors.append(MENSAGEM_SENHA_SEM_CARACTERE_ESPECIAL)

    return errors


def validar_nome(nome: str) -> list[str]:
    """Retorna lista de mensagens de erro."""
    errors = []
    nome_limpo = (nome or "").strip()   # 👈 normaliza primeiro

    if len(nome_limpo) == 0:
        errors.append(MENSAGEM_NOME_VAZIO)
    elif any(c.isdigit() for c in nome_limpo) or any(
        not c.isalnum() and c != ' ' for c in nome_limpo
    ):
        errors.append(MENSAGEM_NOME_INVALIDO)

    return errors