// Vergleichsgruppen: Merkmalsdaten, Klassierung und gepoolter Rohwert.
// Läuft offline:  node deploy/test_hospital_groups.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HG = require('./hospital_groups.js');

let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('  ✔ ' + name); };
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('./kzp24_attributes.js', import.meta.url), 'utf8'), sandbox);
const KZP = sandbox.window.KZP24.betriebe;
const html = fs.readFileSync(new URL('./cockpit.html', import.meta.url), 'utf8');
const DB = JSON.parse(html.match(/<script type="application\/json" id="qip-data">([\s\S]*?)<\/script>/)[1]);
const betriebe = DB.betrieb.insts.filter(x => !x.a).map(x => x.n);

check('jeder QIP-Betrieb hat Merkmale aus den Kennzahlen', () => {
  const missing = betriebe.filter(n => !KZP[n]);
  assert.deepEqual(missing, []);
  for (const n of betriebe) {
    const a = KZP[n];
    assert.match(a.kt, /^[A-Z]{2}$/, n);
    assert.ok(HG.TYP[a.typ], n + ' Typ ' + a.typ);
    assert.ok(HG.RFORM[a.rf], n + ' Rechtsform ' + a.rf);
    assert.ok(HG.regionOf(a.kt), n + ' Kanton ' + a.kt);
  }
});

check('jeder Standort lässt sich seinem Betrieb zuordnen (wie im Cockpit)', () => {
  const plain = x => x.replace(/:/g, '');
  const orphans = DB.standort.insts.filter(x => !x.a)
    .filter(x => betriebe.filter(b => plain(x.n).startsWith(plain(b) + ' - ')).length !== 1);
  assert.deepEqual(orphans.map(x => x.n), []);
});

check('Grössenklassen und Grossregionen decken alle Werte ab', () => {
  assert.equal(HG.sizeClass(1999), 'S1');
  assert.equal(HG.sizeClass(2000), 'S2');
  assert.equal(HG.sizeClass(19999), 'S4');
  assert.equal(HG.sizeClass(60643), 'S5');
  assert.equal(HG.sizeClass(null), null);
  const all = Object.values(HG.REGIONS).flatMap(r => r.kt);
  assert.equal(all.length, 26);
  assert.equal(new Set(all).size, 26);
});

check('Filter kombiniert Merkmale; Zusammenfassungen der Typologie greifen', () => {
  const usz = KZP['Universitätsspital Zürich'];
  assert.equal(HG.matches(usz, { ...HG.emptyFilter(), typ: 'K111', region: 'GR-4' }), true);
  assert.equal(HG.matches(usz, { ...HG.emptyFilter(), typ: 'K1*' }), true);
  assert.equal(HG.matches(usz, { ...HG.emptyFilter(), typ: 'K12*' }), false);
  assert.equal(HG.matches(usz, { ...HG.emptyFilter(), region: 'ZH' }), true);
  assert.equal(HG.matches(null, { ...HG.emptyFilter(), region: 'ZH' }), false);
  assert.equal(HG.matches(null, HG.emptyFilter()), true);
  assert.equal(HG.describe({ ...HG.emptyFilter(), typ: 'K12*', region: 'GR-4' }), 'Grundversorgung (K121–K123) · Zürich');
});

check('Auswahlwerte zählen die Betriebe; leere Werte entfallen', () => {
  const opts = HG.options(betriebe.map(n => KZP[n]));
  const k111 = opts.typ[1].options.find(o => o.value === 'K111');
  assert.equal(k111.count, betriebe.filter(n => KZP[n].typ === 'K111').length);
  assert.ok(opts.region[1].options.every(o => o.count > 0));
  const sum = opts.size[0].options.reduce((a, o) => a + o.count, 0);
  assert.equal(sum, betriebe.filter(n => KZP[n].aus != null).length);
});

check('gepoolter Rohwert = Summe O ÷ Summe n', () => {
  assert.equal(HG.pooledRate([{ x: 100, y: 10 }, { x: 300, y: 2 }]), 4);
  assert.equal(HG.pooledRate([]), null);
  assert.equal(HG.pooledRate([{ x: 0, y: 50 }]), null);
});

console.log(`\n${checks} Prüfungen bestanden.`);
