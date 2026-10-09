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
  archivos: Map<string, { bytes: number[]; tipo: string; carpeta: string }>;
  secreto: string;
}

export function crearGoogleFalso(dueno = 'duena@ejemplo.com'): GoogleFalso {
  const hojas = new Map<string, Hoja>();
  const propiedades = new Map<string, string>();
  const archivos = new Map<string, { bytes: number[]; tipo: string; carpeta: string }>();
  const carpetas = new Set<string>();

  const libro = {
    getSheetByName: (n: string) => hojas.get(n) ?? null,
    insertSheet: (n: string) => {
      const h = new Hoja(n);
      hojas.set(n, h);
      return h;
    },
  };

  const carpeta = (id: string) => ({
    getId: () => id,
    createFile: (blob: { bytes: number[]; tipo: string }) => {
      const fid = 'archivo' + randomUUID().replace(/-/g, '').slice(0, 16);
      archivos.set(fid, { bytes: blob.bytes, tipo: blob.tipo, carpeta: id });
      return { getId: () => fid };
    },
  });

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
      newBlob: (bytes: number[], tipo: string) => ({ bytes, tipo }),
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
      createFolder: () => {
        const id = 'carpeta' + randomUUID().slice(0, 8);
        carpetas.add(id);
        return carpeta(id);
      },
      getFolderById: (id: string) => {
        if (!carpetas.has(id)) throw new Error('no existe');
        return carpeta(id);
      },
      getFileById: (id: string) => {
        const a = archivos.get(id);
        if (!a) throw new Error('no existe');
        let dado = false;
        return {
          getParents: () => ({ hasNext: () => !dado, next: () => ((dado = true), { getId: () => a.carpeta }) }),
          getBlob: () => ({ getContentType: () => a.tipo, getBytes: () => a.bytes }),
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

  return {
    hojas,
    archivos,
    secreto,
    ejecutar,
    doPost(cuerpo) {
      const r = ejecutar('doPost', { postData: { contents: JSON.stringify(cuerpo) } }) as { texto: string };
      return JSON.parse(r.texto);
    },
  };
}
