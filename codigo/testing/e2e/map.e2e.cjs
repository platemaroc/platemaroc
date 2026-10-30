// E2E del mapa que se carga al pulsar, en Chromium real. Requiere: playwright, esbuild, react, react-dom (dependencias del proyecto en la Fase 1).
// Uso: node codigo/testing/e2e/map.e2e.cjs
const http = require('http'), assert = require('assert'), path = require('path');
const esbuild = require('esbuild');
const BUNDLE = esbuild.buildSync({ entryPoints: [path.join(__dirname, 'map-entry.tsx')], bundle: true, jsx: 'automatic', write: false, nodePaths: (process.env.NODE_PATH || '').split(':').filter(Boolean),
  define: { 'process.env.NODE_ENV': '"production"' } }).outputFiles[0].text;
const { chromium } = require('playwright');
const page_html = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=390"><body style="margin:0"><div id=root></div><script>
window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});</script><script src=/out.js></script>`;
const srv = http.createServer((q, r) => { if (q.url.startsWith('/out.js')) { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end(BUNDLE); } r.writeHead(200, { 'content-type': 'text/html' }); r.end(page_html); }).listen(0);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const status = (p) => p.getAttribute('section[data-map-status]', 'data-map-status');
const calls = (p) => p.evaluate(() => window.__log.filter(([e]) => e === 'renderInteractive').length);
(async () => {
  const base = `http://localhost:${srv.address().port}`; const browser = await chromium.launch();
  const mk = async (opts = {}) => { const ctx = await browser.newContext({ viewport: { width: 390, height: 700 }, ...opts }); return [ctx, await ctx.newPage()]; };
  const load = (p) => p.click('section[data-map-status] button');
  // A: llega a la sección pero no pulsa
  let [ctx, p] = await mk(); await p.goto(base); await p.evaluate(() => document.querySelector('section').scrollIntoView()); await sleep(3800);
  assert.strictEqual(await calls(p), 0, 'A: sin pulsar no se carga el SDK'); assert.strictEqual(await status(p), 'idle');
  assert.strictEqual(await p.locator('#gmap').count(), 0);
  const h0 = await p.evaluate(() => document.querySelector('section > div').getBoundingClientRect().height);
  assert(h0 > 150, 'A: el placeholder reserva espacio (' + h0 + 'px)'); console.log('A OK: sin carga inicial; placeholder', Math.round(h0), 'px');
  // B: pulsa a los 2 s -> el timeout cuenta desde el inicio de la carga
  [ctx, p] = await mk(); await p.goto(base); await p.evaluate(() => document.querySelector('section').scrollIntoView()); await sleep(2000);
  await load(p); await sleep(100);
  const tLoad = await p.evaluate(() => window.__log.find(([e]) => e === 'renderInteractive')[1]); assert(tLoad, 'B: carga al pulsar');
  const t0 = Date.now(); while ((await status(p)) !== 'fallback' && Date.now() - t0 < 6000) await sleep(25);
  const waited = Date.now() - t0; console.log('B: fallback', waited + 100, 'ms tras iniciar la carga (esperado ~3000); carga iniciada a', tLoad, 'ms desde el arranque');
  assert(waited + 100 > 2800 && waited + 100 < 3500, 'B: ~3000 ms desde el inicio de carga, no desde el arranque');
  const h1 = await p.evaluate(() => document.querySelector('section > div').getBoundingClientRect().height);
  assert(Math.abs(h1 - h0) < 1, 'B: el fallback ocupa el mismo espacio'); assert.strictEqual(await p.locator('#gmap').count(), 0, 'B: mapa desmontado');
  assert.strictEqual(await p.locator('a[href^="geo:"]').count(), 1); assert.strictEqual(await p.locator('a[href^="https://www.google.com/maps"]').count(), 1);
  const cls = await p.evaluate(() => window.__cls); console.log('B: CLS =', cls); assert(cls < 0.01, 'B: sin CLS');
  // C: el mapa responde -> no hay fallback
  [ctx, p] = await mk(); await p.goto(base + '/?ready=1'); await load(p);
  await sleep(3700); assert.strictEqual(await status(p), 'ready'); assert.strictEqual(await p.locator('#gmap').count(), 1); console.log('C OK: ready, sin fallback a los 3,7 s');
  // D: offline
  [ctx, p] = await mk(); await p.goto(base); await ctx.setOffline(true); await p.evaluate(() => document.querySelector('section').scrollIntoView()); await sleep(500);
  assert.strictEqual(await calls(p), 0, 'D: offline no carga el SDK'); assert.strictEqual(await status(p), 'fallback'); assert.strictEqual(await p.locator('section[data-map-status] button').count(), 0, 'D: sin botón'); console.log('D OK: offline -> fallback sin cargar SDK');
  console.log('MAP E2E OK'); await browser.close(); srv.close();
})().catch((e) => { console.error('FALLO', e); process.exit(1); });
