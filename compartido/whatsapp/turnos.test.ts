import { describe, expect, it } from 'vitest';
import { detalleServicio, mensajeGeneral, mensajePropio, mensajeReserva, textoDias, textoLugar } from './turnos';

const micro = { nombre: 'Microneedling con dermapen + limpieza profunda', duracion: '1 h 30', precio: 95000 };
const amaia = { nombre: 'Amaia Wellness Studio', zona: 'San Fernando', dias: ['jueves', 'martes'] };

describe('días', () => {
  it('une con "y" y ordena por semana', () => {
    expect(textoDias(['jueves', 'martes'])).toBe('martes y jueves');
    expect(textoDias(['viernes', 'lunes', 'miércoles'])).toBe('lunes, miércoles y viernes');
    expect(textoDias(['martes'])).toBe('martes');
    expect(textoDias([])).toBe('');
  });
  it('no repite días', () => {
    expect(textoDias(['martes', 'martes'])).toBe('martes');
  });
});

describe('detalle de duración y precio (los dos opcionales, D-36)', () => {
  it('con los dos', () => expect(detalleServicio('1 h', 65000)).toBe(' (1 h · $ 65.000)'));
  it('solo duración', () => expect(detalleServicio('1 h')).toBe(' (1 h)'));
  it('solo precio', () => expect(detalleServicio(undefined, 65000)).toBe(' ($ 65.000)'));
  it('ninguno', () => expect(detalleServicio('', undefined)).toBe(''));
});

describe('mensaje de reserva', () => {
  it('con lugar elegido', () => {
    expect(mensajeReserva('Valen', micro, { lugar: amaia })).toBe(
      'Hola Valen, quiero reservar un turno para Microneedling con dermapen + limpieza profunda (1 h 30 · $ 95.000) en Amaia Wellness Studio, San Fernando (martes y jueves). ¿Qué días tenés disponibles?',
    );
  });
  it('con "Me da igual"', () => {
    expect(mensajeReserva('Valen', micro, { cualquiera: true })).toBe(
      'Hola Valen, quiero reservar un turno para Microneedling con dermapen + limpieza profunda (1 h 30 · $ 95.000). Me queda bien cualquier lugar. ¿Qué días tenés disponibles?',
    );
  });
  it('sin lugar (sin JavaScript)', () => {
    expect(mensajeReserva('Valen', { nombre: 'Limpieza facial' })).toBe(
      'Hola Valen, quiero reservar un turno para Limpieza facial. ¿Qué días tenés disponibles?',
    );
  });
  it('lugar sin zona ni días', () => {
    expect(textoLugar({ nombre: 'Mi consultorio', dias: [] })).toBe('Mi consultorio');
  });
});

describe('otros mensajes', () => {
  it('general', () => expect(mensajeGeneral('Lu')).toBe('Hola Lu, quiero consultar por un turno.'));
  it('propio', () => {
    expect(mensajePropio('Hola {nombreCorto}, quiero mi rutina. ¿Cómo seguimos, {nombreCorto}?', 'Valen')).toBe(
      'Hola Valen, quiero mi rutina. ¿Cómo seguimos, Valen?',
    );
  });
});
