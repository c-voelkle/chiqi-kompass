// Vergleichsgruppen im Cockpit (Browser): Auswahl, Funnel-Referenz, Zurücksetzen.
// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH.
// CHIQI_SCREENSHOT_DIR=… saves screenshots of the grouped funnel in both themes.
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CHIQI_PLAYWRIGHT_PATH || 'playwright');
const channel = process.env.CHIQI_BROWSER_CHANNEL;
const shots = process.env.CHIQI_SCREENSHOT_DIR;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
let checks = 0;
const ok = name => { checks++; console.log('  ✔ ' + name); };
// Referenzlinie und Punkte direkt aus dem Chart lesen.
const funnel = page => page.evaluate(() => {
  const c = Chart.getChart('funnel'), ds = c.data.datasets;
  const pts = ds[0].data, own = ds[1].data, ref = ds[ds.length - 1].data[0].y;
  return { n: pts.length, own: own.length, ref, pts, ownPts: own };
});
const pooled = pts => { let sn = 0, so = 0; for (const p of pts) { sn += p.x; so += p.y / 100 * p.x; } return so / sn * 100; };
try {
  for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 680 }, colorScheme });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(new URL('./cockpit.html', import.meta.url).href);
    await page.waitForFunction(() => window.Chart && Chart.getChart('funnel'));

    const all = await funnel(page);
    assert.match(await page.locator('#group-meta').innerText(), /^alle 153 Betriebe · Referenz CH-Wert$/);
    assert.equal(await page.locator('#funnel-ref-label').innerText(), 'CH-Wert');

    await page.locator('#group-bar select[data-group="typ"]').selectOption('K12*');
    await page.locator('#group-reset').waitFor({ state: 'visible' });
    const grp = await funnel(page);
    assert.ok(grp.n > 0 && grp.n < all.n, 'Gruppe ist eine echte Teilmenge');
    assert.equal(grp.own, 1, 'eigene Institution bleibt sichtbar');
    // USZ ist K111, also nicht Mitglied der Grundversorgung: Referenz ohne eigene Punkte.
    assert.ok(Math.abs(grp.ref - pooled(grp.pts)) < 1e-9, 'Referenz = gepoolter Rohwert der Gruppe');
    assert.match(await page.locator('#group-meta').innerText(), /Grundversorgung \(K121–K123\) · \d+ von 153 Betrieben · Ihre Institution gehört nicht zur Gruppe/);
    assert.equal(await page.locator('#funnel-basis').innerText(), 'Rohwert Vergleichsgruppe');
    assert.equal(await page.locator('#funnel-ref-label').innerText(), 'Gruppenwert');

    await page.locator('#group-bar select[data-group="region"]').selectOption('GR-4');
    const narrow = await funnel(page);
    assert.ok(narrow.n <= grp.n);
    if (shots) {
      await page.locator('#group-card').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(shots, `cockpit-group-${colorScheme}.png`), fullPage: true });
    }

    const report = await page.evaluate(() => { buildReport('indicator'); return document.querySelector('#report').innerText; });
    assert.match(report, /Einordnung in der Vergleichsgruppe/);
    assert.match(report, /Vergleichsgruppe Grundversorgung \(K121–K123\) · Zürich/);

    // Leistungsprofil: Herzkatheter aus der QIP-Publikation, Fallzahl-Drittel je Indikator.
    await page.locator('#group-reset').click();
    await page.locator('#group-card select[data-group="cath"]').selectOption('yes');
    assert.match(await page.locator('#group-meta').innerText(), /^Herzkatheter, ≥ 100 Fälle · 35 von 153 Betrieben · Ihre Institution gehört zur Gruppe/);
    const volume = page.locator('#group-card select[data-group="volume"]');
    const before = await volume.locator('option').allInnerTexts();
    await volume.selectOption('V3');
    assert.match(await page.locator('#group-meta').innerText(), /Fallzahl oberes Drittel: [\d’]+–[\d’]+ Fälle · \d+ von 153 Betrieben/);
    await page.locator('#f-ind').selectOption('D.1.1.M');
    assert.notDeepEqual(await volume.locator('option').allInnerTexts(), before, 'Drittel folgen dem Indikator');
    assert.equal(await volume.inputValue(), 'V3');
    await page.locator('#f-ind').selectOption('A.1.1.M');

    await page.locator('#group-reset').click();
    const back = await funnel(page);
    assert.equal(back.n, all.n);
    assert.equal(back.ref, all.ref);
    assert.equal(await page.locator('#group-reset').isHidden(), true);

    // Standortebene: Merkmale vom Betrieb übernommen.
    await page.locator('#f-level').selectOption('standort');
    await page.locator('#group-bar select[data-group="typ"]').selectOption('K111');
    assert.match(await page.locator('#group-meta').innerText(), /Universitätsspital \(K111\) · \d+ von 227 Standorten/);
    assert.deepEqual(errors, []);
    ok(`Vergleichsgruppe, Funnel-Referenz, Bericht und Zurücksetzen (${colorScheme})`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(`\n${checks} Browser-Prüfungen bestanden.`);
