"""
Fixtures compartilhadas para todos os testes.

Estratégia:
- Banco SQLite em memória (nunca toca o app.db real).
- Cada teste recebe um banco limpo.
- Cliente HTTP de teste do FastAPI (`TestClient`).
- Helpers para criar usuário, turma, aluno rapidamente.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.utils.database import Base, get_db
from src.modelos.user import User
from src.modelos.turma import Turma
from src.modelos.aluno import Aluno
from src.modelos.aluno_turma import AlunoTurma
from src.modelos.observacao import Observacao  # noqa: F401 (registra o modelo)

from src.utils.auth import gerar_hash_senha
from main import app


# ------------------------------------------------------------------
# Engine SQLite em memória, compartilhada entre todas as sessões
# do mesmo teste (StaticPool garante que todos usem a MESMA conexão)
# ------------------------------------------------------------------
@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    """Sessão SQLAlchemy para consultas diretas nos testes."""
    SessionLocal = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_engine, db_session):
    """
    TestClient do FastAPI com o banco de teste injetado.
    Substitui a dependência get_db do app pela sessão de teste.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # a fixture fecha

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ------------------------------------------------------------------
# Helpers para criar dados
# ------------------------------------------------------------------
@pytest.fixture()
def criar_usuario(db_session):
    """Factory que cria um usuário e retorna (User, senha_plana)."""
    def _criar(nome="Usuário Teste", email="teste@exemplo.com", senha="Senha@123"):
        user = User(
            nome=nome,
            email=email,
            senha_hash=gerar_hash_senha(senha),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user, senha
    return _criar


@pytest.fixture()
def login_como(client):
    """Faz login e retorna o token JWT."""
    def _login(email, senha):
        response = client.post(
            "/usuarios/login",
            json={"email": email, "senha": senha},
        )
        assert response.status_code == 200, response.text
        return response.json()["token"]
    return _login


@pytest.fixture()
def auth_headers():
    """Retorna headers de autenticação para um token."""
    def _headers(token):
        return {"Authorization": f"Bearer {token}"}
    return _headers


@pytest.fixture()
def criar_turma(client, auth_headers):
    """Cria uma turma via API e retorna o dict criado."""
    def _criar(token, nome="Matemática", materia="Mat", descricao="..."):
        response = client.post(
            "/turmas/",
            json={"nome": nome, "materia": materia, "descricao": descricao},
            headers=auth_headers(token),
        )
        assert response.status_code == 201, response.text
        return response.json()
    return _criar


@pytest.fixture()
def criar_aluno(client, auth_headers):
    """Cria um aluno via API e retorna o dict criado."""
    def _criar(token, turma_id, nome="João", deficiencias="TDAH"):
        response = client.post(
            "/alunos/",
            json={"nome": nome, "deficiencias": deficiencias, "turma_id": turma_id},
            headers=auth_headers(token),
        )
        assert response.status_code == 201, response.text
        return response.json()
    return _criar