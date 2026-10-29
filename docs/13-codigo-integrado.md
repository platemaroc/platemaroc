# Código integrado (andamiaje inicial)

**Fecha:** 29-10-2026 · **Estado:** propuesta técnica; requiere revisión y aprobación del titular.
La aplicación Next.js todavía no está inicializada (Fase 1): estos archivos son piezas independientes que
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
