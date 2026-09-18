import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'
import '../App.css'

export default function Landing() {
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [materia, setMateria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivoPlano, setArquivoPlano] = useState(null);
  const [erroNome, setErroNome] = useState('');

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
    setNome('');
    setMateria('');
    setDescricao('');
    setArquivoPlano(null);
    setErroNome('');
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
          body: formData,
        });
      } else {
        response = await fetch('http://127.0.0.1:8000/turmas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, materia, descricao }),
        });
      }

      if (!response.ok) {
        throw new Error('Falha no servidor');
      }

      fecharModal();
      navigate('/turma');
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const botaoDesabilitado = !nome.trim();

  return (
    <div>
    <section id="center">
                  <div className="logo">
                    <img src={logo} className="base" width="200" height="200" alt="" />
                  </div>
                  <div>
                    <h2>Parece que você não tem nenhuma turma cadastrada.</h2>
                  <br></br>
                  <button
                  style={{width: '300px', height: '75px'}}
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
};