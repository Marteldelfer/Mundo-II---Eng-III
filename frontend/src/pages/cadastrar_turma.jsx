import logo from '../assets/logo.png'
import '../App.css'

export default function CadastrarTurma() {
  return (
    <div>
    <section id="center" style={{gap: '0px'}}>
                  <div className="logo">
                    <img src={logo} className="base" width="200" height="200" alt="" />
                  </div>

                  <form style={{width: '75%'}}>
      
                    
                  

                  <div style={{display: 'flex', gap: '20px'}}>
                    <label style={{width: '100%'}}>
                      <h4 style={{marginBottom: '8px', marginTop: '0px'}}>Nome da turma:</h4>
                      <input 
                        type="text"                        
                        required 
                      />
                    </label>
                    <label style={{width: '100%'}}>
                      <h4 style={{marginBottom: '8px', marginTop: '0px'}}>Disciplina:</h4>
                      <input 
                        type="text"                        
                        required 
                      />
                    </label>

                    </div>
                    <label style={{width: '100%'}}>
                      <h4 style={{marginBottom: '8px', marginTop: '0px'}}>Descrição da Disciplina:</h4>
                      <input 
                        type="text"                        
                        style={{height: '120px'}}
                      />
                    </label>
                    <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                      <button
                      style={{width: '40%', height: '75px', marginBottom:'0px'}}
                      type="button"
                      className="dark-gray-button"
                      >Criar</button>
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