# Seeders
Solo datos de referencia reales, en estado `borrador` (`0001_referencia.sql`): tipos de lugar, las 12 regiones de Marruecos y Tánger.
Los lugares los carga el titular (formato de hoja de cálculo pendiente, `docs/08`) y no se inventan datos de ejemplo con apariencia real.
Los datos ficticios para pruebas (`slug` con prefijo `demo-`) viven en `../tests/rls-smoke.sql` y nunca se cargan en producción.
Se aplican con `apply.sh --seed`.
