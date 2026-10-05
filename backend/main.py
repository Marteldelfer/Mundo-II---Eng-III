from dotenv import load_dotenv

# ⚠️ PRIMEIRO de tudo: carrega variáveis de ambiente do .env
# Precisa vir ANTES de qualquer import do projeto que use os.getenv()
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.utils.database import engine, Base

# Importa TODOS os modelos para que o SQLAlchemy os conheça
# (senão o create_all não cria as tabelas correspondentes)
from src.modelos.user import *          # noqa: F401,F403
from src.modelos.turma import *         # noqa: F401,F403
from src.modelos.aluno import *         # noqa: F401,F403
from src.modelos.aluno_turma import *   # noqa: F401,F403  👈 FALTAVA ISSO
from src.modelos.observacao import *    # noqa: F401,F403

from src.controllers.user_controller import router as user_router
from src.controllers.turma_controller import router as turma_router
from src.controllers.aluno_controller import router as aluno_router
from src.controllers.observacao_controller import router as observacao_router

# Agora sim, cria as tabelas (todos os modelos já foram importados)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptEd")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(turma_router)
app.include_router(aluno_router)
app.include_router(observacao_router)