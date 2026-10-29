-- BORRADOR (propuesta v2, 29-10-2026). NO APLICAR hasta que el titular apruebe docs/07-cambios-propuestos/modelo-de-datos-v2.md
-- y se valide contra el esquema real (maestro §5, modelo v2). Nombres de tabla en inglés/snake_case; la correspondencia con
-- las entidades en español está en README.md. Precios solo en MAD: no existe columna de moneda (docs/12).

do $$
declare t text;
begin
  foreach t in array array['regions','cities','neighborhoods','places','dishes','guides','translations','reviews','review_replies','photos','menus','reservations'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;
