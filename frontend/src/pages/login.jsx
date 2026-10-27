import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import AuthLayout from '../components/AuthLayout';
import { salvarAutenticacao } from '../utils/auth';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');

    try {
      const response = await fetch('http://127.0.0.1:8000/usuarios/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();

      if (!response.ok) {
        // FastAPI pode retornar detail como string OU array
        const detalhe = Array.isArray(data.detail)
          ? data.detail[0]
          : data.detail;
        setMensagem(detalhe || 'Erro ao realizar login');
        return;
      }

      // ✅ Salva token JWT + dados do usuário em cookies
      salvarAutenticacao(data.token, data.usuario);

      // Redireciona para a área protegida
      navigate('/landing');
    } catch (error) {
      setMensagem('Erro de conexão com o servidor.');
    }
  };

  // FastAPI pode devolver um objeto de validação em vez de string
  const textoMensagem = typeof mensagem === 'string' ? mensagem : mensagem?.msg;

  return (
    <AuthLayout>
      <div className="auth-card">
        <Link to="/" aria-label="Voltar ao início">
          <img src={logo} className="auth-logo" alt="AdaptEd" />
        </Link>
        <h1>Entrar</h1>
        <p className="subtitle">Que bom ter você de volta!</p>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">E-mail</span>
            <input
              className="input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="seuemail@escola.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Senha</span>
            <input
              className="input"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>

          {textoMensagem && <p className="alert alert-error">{textoMensagem}</p>}

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            Entrar
          </button>
        </form>

        <p className="auth-switch">
          Não possui uma conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
