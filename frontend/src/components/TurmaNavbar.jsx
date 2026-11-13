import { useNavigate } from 'react-router-dom';
import Icone from './Icone';

export default function TurmaNavbar({ turmaId, abaAtiva = 'alunos' }) {
  const navigate = useNavigate();

  return (
    <nav className="turma-navbar" aria-label="Navbar da turma">
      <div className="turma-navbar-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'alunos'}
          className={`turma-navbar-tab${abaAtiva === 'alunos' ? ' active' : ''}`}
          onClick={() => navigate(`/turma/${turmaId}`)}
        >
          <Icone nome="group" />
          Alunos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'atividades'}
          className={`turma-navbar-tab${abaAtiva === 'atividades' ? ' active' : ''}`}
          onClick={() => navigate(`/turma/${turmaId}/atividades`)}
        >
          <Icone nome="description" />
          Atividades
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'chat'}
          className={`turma-navbar-tab${abaAtiva === 'chat' ? ' active' : ''}`}
          onClick={() => navigate(`/turma/${turmaId}/chat`)}
        >
          <Icone nome="sparkle" />
          Chat AdaptEd
        </button>
      </div>
    </nav>
  );
}