"""
Testes de integração dos endpoints do `user_controller`.
Cobrem: cadastro, login e /me, incluindo casos de falha e segurança.
"""
import pytest


# ---------- CADASTRO ----------
class TestCadastro:
    def test_cadastro_sucesso_retorna_201_e_token(self, client):
        response = client.post(
            "/usuarios/",
            json={
                "nome": "Maria Silva",
                "email": "maria@teste.com",
                "senha": "Senha@123",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["id"] == 1
        assert body["nome"] == "Maria Silva"
        assert body["email"] == "maria@teste.com"
        assert "token" in body
        assert isinstance(body["token"], str)
        assert len(body["token"]) > 50  # JWT é longo

    def test_cadastro_email_duplicado_retorna_400(self, client, criar_usuario):
        criar_usuario(email="maria@teste.com")

        response = client.post(
            "/usuarios/",
            json={
                "nome": "Outra Maria",
                "email": "maria@teste.com",
                "senha": "Senha@123",
            },
        )
        assert response.status_code == 400
        assert "cadastrado" in response.json()["detail"][0].lower()

    def test_cadastro_senha_fraca_retorna_400(self, client):
        response = client.post(
            "/usuarios/",
            json={
                "nome": "Maria Silva",
                "email": "maria@teste.com",
                "senha": "fraca",  # sem maiúscula, número, especial, curta
            },
        )
        assert response.status_code == 400
        # Deve ter múltiplas mensagens (curta, sem maiúscula, sem número, sem especial)
        detalhes = response.json()["detail"]
        assert len(detalhes) >= 3

    def test_cadastro_nome_vazio_retorna_400(self, client):
        response = client.post(
            "/usuarios/",
            json={
                "nome": "   ",  # apenas espaços
                "email": "maria@teste.com",
                "senha": "Senha@123",
            },
        )
        assert response.status_code == 400
        assert "obrigatório" in response.json()["detail"][0].lower()

    def test_cadastro_email_invalido_retorna_400(self, client):
        response = client.post(
            "/usuarios/",
            json={
                "nome": "Maria Silva",
                "email": "nao-e-email",
                "senha": "Senha@123",
            },
        )
        assert response.status_code == 400
        assert any("email" in d.lower() for d in response.json()["detail"])


# ---------- LOGIN ----------
class TestLogin:
    def test_login_sucesso_retorna_token_e_usuario(self, client, criar_usuario):
        user, senha = criar_usuario(email="maria@teste.com")

        response = client.post(
            "/usuarios/login",
            json={"email": "maria@teste.com", "senha": senha},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["mensagem"] == "Login realizado com sucesso"
        assert body["usuario"]["email"] == "maria@teste.com"
        assert body["usuario"]["nome"] == user.nome
        assert "token" in body

    def test_login_email_inexistente_retorna_401(self, client):
        response = client.post(
            "/usuarios/login",
            json={"email": "fantasma@teste.com", "senha": "Senha@123"},
        )
        assert response.status_code == 401
        assert "não encontrado" in response.json()["detail"].lower()

    def test_login_senha_errada_retorna_401(self, client, criar_usuario):
        criar_usuario(email="maria@teste.com")

        response = client.post(
            "/usuarios/login",
            json={"email": "maria@teste.com", "senha": "Errada@999"},
        )
        assert response.status_code == 401
        assert "incorretos" in response.json()["detail"].lower()


# ---------- /ME ----------
class TestMe:
    def test_me_com_token_valido_retorna_usuario(self, client, criar_usuario, login_como, auth_headers):
        user, senha = criar_usuario(email="maria@teste.com")
        token = login_como("maria@teste.com", senha)

        response = client.get("/usuarios/me", headers=auth_headers(token))
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == user.id
        assert body["email"] == "maria@teste.com"
        # Não deve vazar a senha_hash
        assert "senha_hash" not in body
        assert "senha" not in body

    def test_me_sem_token_retorna_401(self, client):
        response = client.get("/usuarios/me")
        assert response.status_code == 401

    def test_me_com_token_invalido_retorna_401(self, client):
        response = client.get(
            "/usuarios/me",
            headers={"Authorization": "Bearer token.invalido.aqui"},
        )
        assert response.status_code == 401

    def test_me_com_token_adulterado_retorna_401(self, client, criar_usuario, login_como, auth_headers):
        criar_usuario(email="maria@teste.com")
        token = login_como("maria@teste.com", "Senha@123")

        # Troca a assinatura
        token_ruim = token[:-10] + "AAAAAAAAAA"

        response = client.get("/usuarios/me", headers=auth_headers(token_ruim))
        assert response.status_code == 401