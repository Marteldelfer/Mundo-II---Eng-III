import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Inicio from './pages/inicio';
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
        <Route path="/" element={<Inicio />} />

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
