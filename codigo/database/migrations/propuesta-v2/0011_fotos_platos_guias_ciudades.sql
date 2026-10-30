-- Fotos de platos, guías y ciudades (docs/08, punto 9): el Quality Gate (maestro §4.2) las exige y `photos` solo admitía lugares y reseñas.
-- Una foto pertenece a un solo destino. Los barrios no tienen columna: el Quality Gate no les pide foto.
alter table photos
  add column dish_id uuid references dishes(id),
  add column guide_id uuid references guides(id),
  add column city_id uuid references cities(id);

alter table photos drop constraint photos_check;
alter table photos add constraint photos_target check (
  (num_nonnulls(dish_id, guide_id, city_id) = 1 and place_id is null and review_id is null)
  or (num_nonnulls(dish_id, guide_id, city_id) = 0 and (place_id is not null or review_id is not null))
);

create index on photos (dish_id, status);
create index on photos (guide_id, status);
create index on photos (city_id, status);
