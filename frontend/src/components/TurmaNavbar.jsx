import { useNavigate } from 'react-router-dom';
import Icone from './Icone';

/**
 * Menu Navbar exibido no topo da página da turma para alternar
 * entre o painel da turma (Alunos) e a aba de Atividades.
 */
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
      </div>
    </nav>
  );
}
