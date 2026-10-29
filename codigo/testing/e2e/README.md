# Pruebas E2E (navegador real)
- `sw.e2e.cjs`: Service Worker con IndexedDB real → máximo 20 páginas, LRU, 503 sin copia, cachés versionadas, limpieza y versión nueva en espera.
- `map.e2e.cjs` (+ `map-entry.tsx`): mapa diferido → sin SDK en el render inicial, carga al llegar a la sección, timeout de 3000 ms desde el inicio de la carga, CLS ≈ 0, offline y sin IntersectionObserver.
Dependencias (se instalarán con el proyecto en la Fase 1): `playwright`, `esbuild`, `react`, `react-dom`. Ejecutar: `node codigo/testing/e2e/<archivo>`.
Resultado de referencia el 29-10-2026 (Chromium): ambas pasan.
