// "Google de mentira" para probar Codigo.gs sin una cuenta real:
// imita lo justo de SpreadsheetApp, DriveApp, LockService, etc.

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

type Celda = unknown;

class Hoja {
  datos: Celda[][] = [];
  constructor(public nombre: string) {}
  getDataRange() {
    const ancho = Math.max(0, ...this.datos.map((f) => f.length));
    return { getValues: () => this.datos.map((f) => Array.from({ length: ancho }, (_, i) => (f[i] === undefined ? '' : f[i]))) };
  }
  getRange(fila: number | string, col?: number, nf = 1, nc = 1) {
    const yo = this;
    if (typeof fila === 'string') return { setDataValidation: () => {} };
    return {
      setValues(v: Celda[][]) {
        for (let i = 0; i < nf; i++) {
          const f = (fila as number) - 1 + i;
          while (yo.datos.length <= f) yo.datos.push([]);
          for (let j = 0; j < nc; j++) yo.datos[f][(col as number) - 1 + j] = v[i][j];
        }
        return this;
      },
      setFontWeight() {
        return this;
      },
    };
  }
  appendRow(fila: Celda[]) {
    this.datos.push([...fila]);
  }
  deleteRow(n: number) {
    this.datos.splice(n - 1, 1);
  }
  getLastRow() {
    return this.datos.length;
  }
  setFrozenRows() {}
  getProtections() {
    return [];
  }
  protect() {
    const p = { setDescription: () => p, setWarningOnly: () => p };
    return p;
  }
}

export interface GoogleFalso {
  doPost(cuerpo: unknown): { ok: boolean; resultado?: any; error?: { tipo: string; mensaje: string } };
  ejecutar(nombreFuncion: string, ...args: unknown[]): unknown;
  hojas: Map<string, Hoja>;
  archivos: Map<string, Archivo>;
  carpetas: Map<string, Carpeta>;
  /** Ruta de un archivo desde la carpeta de fotos, p. ej. "Accesorios/Abanicos/AB-05 · Abanico/AB-05-1.jpg". */
  ruta(idArchivo: string): string;
  /** "Internet de mentira" para UrlFetchApp: dirección → respuesta. */
  web: Map<string, { codigo: number; tipo: string; cuerpo: Buffer }>;
  /** Direcciones que fallan las próximas N veces con "Dirección no disponible" (como pasó con Google de verdad). */
  fallas: Map<string, number>;
  secreto: string;
}

type Archivo = { bytes: number[]; tipo: string; carpeta: string; nombre?: string; papelera?: boolean };
type Carpeta = { nombre: string; padre: string | null; papelera?: boolean };

const iterador = <T>(lista: T[]) => {
  let i = 0;
  return { hasNext: () => i < lista.length, next: () => lista[i++] };
};

export function crearGoogleFalso(dueno = 'duena@ejemplo.com'): GoogleFalso {
  const hojas = new Map<string, Hoja>();
  const propiedades = new Map<string, string>();
  const archivos = new Map<string, Archivo>();
  const carpetas = new Map<string, Carpeta>();
  const web = new Map<string, { codigo: number; tipo: string; cuerpo: Buffer }>();
  const fallas = new Map<string, number>();

  const libro = {
    getSheetByName: (n: string) => hojas.get(n) ?? null,
    insertSheet: (n: string) => {
      const h = new Hoja(n);
      hojas.set(n, h);
      return h;
    },
  };

  const nuevaCarpeta = (nombre: string, padre: string | null) => {
    const id = 'carpeta' + randomUUID().slice(0, 8);
    carpetas.set(id, { nombre, padre });
    return carpeta(id);
  };
  const carpeta = (id: string): any => ({
    getId: () => id,
    getName: () => carpetas.get(id)!.nombre,
    isTrashed: () => !!carpetas.get(id)!.papelera,
    setTrashed: (v: boolean) => (carpetas.get(id)!.papelera = v),
    getParents: () => {
      const padre = carpetas.get(id)!.padre;
      return iterador(padre && carpetas.has(padre) ? [carpeta(padre)] : []);
    },
    createFolder: (nombre: string) => nuevaCarpeta(nombre, id),
    getFoldersByName: (nombre: string) =>
      iterador([...carpetas].filter(([, c]) => c.padre === id && c.nombre === nombre).map(([cid]) => carpeta(cid))),
    getFolders: () => iterador([...carpetas].filter(([, c]) => c.padre === id && !c.papelera).map(([cid]) => carpeta(cid))),
    getFiles: () => iterador([...archivos].filter(([, a]) => a.carpeta === id && !a.papelera).map(([aid]) => archivo(aid))),
    createFile: (blob: { bytes: number[]; tipo: string; nombre?: string }) => {
      const fid = 'archivo' + randomUUID().replace(/-/g, '').slice(0, 16);
      archivos.set(fid, { bytes: blob.bytes, tipo: blob.tipo, carpeta: id, nombre: blob.nombre });
      return archivo(fid);
    },
  });
  const archivo = (id: string) => {
    const a = () => archivos.get(id)!;
    return {
      getId: () => id,
      getName: () => a().nombre ?? '',
      setName: (n: string) => (a().nombre = n),
      isTrashed: () => !!a().papelera,
      setTrashed: (v: boolean) => (a().papelera = v),
      moveTo: (destino: { getId(): string }) => (a().carpeta = destino.getId()),
      getParents: () => iterador(carpetas.has(a().carpeta) ? [carpeta(a().carpeta)] : []),
      getBlob: () => ({ getContentType: () => a().tipo, getBytes: () => a().bytes }),
    };
  };

  const contexto = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => libro,
      flush: () => {},
      ProtectionType: { SHEET: 'SHEET' },
      newDataValidation: () => ({ requireCheckbox: () => ({ build: () => ({}) }) }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => propiedades.get(k) ?? null,
        setProperty: (k: string, v: string) => propiedades.set(k, v),
      }),
    },
    Utilities: {
      getUuid: () => randomUUID(),
      base64Decode: (s: string) => [...Buffer.from(s, 'base64')],
      base64Encode: (b: number[]) => Buffer.from(b).toString('base64'),
      newBlob: (bytes: number[], tipo: string, nombre?: string) => ({ bytes, tipo, nombre }),
      sleep: () => {},
    },
    ContentService: {
      createTextOutput: (texto: string) => ({
        texto,
        setMimeType() {
          return this;
        },
      }),
      MimeType: { JSON: 'JSON' },
    },
    DriveApp: {
      createFolder: (nombre: string) => nuevaCarpeta(nombre, null),
      getFolderById: (id: string) => {
        if (!carpetas.has(id)) throw new Error('no existe');
        return carpeta(id);
      },
      getFileById: (id: string) => {
        if (!archivos.has(id)) throw new Error('no existe');
        return archivo(id);
      },
    },
    UrlFetchApp: {
      fetch: (urlCompleta: string) => {
        // Como Cloudflare con los archivos de la tienda: la parte "?…" no cambia qué archivo se sirve.
        const url = urlCompleta.split('?')[0];
        const quedan = fallas.get(url) ?? 0;
        if (quedan > 0) {
          fallas.set(url, quedan - 1);
          throw new Error('Dirección no disponible: ' + url);
        }
        const r = web.get(url) ?? { codigo: 404, tipo: 'text/plain', cuerpo: Buffer.from('') };
        return {
          getResponseCode: () => r.codigo,
          getContentText: () => r.cuerpo.toString('utf8'),
          getBlob: () => {
            const blob = {
              bytes: [...r.cuerpo],
              tipo: r.tipo,
              nombre: '',
              getContentType: () => r.tipo,
              getBytes: () => blob.bytes,
              setName: (n: string) => ((blob.nombre = n), blob),
            };
            return blob;
          },
        };
      },
    },
    ScriptApp: {
      getProjectTriggers: () => [],
      newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create: () => ({}) }) }) }),
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => dueno }) },
  });

  const codigo = readFileSync(new URL('../Codigo.gs', import.meta.url), 'utf8');
  vm.runInContext(codigo, contexto, { filename: 'Codigo.gs' });
  const ejecutar = (f: string, ...args: unknown[]) => (contexto[f] as (...a: unknown[]) => unknown)(...args);
  ejecutar('configurarPlanilla');
  const secreto = propiedades.get('SECRETO')!;

  const ruta = (idArchivo: string) => {
    const a = archivos.get(idArchivo)!;
    const partes = [a.nombre ?? ''];
    for (let c = carpetas.get(a.carpeta); c && c.padre; c = carpetas.get(c.padre)) partes.unshift(c.nombre);
    return partes.join('/');
  };

  return {
    hojas,
    archivos,
    carpetas,
    ruta,
    web,
    fallas,
    secreto,
    ejecutar,
    doPost(cuerpo) {
      const r = ejecutar('doPost', { postData: { contents: JSON.stringify(cuerpo) } }) as { texto: string };
      return JSON.parse(r.texto);
    },
  };
}
