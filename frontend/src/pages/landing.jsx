import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Header from '../components/Header';
import Icone from '../components/Icone';
import CriarTurmaModal from '../components/CriarTurmaModal';
import { obterUsuario } from '../utils/auth';
import '../App.css';

export default function Landing() {
  const [modalAberto, setModalAberto] = useState(false);
  const navigate = useNavigate();
  const primeiroNome = (obterUsuario()?.nome || '').split(' ')[0];

  return (
    <>
      <Header />

      <main className="page">
        <div className="card empty-hero">
          <img src={logo} alt="" />
          <h2>{primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'}</h2>
          <p>
            Parece que você não tem nenhuma turma cadastrada. Crie a primeira para começar a
            acompanhar seus alunos.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setModalAberto(true)}
          >
            <Icone nome="add" />
            Cadastrar turma
          </button>
        </div>
      </main>

      {modalAberto && (
        <CriarTurmaModal
          onClose={() => setModalAberto(false)}
          onCriada={() => {
            setModalAberto(false);
            navigate('/minhas-turmas');
          }}
        />
      )}
    </>
  );
}
