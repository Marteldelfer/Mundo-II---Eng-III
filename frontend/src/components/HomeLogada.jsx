import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { headersAuth } from '../utils/auth';
import Landing from '../pages/landing';

/**
 * Decide o destino da rota /landing:
 * - Se o usuário NÃO tem turmas → renderiza <Landing /> (aviso + cadastro)
 * - Se tem turmas → redireciona para /minhas-turmas
 */
export default function HomeLogada() {
  const [status, setStatus] = useState('carregando'); // 'carregando' | 'vazio' | 'tem'

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      try {
        const response = await fetch('http://127.0.0.1:8000/turmas/', {
          headers: headersAuth(),
        });
        const turmas = response.ok ? await response.json() : [];
        if (cancelado) return;
        setStatus(Array.isArray(turmas) && turmas.length > 0 ? 'tem' : 'vazio');
      } catch {
        if (!cancelado) setStatus('vazio');
      }
    }

    verificar();
    return () => {
      cancelado = true;
    };
  }, []);

  if (status === 'carregando') {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando...</p>;
  }

  if (status === 'tem') {
    return <Navigate to="/minhas-turmas" replace />;
  }

  return <Landing />;
}