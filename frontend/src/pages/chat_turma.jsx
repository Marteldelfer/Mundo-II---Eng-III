import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TurmaNavbar from '../components/TurmaNavbar';
import ChatIA from '../components/ChatIA';
import Carregando from '../components/Carregando';
import { headersAuth } from '../utils/auth';
import Icone from '../components/Icone';
import '../App.css';

export default function ChatTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turma, setTurma] = useState(null);

  useEffect(() => {
    const fetchTurma = async () => {
      const res = await fetch(`http://127.0.0.1:8000/turmas/${id}`, { headers: headersAuth() });
      if (res.ok) setTurma(await res.json());
      else navigate('/minhas-turmas');
    };
    fetchTurma();
  }, [id, navigate]);

  if (!turma) return <><Header /><Carregando /></>;

  return (
    <>
      <Header />
      <main className="page">
        <button type="button" className="back-link" onClick={() => navigate('/minhas-turmas')}>
          <Icone nome="arrowBack" /> Minhas turmas
        </button>
        
        <TurmaNavbar turmaId={id} abaAtiva="chat" />
        
        <div className="page-header">
          <div>
            <span className="eyebrow">Assistente Pedagógico</span>
            <h1>Chat AdaptEd · {turma.nome}</h1>
            <p>Converse com a IA sobre adaptações e estratégias para a sua turma.</p>
          </div>
        </div>

        <ChatIA turmaId={id} nomeContexto={`a turma ${turma.nome}`} />
      </main>
    </>
  );
}