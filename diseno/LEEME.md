# Bocetos de Platemaroc

Esquemas de estructura en grises con datos de ejemplo ficticios. **No son el diseño final**: el aspecto final (colores,
tipografía, logo) lo hará Claude Design siguiendo `docs/01-documento-maestro-operacion.md` (§19 y §20).

Formato (documento maestro §19): una imagen por pantalla o por pestaña, a pantalla completa.
Móvil: 900 × 2000 px. Ordenador: 1280 × 760 px. Cada carpeta tiene `movil/` y `ordenador/`.

| Carpeta | Contenido |
|---|---|
| `web-01-home` | Portada |
| `web-02-listado` | Listado único: ciudad, ciudad + tipo, guías, platos y búsqueda (4 pestañas) |
| `web-03-info-del-local` | Info del local: pestañas Info, Menú, Reseñas y Mapa |
| `web-04-menu` | Menú completo (sin platos archivados) |
| `web-05-plato-tipico` | Pestañas «Dónde comerlo» y «Qué es» |
| `web-06-guia` | Guía editorial |
| `pantallas-login` | Entrar, continuar con email / Google / passkey, crear cuenta y acceso al panel |
| `web-08-escribir-resena` | Escribir reseña y reseña enviada |
| `web-09-mi-cuenta` | Mis reseñas y mis datos |
| `web-10-pagina-de-texto` | Legales, sobre nosotros, contacto |
| `web-11-errores` | 404, 500, sin conexión, mantenimiento |
| `web-esqueleto` | Cabecera, pie de página y barra inferior |
| `panel-02-escritorio` | Escritorio con la moderación de reseñas y fotos |
| `panel-03-listado` | Listado genérico |
| `panel-04-formulario-local` | Nuevo local: Información, ES, EN, FR, Fotos, Menú, Redirecciones, Historial |
| `panel-05-fotos` a `panel-10-ajustes` | Fotos, redirecciones, usuarios, auditoría, importar/exportar, ajustes |
| `panel-esqueleto` | Barra lateral y cabecera del panel |

El acceso al panel está en `pantallas-login`. Cuando cambie una decisión, se regeneran los bocetos afectados.
