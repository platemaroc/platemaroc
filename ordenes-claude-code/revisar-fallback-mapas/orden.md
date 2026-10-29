# Orden: revisar fallback de mapas y geolocalización

## Objetivo

Verificar que las fichas de lugares no queden inutilizables cuando el proveedor de mapas interactivos no responde o el dispositivo pierde conectividad.

## Antes de empezar

- Lee `docs/11-protocolo-fallback-mapas.md`.
- Comprueba el acceso técnico al proyecto y la existencia de `MapFallback.tsx` antes de proponer cambios de implementación.
- No sustituyas proveedores de mapas ni cambies APIs sin aprobación.

## Pasos

1. Verificar que las fichas disponen de `lat` y `lng`.
2. Verificar la disponibilidad del mapa estático de respaldo.
3. Comprobar la carga diferida: ni el SDK del mapa ni sus componentes pesados aparecen en la red ni en el bundle del render inicial; solo se cargan cuando el usuario llega visualmente a la sección (`IntersectionObserver`).
   - Comprobar que el placeholder reserva su espacio (CLS ≈ 0 al cargar el mapa o al pasar al fallback).
   - Probar el timeout de `3000ms`: debe empezar únicamente cuando se inicia la carga del mapa, no antes.
4. Comprobar que el fallback muestra mapa estático, ruta en texto y botón de apertura mediante `geo:` y el enlace `https` de respaldo (comprobar en iOS y Android).
5. Probar el indicador de conectividad offline.
6. Comprobar que la dirección postal completa y las indicaciones en texto siguen disponibles sin internet.
7. Registrar fallos y casos no comprobables.
8. Proponer correcciones sin ejecutarlas cuando requieran aprobación.

## Entregable

Informe en `resultados/` con escenarios probados, resultado, discrepancias y acciones propuestas.
