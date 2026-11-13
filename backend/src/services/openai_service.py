import io
import os
from typing import List, Optional

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel


load_dotenv()

MODELO_PADRAO = "gpt-5.6-luna"

# ==========================================
# INSTRUÇÕES PARA PLANOS E LISTAS PCD
# ==========================================
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

INSTRUCOES_LISTA_PCD = """
Você é o assistente do AdaptEd responsável por extrair alunos de uma lista de alunos PCD.
Extraia os alunos presentes no documento enviado.
Retorne uma lista de objetos, cada um com:
- nome: nome completo do aluno (obrigatório)
- deficiencias: lista de deficiências do aluno (pode ser vazia)

Regras obrigatórias:
- Não invente alunos que não estejam no documento.
- Se não houver alunos, retorne uma lista vazia.
- O campo deficiencias deve ser uma lista de strings.
"""

# ==========================================
# INSTRUÇÕES PARA ATIVIDADES
# ==========================================
INSTRUCOES_ANALISE_ATIVIDADE = """
Você é o assistente do AdaptEd. Analise a atividade enviada e sugira melhorias de acessibilidade e adaptação.
Considere as deficiências e observações fornecidas no contexto.

Retorne uma lista de strings, onde cada string é uma sugestão clara, acionável e específica.
Exemplo de sugestões: "Aumentar o tamanho da fonte para 14pt", "Simplificar o enunciado da questão 3", "Adicionar descrição textual para a imagem da questão 1".
"""

INSTRUCOES_ADAPTAR_ATIVIDADE = """
Você é o assistente do AdaptEd. Adapte a atividade enviada com base nas melhorias aprovadas e nas notas do professor.
Reescreva o conteúdo da atividade de forma acessível e inclusiva, aplicando estritamente as melhorias solicitadas.

Retorne o texto completo da atividade adaptada, pronto para ser salvo em um arquivo de texto. 
Mantenha o formato original o máximo possível, mas garanta que as adaptações sejam aplicadas.
"""

# ==========================================
# INSTRUÇÕES PARA O CHAT
# ==========================================
INSTRUCOES_CHAT_TURMA = """
Você é o AdaptEd AI, um assistente pedagógico especializado em educação inclusiva.
Você está ajudando um professor com a turma: {contexto}.
Use as informações de deficiências e observações fornecidas para dar dicas práticas, sugira adaptações de materiais, avaliações e dinâmicas de sala de aula. Seja direto, empático e prático.
"""

INSTRUCOES_CHAT_ALUNO = """
Você é o AdaptEd AI, um assistente pedagógico especializado em educação inclusiva.
Você está ajudando um professor com um aluno específico: {contexto}.
Use as informações de deficiências e observações fornecidas para dar dicas personalizadas. Seja empático, prático e foque em estratégias que funcionem para este aluno.
"""

# ==========================================
# MODELOS PYDANTIC
# ==========================================
class DadosTurmaIA(BaseModel):
    nome: Optional[str]
    materia: Optional[str]
    descricao: Optional[str]


class AlunoPCD(BaseModel):
    nome: str
    deficiencias: Optional[List[str]] = []


class ListaAlunosPCD(BaseModel):
    alunos: List[AlunoPCD]


class SugestoesAtividade(BaseModel):
    melhorias: List[str]


# ==========================================
# FUNÇÕES UTILITÁRIAS
# ==========================================
def _limpar_texto(valor: Optional[str]) -> Optional[str]:
    if valor is None:
        return None
    valor = valor.strip()
    return valor if valor else None


def _criar_cliente_openai() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY não está configurada")
    return OpenAI(api_key=api_key)


# ==========================================
# FUNÇÕES DE PLANO E PCD
# ==========================================
def analisar_plano_ensino(
    conteudo: bytes,
    nome_arquivo: str,
) -> dict:
    client = _criar_cliente_openai()
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


def analisar_lista_pcd(
    conteudo: bytes,
    nome_arquivo: str,
) -> dict:
    client = _criar_cliente_openai()
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
            instructions=INSTRUCOES_LISTA_PCD,
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
                            "text": "Extraia a lista de alunos PCD deste documento.",
                        },
                    ],
                }
            ],
            text_format=ListaAlunosPCD,
        )

        dados = resposta.output_parsed
        if dados is None:
            raise RuntimeError("A API não retornou dados estruturados")

        return {
            "alunos": [
                {
                    "nome": aluno.nome.strip(),
                    "deficiencias": aluno.deficiencias or [],
                }
                for aluno in dados.alunos
                if aluno.nome and aluno.nome.strip()
            ]
        }
    finally:
        if arquivo_openai is not None:
            try:
                client.files.delete(arquivo_openai.id)
            except Exception:
                pass


# ==========================================
# FUNÇÕES DE ATIVIDADES
# ==========================================
def analisar_atividade(
    conteudo: bytes,
    nome_arquivo: str,
    deficiencias: List[str],
    observacoes: List[str],
) -> dict:
    client = _criar_cliente_openai()
    arquivo_openai = None
    arquivo_memoria = io.BytesIO(conteudo)
    arquivo_memoria.name = nome_arquivo

    contexto = f"Deficiências: {', '.join(deficiencias) if deficiencias else 'Nenhuma'}.\n"
    contexto += f"Observações: {'; '.join(observacoes) if observacoes else 'Nenhuma'}."

    try:
        arquivo_openai = client.files.create(file=arquivo_memoria, purpose="user_data")
        resposta = client.responses.parse(
            model=os.getenv("OPENAI_MODEL", MODELO_PADRAO),
            instructions=INSTRUCOES_ANALISE_ATIVIDADE,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_file", "file_id": arquivo_openai.id},
                        {"type": "input_text", "text": f"Analise esta atividade.\n{contexto}"},
                    ],
                }
            ],
            text_format=SugestoesAtividade,
        )
        dados = resposta.output_parsed
        return {"melhorias": dados.melhorias if dados else []}
    finally:
        if arquivo_openai:
            try:
                client.files.delete(arquivo_openai.id)
            except Exception:
                pass


def adaptar_atividade(
    conteudo: bytes,
    nome_arquivo: str,
    deficiencias: List[str],
    melhorias_aprovadas: List[str],
    notas_usuario: str,
) -> str:
    client = _criar_cliente_openai()
    arquivo_openai = None
    arquivo_memoria = io.BytesIO(conteudo)
    arquivo_memoria.name = nome_arquivo

    contexto = f"Deficiências: {', '.join(deficiencias) if deficiencias else 'Nenhuma'}.\n"
    contexto += f"Melhorias aprovadas:\n- " + "\n- ".join(melhorias_aprovadas) + "\n"
    contexto += f"Notas do professor: {notas_usuario or 'Nenhuma'}."

    try:
        arquivo_openai = client.files.create(file=arquivo_memoria, purpose="user_data")
        resposta = client.responses.create(
            model=os.getenv("OPENAI_MODEL", MODELO_PADRAO),
            instructions=INSTRUCOES_ADAPTAR_ATIVIDADE,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_file", "file_id": arquivo_openai.id},
                        {"type": "input_text", "text": f"Adapte esta atividade.\n{contexto}"},
                    ],
                }
            ],
        )
        return resposta.output_text
    finally:
        if arquivo_openai:
            try:
                client.files.delete(arquivo_openai.id)
            except Exception:
                pass

# ==========================================
# INSTRUÇÕES E FUNÇÃO PARA O CHAT
# ==========================================

def chat_adaptado(
    mensagens: List[dict], # [{"role": "user", "content": "..."}]
    contexto_texto: str,
    tipo_contexto: str = "turma", # "turma" ou "aluno"
) -> str:
    client = _criar_cliente_openai()
    
    instrucao_base = INSTRUCOES_CHAT_TURMA if tipo_contexto == "turma" else INSTRUCOES_CHAT_ALUNO
    instrucao_final = instrucao_base.format(contexto=contexto_texto)

    try:
        resposta = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", MODELO_PADRAO),
            messages=[
                {"role": "system", "content": instrucao_final},
                *mensagens
            ],
        )
        return resposta.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Erro no chat: {str(e)}")