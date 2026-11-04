// Pruebas de la plantilla de turnos: armado de links y controles al compilar.
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import config from './pruebas/sitio';
import contenido from './pruebas/contenido';
import configReal from '../../config/sitio.config';
import contenidoReal from '../../config/contenido';
import { hrefGeneral, linkMaps, prepararServicios, semana } from './preparar';
import { tienePendientes, validar } from './validar';
import type { ConfigSitio, Contenido } from './tipos';

const texto = (href: string) => decodeURIComponent(href.split('?text=')[1] ?? '');
const conNumero: ConfigSitio = { ...config, whatsapp: '2324 69-2208', ejemplo: false };

describe('links de WhatsApp', () => {
  it('usa el número normalizado', () => {
    expect(hrefGeneral(conNumero)).toMatch(/^https:\/\/wa\.me\/5492324692208\?text=/);
  });
  it('sin número (ejemplo), WhatsApp pide elegir el contacto', () => {
    expect(hrefGeneral(config)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
  it('los destacados van primero', () => {
    expect(prepararServicios(config, contenido)[0].destacado).toBeTruthy();
  });
  it('servicio en todos los lugares: opciones de lugar y "me da igual"', () => {
    const s = prepararServicios(conNumero, contenido).find((x) => x.id === 'descontracturante')!;
    expect(s.opciones.map((o) => o.etiqueta)).toEqual([
      'Mi consultorio, Palermo · lunes y miércoles',
      'Estudio Raíz, Belgrano · jueves y sábado',
    ]);
    expect(texto(s.opciones[1].href)).toContain('en Estudio Raíz, Belgrano (jueves y sábado).');
    expect(texto(s.hrefCualquiera)).toContain('Me queda bien cualquier lugar.');
    expect(texto(s.href)).not.toContain(' en ');
  });
  it('servicio de un solo lugar: sin preguntar y con el lugar en el mensaje', () => {
    const s = prepararServicios(conNumero, contenido).find((x) => x.id === 'reflexologia')!;
    expect(s.opciones).toEqual([]);
    expect(texto(s.href)).toBe(
      'Hola Lu, quiero reservar un turno para Reflexología ($ 20.000) en Mi consultorio, Palermo (lunes y miércoles). ¿Qué días tenés disponibles?',
    );
  });
  it('sin la sección de lugares, no pregunta', () => {
    const sin = { ...conNumero, secciones: { ...conNumero.secciones, dondeAtiendo: false } };
    expect(prepararServicios(sin, contenido).every((s) => s.opciones.length === 0)).toBe(true);
  });
});

describe('agenda y mapa', () => {
  it('ordena la semana de lunes a domingo', () => {
    expect(semana(contenido.dondeAtiendo.lugares).map((f) => f.dia)).toEqual(['lunes', 'miércoles', 'jueves', 'sábado']);
  });
  it('link a Maps con la dirección', () => {
    expect(linkMaps('Uruguay 3751, San Fernando')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Uruguay%203751%2C%20San%20Fernando',
    );
  });
});

describe('controles al compilar', () => {
  const fotos = new Set([
    ...contenido.servicios.lista.map((s) => s.foto.archivo),
    'inicio.jpg',
    'sobre-mi.jpg',
    'gift-card.jpg',
    'certificado-1.jpg',
    'certificado-2.jpg',
    'palermo.jpg',
    'belgrano.jpg',
  ]);
  const publicos = new Set(['logo.svg']);

  it('la configuración y el contenido de este sitio no tienen errores', () => {
    // Usa los archivos reales de config/, fotos/ y public/: en el repo de una clienta revisa su sitio.
    const leer = (carpeta: string) => new Set(readdirSync(fileURLToPath(new URL(carpeta, import.meta.url))));
    expect(validar(configReal, contenidoReal, leer('../../fotos/'), leer('../../public/')).errores).toEqual([]);
  });
  it('los datos de prueba pasan sin errores ni avisos', () => {
    expect(validar(config, contenido, fotos, publicos)).toEqual({ errores: [], avisos: [] });
  });
  it('frena si falta una foto o el WhatsApp de una clienta real', () => {
    const r = validar({ ...config, ejemplo: false }, contenido, new Set(), publicos);
    expect(r.errores.some((e) => e.includes('Falta el WhatsApp'))).toBe(true);
    expect(r.errores.some((e) => e.includes('"inicio.jpg"'))).toBe(true);
  });
  it('frena con un WhatsApp inválido y con un lugar que no existe', () => {
    const c: Contenido = structuredClone(contenido);
    c.servicios.lista[0].lugares = ['marte'];
    const r = validar({ ...config, whatsapp: '123' }, c, fotos, publicos);
    expect(r.errores.some((e) => e.includes('"123"'))).toBe(true);
    expect(r.errores.some((e) => e.includes('"marte"'))).toBe(true);
  });
  it('antes y después sin permiso escrito frena (D-36)', () => {
    const c: Contenido = structuredClone(contenido);
    c.antesDespues.lista = [
      { antes: { archivo: 'inicio.jpg', alt: 'a' }, despues: { archivo: 'inicio.jpg', alt: 'b' }, permisoEscrito: false },
    ];
    const r = validar({ ...config, secciones: { ...config.secciones, antesDespues: true } }, c, fotos, publicos);
    expect(r.errores.some((e) => e.includes('permisoEscrito'))).toBe(true);
  });
  it('avisa promesas y datos sin completar, sin frenar', () => {
    const c: Contenido = structuredClone(contenido);
    c.servicios.lista[0].descripcion = 'Elimina las arrugas de forma definitiva.';
    c.turnos.sena = '[completar]';
    const r = validar(config, c, fotos, publicos);
    expect(r.errores).toEqual([]);
    expect(r.avisos.some((a) => a.includes('"elimina"'))).toBe(true);
    expect(r.avisos.some((a) => a.includes('Falta completar'))).toBe(true);
  });
  it('con "[completar]" el sitio queda fuera de buscadores', () => {
    const c: Contenido = structuredClone(contenido);
    expect(tienePendientes(c)).toBe(false);
    c.turnos.cancelacion = '[completar] Qué pasa si avisás tarde.';
    expect(tienePendientes(c)).toBe(true);
  });
  it('imagen para compartir: tiene que estar en public/ y avisa si falta urlSitio', () => {
    const sinArchivo = validar({ ...config, imagenCompartir: 'compartir.jpg' }, contenido, fotos, publicos);
    expect(sinArchivo.errores.some((e) => e.includes('compartir.jpg'))).toBe(true);
    const conArchivo = new Set([...publicos, 'compartir.jpg']);
    const r = validar({ ...config, imagenCompartir: 'compartir.jpg' }, contenido, fotos, conArchivo);
    expect(r.errores).toEqual([]);
    expect(r.avisos.some((a) => a.includes('urlSitio'))).toBe(true);
    const webp = validar(
      { ...config, imagenCompartir: 'compartir.webp' },
      contenido,
      fotos,
      new Set([...publicos, 'compartir.webp']),
    );
    expect(webp.errores.some((e) => e.includes('JPG o PNG'))).toBe(true);
  });
  it('no confunde palabras que contienen una promesa ("procura")', () => {
    const c: Contenido = structuredClone(contenido);
    c.servicios.lista[0].descripcion = 'Procura una piel más luminosa.';
    expect(validar(config, c, fotos, publicos).avisos).toEqual([]);
  });
});
