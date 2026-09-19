import logo from '../assets/logo.png'
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css'

export default function Turma() {
  const { id } = useParams();
  const [turma, setTurma] =
  useState(null);
  
  useEffect(() => {
    const carregarTurma = async () =>
  {
    try {
      const response = await
  fetch(`http://127.0.0.1:8000/turmas/${id}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar a turma');
      }

      const dados = await
  response.json();
      setTurma(dados);
    } catch (error) {
      console.error('Erro ao carregar a turma:', error);
    }
  };

  carregarTurma();
  }, [id]);
  return (
    <div>
    <section id="center">
                  <div className="logo">
                    <img src={logo} className="base" width="200" height="200" alt="" />
                  </div>
                  <div>
                    <h2>Dashboard da turma {turma ? turma.nome : 'Carregando...'}</h2>
                  <br></br>
                  <button
                  style={{width: '300px', height: '75px'}}
                  type="button"
                  className="purple-button"
                >
                  Adicionar Aluno
                </button>
                  </div>
                  
                </section>
    </div>
  );
}