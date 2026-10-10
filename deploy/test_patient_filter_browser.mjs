// Patientengruppen-Filter in der unterjährigen Auswertung (Browser).
// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH.
// CHIQI_SCREENSHOT_DIR=… saves screenshots of the filtered view in both themes.
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
  for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 680 }, colorScheme });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(new URL('./chiqi/index.html', import.meta.url).href);
    await page.locator('#fileInput').setInputFiles(new URL(xml).pathname);
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('abgeschlossen'));

    const sex = page.locator('#groupBar select[data-group="sex"]');
    const before = await page.locator('#indTable tr').allInnerTexts();
    assert.equal(await page.locator('#groupReset').isHidden(), true);
    assert.equal(await page.locator('#btnCockpit').isEnabled(), true);
    assert.match(await sex.locator('option').nth(1).innerText(), /^männlich \(\d+\)$/);

    await sex.selectOption('F');
    await page.locator('#groupHint').waitFor({ state: 'visible' });
    assert.match(await page.locator('#resultMeta').innerText(), /weiblich[\s\S]*\d+ von \d+ Austritten/);
    assert.equal(await page.locator('#btnCockpit').isDisabled(), true);
    const g5 = page.locator('#indTable tr').filter({ hasText: 'G5_03' });
    assert.match(await g5.innerText(), /CH-Anteil nicht nach Patientengruppe verfügbar/);
    assert.equal(await g5.locator('[data-signal="not-assessable"]').count(), 1);
    if (shots) await page.screenshot({ path: path.join(shots, `chiqi-filter-${colorScheme}.png`), fullPage: true });

    const report = await page.evaluate(() => {
      document.querySelector('#btnPdf').dispatchEvent(new Event('click', { bubbles: true }));
      return document.querySelector('#report').innerText;
    });
    assert.match(report, /Patientengruppe: weiblich/);

    await page.locator('#groupReset').click();
    assert.deepEqual(await page.locator('#indTable tr').allInnerTexts(), before);
    assert.equal(await page.locator('#btnCockpit').isEnabled(), true);
    assert.equal(await page.locator('#groupHint').isHidden(), true);
    assert.deepEqual(errors, []);
    ok(`Filter, PDF-Bericht und Zurücksetzen (${colorScheme})`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(`\n${checks} Browser-Prüfungen bestanden.`);
