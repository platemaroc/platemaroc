# Checklist de QA móvil (por versión, en es/en/fr)

Estado del 30-10-2026 (en local): [x] comprobado por pruebas automáticas; [ ] pendiente de la web publicada o de un móvil real.

- [x] Targets táctiles ≥ 48×48 px; tipografía legible sin zoom.
- [ ] LCP, INP y CLS en verde en móvil (ver `codigo/performance-monitoring`).
- [ ] Offline: ficha de restaurante y menú ya visitados abren con la última copia (`docs/10`).
- [ ] Red lenta/intermitente: no hay pantallas en blanco.
- [x] Mapa diferido: en el render inicial no se descarga el SDK del mapa; se carga al llegar a la sección.
- [x] Placeholder del mapa reserva espacio: CLS ≈ 0 al cargar el mapa y al pasar al fallback.
- [x] Offline: no más de 20 páginas guardadas; las menos usadas se descartan; tras desplegar, se limpian cachés antiguas.
- [ ] Mapa: con el mapa bloqueado, a los 3000 ms desde que empieza su carga aparece el fallback con dirección, indicaciones y enlaces (`docs/11`).
- [ ] Enlace `geo:` probado en Android; enlace `https` probado en iPhone.
- [x] Banner offline visible y no intrusivo.
- [x] Precios solo en MAD (`120 MAD`); sin conversiones ni selectores de moneda; precio ausente = "Precio pendiente" (`docs/12`).
- [ ] Imágenes WebP/AVIF con carga diferida; `alt` en el idioma de la página.
- [x] Sin `/ar/` ni `hreflang ar`; `hreflang` solo entre versiones publicadas.
- [x] Páginas que fallan el Quality Gate salen como `noindex` y fuera del sitemap.
