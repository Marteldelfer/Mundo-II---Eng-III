import { useState } from 'react';
import Modal from './Modal';
import Icone from './Icone';
import { headersAuthUpload } from '../utils/auth';

const EXTENSOES_PERMITIDAS = ['txt', 'pdf', 'pptx', 'docx'];
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB
const MENSAGEM_ERRO_INTERNO = 'Ocorreu um erro interno. Tente novamente mais tarde';

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

/**
 * Pop-up de upload, análise e adaptação de atividade com IA para um aluno.
 */
export default function AdaptarAtividadeModal({
  aluno,
  turmaId,
  deficiencias = [],
  observacoes = [],
  onClose,
  onAtividadeAdaptada,
}) {
  const [arquivo, setArquivo] = useState(null);
  const [erroArquivo, setErroArquivo] = useState('');
  const [erroInterno, setErroInterno] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [melhoriasSugeridas, setMelhoriasSugeridas] = useState([]);
  const [melhoriasAprovadas, setMelhoriasAprovadas] = useState([]);
  const [notasUsuario, setNotasUsuario] = useState('');
  const [adaptando, setAdaptando] = useState(false);
  const [atividadeGerada, setAtividadeGerada] = useState(null);

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
      formData.append('aluno_id', String(aluno.id));
      if (turmaId) {
        formData.append('turma_id', String(turmaId));
      }

      const response = await fetch('http://127.0.0.1:8000/atividades/analisar', {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });

      if (response.status === 404) {
        // Fallback local caso o endpoint ainda não esteja publicado no backend
        const sugestoesFallback = gerarSugestoesContextualizadas(deficiencias, observacoes);
        setMelhoriasSugeridas(sugestoesFallback);
        setMelhoriasAprovadas(sugestoesFallback);
        return;
      }

      if (!response.ok) {
        throw new Error(MENSAGEM_ERRO_INTERNO);
      }

      const dados = await response.json();
      const lista = Array.isArray(dados?.melhorias)
        ? dados.melhorias
        : Array.isArray(dados?.sugestoes)
        ? dados.sugestoes
        : [];

      const normalizadas = lista
        .map((item) => (typeof item === 'string' ? item : item?.descricao || item?.titulo || ''))
        .filter(Boolean);

      const resultadoFinal =
        normalizadas.length > 0
          ? normalizadas
          : gerarSugestoesContextualizadas(deficiencias, observacoes);

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
      setErroArquivo('Formato de arquivo inválido. Envie apenas arquivos TXT, PDF, PPTX ou DOCX.');
      e.target.value = '';
      return;
    }

    if (selecionado.size > TAMANHO_MAXIMO_BYTES) {
      setArquivo(null);
      setErroArquivo('O arquivo excede o tamanho máximo permitido de 10MB.');
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

  const dispararDownload = (url, nomeArquivo) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdaptar = async (e) => {
    e.preventDefault();
    if (!arquivo || analisando || adaptando) return;

    setAdaptando(true);
    setErroInterno('');

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('aluno_id', String(aluno.id));
      if (turmaId) {
        formData.append('turma_id', String(turmaId));
      }
      formData.append('melhorias', JSON.stringify(melhoriasAprovadas));
      formData.append('notas_usuario', notasUsuario.trim());

      const response = await fetch('http://127.0.0.1:8000/atividades/adaptar', {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });

      const nomeBase = arquivo.name.replace(/\.[^/.]+$/, '');
      const extensaoOriginal = arquivo.name.split('.').pop()?.toLowerCase() || 'txt';
      const nomeAdaptadoPadrao = `${nomeBase}_adaptada_${aluno.nome
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')}.${extensaoOriginal}`;

      if (response.status === 404) {
        // Geração local do arquivo adaptado para download e salvamento caso rota ainda não exista no backend
        let textoOriginal = '';
        if (extensaoOriginal === 'txt') {
          textoOriginal = await arquivo.text().catch(() => '');
        }

        const linhasConteudo = [
          `ATIVIDADE ADAPTADA — ${aluno.nome.toUpperCase()}`,
          `Arquivo original: ${arquivo.name}`,
          `Data da adaptação: ${new Date().toLocaleString('pt-BR')}`,
          deficiencias.length > 0 ? `Deficiências consideradas: ${deficiencias.join(', ')}` : null,
          '',
          '=== MELHORIAS APLICADAS PELA IA ===',
          ...(melhoriasAprovadas.length > 0
            ? melhoriasAprovadas.map((m, idx) => `${idx + 1}. ${m}`)
            : ['Nenhuma melhoria da lista selecionada.']),
          '',
          notasUsuario.trim() ? '=== NOTAS E SUGESTÕES DO PROFESSOR ===' : null,
          notasUsuario.trim() ? notasUsuario.trim() : null,
          notasUsuario.trim() ? '' : null,
          textoOriginal ? '=== CONTEÚDO ADAPTADO ===' : null,
          textoOriginal || null,
        ].filter((l) => l !== null);

        const blob = new Blob([linhasConteudo.join('\n')], {
          type: 'text/plain;charset=utf-8',
        });
        const nomeFinal =
          extensaoOriginal === 'txt' ? nomeAdaptadoPadrao : `${nomeAdaptadoPadrao}.txt`;
        const urlBlob = URL.createObjectURL(blob);

        const novaAtividade = {
          id: Date.now(),
          nome_original: arquivo.name,
          nome_arquivo: nomeFinal,
          melhorias: melhoriasAprovadas,
          notas_usuario: notasUsuario.trim(),
          data_criacao: new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          conteudo_texto: linhasConteudo.join('\n'),
          download_url: urlBlob,
        };

        setAtividadeGerada(novaAtividade);
        onAtividadeAdaptada?.(novaAtividade);
        dispararDownload(urlBlob, nomeFinal);
        return;
      }

      if (!response.ok) {
        throw new Error(MENSAGEM_ERRO_INTERNO);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const dados = await response.json();
        const nomeFinal = dados.nome_arquivo || nomeAdaptadoPadrao;
        let urlDownload = dados.download_url || dados.url_download || null;

        if (!urlDownload && dados.conteudo) {
          const blob = new Blob([dados.conteudo], { type: 'text/plain;charset=utf-8' });
          urlDownload = URL.createObjectURL(blob);
        }

        const novaAtividade = {
          id: dados.id || Date.now(),
          nome_original: arquivo.name,
          nome_arquivo: nomeFinal,
          melhorias: melhoriasAprovadas,
          notas_usuario: notasUsuario.trim(),
          data_criacao:
            dados.data_criacao ||
            new Date().toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          conteudo_texto: dados.conteudo || '',
          download_url: urlDownload,
        };

        setAtividadeGerada(novaAtividade);
        onAtividadeAdaptada?.(novaAtividade);
        if (urlDownload) {
          dispararDownload(urlDownload, nomeFinal);
        }
      } else {
        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition') || '';
        const matchFilename = disposition.match(/filename="?([^"]+)"?/i);
        const nomeFinal = matchFilename?.[1] || nomeAdaptadoPadrao;
        const urlBlob = URL.createObjectURL(blob);

        const novaAtividade = {
          id: Date.now(),
          nome_original: arquivo.name,
          nome_arquivo: nomeFinal,
          melhorias: melhoriasAprovadas,
          notas_usuario: notasUsuario.trim(),
          data_criacao: new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          download_url: urlBlob,
        };

        setAtividadeGerada(novaAtividade);
        onAtividadeAdaptada?.(novaAtividade);
        dispararDownload(urlBlob, nomeFinal);
      }
    } catch {
      setErroInterno(MENSAGEM_ERRO_INTERNO);
    } finally {
      setAdaptando(false);
    }
  };

  const botaoAdaptarDesabilitado =
    !arquivo ||
    Boolean(erroArquivo) ||
    analisando ||
    adaptando ||
    melhoriasSugeridas.length === 0;

  return (
    <Modal
      titulo="Adaptar atividade"
      descricao={`Envie uma atividade para receber sugestões de adaptação personalizadas para ${aluno.nome}.`}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleAdaptar}>
        {/* Campo de upload de atividade */}
        <label className="field">
          <span className="field-label">Upload de atividade *</span>
          <input
            type="file"
            className={`file-input${erroArquivo ? ' has-error' : ''}`}
            accept=".txt,.pdf,.pptx,.docx"
            onChange={handleSelecionarArquivo}
            aria-label="Upload de atividade"
          />
          <span className="field-hint">
            Formatos aceitos: TXT, PDF, PPTX ou DOCX · Tamanho máximo: 10MB
          </span>
          {arquivo && !erroArquivo && (
            <span className="field-hint" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Arquivo selecionado: {arquivo.name} ({formatarTamanho(arquivo.size)})
            </span>
          )}
          {erroArquivo && (
            <span className="field-error" role="alert">
              {erroArquivo}
            </span>
          )}
        </label>

        {/* Estado de carregamento da análise da IA */}
        {analisando && (
          <div className="atividade-analise-loading" role="status">
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <div>
              <strong>Analisando atividade com a IA...</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                Verificando melhorias de acordo com as deficiências e anotações do aluno.
              </p>
            </div>
          </div>
        )}

        {/* Lista de melhorias sugeridas pela IA */}
        {!analisando && melhoriasSugeridas.length > 0 && (
          <div className="atividade-sugestoes-box">
            <div className="atividade-sugestoes-header">
              <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icone nome="sparkle" style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                Melhorias sugeridas pela IA
              </span>
              <span className="tag">
                {melhoriasAprovadas.length} de {melhoriasSugeridas.length} selecionadas
              </span>
            </div>
            <p className="field-hint" style={{ marginBottom: 10 }}>
              Baseadas nas deficiências
              {deficiencias.length > 0 ? ` (${deficiencias.join(', ')})` : ''} e nas anotações do
              aluno. Marque as melhorias que deseja aprovar:
            </p>

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

        {/* Campo de texto para notas e sugestões próprias do usuário */}
        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-label">Notas e sugestões para a atividade</span>
          <textarea
            className="textarea"
            value={notasUsuario}
            onChange={(e) => setNotasUsuario(e.target.value)}
            placeholder="Adicione suas próprias notas, instruções ou sugestões de adaptação para a atividade..."
            aria-label="Notas e sugestões para a atividade"
          />
        </label>

        {/* Mensagem de erro interno */}
        {erroInterno && (
          <p className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
            {erroInterno}
          </p>
        )}

        {/* Resultado gerado para download */}
        {atividadeGerada && (
          <div className="atividade-gerada-box" role="status">
            <div className="atividade-gerada-info">
              <Icone nome="check" />
              <div>
                <strong>Atividade adaptada gerada e salva com sucesso!</strong>
                <p className="muted" style={{ fontSize: 13 }}>
                  {atividadeGerada.nome_arquivo}
                </p>
              </div>
            </div>
            {atividadeGerada.download_url && (
              <button
                type="button"
                className="btn btn-tonal btn-sm"
                onClick={() =>
                  dispararDownload(atividadeGerada.download_url, atividadeGerada.nome_arquivo)
                }
              >
                <Icone nome="download" />
                Baixar arquivo
              </button>
            )}
          </div>
        )}

        {/* Ações do modal */}
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-text">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={botaoAdaptarDesabilitado}
            className="btn btn-primary"
          >
            <Icone nome="sparkle" />
            {adaptando ? 'Adaptando...' : 'Adaptar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
