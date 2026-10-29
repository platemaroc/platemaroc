# security/
- `headers.ts`: HSTS, CSP, nosniff, Referrer-Policy, Permissions-Policy. Probar la CSP con Google Maps real.
- `scan-secrets.mjs`: detector de secretos evidentes (`node codigo/security/scan-secrets.mjs .`). Ejecutar antes de commit y de empaquetar.
- Reglas: maestro §1.8 y §5 (sin secretos en Git, `service_role` nunca en el navegador). Auditoría del servidor: `ordenes-claude-code/seguridad-servidor/`.
