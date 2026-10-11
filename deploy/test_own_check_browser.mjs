// Abgleich mit BAG 2024 und Feedback-Datei im Cockpit (Browser, Pilottest).
// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH.
// CHIQI_SCREENSHOT_DIR=… saves a screenshot of the reconciliation table.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CHIQI_PLAYWRIGHT_PATH || 'playwright');
const channel = process.env.CHIQI_BROWSER_CHANNEL;
const shots = process.env.CHIQI_SCREENSHOT_DIR;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const KEY = 'chiqiKompass.ownResults.v1';
let checks = 0;
const ok = name => { checks++; console.log('  ✔ ' + name); };
const meta = years => ({
  years, quarters: years.flatMap(y => [1, 2, 3, 4].map(q => `${y}-Q${q}`)),
  counts: { faelle: 41000, austritte: 40900, nochHospitalisiert: 100 }, warnings: 0, codingLag: false,
  versions: { engine: '0.7.0', spec: '5.5', refJahr: '2024', parser: '0.2.0', spiges: '1.5' }
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(new URL('./cockpit.html', import.meta.url).href);
  await page.waitForFunction(() => window.Chart && Chart.getChart('funnel'));

  // BAG-Werte 2024 des Universitätsspitals Zürich aus der eingebetteten Publikation.
  const bag = await page.evaluate(() => {
    const i = IDX.betrieb.insts.findIndex(x => x.n === 'Universitätsspital Zürich');
    const get = c => { const r = IDX.betrieb.byInst.get(i).find(r => r[1] === c); return r ? analysisVals(r, 'betrieb', '24') : null; };
    return { i, a: get('A.1.1.M'), aG: get('A.1.1.MrG'), b: get('B.1.1.M'), d: get('D.1.1.M'), g: get('G.5.3.P') };
  });
  const exact = (v, pe) => { const O = Math.round(v.po / 100 * v.n); const E = pe / 100 * v.n; return { n: v.n, O, E, smr: O / E }; };
  const indicators = [
    { id: 'A1_01', ...exact(bag.a, bag.aG.pe) },                  // GLM-Erwartung = A.1.1.MrG
    { id: 'B1_01', n: bag.b.n + 50, O: Math.round(bag.b.po / 100 * bag.b.n), E: bag.b.pe / 100 * bag.b.n, smr: 1 },
    { id: 'D1_01', ...exact({ ...bag.d, n: bag.d.n - 1 }, bag.d.pe) },
    { id: 'G5_03', n: bag.g.n, O: bag.g.O, E: bag.g.n * 0.7602269, smr: null }
  ];
  await page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), [KEY, { version: 1, indicators, meta: meta([2024]) }]);
  await page.reload();
  await page.waitForFunction(() => window.Chart && Chart.getChart('funnel'));
  assert.equal(await page.locator('#own-inst').inputValue(), String(bag.i));
  await page.locator('#own-confirm').click();
  await page.locator('#own-check').waitFor({ state: 'visible' });
  const rows = await page.locator('#own-check-table tbody tr').allInnerTexts();
  const status = code => rows.find(r => r.startsWith(code));
  assert.match(status('A.1.1.M'), /übereinstimmend/);
  assert.match(status('A.1.1.M'), /erwartet: Risikomodell A\.1\.1\.MrG/);
  assert.match(status('B.1.1.M'), /deutliche Abweichung/);
  assert.match(status('D.1.1.M'), /kleine Abweichung/);
  assert.match(status('G.5.3.P'), /übereinstimmend/);
  if (shots) await page.locator('#own-check').screenshot({ path: path.join(shots, 'own-check.png') });
  ok('Abgleich ordnet Übereinstimmung und Abweichungen richtig ein');

  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#own-check-export').click()]);
  assert.match(download.suggestedFilename(), /^chiqi-kompass-abgleich-\d{4}-\d{2}-\d{2}\.json$/);
  const doc = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  assert.equal(doc.format, 'chiqi-kompass-abgleich-1');
  assert.equal(doc.institution, 'Universitätsspital Zürich');
  assert.deepEqual(doc.import.years, [2024]);
  assert.equal(doc.indikatoren.length, 4);
  assert.equal(doc.indikatoren.find(r => r.code === 'B.1.1.M').differenz.n, 50);
  assert.deepEqual(Object.keys(doc).sort(), ['altersgruppe', 'erstellt', 'format', 'import', 'indikatoren', 'institution', 'werkzeug']);
  assert.doesNotMatch(JSON.stringify(doc), /fall_?id|diagnose|ahv|geburt/i);
  ok('Feedback-Datei enthält Kennzahlen, Zeitraum und Versionen, keine Falldaten');

  // Unterjährige Daten 2026: kein Abgleich mit QIP 2024.
  await page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), [KEY, { version: 1, indicators, meta: meta([2026]) }]);
  await page.reload();
  await page.waitForFunction(() => window.Chart && Chart.getChart('funnel'));
  await page.locator('#own-confirm').click();
  await page.locator('#own-history-content').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#own-check').isHidden(), true);
  assert.deepEqual(errors, []);
  ok('Abgleich nur mit Austritten aus 2024');
} finally {
  await browser.close();
}
console.log(`\n${checks} Browser-Prüfungen bestanden.`);
