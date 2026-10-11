// Farbschema-Schalter (Auto / Hell / Dunkel): Shell, Seite im Frame, Diagramme,
// Speicherung und allein geöffnete Unterseiten (Browser).
// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH.
// CHIQI_SCREENSHOT_DIR=… saves the shell in the forced dark theme.
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
const DARK_CANVAS = '#0A1019', LIGHT_CANVAS = '#F3F5F8';
const canvas = target => target.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--k-canvas').trim().toUpperCase());
const cockpitFrame = async page => {
  const f = page.frames().find(x => x.url().endsWith('cockpit.html'));
  await f.waitForFunction(() => window.Chart && Chart.getChart('funnel'));
  return f;
};
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(new URL('./index.html#cockpit', import.meta.url).href);
  const toggle = page.locator('[data-k-theme-toggle]');
  let frame = await cockpitFrame(page);
  assert.equal(await toggle.getAttribute('data-theme-state'), 'auto');
  assert.equal(await canvas(frame), LIGHT_CANVAS);

  await toggle.click(); // Auto → Hell
  assert.equal(await toggle.getAttribute('data-theme-state'), 'light');
  await toggle.click(); // Hell → Dunkel
  assert.equal(await toggle.getAttribute('data-theme-state'), 'dark');
  assert.match(await toggle.getAttribute('aria-label'), /^Farbschema: Dunkel\. Wechseln zu Auto$/);
  assert.equal(await canvas(page), DARK_CANVAS);
  await frame.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  assert.equal(await canvas(frame), DARK_CANVAS);
  // Diagramme übernehmen die dunklen Tokens (Achsenfarbe = muted-foreground dunkel).
  assert.equal(await frame.evaluate(() => Chart.defaults.color.toUpperCase()), '#8E9BAC');
  if (shots) await page.screenshot({ path: path.join(shots, 'theme-dark.png') });
  ok('Dunkel wirkt in Shell, eingebetteter Seite und Diagrammen');

  await page.reload();
  frame = await cockpitFrame(page);
  assert.equal(await toggle.getAttribute('data-theme-state'), 'dark');
  await frame.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  await page.locator('#tabs a[data-page="chiqi"]').click();
  let chiqi;
  for (let k = 0; k < 50 && !chiqi; k++) {
    chiqi = page.frames().find(x => x.url().includes('chiqi/index.html'));
    if (!chiqi) await page.waitForTimeout(100);
  }
  await chiqi.waitForLoadState('load');
  await chiqi.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  ok('Wahl bleibt nach Neuladen und beim Seitenwechsel erhalten');

  await toggle.click(); // Dunkel → Auto
  assert.equal(await toggle.getAttribute('data-theme-state'), 'auto');
  await chiqi.waitForFunction(() => !document.documentElement.hasAttribute('data-theme'));
  assert.equal(await canvas(chiqi), LIGHT_CANVAS);
  ok('Auto folgt wieder dem System');

  // Allein geöffnete Unterseite: eigener Schalter in der Standalone-Kopfleiste.
  const solo = await context.newPage();
  await solo.goto(new URL('./chiqi/index.html', import.meta.url).href);
  const soloToggle = solo.locator('#standaloneNav [data-k-theme-toggle]');
  await soloToggle.waitFor({ state: 'visible' });
  await soloToggle.click(); await soloToggle.click();
  assert.equal(await canvas(solo), DARK_CANVAS);
  await solo.close();
  ok('Allein geöffnete Unterseite hat einen eigenen Schalter');

  const darkSystem = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  const p2 = await darkSystem.newPage();
  await p2.goto(new URL('./cockpit.html', import.meta.url).href);
  assert.equal(await canvas(p2), DARK_CANVAS);
  await darkSystem.close();
  assert.deepEqual(errors, []);
  ok('Auto übernimmt ein dunkles System');
} finally {
  await browser.close();
}
console.log(`\n${checks} Browser-Prüfungen bestanden.`);
