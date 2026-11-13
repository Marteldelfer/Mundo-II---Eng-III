import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { headersAuth } from '../utils/auth';
import Icone from '../components/Icone';
import Carregando from '../components/Carregando';
import AdaptarAtividadeModal from '../components/AdaptarAtividadeModal';
import ChatIA from '../components/ChatIA';
import Modal from '../components/Modal';
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
  const [modalAtividadeAberto, setModalAtividadeAberto] = useState(false);
  const [atividadesAdaptadas, setAtividadesAdaptadas] = useState([]);
  const [modalChatAberto, setModalChatAberto] = useState(false);

  const turmaId = location.state?.turmaId || null;
  const [turmaSelecionada, setTurmaSelecionada] = useState(turmaId);

  useEffect(() => {
    const carregarDados = async () => {
      if (!turmaSelecionada) {
        try {
          const responseAluno = await fetch(`http://127.0.0.1:8000/alunos/${id}`, { headers: headersAuth() });
          if (responseAluno.status === 401) { navigate('/login', { replace: true }); return; }
          if (!responseAluno.ok) throw new Error('Erro ao buscar aluno');
          setAluno(await responseAluno.json());
        } catch (error) { setMensagem(`Erro: ${error.message}`); }
        return;
      }

      try {
        const responseAluno = await fetch(`http://127.0.0.1:8000/alunos/${id}/turma/${turmaSelecionada}`, { headers: headersAuth() });
        if (responseAluno.status === 401) { navigate('/login', { replace: true }); return; }
        if (!responseAluno.ok) throw new Error('Erro ao buscar aluno');
        
        const dadosAluno = await responseAluno.json();
        setAluno(dadosAluno);
        setEngajamento(Number(dadosAluno.engajamento) || 0);

        const responseObs = await fetch(`http://127.0.0.1:8000/observacoes/aluno/${id}/turma/${turmaSelecionada}`, { headers: headersAuth() });
        if (responseObs.ok) {
          const dadosObs = await responseObs.json();
          setObservacoes(Array.isArray(dadosObs) ? dadosObs : []);
        }

        const chaveStorage = `adapted_atividades_${id}_${turmaSelecionada}`;
        const salvasLocal = JSON.parse(localStorage.getItem(chaveStorage) || '[]');
        try {
          const responseAtiv = await fetch(`http://127.0.0.1:8000/atividades/aluno/${id}/turma/${turmaSelecionada}`, { headers: headersAuth() });
          if (responseAtiv.ok) {
            const dadosAtiv = await responseAtiv.json();
            setAtividadesAdaptadas(Array.isArray(dadosAtiv) ? dadosAtiv : salvasLocal);
          } else { setAtividadesAdaptadas(salvasLocal); }
        } catch { setAtividadesAdaptadas(salvasLocal); }
      } catch (error) { setMensagem(`Erro: ${error.message}`); }
    };
    carregarDados();
  }, [id, turmaSelecionada, navigate]);

  const handleSalvarObservacao = async () => {
    if (!novaObservacao.trim()) { setMensagem('Texto da observação é obrigatório'); return; }
    setSalvando(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/observacoes/', {
        method: 'POST', headers: headersAuth(),
        body: JSON.stringify({ aluno_id: parseInt(id), turma_id: parseInt(turmaSelecionada), texto: novaObservacao }),
      });
      if (!response.ok) throw new Error('Erro ao salvar observação');
      const novaObs = await response.json();
      setObservacoes([novaObs, ...observacoes]);
      setNovaObservacao('');
      setMensagem('Observação salva com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) { setMensagem(`Erro: ${error.message}`); } finally { setSalvando(false); }
  };

  const handleEditarObservacao = (obs) => { setEditandoId(obs.id); setTextoEditado(obs.texto); };
  const handleCancelarEdicao = () => { setEditandoId(null); setTextoEditado(''); };

  const handleSalvarEdicao = async (obsId) => {
    if (!textoEditado.trim()) { setMensagem('Texto da observação é obrigatório'); return; }
    setSalvando(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/observacoes/${obsId}`, {
        method: 'PUT', headers: headersAuth(), body: JSON.stringify({ texto: textoEditado }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar observação');
      const obsAtualizada = await response.json();
      setObservacoes(observacoes.map((obs) => (obs.id === obsId ? obsAtualizada : obs)));
      setEditandoId(null); setTextoEditado('');
      setMensagem('Observação atualizada com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) { setMensagem(`Erro: ${error.message}`); } finally { setSalvando(false); }
  };

  const handleDeletarObservacao = async (obsId) => {
    if (!confirm('Tem certeza que deseja excluir esta observação?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/observacoes/${obsId}`, { method: 'DELETE', headers: headersAuth() });
      if (!response.ok) throw new Error('Erro ao deletar observação');
      setObservacoes(observacoes.filter((obs) => obs.id !== obsId));
      setMensagem('Observação excluída com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) { setMensagem(`Erro: ${error.message}`); }
  };

  const handleSalvarEngajamento = async () => {
    if (!turmaSelecionada) return;
    setSalvandoEngajamento(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/alunos/${id}`, {
        method: 'PUT', headers: headersAuth(),
        body: JSON.stringify({ turma_id: parseInt(turmaSelecionada), engajamento: parseFloat(engajamento) }),
      });
      if (!response.ok) throw new Error('Erro ao salvar engajamento');
      setMensagem('Engajamento atualizado com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) { setMensagem(`Erro: ${error.message}`); } finally { setSalvandoEngajamento(false); }
  };

  const handleAtividadeAdaptada = (novaAtividade) => {
    setAtividadesAdaptadas((anteriores) => {
      const atualizadas = [novaAtividade, ...anteriores];
      const paraSalvar = atualizadas.map(({ download_url: _downloadUrl, ...resto }) => resto);
      localStorage.setItem(`adapted_atividades_${id}_${turmaSelecionada}`, JSON.stringify(paraSalvar));
      return atualizadas;
    });
    setMensagem('Atividade adaptada e salva com sucesso!');
    setTimeout(() => setMensagem(''), 3000);
  };

  const handleBaixarAtividadeSalva = async (atividade) => {
    if (atividade.download_url) {
      if (!atividade.download_url.startsWith('blob:')) {
        try {
          const response = await fetch(atividade.download_url, { headers: headersAuth() });
          if (!response.ok) throw new Error('Erro');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url; link.download = atividade.nome_arquivo || 'atividade_adaptada';
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        } catch { setMensagem('Erro ao baixar atividade.'); return; }
      }
      const link = document.createElement('a');
      link.href = atividade.download_url; link.download = atividade.nome_arquivo || 'atividade_adaptada';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      return;
    }
  };

  const handleVoltar = () => {
    if (turmaSelecionada) navigate(`/turma/${turmaSelecionada}`);
    else navigate('/minhas-turmas');
  };

  const engajamentoCor = (v) => v >= 70 ? '#22a06b' : v >= 40 ? '#f5a524' : '#e5484d';

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
            <button type="button" className="back-link" onClick={handleVoltar}><Icone nome="arrowBack" /> Voltar</button>
            <p className="alert alert-error">{mensagem}</p>
          </main>
        ) : <Carregando />}
      </>
    );
  }

  const iniciais = aluno.nome?.trim().charAt(0).toUpperCase();

  if (!turmaSelecionada) {
    const vinculos = aluno.vinculos || [];
    return (
      <>
        <Header />
        <main className="page page-narrow">
          <button type="button" className="back-link" onClick={handleVoltar}><Icone nome="arrowBack" /> Voltar</button>
          <div className="aluno-header">
            <span className="avatar">{iniciais}</span>
            <div className="aluno-header-info">
              <h1>Selecione uma turma</h1>
              <p className="muted" style={{ marginTop: 6 }}>As informações de <strong>{aluno.nome}</strong> são específicas por turma.</p>
            </div>
          </div>
          {vinculos.length === 0 ? (
            <div className="empty-state"><Icone nome="school" /><p>Este aluno não está em nenhuma turma.</p></div>
          ) : (
            <div className="turma-select-grid">
              {vinculos.map((v) => (
                <button key={v.turma_id} type="button" className="turma-card" onClick={() => setTurmaSelecionada(v.turma_id)}>
                  <span className="turma-card-icon"><Icone nome="school" /></span>
                  <h3>{v.turma_nome}</h3>
                  <span className="open-hint">Ver nesta turma <Icone nome="arrowForward" /></span>
                </button>
              ))}
            </div>
          )}
        </main>
      </>
    );
  }

  const statusEngajamento = engajamento >= 70
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
          <Icone nome="arrowBack" /> {aluno.turma_nome ? `Voltar para ${aluno.turma_nome}` : 'Voltar'}
        </button>

        <div className="aluno-header">
          <span className="avatar">{iniciais}</span>
          <div className="aluno-header-info">
            <span className="eyebrow">Perfil do aluno{aluno.turma_nome ? ` · ${aluno.turma_nome}` : ''}</span>
            <h1>{aluno.nome}</h1>
            {deficienciasLista.length > 0 && (
              <div className="chip-group">
                {deficienciasLista.map((def, index) => <span key={index} className="tag">{def}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="aluno-grid">
          <div>
            <section className="card">
              <h3 className="card-title"><Icone nome="insights" /> Nível de engajamento</h3>
              <div className="engajamento-valor"><strong>{Number(engajamento).toFixed(0)}%</strong> <span className="muted">nesta turma</span></div>
              <div className="progress" role="progressbar" aria-valuenow={Number(engajamento)} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${engajamento}%`, backgroundColor: engajamentoCor(engajamento) }} />
              </div>
              <span className="status-pill" style={{ background: statusEngajamento.bg, color: statusEngajamento.fg }}>{statusEngajamento.texto}</span>
              <div className="engajamento-controle">
                <input type="range" className="range" min="0" max="100" step="1" value={engajamento} onChange={(e) => setEngajamento(Number(e.target.value))} />
                <button type="button" onClick={handleSalvarEngajamento} disabled={salvandoEngajamento} className="btn btn-tonal btn-sm">
                  {salvandoEngajamento ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </section>

            <section className="card sugestao-card">
              <h3 className="card-title"><Icone nome="sparkle" style={{ color: '#fff' }} /> Atividades adaptadas</h3>
              <p>Adapte atividades de acordo com as deficiências e anotações do aluno.</p>
              <button type="button" onClick={() => setModalAtividadeAberto(true)} className="btn btn-block"><Icone nome="add" /> Adicionar atividade</button>
            </section>

            <section className="card" style={{ marginTop: 20 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <h3 className="card-title" style={{ marginBottom: 0 }}><Icone nome="description" /> Atividades salvas <span className="count-badge">{atividadesAdaptadas.length}</span></h3>
              </div>
              {atividadesAdaptadas.length === 0 ? (
                <p className="muted" style={{ fontSize: 14 }}>Nenhuma atividade adaptada salva ainda para este aluno.</p>
              ) : (
                <div className="atividades-salvas-list">
                  {atividadesAdaptadas.map((ativ) => (
                    <div key={ativ.id} className="atividade-salva-item">
                      <div className="atividade-salva-info">
                        <h4>{ativ.nome_arquivo || ativ.nome_original}</h4>
                        {ativ.data_criacao && <p className="obs-meta">{ativ.data_criacao}</p>}
                      </div>
                      <button type="button" onClick={() => handleBaixarAtividadeSalva(ativ)} className="btn btn-tonal btn-sm"><Icone nome="download" /> Baixar</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Observações do professor */}
          <section className="card">
            <h3 className="card-title"><Icone nome="notes" /> Minhas observações</h3>
            <div className="obs-form">
              <textarea className="textarea" value={novaObservacao} onChange={(e) => setNovaObservacao(e.target.value)} placeholder="Adicione uma nova observação..." />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleSalvarObservacao} disabled={salvando} className="btn btn-primary"><Icone nome="add" /> {salvando ? 'Salvando...' : 'Adicionar observação'}</button>
              </div>
            </div>

            {mensagem && <p className={`alert ${mensagemSucesso ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 16 }}>{mensagem}</p>}

            {observacoes.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 20 }}><Icone nome="notes" /><p>Você ainda não registrou nenhuma observação sobre este aluno nesta turma.</p></div>
            ) : (
              <div className="obs-list">
                {observacoes.map((obs) => (
                  <article key={obs.id} className="obs-item">
                    <div className="obs-item-header">
                      <p className="obs-meta">Criada em {obs.data_criacao}{obs.data_edicao && <> · Editada em {obs.data_edicao}</>}</p>
                      {editandoId !== obs.id && (
                        <div style={{ display: 'flex' }}>
                          <button type="button" onClick={() => handleEditarObservacao(obs)} className="icon-btn"><Icone nome="edit" /></button>
                          <button type="button" onClick={() => handleDeletarObservacao(obs.id)} className="icon-btn danger"><Icone nome="delete" /></button>
                        </div>
                      )}
                    </div>
                    {editandoId === obs.id ? (
                      <div>
                        <textarea className="textarea" value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} />
                        <div className="obs-edit-actions">
                          <button type="button" onClick={handleCancelarEdicao} className="btn btn-text btn-sm">Cancelar</button>
                          <button type="button" onClick={() => handleSalvarEdicao(obs.id)} disabled={salvando} className="btn btn-primary btn-sm">Salvar</button>
                        </div>
                      </div>
                    ) : <p className="obs-texto">{obs.texto}</p>}
                  </article>
                ))}
              </div>
            )}

            {/* 👈 BOTÃO DO CHAT AQUI (ABAIXO DAS OBSERVAÇÕES) */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ marginBottom: 8, fontSize: 16 }}>Precisa de ajuda com este aluno?</h4>
              <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>Use a IA para tirar dúvidas sobre adaptações específicas para {aluno.nome.split(' ')[0]}.</p>
              <button type="button" className="btn btn-tonal btn-block" onClick={() => setModalChatAberto(true)}>
                <Icone nome="sparkle" /> Conversar com a IA sobre {aluno.nome.split(' ')[0]}
              </button>
            </div>
          </section>
        </div>
      </main>

      {modalAtividadeAberto && (
        <AdaptarAtividadeModal aluno={aluno} turmaId={turmaSelecionada} deficiencias={deficienciasLista} observacoes={observacoes} onClose={() => setModalAtividadeAberto(false)} onAtividadeAdaptada={handleAtividadeAdaptada} />
      )}

      {modalChatAberto && (
        <Modal titulo={`Chat AdaptEd · ${aluno.nome}`} onClose={() => setModalChatAberto(false)} wide>
          <ChatIA turmaId={turmaSelecionada} alunoId={aluno.id} nomeContexto={`o aluno ${aluno.nome.split(' ')[0]}`} />
        </Modal>
      )}
    </>
  );
}