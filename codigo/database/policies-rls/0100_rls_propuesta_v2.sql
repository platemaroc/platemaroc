-- BORRADOR (propuesta v2, 29-10-2026). NO APLICAR hasta aprobar el modelo y validar contra el esquema real.
-- Supone Supabase: roles anon/authenticated/service_role, auth.uid() y auth.jwt().
-- El rol de administración se lee de app_metadata (NO de user_metadata, que edita el propio usuario).
-- service_role se salta RLS y solo se usa en backend/scripts seguros, nunca en el navegador.
-- Funciones con search_path vacío (aviso function_search_path_mutable de Supabase): todo va con esquema explícito.

create function is_admin() returns boolean language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- ---- Visibilidad pública en cascada: una fila solo es pública si también lo es todo aquello de lo que depende.
-- Sin esto, una traducción, foto, reseña o artículo de menú publicado dejaría ver un lugar o menú en borrador.
create function place_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.places where id = p_id and status = 'publicado')
$$;
create function dish_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.dishes where id = p_id and status = 'publicado')
$$;
create function guide_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.guides where id = p_id and status = 'publicado')
$$;
create function city_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.cities where id = p_id and status = 'publicado')
$$;
create function entity_is_public(p_type public.translatable_entity, p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select case p_type
    when 'region'       then exists (select 1 from public.regions where id = p_id and status = 'publicado')
    when 'city'         then public.city_is_public(p_id)
    when 'neighborhood' then exists (select 1 from public.neighborhoods where id = p_id and status = 'publicado')
    when 'place'        then public.place_is_public(p_id)
    when 'dish'         then public.dish_is_public(p_id)
    when 'guide'        then public.guide_is_public(p_id)
    else false end
$$;
create function review_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.reviews r where r.id = p_id and r.status = 'aprobada' and public.place_is_public(r.place_id))
$$;
create function photo_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.photos p where p.id = p_id and p.status = 'aprobada'
    and (p.place_id is null or public.place_is_public(p.place_id))
    and (p.review_id is null or public.review_is_public(p.review_id)))
$$;
create function menu_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.menus m where m.id = p_id and m.status = 'publicado' and public.place_is_public(m.place_id))
$$;
create function menu_category_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.menu_categories c where c.id = p_id and c.status = 'publicado' and public.menu_is_public(c.menu_id))
$$;
create function menu_item_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.menu_items i where i.id = p_id and i.status = 'publicado' and public.menu_category_is_public(i.category_id))
$$;

do $$
declare t text;
begin
  foreach t in array array['regions','cities','neighborhoods','place_types','specialties','places','dishes','guides',
    'place_specialties','place_dishes','guide_places','guide_dishes','guide_cities','translations','profiles','reviews',
    'review_replies','photos','photo_translations','menus','menu_categories','menu_items','menu_translations',
    'reservations','reservation_slots','business_claims','audit_log','redirects','consents'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---- Lectura pública: solo contenido publicado / aprobado, y solo si su entidad superior también es pública
create policy public_read on regions       for select using (status = 'publicado');
create policy public_read on cities        for select using (status = 'publicado');
create policy public_read on neighborhoods for select using (status = 'publicado');
create policy public_read on place_types   for select using (true);
create policy public_read on specialties   for select using (true);
create policy public_read on places        for select using (status = 'publicado');
create policy public_read on dishes        for select using (status = 'publicado');
create policy public_read on guides        for select using (status = 'publicado');
create policy public_read on place_specialties for select using (place_is_public(place_id));
create policy public_read on place_dishes  for select using (place_is_public(place_id) and dish_is_public(dish_id));
create policy public_read on guide_places  for select using (guide_is_public(guide_id) and place_is_public(place_id));
create policy public_read on guide_dishes  for select using (guide_is_public(guide_id) and dish_is_public(dish_id));
create policy public_read on guide_cities  for select using (guide_is_public(guide_id) and city_is_public(city_id));
create policy public_read on translations for select using (status = 'publicada' and entity_is_public(entity_type, entity_id));
create policy public_read on reviews       for select using (status = 'aprobada' and place_is_public(place_id));
create policy public_read on review_replies for select using (status = 'publicada' and review_is_public(review_id));
-- En la propia tabla la condición va en línea: llamar a *_is_public(id) volvería a leerla (recursión infinita en RLS).
create policy public_read on photos        for select using (status = 'aprobada'
  and (place_id is null or place_is_public(place_id)) and (review_id is null or review_is_public(review_id)));
create policy public_read on photo_translations for select using (photo_is_public(photo_id));
create policy public_read on menus         for select using (status = 'publicado' and place_is_public(place_id));
create policy public_read on menu_categories for select using (status = 'publicado' and menu_is_public(menu_id));
create policy public_read on menu_items    for select using (status = 'publicado' and menu_category_is_public(category_id));
create policy public_read on menu_translations for select using (status = 'publicada' and case target_type
  when 'menu' then menu_is_public(target_id) when 'category' then menu_category_is_public(target_id)
  when 'item' then menu_item_is_public(target_id) else false end);
create policy public_read on profiles      for select using (true);   -- la tabla solo contiene campos públicos

-- ---- Usuario autenticado: solo lo suyo, y solo sobre lugares publicados
create policy own_insert on profiles for insert to authenticated with check (id = auth.uid());
create policy own_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy own_read   on reviews for select to authenticated using (user_id = auth.uid());
create policy own_insert on reviews for insert to authenticated with check (user_id = auth.uid() and status = 'pendiente' and place_is_public(place_id));
-- Editar una reseña la devuelve a moderación.
create policy own_update on reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'pendiente' and place_is_public(place_id));
-- PENDIENTE DEL TITULAR: ¿puede el usuario borrar su propia reseña? Se mantiene mientras no decida.
create policy own_delete on reviews for delete to authenticated using (user_id = auth.uid());

create policy own_read   on photos for select to authenticated using (user_id = auth.uid());
-- La foto va en la carpeta del propio usuario en Storage (<uid>/...) y, si se liga a una reseña, esta debe ser suya.
create policy own_insert on photos for insert to authenticated with check (
  user_id = auth.uid() and status = 'pendiente'
  and split_part(storage_path, '/', 1) = auth.uid()::text
  and (place_id is null or place_is_public(place_id))
  and (review_id is null or exists (select 1 from reviews r where r.id = photos.review_id and r.user_id = auth.uid())));
create policy own_delete on photos for delete to authenticated using (user_id = auth.uid());

create policy own_read   on reservations for select to authenticated using (user_id = auth.uid());
create policy own_insert on reservations for insert to authenticated with check (user_id = auth.uid() and status = 'solicitada' and place_is_public(place_id));

create policy own_read   on consents for select to authenticated using (user_id = auth.uid());
create policy own_insert on consents for insert to authenticated with check (user_id = auth.uid());

-- ---- Administración (panel): moderación y estados
do $$
declare t text;
begin
  foreach t in array array['regions','cities','neighborhoods','place_types','specialties','places','dishes','guides',
    'place_specialties','place_dishes','guide_places','guide_dishes','guide_cities','translations','profiles','reviews',
    'review_replies','photos','photo_translations','menus','menu_categories','menu_items','menu_translations',
    'reservations','reservation_slots','business_claims','redirects','consents'] loop
    execute format('create policy admin_all on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- ---- Auditoría: lectura para administración; las escrituras solo las hace el servicio (service_role)
create policy admin_read on audit_log for select to authenticated using (is_admin());
revoke all on audit_log from anon, authenticated;
grant select on audit_log to authenticated;
