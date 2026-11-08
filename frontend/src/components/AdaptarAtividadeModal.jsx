import { useState } from 'react';
import Modal from './Modal';
import Icone from './Icone';
import { headersAuthUpload } from '../utils/auth';

const EXTENSOES_PERMITIDAS = ['txt', 'pdf', 'pptx', 'docx'];
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB
const MENSAGEM_ERRO_INTERNO = 'Ocorreu um erro interno. Tente novamente mais tarde';

function extrairListaDeficiencias(valor) {
  if (Array.isArray(valor)) return valor.filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) {
    return valor
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  }
  return [];
}

function gerarSugestoesContextualizadas(deficiencias = [], observacoes = []) {
  const sugestoes = [];
  const defsLower = deficiencias.map((d) => d.toLowerCase());

  if (defsLower.some((d) => d.includes('visual') || d.includes('baixa visão') || d.includes('cegueira'))) {
    sugestoes.push(
      'Adicionar descrições textuais detalhadas (texto alternativo) para imagens, gráficos e tabelas.',
      'Ampliar o corpo da fonte (mínimo 14pt) e aumentar o espaçamento entre linhas e parágrafos.'
    );
  }
  if (defsLower.some((d) => d.includes('tdah') || d.includes('atenção') || d.includes('hiperatividade'))) {
    sugestoes.push(
      'Fragmentar enunciados longos em etapas curtas e numeradas com instruções diretas.',
      'Destacar palavras-chave e comandos principais das questões em negrito.'
    );
  }
  if (defsLower.some((d) => d.includes('dislexia'))) {
    sugestoes.push(
      'Simplificar a estrutura sintática dos enunciados, evitando frases na voz passiva ou ambiguidades.',
      'Utilizar alinhamento à esquerda e blocos visuais bem delimitados para facilitar a leitura.'
    );
  }
  if (defsLower.some((d) => d.includes('autismo') || d.includes('tea'))) {
    sugestoes.push(
      'Substituir expressões figuradas ou metafóricas por linguagem objetiva e literal.',
      'Incluir um exemplo resolvido no início da atividade para tornar o formato esperado previsível.'
    );
  }
  if (defsLower.some((d) => d.includes('auditiva') || d.includes('surdez'))) {
    sugestoes.push(
      'Reforçar instruções com apoios visuais, esquemas ou glossário de termos técnicos.'
    );
  }
  if (defsLower.some((d) => d.includes('intelectual'))) {
    sugestoes.push(
      'Reduzir a quantidade de informações simultâneas por questão e oferecer apoio conceitual passo a passo.'
    );
  }
  if (defsLower.some((d) => d.includes('física') || d.includes('motora'))) {
    sugestoes.push(
      'Adaptar questões discursivas extensas para formatos objetivos ou respostas tópicas que exijam menor esforço motor.'
    );
  }

  if (observacoes.length > 0) {
    const ultimaObs = observacoes[0]?.texto;
    if (ultimaObs) {
      const resumoObs = ultimaObs.length > 80 ? `${ultimaObs.slice(0, 80)}...` : ultimaObs;
      sugestoes.push(
        `Considerar anotação do professor ("${resumoObs}") para adequar o nível de suporte e tempo da atividade.`
      );
    }
  }

  if (sugestoes.length === 0) {
    sugestoes.push(
      'Tornar os enunciados mais objetivos e dividir questões complexas em etapas menores.',
      'Destacar os conceitos principais e adicionar orientações passo a passo para resolução.',
      'Adequar a formatação visual com espaçamento ampliado para facilitar a leitura e compreensão.'
    );
  }

  return sugestoes;
}

function gerarSugestoesTurmaContextualizadas(alunosTurma = []) {
  const todasDeficiencias = [];
  const sugestoesPorAluno = [];

  alunosTurma.forEach((alunoItem) => {
    const defs = extrairListaDeficiencias(alunoItem.deficiencias);
    defs.forEach((d) => {
      if (!todasDeficiencias.includes(d)) todasDeficiencias.push(d);
    });

    const obsAluno = Array.isArray(alunoItem.observacoes_lista)
      ? alunoItem.observacoes_lista
      : [];
    if (obsAluno.length > 0 && obsAluno[0]?.texto) {
      const textoObs = obsAluno[0].texto;
      const resumo = textoObs.length > 70 ? `${textoObs.slice(0, 70)}...` : textoObs;
      sugestoesPorAluno.push(
        `Considerar anotação sobre ${alunoItem.nome} ("${resumo}") na estruturação dos exercícios.`
      );
    } else if (typeof alunoItem.observacoes === 'string' && alunoItem.observacoes.trim()) {
      const textoObs = alunoItem.observacoes.trim();
      const resumo = textoObs.length > 70 ? `${textoObs.slice(0, 70)}...` : textoObs;
      sugestoesPorAluno.push(
        `Considerar anotação sobre ${alunoItem.nome} ("${resumo}") na estruturação dos exercícios.`
      );
    }
  });

  const sugestoesBase = gerarSugestoesContextualizadas(todasDeficiencias, []);
  return [...sugestoesBase, ...sugestoesPorAluno];
}

async function baixarArquivoAutenticado(url, nomeArquivo) {
  if (!url) return;
  try {
    if (url.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo || 'atividade_adaptada';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const response = await fetch(url, { headers: headersAuthUpload() });
    if (!response.ok) throw new Error('Falha ao baixar o arquivo');

    const blob = await response.blob();
    const urlBlob = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = nomeArquivo || 'atividade_adaptada';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error('Erro no download:', error);
    alert('Ocorreu um erro ao baixar o arquivo. Tente novamente.');
  }
}

export default function AdaptarAtividadeModal({
  aluno = null,
  turma = null,
  turmaId = null,
  deficiencias = [],
  observacoes = [],
  alunosTurma = [],
  onClose,
  onAtividadeAdaptada,
}) {
  const modoTurma = Boolean(turma && !aluno);
  const idTurmaFinal = turma?.id || turmaId;
  const nomeAlvo = modoTurma ? turma?.nome || 'a turma' : aluno?.nome || 'o aluno';

  const deficienciasColetivas = modoTurma
    ? Array.from(
        new Set(
          alunosTurma.flatMap((a) => extrairListaDeficiencias(a.deficiencias))
        )
      )
    : deficiencias;

  const [arquivo, setArquivo] = useState(null);
  const [erroArquivo, setErroArquivo] = useState('');
  const [erroInterno, setErroInterno] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [melhoriasSugeridas, setMelhoriasSugeridas] = useState([]);
  const [melhoriasAprovadas, setMelhoriasAprovadas] = useState([]);
  const [notasUsuario, setNotasUsuario] = useState('');
  const [adaptando, setAdaptando] = useState(false);
  const [atividadeGerada, setAtividadeGerada] = useState(null);
  const [formatoSaida, setFormatoSaida] = useState('docx'); // 'docx' ou 'txt'

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const obterSugestoesFallback = () => {
    if (modoTurma) {
      return gerarSugestoesTurmaContextualizadas(alunosTurma);
    }
    return gerarSugestoesContextualizadas(deficiencias, observacoes);
  };

  const analisarArquivo = async (arquivoSelecionado) => {
    setAnalisando(true);
    setErroInterno('');
    setMelhoriasSugeridas([]);
    setMelhoriasAprovadas([]);
    setAtividadeGerada(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoSelecionado);
      if (aluno?.id) formData.append('aluno_id', String(aluno.id));
      if (idTurmaFinal) formData.append('turma_id', String(idTurmaFinal));

      const urlAnalise = modoTurma
        ? `http://127.0.0.1:8000/atividades/turma/${idTurmaFinal}/analisar`
        : 'http://127.0.0.1:8000/atividades/analisar';

      const response = await fetch(urlAnalise, {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });

      if (response.status === 404) {
        const sugestoesFallback = obterSugestoesFallback();
        setMelhoriasSugeridas(sugestoesFallback);
        setMelhoriasAprovadas(sugestoesFallback);
        return;
      }

      if (!response.ok) throw new Error(MENSAGEM_ERRO_INTERNO);

      const dados = await response.json();
      const lista = Array.isArray(dados?.melhorias) ? dados.melhorias : [];
      const normalizadas = lista.filter(Boolean);

      const resultadoFinal = normalizadas.length > 0 ? normalizadas : obterSugestoesFallback();
      setMelhoriasSugeridas(resultadoFinal);
      setMelhoriasAprovadas(resultadoFinal);
    } catch {
      setErroInterno(MENSAGEM_ERRO_INTERNO);
    } finally {
      setAnalisando(false);
    }
  };

  const handleSelecionarArquivo = (e) => {
    const selecionado = e.target.files?.[0] || null;
    setErroArquivo('');
    setErroInterno('');
    setMelhoriasSugeridas([]);
    setMelhoriasAprovadas([]);
    setAtividadeGerada(null);

    if (!selecionado) {
      setArquivo(null);
      return;
    }

    const partes = selecionado.name.split('.');
    const extensao = partes.length > 1 ? partes.pop().toLowerCase() : '';

    if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
      setArquivo(null);
      setErroArquivo('Formato inválido. Envie TXT, PDF, PPTX ou DOCX.');
      e.target.value = '';
      return;
    }

    if (selecionado.size > TAMANHO_MAXIMO_BYTES) {
      setArquivo(null);
      setErroArquivo('O arquivo excede o tamanho máximo de 10MB.');
      e.target.value = '';
      return;
    }

    setArquivo(selecionado);
    analisarArquivo(selecionado);
  };

  const handleToggleMelhoria = (melhoria) => {
    setMelhoriasAprovadas((atual) =>
      atual.includes(melhoria) ? atual.filter((m) => m !== melhoria) : [...atual, melhoria]
    );
  };

  const handleAdaptar = async (e) => {
    e.preventDefault();
    if (!arquivo || analisando || adaptando) return;

    setAdaptando(true);
    setErroInterno('');

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      if (aluno?.id) formData.append('aluno_id', String(aluno.id));
      if (idTurmaFinal) formData.append('turma_id', String(idTurmaFinal));
      formData.append('melhorias', JSON.stringify(melhoriasAprovadas));
      formData.append('notas_usuario', notasUsuario.trim());
      formData.append('formato_saida', formatoSaida); // 👈 Envia a escolha

      const urlAdaptar = modoTurma
        ? `http://127.0.0.1:8000/atividades/turma/${idTurmaFinal}/adaptar`
        : 'http://127.0.0.1:8000/atividades/adaptar';

      const response = await fetch(urlAdaptar, {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });

      if (response.status === 404) {
        // Fallback local (mantido para segurança)
        alert('Rota de adaptação não encontrada no servidor.');
        return;
      }

      if (!response.ok) throw new Error(MENSAGEM_ERRO_INTERNO);

      const dados = await response.json();
      const nomeFinal = dados.nome_arquivo;
      const urlDownload = dados.download_url;

      const novaAtividade = {
        id: dados.id || Date.now(),
        nome_original: arquivo.name,
        nome_arquivo: nomeFinal,
        melhorias: melhoriasAprovadas,
        notas_usuario: notasUsuario.trim(),
        data_criacao: dados.data_criacao || new Date().toLocaleString('pt-BR'),
        conteudo_texto: dados.conteudo_texto || '',
        download_url: urlDownload,
      };

      setAtividadeGerada(novaAtividade);
      onAtividadeAdaptada?.(novaAtividade);
      
      if (urlDownload) {
        await baixarArquivoAutenticado(urlDownload, nomeFinal);
      }
    } catch {
      setErroInterno(MENSAGEM_ERRO_INTERNO);
    } finally {
      setAdaptando(false);
    }
  };

  const botaoAdaptarDesabilitado =
    !arquivo || Boolean(erroArquivo) || analisando || adaptando || melhoriasSugeridas.length === 0;

  return (
    <Modal
      titulo="Adaptar atividade"
      descricao={
        modoTurma
          ? `Envie uma atividade para receber sugestões baseadas nas deficiências de ${nomeAlvo}.`
          : `Envie uma atividade para receber sugestões personalizadas para ${nomeAlvo}.`
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleAdaptar}>
        <label className="field">
          <span className="field-label">Upload de atividade *</span>
          <input
            type="file"
            className={`file-input${erroArquivo ? ' has-error' : ''}`}
            accept=".txt,.pdf,.pptx,.docx"
            onChange={handleSelecionarArquivo}
          />
          <span className="field-hint">Formatos: TXT, PDF, PPTX ou DOCX · Máx: 10MB</span>
          {arquivo && !erroArquivo && (
            <span className="field-hint" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Arquivo selecionado: {arquivo.name} ({formatarTamanho(arquivo.size)})
            </span>
          )}
          {erroArquivo && <span className="field-error">{erroArquivo}</span>}
        </label>

        {analisando && (
          <div className="atividade-analise-loading" role="status">
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <div>
              <strong>Analisando atividade com a IA...</strong>
            </div>
          </div>
        )}

        {!analisando && melhoriasSugeridas.length > 0 && (
          <div className="atividade-sugestoes-box">
            <div className="atividade-sugestoes-header">
              <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icone nome="sparkle" style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                Melhorias sugeridas pela IA
              </span>
              <span className="tag">{melhoriasAprovadas.length} de {melhoriasSugeridas.length}</span>
            </div>
            <ul className="sugestoes-ia-list">
              {melhoriasSugeridas.map((sugestao, index) => {
                const selecionada = melhoriasAprovadas.includes(sugestao);
                return (
                  <li key={index}>
                    <label className={`sugestao-ia-item${selecionada ? ' selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selecionada}
                        onChange={() => handleToggleMelhoria(sugestao)}
                      />
                      <span>{sugestao}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-label">Notas e sugestões para a atividade</span>
          <textarea
            className="textarea"
            value={notasUsuario}
            onChange={(e) => setNotasUsuario(e.target.value)}
            placeholder="Adicione suas próprias notas ou sugestões..."
          />
        </label>

        {/* 👈 AQUI ESTÁ A ESCOLHA DO FORMATO */}
        <div className="field" style={{ marginTop: 16 }}>
          <span className="field-label">Formato de saída</span>
          <div className="segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={formatoSaida === 'docx'}
              className={formatoSaida === 'docx' ? 'active' : ''}
              onClick={() => setFormatoSaida('docx')}
            >
              {formatoSaida === 'docx' && <Icone nome="check" />}
              Documento (DOCX)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={formatoSaida === 'txt'}
              className={formatoSaida === 'txt' ? 'active' : ''}
              onClick={() => setFormatoSaida('txt')}
            >
              {formatoSaida === 'txt' && <Icone nome="check" />}
              Texto Puro (TXT)
            </button>
          </div>
          <span className="field-hint">DOCX para impressão/edição e TXT para leitores de tela.</span>
        </div>

        {erroInterno && (
          <p className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
            {erroInterno}
          </p>
        )}

        {atividadeGerada && (
          <div className="atividade-gerada-box" role="status">
            <div className="atividade-gerada-info">
              <Icone nome="check" />
              <div>
                <strong>Atividade adaptada gerada!</strong>
                <p className="muted" style={{ fontSize: 13 }}>{atividadeGerada.nome_arquivo}</p>
              </div>
            </div>
            {atividadeGerada.download_url && (
              <button
                type="button"
                className="btn btn-tonal btn-sm"
                onClick={() => baixarArquivoAutenticado(atividadeGerada.download_url, atividadeGerada.nome_arquivo)}
              >
                <Icone nome="download" />
                Baixar novamente
              </button>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-text">Cancelar</button>
          <button type="submit" disabled={botaoAdaptarDesabilitado} className="btn btn-primary">
            <Icone nome="sparkle" />
            {adaptando ? 'Adaptando...' : 'Adaptar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}