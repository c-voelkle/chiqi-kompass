// Patientengruppen-Filter: Klassierung, Auswahlwerte und Rechenkonsistenz.
// Läuft ohne Upstream-Ordner:  node deploy/chiqi/test_patient_filter.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PF = require('./patient_filter.js'), E = require('./chiqi_engine.js'), P = require('./spiges_parser.js');
const demo = JSON.parse(fs.readFileSync(new URL('./chiqi_demo_defs.js', import.meta.url), 'utf8')
  .replace(/^[\s\S]*?window\.CHIQI_DEMO = /, '').replace(/;\s*$/, ''));

let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('  ✔ ' + name); };
const c = (id, values = {}) => ({ fallId: 'synthetic-' + id, geschlecht: 'M', alterJahre: 70, eintrittsart: '1',
  eintrittAufenthalt: '1', nochHospitalisiert: false, ...values });

check('Altersklassen folgen den BAG-Strata, Neugeborene zählen zu 0–19', () => {
  assert.deepEqual([19, 20, 44, 45, 64, 65, 84, 85, 101].map(a => PF.ageClass({ alterJahre: a })),
    ['0-19', '20-44', '20-44', '45-64', '45-64', '65-84', '65-84', '85+', '85+']);
  assert.equal(PF.ageClass({ alterJahre: null, alterTageU1: 3 }), '0-19');
  assert.equal(PF.ageClass({ alterJahre: null }), null);
});

check('ohne Auswahl bleiben alle Fälle erhalten', () => {
  const cases = [c(1), c(2, { geschlecht: 'F' })];
  assert.equal(PF.isActive(PF.emptyFilter()), false);
  assert.equal(PF.apply(cases, PF.emptyFilter()).length, 2);
  assert.equal(PF.describe(PF.emptyFilter()), '');
});

check('Merkmale werden kombiniert (UND), fehlende Werte nur über "unbekannt"', () => {
  const cases = [c(1), c(2, { geschlecht: 'F' }), c(3, { eintrittsart: '2' }), c(4, { eintrittsart: null }), c(5, { eintrittsart: '9' })];
  const f = { ...PF.emptyFilter(), sex: 'M', admission: '1' };
  assert.deepEqual(PF.apply(cases, f).map(x => x.fallId), ['synthetic-1']);
  assert.equal(PF.describe(f), 'männlich · Notfall');
  assert.deepEqual(PF.entries(f), [['Geschlecht', 'männlich'], ['Eintrittsart', 'Notfall']]);
  const unknown = { ...PF.emptyFilter(), admission: PF.UNKNOWN };
  assert.deepEqual(PF.apply(cases, unknown).map(x => x.fallId), ['synthetic-4', 'synthetic-5']);
});

check('Auswahlwerte zählen Austritte; feste Klassen auch ohne Fälle, Codes nur wenn vorhanden', () => {
  const opts = PF.options([c(1), c(2, { eintrittAufenthalt: '6' }), c(3, { nochHospitalisiert: true, eintrittsart: '5' }), c(4, { eintrittAufenthalt: '42' })]);
  assert.deepEqual(opts.age.map(o => o.value), ['0-19', '20-44', '45-64', '65-84', '85+']);
  assert.equal(opts.age.find(o => o.value === '65-84').count, 3);
  assert.equal(opts.age.find(o => o.value === '0-19').count, 0);
  assert.deepEqual(opts.admission, [{ value: '1', label: 'Notfall', count: 3 }]);
  assert.deepEqual(opts.origin.map(o => o.label), ['Zuhause', 'anderes Spital', 'Code 42']);
});

const parsed = await P.parseSpiGes(fs.readFileSync(new URL('./spiges_testdata_v15.xml', import.meta.url), 'utf8'));
const all = E.computeAll(parsed.cases, demo.indicators);
const ages = PF.options(parsed.cases).age.map(o => o.value);
for (const r of all) {
  let n = 0, O = 0, Esum = 0;
  for (const age of ages) {
    const part = E.computeAll(PF.apply(parsed.cases, { ...PF.emptyFilter(), age }), demo.indicators).find(x => x.id === r.id);
    n += part.n; O += part.O; Esum += part.E || 0;
  }
  assert.equal(n, r.n, r.id + ' n');
  assert.equal(O, r.O, r.id + ' O');
  if (r.E != null) assert.ok(Math.abs(Esum - r.E) < 1e-9, r.id + ' E');
}
checks++; console.log('  ✔ Zerlegung nach Altersklasse ist mit der Gesamtauswertung konsistent (' + all.length + ' Indikatoren)');

console.log(`\n${checks} Prüfungen bestanden.`);
