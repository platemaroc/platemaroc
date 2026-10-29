# Copias de seguridad

Reglas (maestro §9): base de datos **diaria**; fotos y configuración no secreta **semanal**; retención **7 diarias, 4 semanales y 3 mensuales**;
copias **externas y cifradas**; restauración documentada; **prueba de restauración trimestral**; **nunca secretos reales** en un backup normal.

- `backup-db.sh`: volcado `pg_dump` → cifrado con la clave **pública** de `age` (la clave privada la guarda el titular, no el servidor) → rotación → copia externa con `rclone` (opcional). Si falla, ejecuta `ALERT_CMD` (alerta por email, maestro §8).
  Configuración en `/etc/platemaroc/backup.env` (plantilla: `config/env-templates/backup.env.example`).
- Programación sugerida (systemd timer o cron del usuario `deploy`): a diario, de madrugada.
- Fotos y configuración no secreta: sincronización semanal del almacenamiento (Supabase Storage / carpeta de fotos) con `rclone` al destino externo cifrado. Pendiente de definir el proveedor de almacenamiento.
- **Inventario de secretos**: puede guardarse una lista de NOMBRES (ver `secretos-inventario.example.md`), nunca sus valores.

## Restauración
1. Descifrar con la clave privada del titular: `age -d -i clave-privada.txt db-AAAAMMDDTHHMMSSZ.dump.age > restaurar.dump`.
2. Restaurar en una base **de pruebas**: `pg_restore --no-owner --dbname "$URL_PRUEBAS" restaurar.dump`.
3. Comprobar conteos de tablas clave y una muestra de lugares, reseñas y menús.
4. Registrar la prueba en `ordenes-claude-code/copias-de-seguridad/resultados/` (trimestral).
Restaurar sobre producción solo con aprobación expresa del titular.
