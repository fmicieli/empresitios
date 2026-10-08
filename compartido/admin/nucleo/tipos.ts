// Piezas comunes del admin: contexto y forma de un módulo.
// Cada plantilla arma su admin eligiendo módulos (pedidos, productos, y en el
// futuro reservas, turnos…). Un módulo nuevo solo tiene que cumplir ModuloAdmin.

import type { ComponentType } from 'preact';
import type { DataStore } from '../../datos/tipos';

export interface ConfigAdmin {
  /** Nombre del comercio. */
  nombre: string;
  /** Link público de la tienda. Vacío = el sitio actual. */
  urlTienda: string;
  /** WhatsApp de quien mantiene el sitio (ayuda y pedidos de categorías). */
  whatsappSoporte: string;
  /** Clave para lo que se guarda en el navegador. */
  clave: string;
  /** ID de cliente de Google para "Iniciar sesión con Google" (solo con datos reales). */
  googleClientId: string;
}

export interface ContextoAdmin {
  ds: DataStore;
  config: ConfigAdmin;
  /** Navega dentro del admin, por ejemplo ir('pedidos', '1004'). */
  ir: (...ruta: string[]) => void;
  esEscritorio: boolean;
}

export interface ModuloAdmin {
  /** Primer tramo de la ruta: "#/pedidos/…" */
  id: string;
  titulo: string;
  Icono: ComponentType<{ tam?: number }>;
  /** Número para mostrar al lado del título (por ejemplo, pendientes). */
  contador?: (ds: DataStore) => Promise<number>;
  Pantalla: ComponentType<{ ruta: string[]; ctx: ContextoAdmin }>;
}
