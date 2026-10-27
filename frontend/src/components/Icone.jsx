/**
 * Ícones SVG inline (baseados no Material Symbols, estilo "rounded").
 * Uso: <Icone nome="add" />
 */
const PATHS = {
  add: 'M12 5v14M5 12h14',
  arrowBack: 'M19 12H5M12 19l-7-7 7-7',
  arrowForward: 'M5 12h14M12 5l7 7-7 7',
  edit: 'M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16v4zM13.5 6.5l4 4',
  delete: 'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  personAdd: 'M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6',
  group:
    'M17 20a5 5 0 0 0-10 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 20a4 4 0 0 0-3-3.87M17 4.13a4 4 0 0 1 0 7.75',
  school: 'M22 9L12 4 2 9l10 5 10-5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6',
  check: 'M5 12l5 5 9-10',
  close: 'M6 6l12 12M18 6L6 18',
  sparkle:
    'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z',
  description: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6',
  unlink: 'M17 7h2a5 5 0 0 1 1 9.9M7 7H5a5 5 0 0 0 0 10h2M8 12h3M3 3l18 18',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  notes: 'M4 6h16M4 12h16M4 18h10',
  insights: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  accessibility:
    'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4 8l8 2 8-2M12 10v5M9 22l3-7 3 7',
};

export default function Icone({ nome, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[nome]} />
    </svg>
  );
}

