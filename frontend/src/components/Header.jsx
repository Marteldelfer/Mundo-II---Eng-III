import { useNavigate } from 'react-router-dom';
import { obterUsuario, logout } from '../utils/auth';

/**
 * Barra superior com nome do usuário e botão de logout.
 * Reutilizável em todas as telas internas.
 */
export default function Header() {
  const usuario = obterUsuario();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '1px solid #ddd',
      }}
    >
      <span style={{ fontWeight: 'bold' }}>
        Olá, {usuario?.nome || 'usuário'}
      </span>
      <button
        type="button"
        className="gray-button"
        style={{ width: '120px', height: '40px' }}
        onClick={handleLogout}
      >
        Sair
      </button>
    </header>
  );
}