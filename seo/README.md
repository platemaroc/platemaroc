# seo/

Metadatos y JSON-LD (andamiaje inicial, sin dependencias; adaptar al Next.js real).

- `types.ts`: `SITE_URL` y `PageVersion`.
- `metadata.ts`: canónica, `hreflang` (solo es/en/fr y solo versiones publicadas e indexables), `robots` (noindex si falla el Quality Gate) y entradas de sitemap.
- `json-ld.ts`: `Restaurant`, `BreadcrumbList`, `WebSite`. Solo emite datos existentes; la valoración, solo con reseñas aprobadas.
- Pruebas: `node --test codigo/testing/seo.test.ts`.

Integrado en la Fase 5: `codigo/frontend/lib/seo.ts` (metadatos e interruptor), `backend/admin-moderation/indexing.ts` (cálculo de `is_indexable`) y las rutas `sitemap.xml` y `robots.txt`.
Reglas: `docs/01-documento-maestro-operacion.md` §4 y §13. Verificar la documentación oficial vigente de Google antes de cambiar criterios.
