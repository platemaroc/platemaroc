-- Migración 0011: una foto de plato, guía o ciudad solo es pública si está aprobada y su ficha está publicada.
-- Los usuarios solo suben fotos de reseña: el contenido editorial es del panel.
create or replace function photo_is_public(p_id uuid) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.photos p where p.id = p_id and p.status = 'aprobada'
    and (p.place_id is null or public.place_is_public(p.place_id))
    and (p.review_id is null or public.review_is_public(p.review_id))
    and (p.dish_id is null or public.dish_is_public(p.dish_id))
    and (p.guide_id is null or public.guide_is_public(p.guide_id))
    and (p.city_id is null or public.city_is_public(p.city_id)))
$$;

drop policy public_read on photos;
create policy public_read on photos for select using (status = 'aprobada'
  and (place_id is null or place_is_public(place_id)) and (review_id is null or review_is_public(review_id))
  and (dish_id is null or dish_is_public(dish_id)) and (guide_id is null or guide_is_public(guide_id)) and (city_id is null or city_is_public(city_id)));

drop policy own_insert on photos;
create policy own_insert on photos for insert to authenticated with check (
  user_id = auth.uid() and status = 'pendiente'
  and split_part(storage_path, '/', 1) = auth.uid()::text
  and dish_id is null and guide_id is null and city_id is null
  and (place_id is null or place_is_public(place_id))
  and (review_id is null or exists (select 1 from reviews r where r.id = photos.review_id and r.user_id = auth.uid())));
