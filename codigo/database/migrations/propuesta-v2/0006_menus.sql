-- Modelo v2 (docs/07-cambios-propuestos/modelo-de-datos-v2.md) APROBADO por el titular el 29-10-2026. Se aplica con apply.sh
-- y solo con su confirmación (maestro §5). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

create table menus (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id),
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  position int not null default 0,
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  position int not null default 0,
  price_mad numeric(10,2) check (price_mad >= 0),         -- único importe; nulo = precio pendiente. SIN campo de moneda.
  price_status price_status not null default 'pendiente',
  allergens text[],                                       -- solo si están verificados
  availability availability_status not null default 'desconocida',
  photo_id uuid references photos(id) on delete set null,
  status content_status not null default 'borrador',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (price_status <> 'verificado' or price_mad is not null)
);
create table menu_translations (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('menu', 'category', 'item')),
  target_id uuid not null,
  locale locale_code not null,
  name text, description text,
  status translation_status not null default 'borrador',
  is_indexable boolean not null default false,            -- solo relevante para target_type = 'menu'
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (target_type, target_id, locale),
  check (not is_indexable or status = 'publicada')
);
create index on menus (place_id);
create index on menu_categories (menu_id);
create index on menu_items (category_id);
