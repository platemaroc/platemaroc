-- Modelo v2 (docs/07-cambios-propuestos/modelo-de-datos-v2.md) APROBADO por el titular el 29-10-2026. Se aplica con apply.sh
-- y solo con su confirmación (maestro §5). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

create table audit_log (                                   -- campos mínimos: maestro §7
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  actor text not null,
  origen audit_source not null,
  entidad_tipo text not null check (entidad_tipo in ('place','dish','guide','city','neighborhood','translation','review','photo','menu','reservation','redirect','config')),
  entidad_id text not null,
  accion text not null,
  campo text, valor_anterior jsonb, valor_nuevo jsonb, motivo text,
  aprobado_por text, fecha_aprobacion timestamptz,
  check (aprobado_por is null or fecha_aprobacion is not null)
);
create function audit_log_immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'audit_log es de solo inserción'; end $$;
create trigger audit_log_no_update before update or delete on audit_log
  for each row execute function audit_log_immutable();

create table redirects (                                   -- un cambio de URL lo decide el titular
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code smallint not null default 301 check (status_code in (301, 302, 307, 308)),
  created_by text, created_at timestamptz not null default now()
);
create table consents (                                    -- versión y fecha del consentimiento
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  purpose text not null, version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now()
);
