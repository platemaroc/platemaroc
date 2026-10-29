# Órdenes para Claude Code

Esta carpeta guarda tareas listas para pedir a Claude Code. Cada subcarpeta tiene:
- `orden.md`: qué debe hacer Claude Code, paso a paso, y sus límites.
- `resultados/`: donde Claude Code guarda sus informes con fecha.

## Cómo usarlas
En Claude Code, con la carpeta del proyecto abierta, escribe:

> Lee `ordenes-claude-code/reglas-generales.md` y después `ordenes-claude-code/<carpeta>/orden.md`, y ejecútala.

## Índice
| Carpeta | Para qué sirve | Frecuencia sugerida |
|---|---|---|
| `responder-resenas` | Preparar borradores de respuesta a reseñas | Cada semana |
| `generar-textos` | Redactar textos originales sobre gastronomía marroquí | Bajo demanda |
| `anti-duplicidad-y-google` | Evitar contenido duplicado y problemas con Google | Antes de publicar y cada mes |
| `testeo-rendimiento` | Medir velocidad y Core Web Vitals en móvil | Cada semana y tras cada cambio importante |
| `google-search-console` | Analizar indexación, clics y problemas en Google | Cada semana |
| `gestionar-contenido` | Crear, editar, generar y subir contenido en borrador (nunca eliminar) | Bajo demanda |
| `seguridad-servidor` | Auditar la seguridad del VPS, la web y la base de datos | Antes de lanzar y cada mes |
| `investigacion-seo` | Buscar novedades de SEO y mejoras para webs | Cada mes |
| `afiliados` | Buscar y comparar programas de afiliados | Cada trimestre |
| `monetizacion` | Ideas y plan de ingresos | Cada trimestre |
| `ideas-de-crecimiento` | Ideas y plan para hacer crecer el proyecto | Cada mes |

| `moderar-resenas` | Clasificar reseñas pendientes y proponer decisión | Bajo demanda / cada semana |
| `moderar-fotos` | Revisar derechos, alt localizado y estado de fotos | Bajo demanda |
| `moderar-menu` | Revisar menús pendientes (precios, alérgenos, disponibilidad) | Bajo demanda |
| `gestionar-menu-digital` | Crear y mantener menús digitales en borrador | Bajo demanda |
| `gestionar-reservas` | Solicitudes de reserva (Fase 1.5 / Fase 2) | Bajo demanda |
| `importar-lugares` | Importar lugares (CSV/hoja) como borrador | Bajo demanda |
| `revisar-traducciones` | Verificar traducciones es/en/fr | Bajo demanda |
| `revisar-pwa-conectividad` | Auditar Service Worker, caché y offline | Cada mes y tras cambios |
| `revisar-fallback-mapas` | Probar el fallback de mapas (timeout 3000 ms, `geo:`) | Cada mes y tras cambios |
| `revisar-precios-mad` | Verificar que los precios son solo MAD y no quedan restos de conversión | Cada mes |
| `copias-de-seguridad` | Verificar backups y restauración, sin secretos | Diario/semanal/trimestral |
| `estado-del-proyecto` | Informe periódico del estado real | Cada mes |

Las reglas comunes están en `reglas-generales.md`. Las especificaciones técnicas (`docs/10`, `11`, `12`) y el documento maestro (`docs/01`) tienen prioridad según `docs/09-matriz-de-autoridad.md`.
