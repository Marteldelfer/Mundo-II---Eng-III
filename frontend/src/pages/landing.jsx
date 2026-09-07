import logo from '../assets/logo.png'
import '../App.css'

export default function Landing() {
  return (
    <div>
    <section id="center">
                  <div className="logo">
                    <img src={logo} className="base" width="200" height="200" alt="" />
                  </div>
                  <div>
                    <h2>Parece que você não tem nenhuma turma cadastrada.</h2>
                  <br></br>
                  <button
                  style={{width: '300px', height: '75px'}}
                  type="button"
                  className="login-button"
                >
                  Cadastrar turma
                </button>
                  </div>
                </section>
    </div>
  );
}