import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Header from '../components/Header';
import { headersAuth, headersAuthUpload } from '../utils/auth';
import '../App.css';

export default function Landing() {
  const [modalAberto, setModalAberto] = useState(false);
  const [modoCriacao, setModoCriacao] = useState('manual');
  const [nome, setNome] = useState('');
  const [materia, setMateria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivoPlano, setArquivoPlano] = useState(null);
  const [erroNome, setErroNome] = useState('');
  const [arquivoPlanoIA, setArquivoPlanoIA] = useState(null);
  const [dadosTurmaIA, setDadosTurmaIA] = useState(null);
  const [erroNomeIA, setErroNomeIA] = useState('');
  const [analisandoPlano, setAnalisandoPlano] = useState(false);
  const navigate = useNavigate();

  const handleNomeChange = (e) => {
    const valor = e.target.value;
    setNome(valor);
    if (!valor.trim()) {
      setErroNome('Nome da turma é obrigatório');
    } else {
      setErroNome('');
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setModoCriacao('manual');
    setNome('');
    setMateria('');
    setDescricao('');
    setArquivoPlano(null);
    setErroNome('');
    setArquivoPlanoIA(null);
    setDadosTurmaIA(null);
    setErroNomeIA('');
    setAnalisandoPlano(false);
  };

  const handleCriarTurma = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErroNome('Nome da turma é obrigatório');
      return;
    }
    try {
      let response;
      if (arquivoPlano) {
        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('materia', materia);
        formData.append('descricao', descricao);
        formData.append('plano_ensino', arquivoPlano);
        response = await fetch('http://127.0.0.1:8000/turmas/upload', {
          method: 'POST',
          headers: headersAuthUpload(),
          body: formData,
        });
      } else {
        response = await fetch('http://127.0.0.1:8000/turmas', {
          method: 'POST',
          headers: headersAuth(),
          body: JSON.stringify({ nome, materia, descricao }),
        });
      }
      if (!response.ok) {
        throw new Error('Falha no servidor');
      }
      fecharModal();
      navigate('/minhas-turmas');
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const handleArquivoPlanoIA = (e) => {
    const arquivo = e.target.files[0] || null;
    setArquivoPlanoIA(arquivo);
    setDadosTurmaIA(null);
    setErroNomeIA('');
  };

  const handleAnalisarPlano = async () => {
    if (!arquivoPlanoIA) return;
    const extensao = arquivoPlanoIA.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'pptx'].includes(extensao)) {
      alert('Formato de arquivo não suportado. Envie um arquivo PDF, DOCX ou PPTX.');
      setArquivoPlanoIA(null);
      setDadosTurmaIA(null);
      return;
    }
    setAnalisandoPlano(true);
    setDadosTurmaIA(null);
    setErroNomeIA('');
    try {
      const formData = new FormData();
      formData.append('plano_ensino', arquivoPlanoIA);
      const response = await fetch('http://127.0.0.1:8000/turmas/analisar-plano', {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });
      if (!response.ok) {
        if (response.status === 400) {
          const data = await response.json();
          alert(data.detail || 'Não foi possível analisar o plano de ensino.');
          return;
        }
        throw new Error('Falha no servidor');
      }
      const dados = await response.json();
      setDadosTurmaIA(dados);
      if (!dados.nome || !dados.nome.trim()) {
        setErroNomeIA('Nome da turma é obrigatório');
      }
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    } finally {
      setAnalisandoPlano(false);
    }
  };

  const handleCriarTurmaIA = async (e) => {
    e.preventDefault();
    if (!dadosTurmaIA?.nome?.trim()) {
      setErroNomeIA('Nome da turma é obrigatório');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nome', dadosTurmaIA.nome);
      formData.append('materia', dadosTurmaIA.materia || '');
      formData.append('descricao', dadosTurmaIA.descricao || '');
      formData.append('plano_ensino', arquivoPlanoIA);
      const response = await fetch('http://127.0.0.1:8000/turmas/upload', {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Falha no servidor');
      }
      fecharModal();
      navigate('/minhas-turmas');
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const botaoDesabilitado = !nome.trim();
  const botaoCriarIADesabilitado = !dadosTurmaIA?.nome?.trim() || analisandoPlano;

  return (
    <div>
      <Header />

      <section id="center">
        <div className="logo">
          <img src={logo} className="base" width="200" height="200" alt="" />
        </div>
        <div>
          <h2>Parece que você não tem nenhuma turma cadastrada.</h2>
          <br />
          <button
            style={{ width: '300px', height: '75px' }}
            type="button"
            className="purple-button"
            onClick={() => setModalAberto(true)}
          >
            Cadastrar turma
          </button>
        </div>
      </section>

      {modalAberto && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: '15px', color: '#000' }}>Criar Turma</h3>
            <div style={styles.modoCriacao}>
              <button
                type="button"
                className={modoCriacao === 'manual' ? 'purple-button' : 'gray-button'}
                style={styles.btnModo}
                onClick={() => setModoCriacao('manual')}
              >
                Criar manualmente
              </button>
              <button
                type="button"
                className={modoCriacao === 'ia' ? 'purple-button' : 'gray-button'}
                style={styles.btnModo}
                onClick={() => setModoCriacao('ia')}
              >
                Usar plano de ensino
              </button>
            </div>
            {modoCriacao === 'manual' ? (
              <form onSubmit={handleCriarTurma}>
                <label style={styles.label}>
                  Nome da turma:
                  <input
                    type="text"
                    value={nome}
                    onChange={handleNomeChange}
                    style={styles.input}
                  />
                </label>
                {erroNome && <p style={styles.erroText}>{erroNome}</p>}
                <label style={styles.label}>
                  Matéria:
                  <input
                    type="text"
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Descrição:
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    style={{ ...styles.input, height: '70px', resize: 'none' }}
                  />
                </label>
                <label style={styles.label}>
                  Plano de ensino (opcional):
                  <input
                    type="file"
                    onChange={(e) => setArquivoPlano(e.target.files[0])}
                    style={{ ...styles.input, padding: '4px' }}
                  />
                </label>
                <div style={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="gray-button"
                    style={styles.btnCancelar}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={botaoDesabilitado}
                    className="purple-button"
                    style={{
                      ...styles.btnCriar,
                      opacity: botaoDesabilitado ? 0.5 : 1,
                      cursor: botaoDesabilitado ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Criar
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCriarTurmaIA}>
                <p style={styles.textoIA}>
                  Envie o plano de ensino para que o AdaptEd identifique os dados da turma.
                </p>
                <label style={styles.label}>
                  Plano de ensino:
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx"
                    onChange={handleArquivoPlanoIA}
                    style={{ ...styles.input, padding: '4px' }}
                  />
                </label>
                <p style={styles.arquivosPermitidos}>Arquivos permitidos: PDF, DOCX e PPTX.</p>
                {!dadosTurmaIA && (
                  <button
                    type="button"
                    onClick={handleAnalisarPlano}
                    disabled={!arquivoPlanoIA || analisandoPlano}
                    className="purple-button"
                    style={{
                      ...styles.btnAnalisar,
                      opacity: !arquivoPlanoIA || analisandoPlano ? 0.5 : 1,
                      cursor: !arquivoPlanoIA || analisandoPlano ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {analisandoPlano ? 'Analisando...' : 'Analisar plano'}
                  </button>
                )}
                {dadosTurmaIA && (
                  <div style={styles.resultadoIA}>
                    <p style={styles.resultadoTitulo}>Dados identificados:</p>
                    <label style={styles.label}>
                      Nome da turma:
                      <input
                        type="text"
                        value={dadosTurmaIA.nome || ''}
                        readOnly
                        style={styles.input}
                      />
                    </label>
                    {erroNomeIA && <p style={styles.erroText}>{erroNomeIA}</p>}
                    <label style={styles.label}>
                      Matéria:
                      <input
                        type="text"
                        value={dadosTurmaIA.materia || ''}
                        readOnly
                        style={styles.input}
                      />
                    </label>
                    <label style={styles.label}>
                      Descrição:
                      <textarea
                        value={dadosTurmaIA.descricao || ''}
                        readOnly
                        style={{ ...styles.input, height: '70px', resize: 'none' }}
                      />
                    </label>
                  </div>
                )}
                <div style={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="gray-button"
                    style={styles.btnCancelar}
                  >
                    Cancelar
                  </button>
                  {dadosTurmaIA && (
                    <button
                      type="submit"
                      disabled={botaoCriarIADesabilitado}
                      className="purple-button"
                      style={{
                        ...styles.btnCriar,
                        opacity: botaoCriarIADesabilitado ? 0.5 : 1,
                        cursor: botaoCriarIADesabilitado ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Criar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%',
    color: '#000000',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  label: {
    display: 'block',
    marginTop: '10px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#000000',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  erroText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '4px',
    textAlign: 'left',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    gap: '10px',
  },
  btnCancelar: {
    width: '130px',
    height: '45px',
    fontSize: '15px',
    padding: '0 10px',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCriar: {
    width: '130px',
    height: '45px',
    fontSize: '15px',
    padding: '0 10px',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modoCriacao: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  btnModo: {
    flex: 1,
    minHeight: '45px',
    fontSize: '14px',
    padding: '5px 8px',
    marginBottom: 0,
  },
  textoIA: {
    fontSize: '14px',
    textAlign: 'left',
    color: '#000000',
    margin: '5px 0 10px',
  },
  arquivosPermitidos: {
    fontSize: '12px',
    textAlign: 'left',
    color: '#555555',
    marginTop: '5px',
  },
  btnAnalisar: {
    width: '100%',
    minHeight: '45px',
    fontSize: '15px',
    marginTop: '15px',
    marginBottom: 0,
  },
  resultadoIA: {
    marginTop: '15px',
    paddingTop: '5px',
    borderTop: '1px solid #dddddd',
  },
  resultadoTitulo: {
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000000',
    marginBottom: '5px',
  },
};