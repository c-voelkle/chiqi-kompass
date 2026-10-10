// Layout guard (docs/DESIGN_LANGUAGE.md §1 principle 7, rule R9): every page fits
// at 1536 × 740 and 1280 × 680 in light and dark without page-level horizontal
// scroll and without JavaScript errors. The chiqi page is checked after a
// synthetic import so the workbench tables are on screen.
// Run with a locally installed Playwright or CHIQI_PLAYWRIGHT_PATH;
// CHIQI_BROWSER_CHANNEL=chrome uses an installed Chrome instead of Chromium.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CHIQI_PLAYWRIGHT_PATH || 'playwright');
const channel = process.env.CHIQI_BROWSER_CHANNEL;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const xml = new URL('./chiqi/spiges_testdata_v15.xml', import.meta.url);
const VIEWPORTS = [{ width: 1536, height: 740 }, { width: 1280, height: 680 }];
const SCHEMES = ['light', 'dark'];
const PAGES = [
  { name: 'shell + cockpit', url: './index.html#cockpit' },
  { name: 'cockpit', url: './cockpit.html' },
  { name: 'chiqi after import', url: './chiqi/index.html', prepare: async page => {
    await page.locator('#fileInput').setInputFiles(new URL(xml).pathname);
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('abgeschlossen'));
  } },
  { name: 'gallery', url: './ui/gallery.html' }
];
let checks = 0;
try {
  for (const viewport of VIEWPORTS) for (const colorScheme of SCHEMES) {
    const context = await browser.newContext({ viewport, colorScheme });
    for (const spec of PAGES) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(new URL(spec.url, import.meta.url).href, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      if (spec.prepare) await spec.prepare(page);
      for (const frame of page.frames()) {
        const m = await frame.evaluate(() => ({
          doc: location.pathname.split('/').slice(-2).join('/'),
          scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
          unlabeledTips: [...document.querySelectorAll('.k-infotip')].filter(b => !b.getAttribute('aria-label')).length,
          bodyOptIn: document.body.classList.contains('k-body')
        }));
        const label = `${spec.name} ${m.doc} ${viewport.width}×${viewport.height} ${colorScheme}`;
        assert.ok(m.scroll <= m.client, `${label}: horizontal scroll (${m.scroll} > ${m.client})`);
        assert.equal(m.unlabeledTips, 0, `${label}: InfoTip without aria-label`);
        assert.ok(m.bodyOptIn, `${label}: body lacks k-body`);
      }
      assert.deepEqual(errors, [], `${spec.name}: JavaScript errors`);
      checks++;
      await page.close();
    }
    await context.close();
  }
  console.log(`PASS layout: ${checks} page/viewport/theme combinations fit without horizontal scroll or errors.`);
} finally {
  await browser.close();
}
