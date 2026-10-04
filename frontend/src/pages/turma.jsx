import logo from '../assets/logo.png';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  const deficienciasPredefinidas = ['Visual', 'Auditiva', 'Física', 'Intelectual', 'Autismo', 'TDAH', 'Dislexia', 'Outra'];

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const responseTurma = await fetch(`http://127.0.0.1:8000/turmas/${id}`);
        if (!responseTurma.ok) throw new Error('Erro ao buscar a turma');
        const dadosTurma = await responseTurma.json();
        setTurma(dadosTurma);
        setNomeEditado(dadosTurma.nome);
        setMateriaEditada(dadosTurma.materia || '');
        setDescricaoEditada(dadosTurma.descricao || '');

        const responseAlunos = await fetch(`http://127.0.0.1:8000/alunos/turma/${id}`);
        if (responseAlunos.ok) {
          const dadosAlunos = await responseAlunos.json();
          setAlunos(dadosAlunos);
        }

        const responseTodos = await fetch('http://127.0.0.1:8000/alunos/');
        if (responseTodos.ok) {
          const dados = await responseTodos.json();
          setTodosAlunos(dados);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    carregarDados();
  }, [id]);

  const handleSalvar = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/turmas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEditado, materia: materiaEditada, descricao: descricaoEditada }),
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
      const response = await fetch(`http://127.0.0.1:8000/turmas/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar turma');
      navigate('/minhas-turmas');
    } catch (error) {
      alert('Erro ao deletar turma');
    }
  };

  const handleVoltar = () => navigate('/minhas-turmas');

  // --- Adicionar aluno manualmente ---
  const handleToggleDeficiencia = (def) => {
    setDeficiencias(deficiencias.includes(def) ? deficiencias.filter(d => d !== def) : [...deficiencias, def]);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeAluno, deficiencias: deficiencias.join(', ') }),
      });
      if (!response.ok) throw new Error('Erro ao criar aluno');
      const novoAluno = await response.json();

      const responseVincular = await fetch(`http://127.0.0.1:8000/alunos/vincular/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: novoAluno.id }),
      });
      if (!responseVincular.ok) throw new Error('Erro ao vincular aluno');

      setAlunos([...alunos, novoAluno]);
      setTodosAlunos([...todosAlunos, novoAluno]);
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
    
    // Normaliza deficiências (pode vir como string ou array)
    let defs = [];
    if (Array.isArray(aluno.deficiencias)) {
      defs = aluno.deficiencias;
    } else if (typeof aluno.deficiencias === 'string' && aluno.deficiencias.trim()) {
      defs = aluno.deficiencias.split(',').map(d => d.trim()).filter(Boolean);
    }
    setDeficienciasEditando(defs);
    setNovaDeficienciaEditando('');
    setErroNomeEditando('');
    setModalEditarAberto(true);
  };

  const handleToggleDeficienciaEditando = (def) => {
    setDeficienciasEditando(deficienciasEditando.includes(def) 
      ? deficienciasEditando.filter(d => d !== def) 
      : [...deficienciasEditando, def]);
  };

  const handleAdicionarDeficienciaPersonalizadaEditando = () => {
    if (novaDeficienciaEditando.trim() && !deficienciasEditando.includes(novaDeficienciaEditando.trim())) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeEditandoAluno,
          deficiencias: deficienciasEditando.join(', '),
        }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar aluno');
      const alunoAtualizado = await response.json();

      // Atualiza nas duas listas
      setAlunos(alunos.map(a => a.id === alunoAtualizado.id ? alunoAtualizado : a));
      setTodosAlunos(todosAlunos.map(a => a.id === alunoAtualizado.id ? alunoAtualizado : a));
      
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

  // --- Excluir aluno ---
  const handleExcluirAluno = async (alunoId) => {
    if (!confirm('⚠️ ATENÇÃO: Este aluno será EXCLUÍDO do sistema e removido de TODAS as turmas. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/alunos/${alunoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao excluir aluno');
      }
      setAlunos(alunos.filter(a => a.id !== alunoId));
      setTodosAlunos(todosAlunos.filter(a => a.id !== alunoId));
      alert('Aluno excluído com sucesso!');
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
      const response = await fetch(`http://127.0.0.1:8000/alunos/upload-lista-pcd/${id}`, { method: 'POST', body: formData });
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

      const responseAlunos = await fetch(`http://127.0.0.1:8000/alunos/turma/${id}`);
      if (responseAlunos.ok) setAlunos(await responseAlunos.json());

      const responseTodos = await fetch('http://127.0.0.1:8000/alunos/');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: alunoId }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || 'Erro ao vincular aluno');
        return;
      }
      const aluno = todosAlunos.find(a => a.id === alunoId);
      setAlunos([...alunos, aluno]);
      alert('Aluno vinculado com sucesso!');
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  // --- Remover aluno da turma (sem deletar) ---
  const handleRemoverAluno = async (alunoId) => {
    if (!confirm('Tem certeza que deseja remover este aluno da turma? O aluno continuará cadastrado no sistema.')) {
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/alunos/desvincular/${id}/${alunoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao remover aluno');
      }
      setAlunos(alunos.filter(a => a.id !== alunoId));
      alert('Aluno removido da turma com sucesso!');
    } catch (error) {
      alert(error.message || 'Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const handleVerAluno = (alunoId) => {
    navigate(`/aluno/${alunoId}`, { state: { turmaId: id } });
  };

  const botaoAdicionarDesabilitado = !nomeAluno.trim();
  const botaoEditarDesabilitado = !nomeEditandoAluno.trim();

  if (!turma) {
    return (
      <div>
        <section id="center">
          <div className="logo"><img src={logo} className="base" width="200" height="200" alt="" /></div>
          <p>Carregando...</p>
        </section>
      </div>
    );
  }

  return (
    <div>
      <section id="center">
        <div className="logo"><img src={logo} className="base" width="200" height="200" alt="" /></div>
        <div>
          <h2>Dashboard da turma {turma.nome}</h2>
          <br />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button style={{ width: '200px', height: '75px' }} type="button" className="purple-button" onClick={() => setModalAdicionarAberto(true)}>Adicionar Aluno</button>
            <button style={{ width: '250px', height: '75px' }} type="button" className="purple-button" onClick={() => setModalListaPCDAberto(true)}>Upload Lista PCD</button>
            <button style={{ width: '250px', height: '75px' }} type="button" className="purple-button" onClick={() => setModalAdicionarExistenteAberto(true)}>Adicionar Aluno Já Cadastrado</button>
            <button style={{ width: '150px', height: '75px' }} type="button" className="gray-button" onClick={handleVoltar}>Voltar</button>
            <button style={{ width: '150px', height: '75px' }} type="button" className="dark-gray-button" onClick={handleDeletarTurma}>Deletar Turma</button>
          </div>
        </div>
      </section>

      {/* Lista de alunos da turma */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h3>Alunos da Turma ({alunos.length})</h3>
        {alunos.length === 0 ? (
          <p style={{ color: '#666' }}>Nenhum aluno cadastrado nesta turma.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {alunos.map((aluno) => (
              <div
                key={aluno.id}
                style={{
                  border: '1px solid #6b46c1',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div 
                  onClick={() => handleVerAluno(aluno.id)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <h4 style={{ margin: '0 0 5px 0', color: '#6b46c1' }}>{aluno.nome}</h4>
                  {aluno.deficiencias && (
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      <strong>Deficiências:</strong> {aluno.deficiencias}
                    </p>
                  )}
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                    Clique para ver detalhes
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(aluno)}
                    className="purple-button"
                    style={{ height: '40px', fontSize: '13px', padding: '0 15px' }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoverAluno(aluno.id)}
                    className="gray-button"
                    style={{ height: '40px', fontSize: '13px', padding: '0 15px' }}
                  >
                    Remover
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcluirAluno(aluno.id)}
                    className="dark-gray-button"
                    style={{ height: '40px', fontSize: '13px', padding: '0 15px', backgroundColor: '#dc2626', color: '#fff' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações da turma */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {editando ? (
          <div>
            <h3>Editando Turma</h3>
            <label style={{ display: 'block', marginBottom: '15px' }}><h4>Nome:</h4><input type="text" value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label style={{ display: 'block', marginBottom: '15px' }}><h4>Matéria:</h4><input type="text" value={materiaEditada} onChange={(e) => setMateriaEditada(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label style={{ display: 'block', marginBottom: '15px' }}><h4>Descrição:</h4><textarea value={descricaoEditada} onChange={(e) => setDescricaoEditada(e.target.value)} style={{ width: '100%', padding: '8px', height: '100px' }} /></label>
            <button type="button" className="purple-button" onClick={handleSalvar} style={{ marginRight: '10px' }}>Salvar</button>
            <button type="button" className="gray-button" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        ) : (
          <div>
            <h3>Informações da Turma</h3>
            <p><strong>Nome:</strong> {turma.nome}</p>
            {turma.materia && <p><strong>Matéria:</strong> {turma.materia}</p>}
            {turma.descricao && <p><strong>Descrição:</strong> {turma.descricao}</p>}
            {turma.plano_ensino && <p><strong>Plano de Ensino:</strong> {turma.plano_ensino}</p>}
            <br />
            <button type="button" className="purple-button" onClick={() => setEditando(true)}>Editar</button>
          </div>
        )}
      </div>

      {/* Modal Adicionar Aluno */}
      {modalAdicionarAberto && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={{ marginBottom: '15px', color: '#000' }}>Adicionar Aluno</h3>
            <label style={modalStyles.label}>Nome do Aluno:<input type="text" value={nomeAluno} onChange={(e) => { setNomeAluno(e.target.value); if (e.target.value.trim()) setErroNomeAluno(''); }} style={modalStyles.input} /></label>
            {erroNomeAluno && <p style={modalStyles.erroText}>{erroNomeAluno}</p>}
            <label style={modalStyles.label}>Deficiências:
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {deficienciasPredefinidas.map((def) => (
                  <button key={def} type="button" onClick={() => handleToggleDeficiencia(def)} style={{ padding: '6px 12px', border: '1px solid #6b46c1', borderRadius: '15px', backgroundColor: deficiencias.includes(def) ? '#6b46c1' : '#fff', color: deficiencias.includes(def) ? '#fff' : '#6b46c1', cursor: 'pointer', fontSize: '13px' }}>{def}</button>
                ))}
              </div>
            </label>
            <label style={modalStyles.label}>Adicionar deficiência personalizada:
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input type="text" value={novaDeficiencia} onChange={(e) => setNovaDeficiencia(e.target.value)} style={{ ...modalStyles.input, flex: 1 }} placeholder="Digite a deficiência" />
                <button type="button" onClick={handleAdicionarDeficienciaPersonalizada} className="purple-button" style={{ height: '40px', fontSize: '13px' }}>Adicionar</button>
              </div>
            </label>
            {deficiencias.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Selecionadas:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {deficiencias.map((def) => (<span key={def} style={{ backgroundColor: '#6b46c1', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>{def}</span>))}
                </div>
              </div>
            )}
            <div style={modalStyles.buttonGroup}>
              <button type="button" onClick={fecharModalAdicionar} className="gray-button" style={modalStyles.btnCancelar}>Cancelar</button>
              <button type="button" onClick={handleAdicionarAluno} disabled={botaoAdicionarDesabilitado} className="purple-button" style={{ ...modalStyles.btnCriar, opacity: botaoAdicionarDesabilitado ? 0.5 : 1, cursor: botaoAdicionarDesabilitado ? 'not-allowed' : 'pointer' }}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Aluno */}
      {modalEditarAberto && alunoEditando && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={{ marginBottom: '15px', color: '#000' }}>Editar Aluno</h3>
            <label style={modalStyles.label}>Nome do Aluno:
              <input 
                type="text" 
                value={nomeEditandoAluno} 
                onChange={(e) => { 
                  setNomeEditandoAluno(e.target.value); 
                  if (e.target.value.trim()) setErroNomeEditando(''); 
                }} 
                style={modalStyles.input} 
              />
            </label>
            {erroNomeEditando && <p style={modalStyles.erroText}>{erroNomeEditando}</p>}
            
            <label style={modalStyles.label}>Deficiências:
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {deficienciasPredefinidas.map((def) => (
                  <button 
                    key={def} 
                    type="button" 
                    onClick={() => handleToggleDeficienciaEditando(def)} 
                    style={{ 
                      padding: '6px 12px', 
                      border: '1px solid #6b46c1', 
                      borderRadius: '15px', 
                      backgroundColor: deficienciasEditando.includes(def) ? '#6b46c1' : '#fff', 
                      color: deficienciasEditando.includes(def) ? '#fff' : '#6b46c1', 
                      cursor: 'pointer', 
                      fontSize: '13px' 
                    }}
                  >
                    {def}
                  </button>
                ))}
              </div>
            </label>
            
            <label style={modalStyles.label}>Adicionar deficiência personalizada:
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="text" 
                  value={novaDeficienciaEditando} 
                  onChange={(e) => setNovaDeficienciaEditando(e.target.value)} 
                  style={{ ...modalStyles.input, flex: 1 }} 
                  placeholder="Digite a deficiência" 
                />
                <button 
                  type="button" 
                  onClick={handleAdicionarDeficienciaPersonalizadaEditando} 
                  className="purple-button" 
                  style={{ height: '40px', fontSize: '13px' }}
                >
                  Adicionar
                </button>
              </div>
            </label>
            
            {deficienciasEditando.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Selecionadas:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {deficienciasEditando.map((def) => (
                    <span 
                      key={def} 
                      style={{ backgroundColor: '#6b46c1', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}
                    >
                      {def}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div style={modalStyles.buttonGroup}>
              <button 
                type="button" 
                onClick={fecharModalEditar} 
                className="gray-button" 
                style={modalStyles.btnCancelar}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSalvarEdicaoAluno} 
                disabled={botaoEditarDesabilitado} 
                className="purple-button" 
                style={{ 
                  ...modalStyles.btnCriar, 
                  opacity: botaoEditarDesabilitado ? 0.5 : 1, 
                  cursor: botaoEditarDesabilitado ? 'not-allowed' : 'pointer' 
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Lista PCD */}
      {modalListaPCDAberto && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={{ marginBottom: '15px', color: '#000' }}>Upload Lista de Alunos PCD</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>Envie uma lista de alunos PCD para cadastro automático.</p>
            <label style={modalStyles.label}>Arquivo:<input type="file" accept=".pdf,.docx,.pptx,.xlsx,.csv" onChange={(e) => setArquivoPCD(e.target.files[0])} style={{ ...modalStyles.input, padding: '8px' }} /></label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Formatos permitidos: PDF, DOCX, PPTX, XLSX, CSV</p>
            <div style={modalStyles.buttonGroup}>
              <button type="button" onClick={() => { setModalListaPCDAberto(false); setArquivoPCD(null); }} className="gray-button" style={modalStyles.btnCancelar}>Cancelar</button>
              <button type="button" onClick={handleUploadPCD} disabled={!arquivoPCD || processandoPCD} className="purple-button" style={{ ...modalStyles.btnCriar, opacity: !arquivoPCD || processandoPCD ? 0.5 : 1, cursor: !arquivoPCD || processandoPCD ? 'not-allowed' : 'pointer' }}>{processandoPCD ? 'Processando...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Aluno Já Cadastrado */}
      {modalAdicionarExistenteAberto && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.modal, width: '500px' }}>
            <h3 style={{ marginBottom: '15px', color: '#000' }}>Adicionar Aluno Já Cadastrado</h3>
            {todosAlunos.length === 0 ? (
              <p style={{ color: '#666' }}>Nenhum aluno cadastrado no sistema.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {todosAlunos
                  .filter(aluno => !alunos.find(a => a.id === aluno.id))
                  .map((aluno) => (
                    <div key={aluno.id} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#6b46c1' }}>{aluno.nome}</h4>
                        {aluno.deficiencias && <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{aluno.deficiencias}</p>}
                      </div>
                      <button type="button" onClick={() => handleVincularAlunoExistente(aluno.id)} className="purple-button" style={{ height: '35px', fontSize: '13px', padding: '0 15px' }}>Adicionar</button>
                    </div>
                  ))}
                {todosAlunos.filter(a => !alunos.find(x => x.id === a.id)).length === 0 && (
                  <p style={{ color: '#666', textAlign: 'center' }}>Todos os alunos já estão nesta turma.</p>
                )}
              </div>
            )}
            <div style={modalStyles.buttonGroup}>
              <button type="button" onClick={() => setModalAdicionarExistenteAberto(false)} className="gray-button" style={{ ...modalStyles.btnCancelar, width: '100%' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '8px', width: '450px', maxWidth: '90%', color: '#000000', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  label: { display: 'block', marginTop: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#000000' },
  input: { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' },
  erroText: { color: 'red', fontSize: '12px', marginTop: '4px', textAlign: 'left' },
  buttonGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '10px' },
  btnCancelar: { width: '130px', height: '45px', fontSize: '15px', padding: '0 10px', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  btnCriar: { width: '130px', height: '45px', fontSize: '15px', padding: '0 10px', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
};