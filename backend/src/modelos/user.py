from sqlalchemy import Column, Integer, String
from src.utils.database import Base
from pydantic import BaseModel, ConfigDict

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

class UserCreate(BaseModel):
    nome: str
    email: str
    senha: str  # sem hash

class UserResponse(BaseModel):
    id: int
    nome: str
    email: str
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: str
    senha: str