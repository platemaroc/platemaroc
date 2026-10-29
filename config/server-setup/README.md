# Preparación del servidor (VPS Hostinger KVM 1, Ubuntu LTS limpio)

Guía para el titular, con Claude Code explicando cada comando antes de ejecutarlo (prompt inicial). **Nada de esto se ejecuta sin tu aprobación.**
Los builds NO se hacen en el servidor (decisión): se construyen en tu equipo o en GitHub Actions y aquí solo se despliega el resultado.

## 1. Acceso seguro
1. Crear un usuario sin privilegios (`deploy`) y dar acceso por **clave SSH**; desactivar la contraseña y el acceso de `root` por SSH (`PasswordAuthentication no`, `PermitRootLogin no` en `/etc/ssh/sshd_config`). Mantén una sesión abierta mientras pruebas.
2. Actualizar el sistema y activar actualizaciones de seguridad automáticas (`unattended-upgrades`).

## 2. Cortafuegos y protección
3. `ufw`: denegar todo por defecto y permitir solo `22/tcp` (SSH), `80/tcp` y `443/tcp`.
4. Instalar `fail2ban` para limitar intentos de SSH.

## 3. Software
5. Node.js LTS (la versión que fije el proyecto en `.nvmrc`/`engines`), `nginx` y `certbot`.
6. Directorios: `/srv/platemaroc/releases` y el archivo de entorno `/etc/platemaroc/app.env` (permisos `600`, dueño `deploy`; ver `config/env-templates/.env.example`). Los secretos los pones tú; no pasan por Git.

## 4. HTTPS y Nginx
7. Copiar `nginx.conf.example` a `/etc/nginx/sites-available/platemaroc.com`, activarlo y obtener el certificado con `certbot --nginx -d platemaroc.com -d www.platemaroc.com`.
8. Comprobar HTTPS estricto: redirección 80→443 y HSTS (lo añade la aplicación, `codigo/security/headers.ts`).
9. `/sw.js` debe servirse con `Cache-Control: no-cache` (ya incluido en la plantilla): si no, las actualizaciones del Service Worker no llegan.

## 5. Servicio
10. Copiar `platemaroc.service.example` a `/etc/systemd/system/platemaroc.service`, `systemctl enable --now platemaroc`.

## 6. Copias de seguridad
11. Seguir `config/backups/README.md` (base de datos diaria; fotos y configuración no secreta semanal).

## Verificación final
- `curl -I https://platemaroc.com` → 200 y cabeceras de seguridad.
- Auditoría con `ordenes-claude-code/seguridad-servidor/orden.md` antes del lanzamiento.
