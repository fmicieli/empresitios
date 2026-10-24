// Íconos Feather (https://feathericons.com, licencia MIT, © Cole Bemis): los mismos que usa el
// sistema de diseño de base (D-21). Línea de 2 px, puntas redondeadas, cuadro de 24.
// Siempre decorativos (aria-hidden): el texto accesible va en el botón o link.
// Tamaños del sistema: 16 dentro de botones y campos, 20 en botones de ícono, 24 en la navegación.

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

/** menu */
export const IconoMenu = ({ tam = 24 }: P) => (
  <svg {...base(tam)}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
/** shopping-cart */
export const IconoCarrito = ({ tam = 24 }: P) => (
  <svg {...base(tam)}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
/** chevron-left */
export const IconoAtras = ({ tam = 20 }: P) => (
  <svg {...base(tam)}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
/** chevron-right */
export const IconoSiguiente = ({ tam = 20 }: P) => (
  <svg {...base(tam)}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
/** search */
export const IconoBuscar = ({ tam = 16 }: P) => (
  <svg {...base(tam)}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
/** message-circle */
export const IconoChat = ({ tam = 16 }: P) => (
  <svg {...base(tam)}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
/** check */
export const IconoCheck = ({ tam = 16 }: P) => (
  <svg {...base(tam)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
/** x */
export const IconoCerrar = ({ tam = 20 }: P) => (
  <svg {...base(tam)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
/** alert-circle */
export const IconoAlerta = ({ tam = 20 }: P) => (
  <svg {...base(tam)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
/** chevron-down (gira cuando el contenido está abierto) */
export const IconoFlecha = ({ tam = 16, abierto = false }: P & { abierto?: boolean }) => (
  <svg {...base(tam)} style={{ transform: abierto ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
/** clipboard */
export const IconoPedidos = ({ tam = 24 }: P) => (
  <svg {...base(tam)}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
/** package */
export const IconoProductos = ({ tam = 24 }: P) => (
  <svg {...base(tam)}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
/** shopping-bag */
export const IconoTienda = ({ tam = 24 }: P) => (
  <svg {...base(tam)}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
/** image */
export const IconoFoto = ({ tam = 24 }: P) => (
  <svg {...base(tam)}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
/** tool */
export const IconoHerramienta = ({ tam = 16 }: P) => (
  <svg {...base(tam)}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
/** share */
export const IconoCompartir = ({ tam = 16 }: P) => (
  <svg {...base(tam)}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);
/** arrow-right */
export const IconoDerecha = ({ tam = 16 }: P) => (
  <svg {...base(tam)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
