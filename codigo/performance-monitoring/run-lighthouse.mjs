#!/usr/bin/env node
// Lighthouse en móvil (4G y CPU lenta simulados) contra una web ya arrancada. Uso: node codigo/performance-monitoring/run-lighthouse.mjs <base> <ruta> [<ruta>…]
// Mide en laboratorio: LCP, CLS y TBT (aproximación de INP). Sale con error si una página supera los umbrales de budgets.ts.
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { CWV_GOOD } from './budgets.ts';

const [base, ...paths] = process.argv.slice(2);
const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const rows = [];
try {
  for (const p of paths) {
    const { lhr } = await lighthouse(base + p, { port: PORT, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'], formFactor: 'mobile' });
    const a = lhr.audits;
    rows.push({
      path: p, perf: Math.round(lhr.categories.performance.score * 100), a11y: Math.round(lhr.categories.accessibility.score * 100), bp: Math.round(lhr.categories['best-practices'].score * 100),
      lcp: Math.round(a['largest-contentful-paint'].numericValue), cls: a['cumulative-layout-shift'].numericValue, tbt: Math.round(a['total-blocking-time'].numericValue), ttfb: Math.round(a['server-response-time'].numericValue),
      kb: Math.round(a['total-byte-weight'].numericValue / 1024), reqs: a['network-requests'].details?.items?.length ?? 0,
    });
  }
} finally {
  await browser.close();
}
console.log('| Página | Rend. | Acces. | Buenas pr. | LCP (ms) | CLS | TBT (ms) | Servidor (ms) | Peso (KB) | Peticiones |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const r of rows) console.log(`| ${r.path} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.lcp} | ${r.cls.toFixed(3)} | ${r.tbt} | ${r.ttfb} | ${r.kb} | ${r.reqs} |`);
const bad = rows.filter((r) => r.lcp > CWV_GOOD.lcpMs || r.cls > CWV_GOOD.cls);
if (bad.length) { console.error(`Superan el umbral: ${bad.map((r) => r.path).join(', ')}`); process.exit(1); }
