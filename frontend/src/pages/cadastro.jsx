import { useState } from 'react';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que a página recarregue
    
    try {
      const response = await fetch('http://127.0.0.1:8000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostra o erro exato que o seu backend retornou
        setMensagem(data.detail[0] || 'Erro ao cadastrar');
      } else {
        setMensagem('Cadastro realizado com sucesso!');
        // Aqui vocês poderão redirecionar para o Login depois
      }
    } catch (error) {
      setMensagem('Erro de conexão com o servidor.');
    }
  };

  return (
    <div>
      <h2>Criar Conta</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome:</label>
          <input 
            type="text" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>E-mail:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Senha:</label>
          <input 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Cadastrar</button>
      </form>
      
      {/* Exibe mensagens de sucesso ou erro na tela */}
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}