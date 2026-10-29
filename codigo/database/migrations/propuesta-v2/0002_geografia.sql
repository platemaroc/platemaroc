-- BORRADOR (propuesta v2, 29-10-2026). NO APLICAR hasta que el titular apruebe docs/07-cambios-propuestos/modelo-de-datos-v2.md
-- y se valide contra el esquema real (maestro §5, modelo v2). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

create table regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table cities (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references regions(id),
  slug text not null unique,
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id),
  slug text not null,
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (city_id, slug)
);
create index on cities (region_id);
create index on neighborhoods (city_id);
