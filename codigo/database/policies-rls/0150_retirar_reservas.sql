-- Reservas retiradas del producto por decisión del titular (30-10-2026): en Marruecos los restaurantes no las usan.
-- Va aquí y no en migrations/ porque 0100 todavía nombra estas tablas: así una instalación desde cero sigue funcionando.
-- Las tablas estaban vacías en la base real. `business_claims` se conserva: es otra función (Fase 2).
drop table reservation_slots;
drop table reservations;
drop type reservation_status;

alter table audit_log drop constraint audit_log_entidad_tipo_check;
alter table audit_log add constraint audit_log_entidad_tipo_check
  check (entidad_tipo in ('place','dish','guide','city','neighborhood','translation','review','photo','menu','redirect','config'));
