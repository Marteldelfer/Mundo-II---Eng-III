import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Icone from '../components/Icone';
import Carregando from '../components/Carregando';
import CriarTurmaModal from '../components/CriarTurmaModal';
import { headersAuth } from '../utils/auth';
import '../App.css';

export default function MinhasTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const carregarTurmas = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/turmas/', {
          headers: headersAuth(),
        });
        if (response.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        if (!response.ok) {
          throw new Error('Erro ao buscar turmas');
        }
        const dados = await response.json();
        setTurmas(dados);
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarTurmas();
  }, [navigate]);

  if (carregando) {
    return (
      <>
        <Header />
        <Carregando texto="Carregando turmas..." />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="page">
        <div className="page-header">
          <div>
            <span className="eyebrow">Painel</span>
            <h1>Minhas turmas</h1>
            <p>
              {turmas.length === 1
                ? 'Você tem 1 turma cadastrada.'
                : `Você tem ${turmas.length} turmas cadastradas.`}
            </p>
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalAberto(true)}
            >
              <Icone nome="add" />
              Cadastrar nova turma
            </button>
          </div>
        </div>

        <div className="turmas-grid">
          {turmas.map((turma) => (
            <button
              key={turma.id}
              type="button"
              className="turma-card"
              onClick={() => navigate(`/turma/${turma.id}`)}
            >
              <span className="turma-card-icon">
                <Icone nome="school" />
              </span>
              <div>
                <h3>{turma.nome}</h3>
                {turma.materia && (
                  <span className="tag" style={{ marginTop: 6 }}>
                    {turma.materia}
                  </span>
                )}
              </div>
              {turma.descricao && <p>{turma.descricao}</p>}
              <span className="open-hint">
                Abrir turma
                <Icone nome="arrowForward" />
              </span>
            </button>
          ))}

          <button
            type="button"
            className="turma-card add-new"
            onClick={() => setModalAberto(true)}
          >
            <span className="turma-card-icon">
              <Icone nome="add" />
            </span>
            Nova turma
          </button>
        </div>
      </main>

      {modalAberto && (
        <CriarTurmaModal
          onClose={() => setModalAberto(false)}
          onCriada={(turmaCriada) => {
            setModalAberto(false);
            navigate(`/turma/${turmaCriada.id}`);
          }}
        />
      )}
    </>
  );
}
