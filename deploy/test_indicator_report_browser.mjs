// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH.
// Optional --export writes the two public-data sample reports to output/pdf.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CHIQI_PLAYWRIGHT_PATH || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const exportPdf = process.argv.includes('--export');
const output = path.join(root, 'output', 'pdf');
if (exportPdf) fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED', request.url(), request.failure()?.errorText));
  await page.addInitScript(() => { window.print = () => { window.printCount = (window.printCount || 0) + 1; }; });
  await page.goto(new URL('./cockpit.html', import.meta.url).href, { waitUntil: 'load' });
  console.log('Loaded cockpit:', await page.evaluate(() => ({ chart: typeof Chart, institutions: document.querySelector('#f-inst').options.length })), errors);
  await page.waitForFunction(() => typeof Chart === 'function' && document.querySelector('#f-inst').options.length > 0);
  await page.selectOption('#f-level', 'standort');
  const examples = [
    { name: 'Hirslanden Klinik Aarau', count: '120', denominator: '163', rate: '73.6%', file: 'CH-IQI_Hirslanden-Aarau_G-5-3-P_2024.pdf' },
    { name: 'Klinik Hirslanden AG', count: '448', denominator: '568', rate: '78.9%', file: 'CH-IQI_Hirslanden-Zuerich_G-5-3-P_2024.pdf' }
  ];
  for (const example of examples) {
    await page.evaluate(() => document.body.classList.remove('rep-mode'));
    const institution = await page.locator('#f-inst option').evaluateAll((options, name) => options.find(o => o.textContent.startsWith(name))?.value, example.name);
    assert.ok(institution, `institution ${example.name}`);
    await page.selectOption('#f-inst', institution);
    await page.selectOption('#f-ind', 'G.5.3.P');
    assert.equal(await page.locator('#k-trends').textContent(), '–');
    await page.locator('#btn-pdf-indicator').click();
    await page.waitForFunction(() => document.body.classList.contains('rep-mode'));
    const report = await page.locator('#report').innerText();
    assert.ok(report.includes(example.name));
    assert.ok(report.includes(example.rate));
    assert.match(report, /G\.5\.3\.P/);
    assert.doesNotMatch(report, /Kaiserschnitt|G\.1\.5\.P|Top-5/);
    assert.equal(await page.locator('#report .rep-ck b').nth(0).textContent(), example.count);
    assert.equal(await page.locator('#report .rep-ck b').nth(1).textContent(), example.denominator);
    assert.equal(await page.locator('#f-ind').inputValue(), 'G.5.3.P');
    assert.equal(await page.locator('#report img').count(), 1);
    await page.locator('#report img').evaluate(image => image.decode());
    if (exportPdf) await page.pdf({ path: path.join(output, example.file), preferCSSPageSize: true, printBackground: true });
    console.log(`PASS browser: focused report ${example.name}${exportPdf ? ' / PDF exported' : ''}`);
  }
  await page.evaluate(() => document.body.classList.remove('rep-mode'));
  await page.locator('#btn-pdf').click();
  assert.equal(await page.locator('#f-ind').inputValue(), 'G.5.3.P');
  assert.match(await page.locator('#report').innerText(), /Trendvergleich nicht verfügbar/);
  console.log('PASS browser: full report preserves the selected indicator');
  await page.evaluate(() => document.body.classList.remove('rep-mode'));
  await page.selectOption('#f-ind', 'E.4.2.M');
  await page.locator('#btn-pdf-indicator').click();
  assert.match(await page.locator('#report').innerText(), /Statistisch nicht beurteilbar/);
  console.log('PASS browser: small expected event count does not become a quality judgement');
  assert.deepEqual(errors, []);
  console.log('PASS browser: no JavaScript errors');
} finally {
  await browser.close();
}
