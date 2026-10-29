-- BORRADOR (propuesta v2, 29-10-2026). NO APLICAR hasta que el titular apruebe docs/07-cambios-propuestos/modelo-de-datos-v2.md
-- y se valide contra el esquema real (maestro §5, modelo v2). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

-- Una fila por entidad e idioma. La integridad de (entity_type, entity_id) la valida la aplicación o un trigger futuro.
create table translations (
  id uuid primary key default gen_random_uuid(),
  entity_type translatable_entity not null,
  entity_id uuid not null,
  locale locale_code not null,
  title text, description text, content text, seo_title text, seo_description text,
  status translation_status not null default 'borrador',
  is_indexable boolean not null default false,            -- resultado del Quality Gate por entidad e idioma
  indexable_checked_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, locale),
  check (not is_indexable or status = 'publicada')        -- solo una traducción publicada puede ser indexable
);
create index on translations (entity_type, entity_id);
