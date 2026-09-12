import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import logo from './assets/logo.png'
import Cadastro from './pages/cadastro'
import Login from './pages/login'
import Landing from './pages/landing'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <section id="center">
              <div className="logo">
                <img src={logo} className="base" width="200" height="200" alt="" />
              </div>
              <div>
                <h1>Bem vindo ao AdaptEd.</h1>
                <h2>A inclusão na sua sala de aula começa com um clique.</h2>
              </div>
              <div style={{display: 'flex', gap: '20px'}}>
              <Link to="/cadastro">
                <button
                  style={{width: '300px', height: '75px'}}
                  type="button"
                  className="signin-button"
                  >
                  Criar conta
                </button>
              </Link>
              <Link to="/login">
                <button
                  style={{width: '300px', height: '75px'}}
                  type="button"
                  className="login-button"
                >
                  Entrar
                </button>
              </Link>
              </div>
            </section>
          </>
        } />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App