import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { salvarAutenticacao } from '../utils/auth';
import '../App.css';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
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

      setMensagem('Cadastro realizado com sucesso!');
      setTimeout(() => {
        navigate('/landing');
      }, 1500);
    } catch (error) {
      setMensagem('Erro de conexão com o servidor.');
    }
  };

  return (
    <div>
      <section id="center">
        <form style={{ width: '75%' }} onSubmit={handleSubmit}>
          <label>
            <h4 style={{ marginBottom: '8px' }}>Nome:</h4>
            <input
              type="text"
              name="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </label>
          <label>
            <h4 style={{ marginBottom: '8px' }}>E-mail:</h4>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <h4 style={{ marginBottom: '8px' }}>Senha:</h4>
            <input
              type="password"
              name="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>
          {erroValidacao && (
            <p style={{ color: 'red', marginTop: '-5px', marginBottom: '10px', fontWeight: 'bold' }}>
              {erroValidacao}
            </p>
          )}
          <label>
            <h4 style={{ marginBottom: '8px' }}>Confirmar Senha:</h4>
            <input
              type="password"
              name="confirmPassword"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </label>
          <h4 style={{ marginBottom: '8px' }}>
            Já possui uma conta? <Link to="/login">Entrar</Link>
          </h4>
          <input
            type="submit"
            value="Criar conta"
            className="dark-gray-button"
            disabled={botaoDesabilitado}
            style={{
              opacity: botaoDesabilitado ? 0.6 : 1,
              cursor: botaoDesabilitado ? 'not-allowed' : 'pointer',
            }}
          />
        </form>
      </section>
      {mensagem && <p style={{ fontWeight: 'bold' }}>{mensagem}</p>}
    </div>
  );
}