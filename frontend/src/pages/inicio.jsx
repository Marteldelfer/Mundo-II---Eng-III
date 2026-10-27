import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import AuthLayout from '../components/AuthLayout';
import '../App.css';

/** Tela inicial pública (boas-vindas). */
export default function Inicio() {
  return (
    <AuthLayout>
      <div className="auth-card welcome">
        <img src={logo} className="auth-logo" alt="AdaptEd" />
        <h1>Bem-vindo ao AdaptEd.</h1>
        <p className="subtitle">A inclusão na sua sala de aula começa com um clique.</p>
        <div className="welcome-actions">
          <Link to="/cadastro" className="btn btn-primary btn-lg btn-block">
            Criar conta
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg btn-block">
            Entrar
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

