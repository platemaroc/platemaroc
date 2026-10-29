-- Modelo v2 (docs/07-cambios-propuestos/modelo-de-datos-v2.md) APROBADO por el titular el 29-10-2026. Se aplica con apply.sh
-- y solo con su confirmación (maestro §5). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

do $$
declare t text;
begin
  foreach t in array array['regions','cities','neighborhoods','places','dishes','guides','translations','reviews','review_replies','photos','menus','menu_categories','menu_items','menu_translations','reservations'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- ---- Perfil automático al registrarse (Supabase Auth). Sin perfil no se pueden escribir reseñas ni subir fotos.
-- No copia el nombre de Google ni el email: profiles es pública y el nombre visible lo elige el usuario.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
revoke all on function handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---- Integridad de las traducciones polimórficas: la entidad de destino debe existir.
create function check_translation_target() returns trigger language plpgsql set search_path = '' as $$
declare ok boolean;
begin
  ok := case new.entity_type
    when 'region'       then exists (select 1 from public.regions where id = new.entity_id)
    when 'city'         then exists (select 1 from public.cities where id = new.entity_id)
    when 'neighborhood' then exists (select 1 from public.neighborhoods where id = new.entity_id)
    when 'place'        then exists (select 1 from public.places where id = new.entity_id)
    when 'dish'         then exists (select 1 from public.dishes where id = new.entity_id)
    when 'guide'        then exists (select 1 from public.guides where id = new.entity_id)
    else false end;
  if not ok then raise exception 'translations: no existe % %', new.entity_type, new.entity_id; end if;
  return new;
end $$;
create trigger translations_target before insert or update of entity_type, entity_id on translations
  for each row execute function check_translation_target();

create function check_menu_translation_target() returns trigger language plpgsql set search_path = '' as $$
declare ok boolean;
begin
  ok := case new.target_type
    when 'menu'     then exists (select 1 from public.menus where id = new.target_id)
    when 'category' then exists (select 1 from public.menu_categories where id = new.target_id)
    when 'item'     then exists (select 1 from public.menu_items where id = new.target_id)
    else false end;
  if not ok then raise exception 'menu_translations: no existe % %', new.target_type, new.target_id; end if;
  return new;
end $$;
create trigger menu_translations_target before insert or update of target_type, target_id on menu_translations
  for each row execute function check_menu_translation_target();
