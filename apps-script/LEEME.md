# apps-script

Código de Google Apps Script que va pegado en la planilla de cada comercio (`Codigo.gs`).

- Cómo instalarlo y conectarlo: `docs/09-guia-conectar-cliente.md`.
- Pruebas sin cuenta de Google: `pruebas/` (una "Google de mentira" que imita la planilla y Drive). Se corren con `npm test`.
- La planilla modelo la arma `configurarPlanilla()` sola: pestañas, encabezados, protecciones, casillas y la carpeta de fotos.
- Las fotos se ordenan solas en Drive al guardar cada producto: `Categoría / Subcategoría / Código · Nombre / Código-1.jpg` (D-26). Para reordenar todas (al conectar una tienda que ya tenía fotos o después de renombrar una categoría), ejecutá `ordenarTodasLasFotos()` desde el editor.
- Para cambiar de una vez las fotos de varios productos por las publicadas en la tienda: `actualizarFotos()`, con los códigos en `Config → actualizarFotosDe` (guía 09, D-33).
