# Documento maestro de operación de Platemaroc

**Estado:** candidato a congelación.  
**Fecha:** 29-10-2026  
**Autoridad:** máxima autoridad operativa documental.

Si otra orden contradice este documento, Claude Code no ejecuta la parte contradictoria:
la señala, registra el conflicto y espera decisión del titular.

---

## 1. Principios irrenunciables

1. Nada se publica sin aprobación del titular.
2. Claude Code nunca elimina, archiva ni despublica por iniciativa propia.
3. Si detecta contenido débil, duplicado, obsoleto o problemático, propone una acción.
4. No se inventan datos.
5. Precios, horarios, direcciones, ingredientes, disponibilidad, premios y citas deben
   proceder del titular o de fuentes verificables con fecha/referencia.
6. Afiliados, anuncios y destacados de pago no alteran puntuaciones, moderación ni orden
   orgánico.
7. Se aplica privacidad por defecto conforme al marco legal aplicable.
8. Los secretos no se guardan en Git ni en backups normales.
9. Idiomas oficiales del producto: `es`, `en`, `fr`.
10. Árabe queda retirado del producto actual: sin RTL y sin `hreflang ar`.

---

## 2. Responsabilidades

### Titular

Decide:

- publicación;
- archivado/despublicación;
- cambios de URL;
- aprobación editorial;
- aprobación de respuestas a reseñas;
- servicios de pago;
- claves y secretos;
- decisiones de producto;
- activación de fases opcionales;
- decisiones ante conflictos documentales.

El titular ejecuta las operaciones que requieran panel, cuenta personal o aprobación
explícita.

### Claude Code

Puede:

- redactar borradores;
- proponer cambios;
- auditar;
- generar informes;
- ejecutar scripts autorizados;
- usar backend/API documentados y autenticados;
- cargar contenido como borrador;
- generar/importar CSV;
- preparar cambios técnicos para revisión.

No puede decidir autónomamente:

- publicación;
- archivado;
- despublicación;
- cambio de URL;
- gasto;
- contratación de servicios;
- exposición de secretos;
- activación de funcionalidades no aprobadas.

### Panel de administración

Es una herramienta para el titular/rol administrativo. Claude Code no debe asumir que
puede hacer clic en el panel. Cuando exista acceso técnico real, debe utilizarse el
script/backend/API documentado y autorizado.

---

## 3. Estados

### Contenido
`borrador -> revisado -> publicado -> archivado`

- `borrador`: no visible y no indexable.
- `revisado`: aprobado editorialmente, todavía pendiente de publicación.
- `publicado`: visible y candidato a indexación si supera Quality Gate.
- `archivado`: solo por decisión del titular.

### Traducciones
`borrador -> revisada -> publicada`

Un idioma solo puede publicarse/indexarse cuando su traducción está realmente preparada.

### Reseñas
`pendiente -> aprobada | rechazada`

Las rechazadas deben conservar el motivo de moderación. Solo las aprobadas se muestran
y cuentan para la valoración media.

### Respuestas a reseñas
`borrador -> aprobada por titular -> publicada`

En MVP se preparan borradores; la publicación queda para la fase aprobada.

### Fotos
`pendiente -> aprobada | rechazada`

Cuando corresponda, deben registrarse origen, autor/licencia y moderación.

### Menú digital
`borrador -> revisado -> publicado -> archivado`

El menú está ligado a un lugar e incluye categorías, artículos, precios, alérgenos,
disponibilidad y fotografías únicamente cuando la información exista y sea fiable.

### Reservas
`solicitada -> confirmada | rechazada | cancelada | completada | no-show`

Fase 1.5: solicitud simple, sin disponibilidad en tiempo real.  
Fase 2: integración real con disponibilidad proporcionada por el sistema conectado.

---

## 4. Quality Gate e `is_indexable`

El Quality Gate es un criterio interno de calidad. No debe presentarse como requisito
oficial de Google.

### 4.1 Requisitos comunes por entidad e idioma

1. Traducción publicada en ese idioma.
2. Descripción suficiente según el umbral interno de la entidad.
3. Estado publicado.
4. Sin duplicidad relevante detectada.
5. Enlazado interno suficiente.
6. Datos factuales verificados cuando corresponda.
7. Metadatos y elementos multimedia válidos cuando la entidad los requiera.

### 4.2 Requisitos específicos

| Entidad | Requisitos |
|---|---|
| Lugar | Coordenadas válidas + ciudad; al menos 1 foto aprobada con alt en el idioma; al menos 1 enlace entrante y 2 salientes; verificación reciente cuando aplique. |
| Plato | Al menos 1 relación con lugar; al menos 1 foto aprobada; enlaces útiles a lugares y/o guías; no requiere coordenadas propias. |
| Guía | Al menos 3 relaciones útiles; al menos 2 fotos aprobadas; autoría declarada. |
| Ciudad | Coordenadas; al menos 3 lugares publicados; al menos 1 foto aprobada. |
| Barrio | Coordenadas; ciudad asignada; al menos 1 lugar publicado. |
| Menú | Ligado a lugar publicado; cada categoría publicada tiene al menos 1 artículo publicado; precios verificados o claramente marcados como pendientes; traducción del idioma correspondiente. |

### 4.3 Umbrales internos

| Entidad | Mínimo interno |
|---|---:|
| Lugar | 300 caracteres |
| Plato | 300 caracteres |
| Guía | 500 caracteres |
| Ciudad | 500 caracteres |
| Barrio | 250 caracteres |
| Menú | 200 caracteres |

Estos mínimos son criterios internos. No se debe rellenar artificialmente un texto para
alcanzarlos.

### 4.4 Enlazado interno

- Lugar: al menos 1 entrante + 2 salientes.
- Plato: al menos 1 relación saliente útil.
- Guía: al menos 3 relaciones útiles.
- Ciudad/barrio: al menos 1 relación saliente útil.

Si una entidad falla el Quality Gate, puede permanecer almacenada, pero no debe publicarse
como indexable. No se elimina por fallar el Quality Gate.

---

## 5. Acceso técnico

| Vía | Uso |
|---|---|
| Supabase | Scripts/backend autorizados; credenciales solo en entorno seguro. |
| CSV | Importación/exportación documentada. |
| API interna | Endpoint documentado y autenticado. |
| Panel | Operación manual del titular. |

Prohibido:

- credenciales hardcodeadas;
- `service_role` en navegador;
- secretos en Git;
- asumir acceso técnico inexistente.

Las operaciones técnicas relevantes deben quedar auditadas.

---

## 6. Dependencias y frecuencias

### Dependencia lógica

`datos -> contenido -> traducciones -> moderación -> aprobación -> publicación -> Quality Gate -> sitemap/SEO`

La secuencia exacta puede variar por entidad, pero nunca debe saltarse la aprobación
requerida.

### Frecuencias

- Diario: backup de base de datos.
- Semanal: Search Console, rendimiento y backups de fotos/configuración no secreta.
- Mensual: seguridad, duplicidad, SEO, estado y crecimiento.
- Trimestral: prueba de restauración, afiliados y monetización.
- Bajo demanda: contenido, importaciones, traducciones y moderación.

La frecuencia no cambia los requisitos de aprobación.

---

## 7. Auditoría

Campos mínimos:

`id`, `fecha`, `actor`, `origen`, `entidad_tipo`, `entidad_id`, `accion`, `campo`,
`valor_anterior`, `valor_nuevo`, `motivo`, `aprobado_por`, `fecha_aprobacion`.

Fuentes permitidas:

- `panel`
- `claude_code`
- `importacion`
- `sistema`

Entidades auditables incluyen:

- place
- dish
- guide
- city
- neighborhood
- translation
- review
- photo
- menu
- reservation
- redirect
- config

---

## 8. Notificaciones

MVP: email + panel.

Alertar de:

- reseñas problemáticas;
- fotos con derechos dudosos;
- menús pendientes;
- contenido pendiente de aprobación;
- verificaciones antiguas;
- fallo de backup;
- caídas/5xx;
- problemas importantes de indexación;
- alertas de seguridad.

No se presupone SMS/push para alertas en MVP.

---

## 9. Backups

- Base de datos: diario.
- Fotos y configuración no secreta: semanal.
- Retención propuesta: 7 diarias, 4 semanales y 3 mensuales.
- Copias externas y cifradas.
- Secretos reales: gestor seguro del titular; nunca en backup normal.
- Puede conservarse un inventario de secretos, nunca sus valores.
- Restauración documentada.
- Prueba de restauración trimestral.

---

## 10. Privacidad

Aplicar RGPD y Ley 09-08 según corresponda.

Revisar:

- base legal/consentimiento;
- versión y fecha del consentimiento;
- exportación/eliminación de datos;
- retención;
- cookies/analítica;
- política de privacidad;
- minimización;
- logs y accesos.

---

## 11. Métricas

- búsquedas;
- fichas vistas;
- clics en "Cómo llegar";
- teléfono/web;
- filtros;
- ciudades/platos consultados;
- conversión a reseña;
- reseñas aprobadas;
- menús vistos;
- QR;
- solicitudes de reserva.

---

## 12. Producto por fases

### MVP

- lugares;
- ciudades;
- barrios;
- platos;
- guías;
- traducciones es/en/fr;
- fotos;
- reseñas moderadas;
- menú digital;
- panel;
- mapas;
- SEO/Quality Gate/sitemap;
- seguridad;
- backups;
- auditoría;
- notificaciones;
- analítica cuando sea aprobada.

### Fase 1.5 opcional

Formulario/email de solicitud de reserva. Sin disponibilidad en tiempo real.

### Fase 2

- reclamación de negocios;
- perfiles de propietarios;
- reservas con integración real;
- respuestas a reseñas publicadas;
- recetas si se aprueban;
- favoritos;
- Google Places/Business;
- más idiomas si se decide;
- seguimiento avanzado;
- monetización.

### Retirado

- árabe;
- RTL;
- `hreflang ar`.

---

## 13. Idiomas y URLs

URLs oficiales:

- `/es/`
- `/en/`
- `/fr/`

`hreflang` únicamente entre esas tres versiones.

No existen:

- `/ar/`;
- `hreflang ar`;
- traducciones árabes;
- RTL.

Puede existir una sugerencia de idioma basada en `Accept-Language` como ayuda UX. La
implementación concreta debe revisarse con la documentación técnica/SEO vigente antes
de desarrollarse. No se afirma aquí que Google penalice una técnica concreta.

---

## 14. Regla de conflicto

Manda `09-matriz-de-autoridad.md`.

Si no resuelve el conflicto:

1. no ejecutar la parte conflictiva;
2. registrar el conflicto;
3. informar al titular;
4. esperar decisión.

---

## 15. Conectividad móvil y PWA

La política de conectividad móvil y PWA queda incorporada al proyecto.

- Mobile-first bajo condiciones de red variables en Marruecos.
- Service Worker con Cache-First para iconos, CSS críticos, fuentes y la página principal de guías gastronómicas.
- Network-First para fichas de restaurantes y menús digitales.
- Fallback a los últimos datos almacenados en `IndexedDB` cuando no haya red, con un máximo de 20 fichas/páginas y política LRU.
- Cachés del Service Worker versionadas, con actualización y limpieza de versiones antiguas.
- Fotografías de platos y restaurantes en WebP/AVIF con `lazy-loading`.

La especificación completa está en `10-politica-pwa-conectividad.md`.

---

## 16. Fallback de mapas y geolocalización

Las fichas de lugares deben mantener una experiencia útil aunque el mapa interactivo externo no responda.

- Coordenadas `lat`/`lng` disponibles para las fichas de lugares.
- Mapa estático de respaldo.
- `MapFallback.tsx` como componente de respaldo.
- El mapa interactivo se carga solo cuando el usuario alcanza visualmente la sección (`IntersectionObserver` o equivalente); ni el SDK ni sus componentes pesados se cargan en el render inicial.
- El placeholder del mapa reserva su espacio para evitar CLS.
- Timeout de `3000ms`, que empieza solo después de iniciar la carga del mapa.
- Ruta en texto.
- Botón para abrir una aplicación externa mediante enlace `geo:`, más enlace `https` de respaldo para iOS.
- Indicador de conectividad offline y dirección/indicaciones en texto.

La especificación completa está en `11-protocolo-fallback-mapas.md`.

---

## 17. Precios (solo MAD)

Para menús digitales:

- Platemaroc utiliza exclusivamente MAD para los precios.
- `menu_items` guarda el importe en `price_mad`; no existe campo genérico de moneda.
- No hay conversiones a otras monedas, tipos de cambio, selectores de moneda ni precios aproximados.
- Un precio ausente o no verificado se muestra como pendiente; nunca se inventa.

La especificación completa está en `12-especificacion-precios-mad.md`.
