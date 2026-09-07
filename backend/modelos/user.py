from dataclasses import dataclass

@dataclass
class User:
    id: int
    nome: str
    email: str
    senha: str