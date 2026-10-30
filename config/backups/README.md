# Copias de seguridad

Reglas (maestro §9): base de datos **diaria**; fotos y configuración no secreta **semanal**; retención **7 diarias, 4 semanales y 3 mensuales**;
copias **externas y cifradas**; restauración documentada; **prueba de restauración trimestral**; **nunca secretos reales** en un backup normal.

- `backup-db.sh`: volcado `pg_dump` → cifrado con la clave **pública** de `age` (la clave privada la guarda el titular, no el servidor) → rotación → copia externa con `rclone` (opcional). Si falla, ejecuta `ALERT_CMD` (alerta por email, maestro §8).
  Configuración en `/etc/platemaroc/backup.env` (plantilla: `config/env-templates/backup.env.example`).
- Preparación en el servidor: instalar `age`, `rclone` y `postgresql-client-17` del repositorio oficial de PostgreSQL. `pg_dump` debe ser igual o más nuevo que la base (Supabase usa la 17; verificado el 30-10-2026) y el de Ubuntu suele ser más antiguo.
- Copiar `backup-db.sh` a `/srv/platemaroc/scripts/` (ejecutable) y crear `/var/backups/platemaroc` con dueño `deploy`.
- Programación: copiar `platemaroc-backup.service.example` y `.timer.example` a `/etc/systemd/system/` (sin `.example`) y ejecutar `systemctl enable --now platemaroc-backup.timer`. A diario, a las 03:30 UTC. La primera copia se lanza a mano y se restaura en una base de pruebas: una copia sin probar no es una copia.
- Fotos y configuración no secreta: sincronización semanal del almacenamiento (Supabase Storage / carpeta de fotos) con `rclone` al destino externo cifrado. Pendiente de definir el proveedor de almacenamiento.
- **Inventario de secretos**: puede guardarse una lista de NOMBRES (ver `secretos-inventario.example.md`), nunca sus valores.

## Restauración
1. Descifrar con la clave privada del titular: `age -d -i clave-privada.txt db-AAAAMMDDTHHMMSSZ.dump.age > restaurar.dump`.
2. Restaurar en una base **de pruebas**: `pg_restore --no-owner --dbname "$URL_PRUEBAS" restaurar.dump`.
3. Comprobar conteos de tablas clave y una muestra de lugares, reseñas y menús.
4. Registrar la prueba en `ordenes-claude-code/copias-de-seguridad/resultados/` (trimestral).
Restaurar sobre producción solo con aprobación expresa del titular.
