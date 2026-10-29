# Pendientes de decisión del titular

## Prioridad alta
1. Formato de hoja de cálculo para carga inicial de lugares.
2. Proveedor de SMS para login por teléfono, si se mantiene ese método.
3. Activar o no Fase 1.5 de reservas.
4. Proveedor/integración de reservas para Fase 2.

## Prioridad media
5. Recetas como entidad/contenido.
6. Analítica y política de cookies.
7. Ajuste final de los umbrales internos del Quality Gate.

## Añadidos al integrar el código (29-10-2026)
8. Origen del mapa estático de respaldo (proveedor o imagen almacenada).
9. Rutas reales de fichas, menús y guías para el Service Worker.

## Añadidos al revisar RLS (29-10-2026)
10. Si un usuario puede borrar su propia reseña (el borrador RLS lo permite mientras no se decida).
11. Nombre del bucket de Storage para fotos (propuesto: `fotos`, privado).

## Ya decidido
- Precios exclusivamente en MAD, sin conversiones (29-10-2026).
- Mapa con carga diferida; IndexedDB máx. 20 con LRU; cachés versionadas (29-10-2026).
- Enlace `https` de respaldo para iOS además de `geo:` (29-10-2026).
- Idiomas: es/en/fr.
- Árabe retirado.
- Sin RTL.
- Sin `hreflang ar`.
- Menú digital en MVP.
- Reservas reales en Fase 2.
- Fase 1.5 opcional.
- Quality Gate por entidad e idioma.
- Auditoría.
- Backups sin secretos.

## Regla
Este archivo contiene solo decisiones realmente pendientes. Una fecha de creación del
paquete no debe confundirse con una fecha límite o decisión del producto.