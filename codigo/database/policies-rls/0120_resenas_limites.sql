-- Bloque 4c (30-10-2026). Propuesta: se prueba en la BD temporal y en el proyecto de pruebas; al proyecto real solo con aprobación del titular.
-- Los límites viven en la base de datos: la web no basta, porque la clave pública permite llamar a la API directamente.
-- En policies-rls/ y no en migrations/: debe ejecutarse después de 0110 (retira una política creada allí).

alter table reviews add constraint reviews_comment_length check (char_length(comment) <= 2000);

-- Máximo 5 reseñas en 24 horas por usuario (decisión del titular). Sin auth.uid() (servicio, migraciones) no aplica.
create function reviews_daily_limit() returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and (
    select count(*) from public.reviews r where r.user_id = auth.uid() and r.created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'reviews_daily_limit' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger reviews_daily_limit before insert on reviews for each row execute function reviews_daily_limit();

-- Máximo 3 fotos por reseña.
create function photos_per_review_limit() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.review_id is not null and (select count(*) from public.photos p where p.review_id = new.review_id) >= 3 then
    raise exception 'photos_per_review_limit' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger photos_per_review_limit before insert on photos for each row execute function photos_per_review_limit();

-- Las fotos de usuarios solo entran por el servidor, que las procesa (WebP, sin EXIF/GPS). Sin esto, la clave pública permitiría
-- subir un archivo sin limpiar directamente al bucket. El bucket además solo admite WebP de hasta 5 MB.
do $$
begin
  if to_regclass('storage.objects') is null then return; end if;
  execute 'drop policy if exists fotos_own_insert on storage.objects';
  update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/webp'] where id = 'fotos';
end $$;
