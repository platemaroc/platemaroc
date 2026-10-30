# Código integrado (andamiaje inicial)

**Fecha:** 29-10-2026 · **Estado:** propuesta técnica; requiere revisión y aprobación del titular.
Actualización 29-10-2026: la Fase 1 ya está hecha (ver "Fase 1" al final). Lo que sigue describía el andamiaje inicial: piezas independientes que
Claude Code debe adaptar al proyecto real, no reescribir desde cero.
Incorpora las decisiones técnicas del paquete `platemaroc-ajustes-tecnicos-2026-10-29`, que tienen prioridad
sobre las especificaciones anteriores (ver `docs/09-matriz-de-autoridad.md`).

## PWA, mapas y precios

| Archivo | Especificación | Qué hace |
|---|---|---|
| `public/sw.js` | `10` | Service Worker. Cache-First (con revalidación en segundo plano) para iconos, CSS, fuentes, `/_next/static/` y la página de guías. Network-First con copia en `IndexedDB`: máximo **20** páginas, política **LRU**. Cachés **versionadas**: al activar una versión nueva se borran cachés y copias antiguas; la versión nueva espera a `SKIP_WAITING`. |
| `codigo/frontend/components/RegisterServiceWorker.tsx` | 10 | Registra `/sw.js` (solo producción) y ofrece `onUpdateAvailable` para aplicar la versión nueva. |
| `codigo/frontend/maps/MapFallback.tsx` | `11` | Carga diferida (`idle → loading → ready/fallback`): `renderInteractive` no se invoca hasta que el usuario llega a la sección. Placeholder con `aspect-ratio` fijo (sin CLS). El temporizador de 3000 ms nace al empezar la carga. Sin red, sin coordenadas o sin `IntersectionObserver`: fallback sin cargar el SDK. Dirección, indicaciones y enlaces (`geo:` + `https`) siempre visibles bajo el mapa. |
| `codigo/frontend/maps/useNearViewport.ts`, `OfflineBanner.tsx`, `useOnlineStatus.ts` | 11 | Observer de viewport, banner offline (es/en/fr) y estado de red. |
| `codigo/shared/price.ts` | `12` | `formatPriceMad`: `120 MAD`; `null` si falta o no es válido ("Precio pendiente"). Solo MAD: no hay conversiones. |

## Resto del andamiaje

| Archivo | Referencia | Qué hace |
|---|---|---|
| `codigo/shared/locales.ts`, `states.ts` | maestro §3 y §13 | Idiomas es/en/fr; máquinas de estado (Claude Code no puede publicar, archivar ni despublicar). |
| `codigo/base-indexing/` | maestro §4 | Quality Gate por entidad e idioma (APTO / NO APTO / PENDIENTE), `robots.txt` y sitemaps con hreflang. |
| `seo/` | maestro §4 y §13 | Canónica, `hreflang`, `noindex`, JSON-LD sin datos inventados. |
| `codigo/security/` | maestro §1.8 y §5 | Cabeceras (HSTS, CSP) y detector de secretos. |
| `codigo/frontend/i18n/` | maestro §13 | Prefijos de idioma, sugerencia por `Accept-Language`, textos mínimos. |
| `codigo/backend/` | maestro §3 y §7 | Media de reseñas (solo aprobadas) y registro de auditoría. |
| `codigo/database/` | `modelo-de-datos-v2.md` | **Borrador** de migraciones y RLS (no aplicar hasta aprobar el modelo). |
| `config/` | maestro §5 y §9 | Plantilla de variables de entorno, guías de servidor y despliegue, scripts de backup. |
| `codigo/testing/` | — | Unitarias: `node --test codigo/testing/*.test.ts` (Node ≥ 22.18, sin dependencias). E2E en Chromium real: `codigo/testing/e2e/` (Service Worker y mapa). Base de datos: `codigo/database/tests/run.sh`. |

## Decisiones de diseño que no estaban en las especificaciones

- El Service Worker no guarda rutas `/api`, `/admin`, `/auth`, `/cuenta`, ni respuestas con `Set-Cookie`
  o `Cache-Control: private/no-store`.
- Las rutas `/{es|en|fr}/guias-gastronomicas`, `/restaurantes/<slug>` y `.../menu` son **supuestas** a partir
  de `content/`: hay que confirmarlas.
- `VERSION` del Service Worker debe subirse en cada despliegue que cambie recursos estáticos (idealmente inyectada por el build).
- Sin `IntersectionObserver` el mapa interactivo no se carga nunca (se prefiere un fallback útil a cargar el SDK sin que el usuario lo vea).
- Rechazar una reseña o foto pendiente (con motivo) lo puede hacer Claude Code; aprobar, publicar o despublicar requiere titular/administración.

## Límites conocidos

- El mapa estático necesita una fuente (proveedor o imagen almacenada): sin decidir.
- Verificado el 29-10-2026: tipos TypeScript, pruebas unitarias, el borrador SQL y sus políticas RLS en un PostgreSQL 16 temporal
  con `auth` simulado, el script de backup con herramientas simuladas, y en **Chromium real** el Service Worker (IndexedDB real,
  máx. 20 + LRU, versionado) y el mapa diferido (sin SDK en el render inicial, timeout de 3000 ms desde el inicio de la carga, CLS 0,
  offline y sin `IntersectionObserver`).
- **No** probado: con el SDK real de mapas, en Safari/iOS, en redes lentas reales ni en un servidor real. Corresponde a las órdenes
  `revisar-pwa-conectividad` y `revisar-fallback-mapas` y a la QA móvil.
- Los scripts de `config/` y el flujo de GitHub Actions son plantillas: no se han ejecutado en un VPS ni en GitHub.
- El borrador SQL no se ha ejecutado contra una base de datos Supabase real (solo PostgreSQL 16 con `auth` simulado).
- Revisión RLS del 29-10-2026 (visibilidad en cascada, fotos solo en la carpeta y reseñas propias, `search_path` fijo y
  `0110_storage_fotos_propuesta_v2.sql`): ejecutada el 29-10-2026 en PostgreSQL 16.15 portátil en Windows con `auth` simulado;
  las 22 pruebas de humo de `rls-smoke.sql` dan el resultado esperado. Las políticas de Storage no se han probado (no hay esquema
  `storage` en la BD simulada). En Windows: `PGBIN=/c/Users/pc/tools/pgsql-16/pgsql/bin bash codigo/database/tests/run.sh`.

## Fase 1 (29-10-2026)

Decisiones del titular: backend separado en el código (`codigo/backend/`) pero en el mismo proceso que la web; estilos con CSS Modules.

| Pieza | Dónde | Notas |
|---|---|---|
| Paquetes | `package.json` (raíz, workspaces `codigo/frontend` y `codigo/backend`) | Versiones exactas: Next.js 16.4.3, React 19.3.1, TypeScript 6.0.3, Supabase JS 2.118.0 |
| App | `codigo/frontend/app/` | `/` selector de idioma (solo sugiere por `Accept-Language`); `/{es,en,fr}` portada provisional; otros prefijos → 404. Todo `noindex` |
| Seguridad | `codigo/frontend/proxy.ts` + `codigo/security/headers.ts` | CSP con nonce por petición (sin `unsafe-inline` en scripts). `unsafe-eval` solo en `next dev`; sin `upgrade-insecure-requests` en localhost |
| Service Worker | `codigo/frontend/scripts/prepare-sw.mjs` | Copia `public/sw.js` a la app en cada dev/build e inyecta `VERSION` = versión base + commit |
| Supabase | `codigo/backend/supabase/` y `codigo/frontend/lib/supabase-browser.ts` | Sin conectar aún: falta crear el proyecto Supabase y rellenar `codigo/frontend/.env.local` |

Verificado el 29-10-2026: tipos, 24 pruebas unitarias, build de producción, E2E (Service Worker y mapa) en Chromium, y en el navegador
`/`, `/es`, `/en`, `/fr` (lang correcto, nonce en todos los scripts, sin errores de CSP en consola, enlaces de 48 px, sin scroll horizontal
a 375 px) en modo producción y desarrollo. Pendiente: favicon e iconos (`/favicon.ico` da 404) y rutas reales (`docs/08`, punto 9).

## Fase 2 (29-10-2026)

El titular aprueba el modelo de datos v2 (favoritos fuera del MVP; relación guía–barrio; datos de referencia en borrador).

| Pieza | Dónde | Notas |
|---|---|---|
| Huecos cubiertos | `0003`, `0006`, `0009`, `0100` | `guide_neighborhoods` (+ RLS en cascada); perfil automático al registrarse (`on_auth_user_created`); las traducciones y traducciones de menú comprueban que su destino existe; fechas en categorías, artículos y traducciones del menú |
| Datos de referencia | `codigo/database/seeders/0001_referencia.sql` | 5 tipos de lugar, 12 regiones (decreto 2-15-40 de 2015) y Tánger, todo en borrador y sin coordenadas |
| Aplicación | `codigo/database/apply.sh` | Cada archivo una vez, en su transacción, registrado con SHA-256 en `platemaroc_meta.applied_files`; se detiene si un archivo aplicado cambia; `--dry-run` y `--seed`. `DATABASE_URL` en `.env.local` |
| Pruebas | `codigo/database/tests/` | 27 pruebas de humo y ensayo completo de `apply.sh` (A1-A5) en PostgreSQL 16.15 con `auth` simulado |

Aplicado el 29-10-2026 a Supabase (proyecto en eu-central-1, Fráncfort), con confirmación del titular: 12 archivos (9 migraciones,
2 de RLS y 1 de datos de referencia). Verificado por la API real: un visitante no ve las regiones en borrador (0) y el servidor sí (12);
los tipos de lugar son públicos (5); la auditoría da "permission denied"; un visitante no puede crear regiones ni reseñas (RLS 42501);
el bucket `fotos` existe y es privado, y un visitante no lista archivos; el registro de `apply.sh` (`platemaroc_meta`) no está expuesto en la API.
Conexión: `DATABASE_URL` del Session pooler SIN contraseña y `DATABASE_PASSWORD` aparte (la conexión directa solo es IPv6).
Rol de administración: asignado el 29-10-2026 a la cuenta del titular (creada por él en el panel de Supabase), en `app_metadata.role`,
con su confirmación y registrado en `audit_log`. Su perfil se creó solo al darse de alta (trigger verificado en la base real).
Pendiente: comprobar `is_admin()` con una sesión real cuando exista el login (Fase 4).

## Fase 3 (29-10-2026)

Decisiones del titular: secciones traducidas (mismo slug), mapa estático = texto y enlaces + imagen opcional, datos demo solo en
desarrollo, barra inferior de 5 accesos y paleta provisional.

| Pieza | Dónde | Notas |
|---|---|---|
| Rutas | `codigo/shared/routes.ts` | Fuente única de las secciones por idioma; la usan la app, el selector de idioma y el Service Worker |
| Sistema de diseño | `codigo/components-ui/mobile-design/` | `tokens.css`/`tokens.ts`, estrellas (solo reseñas aprobadas), precio MAD con "Precio pendiente", foto con espacio reservado |
| Componentes | `codigo/frontend/components/` | Cabecera con selector de idioma (no enlaza versiones sin publicar), barra inferior, migas, tarjetas, aviso demo |
| Plantillas | `codigo/frontend/app/[locale]/` | Portada; listados por tipo, lugares, platos, guías y ciudades; fichas de lugar, plato, guía y ciudad; menú; barrio |
| Datos | `codigo/backend/content/` | Supabase con clave pública (RLS manda) o demo (`npm run dev:demo`, prohibido en producción). Fotos por `/media/…` |
| Mapa | `codigo/frontend/maps/PlaceMap.tsx`, `GoogleMapInteractive.tsx` | `MapFallback` sin cambios; el SDK solo se descarga al llegar a la sección y con clave |
| Service Worker | `public/sw.js` + `prepare-sw.mjs` | Guarda sin conexión las fichas y menús de TODOS los tipos de lugar en los tres idiomas (antes solo restaurantes en español) |
| Propuesta | `migrations/propuesta-v2/0010_direccion_indicaciones.sql` | Dirección, indicaciones por idioma e imagen de mapa estático. Aprobada por el titular y aplicada a Supabase el 29-10-2026 (columnas verificadas por la API; RLS sin cambios) |

Verificado el 29-10-2026: tipos, 30 pruebas unitarias, 28 pruebas de humo SQL y ensayo de `apply.sh`, build de producción, E2E en Chromium
(Service Worker, mapa y `pages.e2e.cjs`: 15 rutas, 8 plantillas a 375 px con lang correcto, sin scroll horizontal, targets ≥ 48 px, alt en
imágenes, selector de idioma, mapa idle → fallback sin SDK y CLS 0, aviso offline), y en producción contra el Supabase real (secciones vacías,
borradores en 404, sin errores, scripts con nonce, Service Worker activo).
No probado: con contenido publicado real, con la clave de Google Maps, en Safari/iOS ni con red lenta real.
Pendiente: revisión nativa de los textos en/fr y de los segmentos de URL (`revisar-traducciones`); favicon e iconos; metadatos SEO (Fase 5).

## Fase 4a (29-10-2026): acceso y armazón del panel

Decisiones del titular: acceso por enlace o código al email (sin contraseña); Google más tarde; CSV UTF-8 para importar; fotos de reseñas limpiadas (máx. 3).

| Pieza | Dónde | Notas |
|---|---|---|
| Sesión | `codigo/frontend/proxy.ts`, `lib/supabase-server.ts` | Renovada solo en `/admin` y `/auth` (las páginas públicas no consultan la sesión ni crean cookies); allí `no-store` y `X-Robots-Tag: noindex` |
| Acceso | `app/auth/` | `/auth/entrar` (es/en/fr), `/auth/callback` (PKCE o token_hash), salir. Mismo mensaje exista o no la cuenta; solo rutas internas tras entrar |
| Panel | `app/admin/`, `lib/admin.ts` | `requireAdmin()` en el layout y en cada acción: sin sesión → entrar; sin rol → 404. Inicio con lo pendiente de decisión, con la sesión del titular (RLS) |
| Auditoría | `backend/admin-moderation/audit-writer.ts` | `recordAudit` (service_role solo para audit_log) y `panelAudit`; se usará en cada acción desde 4b |

Verificado: tipos, 33 pruebas unitarias, build, `pages.e2e.cjs` y `auth.e2e.cjs` (sin sesión no se entra; cookie falsa rechazada; callback
sin redirecciones abiertas; noindex/no-store en zonas privadas; públicas sin cookies; formulario sin revelar cuentas; campos ≥ 48 px).
Comprobado por el titular el 29-10-2026 con su cuenta real: enlace del email → /auth/callback (307) → /admin (200), es decir, sesión e
is_admin funcionan de punta a punta. Redirect URLs configuradas en Supabase. El correo de serie de Supabase solo vale para pruebas.

## Fase 4b (30-10-2026): gestión de contenido en el panel

Decisiones del titular: slug fijo al publicar; sharp para las fotos; sus fotos aprobadas si tienen origen, autor, licencia y alt en
español; horario por días (vacío = cerrado); proyecto Supabase de pruebas para las pruebas automáticas del panel.

| Pieza | Dónde | Notas |
|---|---|---|
| Tipos | `backend/admin-moderation/entities.ts` | Lugares, ciudades, barrios, platos, guías y regiones (solo textos y estado) con sus relaciones |
| Lógica | `content-admin.ts`, `photos-admin.ts`, `validate.ts` | Siempre con la sesión del titular (RLS); `canTransition` en cada estado; auditoría por campo; sin borrar contenido |
| Fotos | `images.ts` (sharp 0.35.5) | Formato por contenido, orientación, 1600 px, WebP, sin EXIF/GPS. Vista previa en el panel con enlaces firmados de 10 min |
| Pantallas | `app/admin/[entity]/…` | Lista con filtros, alta (en borrador), ficha: estado + Quality Gate, datos, textos es/en/fr, relaciones, fotos, mapa estático |
| Quality Gate | `gate-preview.ts` | Reglas reales de `quality-gate.ts`; lo no comprobado (duplicidad) deja PENDIENTE, nunca APTO |
| Horario | `shared/week.ts` | {mon..sun}; los días y "Cerrado" se traducen solos en la web |

Verificado: tipos, 43 pruebas unitarias (incl. una foto con GPS que sale sin EXIF), build y ensayo de `apply.sh`.
`admin.e2e.cjs` pasa contra el proyecto Supabase de pruebas (aws-0-eu-west-2, 13 archivos aplicados): usuario sin rol → 404; alta con errores
claros y datos conservados; textos, publicación y ficha pública; slug fijo; foto con GPS servida por /media en WebP 1600 px sin EXIF; auditoría con
origen panel; todo ≥ 48 px en móvil. El proyecto real no recibió datos de prueba.
No probado aún: Google Maps real, Safari/iOS, y el panel con el rol del titular guardando contenido real.

## Fase 4c (30-10-2026): reseñas y moderación

| Pieza | Dónde | Notas |
|---|---|---|
| Usuario | `app/cuenta/`, `backend/reviews/` | Mi cuenta (nombre visible, reseñas con estado y motivo, editar, borrar) y formulario de reseña. Zona privada: la ficha pública sigue sin consultar la sesión |
| Moderación | `app/admin/resenas`, `app/admin/fotos`, `moderation-admin.ts` | Aprobar o rechazar con motivo; fotos con alt en el idioma de la reseña; respuestas hasta "aprobada", nunca publicadas (Fase 2) |
| Público | `[slug]/page.tsx`, `supabase-source.ts` | Solo reseñas aprobadas, en su idioma original, con nombre visible; nunca el email |
| Base de datos | `policies-rls/0120_resenas_limites.sql` | Máx. 5 reseñas en 24 h, 3 fotos por reseña, comentario ≤ 2000. El usuario ya no puede subir al bucket: solo el servidor, tras procesar la imagen. Bucket limitado a WebP de 5 MB |
| Alta pública | `PUBLIC_SIGNUP_ENABLED` | Apagada por defecto. No activar en producción sin política de privacidad y SMTP |

Verificado: tipos, 44 pruebas unitarias, 31 de humo SQL, build, y en el proyecto de pruebas `reviews.e2e.cjs` (recorrido completo y ataques directos a la API:
aprobarse la reseña o la foto, crear una foto aprobada, subir al bucket, editar/borrar/leer lo ajeno, sexta reseña en 24 h; todos rechazados) más `admin.e2e.cjs`.
`0120` aprobada por el titular y aplicada a pruebas y a real el 30-10-2026. No probado: alta de una cuenta nueva con email real, Safari/iOS.

## Fase 4d (30-10-2026): menú e importación

| Pieza | Dónde | Notas |
|---|---|---|
| Menú | `admin/[entity]/[id]/menu`, `menu-admin.ts` | Uno por lugar; categorías y artículos es/en/fr; precio solo en MAD, verificado o pendiente; publicar completo, ocultar artículos, retirar sin borrar |
| Web pública | `supabase-source.ts` | Un precio sin verificar sale como "Precio pendiente" aunque tenga importe (docs/12) |
| QR | `menu/qr/route.ts` (qrcode 1.5.4) | PNG por idioma, solo administración, con la URL definitiva de platemaroc.com |
| Importación | `admin/importar`, `csv-import.ts`, `import-admin.ts` | Plantilla, vista previa sin guardar, errores por fila, duplicados omitidos, todo en borrador; se revalida al confirmar; auditoría con origen importacion |

Verificado: tipos, pruebas unitarias, build y `menu.e2e.cjs` en el proyecto de pruebas. Avisos por email aplazados hasta tener SMTP; fotos de artículos del menú fuera de este bloque.
