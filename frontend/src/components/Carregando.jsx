/** Indicador de carregamento centralizado. */
export default function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="loading" role="status">
      <div className="spinner" />
      <p>{texto}</p>
    </div>
  );
}

