from src.utils.validation import *
import pytest


def test_validar_email():
    """Teste unitário da função `validar_email` do módulo `validation`"""
    # email válido
    assert validar_email('email@gmail.com') == []
    # email inválido
    assert validar_email('email.gmail.com') == [MENSAGEM_EMAIL_INVALIDO]


def test_validar_senha():
    """Teste unitário da função `validar_senha` do módulo `validation`"""
    # senha válida
    assert validar_senha('Senha!23') == []
    # senha curta
    assert MENSAGEM_SENHA_CURTA in validar_senha('senha')
    # senha sem maiúscula
    assert MENSAGEM_SENHA_SEM_MAIUSCULA in validar_senha('senha')
    # senha sem número
    assert MENSAGEM_SENHA_SEM_NUMERO in validar_senha('senha')
    # senha sem caractere especial
    assert MENSAGEM_SENHA_SEM_CARACTERE_ESPECIAL in validar_senha('senha')


def test_validar_nome():
    """Teste unitário da função `validar_nome` do módulo `validation`"""
    # nome válido
    assert validar_nome('João da Silva') == []
    # nome vazio
    assert MENSAGEM_NOME_VAZIO in validar_nome('')
    # nome inválido
    assert MENSAGEM_NOME_INVALIDO in validar_nome('J040 d4 S1lv4') 
    
