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

Pendiente (necesita al titular): crear el proyecto Supabase, rellenar claves y `DATABASE_URL`, aplicar con su confirmación, probar
allí Storage y RLS reales, y dar el rol de administración a su cuenta.
