import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // 👈 NOVO IMPORT
import remarkGfm from 'remark-gfm'; // 👈 NOVO IMPORT
import Icone from './Icone';
import { headersAuth } from '../utils/auth';
import '../App.css';

export default function ChatIA({ turmaId, alunoId = null, nomeContexto }) {
  const [mensagens, setMensagens] = useState([
    { role: 'assistant', content: `Olá! Sou o AdaptEd AI. Como posso te ajudar a incluir ${nomeContexto} hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const fimDaListaRef = useRef(null);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!input.trim() || carregando) return;

    const novaMensagemUsuario = { role: 'user', content: input.trim() };
    const novasMensagens = [...mensagens, novaMensagemUsuario];
    
    setMensagens(novasMensagens);
    setInput('');
    setCarregando(true);

    try {
      const historicoParaEnviar = novasMensagens
        .filter((m, index) => index > 0 && m.content && m.content.trim() !== '')
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = {
        mensagens: historicoParaEnviar,
        turma_id: parseInt(turmaId),
      };
      
      if (alunoId) {
        payload.aluno_id = parseInt(alunoId);
      }

      const response = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        headers: headersAuth(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const erroData = await response.json().catch(() => ({}));
        const msgErro = typeof erroData.detail === 'string' 
          ? erroData.detail 
          : JSON.stringify(erroData.detail) || 'Erro desconhecido';
        throw new Error(msgErro);
      }
      
      const data = await response.json();
      setMensagens([...novasMensagens, { role: 'assistant', content: data.resposta }]);
    } catch (error) {
      console.error('Erro no chat:', error);
      setMensagens([
        ...novasMensagens, 
        { role: 'assistant', content: `Desculpe, tive um problema: ${error.message}` }
      ]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {mensagens.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className="chat-avatar">
              {msg.role === 'user' ? <Icone nome="person" /> : <Icone nome="sparkle" />}
            </div>
            
            {/* 👈 AQUI ESTÁ A MÁGICA DO MARKDOWN */}
            <div className="chat-text markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>

          </div>
        ))}
        {carregando && (
          <div className="chat-bubble ai">
            <div className="chat-avatar"><Icone nome="sparkle" /></div>
            <div className="chat-text"><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /></div>
          </div>
        )}
        <div ref={fimDaListaRef} />
      </div>

      <form onSubmit={enviarMensagem} className="chat-input-area">
        <input
          type="text"
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo sobre adaptação, atividades, comportamento..."
          disabled={carregando}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim() || carregando}>
          <Icone nome="arrowForward" />
        </button>
      </form>
    </div>
  );
}