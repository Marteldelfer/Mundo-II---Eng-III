import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TurmaNavbar from '../components/TurmaNavbar';
import Icone from '../components/Icone';
import Carregando from '../components/Carregando';
import AdaptarAtividadeModal from '../components/AdaptarAtividadeModal';
import { headersAuth } from '../utils/auth';
import '../App.css';

function listarDeficiencias(valor) {
  if (Array.isArray(valor)) return valor.filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) {
    return valor
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  }
  return [];
}

export default function AtividadesTurma() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [atividadesAdaptadas, setAtividadesAdaptadas] = useState([]);
  const [modalAtividadeAberto, setModalAtividadeAberto] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const responseTurma = await fetch(`http://127.0.0.1:8000/turmas/${id}`, {
          headers: headersAuth(),
        });
        if (responseTurma.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        if (responseTurma.status === 404) {
          navigate('/minhas-turmas', { replace: true });
          return;
        }
        if (!responseTurma.ok) throw new Error('Erro ao buscar a turma');

        const dadosTurma = await responseTurma.json();
        setTurma(dadosTurma);

        const responseAlunos = await fetch(`http://127.0.0.1:8000/alunos/turma/${id}`, {
          headers: headersAuth(),
        });
        if (responseAlunos.ok) {
          const dadosAlunos = await responseAlunos.json();
          const listaAlunos = Array.isArray(dadosAlunos) ? dadosAlunos : [];

          // Busca as observações de cada aluno na turma para alimentar a análise da IA
          const alunosComObs = await Promise.all(
            listaAlunos.map(async (alunoItem) => {
              try {
                const resObs = await fetch(
                  `http://127.0.0.1:8000/observacoes/aluno/${alunoItem.id}/turma/${id}`,
                  { headers: headersAuth() }
                );
                if (resObs.ok) {
                  const obs = await resObs.json();
                  return {
                    ...alunoItem,
                    observacoes_lista: Array.isArray(obs) ? obs : [],
                  };
                }
              } catch {
                // ignora falha individual de observações
              }
              return { ...alunoItem, observacoes_lista: [] };
            })
          );
          setAlunos(alunosComObs);
        }

        const chaveStorage = `adapted_atividades_turma_${id}`;
        const salvasLocal = JSON.parse(localStorage.getItem(chaveStorage) || '[]');
        try {
          const responseAtiv = await fetch(`http://127.0.0.1:8000/atividades/turma/${id}`, {
            headers: headersAuth(),
          });
          if (responseAtiv.ok) {
            const dadosAtiv = await responseAtiv.json();
            setAtividadesAdaptadas(Array.isArray(dadosAtiv) ? dadosAtiv : salvasLocal);
          } else {
            setAtividadesAdaptadas(salvasLocal);
          }
        } catch {
          setAtividadesAdaptadas(salvasLocal);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de atividades da turma:', error);
      }
    };

    carregarDados();
  }, [id, navigate]);

  const handleAtividadeAdaptada = (novaAtividade) => {
    setAtividadesAdaptadas((anteriores) => {
      const atualizadas = [novaAtividade, ...anteriores];
      const chaveStorage = `adapted_atividades_turma_${id}`;
      const paraSalvar = atualizadas.map(({ download_url: _downloadUrl, ...resto }) => resto);
      localStorage.setItem(chaveStorage, JSON.stringify(paraSalvar));
      return atualizadas;
    });
    setMensagem('Atividade da turma adaptada e salva com sucesso!');
    setTimeout(() => setMensagem(''), 3000);
  };

  const handleBaixarAtividadeSalva = async (atividade) => {
    if (atividade.download_url) {
      const link = document.createElement('a');
      link.href = atividade.download_url;
      link.download = atividade.nome_arquivo || 'atividade_turma_adaptada.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (atividade.conteudo_texto) {
      const blob = new Blob([atividade.conteudo_texto], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = atividade.nome_arquivo || 'atividade_turma_adaptada.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/atividades/${atividade.id}/download`,
        { headers: headersAuth() }
      );
      if (!response.ok) {
        throw new Error('Ocorreu um erro interno. Tente novamente mais tarde');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = atividade.nome_arquivo || 'atividade_turma_adaptada';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setMensagem('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  if (!turma) {
    return (
      <>
        <Header />
        <Carregando />
      </>
    );
  }

  const deficienciasDaTurma = Array.from(
    new Set(alunos.flatMap((a) => listarDeficiencias(a.deficiencias)))
  );

  const mensagemSucesso = mensagem.includes('sucesso');

  return (
    <>
      <Header />

      <main className="page">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate('/minhas-turmas')}
        >
          <Icone nome="arrowBack" />
          Minhas turmas
        </button>

        {/* Menu Navbar no topo da página da turma */}
        <TurmaNavbar turmaId={id} abaAtiva="atividades" />

        <div className="page-header">
          <div>
            <span className="eyebrow">Atividades da turma</span>
            <h1>{turma.nome}</h1>
            {turma.materia && <p>{turma.materia}</p>}
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalAtividadeAberto(true)}
            >
              <Icone nome="add" />
              Adicionar atividade
            </button>
          </div>
        </div>

        {mensagem && (
          <p
            className={`alert ${mensagemSucesso ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: 20 }}
          >
            {mensagem}
          </p>
        )}

        <div className="turma-layout">
          {/* Lista de atividades adaptadas da turma */}
          <section className="card">
            <div className="section-header">
              <h3>
                Atividades adaptadas{' '}
                <span className="count-badge">{atividadesAdaptadas.length}</span>
              </h3>
            </div>

            {atividadesAdaptadas.length === 0 ? (
              <div className="empty-state">
                <Icone nome="description" />
                <p>Nenhuma atividade ou material adaptado salvo para esta turma ainda.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalAtividadeAberto(true)}
                >
                  <Icone nome="add" />
                  Adicionar atividade
                </button>
              </div>
            ) : (
              <div className="atividades-salvas-list">
                {atividadesAdaptadas.map((ativ) => (
                  <div key={ativ.id} className="atividade-salva-item">
                    <div className="atividade-salva-info">
                      <h4>{ativ.nome_arquivo || ativ.nome_original}</h4>
                      <p className="obs-meta">
                        {ativ.nome_original ? `Original: ${ativ.nome_original} · ` : ''}
                        {ativ.data_criacao}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBaixarAtividadeSalva(ativ)}
                      className="btn btn-tonal btn-sm"
                      title="Baixar atividade adaptada"
                    >
                      <Icone nome="download" />
                      Baixar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resumo das necessidades da turma */}
          <aside className="card">
            <h3 className="card-title">
              <Icone nome="sparkle" />
              Contexto da turma
            </h3>
            <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
              Ao adaptar uma atividade ou material, a IA analisa as deficiências e anotações de
              todos os alunos vinculados a <strong>{turma.nome}</strong>.
            </p>

            <dl className="info-list">
              <div>
                <dt>Alunos na turma</dt>
                <dd>{alunos.length}</dd>
              </div>
              <div>
                <dt>Deficiências mapeadas</dt>
                <dd>
                  {deficienciasDaTurma.length === 0 ? (
                    <span className="muted">Nenhuma deficiência informada</span>
                  ) : (
                    <div className="chip-group" style={{ marginTop: 6 }}>
                      {deficienciasDaTurma.map((def) => (
                        <span key={def} className="tag">
                          {def}
                        </span>
                      ))}
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </main>

      {modalAtividadeAberto && (
        <AdaptarAtividadeModal
          turma={turma}
          turmaId={id}
          alunosTurma={alunos}
          onClose={() => setModalAtividadeAberto(false)}
          onAtividadeAdaptada={handleAtividadeAdaptada}
        />
      )}
    </>
  );
}
