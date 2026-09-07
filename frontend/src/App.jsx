import { useState } from 'react'
import logo from './assets/logo.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
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
        <button
          style={{width: '300px', height: '75px'}}
          type="button"
          className="signin-button"
          onClick={() => alert('Realizar cadastro')}
          >
          Criar conta
        </button>
        <button
          style={{width: '300px', height: '75px'}}
          type="button"
          className="login-button"
          onClick={() => alert('Realizar login')}
        >
          Entrar
        </button>
        </div>
      </section>
    </>
  )
}

export default App
