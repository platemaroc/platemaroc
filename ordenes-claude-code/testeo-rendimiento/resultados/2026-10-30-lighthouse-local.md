# Rendimiento: Lighthouse en local (30-10-2026)

**Entorno:** build de producción en el equipo del titular, contra el proyecto Supabase de pruebas (Londres), con fichas de prueba y sin fotos. Lighthouse en móvil, con 4G y CPU ×4 simulados. No es la web publicada: PageSpeed Insights y los datos reales de usuarios (CrUX) solo existen tras publicar.

| Página | Rend. | Acces. | LCP (ms) | CLS | TBT (ms) | Servidor (ms) | Peso (KB) | Peticiones |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| /es | 80 | 100 | 989 | 0 | 840 | 710 | 159 | 17 |
| /es/restaurantes | 87 | 98 | 810 | 0 | 508 | 850 | 170 | 17 |
| Ficha de lugar | 80 | 100 | 625 | 0 | 843 | 1114 | 157 | 14 |
| Menú | 81 | 100 | 626 | 0 | 689 | 2398 | 150 | 12 |
| /es/ciudades | 89 | 100 | 624 | 0 | 450 | 260 | 149 | 12 |
| /auth/entrar | 97 | 100 | 930 | 0 | 187 | 22 | 147 | 12 |

Medido antes de corregir el salto de títulos del listado. "Servidor" es la primera visita, con la caché vacía.

Umbrales: LCP ≤ 2500 ms, CLS ≤ 0,1 (verde en todas); TBT ≤ 300 ms (aviso interno, no se cumple); INP no se mide en laboratorio.

**Causas:** el tiempo de servidor viene de las consultas a Supabase desde esta red; se añadió una caché pública de 60 s que se vacía al guardar. El TBT viene del arranque de React y de trabajo sin atribuir, en un equipo modesto con CPU ×4. Sin fotos, el LCP real será mayor: hay que volver a medir con contenido real.

## Resumen
1. LCP y CLS están en verde en las seis páginas.
2. TBT supera el aviso interno de 300 ms en cinco de seis páginas.
3. La nota de rendimiento va de 80 a 97; el objetivo orientativo es 90.
4. No se ha reducido el TBT a ciegas: faltan datos de un servidor y móviles reales.
5. Estos datos no incluyen fotos ni el SDK de Google Maps.

## Acciones recomendadas
1. **Alta:** repetir con PageSpeed Insights al publicar, con fotos reales.
2. **Media:** si el TBT sigue alto en producción, revisar qué componentes de cliente se pueden evitar.
3. **Baja:** dejar Lighthouse automatizado antes de cada despliegue (`npm run test:perf`).

## Necesita aprobación del titular
Nada por ahora.

## Repetición tras la identidad visual, el buscador y el mapa al pulsar (30-10-2026)

**Entorno:** build de producción en el equipo del titular, contra el proyecto real, casi vacío: las cifras no son comparables una a una con la tabla anterior, que tenía fichas de prueba.

| Página | Rend. | Acces. | Buenas pr. | LCP (ms) | CLS | TBT (ms) | Servidor (ms) | Peso (KB) | Peticiones |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| /es | 79 | 100 | 100 | 911 | 0 | 888 | 1325 | 169 | 13 |
| /es/lugares | 91 | 100 | 100 | 656 | 0 | 381 | 390 | 169 | 13 |
| /es/lugares?q=fez | 93 | 100 | 100 | 617 | 0 | 316 | 342 | 169 | 13 |
| /auth/entrar | 96 | 100 | 100 | 926 | 0 | 220 | 97 | 168 | 14 |

LCP y CLS siguen en verde. La fuente de títulos añade unos 15 KB. El TBT sigue por encima del aviso interno de 300 ms: la acción pendiente no cambia (medir con PageSpeed Insights al publicar).
