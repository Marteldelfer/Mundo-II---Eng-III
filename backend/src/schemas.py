from pydantic import BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    nome: str
    email: str
    senha: str  # sem hash

class UserResponse(BaseModel):
    id: int
    nome: str
    email: str
    model_config = ConfigDict(from_attributes=True)