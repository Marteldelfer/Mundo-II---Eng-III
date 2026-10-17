"""
Testes de integração dos endpoints do `turma_controller`.
Cobrem: criação, listagem, busca, atualização, deleção.
O foco é o ISOLAMENTO entre usuários (um usuário não vê/edita/deleta turma de outro).
"""
import pytest


# ---------- HELPERS ----------
@pytest.fixture()
def dois_usuarios(criar_usuario, login_como, auth_headers):
    """
    Retorna dois usuários logados:
    - user_a com token_a
    - user_b com token_b
    """
    user_a, senha_a = criar_usuario(email="a@teste.com", nome="Ana")
    user_b, senha_b = criar_usuario(email="b@teste.com", nome="Bruno")

    token_a = login_como("a@teste.com", senha_a)
    token_b = login_como("b@teste.com", senha_b)

    return {
        "user_a": user_a,
        "user_b": user_b,
        "token_a": token_a,
        "token_b": token_b,
        "headers_a": auth_headers(token_a),
        "headers_b": auth_headers(token_b),
    }


# ---------- CRIAR ----------
class TestCriarTurma:
    def test_criar_turma_sem_token_retorna_401(self, client):
        response = client.post(
            "/turmas/",
            json={"nome": "Matemática"},
        )
        assert response.status_code == 401

    def test_criar_turma_com_token_retorna_201(self, client, dois_usuarios):
        response = client.post(
            "/turmas/",
            json={
                "nome": "Matemática",
                "materia": "Mat",
                "descricao": "Turma de matemática",
            },
            headers=dois_usuarios["headers_a"],
        )
        assert response.status_code == 201
        body = response.json()
        assert body["nome"] == "Matemática"
        assert body["materia"] == "Mat"
        assert body["user_id"] == dois_usuarios["user_a"].id

    def test_criar_turma_sem_nome_retorna_400(self, client, dois_usuarios):
        response = client.post(
            "/turmas/",
            json={"nome": "   "},
            headers=dois_usuarios["headers_a"],
        )
        assert response.status_code == 400
        assert "obrigatório" in response.json()["detail"].lower()


# ---------- LISTAR ----------
class TestListarTurmas:
    def test_listar_sem_token_retorna_401(self, client):
        response = client.get("/turmas/")
        assert response.status_code == 401

    def test_listar_vazio_retorna_lista(self, client, dois_usuarios):
        response = client.get("/turmas/", headers=dois_usuarios["headers_a"])
        assert response.status_code == 200
        assert response.json() == []

    def test_listar_retorna_apenas_turmas_do_proprio_usuario(
        self, client, dois_usuarios, criar_turma
    ):
        # User A cria 2 turmas, User B cria 1
        criar_turma(dois_usuarios["token_a"], nome="Mat A")
        criar_turma(dois_usuarios["token_a"], nome="Port A")
        criar_turma(dois_usuarios["token_b"], nome="Mat B")

        # A vê só as 2 dele
        response_a = client.get("/turmas/", headers=dois_usuarios["headers_a"])
        assert response_a.status_code == 200
        turmas_a = response_a.json()
        assert len(turmas_a) == 2
        nomes_a = {t["nome"] for t in turmas_a}
        assert nomes_a == {"Mat A", "Port A"}

        # B vê só a dele
        response_b = client.get("/turmas/", headers=dois_usuarios["headers_b"])
        assert len(response_b.json()) == 1
        assert response_b.json()[0]["nome"] == "Mat B"


# ---------- BUSCAR POR ID ----------
class TestBuscarTurmaPorId:
    def test_buscar_propria_turma_retorna_200(self, client, dois_usuarios, criar_turma):
        turma = criar_turma(dois_usuarios["token_a"], nome="Minha Turma")

        response = client.get(f"/turmas/{turma['id']}", headers=dois_usuarios["headers_a"])
        assert response.status_code == 200
        assert response.json()["nome"] == "Minha Turma"

    def test_buscar_turma_de_outro_usuario_retorna_403(
        self, client, dois_usuarios, criar_turma
    ):
        """⚠️ SEGURANÇA: Usuário B não pode ver a turma do A."""
        turma_a = criar_turma(dois_usuarios["token_a"])

        response = client.get(
            f"/turmas/{turma_a['id']}",
            headers=dois_usuarios["headers_b"],
        )
        assert response.status_code == 403

    def test_buscar_turma_inexistente_retorna_404(self, client, dois_usuarios):
        response = client.get("/turmas/99999", headers=dois_usuarios["headers_a"])
        assert response.status_code == 404

    def test_buscar_sem_token_retorna_401(self, client, dois_usuarios, criar_turma):
        turma = criar_turma(dois_usuarios["token_a"])

        response = client.get(f"/turmas/{turma['id']}")
        assert response.status_code == 401


# ---------- ATUALIZAR ----------
class TestAtualizarTurma:
    def test_atualizar_propria_turma_retorna_200(
        self, client, dois_usuarios, criar_turma
    ):
        turma = criar_turma(dois_usuarios["token_a"], nome="Original")

        response = client.put(
            f"/turmas/{turma['id']}",
            json={"nome": "Atualizada", "materia": "Nova Mat"},
            headers=dois_usuarios["headers_a"],
        )
        assert response.status_code == 200
        body = response.json()
        assert body["nome"] == "Atualizada"
        assert body["materia"] == "Nova Mat"

    def test_atualizar_turma_de_outro_usuario_retorna_403(
        self, client, dois_usuarios, criar_turma
    ):
        """⚠️ SEGURANÇA: B não pode editar turma do A."""
        turma_a = criar_turma(dois_usuarios["token_a"], nome="Original")

        response = client.put(
            f"/turmas/{turma_a['id']}",
            json={"nome": "Hackeada"},
            headers=dois_usuarios["headers_b"],
        )
        assert response.status_code == 403

        # Confirma que NÃO foi alterada
        response_a = client.get(
            f"/turmas/{turma_a['id']}",
            headers=dois_usuarios["headers_a"],
        )
        assert response_a.json()["nome"] == "Original"

    def test_atualizar_turma_inexistente_retorna_404(self, client, dois_usuarios):
        response = client.put(
            "/turmas/99999",
            json={"nome": "Nova"},
            headers=dois_usuarios["headers_a"],
        )
        assert response.status_code == 404


# ---------- DELETAR ----------
class TestDeletarTurma:
    def test_deletar_propria_turma_retorna_200(
        self, client, dois_usuarios, criar_turma
    ):
        turma = criar_turma(dois_usuarios["token_a"])

        response = client.delete(
            f"/turmas/{turma['id']}",
            headers=dois_usuarios["headers_a"],
        )
        assert response.status_code == 200
        assert "deletada" in response.json()["mensagem"].lower()

        # Confirma que sumiu
        response_get = client.get(
            f"/turmas/{turma['id']}",
            headers=dois_usuarios["headers_a"],
        )
        assert response_get.status_code == 404

    def test_deletar_turma_de_outro_usuario_retorna_403(
        self, client, dois_usuarios, criar_turma
    ):
        """⚠️ SEGURANÇA: B não pode deletar turma do A."""
        turma_a = criar_turma(dois_usuarios["token_a"])

        response = client.delete(
            f"/turmas/{turma_a['id']}",
            headers=dois_usuarios["headers_b"],
        )
        assert response.status_code == 403

        # Confirma que AINDA existe
        response_a = client.get(
            f"/turmas/{turma_a['id']}",
            headers=dois_usuarios["headers_a"],
        )
        assert response_a.status_code == 200

    def test_deletar_turma_inexistente_retorna_404(self, client, dois_usuarios):
        response = client.delete("/turmas/99999", headers=dois_usuarios["headers_a"])
        assert response.status_code == 404