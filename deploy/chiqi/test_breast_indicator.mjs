import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('./chiqi_engine.js'), Q = require('./qm_workbench.js');
const demo = JSON.parse(fs.readFileSync(new URL('./chiqi_demo_defs.js', import.meta.url), 'utf8').replace(/^[\s\S]*?window\.CHIQI_DEMO = /, '').replace(/;\s*$/, ''));
const def = demo.indicators.find(i => i.id === 'G5_03');
const corpus = JSON.parse(fs.readFileSync(new URL('../../chiqi-engine/chiqi_definitions_v55.json', import.meta.url)));
assert.equal(def.filterF, corpus.filters.G5_02_F);
assert.equal(def.filterM, corpus.filters.G5_03_F);
assert.ok(Math.abs(def.referenceRate - 0.7602269) < 1e-12);
assert.equal(def.referenceNumerator, 7638);
assert.equal(def.referenceDenominator, 10047);
const c = (id, chops = ['8521'], values = {}) => ({ fallId: 'synthetic-' + id, burnr: 'synthetic-location',
  geschlecht: 'F', alterJahre: 60, hauptdiagnose: 'C509', nebendiagnosen: [], chopsNorm: chops,
  nochHospitalisiert: false, austrittsentscheid: '1', austritt: '2026-06-30', austrittsjahr: 2026, austrittsquartal: 2, ...values });
const fixtures = [
  [c('preserving'), true, true],
  [c('mastectomy', ['8541']), true, false],
  [c('both', ['8521', '8541']), true, false],
  [c('male', ['8521'], { geschlecht: 'M' }), false, false],
  [c('missing-sex', ['8521'], { geschlecht: null }), false, false],
  [c('dcis', ['8521'], { hauptdiagnose: 'D051' }), true, true],
  [c('secondary', ['8521'], { hauptdiagnose: 'Z511', nebendiagnosen: ['C509'] }), true, true],
  [c('no-tumor', ['8521'], { hauptdiagnose: 'D240' }), false, false],
  [c('no-operation', []), false, false],
  [c('wrong-prefix', ['18521']), false, false],
  [c('new-preserving', ['85B1']), true, true],
  [c('new-nonpreserving', ['85A01']), true, false],
  [c('ongoing', ['8521'], { nochHospitalisiert: true, austritt: null }), false, false],
  [c('no-outcome', ['8521'], { austrittsentscheid: null }), true, true],
  [c('no-age', ['8521'], { alterJahre: null }), true, true]
];
for (const [item, denominator, numerator] of fixtures) {
  const row = E.createIndicatorEvaluator(def)(item, 0);
  assert.equal(row.denominator, denominator, item.fallId + ' denominator');
  assert.equal(row.numerator, numerator, item.fallId + ' numerator');
  assert.equal(row.outcomeMissing, false);
  const sqlRow = E.createIndicatorEvaluator({ ...def, filterF: undefined, filterM: undefined })(item, 0);
  assert.equal(row.denominator, sqlRow.denominator, 's/f denominator parity');
  assert.equal(row.numerator, sqlRow.numerator, 's/f numerator parity');
}
// Cover every CHOP prefix that appears in the actual BAG definitions.
const prefixes = [...new Set([...def.sqlF.matchAll(/' (\w+)'/g)].map(m => m[1]))];
for (const prefix of prefixes) {
  const row = E.caseToRow(c(prefix, [prefix + '99']));
  assert.equal(E.compileFilter(def.filterF)(row), E.compile(def.sqlF)(row));
  assert.equal(E.compileFilter(def.filterM)(row), E.compile(def.sqlM)(row));
}
const cases = fixtures.map(f => f[0]), result = E.computeIndicator(cases, def);
assert.equal(result.n, fixtures.filter(f => f[1]).length);
assert.equal(result.O, fixtures.filter(f => f[2]).length);
assert.equal(result.rate, result.O / result.n);
assert.ok(Math.abs(result.E - result.n * def.referenceRate) < 1e-12);
assert.equal(result.smr, null);
assert.equal(result.outcomeMisses, 0);
assert.equal(result.refMisses, 0);
const rows = Q.buildCaseRows(cases, def, E);
assert.equal(rows.filter(r => r.denominator).length, result.n);
assert.ok(rows.some(r => r.caseId === 'synthetic-secondary'));
assert.ok(rows.some(r => r.caseId === 'synthetic-male' && !r.denominator));
for (const example of [[], [c('zero', ['8541'])], [c('one')]]) {
  const r = E.computeIndicator(example, def);
  assert.equal(r.rate, example.length ? (example[0].chopsNorm[0] === '8541' ? 0 : 1) : null);
  assert.equal(Q.assessResult(r).code, 'small');
}
const missingRef = E.computeIndicator([c('missing-ref')], { ...def, referenceRate: null });
assert.equal(missingRef.E, null);
assert.equal(missingRef.refMisses, 1);
assert.equal(Q.assessResult(missingRef).code, 'blocked');
assert.equal(Q.assessResult({ ...result, n: 100, O: 0, E: 76 }).label, 'prüfenswert tiefer (richtungsneutral)');
const project = Q.createProject({ entId: 'synthetic', periodKey: '2026' }, result);
assert.equal(project.plan.targetMetric, 'Rate');
project.check = { n: '20', O: '15', measuredAt: '2026-09-24', evidence: 'synthetic', methodComparable: true };
assert.equal(Q.followUp(project).rate, 0.75);
assert.equal(Q.followUp(project).E, 20 * def.referenceRate);
assert.equal(Q.followUp(project).smr, null);
assert.equal(Q.progress(project).check, true);
project.check.O = '21';
assert.equal(Q.followUp(project).rate, null);
assert.equal(Q.progress(project).check, false);
assert.equal(fs.readFileSync(new URL('./chiqi_demo_defs.js', import.meta.url), 'utf8'), fs.readFileSync(new URL('../../chiqi-engine/chiqi_demo_defs.js', import.meta.url), 'utf8'));
console.log(`PASS breast indicator: ${fixtures.length} inclusion/exclusion fixtures, ${prefixes.length} CHOP prefixes, s/f parity, reference, trace, boundary cases, local PDCA and synchronization`);
