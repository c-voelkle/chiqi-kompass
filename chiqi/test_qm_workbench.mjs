// Tests für die lokale QM-Workbench (Node >= 18)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const Q = require(path.join(dir, 'qm_workbench.js'));
const E = require(path.join(dir, 'chiqi_engine.js'));
const demo = JSON.parse(fs.readFileSync(path.join(dir, 'chiqi_demo_defs.js'), 'utf8')
  .replace(/^[\s\S]*?window\.CHIQI_DEMO = /, '').replace(/;\s*$/, ''));

let failed = 0;
function check(label, condition, actual) {
  if (condition) console.log('  ✔ ' + label);
  else {
    failed++;
    console.error('  ✘ ' + label + (actual !== undefined ? '  (ist: ' + JSON.stringify(actual) + ')' : ''));
  }
}

function mkCase(values) {
  return Object.assign({
    fallId: 'x',
    burnr: '12345678',
    geschlecht: 'M',
    alterJahre: 70,
    alterTageU1: null,
    eintritt: '2026-01-01',
    austritt: '2026-01-05',
    austrittsjahr: 2026,
    austrittsquartal: 1,
    verweildauerTage: 4,
    nochHospitalisiert: false,
    eintrittsart: '1',
    eintrittAufenthalt: '1',
    austrittsentscheid: '1',
    austrittAufenthalt: '1',
    verstorben: false,
    aufenthaltIpsStunden: null,
    beatmungStunden: null,
    hauptleistungsstelle: 'M100',
    liegeklasse: '1',
    hauptdiagnose: null,
    nebendiagnosen: [],
    diagnosen: [],
    chops: [],
    chopsNorm: [],
    behandlungen: [],
    neugeborene: null,
    psychiatrie: null,
    patientenbewegungen: [],
    _admin: { alter: '70' }
  }, values);
}

const cases = [
  mkCase({ fallId: 'raw-a-death', hauptdiagnose: 'I214', alterJahre: 74, verstorben: true, austrittsentscheid: '5', _admin: { alter: '74' } }),
  mkCase({ fallId: 'raw-a-alive', hauptdiagnose: 'I229', alterJahre: 65, geschlecht: 'F', _admin: { alter: '65' } }),
  mkCase({ fallId: 'raw-a-young', hauptdiagnose: 'I214', alterJahre: 19, _admin: { alter: '19' } }),
  mkCase({ fallId: 'raw-a-open', hauptdiagnose: 'I214', austritt: null, austrittsjahr: null, austrittsquartal: null, nochHospitalisiert: true, austrittsentscheid: null }),
  mkCase({ fallId: 'raw-b-death', hauptdiagnose: 'I639', alterJahre: 81, verstorben: true, austrittsentscheid: '5', _admin: { alter: '81' } }),
  mkCase({ fallId: 'raw-b-alive', hauptdiagnose: 'I609', alterJahre: 60, _admin: { alter: '60' } }),
  mkCase({ fallId: 'raw-b-excluded', hauptdiagnose: 'I639', nebendiagnosen: ['C710'] }),
  mkCase({ fallId: 'raw-d-death', hauptdiagnose: 'J189', alterJahre: 85, verstorben: true, austrittsentscheid: '5', _admin: { alter: '85' } }),
  mkCase({ fallId: 'raw-d-alive', hauptdiagnose: 'A481', alterJahre: 55, _admin: { alter: '55' } }),
  mkCase({ fallId: 'raw-d-asp', hauptdiagnose: 'J690', alterJahre: 90, _admin: { alter: '90' } })
];

const indicators = demo.indicators;
const results = E.computeAll(cases, indicators);
const caseRows = {};
let allRows = [];
for (const indicator of indicators) {
  caseRows[indicator.id] = Q.buildCaseRows(cases, indicator, E);
  allRows = allRows.concat(caseRows[indicator.id]);
}

console.log('Test 1: Fallauswahl A1/B1/D1');
check('A1_01: zwei Nennerfälle', caseRows.A1_01.filter(x => x.denominator).length === 2);
check('A1_01: Alter 19 als themennaher Ausschluss sichtbar',
  caseRows.A1_01.some(x => x.caseId === 'raw-a-young' && !x.denominator && x.reasonLabel === 'Alter ≤19'));
check('A1_01: offener Fall ausgeschlossen',
  caseRows.A1_01.some(x => x.caseId === 'raw-a-open' && x.reasonCode === 'still_hospitalized'));
check('B1_01: Tumor-Ausschluss sichtbar',
  caseRows.B1_01.some(x => x.caseId === 'raw-b-excluded' && !x.denominator));
check('D1_01: J18, A481 und J69 im Nenner',
  caseRows.D1_01.filter(x => x.denominator).length === 3);

for (const result of results) {
  const included = caseRows[result.id].filter(x => x.denominator);
  check(result.id + ': Fallspur summiert zu n/O/E',
    included.length === result.n &&
    included.filter(x => x.numerator).length === result.O &&
    Math.abs(included.reduce((sum, x) => sum + x.expected, 0) - result.E) < 1e-9);
}

console.log('Test 2: lokale Fallreferenzen und Persistenz');
const storageMap = new Map();
const storage = {
  getItem: key => storageMap.has(key) ? storageMap.get(key) : null,
  setItem: (key, value) => storageMap.set(key, value)
};
const context = {
  entId: '845724581',
  locations: ['12345678'],
  periodKey: '2026',
  periodFrom: '2026-01-05',
  periodTo: '2026-01-05',
  formatVersion: '1.5'
};
await Q.makeLocalReferences(allRows, context, storage);
check('Fallreferenzen erzeugt und Original-ID nicht verwendet',
  allRows.every(x => /^F-[A-F0-9]{12}$/.test(x.localRef) && x.localRef !== x.caseId));

const project = Q.createProject(context, results[0]);
const selectedRef = caseRows.A1_01.find(x => x.denominator).localRef;
project.reviewer = 'QM';
project.reviewDate = '2026-07-23';
project.reviews[selectedRef] = {
  selected: true,
  classification: 'versorgungsprozess',
  reviewer: project.reviewer,
  reviewedAt: project.reviewDate
};
project.owner = 'Qualitätsleitung';
project.dueDate = '2026-09-30';
project.plan.goal = 'Review abschliessen und Prozesskennzahl messen';
project.plan.measure = 'Strukturierte Fallbesprechung';
project.do.status = 'umgesetzt';
project.do.implementedAt = '2026-08-15';
project.check.measuredAt = '2026-10-01';
project.check.n = '20';
project.check.O = '1';
project.check.E = '2.5';
project.check.evidence = 'Lokale Nachmessung';
project.act.decision = 'standardisieren';
project.act.conclusion = 'Prozess wird beibehalten und erneut gemessen.';
project.status = 'abgeschlossen';
check('vollständiger PDCA-Auftrag validiert', Q.validateProject(project).length === 0, Q.validateProject(project));
Q.saveProject(storage, project);
const persisted = storage.getItem(Q.STORAGE_KEY);
check('Persistenz enthält keine Original-Fall-ID', !persisted.includes('raw-a-death'));
check('Persistenz enthält keine Diagnose', !persisted.includes('I214'));
check('Wirkungsnachmessung berechnet SMR', Math.abs(Q.followUp(project).smr - 0.4) < 1e-12);

console.log('Test 3: Datenqualitäts- und Methodennachweis');
const parsed = {
  cases,
  meta: {
    parserVersion: '0.1.0',
    formatVersion: '1.5',
    namespace: 'http://www.bfs.admin.ch/xmlns/gvs/spiges-data',
    entId: context.entId,
    standorte: context.locations,
    warnings: [],
    importprotokoll: { groesseBytes: 99, datei: 'synthetisch.xml' }
  }
};
const protocol = await Q.buildQualityProtocol({
  file: typeof Blob !== 'undefined' ? new Blob(['<synthetic/>'], { type: 'application/xml' }) : null,
  parsed,
  results,
  indicators,
  caseRowsByIndicator: caseRows,
  engineVersion: E.ENGINE_VERSION,
  methodMeta: demo.meta
});
const protocolRepeat = await Q.buildQualityProtocol({
  file: typeof Blob !== 'undefined' ? new Blob(['<synthetic/>'], { type: 'application/xml' }) : null,
  parsed,
  results,
  indicators,
  caseRowsByIndicator: caseRows,
  engineVersion: E.ENGINE_VERSION,
  methodMeta: demo.meta
});
check('Nachweis-ID erzeugt', /^CHIQI-[A-F0-9]{16}$/.test(protocol.certificateId), protocol.certificateId);
check('Nachweis-ID ist für denselben Inhalt deterministisch',
  protocol.certificateId === protocolRepeat.certificateId,
  { first: protocol.certificateId, second: protocolRepeat.certificateId });
check('inkrementelles Datei-SHA-256 stimmt mit Node überein',
  protocol.source.fileSha256 === crypto.createHash('sha256').update('<synthetic/>').digest('hex'),
  protocol.source.fileSha256);
check('alle drei Fallspurprüfungen bestanden',
  protocol.checks.filter(x => x.id.startsWith('trace_')).every(x => x.status === 'pass'));
check('kleine Fallzahlen werden als Hinweis, nicht als Qualitätsurteil markiert',
  protocol.method.indicators.every(x => x.assessment === 'noch nicht belastbar'));
const protocolJson = JSON.stringify(protocol);
check('aggregierter Nachweis enthält keine Original-Fall-IDs',
  !protocolJson.includes('raw-a-death') && !protocolJson.includes('raw-b-death'));
check('aggregierter Nachweis enthält keine Diagnosenlisten',
  !protocolJson.includes('"I214"') && !protocolJson.includes('"J189"'));

const bundle = Q.exportProjectBundle(context, [project], protocol);
check('Projekt-Export deklariert Datenschutzumfang',
  bundle.privacy.containsRawCases === false && bundle.privacy.containsOriginalCaseIds === false);
check('Projekt-Export enthält keine Original-Fall-ID',
  !JSON.stringify(bundle).includes('raw-a-death'));

console.log('Test 4: Source-/Deploy-Synchronität');
const sourceEngine = fs.readFileSync(path.join(dir, '..', '..', 'chiqi-engine', 'chiqi_engine.js'), 'utf8');
const deployEngine = fs.readFileSync(path.join(dir, 'chiqi_engine.js'), 'utf8');
check('Engine-Quell- und Deploykopie sind identisch', sourceEngine === deployEngine);

console.log(failed === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + failed + ' TEST(S) FEHLGESCHLAGEN');
process.exit(failed === 0 ? 0 : 1);
