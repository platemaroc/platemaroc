# Despliegue

Principios (maestro): **nada se publica sin aprobación del titular**; los builds se hacen en CI o en local, no en el servidor; los secretos no están en Git.

Flujo propuesto (`github-actions-deploy.yml.example`):
1. El titular lanza el despliegue a mano (`workflow_dispatch`) y lo aprueba en el entorno `production` (revisores obligatorios).
2. CI instala dependencias, ejecuta pruebas y construye.
3. Sube el resultado por SSH a `/srv/platemaroc/releases/<commit>` y cambia el enlace `current` (despliegue atómico).
4. Reinicia el servicio y comprueba que responde; si falla, reapunta `current` a la versión anterior (rollback).
5. Conserva las últimas 5 versiones desplegadas (solo artefactos de build, nunca contenido).

Secretos de GitHub necesarios (los crea el titular; no se guardan en el repo): `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KNOWN_HOSTS`.
El Service Worker usa una `VERSION`: súbela (o inyéctala desde el build con el hash del commit) en cada despliegue que cambie recursos estáticos.
Para activarlo, copia el ejemplo a `.github/workflows/deploy.yml`.
