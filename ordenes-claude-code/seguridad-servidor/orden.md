# Orden: revisión de seguridad del servidor

## Objetivo
Comprobar que el VPS (Ubuntu LTS en Hostinger), la web y la base de datos están protegidos, y proponer mejoras.

## Antes de empezar
- Lee `reglas-generales.md` y `config/server-setup/`.
- El titular no tiene experiencia con servidores: explica cada hallazgo en lenguaje sencillo y di por qué importa.
- Esta orden empieza SIEMPRE como auditoría de solo lectura. No cambies nada sin aprobación.

## Regla de oro: no dejarse fuera
Antes de proponer cambios en el acceso SSH o el cortafuegos, confirma que el titular tiene una segunda vía de entrada (por ejemplo, la consola web de Hostinger). Aplica esos cambios de uno en uno y comprueba que el acceso sigue funcionando antes del siguiente.

## Pasos de la auditoría
1. **Sistema:** versión de Ubuntu LTS, actualizaciones de seguridad pendientes y reinicios necesarios. Comprueba si las actualizaciones de seguridad automáticas están activas.
2. **Acceso:** entrada solo con clave SSH, sin contraseña, sin acceso directo como administrador principal (root). Usuario con permisos limitados. Lista de claves autorizadas.
3. **Cortafuegos:** solo deben estar abiertos los puertos necesarios (acceso SSH, web HTTP y HTTPS). Revisa también el cortafuegos del panel de Hostinger. Lista los puertos abiertos y justifica cada uno.
4. **Protección contra ataques:** bloqueo de intentos repetidos de acceso, límites de peticiones (rate limiting) en el inicio de sesión, la verificación por SMS y el envío de reseñas.
5. **Web y certificados:** HTTPS en todo, certificado válido con renovación automática, redirecciones de HTTP a HTTPS y cabeceras de seguridad (CSP, HSTS y similares).
6. **Aplicación:** la aplicación no se ejecuta como administrador principal, se reinicia sola si falla, y los errores no muestran datos internos al público.
7. **Secretos:** claves y contraseñas fuera del repositorio, con permisos restringidos en el servidor. Revisa el historial de Git por si se subió alguna por error.
8. **Dependencias:** busca vulnerabilidades conocidas en las librerías del proyecto y propón actualizaciones.
9. **Base de datos (Supabase):** revisa las políticas RLS, que ninguna clave secreta esté expuesta al navegador y que el panel de administración esté protegido (idealmente con verificación en dos pasos).
10. **Subida de archivos:** tipos y tamaños permitidos en las fotos, y análisis básico de seguridad.
11. **Registros y alertas:** que existan registros útiles y un aviso si la web se cae.
12. **Copias de seguridad:** que existan, que cubran base de datos, fotos y configuración, y que se haya probado una restauración.
13. **Cuentas:** verificación en dos pasos en Hostinger, Supabase, GitHub, Google y el dominio.

## Entregable
Informe en `resultados/` con una tabla: elemento revisado, estado (bien, mejorable, grave), explicación sencilla y acción recomendada, ordenada por gravedad. Incluye las comprobaciones que no se pudieron hacer.

## Aprobación
Los cambios se aplican solo tras aprobación del titular, de uno en uno y comprobando que todo sigue funcionando. Los hallazgos graves se comunican de inmediato.
