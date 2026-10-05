import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import logo from './assets/logo.png';
import Cadastro from './pages/cadastro';
import Login from './pages/login';
import HomeLogada from './components/HomeLogada';
import MinhasTurmas from './pages/minhas_turmas';
import Turma from './pages/turma';
import Aluno from './pages/aluno';
import RotaProtegida from './components/RotaProtegida';
import { estaAutenticado } from './utils/auth';
import './App.css';

/**
 * Wrapper para rotas públicas (login/cadastro).
 * Se o usuário JÁ está logado, redireciona para /landing.
 */
function RotaPublica({ children }) {
  if (estaAutenticado()) {
    return <Navigate to="/landing" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <section id="center">
                <div className="logo">
                  <img src={logo} className="base" width="200" height="200" alt="" />
                </div>
                <div>
                  <h1>Bem vindo ao AdaptEd.</h1>
                  <h2>A inclusão na sua sala de aula começa com um clique.</h2>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <Link to="/cadastro">
                    <button
                      style={{ width: '300px', height: '75px' }}
                      type="button"
                      className="dark-gray-button"
                    >
                      Criar conta
                    </button>
                  </Link>
                  <Link to="/login">
                    <button
                      style={{ width: '300px', height: '75px' }}
                      type="button"
                      className="gray-button"
                    >
                      Entrar
                    </button>
                  </Link>
                </div>
              </section>
            </>
          }
        />

        {/* Rotas públicas — se logado, redireciona para /landing */}
        <Route
          path="/cadastro"
          element={
            <RotaPublica>
              <Cadastro />
            </RotaPublica>
          }
        />
        <Route
          path="/login"
          element={
            <RotaPublica>
              <Login />
            </RotaPublica>
          }
        />

        {/* Rotas protegidas — se não logado, redireciona para /login */}
        <Route
          path="/landing"
          element={
            <RotaProtegida>
              <HomeLogada />
            </RotaProtegida>
          }
        />
        <Route
          path="/minhas-turmas"
          element={
            <RotaProtegida>
              <MinhasTurmas />
            </RotaProtegida>
          }
        />
        <Route
          path="/turma/:id"
          element={
            <RotaProtegida>
              <Turma />
            </RotaProtegida>
          }
        />
        <Route
          path="/aluno/:id"
          element={
            <RotaProtegida>
              <Aluno />
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;