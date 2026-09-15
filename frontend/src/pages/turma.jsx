import logo from '../assets/logo.png'
import '../App.css'

export default function Turma() {
  return (
    <div>
    <section id="center">
                  <div className="logo">
                    <img src={logo} className="base" width="200" height="200" alt="" />
                  </div>
                  <div>
                    <h2>Dashboard da turma Cálculo N1</h2>
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