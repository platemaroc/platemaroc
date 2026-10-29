-- Modelo v2 (docs/07-cambios-propuestos/modelo-de-datos-v2.md) APROBADO por el titular el 29-10-2026. Se aplica con apply.sh
-- y solo con su confirmación (maestro §5). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

create table place_types (id uuid primary key default gen_random_uuid(), slug text not null unique);
create table specialties (id uuid primary key default gen_random_uuid(), slug text not null unique);

create table places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  google_place_id text,                                   -- solo para enlazar (Fase 2)
  city_id uuid not null references cities(id),
  neighborhood_id uuid references neighborhoods(id),
  place_type_id uuid not null references place_types(id),
  price_range smallint check (price_range between 1 and 4),
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  opening_hours jsonb,
  phone text, website text, social jsonb,
  status content_status not null default 'borrador',
  verification_status verification_status not null default 'sin_verificar',
  verified_at timestamptz, verified_by text, verification_source text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((lat is null) = (lng is null)),                  -- coordenadas completas o ausentes
  check (verification_status = 'sin_verificar' or verified_at is not null)
);
create table dishes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  origin_region_id uuid references regions(id),
  main_ingredients text[],
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  author_name text,                                       -- autoría declarada (Quality Gate)
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table place_specialties (place_id uuid references places(id) on delete cascade, specialty_id uuid references specialties(id), primary key (place_id, specialty_id));
create table place_dishes     (place_id uuid references places(id) on delete cascade, dish_id uuid references dishes(id) on delete cascade, primary key (place_id, dish_id));
create table guide_places     (guide_id uuid references guides(id) on delete cascade, place_id uuid references places(id) on delete cascade, primary key (guide_id, place_id));
create table guide_dishes     (guide_id uuid references guides(id) on delete cascade, dish_id uuid references dishes(id) on delete cascade, primary key (guide_id, dish_id));
create table guide_cities     (guide_id uuid references guides(id) on delete cascade, city_id uuid references cities(id) on delete cascade, primary key (guide_id, city_id));
create table guide_neighborhoods (guide_id uuid references guides(id) on delete cascade, neighborhood_id uuid references neighborhoods(id) on delete cascade, primary key (guide_id, neighborhood_id));
create index on places (city_id);
create index on places (neighborhood_id);
create index on place_dishes (dish_id);
create index on guide_neighborhoods (neighborhood_id);
