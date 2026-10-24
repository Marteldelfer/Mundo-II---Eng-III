"""
Testes de integração dos endpoints do `aluno_controller`.
Cobrem: criação (com turma_id), listagem por turma, edição,
desvinculação e a EXCLUSÃO INTELIGENTE (só deleta se for a última turma).
"""
import pytest


@pytest.fixture()
def contexto(criar_usuario, login_como, auth_headers, criar_turma):
    """
    Prepara um cenário completo:
    - user_a (dono) com 2 turmas (turma1 e turma2)
    - user_b (intruso) com 1 turma
    """
    user_a, senha_a = criar_usuario(email="a@teste.com", nome="Ana")
    user_b, senha_b = criar_usuario(email="b@teste.com", nome="Bruno")

    token_a = login_como("a@teste.com", senha_a)
    token_b = login_como("b@teste.com", senha_b)

    turma1 = criar_turma(token_a, nome="Matemática")
    turma2 = criar_turma(token_a, nome="Português")
    turma_b = criar_turma(token_b, nome="História")

    return {
        "user_a": user_a,
        "user_b": user_b,
        "headers_a": auth_headers(token_a),
        "headers_b": auth_headers(token_b),
        "token_a": token_a,
        "token_b": token_b,
        "turma1": turma1,
        "turma2": turma2,
        "turma_b": turma_b,
    }


# ---------- CRIAR ----------
class TestCriarAluno:
    def test_criar_aluno_sem_token_retorna_401(self, client, contexto):
        response = client.post(
            "/alunos/",
            json={"nome": "João", "turma_id": contexto["turma1"]["id"]},
        )
        assert response.status_code == 401

    def test_criar_aluno_com_sucesso_retorna_201(self, client, contexto):
        response = client.post(
            "/alunos/",
            json={
                "nome": "João Silva",
                "deficiencias": "TDAH, Dislexia",
                "turma_id": contexto["turma1"]["id"],
            },
            headers=contexto["headers_a"],
        )
        assert response.status_code == 201
        body = response.json()
        assert body["nome"] == "João Silva"
        assert body["turma_id"] == contexto["turma1"]["id"]

    def test_criar_aluno_em_turma_de_outro_usuario_retorna_404(
        self, client, contexto
    ):
        """⚠️ SEGURANÇA: A não pode criar aluno na turma do B."""
        response = client.post(
            "/alunos/",
            json={"nome": "Invasor", "turma_id": contexto["turma_b"]["id"]},
            headers=contexto["headers_a"],
        )
        assert response.status_code == 404

    def test_criar_aluno_sem_nome_retorna_400(self, client, contexto):
        response = client.post(
            "/alunos/",
            json={"nome": "   ", "turma_id": contexto["turma1"]["id"]},
            headers=contexto["headers_a"],
        )
        assert response.status_code == 400


# ---------- LISTAR ----------
class TestListarAlunos:
    def test_listar_por_turma_retorna_alunos(self, client, contexto, criar_aluno):
        criar_aluno(contexto["token_a"], contexto["turma1"]["id"], nome="João")
        criar_aluno(contexto["token_a"], contexto["turma1"]["id"], nome="Maria")

        response = client.get(
            f"/alunos/turma/{contexto['turma1']['id']}",
            headers=contexto["headers_a"],
        )
        assert response.status_code == 200
        alunos = response.json()
        assert len(alunos) == 2
        assert {a["nome"] for a in alunos} == {"João", "Maria"}

    def test_listar_por_turma_de_outro_usuario_retorna_404(
        self, client, contexto
    ):
        """⚠️ SEGURANÇA."""
        response = client.get(
            f"/alunos/turma/{contexto['turma_b']['id']}",
            headers=contexto["headers_a"],
        )
        assert response.status_code == 404

    def test_listar_global_retorna_somente_alunos_do_usuario(
        self, client, contexto, criar_aluno
    ):
        criar_aluno(contexto["token_a"], contexto["turma1"]["id"], nome="Meu Aluno")
        criar_aluno(contexto["token_b"], contexto["turma_b"]["id"], nome="Aluno do B")

        response = client.get("/alunos/", headers=contexto["headers_a"])
        assert response.status_code == 200
        alunos = response.json()
        nomes = {a["nome"] for a in alunos}
        assert "Meu Aluno" in nomes
        assert "Aluno do B" not in nomes


# ---------- BUSCAR POR ID ----------
class TestBuscarAluno:
    def test_buscar_proprio_aluno_retorna_200(
        self, client, contexto, criar_aluno
    ):
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.get(f"/alunos/{aluno['id']}", headers=contexto["headers_a"])
        assert response.status_code == 200
        assert response.json()["nome"] == aluno["nome"]

    def test_buscar_aluno_de_outro_usuario_retorna_404(
        self, client, contexto, criar_aluno
    ):
        """⚠️ SEGURANÇA: aluno do B não é visível para A."""
        aluno_b = criar_aluno(contexto["token_b"], contexto["turma_b"]["id"])

        response = client.get(
            f"/alunos/{aluno_b['id']}", headers=contexto["headers_a"]
        )
        assert response.status_code == 404


# ---------- ATUALIZAR ----------
class TestAtualizarAluno:
    def test_atualizar_proprio_aluno_retorna_200(
        self, client, contexto, criar_aluno
    ):
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"], nome="Antigo")

        response = client.put(
            f"/alunos/{aluno['id']}",
            json={
                "turma_id": contexto["turma1"]["id"],
                "nome": "Novo Nome",
                "deficiencias": "Autismo",
            },
            headers=contexto["headers_a"],
        )
        assert response.status_code == 200
        assert response.json()["nome"] == "Novo Nome"

    def test_atualizar_com_turma_de_outro_usuario_retorna_404(
        self, client, contexto, criar_aluno
    ):
        """⚠️ SEGURANÇA: A não pode usar a turma do B como contexto."""
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.put(
            f"/alunos/{aluno['id']}",
            json={"turma_id": contexto["turma_b"]["id"], "nome": "Hackeado"},
            headers=contexto["headers_a"],
        )
        assert response.status_code == 404


# ---------- VINCULAR / DESVINCULAR ----------
class TestVincularDesvincular:
    def test_vincular_aluno_a_outra_turma_retorna_200(
        self, client, contexto, criar_aluno
    ):
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.post(
            f"/alunos/vincular/{contexto['turma2']['id']}",
            json={"aluno_id": aluno["id"]},
            headers=contexto["headers_a"],
        )
        assert response.status_code == 200

        # Confirma que agora está nas duas turmas
        response_t2 = client.get(
            f"/alunos/turma/{contexto['turma2']['id']}",
            headers=contexto["headers_a"],
        )
        ids = [a["id"] for a in response_t2.json()]
        assert aluno["id"] in ids

    def test_vincular_aluno_em_turma_de_outro_usuario_retorna_404(
        self, client, contexto, criar_aluno
    ):
        """⚠️ SEGURANÇA."""
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.post(
            f"/alunos/vincular/{contexto['turma_b']['id']}",
            json={"aluno_id": aluno["id"]},
            headers=contexto["headers_a"],
        )
        assert response.status_code == 404

    def test_desvincular_aluno_retorna_200(
        self, client, contexto, criar_aluno
    ):
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.delete(
            f"/alunos/desvincular/{contexto['turma1']['id']}/{aluno['id']}",
            headers=contexto["headers_a"],
        )
        assert response.status_code == 200

        # Confirma que saiu da turma
        response_t1 = client.get(
            f"/alunos/turma/{contexto['turma1']['id']}",
            headers=contexto["headers_a"],
        )
        assert aluno["id"] not in [a["id"] for a in response_t1.json()]


# ---------- EXCLUSÃO INTELIGENTE ----------
class TestExclusaoInteligente:
    def test_excluir_aluno_em_unica_turma_deleta_globalmente(
        self, client, contexto, criar_aluno
    ):
        """
        Aluno pertence só à turma1. Excluir → deve sumir do sistema.
        """
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.delete(
            f"/alunos/{aluno['id']}/exclusao-inteligente/{contexto['turma1']['id']}",
            headers=contexto["headers_a"],
        )
        assert response.status_code == 200
        assert response.json()["acao"] == "deletado"

        # Confirma que sumiu do sistema
        response_get = client.get(
            f"/alunos/{aluno['id']}", headers=contexto["headers_a"]
        )
        assert response_get.status_code == 404

    def test_excluir_aluno_em_multiplas_turmas_apenas_desvincula(
        self, client, contexto, criar_aluno
    ):
        """
        Aluno está nas duas turmas do A. Excluir pela turma1 →
        deve remover só da turma1, mantendo na turma2.
        """
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])
        # Vincula à turma2 também
        client.post(
            f"/alunos/vincular/{contexto['turma2']['id']}",
            json={"aluno_id": aluno["id"]},
            headers=contexto["headers_a"],
        )

        # Exclui pela turma1
        response = client.delete(
            f"/alunos/{aluno['id']}/exclusao-inteligente/{contexto['turma1']['id']}",
            headers=contexto["headers_a"],
        )
        assert response.status_code == 200
        assert response.json()["acao"] == "desvinculado"

        # Confirma que saiu da turma1
        response_t1 = client.get(
            f"/alunos/turma/{contexto['turma1']['id']}",
            headers=contexto["headers_a"],
        )
        assert aluno["id"] not in [a["id"] for a in response_t1.json()]

        # Mas continua na turma2
        response_t2 = client.get(
            f"/alunos/turma/{contexto['turma2']['id']}",
            headers=contexto["headers_a"],
        )
        assert aluno["id"] in [a["id"] for a in response_t2.json()]

    def test_excluir_aluno_de_turma_de_outro_usuario_retorna_404(
        self, client, contexto, criar_aluno
    ):
        """⚠️ SEGURANÇA: A não pode usar exclusão inteligente na turma do B."""
        aluno = criar_aluno(contexto["token_a"], contexto["turma1"]["id"])

        response = client.delete(
            f"/alunos/{aluno['id']}/exclusao-inteligente/{contexto['turma_b']['id']}",
            headers=contexto["headers_a"],
        )
        assert response.status_code == 404