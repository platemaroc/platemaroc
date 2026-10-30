-- Fase 6 (30-10-2026), decisión del titular: el panel exige verificación en dos pasos.
-- Se exige también aquí y no solo en la web: una sesión robada sin el segundo paso podría llamar a la API directamente.
-- aal2 = la sesión ha superado el segundo paso. Sin él, el rol de administración no da ningún permiso.
-- Aplicar al proyecto real DESPUÉS de que el titular active su segundo factor o, si no, justo antes: el panel lo pedirá al entrar.
create or replace function is_admin() returns boolean language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and (auth.jwt() ->> 'aal') = 'aal2', false)
$$;
