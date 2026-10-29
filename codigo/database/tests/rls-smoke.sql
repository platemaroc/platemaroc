-- Pruebas de humo del borrador v2 (RLS y restricciones). Ejecutadas por tests/run.sh sobre una BD temporal.
\set ON_ERROR_STOP off
-- datos mínimos (como superusuario)
insert into regions(slug,status) values('tanger-tetuan','publicado');
insert into cities(region_id,slug,status) select id,'tanger','publicado' from regions;
insert into place_types(slug) values('restaurante');
insert into places(slug,city_id,place_type_id,status) select 'demo-a',c.id,t.id,'publicado' from cities c, place_types t;
insert into places(slug,city_id,place_type_id,status) select 'demo-borrador',c.id,t.id,'borrador' from cities c, place_types t;
insert into auth.users(id) values ('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');
update profiles set display_name='u';   -- los perfiles los crea el trigger on_auth_user_created
insert into reviews(user_id,place_id,rating,status) select '11111111-1111-1111-1111-111111111111',id,5,'aprobada' from places where slug='demo-a';
insert into menus(place_id,status) select id,'publicado' from places where slug='demo-a';
insert into menu_categories(menu_id,status) select id,'publicado' from menus;
\echo '--- 1. anon ve solo publicado: esperado 1'
set role anon; select count(*) from places; reset role;
\echo '--- 2. anon ve reseña aprobada: esperado 1'
set role anon; select count(*) from reviews; reset role;
\echo '--- 3. usuario 2 intenta insertar reseña con status aprobada: ERROR esperado'
set role authenticated; set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222';
insert into reviews(user_id,place_id,rating,status) select auth.uid(),id,4,'aprobada' from places where slug='demo-a';
\echo '--- 4. usuario 2 inserta pendiente: OK, y ve la suya + la aprobada = 2'
insert into reviews(user_id,place_id,rating) select auth.uid(),id,4 from places where slug='demo-a';
select count(*) from reviews;
\echo '--- 5. usuario 2 intenta aprobar su reseña: 0 filas / ERROR'
update reviews set status='aprobada' where user_id=auth.uid();
\echo '--- 6. usuario normal no ve audit_log: 0 filas (la 22 lo comprueba con datos)'
select count(*) from audit_log; reset role;
\echo '--- 7. admin vía JWT ve borrador: esperado 2'
set role authenticated; set request.jwt.claims='{"app_metadata":{"role":"admin"}}'; select count(*) from places; reset role;
\echo '--- 8. rechazo sin motivo: ERROR esperado'
update reviews set status='rechazada' where status='pendiente';
\echo '--- 9. precio verificado sin importe: ERROR; precio pendiente nulo: OK'
insert into menu_items(category_id,price_status) select id,'verificado' from menu_categories;
insert into menu_items(category_id) select id from menu_categories;
\echo '--- 10. indexable sin publicar: ERROR esperado'
insert into translations(entity_type,entity_id,locale,is_indexable) select 'place',id,'es',true from places where slug='demo-a';
\echo '--- 11. idioma ar: ERROR esperado'
insert into translations(entity_type,entity_id,locale) values('place',gen_random_uuid(),'ar');
\echo '--- 12. audit_log inmutable: ERROR esperado en update'
insert into audit_log(actor,origen,entidad_tipo,entidad_id,accion) values('t','sistema','place','1','x');
update audit_log set accion='y';
\echo '--- 13. no existe columna de moneda en menu_items: esperado 0'
select count(*) from information_schema.columns where table_name='menu_items' and column_name ilike '%moneda%' or table_name='menu_items' and column_name ilike '%currency%';
-- ---- Visibilidad en cascada, fotos propias y search_path (revisión RLS del 29-10-2026)
reset role; set request.jwt.claims = ''; set request.jwt.claim.sub = '';
insert into translations(entity_type,entity_id,locale,status) select 'place',id,'es','publicada' from places;
insert into reviews(user_id,place_id,rating,status) select '22222222-2222-2222-2222-222222222222',id,3,'aprobada' from places where slug='demo-borrador';
insert into menus(place_id,status) select id,'publicado' from places where slug='demo-borrador';
insert into menu_categories(menu_id,status) select m.id,'publicado' from menus m join places p on p.id=m.place_id where p.slug='demo-borrador';
insert into menu_items(category_id,status) select id,'publicado' from menu_categories;
\echo '--- 14. anon: traducción publicada de un lugar en borrador oculta: esperado 1'
set role anon; select count(*) from translations; reset role;
\echo '--- 15. anon: reseña aprobada de un lugar en borrador oculta: esperado 1'
set role anon; select count(*) from reviews; reset role;
\echo '--- 16. anon: menú publicado de un lugar en borrador oculto: menus 1, menu_items 1'
set role anon; select count(*) as menus from menus; select count(*) as menu_items from menu_items; reset role;
set role authenticated; set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222';
\echo '--- 17. usuario 2 liga una foto a la reseña del usuario 1: ERROR esperado'
insert into photos(user_id,review_id,storage_path) select auth.uid(),r.id,auth.uid()||'/a.jpg' from reviews r where r.user_id='11111111-1111-1111-1111-111111111111';
\echo '--- 18. usuario 2 usa una ruta fuera de su carpeta: ERROR esperado'
insert into photos(user_id,place_id,storage_path) select auth.uid(),id,'11111111-1111-1111-1111-111111111111/a.jpg' from places where slug='demo-a';
\echo '--- 19. usuario 2 sube foto pendiente en su carpeta a un lugar publicado: OK'
insert into photos(user_id,place_id,storage_path) select auth.uid(),id,auth.uid()||'/b.jpg' from places where slug='demo-a';
\echo '--- 20. usuario 2 reseña un lugar en borrador: ERROR esperado'
insert into reviews(user_id,place_id,rating) values (auth.uid(),(select id from places where slug='demo-borrador'),4);
reset role;
\echo '--- 21. funciones de public sin search_path fijo: esperado 0'
select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' and not coalesce(p.proconfig @> array['search_path=""'], false);
\echo '--- 22. audit_log con 1 registro: usuario normal ve 0, admin ve 1'
set role authenticated; set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222'; set request.jwt.claims='';
select count(*) as usuario from audit_log;
set request.jwt.claims='{"app_metadata":{"role":"admin"}}'; select count(*) as admin from audit_log; reset role;
-- ---- Huecos del modelo cubiertos el 29-10-2026 (perfil automático, integridad de traducciones, guía-barrio, fechas del menú)
reset role; set request.jwt.claims = ''; set request.jwt.claim.sub = '';
\echo '--- 23. alta en auth.users crea su perfil: esperado 1'
insert into auth.users(id) values ('33333333-3333-3333-3333-333333333333');
select count(*) from profiles where id='33333333-3333-3333-3333-333333333333';
\echo '--- 24. traducción de una entidad que no existe: ERROR esperado'
insert into translations(entity_type,entity_id,locale) values('place',gen_random_uuid(),'fr');
\echo '--- 25. traducción de menú con destino inexistente: ERROR esperado'
insert into menu_translations(target_type,target_id,locale) values('item',gen_random_uuid(),'es');
insert into neighborhoods(city_id,slug,status) select id,'demo-medina','borrador' from cities where slug='tanger';
insert into guides(slug,status) values('demo-guia','publicado');
insert into guide_neighborhoods select g.id,n.id from guides g, neighborhoods n where g.slug='demo-guia' and n.slug='demo-medina';
\echo '--- 26. anon: guía publicada con barrio en borrador no expone la relación: esperado 0; tras publicar el barrio: 1'
set role anon; select count(*) as borrador from guide_neighborhoods; reset role;
update neighborhoods set status='publicado' where slug='demo-medina';
set role anon; select count(*) as publicado from guide_neighborhoods; reset role;
\echo '--- 27. editar un artículo de menú actualiza updated_at: esperado t'
update menu_items set position=1;
select bool_and(updated_at > created_at) from menu_items;
