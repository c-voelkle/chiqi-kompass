// Design-system guard: enforces docs/DESIGN_LANGUAGE.md §6 on every page.
// Runs offline with plain node, no dependencies:  node deploy/test_design_system.mjs
// A failure names the file, line and rule. Fix the page (use tokens, k- classes,
// KompassUI helpers); do not loosen the rule without updating the design doc.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const rel = p => path.relative(root, p).split(path.sep).join('/');
let checks = 0;
const check = (name, fn) => {
  try { fn(); } catch (e) { console.error(`FAIL ${name}${e.message}`); process.exit(1); }
  checks++; console.log(`PASS ${name}`);
};

// ---------- Files under the rules ----------
// Pages and page scripts. The UI kit (ui/), vendored libraries, engine/data
// modules maintained upstream and tests are exempt.
const EXEMPT_DIRS = new Set(['ui', 'vendor', 'node_modules']);
const EXEMPT_FILES = new Set(['chiqi/chiqi_engine.js', 'chiqi/spiges_parser.js', 'chiqi/chiqi_demo_defs.js', 'chiqi/qm_workbench.js']);
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!EXEMPT_DIRS.has(entry.name)) walk(full, out); continue; }
    if (!/\.(html|js|css)$/.test(entry.name)) continue;
    if (EXEMPT_FILES.has(rel(full))) continue;
    out.push(full);
  }
  return out;
}
const files = walk(root);
const pages = files.filter(f => f.endsWith('.html'));

// Long lines are embedded data (cockpit.html carries the QIP dataset on one line).
const codeLines = file => fs.readFileSync(file, 'utf8').split('\n')
  .map((text, i) => ({ text, line: i + 1 }))
  .filter(l => l.text.length < 20000);

const RULES = [
  { id: 'R1', what: 'colour literal (use a --k- token or a k- class)',
    re: /#[0-9a-fA-F]{3,8}\b(?![-\w])|\brgba?\(|\bhsla?\(/g,
    allow: l => /<meta name="theme-color"/.test(l) || /&#\d|href="#|#[0-9a-fA-F]{3,8}["']?\s*data-/.test(l) },
  { id: 'R2', what: 'font-size, radius or shadow literal (use kompass.css)', re: /font-size\s*:|border-radius\s*:|box-shadow\s*:|font-family\s*:/g },
  { id: 'R3', what: 'inline style attribute or <style> block (use k- classes; toggle with hidden)', re: /\sstyle\s*=\s*["']|<style[\s>]|\.style\.(?!left|top)\w+\s*=/g },
  { id: 'R4', what: 'local number formatting (use KompassUI.fmt)', re: /\.toFixed\(|\.toLocaleString\(|\.toLocaleDateString\(|\.toLocaleTimeString\(|Intl\.NumberFormat/g },
  { id: 'R5', what: 'legacy component class (use k- components)', re: /class="(?:[^"]*\s)?(?:chip|card|btn|badge|hint|warnbox|signal|kpi)(?:\s[^"]*)?"/g },
  { id: 'R7', what: 'emoji or dingbat used as icon (use KompassUI.icon)', re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\\ud83[cdef]/gu },
  { id: 'R8', what: 'native dialog (use KompassUI.confirm)', re: /window\.(?:confirm|alert|prompt)\(|[^.\w](?:confirm|alert|prompt)\(\s*['"`]/g },
  { id: 'R11', what: 'decimal comma in a figure (the app uses decimal points: 1.96, 99.8%)', re: /\b\d+,\d+\s?%|\|z\|\s*(?:&gt;|>)\s*\d+,\d/g }
];

check('pages follow the design rules R1–R8, R11 (docs/DESIGN_LANGUAGE.md §6)', () => {
  const violations = [];
  for (const file of files) {
    for (const { text, line } of codeLines(file)) {
      for (const rule of RULES) {
        rule.re.lastIndex = 0;
        if (rule.re.test(text) && !(rule.allow && rule.allow(text))) {
          violations.push(`${rel(file)}:${line} ${rule.id} ${rule.what}\n    ${text.trim().slice(0, 160)}`);
        }
      }
    }
  }
  assert.equal(violations.length, 0, `\n${violations.join('\n')}\n`);
});

check('every page loads the shared UI layer and opts into it', () => {
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    if (rel(page).startsWith('output/')) continue;
    assert.match(html, /<link rel="stylesheet" href="(?:\.\.\/)?ui\/kompass\.css">/, `${rel(page)} must link ui/kompass.css`);
    assert.match(html, /<body class="k-body[\s"]/, `${rel(page)} body must carry class k-body`);
    assert.match(html, /<link rel="icon" href="(?:\.\.\/)?ui\/favicon\.svg"/, `${rel(page)} must use the favicon`);
    assert.match(html, /<meta name="theme-color"/, `${rel(page)} must declare theme-color`);
    if (!/<iframe/.test(html)) assert.match(html, /<script src="(?:\.\.\/)?ui\/kompass-ui\.js"><\/script>/, `${rel(page)} must load ui/kompass-ui.js`);
  }
});

check('standalone UI copy in chiqi/ui is byte-identical (R10)', () => {
  for (const name of fs.readdirSync(path.join(root, 'ui'))) {
    if (!/\.(css|js|svg)$/.test(name) || name.startsWith('test_')) continue;
    const a = fs.readFileSync(path.join(root, 'ui', name));
    const b = path.join(root, 'chiqi', 'ui', name);
    assert.ok(fs.existsSync(b), `chiqi/ui/${name} missing: cp deploy/ui/${name} deploy/chiqi/ui/`);
    assert.ok(a.equals(fs.readFileSync(b)), `chiqi/ui/${name} differs from ui/${name}: cp deploy/ui/${name} deploy/chiqi/ui/`);
  }
});

// ---------- Tokens ----------
const css = fs.readFileSync(path.join(root, 'ui', 'kompass.css'), 'utf8');
export function tokenBlock(selectorStart) {
  const i = css.indexOf(selectorStart);
  assert.ok(i >= 0, `token block ${selectorStart} not found`);
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  return Object.fromEntries([...body.matchAll(/--k-([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
}
const light = tokenBlock(':root, .k-light {');
const darkMedia = tokenBlock(':root:not([data-theme="light"]) {');
const darkForced = tokenBlock(':root[data-theme="dark"] {');

check('dark tokens are identical for prefers-color-scheme and data-theme', () => {
  assert.deepEqual(darkForced, darkMedia);
  for (const key of Object.keys(darkMedia)) assert.ok(key in light, `dark token --k-${key} has no light value`);
});

const UI = require('./ui/kompass-ui.js');
check('chart token fallbacks in kompass-ui.js equal kompass.css', () => {
  for (const [name, value] of Object.entries(UI.TOKEN_FALLBACK)) {
    assert.equal(value.toUpperCase(), String(light[name]).toUpperCase(), `TOKEN_FALLBACK.${name}`);
  }
});

// ---------- UI kit behaviour (§3) ----------
check('number formatting follows §3.1', () => {
  const f = UI.fmt;
  assert.equal(f.n(1234), '1’234');
  assert.equal(f.n(0), '0');
  assert.equal(f.n(null), '–');
  assert.equal(f.oe(1.234), '1.23');
  assert.equal(f.oe(undefined), '–');
  assert.equal(f.pct(73.6), '73.6%');
  assert.equal(f.pct(0), '0.0%');
  assert.equal(f.share(0.75), '75.0%');
  assert.equal(f.z(2.44), '+2.4');
  assert.equal(f.z(-1.06), '−1.1');
  assert.equal(f.z(-0.01), '0.0');
  assert.equal(f.z(null), '–');
  assert.equal(f.delta(-0.123), '−0.12');
  assert.equal(f.period('19'), '2019–2023');
  assert.equal(f.period('24'), '2024');
  assert.equal(f.date('2026-09-24'), '24.09.2026');
  assert.match(UI.num('–'), /aria-label="nicht verfügbar"/);
});

check('signals use one vocabulary with marks; tones are closed sets', () => {
  assert.deepEqual(Object.keys(UI.SIGNALS), ['high', 'low', 'deviant', 'inconspicuous', 'not-assessable']);
  assert.match(UI.badge({ signal: 'high' }), /data-signal="high".*▲.*signifikant erhöht/);
  assert.match(UI.badge({ signal: 'low' }), /▼.*signifikant tiefer/);
  assert.match(UI.badge({ signal: 'not-assessable' }), /n\. b\./);
  assert.throws(() => UI.badge({ signal: 'good' }));
  assert.throws(() => UI.badge({ tone: 'green', label: 'x' }));
  assert.match(UI.badge({ tone: 'caution', label: '<b>' }), /&lt;b&gt;/, 'badge escapes its label');
});

check('helpers escape text and icons exist', () => {
  assert.equal(UI.esc('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  assert.match(UI.infoTip('Thema <x>', 'Text <y>'), /aria-label="Über Thema &lt;x&gt;"[^]*<p>Text &lt;y&gt;<\/p>/);
  for (const name of Object.keys(UI.ICONS)) assert.match(UI.icon(name), /^<svg class="k-icon"/);
  assert.throws(() => UI.icon('no-such-icon'));
});

console.log(`\n${checks} design-system checks passed.`);
