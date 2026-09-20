import logo from '../assets/logo.png';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

  const turmaOrigemId = location.state?.turmaId || null;
  const professorId = localStorage.getItem('userId'); //  ID do professor logado

  useEffect(() => {
    const carregarDados = async () => {
      if (!professorId) {
        navigate('/login');
        return;
      }

      try {
        const responseAluno = await fetch(`http://127.0.0.1:8000/alunos/${id}`);
        if (!responseAluno.ok) {
          const data = await responseAluno.json().catch(() => ({}));
          throw new Error(data.detail || 'Erro ao buscar aluno');
        }
        const dadosAluno = await responseAluno.json();
        setAluno(dadosAluno);

        // 👈 Agora passa professor_id na query
        const responseObs = await fetch(
          `http://127.0.0.1:8000/observacoes/aluno/${id}?professor_id=${professorId}`
        );
        if (responseObs.ok) {
          const dadosObs = await responseObs.json();
          setObservacoes(dadosObs);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMensagem(`Erro: ${error.message}`);
      }
    };
    carregarDados();
  }, [id, professorId, navigate]);

  const handleSalvarObservacao = async () => {
    if (!novaObservacao.trim()) {
      setMensagem('Texto da observação é obrigatório');
      return;
    }
    setSalvando(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/observacoes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: parseInt(id),
          professor_id: parseInt(professorId),
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
      // 👈 Agora passa professor_id na query
      const response = await fetch(
        `http://127.0.0.1:8000/observacoes/${obsId}?professor_id=${professorId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: textoEditado }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao atualizar observação');
      }
      const obsAtualizada = await response.json();
      setObservacoes(observacoes.map(obs => obs.id === obsId ? obsAtualizada : obs));
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
      // 👈 Agora passa professor_id na query
      const response = await fetch(
        `http://127.0.0.1:8000/observacoes/${obsId}?professor_id=${professorId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao deletar observação');
      }
      setObservacoes(observacoes.filter(obs => obs.id !== obsId));
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

  const handleSugerirAtividades = () => {
    alert('Funcionalidade será implementada na próxima sprint!');
  };

  const handleVoltar = () => {
    if (turmaOrigemId) {
      navigate(`/turma/${turmaOrigemId}`);
    } else {
      navigate('/minhas-turmas');
    }
  };

  const engajamento = typeof aluno?.engajamento === 'number' ? aluno.engajamento : 0;
  const engajamentoCor = () => {
    if (engajamento >= 70) return '#4ade80';
    if (engajamento >= 40) return '#fbbf24';
    return '#f87171';
  };

  const deficienciasLista = (() => {
    if (Array.isArray(aluno?.deficiencias)) return aluno.deficiencias;
    if (typeof aluno?.deficiencias === 'string' && aluno?.deficiencias.trim()) {
      return aluno.deficiencias.split(',').map(d => d.trim()).filter(Boolean);
    }
    return [];
  })();

  if (!aluno) {
    return (
      <div>
        <section id="center">
          <div className="logo"><img src={logo} className="base" width="200" height="200" alt="" /></div>
          {mensagem ? <p style={{ color: 'red', fontWeight: 'bold' }}>{mensagem}</p> : <p>Carregando...</p>}
        </section>
      </div>
    );
  }

  return (
    <div>
      <section id="center">
        <div className="logo"><img src={logo} className="base" width="200" height="200" alt="" /></div>
        <div>
          <h2>Perfil do Aluno</h2>
          <br />
          <button style={{ width: '150px', height: '75px' }} type="button" className="gray-button" onClick={handleVoltar}>Voltar</button>
        </div>
      </section>

      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Informações básicas */}
        <div style={{ backgroundColor: '#fff', border: '2px solid #6b46c1', borderRadius: '8px', padding: '25px', marginBottom: '20px' }}>
          <h3 style={{ color: '#6b46c1', marginTop: 0 }}>Informações do Aluno</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Nome:</h4>
            <p style={{ margin: 0, fontSize: '16px' }}>{aluno.nome}</p>
          </div>

          {deficienciasLista.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Deficiência(s):</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {deficienciasLista.map((def, index) => (
                  <span key={index} style={{ backgroundColor: '#6b46c1', color: '#fff', padding: '6px 12px', borderRadius: '15px', fontSize: '14px' }}>{def}</span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(aluno.turmas) && aluno.turmas.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Turmas:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {aluno.turmas.map((turma) => (
                  <span key={turma.id} style={{ backgroundColor: '#e9d5ff', color: '#6b46c1', padding: '6px 12px', borderRadius: '15px', fontSize: '14px', border: '1px solid #6b46c1' }}>{turma.nome}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Nível de Engajamento: {engajamento.toFixed(1)}%</h4>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#e5e7eb', borderRadius: '15px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${engajamento}%`, height: '100%', backgroundColor: engajamentoCor(), transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: engajamento > 50 ? '#fff' : '#333', fontWeight: 'bold', fontSize: '14px' }}>
                {engajamento > 10 && `${engajamento.toFixed(0)}%`}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {engajamento >= 70 ? 'Aluno altamente engajado' : engajamento >= 40 ? 'Aluno com engajamento moderado' : 'Aluno precisa de mais atenção'}
            </p>
          </div>
        </div>

        {/* Observações do professor */}
        <div style={{ backgroundColor: '#fff', border: '2px solid #6b46c1', borderRadius: '8px', padding: '25px', marginBottom: '20px' }}>
          <h3 style={{ color: '#6b46c1', marginTop: 0 }}>Minhas Observações</h3>
          
          {/* Adicionar nova observação */}
          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={novaObservacao}
              onChange={(e) => setNovaObservacao(e.target.value)}
              placeholder="Adicione uma nova observação sobre o desempenho do aluno..."
              style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={handleSalvarObservacao}
              disabled={salvando}
              className="purple-button"
              style={{ marginTop: '10px', opacity: salvando ? 0.6 : 1, cursor: salvando ? 'not-allowed' : 'pointer' }}
            >
              {salvando ? 'Salvando...' : 'Adicionar Observação'}
            </button>
          </div>

          {mensagem && (
            <p style={{ color: mensagem.includes('sucesso') ? '#4ade80' : '#f87171', fontWeight: 'bold', marginBottom: '15px' }}>
              {mensagem}
            </p>
          )}

          {/* Lista de observações */}
          {observacoes.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>Você ainda não registrou nenhuma observação sobre este aluno.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {observacoes.map((obs) => (
                <div
                  key={obs.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      <strong>Criada em:</strong> {obs.data_criacao}
                      {obs.data_edicao && <span style={{ marginLeft: '10px' }}><strong>Editada em:</strong> {obs.data_edicao}</span>}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleEditarObservacao(obs)}
                        className="purple-button"
                        style={{ height: '30px', fontSize: '12px', padding: '0 12px' }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletarObservacao(obs.id)}
                        className="dark-gray-button"
                        style={{ height: '30px', fontSize: '12px', padding: '0 12px' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  {editandoId === obs.id ? (
                    <div>
                      <textarea
                        value={textoEditado}
                        onChange={(e) => setTextoEditado(e.target.value)}
                        style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleSalvarEdicao(obs.id)}
                          disabled={salvando}
                          className="purple-button"
                          style={{ height: '30px', fontSize: '12px', padding: '0 12px' }}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelarEdicao}
                          className="gray-button"
                          style={{ height: '30px', fontSize: '12px', padding: '0 12px' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap' }}>{obs.texto}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão sugerir atividades */}
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={handleSugerirAtividades} className="purple-button" style={{ width: '300px', height: '75px', fontSize: '16px' }}>
            Sugerir Atividades Adaptadas
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Sugira atividades baseadas nas deficiências e observações do aluno
          </p>
        </div>
      </div>
    </div>
  );
}