import logo from '../assets/logo.png';
import '../App.css';

export default function CadastrarTurma() {
  return (
    <main className="page page-narrow">
      <div className="card">
        <img src={logo} alt="" style={{ display: 'block', width: 96, height: 96, margin: '0 auto 16px' }} />
        <form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <label className="field">
              <span className="field-label">Nome da turma</span>
              <input className="input" type="text" required />
            </label>
            <label className="field" style={{ marginTop: 0 }}>
              <span className="field-label">Disciplina</span>
              <input className="input" type="text" required />
            </label>
          </div>
          <label className="field" style={{ marginTop: 16 }}>
            <span className="field-label">Descrição da disciplina</span>
            <textarea className="textarea" style={{ minHeight: 120 }} />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-text">
              Cancelar
            </button>
            <button type="button" className="btn btn-primary">
              Criar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
