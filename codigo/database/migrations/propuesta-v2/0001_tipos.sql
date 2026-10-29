-- Modelo v2 (docs/07-cambios-propuestos/modelo-de-datos-v2.md) APROBADO por el titular el 29-10-2026. Se aplica con apply.sh
-- y solo con su confirmación (maestro §5). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

create type locale_code        as enum ('es', 'en', 'fr');          -- sin árabe ni RTL
create type content_status     as enum ('borrador', 'revisado', 'publicado', 'archivado');
create type translation_status as enum ('borrador', 'revisada', 'publicada');
create type moderation_status  as enum ('pendiente', 'aprobada', 'rechazada');
create type reply_status       as enum ('borrador', 'aprobada_por_titular', 'publicada');
create type reservation_status as enum ('solicitada', 'confirmada', 'rechazada', 'cancelada', 'completada', 'no-show');
create type verification_status as enum ('sin_verificar', 'verificado', 'caducado');
create type price_status       as enum ('verificado', 'pendiente');
create type availability_status as enum ('disponible', 'agotado', 'desconocida');
create type audit_source       as enum ('panel', 'claude_code', 'importacion', 'sistema');
create type translatable_entity as enum ('region', 'city', 'neighborhood', 'place', 'dish', 'guide');

create function set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
