// Contrast guard for the tokens in kompass.css (docs/DESIGN_LANGUAGE.md §2.7).
// Run after any token change:  node deploy/ui/test_contrast.mjs
// WCAG 2.1: text ≥ 4.5:1, non-text marks and control outlines ≥ 3:1.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('./kompass.css', import.meta.url), 'utf8');
function block(selectorStart) {
  const i = css.indexOf(selectorStart);
  assert.ok(i >= 0, `token block ${selectorStart} not found`);
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  return Object.fromEntries([...body.matchAll(/--k-([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
}
const light = block(':root, .k-light {');
const themes = { light, dark: { ...light, ...block(':root:not([data-theme="light"]) {') } };

function resolve(t, name) {
  let v = t[name];
  assert.ok(v, `token --k-${name} missing`);
  const ref = /^var\(--k-([\w-]+)\)$/.exec(v);
  if (ref) v = resolve(t, ref[1]);
  assert.match(v, /^#[0-9A-Fa-f]{6}$/, `--k-${name} must be a 6-digit hex for the contrast check`);
  return v;
}
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const TEXT = [
  ['foreground', 'card'], ['foreground', 'canvas'], ['foreground', 'hover'], ['foreground', 'selected'],
  ['subtle-foreground', 'card'],
  ['muted-foreground', 'card'], ['muted-foreground', 'canvas'], ['muted-foreground', 'muted'],
  ['muted-foreground', 'hover'], ['muted-foreground', 'selected'],
  ['primary', 'card'], ['primary', 'canvas'],
  ['primary-foreground', 'primary'], ['primary-foreground', 'primary-hover'], ['primary-foreground', 'primary-active'],
  ['destructive-foreground', 'destructive'], ['destructive-foreground', 'destructive-hover'], ['destructive-foreground', 'destructive-active'],
  ['chrome-foreground', 'chrome'], ['chrome-muted', 'chrome'], ['chrome-foreground', 'chrome-hover'],
  ['not-assessable', 'card'],
  ...['high', 'low', 'deviant', 'inconspicuous', 'ok', 'caution'].flatMap(s => [[s, `${s}-soft`], [s, 'card']])
];
const NON_TEXT = [
  ['input', 'card'], ['ring', 'card'], ['needle', 'card'], ['needle-chrome', 'chrome'],
  ['chart-point', 'card'], ['chart-limit', 'card'], ['primary', 'selected'],
  ['high', 'card'], ['low', 'card'], ['deviant', 'card']
];

let failures = [], count = 0;
for (const [theme, t] of Object.entries(themes)) {
  for (const [list, min] of [[TEXT, 4.5], [NON_TEXT, 3]]) {
    for (const [fg, bg] of list) {
      const r = ratio(resolve(t, fg), resolve(t, bg));
      count++;
      if (r < min) failures.push(`${theme}: --k-${fg} on --k-${bg} = ${r.toFixed(2)} < ${min}`);
    }
  }
}
assert.equal(failures.length, 0, '\n' + failures.join('\n'));
console.log(`PASS contrast: ${count} token pairs meet WCAG 2.1 in light and dark.`);
