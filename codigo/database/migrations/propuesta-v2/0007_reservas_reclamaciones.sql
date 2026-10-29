-- Modelo v2 (docs/07-cambios-propuestos/modelo-de-datos-v2.md) APROBADO por el titular el 29-10-2026. Se aplica con apply.sh
-- y solo con su confirmación (maestro §5). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

-- Fase 1.5 (solicitud simple) y Fase 2 (integración real). Sin disponibilidad inventada.
create table reservations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id),
  user_id uuid references profiles(id) on delete set null,
  guest_name text not null, guest_contact text not null,
  party_size int not null check (party_size > 0),
  requested_for timestamptz not null,
  notes text,
  status reservation_status not null default 'solicitada',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table reservation_slots (                           -- Fase 2: la rellena el sistema integrado
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id),
  starts_at timestamptz not null,
  capacity int not null check (capacity >= 0),
  source text not null,
  unique (place_id, starts_at)
);
create table business_claims (                             -- Fase 2
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id),
  user_id uuid not null references profiles(id),
  status moderation_status not null default 'pendiente',
  evidence jsonb,
  created_at timestamptz not null default now()
);
