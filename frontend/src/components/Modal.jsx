import { useEffect } from 'react';
import Icone from './Icone';

/**
 * Diálogo modal no estilo Material 3.
 * Fecha com ESC, clique fora ou botão "X".
 */
export default function Modal({ titulo, descricao, onClose, wide = false, children }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Icone nome="close" />
          </button>
        </div>
        {descricao && <p className="modal-description">{descricao}</p>}
        {!descricao && <div style={{ height: 12 }} />}
        {children}
      </div>
    </div>
  );
}

