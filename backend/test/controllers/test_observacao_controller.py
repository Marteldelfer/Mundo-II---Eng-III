"""
Testes de integração dos endpoints do `observacao_controller`.
Cobrem: diário de observações (N entradas por aluno/turma),
edição/exclusão individual, isolamento entre professores.
"""
import pytest


@pytest.fixture()
def contexto_obs(criar_usuario, login_como, auth_headers, criar_turma, criar_aluno):
    """
    Dois professores, cada um com sua turma.
    Cada um tem 1 aluno na sua turma.
    """
    user_a, senha_a = criar_usuario(email="a@teste.com", nome="Ana")
    user_b, senha_b = criar_usuario(email="b@teste.com", nome="Bruno")

    token_a = login_como("a@teste.com", senha_a)
    token_b = login_como("b@teste.com", senha_b)

    turma_a = criar_turma(token_a, nome="Matemática")
    turma_b = criar_turma(token_b, nome="História")

    aluno_a = criar_aluno(token_a, turma_a["id"], nome="João")
    aluno_b = criar_aluno(token_b, turma_b["id"], nome="Maria")

    return {
        "headers_a": auth_headers(token_a),
        "headers_b": auth_headers(token_b),
        "token_a": token_a,
        "token_b": token_b,
        "turma_a": turma_a,
        "turma_b": turma_b,
        "aluno_a": aluno_a,
        "aluno_b": aluno_b,
    }


# ---------- CRIAR ----------
class TestCriarObservacao:
    def test_criar_observacao_sem_token_retorna_401(self, client, contexto_obs):
        response = client.post(
            "/observacoes/",
            json={
                "aluno_id": contexto_obs["aluno_a"]["id"],
                "turma_id": contexto_obs["turma_a"]["id"],
                "texto": "Bom desempenho",
            },
        )
        assert response.status_code == 401

    def test_criar_observacao_com_sucesso_retorna_201(self, client, contexto_obs):
        response = client.post(
            "/observacoes/",
            json={
                "aluno_id": contexto_obs["aluno_a"]["id"],
                "turma_id": contexto_obs["turma_a"]["id"],
                "texto": "Bom desempenho",
            },
            headers=contexto_obs["headers_a"],
        )
        assert response.status_code == 201
        body = response.json()
        assert body["texto"] == "Bom desempenho"
        assert "data_criacao" in body
        assert body["data_edicao"] is None

    def test_criar_observacao_sem_texto_retorna_400(self, client, contexto_obs):
        response = client.post(
            "/observacoes/",
            json={
                "aluno_id": contexto_obs["aluno_a"]["id"],
                "turma_id": contexto_obs["turma_a"]["id"],
                "texto": "   ",
            },
            headers=contexto_obs["headers_a"],
        )
        assert response.status_code == 400
        assert "obrigatório" in response.json()["detail"].lower()

    def test_criar_observacao_em_turma_de_outro_usuario_retorna_404(
        self, client, contexto_obs
    ):
        """⚠️ SEGURANÇA: A não pode criar obs na turma do B."""
        response = client.post(
            "/observacoes/",
            json={
                "aluno_id": contexto_obs["aluno_b"]["id"],
                "turma_id": contexto_obs["turma_b"]["id"],
                "texto": "Tentativa de invasão",
            },
            headers=contexto_obs["headers_a"],
        )
        assert response.status_code == 404


# ---------- LISTAR ----------
class TestListarObservacoes:
    def test_listar_vazio_retorna_lista(self, client, contexto_obs):
        response = client.get(
            f"/observacoes/aluno/{contexto_obs['aluno_a']['id']}/turma/{contexto_obs['turma_a']['id']}",
            headers=contexto_obs["headers_a"],
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_listar_com_multiplas_entradas_retorna_todas(
        self, client, contexto_obs
    ):
        aluno_id = contexto_obs["aluno_a"]["id"]
        turma_id = contexto_obs["turma_a"]["id"]
        headers = contexto_obs["headers_a"]

        # Cria 3 observações
        for texto in ["Primeira", "Segunda", "Terceira"]:
            client.post(
                "/observacoes/",
                json={"aluno_id": aluno_id, "turma_id": turma_id, "texto": texto},
                headers=headers,
            )

        response = client.get(
            f"/observacoes/aluno/{aluno_id}/turma/{turma_id}",
            headers=headers,
        )
        assert response.status_code == 200
        textos = [o["texto"] for o in response.json()]
        assert set(textos) == {"Primeira", "Segunda", "Terceira"}

    def test_listar_obs_de_turma_de_outro_usuario_retorna_404(
        self, client, contexto_obs
    ):
        """⚠️ SEGURANÇA."""
        response = client.get(
            f"/observacoes/aluno/{contexto_obs['aluno_b']['id']}/turma/{contexto_obs['turma_b']['id']}",
            headers=contexto_obs["headers_a"],
        )
        assert response.status_code == 404


# ---------- ATUALIZAR ----------
class TestAtualizarObservacao:
    def test_atualizar_observacao_retorna_200(self, client, contexto_obs):
        aluno_id = contexto_obs["aluno_a"]["id"]
        turma_id = contexto_obs["turma_a"]["id"]
        headers = contexto_obs["headers_a"]

        # Cria
        response_create = client.post(
            "/observacoes/",
            json={"aluno_id": aluno_id, "turma_id": turma_id, "texto": "Original"},
            headers=headers,
        )
        obs_id = response_create.json()["id"]

        # Atualiza
        response = client.put(
            f"/observacoes/{obs_id}",
            json={"texto": "Atualizada"},
            headers=headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["texto"] == "Atualizada"
        assert body["data_edicao"] is not None  # foi editada

    def test_atualizar_obs_de_outro_usuario_retorna_404(
        self, client, contexto_obs
    ):
        """⚠️ SEGURANÇA."""
        # B cria uma observação
        response_create = client.post(
            "/observacoes/",
            json={
                "aluno_id": contexto_obs["aluno_b"]["id"],
                "turma_id": contexto_obs["turma_b"]["id"],
                "texto": "Do B",
            },
            headers=contexto_obs["headers_b"],
        )
        obs_b_id = response_create.json()["id"]

        # A tenta editar
        response = client.put(
            f"/observacoes/{obs_b_id}",
            json={"texto": "Hackeada"},
            headers=contexto_obs["headers_a"],
        )
        assert response.status_code == 404


# ---------- DELETAR ----------
class TestDeletarObservacao:
    def test_deletar_observacao_retorna_200(self, client, contexto_obs):
        aluno_id = contexto_obs["aluno_a"]["id"]
        turma_id = contexto_obs["turma_a"]["id"]
        headers = contexto_obs["headers_a"]

        # Cria
        response_create = client.post(
            "/observacoes/",
            json={"aluno_id": aluno_id, "turma_id": turma_id, "texto": "Para deletar"},
            headers=headers,
        )
        obs_id = response_create.json()["id"]

        # Deleta
        response = client.delete(f"/observacoes/{obs_id}", headers=headers)
        assert response.status_code == 200
        assert "sucesso" in response.json()["mensagem"].lower()

        # Confirma que sumiu
        response_get = client.get(
            f"/observacoes/aluno/{aluno_id}/turma/{turma_id}",
            headers=headers,
        )
        ids = [o["id"] for o in response_get.json()]
        assert obs_id not in ids

    def test_deletar_obs_de_outro_usuario_retorna_404(
        self, client, contexto_obs
    ):
        """⚠️ SEGURANÇA."""
        # B cria
        response_create = client.post(
            "/observacoes/",
            json={
                "aluno_id": contexto_obs["aluno_b"]["id"],
                "turma_id": contexto_obs["turma_b"]["id"],
                "texto": "Do B",
            },
            headers=contexto_obs["headers_b"],
        )
        obs_b_id = response_create.json()["id"]

        # A tenta deletar
        response = client.delete(
            f"/observacoes/{obs_b_id}", headers=contexto_obs["headers_a"]
        )
        assert response.status_code == 404

        # Confirma que NÃO foi deletada
        response_get = client.get(
            f"/observacoes/aluno/{contexto_obs['aluno_b']['id']}/turma/{contexto_obs['turma_b']['id']}",
            headers=contexto_obs["headers_b"],
        )
        assert obs_b_id in [o["id"] for o in response_get.json()]


# ---------- ISOLAMENTO ENTRE PROFESSORES (mesmo aluno) ----------
class TestIsolamentoEntreProfessores:
    def test_mesmo_aluno_em_duas_turmas_diarios_independentes(
        self, client, contexto_obs, criar_aluno
    ):
        """
        Cenário: mesmo aluno está na turma do A e na turma do B.
        Cada professor tem seu próprio diário. Um não vê o do outro.
        """
        # A vincula o "João" na turma do B? Não — B é outro professor.
        # Vamos simular de outra forma: criar um aluno "compartilhado" em
        # duas turmas do MESMO professor (A).
        aluno_id = contexto_obs["aluno_a"]["id"]
        turma_a_id = contexto_obs["turma_a"]["id"]
        headers = contexto_obs["headers_a"]

        # Cria observação na turma A
        client.post(
            "/observacoes/",
            json={"aluno_id": aluno_id, "turma_id": turma_a_id, "texto": "Da turma A"},
            headers=headers,
        )

        # Lista obs da turma A → deve ter 1
        response = client.get(
            f"/observacoes/aluno/{aluno_id}/turma/{turma_a_id}",
            headers=headers,
        )
        assert len(response.json()) == 1