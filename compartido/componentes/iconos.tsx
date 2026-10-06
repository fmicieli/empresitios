// Íconos de línea simples. Siempre decorativos (aria-hidden): el texto accesible va en el botón.

type P = { tam?: number };
const base = (tam: number) => ({
  width: tam,
  height: tam,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round' as const,
  'stroke-linejoin': 'round' as const,
  'aria-hidden': true,
  focusable: 'false',
});

export const IconoMenu = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconoBolsa = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M6 7h12l-1 13H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
);
export const IconoAtras = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconoBuscar = ({ tam = 20 }: P) => (
  <svg {...base(tam)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
export const IconoChat = ({ tam = 20 }: P) => (
  <svg {...base(tam)}><path d="M4 20l1.5-4A8 8 0 1 1 9 19z" /></svg>
);
export const IconoCheck = ({ tam = 16 }: P) => (
  <svg {...base(tam)} stroke-width={3}><path d="M5 13l4 4L19 7" /></svg>
);
export const IconoCerrar = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconoAlerta = ({ tam = 18 }: P) => (
  <svg {...base(tam)}><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const IconoFlecha = ({ tam = 18, abierto = false }: P & { abierto?: boolean }) => (
  <svg {...base(tam)} style={{ transform: abierto ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconoPedidos = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>
);
export const IconoProductos = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M4 7l8-4 8 4v10l-8 4-8-4z" /><path d="M4 7l8 4 8-4M12 11v10" /></svg>
);
export const IconoTienda = ({ tam = 22 }: P) => (
  <svg {...base(tam)}><path d="M4 9l1-5h14l1 5" /><path d="M4 9h16v11H4z" /><path d="M10 20v-6h4v6" /></svg>
);
export const IconoFoto = ({ tam = 26 }: P) => (
  <svg {...base(tam)}><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" /></svg>
);
export const IconoHerramienta = ({ tam = 20 }: P) => (
  <svg {...base(tam)}><path d="M14 6a4 4 0 0 0 5 5l-8 8-3-3z" /><path d="M14 6l-2-2" /></svg>
);
