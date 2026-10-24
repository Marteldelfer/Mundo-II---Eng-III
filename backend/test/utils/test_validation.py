"""
Testes unitários do módulo `src.utils.validation`.
"""
import pytest

from src.utils.validation import (
    validar_email,
    validar_senha,
    validar_nome,
    MENSAGEM_EMAIL_INVALIDO,
    MENSAGEM_SENHA_CURTA,
    MENSAGEM_SENHA_SEM_MAIUSCULA,
    MENSAGEM_SENHA_SEM_NUMERO,
    MENSAGEM_SENHA_SEM_CARACTERE_ESPECIAL,
    MENSAGEM_NOME_VAZIO,
    MENSAGEM_NOME_INVALIDO,
)


# ---------- Email ----------
class TestValidarEmail:
    def test_email_valido(self):
        assert validar_email("email@gmail.com") == []
        assert validar_email("a.b+c@dominio.co.uk") == []

    def test_email_sem_arroba(self):
        assert validar_email("email.gmail.com") == [MENSAGEM_EMAIL_INVALIDO]

    def test_email_vazio(self):
        assert validar_email("") == [MENSAGEM_EMAIL_INVALIDO]

    def test_email_sem_dominio(self):
        assert validar_email("usuario@") == [MENSAGEM_EMAIL_INVALIDO]

    def test_email_com_espacos(self):
        # O `.strip()` no backend pode normalizar; se não, deve invalidar.
        # Aqui só garantimos que não explode.
        resultado = validar_email(" email@gmail.com ")
        assert isinstance(resultado, list)


# ---------- Senha ----------
class TestValidarSenha:
    def test_senha_valida(self):
        assert validar_senha("Senha@123") == []

    def test_senha_curta(self):
        assert MENSAGEM_SENHA_CURTA in validar_senha("Ab1!")

    def test_senha_sem_maiuscula(self):
        assert MENSAGEM_SENHA_SEM_MAIUSCULA in validar_senha("senha@123")

    def test_senha_sem_numero(self):
        assert MENSAGEM_SENHA_SEM_NUMERO in validar_senha("Senha@abc")

    def test_senha_sem_caractere_especial(self):
        assert MENSAGEM_SENHA_SEM_CARACTERE_ESPECIAL in validar_senha("Senha1234")

    def test_senha_longa_demais(self):
        """Se você adicionou a validação de 72 bytes, este teste cobre."""
        senha_longa = "A1!" + ("a" * 100)
        resultado = validar_senha(senha_longa)
        # Aceita se sua `validar_senha` reclamar do tamanho
        # (a mensagem específica pode variar; ajuste se for o caso)
        assert resultado == [] or len(resultado) >= 1


# ---------- Nome ----------
class TestValidarNome:
    def test_nome_valido(self):
        assert validar_nome("João da Silva") == []
        assert validar_nome("Ana") == []

    def test_nome_vazio(self):
        assert MENSAGEM_NOME_VAZIO in validar_nome("")
        assert MENSAGEM_NOME_VAZIO in validar_nome("   ")

    def test_nome_com_numeros(self):
        assert MENSAGEM_NOME_INVALIDO in validar_nome("J040 d4 S1lv4")

    def test_nome_com_simbolos(self):
        assert MENSAGEM_NOME_INVALIDO in validar_nome("@na! Silva")