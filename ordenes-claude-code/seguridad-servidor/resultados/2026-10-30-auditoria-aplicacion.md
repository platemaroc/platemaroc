# Seguridad: auditoría de la aplicación (30-10-2026)

**Alcance:** código, base de datos y dependencias. El servidor (puntos 1 a 6, 11 y 12 de la orden) se audita en la Fase 7, porque aún no existe.

| Punto | Resultado |
|---|---|
| Secretos en el historial de Git (20 commits) | Ninguno. Ningún `.env` real se ha subido |
| Claves en el código del navegador | Ninguna: ni la clave de servicio ni su nombre en `.next/static` |
| Dependencias de producción (`npm audit`) | 0 vulnerabilidades conocidas |
| RLS | Probado con ataques directos a la API en el proyecto de pruebas: todos rechazados |
| Subida de archivos | Formato comprobado por contenido, WebP, sin EXIF/GPS. Usuarios: solo a través del servidor |
| Panel | Verificación en dos pasos exigida en la web y en la base de datos (`0130`) |
| Límite de intentos | Enlaces, códigos y formularios. Falta la capa de Nginx (Fase 7) |
| Cookies de sesión | HttpOnly, SameSite=Lax, Secure en producción |
| Errores | Mensajes genéricos al usuario; el detalle queda en el registro del servidor |
| Derechos del usuario | Exportar y eliminar datos en "Mi cuenta" |

**Riesgo conocido:** el límite por IP se fía de `X-Real-IP`. La aplicación debe escuchar solo en `127.0.0.1`, detrás de Nginx; si se expusiera directamente, esa cabecera se podría falsificar. A comprobar en la Fase 7.

**Sin probar:** la CSP con Google Maps real y la cuenta real del titular con dos pasos.

## Resumen
1. No hay secretos en Git ni en el navegador.
2. No hay vulnerabilidades conocidas en las dependencias de producción.
3. Las reglas de la base de datos resisten los ataques probados.
4. El panel exige un segundo paso también en la base de datos, cuando se aplique `0130` al proyecto real.
5. Falta auditar el servidor, que aún no existe.

## Acciones recomendadas
1. **Alta:** aplicar `0130` al proyecto real y activar el segundo factor del titular.
2. **Alta:** verificación en dos pasos en Hostinger, Supabase, GitHub, Google y el dominio.
3. **Alta:** cambiar una de las dos contraseñas de base de datos: el proyecto real y el de pruebas comparten la misma.
4. **Media:** revisar el Security Advisor del panel de Supabase.
5. **Media:** en la Fase 7, Nginx con límites, app solo en 127.0.0.1 y auditoría completa.

## Necesita aprobación del titular
Aplicar `0130` al proyecto real.
