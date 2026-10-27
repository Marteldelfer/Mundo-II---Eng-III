import { useState } from 'react';
import Modal from './Modal';
import Icone from './Icone';
import { headersAuth, headersAuthUpload } from '../utils/auth';

/**
 * Modal de criação de turma (manual ou a partir do plano de ensino com IA).
 * Compartilhado entre a tela "sem turmas" e "Minhas turmas".
 *
 * @param {() => void} onClose          chamado ao cancelar/fechar
 * @param {(turma: object) => void} onCriada  chamado com a turma criada
 */
export default function CriarTurmaModal({ onClose, onCriada }) {
  const [modoCriacao, setModoCriacao] = useState('manual');
  const [nome, setNome] = useState('');
  const [materia, setMateria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivoPlano, setArquivoPlano] = useState(null);
  const [erroNome, setErroNome] = useState('');
  const [arquivoPlanoIA, setArquivoPlanoIA] = useState(null);
  const [dadosTurmaIA, setDadosTurmaIA] = useState(null);
  const [erroNomeIA, setErroNomeIA] = useState('');
  const [analisandoPlano, setAnalisandoPlano] = useState(false);

  const handleNomeChange = (e) => {
    const valor = e.target.value;
    setNome(valor);
    if (!valor.trim()) {
      setErroNome('Nome da turma é obrigatório');
    } else {
      setErroNome('');
    }
  };

  const handleCriarTurma = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErroNome('Nome da turma é obrigatório');
      return;
    }
    try {
      let response;
      if (arquivoPlano) {
        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('materia', materia);
        formData.append('descricao', descricao);
        formData.append('plano_ensino', arquivoPlano);
        response = await fetch('http://127.0.0.1:8000/turmas/upload', {
          method: 'POST',
          headers: headersAuthUpload(),
          body: formData,
        });
      } else {
        response = await fetch('http://127.0.0.1:8000/turmas/', {
          method: 'POST',
          headers: headersAuth(),
          body: JSON.stringify({ nome, materia, descricao }),
        });
      }
      if (!response.ok) {
        const erroJson = await response.json().catch(() => ({}));
        throw new Error(erroJson.detail || 'Falha no servidor');
      }
      const turmaCriada = await response.json();
      onCriada(turmaCriada);
    } catch (error) {
      alert(error.message || 'Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const handleArquivoPlanoIA = (e) => {
    const arquivo = e.target.files[0] || null;
    setArquivoPlanoIA(arquivo);
    setDadosTurmaIA(null);
    setErroNomeIA('');
  };

  const handleAnalisarPlano = async () => {
    if (!arquivoPlanoIA) return;
    const extensao = arquivoPlanoIA.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'pptx'].includes(extensao)) {
      alert('Formato de arquivo não suportado. Envie um arquivo PDF, DOCX ou PPTX.');
      setArquivoPlanoIA(null);
      setDadosTurmaIA(null);
      return;
    }
    setAnalisandoPlano(true);
    setDadosTurmaIA(null);
    setErroNomeIA('');
    try {
      const formData = new FormData();
      formData.append('plano_ensino', arquivoPlanoIA);
      const response = await fetch('http://127.0.0.1:8000/turmas/analisar-plano', {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });
      if (!response.ok) {
        if (response.status === 400) {
          const data = await response.json();
          alert(data.detail || 'Não foi possível analisar o plano de ensino.');
          return;
        }
        throw new Error('Falha no servidor');
      }
      const dados = await response.json();
      setDadosTurmaIA(dados);
      if (!dados.nome || !dados.nome.trim()) {
        setErroNomeIA('Nome da turma é obrigatório');
      }
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    } finally {
      setAnalisandoPlano(false);
    }
  };

  const handleCriarTurmaIA = async (e) => {
    e.preventDefault();
    if (!dadosTurmaIA?.nome?.trim()) {
      setErroNomeIA('Nome da turma é obrigatório');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nome', dadosTurmaIA.nome);
      formData.append('materia', dadosTurmaIA.materia || '');
      formData.append('descricao', dadosTurmaIA.descricao || '');
      formData.append('plano_ensino', arquivoPlanoIA);
      const response = await fetch('http://127.0.0.1:8000/turmas/upload', {
        method: 'POST',
        headers: headersAuthUpload(),
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Falha no servidor');
      }
      const turmaCriada = await response.json();
      onCriada(turmaCriada);
    } catch (error) {
      alert('Ocorreu um erro interno. Tente novamente mais tarde');
    }
  };

  const botaoDesabilitado = !nome.trim();
  const botaoCriarIADesabilitado = !dadosTurmaIA?.nome?.trim() || analisandoPlano;

  return (
    <Modal titulo="Criar turma" onClose={onClose}>
      <div className="segmented" role="tablist" style={{ marginBottom: 24 }}>
        <button
          type="button"
          role="tab"
          aria-selected={modoCriacao === 'manual'}
          className={modoCriacao === 'manual' ? 'active' : ''}
          onClick={() => setModoCriacao('manual')}
        >
          {modoCriacao === 'manual' && <Icone nome="check" />}
          Manualmente
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modoCriacao === 'ia'}
          className={modoCriacao === 'ia' ? 'active' : ''}
          onClick={() => setModoCriacao('ia')}
        >
          {modoCriacao === 'ia' ? <Icone nome="check" /> : <Icone nome="sparkle" />}
          Plano de ensino
        </button>
      </div>

      {modoCriacao === 'manual' ? (
        <form onSubmit={handleCriarTurma}>
          <label className="field">
            <span className="field-label">Nome da turma *</span>
            <input
              type="text"
              className={`input${erroNome ? ' has-error' : ''}`}
              value={nome}
              onChange={handleNomeChange}
              placeholder="Ex.: 7º ano B"
            />
            {erroNome && <span className="field-error">{erroNome}</span>}
          </label>
          <label className="field">
            <span className="field-label">Matéria</span>
            <input
              type="text"
              className="input"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Ex.: Matemática"
            />
          </label>
          <label className="field">
            <span className="field-label">Descrição</span>
            <textarea
              className="textarea"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Conte um pouco sobre a turma"
            />
          </label>
          <label className="field">
            <span className="field-label">Plano de ensino (opcional)</span>
            <input
              type="file"
              className="file-input"
              onChange={(e) => setArquivoPlano(e.target.files[0])}
            />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-text">
              Cancelar
            </button>
            <button type="submit" disabled={botaoDesabilitado} className="btn btn-primary">
              Criar turma
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCriarTurmaIA}>
          <p className="modal-description">
            Envie o plano de ensino para que o AdaptEd identifique os dados da turma.
          </p>
          <label className="field">
            <span className="field-label">Plano de ensino</span>
            <input
              type="file"
              className="file-input"
              accept=".pdf,.docx,.pptx"
              onChange={handleArquivoPlanoIA}
            />
            <span className="field-hint">Arquivos permitidos: PDF, DOCX e PPTX.</span>
          </label>

          {!dadosTurmaIA && (
            <button
              type="button"
              onClick={handleAnalisarPlano}
              disabled={!arquivoPlanoIA || analisandoPlano}
              className="btn btn-tonal btn-block"
              style={{ marginTop: 20 }}
            >
              <Icone nome="sparkle" />
              {analisandoPlano ? 'Analisando...' : 'Analisar plano'}
            </button>
          )}

          {dadosTurmaIA && (
            <>
              <hr className="divider" />
              <p className="field-label" style={{ marginBottom: 12 }}>
                Dados identificados
              </p>
              <label className="field">
                <span className="field-label">Nome da turma</span>
                <input
                  type="text"
                  className={`input${erroNomeIA ? ' has-error' : ''}`}
                  value={dadosTurmaIA.nome || ''}
                  readOnly
                />
                {erroNomeIA && <span className="field-error">{erroNomeIA}</span>}
              </label>
              <label className="field">
                <span className="field-label">Matéria</span>
                <input type="text" className="input" value={dadosTurmaIA.materia || ''} readOnly />
              </label>
              <label className="field">
                <span className="field-label">Descrição</span>
                <textarea className="textarea" value={dadosTurmaIA.descricao || ''} readOnly />
              </label>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-text">
              Cancelar
            </button>
            {dadosTurmaIA && (
              <button type="submit" disabled={botaoCriarIADesabilitado} className="btn btn-primary">
                Criar turma
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

