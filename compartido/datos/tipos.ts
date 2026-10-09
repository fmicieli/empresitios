// Tipos de la capa de datos. Reflejan las pestañas de la planilla (docs/04-modelo-de-datos.md).

export type EstadoPedido = 'pendiente' | 'confirmada' | 'cancelada' | 'vencida';
export type Entrega = 'envio' | 'retiro';
export type Pago = 'transferencia' | 'efectivo';

/** Pestaña Config: solo lo que necesita el servidor (D-01). */
export interface ConfigServidor {
  horasReserva: number;
  proximoNumero: number;
  /** Topes contra pedidos falsos (D-16). Si faltan, se usan 10 y 20. */
  maxUnidadesPorProducto?: number;
  maxUnidadesPorPedido?: number;
}

/** Una fila de la pestaña Categorias. */
export interface FilaCategoria {
  id: string;
  orden: number;
  categoria: string;
  subcategoria: string; // '' si es de un solo nivel
  visible: boolean;
}

/** Categorías agrupadas para el menú: "Mujer" con sus subcategorías. */
export interface Categoria {
  nombre: string;
  /** id de la fila si la categoría es de un solo nivel. */
  id: string | null;
  subcategorias: { id: string; nombre: string }[];
}

/** Una fila de la pestaña Stock, con lo calculado. */
export interface Variante {
  color: string; // '' si el producto no usa colores
  talle: string; // '' si el producto no usa talles
  /** Stock total del negocio (incluye lo reservado). */
  cantidad: number;
  /** Unidades en pedidos pendientes no vencidos. */
  reservado: number;
  /** cantidad − reservado, nunca negativo. Es lo que ve el comprador. */
  libre: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoriaId: string;
  precio: number;
  descripcion: string;
  codigo: string;
  visible: boolean;
  colores: string[];
  talles: string[];
  /** ids de fotos en orden; la primera es la principal. */
  fotos: string[];
  variantes: Variante[];
  creado: number;
  actualizado: number;
}

/** Lo que se manda para guardar un producto (alta si id es null). */
export interface ProductoAGuardar {
  id: string | null;
  nombre: string;
  categoriaId: string;
  precio: number;
  descripcion: string;
  codigo: string;
  visible: boolean;
  colores: string[];
  talles: string[];
  fotos: string[];
  stock: { color: string; talle: string; cantidad: number }[];
}

export interface ItemCarrito {
  productoId: string;
  color: string;
  talle: string;
  cantidad: number;
}

export interface Comprador {
  nombre: string;
  /** Tal como lo escribió. */
  whatsapp: string;
  /** 10 dígitos: código de área + número (D-02). */
  whatsappNormalizado: string;
  entrega: Entrega;
  direccion: string;
  localidad: string;
  pago: Pago;
  nota: string;
}

export interface ItemPedido {
  productoId: string;
  nombreProducto: string;
  color: string;
  talle: string;
  cantidad: number;
  precioUnitario: number;
  codigo: string;
  /** Unidades realmente descontadas al confirmar (D-05). */
  descontado: number;
}

export interface Pedido {
  numero: number;
  creado: number;
  venceEn: number;
  estado: EstadoPedido;
  comprador: Comprador;
  items: ItemPedido[];
  total: number;
  actualizado: number;
}

/** Línea del carrito que no se pudo reservar. */
export interface LineaConProblema {
  productoId: string;
  color: string;
  talle: string;
  pedida: number;
  libre: number;
  motivo: 'sinStock' | 'noDisponible';
}

export type ResultadoCrearPedido = { ok: true; pedido: Pedido; horasReserva: number } | { ok: false; lineas: LineaConProblema[] };

export type ResultadoConfirmar =
  { ok: true; accionId: string; pedido: Pedido } | { ok: false; motivo: 'sinStock'; lineas: LineaConProblema[] };

export interface ResultadoAccion {
  accionId: string;
  pedido: Pedido;
}

export type TipoError =
  | 'sinConexion'
  | 'servidor'
  | 'sesion'
  | 'noEncontrado'
  /** La cuenta de Google no está en la lista del negocio. */
  | 'noAutorizado'
  /** El número ya tiene el máximo de pedidos esperando confirmación (D-16). */
  | 'limitePedidos'
  /** El pedido supera el máximo de unidades (D-16). */
  | 'limiteUnidades'
  /** El mismo número ya mandó este pedido exacto y sigue pendiente. */
  | 'pedidoRepetido'
  /** No pasó la verificación anti-robots (Turnstile). */
  | 'antiRobot';

/** Error de la capa de datos con un tipo que la interfaz sabe explicar. */
export class ErrorDatos extends Error {
  tipo: TipoError;
  constructor(tipo: TipoError, mensaje?: string) {
    super(mensaje ?? tipo);
    this.name = 'ErrorDatos';
    this.tipo = tipo;
  }
}

/**
 * El contrato de la capa de datos. La tienda y el admin solo usan esto;
 * no saben si atrás hay datos de prueba (local) o Google (appsScript).
 */
export interface DataStore {
  /** Qué implementación es. Solo para mostrar herramientas de prueba. */
  readonly tipo: 'local' | 'appsScript';
  /** Hora actual según la capa de datos (el modo de prueba puede adelantarla). */
  ahora(): number;

  getConfig(): Promise<ConfigServidor>;
  getCategorias(): Promise<FilaCategoria[]>;
  getProductos(opciones?: { incluirOcultos?: boolean }): Promise<Producto[]>;
  getProducto(id: string): Promise<Producto | null>;

  /** Atómico: verifica stock, numera y reserva. */
  crearPedido(datos: { items: ItemCarrito[]; comprador: Comprador; verificacion?: string }): Promise<ResultadoCrearPedido>;

  getPedidos(filtro?: { estado?: EstadoPedido }): Promise<Pedido[]>;
  getPedido(numero: number): Promise<Pedido | null>;
  confirmarPedido(numero: number, opciones?: { forzar?: boolean }): Promise<ResultadoConfirmar>;
  cancelarPedido(numero: number): Promise<ResultadoAccion>;
  /** Cancela todos los pedidos pendientes de un número. Devuelve sus números (D-16). */
  cancelarPendientesDe(whatsappNormalizado: string): Promise<number[]>;
  deshacer(accionId: string): Promise<void>;

  /** Guarda varias cantidades de un producto en una sola llamada. */
  ajustarStock(productoId: string, cambios: { color: string; talle: string; cantidad: number }[]): Promise<Producto>;
  guardarProducto(producto: ProductoAGuardar): Promise<Producto>;
  eliminarProducto(id: string): Promise<void>;

  /** Sube una foto ya achicada. Devuelve su id. */
  subirFoto(archivo: Blob): Promise<string>;
  /** Dirección para mostrar una foto a partir de su id. */
  urlFoto(id: string): Promise<string>;

  /** Avisa cuando los datos cambiaron (por ejemplo, desde otra pestaña). Devuelve cómo dejar de escuchar. */
  alCambiar(fn: () => void): () => void;

  /** Ingreso real con Google. Solo existe en la implementación conectada. */
  readonly sesion?: SesionAdmin;
}

/** "Iniciar sesión con Google" del admin (D-16). */
export interface SesionAdmin {
  /** Correo de quien entró, o null si no hay sesión. */
  correo(): string | null;
  /** Recibe el pase que da el botón de Google, lo verifica y devuelve el correo. */
  iniciar(credencial: string): Promise<string>;
  cerrar(): void;
  /** Avisa cuando la sesión empieza o se corta (por ejemplo, porque venció). */
  alCambiar(fn: () => void): () => void;
}
