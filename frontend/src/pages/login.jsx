import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import Cadastro from './cadastro'
import '../App.css'

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }), 
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(data.detail || 'Erro ao realizar login');
      } else {
        setMensagem('Login realizado com sucesso!');
      }
    } catch (error) {
      setMensagem('Erro de conexão com o servidor.');
    }
  };

  return (
    <div>
    <section id="center">
        <div className="logo">
            <img src={logo} className="base" width="200" height="200" alt="" />
          </div>
      <form style={{width: '75%'}} onSubmit={handleSubmit}>
      <label>
        <h4 style={{marginBottom: '8px'}}>E-mail:</h4>
        <input 
          type="email" 
          name="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </label>
      <label>
        <h4 style={{marginBottom: '8px'}}>Senha:</h4>
        <input 
          type="password" 
          name="password" 
          value={senha} 
          onChange={(e) => setSenha(e.target.value)} 
          required 
        />
      </label>
      <h4 style={{marginBottom: '8px'}}>Não possui uma conta? <Link to="/cadastro">Criar conta</Link></h4>
      <input type="submit" value="Entrar" className="signin-button" />
      
      </form>
    </section>
      
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}