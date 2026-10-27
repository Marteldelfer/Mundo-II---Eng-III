import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Icone from './Icone';
import { obterUsuario, logout } from '../utils/auth';

/**
 * Barra superior com nome do usuário e botão de logout.
 * Reutilizável em todas as telas internas.
 */
export default function Header() {
  const usuario = obterUsuario();
  const navigate = useNavigate();
  const nome = usuario?.nome || 'usuário';
  const inicial = nome.trim().charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/landing" className="brand" aria-label="AdaptEd — início">
          <img src={logo} alt="" />
          <span>
            adapt<em>Ed</em>
          </span>
        </Link>

        <div className="topbar-user">
          <div className="topbar-greeting">
            <small>Olá,</small>
            <strong>{nome}</strong>
          </div>
          <span className="avatar" aria-hidden="true">
            {inicial}
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
            <Icone nome="logout" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
