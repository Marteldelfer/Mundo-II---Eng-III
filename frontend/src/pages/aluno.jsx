import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { headersAuth } from '../utils/auth';
import Icone from '../components/Icone';
import Carregando from '../components/Carregando';
import '../App.css';

export default function Aluno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [aluno, setAluno] = useState(null);
  const [observacoes, setObservacoes] = useState([]);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [engajamento, setEngajamento] = useState(0);
  const [salvandoEngajamento, setSalvandoEngajamento] = useState(false);

  // Turma vem do state (via navigate) OU da URL (futuro)
  const turmaId = location.state?.turmaId || null;

  // Se o aluno está em várias turmas e o usuário não escolheu uma,
  // mostramos a tela de "selecione a turma"
  const [turmaSelecionada, setTurmaSelecionada] = useState(turmaId);

  useEffect(() => {
    const carregarDados = async () => {
      if (!turmaSelecionada) {
        // Ainda precisamos do aluno para mostrar as turmas disponíveis
        try {
          const responseAluno = await fetch(`http://127.0.0.1:8000/alunos/${id}`, {
            headers: headersAuth(),
          });
          if (responseAluno.status === 401) {
            navigate('/login', { replace: true });
            return;
          }
          if (!responseAluno.ok) {
            const data = await responseAluno.json().catch(() => ({}));
            throw new Error(data.detail || 'Erro ao buscar aluno');
          }
          const dadosAluno = await responseAluno.json();
          setAluno(dadosAluno);
        } catch (error) {
          setMensagem(`Erro: ${error.message}`);
        }
        return;
      }

      try {
        // Busca aluno JÁ no contexto da turma (engajamento por turma)
        const responseAluno = await fetch(
          `http://127.0.0.1:8000/alunos/${id}/turma/${turmaSelecionada}`,
          { headers: headersAuth() }
        );
        if (responseAluno.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        if (!responseAluno.ok) {
          const data = await responseAluno.json().catch(() => ({}));
          throw new Error(data.detail || 'Erro ao buscar aluno');
        }
        const dadosAluno = await responseAluno.json();
        setAluno(dadosAluno);
        setEngajamento(Number(dadosAluno.engajamento) || 0);

        // Busca observações do diário
        const responseObs = await fetch(
          `http://127.0.0.1:8000/observacoes/aluno/${id}/turma/${turmaSelecionada}`,
          { headers: headersAuth() }
        );
        if (responseObs.ok) {
          const dadosObs = await responseObs.json();
          setObservacoes(Array.isArray(dadosObs) ? dadosObs : []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMensagem(`Erro: ${error.message}`);
      }
    };
    carregarDados();
  }, [id, turmaSelecionada, navigate]);

  // --- Observações ---
  const handleSalvarObservacao = async () => {
    if (!novaObservacao.trim()) {
      setMensagem('Texto da observação é obrigatório');
      return;
    }
    setSalvando(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/observacoes/', {
        method: 'POST',
        headers: headersAuth(),
        body: JSON.stringify({
          aluno_id: parseInt(id),
          turma_id: parseInt(turmaSelecionada),
          texto: novaObservacao,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao salvar observação');
      }
      const novaObs = await response.json();
      setObservacoes([novaObs, ...observacoes]);
      setNovaObservacao('');
      setMensagem('Observação salva com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      setMensagem(`Erro: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleEditarObservacao = (obs) => {
    setEditandoId(obs.id);
    setTextoEditado(obs.texto);
  };

  const handleSalvarEdicao = async (obsId) => {
    if (!textoEditado.trim()) {
      setMensagem('Texto da observação é obrigatório');
      return;
    }
    setSalvando(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/observacoes/${obsId}`, {
        method: 'PUT',
        headers: headersAuth(),
        body: JSON.stringify({ texto: textoEditado }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao atualizar observação');
      }
      const obsAtualizada = await response.json();
      setObservacoes(observacoes.map((obs) => (obs.id === obsId ? obsAtualizada : obs)));
      setEditandoId(null);
      setTextoEditado('');
      setMensagem('Observação atualizada com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      setMensagem(`Erro: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletarObservacao = async (obsId) => {
    if (!confirm('Tem certeza que deseja excluir esta observação?')) {
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/observacoes/${obsId}`, {
        method: 'DELETE',
        headers: headersAuth(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao deletar observação');
      }
      setObservacoes(observacoes.filter((obs) => obs.id !== obsId));
      setMensagem('Observação excluída com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      setMensagem(`Erro: ${error.message}`);
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setTextoEditado('');
  };

  // --- Engajamento ---
  const handleSalvarEngajamento = async () => {
    if (!turmaSelecionada) return;
    setSalvandoEngajamento(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/alunos/${id}`, {
        method: 'PUT',
        headers: headersAuth(),
        body: JSON.stringify({
          turma_id: parseInt(turmaSelecionada),
          engajamento: parseFloat(engajamento),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao salvar engajamento');
      }
      setMensagem('Engajamento atualizado com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      setMensagem(`Erro: ${error.message}`);
    } finally {
      setSalvandoEngajamento(false);
    }
  };

  const handleSugerirAtividades = () => {
    alert('Funcionalidade será implementada na próxima sprint!');
  };

  const handleVoltar = () => {
    if (turmaSelecionada) {
      navigate(`/turma/${turmaSelecionada}`);
    } else {
      navigate('/minhas-turmas');
    }
  };

  const engajamentoCor = (v) => {
    if (v >= 70) return '#22a06b';
    if (v >= 40) return '#f5a524';
    return '#e5484d';
  };

  const deficienciasLista = (() => {
    if (Array.isArray(aluno?.deficiencias)) return aluno.deficiencias;
    if (typeof aluno?.deficiencias === 'string' && aluno?.deficiencias.trim()) {
      return aluno.deficiencias.split(',').map((d) => d.trim()).filter(Boolean);
    }
    return [];
  })();

  if (!aluno) {
    return (
      <>
        <Header />
        {mensagem ? (
          <main className="page page-narrow">
            <button type="button" className="back-link" onClick={handleVoltar}>
              <Icone nome="arrowBack" />
              Voltar
            </button>
            <p className="alert alert-error">{mensagem}</p>
          </main>
        ) : (
          <Carregando />
        )}
      </>
    );
  }

  const iniciais = aluno.nome?.trim().charAt(0).toUpperCase();

  // ============================================
  // Sem turma selecionada → usuário escolhe
  // ============================================
  if (!turmaSelecionada) {
    const vinculos = aluno.vinculos || [];
    return (
      <>
        <Header />
        <main className="page page-narrow">
          <button type="button" className="back-link" onClick={handleVoltar}>
            <Icone nome="arrowBack" />
            Voltar
          </button>

          <div className="aluno-header">
            <span className="avatar" aria-hidden="true">
              {iniciais}
            </span>
            <div className="aluno-header-info">
              <h1>Selecione uma turma</h1>
              <p className="muted" style={{ marginTop: 6 }}>
                As informações e observações de <strong>{aluno.nome}</strong> são específicas por
                turma.
              </p>
            </div>
          </div>

          {vinculos.length === 0 ? (
            <div className="empty-state">
              <Icone nome="school" />
              <p>Este aluno não está em nenhuma das suas turmas.</p>
            </div>
          ) : (
            <div className="turma-select-grid">
              {vinculos.map((v) => (
                <button
                  key={v.turma_id}
                  type="button"
                  className="turma-card"
                  style={{ minHeight: 120 }}
                  onClick={() => setTurmaSelecionada(v.turma_id)}
                >
                  <span className="turma-card-icon">
                    <Icone nome="school" />
                  </span>
                  <h3>{v.turma_nome}</h3>
                  <span className="open-hint">
                    Ver nesta turma
                    <Icone nome="arrowForward" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </main>
      </>
    );
  }

  // ============================================
  // Turma selecionada → tela completa
  // ============================================
  const statusEngajamento =
    engajamento >= 70
      ? { texto: 'Aluno altamente engajado', bg: 'var(--success-container)', fg: 'var(--success)' }
      : engajamento >= 40
      ? { texto: 'Aluno com engajamento moderado', bg: 'var(--warning-container)', fg: 'var(--warning)' }
      : { texto: 'Aluno precisa de mais atenção', bg: 'var(--danger-container)', fg: 'var(--danger)' };

  const mensagemSucesso = mensagem.includes('sucesso');

  return (
    <>
      <Header />

      <main className="page">
        <button type="button" className="back-link" onClick={handleVoltar}>
          <Icone nome="arrowBack" />
          {aluno.turma_nome ? `Voltar para ${aluno.turma_nome}` : 'Voltar'}
        </button>

        <div className="aluno-header">
          <span className="avatar" aria-hidden="true">
            {iniciais}
          </span>
          <div className="aluno-header-info">
            <span className="eyebrow">
              Perfil do aluno{aluno.turma_nome ? ` · ${aluno.turma_nome}` : ''}
            </span>
            <h1>{aluno.nome}</h1>
            {deficienciasLista.length > 0 && (
              <div className="chip-group">
                {deficienciasLista.map((def, index) => (
                  <span key={index} className="tag">
                    {def}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="aluno-grid">
          <div>
            {/* Engajamento por turma (editável) */}
            <section className="card">
              <h3 className="card-title">
                <Icone nome="insights" />
                Nível de engajamento
              </h3>
              <div className="engajamento-valor">
                <strong>{Number(engajamento).toFixed(0)}%</strong>
                <span className="muted">nesta turma</span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={Number(engajamento)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-bar"
                  style={{ width: `${engajamento}%`, backgroundColor: engajamentoCor(engajamento) }}
                />
              </div>
              <span
                className="status-pill"
                style={{ background: statusEngajamento.bg, color: statusEngajamento.fg }}
              >
                {statusEngajamento.texto}
              </span>

              {/* Slider para ajustar */}
              <div className="engajamento-controle">
                <input
                  type="range"
                  className="range"
                  min="0"
                  max="100"
                  step="1"
                  value={engajamento}
                  onChange={(e) => setEngajamento(Number(e.target.value))}
                  aria-label="Ajustar engajamento"
                />
                <button
                  type="button"
                  onClick={handleSalvarEngajamento}
                  disabled={salvandoEngajamento}
                  className="btn btn-tonal btn-sm"
                >
                  {salvandoEngajamento ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </section>

            {/* Botão sugerir atividades */}
            <section className="card sugestao-card">
              <h3 className="card-title">
                <Icone nome="sparkle" style={{ color: '#fff' }} />
                Atividades adaptadas
              </h3>
              <p>Sugira atividades baseadas nas deficiências e observações do aluno.</p>
              <button type="button" onClick={handleSugerirAtividades} className="btn btn-block">
                <Icone nome="sparkle" />
                Sugerir atividades
              </button>
            </section>
          </div>

          {/* Observações do professor */}
          <section className="card">
            <h3 className="card-title">
              <Icone nome="notes" />
              Minhas observações
            </h3>

            {/* Adicionar nova observação */}
            <div className="obs-form">
              <textarea
                className="textarea"
                value={novaObservacao}
                onChange={(e) => setNovaObservacao(e.target.value)}
                placeholder="Adicione uma nova observação sobre o desempenho do aluno..."
                aria-label="Nova observação"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSalvarObservacao}
                  disabled={salvando}
                  className="btn btn-primary"
                >
                  <Icone nome="add" />
                  {salvando ? 'Salvando...' : 'Adicionar observação'}
                </button>
              </div>
            </div>

            {mensagem && (
              <p
                className={`alert ${mensagemSucesso ? 'alert-success' : 'alert-error'}`}
                style={{ marginTop: 16 }}
              >
                {mensagem}
              </p>
            )}

            {/* Lista de observações */}
            {observacoes.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 20 }}>
                <Icone nome="notes" />
                <p>Você ainda não registrou nenhuma observação sobre este aluno nesta turma.</p>
              </div>
            ) : (
              <div className="obs-list">
                {observacoes.map((obs) => (
                  <article key={obs.id} className="obs-item">
                    <div className="obs-item-header">
                      <p className="obs-meta">
                        Criada em {obs.data_criacao}
                        {obs.data_edicao && <> · Editada em {obs.data_edicao}</>}
                      </p>
                      {editandoId !== obs.id && (
                        <div style={{ display: 'flex' }}>
                          <button
                            type="button"
                            onClick={() => handleEditarObservacao(obs)}
                            className="icon-btn"
                            title="Editar"
                            aria-label="Editar observação"
                          >
                            <Icone nome="edit" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletarObservacao(obs.id)}
                            className="icon-btn danger"
                            title="Excluir"
                            aria-label="Excluir observação"
                          >
                            <Icone nome="delete" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editandoId === obs.id ? (
                      <div>
                        <textarea
                          className="textarea"
                          value={textoEditado}
                          onChange={(e) => setTextoEditado(e.target.value)}
                          aria-label="Editar observação"
                        />
                        <div className="obs-edit-actions">
                          <button
                            type="button"
                            onClick={handleCancelarEdicao}
                            className="btn btn-text btn-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSalvarEdicao(obs.id)}
                            disabled={salvando}
                            className="btn btn-primary btn-sm"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="obs-texto">{obs.texto}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
