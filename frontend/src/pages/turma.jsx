import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TurmaNavbar from '../components/TurmaNavbar';
import { headersAuth, headersAuthUpload } from '../utils/auth';
import Icone from '../components/Icone';
import Modal from '../components/Modal';
import Carregando from '../components/Carregando';
import '../App.css';

export default function Turma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [editando, setEditando] = useState(false);
  const [nomeEditado, setNomeEditado] = useState('');
  const [materiaEditada, setMateriaEditada] = useState('');
  const [descricaoEditada, setDescricaoEditada] = useState('');

  // Modais
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalListaPCDAberto, setModalListaPCDAberto] = useState(false);
  const [modalAdicionarExistenteAberto, setModalAdicionarExistenteAberto] = useState(false);

  // Form adicionar aluno
  const [nomeAluno, setNomeAluno] = useState('');
  const [deficiencias, setDeficiencias] = useState([]);
  const [novaDeficiencia, setNovaDeficiencia] = useState('');
  const [erroNomeAluno, setErroNomeAluno] = useState('');

  // Form editar aluno
  const [alunoEditando, setAlunoEditando] = useState(null);
  const [nomeEditandoAluno, setNomeEditandoAluno] = useState('');
  const [deficienciasEditando, setDeficienciasEditando] = useState([]);
  const [novaDeficienciaEditando, setNovaDeficienciaEditando] = useState('');
  const [erroNomeEditando, setErroNomeEditando] = useState('');

  // Form lista PCD
  const [arquivoPCD, setArquivoPCD] = useState(null);
  const [processandoPCD, setProcessandoPCD] = useState(false);

  const deficienciasPredefinidas = [
    'Visual',
    'Auditiva',
    'Física',
    'Intelectual',
    'Autismo',
    'TDAH',
    'Dislexia',
    'Outra',
  ];

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
        setNomeEditado(dadosTurma.nome);
        setMateriaEditada(dadosTurma.materia || '');
        setDescricaoEditada(dadosTurma.descricao || '');

        const responseAlunos = await fetch(`http://127.0.0.1:8000/alunos/turma/${id}`, {
          headers: headersAuth(),
        });
        if (responseAlunos.ok) {
          const dadosAlunos = await responseAlunos.json();
          setAlunos(dadosAlunos);
        }

        const responseTodos = await fetch('http://127.0.0.1:8000/alunos/', {
          headers: headersAuth(),
        });
        if (responseTodos.ok) {
          const dados = await responseTodos.json();
          setTodosAlunos(dados);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    carregarDados();
  }, [id, navigate]);

  const handleSalvar = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/turmas/${id}`, {
        method: 'PUT',
        headers: headersAuth(),
        body: JSON.stringify({
          nome: nomeEditado,
          materia: materiaEditada,
          descricao: descricaoEditada,
        }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar turma');
      const dadosAtualizados = await response.json();
      setTurma(dadosAtualizados);
      setEditando(false);
    } catch (error) {
      alert('Erro ao salvar alterações');
    }
  };

  const handleDeletarTurma = async () => {
    if (!confirm('Tem certeza que deseja deletar esta turma?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/turmas/${id}`, {
        method: 'DELETE',
        headers: headersAuth(),
      });
      if (!response.ok) throw new Error('Erro ao deletar turma');
      navigate('/minhas-turmas');
    } catch (error) {
      alert('Erro ao deletar turma');
    }
  };

  const handleVoltar = () => navigate('/minhas-turmas');

  // --- Adicionar aluno manualmente ---
  const handleToggleDeficiencia = (def) => {
    setDeficiencias(
      deficiencias.includes(def)
        ? deficiencias.filter((d) => d !== def)
        : [...deficiencias, def]
    );
  };

  const handleAdicionarDeficienciaPersonalizada = () => {
    if (novaDeficiencia.trim() && !deficiencias.includes(novaDeficiencia.trim())) {
      setDeficiencias([...deficiencias, novaDeficiencia.trim()]);
      setNovaDeficiencia('');
    }
  };

  const handleAdicionarAluno = async () => {
    if (!nomeAluno.trim()) {
      setErroNomeAluno('Nome do aluno é obrigatório');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/alunos/', {
        method: 'POST',
        headers: headersAuth(),
        body: JSON.stringify({
          nome: nomeAluno,
          deficiencias: deficiencias.join(', '),
          turma_id: parseInt(id),
        }),
      });
      if (!response.ok) throw new Error('Erro ao criar aluno');
      const novoAluno = await response.json();

      // O backend devolve a visão "por turma" (com turma_id, engajamento, etc.)
      // O que a lista espera é { id, nome, deficiencias }.
      setAlunos([
        ...alunos,
        {
          id: novoAluno.id,
          nome: novoAluno.nome,
          deficiencias: novoAluno.deficiencias,
        },
      ]);
      // Também guarda no "todos" (formato global)
      const jaExiste = todosAlunos.find((a) => a.id === novoAluno.id);
      if (!jaExiste) {
        setTodosAlunos([
          ...todosAlunos,
          {
            id: novoAluno.id,
            nome: novoAluno.nome,
            deficiencias: novoAluno.deficiencias,
          },
        ]);
      }
      fecharModalAdicionar();
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const fecharModalAdicionar = () => {
    setModalAdicionarAberto(false);
    setNomeAluno('');
    setDeficiencias([]);
    setNovaDeficiencia('');
    setErroNomeAluno('');
  };

  // --- Editar aluno ---
  const abrirModalEditar = (aluno) => {
    setAlunoEditando(aluno);
    setNomeEditandoAluno(aluno.nome);

    let defs = [];
    if (Array.isArray(aluno.deficiencias)) {
      defs = aluno.deficiencias;
    } else if (typeof aluno.deficiencias === 'string' && aluno.deficiencias.trim()) {
      defs = aluno.deficiencias.split(',').map((d) => d.trim()).filter(Boolean);
    }
    setDeficienciasEditando(defs);
    setNovaDeficienciaEditando('');
    setErroNomeEditando('');
    setModalEditarAberto(true);
  };

  const handleToggleDeficienciaEditando = (def) => {
    setDeficienciasEditando(
      deficienciasEditando.includes(def)
        ? deficienciasEditando.filter((d) => d !== def)
        : [...deficienciasEditando, def]
    );
  };

  const handleAdicionarDeficienciaPersonalizadaEditando = () => {
    if (
      novaDeficienciaEditando.trim() &&
      !deficienciasEditando.includes(novaDeficienciaEditando.trim())
    ) {
      setDeficienciasEditando([...deficienciasEditando, novaDeficienciaEditando.trim()]);
      setNovaDeficienciaEditando('');
    }
  };

  const handleSalvarEdicaoAluno = async () => {
    if (!nomeEditandoAluno.trim()) {
      setErroNomeEditando('Nome do aluno é obrigatório');
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/alunos/${alunoEditando.id}`, {
        method: 'PUT',
        headers: headersAuth(),
        body: JSON.stringify({
          nome: nomeEditandoAluno,
          deficiencias: deficienciasEditando.join(', '),
          turma_id: parseInt(id),
        }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar aluno');
      const alunoAtualizado = await response.json();

      const alunoNormalizado = {
        id: alunoAtualizado.id,
        nome: alunoAtualizado.nome,
        deficiencias: alunoAtualizado.deficiencias,
      };

      setAlunos(alunos.map((a) => (a.id === alunoNormalizado.id ? alunoNormalizado : a)));
      setTodosAlunos(
        todosAlunos.map((a) => (a.id === alunoNormalizado.id ? alunoNormalizado : a))
      );

      fecharModalEditar();
      alert('Aluno atualizado com sucesso!');
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const fecharModalEditar = () => {
    setModalEditarAberto(false);
    setAlunoEditando(null);
    setNomeEditandoAluno('');
    setDeficienciasEditando([]);
    setNovaDeficienciaEditando('');
    setErroNomeEditando('');
  };

  // --- Remover aluno da turma (desvincula, mantém no sistema) ---
  const handleRemoverAluno = async (alunoId) => {
    if (
      !confirm(
        'Tem certeza que deseja remover este aluno da turma? O aluno continuará cadastrado no sistema.'
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/alunos/desvincular/${id}/${alunoId}`,
        {
          method: 'DELETE',
          headers: headersAuth(),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao remover aluno');
      }
      setAlunos(alunos.filter((a) => a.id !== alunoId));
      alert('Aluno removido da turma com sucesso!');
    } catch (error) {
      alert(error.message || 'Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  // --- Exclusão inteligente ---
  const handleExcluirAluno = async (alunoId) => {
    if (
      !confirm(
        'Tem certeza que deseja excluir este aluno? Se ele pertencer a outras turmas, será apenas removido desta.'
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/alunos/${alunoId}/exclusao-inteligente/${id}`,
        {
          method: 'DELETE',
          headers: headersAuth(),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao excluir aluno');
      }
      const resultado = await response.json();

      setAlunos(alunos.filter((a) => a.id !== alunoId));

      if (resultado.acao === 'deletado') {
        setTodosAlunos(todosAlunos.filter((a) => a.id !== alunoId));
        alert('Aluno excluído do sistema.');
      } else {
        alert('Aluno removido desta turma (ainda existe em outras).');
      }
    } catch (error) {
      alert(error.message || 'Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  // --- Upload lista PCD ---
  const handleUploadPCD = async () => {
    if (!arquivoPCD) return;
    setProcessandoPCD(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoPCD);
      const response = await fetch(
        `http://127.0.0.1:8000/alunos/upload-lista-pcd/${id}`,
        {
          method: 'POST',
          headers: headersAuthUpload(),
          body: formData,
        }
      );
      if (!response.ok) {
        if (response.status === 500) {
          alert('Não foi possível ler o arquivo.');
        } else {
          const data = await response.json();
          alert(data.detail || 'Erro ao processar arquivo');
        }
        return;
      }
      const resultado = await response.json();
      alert(resultado.mensagem);

      const responseAlunos = await fetch(`http://127.0.0.1:8000/alunos/turma/${id}`, {
        headers: headersAuth(),
      });
      if (responseAlunos.ok) setAlunos(await responseAlunos.json());

      const responseTodos = await fetch('http://127.0.0.1:8000/alunos/', {
        headers: headersAuth(),
      });
      if (responseTodos.ok) setTodosAlunos(await responseTodos.json());

      setModalListaPCDAberto(false);
      setArquivoPCD(null);
    } catch (error) {
      alert('Não foi possível ler o arquivo.');
    } finally {
      setProcessandoPCD(false);
    }
  };

  // --- Vincular aluno existente ---
  const handleVincularAlunoExistente = async (alunoId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/alunos/vincular/${id}`, {
        method: 'POST',
        headers: headersAuth(),
        body: JSON.stringify({ aluno_id: alunoId }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || 'Erro ao vincular aluno');
        return;
      }
      const aluno = todosAlunos.find((a) => a.id === alunoId);
      setAlunos([...alunos, aluno]);
      alert('Aluno vinculado com sucesso!');
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const handleVerAluno = (alunoId) => {
    navigate(`/aluno/${alunoId}`, { state: { turmaId: id } });
  };

  const botaoAdicionarDesabilitado = !nomeAluno.trim();
  const botaoEditarDesabilitado = !nomeEditandoAluno.trim();

  if (!turma) {
    return (
      <>
        <Header />
        <Carregando />
      </>
    );
  }

  const alunosDisponiveis = todosAlunos.filter((aluno) => !alunos.find((a) => a.id === aluno.id));

  return (
    <>
      <Header />

      <main className="page">
        <button type="button" className="back-link" onClick={handleVoltar}>
          <Icone nome="arrowBack" />
          Minhas turmas
        </button>

        <TurmaNavbar turmaId={id} abaAtiva="alunos" />

        <div className="page-header">
          <div>
            <span className="eyebrow">Dashboard da turma</span>
            <h1>{turma.nome}</h1>
            {turma.materia && <p>{turma.materia}</p>}
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-tonal"
              onClick={() => setModalListaPCDAberto(true)}
            >
              <Icone nome="upload" />
              Upload lista PCD
            </button>
            <button
              type="button"
              className="btn btn-tonal"
              onClick={() => setModalAdicionarExistenteAberto(true)}
            >
              <Icone nome="group" />
              Aluno já cadastrado
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalAdicionarAberto(true)}
            >
              <Icone nome="personAdd" />
              Adicionar aluno
            </button>
          </div>
        </div>

        <div className="turma-layout">
          {/* Lista de alunos da turma */}
          <section className="card">
            <div className="section-header">
              <h3>
                Alunos da turma <span className="count-badge">{alunos.length}</span>
              </h3>
            </div>

            {alunos.length === 0 ? (
              <div className="empty-state">
                <Icone nome="group" />
                <p>Nenhum aluno cadastrado nesta turma.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalAdicionarAberto(true)}
                >
                  <Icone nome="personAdd" />
                  Adicionar aluno
                </button>
              </div>
            ) : (
              <div className="aluno-list">
                {alunos.map((aluno) => {
                  const defs = listarDeficiencias(aluno.deficiencias);
                  return (
                    <div key={aluno.id} className="aluno-item">
                      <button
                        type="button"
                        className="aluno-item-main"
                        onClick={() => handleVerAluno(aluno.id)}
                        title="Ver detalhes do aluno"
                      >
                        <span className="avatar" aria-hidden="true">
                          {aluno.nome?.trim().charAt(0).toUpperCase()}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h4>{aluno.nome}</h4>
                          {defs.length > 0 && (
                            <div className="chip-group">
                              {defs.map((def) => (
                                <span key={def} className="tag">
                                  {def}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                      <div className="aluno-item-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => abrirModalEditar(aluno)}
                          title="Editar"
                          aria-label={`Editar ${aluno.nome}`}
                        >
                          <Icone nome="edit" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleRemoverAluno(aluno.id)}
                          title="Remover da turma"
                          aria-label={`Remover ${aluno.nome} da turma`}
                        >
                          <Icone nome="unlink" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => handleExcluirAluno(aluno.id)}
                          title="Excluir"
                          aria-label={`Excluir ${aluno.nome}`}
                        >
                          <Icone nome="delete" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Informações da turma */}
          <aside className="card">
            {editando ? (
              <div>
                <h3 className="card-title">
                  <Icone nome="edit" />
                  Editando turma
                </h3>
                <label className="field">
                  <span className="field-label">Nome</span>
                  <input
                    type="text"
                    className="input"
                    value={nomeEditado}
                    onChange={(e) => setNomeEditado(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Matéria</span>
                  <input
                    type="text"
                    className="input"
                    value={materiaEditada}
                    onChange={(e) => setMateriaEditada(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Descrição</span>
                  <textarea
                    className="textarea"
                    value={descricaoEditada}
                    onChange={(e) => setDescricaoEditada(e.target.value)}
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="btn btn-text" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSalvar}>
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="card-title">
                  <Icone nome="info" />
                  Informações da turma
                </h3>
                <dl className="info-list">
                  <div>
                    <dt>Nome</dt>
                    <dd>{turma.nome}</dd>
                  </div>
                  {turma.materia && (
                    <div>
                      <dt>Matéria</dt>
                      <dd>{turma.materia}</dd>
                    </div>
                  )}
                  {turma.descricao && (
                    <div>
                      <dt>Descrição</dt>
                      <dd>{turma.descricao}</dd>
                    </div>
                  )}
                  {turma.plano_ensino && (
                    <div>
                      <dt>Plano de ensino</dt>
                      <dd>{turma.plano_ensino}</dd>
                    </div>
                  )}
                </dl>
                <hr className="divider" />
                <div className="side-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setEditando(true)}
                  >
                    <Icone nome="edit" />
                    Editar turma
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-text btn-block"
                    onClick={handleDeletarTurma}
                  >
                    <Icone nome="delete" />
                    Deletar turma
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Modal Adicionar Aluno */}
      {modalAdicionarAberto && (
        <Modal titulo="Adicionar aluno" onClose={fecharModalAdicionar}>
          <label className="field">
            <span className="field-label">Nome do aluno *</span>
            <input
              type="text"
              className={`input${erroNomeAluno ? ' has-error' : ''}`}
              value={nomeAluno}
              onChange={(e) => {
                setNomeAluno(e.target.value);
                if (e.target.value.trim()) setErroNomeAluno('');
              }}
            />
            {erroNomeAluno && <span className="field-error">{erroNomeAluno}</span>}
          </label>
          <SeletorDeficiencias
            predefinidas={deficienciasPredefinidas}
            selecionadas={deficiencias}
            onToggle={handleToggleDeficiencia}
            novaDeficiencia={novaDeficiencia}
            setNovaDeficiencia={setNovaDeficiencia}
            onAdicionarPersonalizada={handleAdicionarDeficienciaPersonalizada}
          />
          <div className="modal-actions">
            <button type="button" onClick={fecharModalAdicionar} className="btn btn-text">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdicionarAluno}
              disabled={botaoAdicionarDesabilitado}
              className="btn btn-primary"
            >
              Adicionar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Editar Aluno */}
      {modalEditarAberto && alunoEditando && (
        <Modal titulo="Editar aluno" onClose={fecharModalEditar}>
          <label className="field">
            <span className="field-label">Nome do aluno *</span>
            <input
              type="text"
              className={`input${erroNomeEditando ? ' has-error' : ''}`}
              value={nomeEditandoAluno}
              onChange={(e) => {
                setNomeEditandoAluno(e.target.value);
                if (e.target.value.trim()) setErroNomeEditando('');
              }}
            />
            {erroNomeEditando && <span className="field-error">{erroNomeEditando}</span>}
          </label>
          <SeletorDeficiencias
            predefinidas={deficienciasPredefinidas}
            selecionadas={deficienciasEditando}
            onToggle={handleToggleDeficienciaEditando}
            novaDeficiencia={novaDeficienciaEditando}
            setNovaDeficiencia={setNovaDeficienciaEditando}
            onAdicionarPersonalizada={handleAdicionarDeficienciaPersonalizadaEditando}
          />
          <div className="modal-actions">
            <button type="button" onClick={fecharModalEditar} className="btn btn-text">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvarEdicaoAluno}
              disabled={botaoEditarDesabilitado}
              className="btn btn-primary"
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Upload Lista PCD */}
      {modalListaPCDAberto && (
        <Modal
          titulo="Upload da lista de alunos PCD"
          descricao="Envie uma lista de alunos PCD para cadastro automático."
          onClose={() => {
            setModalListaPCDAberto(false);
            setArquivoPCD(null);
          }}
        >
          <label className="field">
            <span className="field-label">Arquivo</span>
            <input
              type="file"
              className="file-input"
              accept=".pdf,.docx,.pptx,.xlsx,.csv"
              onChange={(e) => setArquivoPCD(e.target.files[0])}
            />
            <span className="field-hint">Formatos permitidos: PDF, DOCX, PPTX, XLSX, CSV</span>
          </label>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                setModalListaPCDAberto(false);
                setArquivoPCD(null);
              }}
              className="btn btn-text"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUploadPCD}
              disabled={!arquivoPCD || processandoPCD}
              className="btn btn-primary"
            >
              <Icone nome="upload" />
              {processandoPCD ? 'Processando...' : 'Enviar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Adicionar Aluno Já Cadastrado */}
      {modalAdicionarExistenteAberto && (
        <Modal
          titulo="Adicionar aluno já cadastrado"
          descricao="Vincule a esta turma um aluno que já está em outra turma sua."
          onClose={() => setModalAdicionarExistenteAberto(false)}
          wide
        >
          {todosAlunos.length === 0 ? (
            <p className="muted">Nenhum aluno cadastrado no sistema.</p>
          ) : alunosDisponiveis.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center' }}>
              Todos os alunos já estão nesta turma.
            </p>
          ) : (
            <div className="select-list">
              {alunosDisponiveis.map((aluno) => (
                <div key={aluno.id} className="select-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span className="avatar" aria-hidden="true">
                      {aluno.nome?.trim().charAt(0).toUpperCase()}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h4>{aluno.nome}</h4>
                      {aluno.deficiencias && <p>{aluno.deficiencias}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVincularAlunoExistente(aluno.id)}
                    className="btn btn-tonal btn-sm"
                  >
                    <Icone nome="add" />
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setModalAdicionarExistenteAberto(false)}
              className="btn btn-outline"
            >
              Fechar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/** Converte o campo de deficiências (string "a, b" ou array) em array. */
function listarDeficiencias(valor) {
  if (Array.isArray(valor)) return valor;
  if (typeof valor === 'string' && valor.trim()) {
    return valor.split(',').map((d) => d.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Seleção de deficiências com chips (estilo filter chip do Material 3)
 * + campo para adicionar uma deficiência personalizada.
 */
function SeletorDeficiencias({
  predefinidas,
  selecionadas,
  onToggle,
  novaDeficiencia,
  setNovaDeficiencia,
  onAdicionarPersonalizada,
}) {
  const personalizadas = selecionadas.filter((d) => !predefinidas.includes(d));

  return (
    <>
      <div className="field">
        <span className="field-label">Deficiências</span>
        <div className="chip-group">
          {[...predefinidas, ...personalizadas].map((def) => {
            const ativa = selecionadas.includes(def);
            return (
              <button
                key={def}
                type="button"
                className={`chip${ativa ? ' selected' : ''}`}
                aria-pressed={ativa}
                onClick={() => onToggle(def)}
              >
                {ativa && <Icone nome="check" />}
                {def}
              </button>
            );
          })}
        </div>
      </div>
      <div className="field">
        <span className="field-label">Adicionar deficiência personalizada</span>
        <div className="inline-add">
          <input
            type="text"
            className="input"
            value={novaDeficiencia}
            onChange={(e) => setNovaDeficiencia(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdicionarPersonalizada();
              }
            }}
            placeholder="Digite a deficiência"
          />
          <button type="button" onClick={onAdicionarPersonalizada} className="btn btn-tonal">
            <Icone nome="add" />
            Adicionar
          </button>
        </div>
      </div>
    </>
  );
}
