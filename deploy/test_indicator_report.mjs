import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('./cockpit.html', import.meta.url), 'utf8');
let script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
script = script.slice(0, script.indexOf('(function init(){')) + script.slice(script.indexOf('// ---------- PDF-Bericht ----------'));
const elements = new Map();
const el = id => {
  if (!elements.has(id)) elements.set(id, {
    value: '', textContent: '', innerHTML: '', options: [],
    getContext: () => ({}), addEventListener() {}
  });
  return elements.get(id);
};
const context = vm.createContext({
  document: { getElementById: el, body: { classList: { add() {}, remove() {} } } },
  sessionStorage: { getItem: () => null }, location: { search: '' }, URLSearchParams,
  window: { addEventListener() {}, print() {} }, setTimeout: () => {},
  Chart: class { constructor(_ctx, config) { this.config = config; } destroy() {} toBase64Image() { return 'data:image/png;base64,test'; } }
});
vm.runInContext(script, context);
const evaluate = code => vm.runInContext(code, context);
let checks = 0;
function check(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }
function select(level, name, code = 'G.5.3.P', per = '24') {
  el('f-level').value = level;
  el('f-inst').value = String(evaluate(`IDX[${JSON.stringify(level)}].insts.findIndex(x=>x.n.includes(${JSON.stringify(name)}))`));
  assert.notEqual(el('f-inst').value, '-1');
  el('f-per').value = per; el('f-ind').value = code;
  evaluate('radarRows=assess(state().level,state().i,state().per);renderFunnel();');
}
const current = () => JSON.parse(evaluate('JSON.stringify(analysisVals(IDX[state().level].byInst.get(state().i).find(r=>r[1]===state().ind),state().level,state().per))'));

check('published QIP dataset unchanged', () => {
  const embedded = JSON.parse(evaluate('JSON.stringify(DB)'));
  assert.deepEqual(embedded, JSON.parse(fs.readFileSync(new URL('../qip24_data.json', import.meta.url), 'utf8')));
});
for (const [name, numerator, denominator, rate] of [
  ['Hirslanden Klinik Aarau', 120, 163, 73.6], ['Klinik Hirslanden AG', 448, 568, 78.9]
]) for (const level of ['standort', 'betrieb']) {
  check(`${level} ${name}: explicit numerator/denominator and neutral test`, () => {
    select(level, name);
    const v = current();
    assert.equal(v.O, numerator); assert.equal(v.n, denominator); assert.equal(v.po, rate);
    assert.equal(v.publishedN, numerator);
    const r = JSON.parse(evaluate('JSON.stringify(radarRows.find(r=>r.code===state().ind))'));
    assert.equal(r.status, 'ok'); assert.equal(r.trend, null);
    assert.ok(Math.abs(r.z - (numerator - denominator * .76) / Math.sqrt(denominator * .76 * .24)) < 1e-10);
    assert.equal(evaluate('funnelChart.config.data.datasets[1].data[0].x'), denominator);
    assert.equal(evaluate('funnelChart.config.data.datasets.slice(2,6).every(d=>d.data.every(p=>p.y>=0&&p.y<=100))'), true);
  });
}
check('baseline numerator/denominator, no process trend', () => {
  select('betrieb', 'Hirslanden Klinik Aarau', 'G.5.3.P', '19');
  assert.equal(current().O, 674); assert.equal(current().n, 844);
  assert.equal(evaluate('radarRows.some(r=>r.zt!==null)'), false);
});
check('selected indicator is retained by full and focused PDF actions', () => {
  select('standort', 'Hirslanden Klinik Aarau');
  evaluate("printReport('all')");
  assert.equal(el('f-ind').value, 'G.5.3.P');
  assert.match(el('report').innerHTML, /Trendvergleich nicht verfügbar/);
  evaluate("printReport('indicator')");
  const report = el('report').innerHTML;
  assert.match(report, /G\.5\.3\.P/); assert.match(report, /G\.5\.2\.F/);
  assert.match(report, /<b>120<\/b>/); assert.match(report, /<b>163<\/b>/);
  assert.match(report, /kein DKG-Zertifizierungsnachweis/);
  assert.match(report, /Trendvergleich nicht verfügbar/);
  assert.doesNotMatch(report, /G\.1\.|Kaiserschnitt|Top-\d|Positive Signale|Fallzahl-Monitor/);
});
check('missing denominator fails closed, no fallback to numerator', () => {
  select('standort', 'Hirslanden Klinik Aarau');
  evaluate("var baseTest=IDX.standort.byInst.get(state().i).find(r=>r[1]==='G.5.2.F');var savedTest=baseTest[5];baseTest[5]=null;");
  assert.equal(current().n, null);
  evaluate("radarRows=assess('standort',state().i,'24');renderFunnel();buildReport('indicator');");
  assert.match(el('report').innerHTML, /Statistisch nicht beurteilbar/);
  assert.doesNotMatch(el('report').innerHTML, /<img/);
  evaluate('baseTest[5]=savedTest;');
});
check('inconsistent rate and count fail closed', () => {
  select('standort', 'Hirslanden Klinik Aarau');
  evaluate("var rawTest=IDX.standort.byInst.get(state().i).find(r=>r[1]==='G.5.3.P');var savedRate=rawTest[2];rawTest[2]=99;");
  assert.equal(current().n, null);
  evaluate('rawTest[2]=savedRate;');
});
check('zero numerator remains zero rather than missing', () => {
  select('standort', 'Hirslanden Klinik Aarau');
  evaluate("var oldRaw=rawTest.slice();rawTest[2]=0;rawTest[5]=0;");
  assert.equal(current().O, 0); assert.equal(current().n, 163);
  evaluate('rawTest[2]=oldRaw[2];rawTest[5]=oldRaw[5];');
});
check('other process reports are descriptive until denominator verification', () => {
  select('standort', 'Hirslanden Klinik Aarau', 'G.1.4.P');
  evaluate("buildReport('indicator')");
  assert.match(el('report').innerHTML, /Nur deskriptiv/);
  assert.doesNotMatch(el('report').innerHTML, /<img|O\/E \d|z = [-\d]/);
});
check('low expected event count is not called an unremarkable result', () => {
  select('standort', 'Hirslanden Klinik Aarau', 'E.4.2.M');
  evaluate("buildReport('indicator')");
  assert.match(el('report').innerHTML, /Statistisch nicht beurteilbar/);
});
check('suppressed and absent data are not converted to zero rates', () => {
  select('standort', 'Hirslanden Klinik Aarau', 'E.4.4.M');
  evaluate("buildReport('indicator')");
  assert.match(el('report').innerHTML, /Statistisch nicht beurteilbar/);
  assert.doesNotMatch(el('report').innerHTML, /<img/);
});
check('no trend claims in location KPI or baseline period', () => {
  select('standort', 'Hirslanden Klinik Aarau');
  evaluate('renderKPIs(radarRows,[])');
  assert.equal(el('k-trends').textContent, '–');
  assert.equal(el('k-trends-d').textContent, 'Trendvergleich nicht verfügbar');
});
console.log(`\n${checks} indicator-report checks passed.`);
