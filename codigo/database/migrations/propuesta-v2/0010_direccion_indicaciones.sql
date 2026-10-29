-- Aprobada por el titular el 29-10-2026 (dirección, indicaciones e imagen del mapa estático en las fichas).
-- docs/11 exige mostrar siempre la dirección postal y las indicaciones de llegada en texto bajo el mapa (también sin conexión),
-- y el modelo v2 no tenía dónde guardarlas.
-- La dirección es una sola (no se traduce); las indicaciones sí, por idioma, en `translations`.

alter table places add column address text;
alter table translations add column directions text;   -- solo tiene sentido para entity_type = 'place'
-- Imagen opcional del mapa estático de respaldo (decisión del 29-10-2026): la sube la administración al bucket `fotos`
-- y se muestra cuando el mapa interactivo no carga. Puede guardarse para verla sin conexión.
alter table places add column static_map_path text;
