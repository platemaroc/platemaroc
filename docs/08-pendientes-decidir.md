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
8. Identidad visual (logo y colores): la paleta actual es provisional.
9. Fotos para platos, guías y ciudades: APLAZADO por el titular (30-10-2026; aún no tiene fotos). El Quality Gate (maestro §4.2) las exige y `photos` solo admite lugares y reseñas: sin la migración propuesta (columnas `dish_id`, `guide_id`, `city_id`), esas fichas no serán indexables.

## Añadidos al revisar RLS (29-10-2026)
10. Nombre del bucket de Storage para fotos (propuesto: `fotos`, privado).

## Añadidos en el bloque 4c (30-10-2026)
11. Textos legales: política de privacidad (`/privacidad` está en borrador) y frases de consentimiento de reseña y fotos. Sin ellos y sin SMTP, `PUBLIC_SIGNUP_ENABLED` no se activa en producción.

(Retirado el 29-10-2026: "si un usuario puede borrar su propia reseña" ya estaba decidido en `docs/modelo-de-datos.md`: sí puede.)

## Añadidos en la Fase 6 (30-10-2026)
12. Aprobar aplicar `policies-rls/0130_admin_dos_pasos.sql` al proyecto real y activar el segundo factor del titular.
13. Reloj del equipo del titular: va una hora atrasado y el servicio de hora de Windows está parado.

## Ya decidido
- Precios exclusivamente en MAD, sin conversiones (29-10-2026).
- Mapa con carga diferida; IndexedDB máx. 20 con LRU; cachés versionadas (29-10-2026).
- Enlace `https` de respaldo para iOS además de `geo:` (29-10-2026).
- Modelo de datos v2 aprobado; favoritos fuera del MVP; relación guía–barrio; datos de referencia en borrador (29-10-2026).
- Backend separado en el código, mismo proceso que la web; estilos con CSS Modules (29-10-2026).
- Rutas: secciones traducidas por idioma y mismo slug en los tres (`codigo/shared/routes.ts`); barra de navegación inferior (29-10-2026).
- Mapa estático de respaldo: texto y enlaces siempre + imagen opcional subida por la administración (29-10-2026).
- Datos de demostración solo en desarrollo, con prefijo `demo-` (29-10-2026).
- Migración 0010 aprobada y aplicada: dirección, indicaciones por idioma e imagen del mapa estático (29-10-2026).
- Fase 6: eliminar cuenta borra cuenta, perfil, reseñas, fotos y consentimientos; dos pasos obligatorios en el panel; límites de intentos en la aplicación; páginas de menú indexables (30-10-2026).
- SEO: interruptor SITE_INDEXING_ENABLED apagado hasta el lanzamiento; duplicidad interna automática; verificación máxima de 365 días; portada indexable, listados con 3 fichas indexables o más, `/` con noindex; favicon provisional (30-10-2026).
- Menú 4d: uno por lugar; publicar el menú completo con artículos ocultables; QR en el panel; avisos por email aplazados hasta tener SMTP; importación CSV en borrador con vista previa (30-10-2026).
- Reseñas 4c: nombre visible obligatorio; casilla de derechos en fotos de usuarios; alt obligatorio en el idioma de la reseña; reseñas en idioma original; máximo 5 reseñas en 24 h y 3 fotos por reseña (30-10-2026).
- Panel 4b: slug fijo al publicar; fotos procesadas con sharp; fotos del titular aprobadas si tienen origen, autor, licencia y alt; horario por días (30-10-2026).
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