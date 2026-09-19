import io
import os
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel


load_dotenv()

MODELO_PADRAO = "gpt-5.6-luna"

INSTRUCOES_ANALISE_PLANO = """
Você é o assistente do AdaptEd responsável por analisar planos de ensino universitários.
Extraia somente informações que estejam presentes no documento enviado.

Retorne:
- nome: nome da turma ou da disciplina que possa ser usado como nome da turma no sistema;
- materia: nome da matéria/disciplina, quando estiver disponível;
- descricao: uma descrição curta da disciplina baseada no conteúdo do plano de ensino.

Regras obrigatórias:
1. Não invente informações.
2. Se não for possível identificar com segurança o nome da turma/disciplina, retorne nome como null.
3. Matéria e descrição são opcionais e devem ser null quando não puderem ser identificadas.
4. A descrição deve ser objetiva e baseada apenas no documento.
"""


class DadosTurmaIA(BaseModel):
    nome: Optional[str]
    materia: Optional[str]
    descricao: Optional[str]


def _limpar_texto(valor: Optional[str]) -> Optional[str]:
    if valor is None:
        return None

    valor = valor.strip()
    return valor if valor else None


def analisar_plano_ensino(
    conteudo: bytes,
    nome_arquivo: str,
) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY não está configurada")

    client = OpenAI(api_key=api_key)
    arquivo_openai = None

    arquivo_memoria = io.BytesIO(conteudo)
    arquivo_memoria.name = nome_arquivo

    try:
        arquivo_openai = client.files.create(
            file=arquivo_memoria,
            purpose="user_data",
        )

        resposta = client.responses.parse(
            model=os.getenv("OPENAI_MODEL", MODELO_PADRAO),
            instructions=INSTRUCOES_ANALISE_PLANO,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "file_id": arquivo_openai.id,
                        },
                        {
                            "type": "input_text",
                            "text": "Analise este plano de ensino e extraia os dados para o cadastro da turma.",
                        },
                    ],
                }
            ],
            text_format=DadosTurmaIA,
        )

        dados = resposta.output_parsed
        if dados is None:
            raise RuntimeError("A API não retornou dados estruturados para a turma")

        return {
            "nome": _limpar_texto(dados.nome),
            "materia": _limpar_texto(dados.materia),
            "descricao": _limpar_texto(dados.descricao),
        }
    finally:
        if arquivo_openai is not None:
            try:
                client.files.delete(arquivo_openai.id)
            except Exception:
                pass