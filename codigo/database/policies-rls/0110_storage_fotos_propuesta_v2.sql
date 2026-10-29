-- BORRADOR (propuesta v2, 29-10-2026). NO APLICAR hasta aprobar el modelo y validar contra el esquema real.
-- Storage de Supabase para las fotos. Nombre del bucket ('fotos') propuesto: lo confirma el titular.
-- Bucket PRIVADO: una foto pendiente o rechazada no tiene URL pública. Solo se lee si su fila en photos es visible
-- (las políticas de 0100 se aplican también aquí, porque la consulta a photos se hace con los permisos de quien lee).
-- Ruta de cada archivo: <uid del usuario>/<nombre>. Las fotos del titular las sube el backend con service_role.
-- Si no existe el esquema storage (BD de pruebas con auth simulado), este archivo no hace nada.

do $$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage.objects no existe: se omiten las políticas de Storage';
    return;
  end if;

  insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict (id) do nothing;

  execute $p$create policy fotos_read on storage.objects for select using (
    bucket_id = 'fotos' and exists (select 1 from public.photos p where p.storage_path = name))$p$;
  execute $p$create policy fotos_own_insert on storage.objects for insert to authenticated with check (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute $p$create policy fotos_own_delete on storage.objects for delete to authenticated using (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute $p$create policy fotos_admin_all on storage.objects for all to authenticated
    using (bucket_id = 'fotos' and public.is_admin()) with check (bucket_id = 'fotos' and public.is_admin())$p$;
end $$;
