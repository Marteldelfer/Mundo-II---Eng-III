import { Navigate, useLocation } from 'react-router-dom';
import { estaAutenticado } from '../utils/auth';

/**
 * Wrapper que protege rotas:
 * - Se o usuário NÃO está autenticado → redireciona para /login.
 * - Se está → renderiza o conteúdo.
 *
 * Usa `replace` para não poluir o histórico do navegador.
 */
export default function RotaProtegida({ children }) {
  const location = useLocation();

  if (!estaAutenticado()) {
    // Guarda a rota que ele tentou acessar para redirecionar depois do login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}