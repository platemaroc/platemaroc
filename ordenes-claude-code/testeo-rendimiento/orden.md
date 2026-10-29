# Orden: testear el rendimiento de la web

## Objetivo
Medir velocidad y Core Web Vitals en móvil, detectar problemas y proponer mejoras.

## Antes de empezar
- Lee `reglas-generales.md`.
- Comprueba qué entorno vas a medir (local, pruebas o producción) y dímelo.

## Umbrales de referencia (verifica que siguen vigentes)
- LCP: 2,5 s o menos.
- INP: 200 ms o menos.
- CLS: 0,1 o menos.

## Pasos
1. Elige páginas representativas: inicio, listado, ficha de lugar, plato, guía, ciudad, formulario de reseña y panel de administración.
2. Mide cada una en móvil (conexión 4G y gama baja) con estas herramientas:
   - **PageSpeed Insights:** mide páginas ya publicadas y devuelve datos de laboratorio y, si existen, datos reales de usuarios (CrUX). Puede usarse por su web o mediante su API; si hace falta una clave de API, la crea el titular y nunca se guarda en el repositorio.
   - **Lighthouse:** mide en tu equipo, también páginas locales o de pruebas antes de publicar. Necesita Node.js y Chrome; indica si falta alguno. Ejecuta cada página varias veces y quédate con la mediana, porque los resultados varían.
   - Si es posible, deja Lighthouse automatizado como comprobación antes de cada despliegue, con límites mínimos (si el rendimiento cae por debajo, el despliegue se detiene).
3. Anota LCP, INP, CLS, peso total de la página, número de peticiones y scripts de terceros.
4. Identifica las causas: imágenes sin optimizar, fuentes, JavaScript pesado, mapas cargados demasiado pronto, scripts de terceros, falta de caché.
5. Verifica la usabilidad móvil: targets táctiles mínimos de 48x48 px, texto legible sin zoom, sin scroll horizontal, contenido principal visible sin desplazarse.
6. Comprueba HTTPS, cabeceras de seguridad (CSP, HSTS) y redirecciones.
7. Compara con la medición anterior en `resultados/` y señala mejoras o empeoramientos.
8. Propón correcciones ordenadas por impacto y esfuerzo.

## Entregable
Informe en `resultados/` con tabla por página (métricas y estado verde, naranja o rojo), causas y acciones recomendadas.

## Aprobación
Aplica las correcciones solo tras aprobación del titular, de una en una y volviendo a medir.
