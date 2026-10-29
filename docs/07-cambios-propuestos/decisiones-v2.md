# Decisiones v2 — estado consolidado

## Cerrado
- Idiomas: es/en/fr.
- Árabe retirado.
- Sin RTL.
- Sin `hreflang ar`.
- Menú digital: MVP.
- Reservas reales: Fase 2.
- Fase 1.5: opcional.
- Backups sin secretos.
- Quality Gate por entidad e idioma.
- Auditoría.
- Matriz de autoridad.
- `/es/`, `/en/`, `/fr/`.
- `hreflang` solo es/en/fr.

## Pendiente
- Proveedor SMS para login por teléfono, si se mantiene.
- Hoja de cálculo/formato de carga inicial.
- Activación de Fase 1.5.
- Proveedor/integración de reservas de Fase 2.
- Recetas como entidad/contenido.
- Analítica y política de cookies.
- Ajuste final de umbrales internos si el titular lo decide.

## Nuevas especificaciones integradas

- PWA/mobile-first para conectividad variable.
- Fallback estructural de mapas.
- Precios exclusivamente en MAD (sin conversiones ni campo de moneda).
- Mapa interactivo con carga diferida; fallback a los 3000 ms desde el inicio de la carga.
- IndexedDB: máximo 20 páginas con LRU; cachés del Service Worker versionadas.
