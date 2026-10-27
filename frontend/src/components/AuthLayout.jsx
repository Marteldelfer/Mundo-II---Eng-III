import logo from '../assets/logo.png';
import Icone from './Icone';

/**
 * Layout das telas públicas: no celular mostra só o formulário (como no app);
 * em telas largas adiciona um painel lateral com a identidade do AdaptEd.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-hero">
        <div className="auth-hero-brand">
          <img src={logo} alt="" />
          AdaptEd
        </div>

        <div className="auth-hero-content">
          <h2>A inclusão na sua sala de aula começa com um clique.</h2>
          <p>Organize suas turmas, acompanhe cada aluno e receba apoio para adaptar suas aulas.</p>
          <ul className="auth-hero-list">
            <li>
              <span>
                <Icone nome="group" />
              </span>
              Turmas e alunos em um só lugar
            </li>
            <li>
              <span>
                <Icone nome="insights" />
              </span>
              Acompanhamento de engajamento individual
            </li>
            <li>
              <span>
                <Icone nome="sparkle" />
              </span>
              Sugestões de atividades adaptadas
            </li>
          </ul>
        </div>

        <p className="auth-hero-footer">© {new Date().getFullYear()} AdaptEd</p>
      </aside>

      <main className="auth-panel">{children}</main>
    </div>
  );
}

