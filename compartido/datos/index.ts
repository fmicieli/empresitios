// Punto de entrada de la capa de datos: elige la implementación según la configuración.
// El resto del código solo conoce el contrato DataStore (tipos.ts).

import { crearDataStoreAppsScript } from './appsScript';
import { crearDataStoreLocal, type DataStoreLocal } from './local';
import { fotosIndexedDB } from './local/fotos';
import type { Semilla } from './local/semilla';
import type { DataStore } from './tipos';

export type { DataStore } from './tipos';
export type { DataStoreLocal } from './local';

export interface OpcionesDatos {
  tipo: 'local' | 'appsScript';
  /** Prefijo para lo que se guarda en el navegador (una tienda por clave). */
  clave: string;
  /** Solo para "local": datos de ejemplo. */
  semilla?: Semilla;
  /** Solo para "local": carpeta pública de las fotos de ejemplo. */
  baseFotos?: string;
  /** Solo para "appsScript". */
  url?: string;
}

export function crearDataStore(op: OpcionesDatos): DataStore {
  if (op.tipo === 'appsScript') return crearDataStoreAppsScript({ url: op.url ?? '' });
  if (!op.semilla) throw new Error('Falta la semilla de datos de ejemplo.');
  return crearDataStoreLocal({
    semilla: op.semilla,
    clave: op.clave,
    baseFotos: op.baseFotos,
    fotos: fotosIndexedDB(`${op.clave}-fotos`),
  });
}

/** ¿Es la implementación de prueba? (para mostrar las herramientas de prueba). */
export function esLocal(ds: DataStore): ds is DataStoreLocal {
  return ds.tipo === 'local' && 'herramientas' in ds;
}
