-- Datos de referencia reales (no inventados), aprobados por el titular el 29-10-2026. Idempotente: se puede ejecutar varias veces.
-- Todo entra en BORRADOR: publicar lo decide el titular. Coordenadas vacías a propósito: se rellenan con una fuente citada.
-- Los nombres visibles (es/en/fr) van en `translations`, no aquí.

-- Tipos de lugar (docs/modelo-de-datos.md, "tipo_de_lugar"). Slugs alineados con las secciones de content/.
insert into place_types (slug) values
  ('restaurantes'), ('cafes-y-teterias'), ('pastelerias-y-panaderias'), ('comida-callejera'), ('mercados-y-zocos')
on conflict (slug) do nothing;

-- Las 12 regiones de la división administrativa de Marruecos de 2015 (decreto n.º 2-15-40, de 20-02-2015).
insert into regions (slug, status) values
  ('tanger-tetouan-al-hoceima', 'borrador'),
  ('oriental', 'borrador'),
  ('fes-meknes', 'borrador'),
  ('rabat-sale-kenitra', 'borrador'),
  ('beni-mellal-khenifra', 'borrador'),
  ('casablanca-settat', 'borrador'),
  ('marrakech-safi', 'borrador'),
  ('draa-tafilalet', 'borrador'),
  ('souss-massa', 'borrador'),
  ('guelmim-oued-noun', 'borrador'),
  ('laayoune-sakia-el-hamra', 'borrador'),
  ('dakhla-oued-ed-dahab', 'borrador')
on conflict (slug) do nothing;

-- Primera ciudad (modelo: "se empieza por Tánger").
insert into cities (region_id, slug, status)
select id, 'tanger', 'borrador' from regions where slug = 'tanger-tetouan-al-hoceima'
on conflict (slug) do nothing;
