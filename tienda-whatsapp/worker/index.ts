// Punto de entrada del Worker de Cloudflare: la tienda + el puente a Google (D-16).
// El ID de cliente de Google sale de la configuración de la tienda (un solo lugar por cliente).
import { crearPuente, type EntornoPuente } from '../../compartido/puente/puente';
import config from '../config/tienda.config';

let manejar: ReturnType<typeof crearPuente> | undefined;

export default {
  async fetch(req: Request, env: EntornoPuente): Promise<Response> {
    manejar ??= crearPuente({ fetch: (...a) => fetch(...a), cache: caches.default });
    return manejar(req, { ...env, GOOGLE_CLIENT_ID: config.googleClientId });
  },
};
