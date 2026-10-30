# Migraciones — modelo v2 (aprobado el 29-10-2026)

Modelo `docs/07-cambios-propuestos/modelo-de-datos-v2.md` sobre `docs/modelo-de-datos.md`, aprobado por el titular el 29-10-2026.
La carpeta conserva el nombre `propuesta-v2` para no mover rutas. Se aplica a Supabase con `codigo/database/apply.sh`, solo con
confirmación del titular y después de ensayarlo con `codigo/database/tests/run.sh`.
**Una vez aplicado a la base real, un archivo no se edita:** cualquier cambio va en un archivo nuevo con el siguiente número
(`apply.sh` se detiene si detecta que un archivo aplicado ha cambiado).

| Entidad (docs) | Tabla |
|---|---|
| lugar / plato / guía / ciudad / barrio / región | `places` / `dishes` / `guides` / `cities` / `neighborhoods` / `regions` |
| relaciones de guía | `guide_places` / `guide_dishes` / `guide_cities` / `guide_neighborhoods` |
| traducción | `translations` (+ `is_indexable` por entidad e idioma) |
| usuario y perfil | `auth.users` (Supabase) / `profiles` (se crea sola al registrarse, sin copiar nombre ni email) |
| reseña / respuesta | `reviews` / `review_replies` |
| foto / foto_traduccion | `photos` / `photo_translations` |
| menú / categoría / artículo / menu_traduccion | `menus` / `menu_categories` / `menu_items` / `menu_translations` |
| reclamación | `business_claims` (las reservas se retiraron con `policies-rls/0150`) |
| auditoría / redirect / consent | `audit_log` / `redirects` / `consents` |

Precios: `menu_items.price_mad` (nulo = pendiente), sin columna de moneda (`docs/12`).
Idiomas: `locale_code` = es/en/fr. Los umbrales del Quality Gate NO están en la base de datos (`codigo/base-indexing/`).
Favoritos: fuera del MVP (decisión del 29-10-2026).
`0010`: dirección (`places.address`), indicaciones por idioma (`translations.directions`) e imagen del mapa estático (`places.static_map_path`), aprobada y aplicada el 29-10-2026.
Límite conocido: borrar una entidad no borra sus traducciones (el maestro no permite eliminar contenido; se archiva).
