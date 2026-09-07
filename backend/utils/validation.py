# Módulo para validação de dados
import re


def validEmail(email: str) -> list[str]:
    """Retorna lista de mensagens de error"""
    errors = []
    if not re.fullmatch(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        errors.append('Email inválido')
    return errors


def validPassword(password: str) -> list[str]:
    """Retorna lista de mensagens de error"""
    errors = []
    if not len(password) >= 8:
        errors.append('A senha deve ter pelo menos 8 caracteres')
    if not any(c.isupper() for c in password):
        errors.append('A senha deve ter pelo menos uma letra maiúscula')
    if not any(c.isdigit() for c in password):
        errors.append('A senha deve ter pelo menos um número')
    if not any(not c.isalnum() for c in password):
        errors.append('A senha deve ter pelo menos um caractere especial')

    return errors


def validName(name: str) -> list[str]:
    """Retorna lista de mensagens de error"""
    errors = []
    if not any(c.isdigit() for c in name) or not any(not c.isalnum() for c in name):
        errors.append('O nome não pode conter caracteres especiais ou números')
    if len(name) <= 0:
        errors.append('O nome é obrigatório')
    return errors
