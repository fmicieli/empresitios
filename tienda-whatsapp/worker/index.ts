// Punto de entrada del Worker de Cloudflare: la tienda + el puente a Google (D-16).
import { crearPuente, type EntornoPuente } from '../../compartido/puente/puente';

let manejar: ReturnType<typeof crearPuente> | undefined;

export default {
  async fetch(req: Request, env: EntornoPuente): Promise<Response> {
    manejar ??= crearPuente({ fetch: (...a) => fetch(...a), cache: caches.default });
    return manejar(req, env);
  },
};
