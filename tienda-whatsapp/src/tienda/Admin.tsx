// Admin de esta plantilla: el admin de compartido/ con los módulos que usa una tienda.

import { AdminApp } from '@compartido/admin/nucleo/AdminApp';
import { moduloPedidos } from '@compartido/admin/pedidos/ModuloPedidos';
import { moduloProductos } from '@compartido/admin/productos/ModuloProductos';
import { config, ds } from '../lib/contexto';

export default function Admin() {
  return (
    <AdminApp
      ds={ds}
      config={{
        nombre: config.nombre,
        urlTienda: config.url,
        whatsappSoporte: config.whatsappSoporte,
        clave: config.clave,
        googleClientId: config.googleClientId,
      }}
      modulos={[moduloPedidos, moduloProductos]}
    />
  );
}
