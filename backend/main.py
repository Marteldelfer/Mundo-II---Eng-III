from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.utils.database import engine, Base
from src.modelos.user import *
from src.controllers.user_controller import router as user_router
from src.controllers.turma_controller import router as turma_router
from src.controllers.aluno_controller import router as aluno_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptEd")

# Libera o acesso para requisições vindas do frontend
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