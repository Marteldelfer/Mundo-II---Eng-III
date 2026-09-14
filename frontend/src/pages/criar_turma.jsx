import logo from '../assets/logo.png'
import '../App.css'

export default function Landing() {
  return (
    <div>
    <section id="center" style={{gap: '0px'}}>
                  <div className="logo">
                    <img src={logo} className="base" width="200" height="200" alt="" />
                  </div>

                  <form style={{width: '75%'}}>
      
                    <label>
                      <h4 style={{marginBottom: '8px', marginTop: '0px'}}>Nome da turma:</h4>
                      <input 
                        type="text"                        
                        required 
                      />
                    </label>
                  

                  <div style={{display: 'flex', gap: '20px'}}>
                    <label style={{width: '100%'}}>
                      <h4 style={{marginBottom: '8px'}}>Plano de Ensino:</h4>
                      <button
                      style={{width: '100%', height: '75px'}}
                      type="button"
                      className="purple-button"
                      >
                   <h5 style={{margin: '0px'}}>Fazer Upload</h5>
                </button>
                    </label>
                    <label style={{width: '100%'}}>
                      <h4 style={{marginBottom: '8px'}}>Lista de Alunos:</h4>
                      <button
                      style={{width: '100%', height: '75px'}}
                      type="button"
                      className="purple-button"
                      >
                  <h5 style={{margin: '0px'}}>Fazer Upload</h5>
                </button>
                    </label>
                     <label style={{width: '100%'}}>
                      <h4 style={{marginBottom: '8px'}}>Lista de Alunos PCD:</h4>
                      <button
                      style={{width: '100%', height: '75px'}}
                      type="button"
                      className="purple-button"
                      >
                  <h5 style={{margin: '0px'}}>Fazer Upload</h5>
                </button>
                    </label>
                    </div>
                    <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                      <button
                      style={{width: '40%', height: '75px', marginBottom:'0px'}}
                      type="button"
                      className="dark-gray-button"
                      >Confirmar</button>
                      <button
                      style={{width: '40%', height: '75px', marginBottom:'0px'}}
                      type="button"
                      className="gray-button"
                      >Cancelar</button>
                    </div>
                  </form>
                  
                  
                </section>
    </div>
  );
}