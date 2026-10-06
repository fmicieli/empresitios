// Fotos del modo de prueba: se guardan en el navegador (IndexedDB),
// porque el almacenamiento común (localStorage) se llena con 2 o 3 fotos.

export interface AlmacenFotos {
  guardar(archivo: Blob): Promise<string>;
  url(id: string): Promise<string>;
  borrarTodo(): Promise<void>;
}

const PREFIJO = 'local:';

export function esFotoLocal(id: string): boolean {
  return id.startsWith(PREFIJO);
}

/** Fotos en memoria (para pruebas automáticas o si el navegador no deja usar IndexedDB). */
export function fotosEnMemoria(): AlmacenFotos {
  const mapa = new Map<string, Blob>();
  const urls = new Map<string, string>();
  return {
    async guardar(archivo) {
      const id = PREFIJO + Math.random().toString(36).slice(2, 10);
      mapa.set(id, archivo);
      return id;
    },
    async url(id) {
      if (urls.has(id)) return urls.get(id)!;
      const b = mapa.get(id);
      if (!b) return '';
      const u = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(b) : '';
      urls.set(id, u);
      return u;
    },
    async borrarTodo() {
      mapa.clear();
      urls.clear();
    },
  };
}

export function fotosIndexedDB(nombreBase: string): AlmacenFotos {
  if (typeof indexedDB === 'undefined') return fotosEnMemoria();
  const urls = new Map<string, string>();
  let db: Promise<IDBDatabase> | null = null;

  function abrir(): Promise<IDBDatabase> {
    db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(nombreBase, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('fotos');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return db;
  }

  async function operar<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const base = await abrir();
    return new Promise((resolve, reject) => {
      const req = fn(base.transaction('fotos', modo).objectStore('fotos'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  return {
    async guardar(archivo) {
      const id = PREFIJO + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await operar('readwrite', (s) => s.put(archivo, id));
      return id;
    },
    async url(id) {
      if (urls.has(id)) return urls.get(id)!;
      const b = await operar<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
      if (!b) return '';
      const u = URL.createObjectURL(b);
      urls.set(id, u);
      return u;
    },
    async borrarTodo() {
      await operar('readwrite', (s) => s.clear());
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    },
  };
}
