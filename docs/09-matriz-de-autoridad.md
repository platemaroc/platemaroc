# Matriz de autoridad

| Tema | Fuente principal | Regla |
|---|---|---|
| Principios de operación | `01-documento-maestro-operacion.md` | Manda el maestro |
| Responsabilidades | `01-documento-maestro-operacion.md` | Manda el maestro |
| Estados | `01-documento-maestro-operacion.md` | Manda el maestro |
| Quality Gate | `01-documento-maestro-operacion.md` + plantilla | El maestro fija reglas; la plantilla documenta |
| Acceso técnico | `01-documento-maestro-operacion.md` | Solo vías autorizadas |
| Dependencias/frecuencias | `01-documento-maestro-operacion.md` | Frecuencia no altera aprobación |
| Auditoría | Maestro + modelo v2 | Modelo v2 es propuesta hasta aprobación |
| Notificaciones | Maestro | MVP email + panel |
| Backups | Maestro + `copias-de-seguridad.md` | Sin secretos |
| Producto/fases | Maestro + `decisiones-v2.md` | El titular decide cambios |
| Modelo BD | `modelo-de-datos-v2.md` | Propuesta hasta aprobación |
| Reseñas | `moderar-resenas.md` + órdenes originales disponibles | Aplicar reglas de moderación vigentes |
| Fotos | `moderar-fotos.md` | Derechos y alt localizado |
| Menú | `gestionar-menu-digital.md` + `moderar-menu.md` | No inventar precios/disponibilidad |
| Reservas | `gestionar-reservas.md` | Nunca inventar disponibilidad |
| Seguridad | Orden original de seguridad | Auditoría primero; cambios con aprobación |
| SEO | Órdenes SEO originales + maestro | Verificar documentación oficial vigente |
| Datos actuales | Último `estado-del-proyecto` real | No inventar métricas |
| Pendientes | `08-pendientes-decidir.md` | Solo decisiones abiertas |
| PWA/conectividad móvil | `10-politica-pwa-conectividad.md` + `revisar-pwa-conectividad.md` + `public/sw.js` | La especificación recibida define las estrategias de caché y fallback |
| Mapas/geolocalización | `11-protocolo-fallback-mapas.md` + `revisar-fallback-mapas.md` + `codigo/frontend/maps/` | Aplicar fallback estructural y pruebas definidas |
| Precios menú | `12-especificacion-precios-mad.md` + `revisar-precios-mad.md` + `codigo/shared/price.ts` | Solo MAD; sin conversiones |

## Prioridad de las decisiones técnicas del 29-10-2026

Las decisiones del paquete `platemaroc-ajustes-tecnicos-2026-10-29` (solo MAD; carga diferida del mapa; IndexedDB máx. 20 con LRU; cachés versionadas del Service Worker) tienen prioridad sobre cualquier especificación anterior que contemple moneda dual o carga inmediata del mapa.

## Regla de conflicto

Si dos documentos se contradicen:

1. aplicar esta matriz;
2. si no resuelve el conflicto, no ejecutar la parte conflictiva;
3. informar al titular;
4. esperar decisión.

Un documento antiguo que conserve árabe no tiene autoridad sobre la decisión actual es/en/fr.
