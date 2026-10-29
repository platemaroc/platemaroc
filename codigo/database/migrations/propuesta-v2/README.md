# Migraciones — borrador v2 (NO aplicar)

Propuesta del modelo `docs/07-cambios-propuestos/modelo-de-datos-v2.md` sobre `docs/modelo-de-datos.md`.
Hasta que el titular la apruebe y se valide contra el esquema real, no se ejecuta contra ninguna base de datos.
Se valida en una instancia PostgreSQL 16 de pruebas con un esquema `auth` simulado (ver `docs/13`).

| Entidad (docs) | Tabla |
|---|---|
| lugar / plato / guía / ciudad / barrio / región | `places` / `dishes` / `guides` / `cities` / `neighborhoods` / `regions` |
| traducción | `translations` (+ `is_indexable` por entidad e idioma) |
| reseña / respuesta | `reviews` / `review_replies` |
| foto / foto_traduccion | `photos` / `photo_translations` |
| menú / categoría / artículo / menu_traduccion | `menus` / `menu_categories` / `menu_items` / `menu_translations` |
| reserva / reserva_slot / reclamación | `reservations` / `reservation_slots` / `business_claims` |
| auditoría / redirect / consent | `audit_log` / `redirects` / `consents` |

Precios: `menu_items.price_mad` (nulo = pendiente), sin columna de moneda (`docs/12`).
Idiomas: `locale_code` = es/en/fr. Los umbrales del Quality Gate NO están en la base de datos (`codigo/base-indexing/`).
