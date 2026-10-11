// Unterjährige Auswertung mit Altersgruppe → Cockpit: BAG-Teilindikator und
// vorläufiger Punkt im Funnel-Plot (Browser).
// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH.
// CHIQI_SCREENSHOT_DIR=… saves a screenshot of the funnel with the interim point.
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CHIQI_PLAYWRIGHT_PATH || 'playwright');
const channel = process.env.CHIQI_BROWSER_CHANNEL;
const shots = process.env.CHIQI_SCREENSHOT_DIR;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const xml = new URL('./chiqi/spiges_testdata_v15.xml', import.meta.url);
let checks = 0;
const ok = name => { checks++; console.log('  ✔ ' + name); };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 680 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(new URL('./chiqi/index.html', import.meta.url).href);
  await page.locator('#fileInput').setInputFiles(new URL(xml).pathname);
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('abgeschlossen'));

  const age = page.locator('#groupBar select[data-group="age"]');
  const sex = page.locator('#groupBar select[data-group="sex"]');
  await sex.selectOption('M');
  assert.equal(await page.locator('#btnCockpit').isDisabled(), true, 'Geschlecht hat keine BAG-Entsprechung');
  assert.match(await page.locator('#groupHint').innerText(), /nur ohne Filter oder mit Altersklasse allein/);
  await sex.selectOption('');
  await age.selectOption('65-84');
  assert.equal(await page.locator('#btnCockpit').isEnabled(), true);
  assert.match(await page.locator('#groupHint').innerText(), /Teilindikatoren dieser Altersgruppe/);
  ok('Nur ein Altersfilter erlaubt den BAG-Vergleich');

  await Promise.all([page.waitForURL(/cockpit\.html/), page.locator('#btnCockpit').click()]);
  await page.waitForFunction(() => window.Chart && Chart.getChart('funnel'));
  assert.match(await page.locator('#own-transfer-title').innerText(), /Altersgruppe 65–84 J\./);
  const transfer = await page.evaluate(() => JSON.parse(sessionStorage.getItem('chiqiKompass.ownResults.v1')));
  assert.deepEqual(transfer.group, { age: '65-84' });
  // Importangaben für Abgleich und Feedback-Datei: Zeitraum, Zählungen, Versionen.
  assert.deepEqual(transfer.meta.years, [2026]);
  assert.ok(transfer.meta.quarters.every(q => /^2026-Q[1-4]$/.test(q)));
  assert.equal(transfer.meta.counts.faelle, 6);
  assert.equal(transfer.meta.versions.spec, '5.5');
  assert.doesNotMatch(JSON.stringify(transfer), /5443546|I214|845724581|52704341/, 'keine Fall-IDs, Diagnosen oder Kennungen');
  const a1 = transfer.indicators.find(r => r.id === 'A1_01');
  assert.ok(a1 && a1.n >= 1, 'gefilterte Kennzahlen übergeben');
  ok('Übergabe enthält Altersgruppe und gefilterte Kennzahlen');

  await page.locator('#own-confirm').click();
  const codes = await page.locator('#own-ind option').evaluateAll(os => os.map(o => o.value));
  assert.deepEqual(codes, ['A.1.4.M', 'B.1.4.M', 'D.1.5.M'], 'Teilindikatoren 65–84, ohne G5_03');
  assert.match(await page.locator('#own-history-title').innerText(), /^A\.1\.4\.M HD Herzinfarkt, Alter 65-84, Mortalität$/);
  ok('Cockpit vergleicht mit den BAG-Teilindikatoren 65–84');

  await page.locator('#own-show-funnel').click();
  assert.equal(await page.locator('#f-ind').inputValue(), 'A.1.4.M');
  await page.locator('#funnel-ytd-legend').waitFor({ state: 'visible' });
  const ytd = await page.evaluate(() => Chart.getChart('funnel').data.datasets.find(d => d.label === 'unterjährig').data);
  assert.equal(ytd.length, 1);
  assert.equal(ytd[0].x, a1.n);
  assert.ok(Math.abs(ytd[0].y - a1.O / a1.n * 100) < 1e-9);
  assert.match(await page.locator('#funnel-reading').innerText(), /Unterjährig\s*vorläufig[\s\S]*Altersgruppe 65–84 J\./);
  if (shots) {
    await page.locator('#funnel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, 'funnel-interim.png'), fullPage: true });
  }
  ok('Unterjähriger Wert erscheint als vorläufiger Punkt im Funnel-Plot');

  // Andere Institution gewählt: kein vorläufiger Punkt (gehört nicht zu ihr).
  const other = await page.locator('#f-inst option').evaluateAll((os, cur) => os.map(o => o.value).find(v => v !== cur), await page.locator('#f-inst').inputValue());
  await page.locator('#f-inst').selectOption(other);
  assert.equal(await page.locator('#funnel-ytd-legend').isHidden(), true);
  assert.deepEqual(errors, []);
  ok('Punkt nur bei der bestätigten Institution');
} finally {
  await browser.close();
}
console.log(`\n${checks} Browser-Prüfungen bestanden.`);
