import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import AuthLayout from '../components/AuthLayout';
import { salvarAutenticacao } from '../utils/auth';
import '../App.css';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  let erroValidacao = '';
  let botaoDesabilitado = false;

  if (senha.length < 8) {
    erroValidacao = 'A senha deve ter pelo menos 8 caracteres';
    botaoDesabilitado = true;
  } else if (senha.length > 72) {
    erroValidacao = 'A senha deve ter no máximo 72 caracteres';
    botaoDesabilitado = true;
  } else if (!/[A-Z]/.test(senha)) {
    erroValidacao = 'A senha deve ter pelo menos uma letra maiúscula';
    botaoDesabilitado = true;
  } else if (!/[^a-zA-Z0-9]/.test(senha)) {
    erroValidacao = 'A senha deve ter pelo menos um caractere especial';
    botaoDesabilitado = true;
  }

  if (!nome || !email || !senha || !confirmarSenha) {
    botaoDesabilitado = true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setSucesso(false);

    if (senha !== confirmarSenha) {
      setMensagem('As senhas não coincidem!');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/usuarios/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await response.json();

      if (!response.ok) {
        // FastAPI pode retornar detail como string OU array
        const detalhe = Array.isArray(data.detail)
          ? data.detail[0]
          : data.detail;
        setMensagem(detalhe || 'Erro ao cadastrar');
        return;
      }

      // ✅ Auto-login: salva token JWT + dados do usuário
      salvarAutenticacao(data.token, {
        id: data.id,
        nome: data.nome,
        email: data.email,
      });

      setSucesso(true);
      setMensagem('Cadastro realizado com sucesso!');
      setTimeout(() => {
        navigate('/landing');
      }, 1500);
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
          <img src={logo} className="auth-logo" alt="AdaptEd" style={{ width: 104, height: 104 }} />
        </Link>
        <h1>Criar conta</h1>
        <p className="subtitle">Comece a tornar suas aulas mais inclusivas.</p>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Nome</span>
            <input
              className="input"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Como devemos te chamar?"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </label>
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
              className={`input${senha && erroValidacao ? ' has-error' : ''}`}
              type="password"
              name="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            {erroValidacao ? (
              <span className={senha ? 'field-error' : 'field-hint'}>{erroValidacao}</span>
            ) : (
              <span className="field-hint">Senha válida ✓</span>
            )}
          </label>
          <label className="field">
            <span className="field-label">Confirmar senha</span>
            <input
              className="input"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </label>

          {textoMensagem && (
            <p className={`alert ${sucesso ? 'alert-success' : 'alert-error'}`}>{textoMensagem}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={botaoDesabilitado}
          >
            Criar conta
          </button>
        </form>

        <p className="auth-switch">
          Já possui uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
