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
check('alle Fallspurprüfungen bestanden',
  protocol.checks.filter(x => x.id.startsWith('trace_')).every(x => x.status === 'pass'));
check('kleine Fallzahlen werden als Hinweis, nicht als Qualitätsurteil markiert',
  protocol.method.indicators.every(x => x.assessment === 'noch nicht belastbar'));

const protocolV16 = await Q.buildQualityProtocol({
  file: null,
  parsed: { cases, meta: Object.assign({}, parsed.meta, { formatVersion: '1.6', parserVersion: '0.2.0' }) },
  results,
  indicators,
  caseRowsByIndicator: caseRows,
  engineVersion: E.ENGINE_VERSION,
  methodMeta: demo.meta
});
const formatV16 = protocolV16.checks.find(x => x.id === 'spiges_format');
check('SpiGes 1.6 besteht die Formatprüfung',
  formatV16 && formatV16.status === 'pass' && /Unterstützt: 1\.4, 1\.5 und 1\.6/.test(formatV16.detail),
  formatV16 && formatV16.detail);

// --- Totgeburten (BFS-Kodierungshandbuch SD1605a): keine Hauptdiagnose erwartet ---
const sbCases = [
  mkCase({ fallId: 'sb-ok', hauptdiagnose: null, alterJahre: 0, alterTageU1: 0, austrittsentscheid: '5',
    verstorben: true, neugeborene: { vitalstatus: '1', geburtsgewicht: '3200' }, _admin: { alter: '0' } }),
  mkCase({ fallId: 'live-ok', hauptdiagnose: 'Z380', alterJahre: 0, alterTageU1: 2,
    neugeborene: { vitalstatus: '0', geburtsgewicht: '3400' }, _admin: { alter: '0' } }),
  mkCase({ fallId: 'no-hd', hauptdiagnose: null, alterJahre: 70, _admin: { alter: '70' } })
];
const sbProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: sbCases },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
const sbRequired = sbProtocol.checks.find(x => x.id === 'required_fields');
const sbCheck = sbProtocol.checks.find(x => x.id === 'stillbirths');
check('Totgeburt zählt nicht als fehlende Hauptdiagnose',
  /^1 ohne Hauptdiagnose,/.test(sbRequired.detail), sbRequired.detail);
check('Totgeburten werden im Prüfdetail ausgewiesen',
  /1 Totgeburt\(en\)/.test(sbRequired.detail), sbRequired.detail);
check('separate Totgeburten-Prüfung vorhanden und bestanden',
  sbCheck && sbCheck.status === 'pass', sbCheck && sbCheck.status);
check('Totgeburten-Prüfung ist nicht blockierend', sbCheck && sbCheck.blocking === false);

const sbOddProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: [mkCase({ fallId: 'sb-coded', hauptdiagnose: 'P95', alterJahre: 0,
    austrittsentscheid: '1', neugeborene: { vitalstatus: '1' }, _admin: { alter: '0' } })] },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
const sbOdd = sbOddProtocol.checks.find(x => x.id === 'stillbirths');
check('kodierte Totgeburt ohne Austrittsentscheid 5 wird als Hinweis markiert',
  sbOdd && sbOdd.status === 'warn' && /Diagnosekodes/.test(sbOdd.detail) && /gestorben/.test(sbOdd.detail),
  sbOdd && sbOdd.detail);

// --- Auswärts erbrachte Leistungen (behandlung_auswaerts) und Fallzusammenführung (G51) ---
const structProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: [
    mkCase({ fallId: 'ext-fremd', hauptdiagnose: 'I214', behandlungen: [
      { chop: '00.66', auswaerts: '3' }, { chop: '3608.11', auswaerts: null }] }),
    mkCase({ fallId: 'ext-eigen', hauptdiagnose: 'I214', behandlungen: [{ chop: '88.53', auswaerts: '2' }] }),
    mkCase({ fallId: 're-ok', hauptdiagnose: 'I214', patientenbewegungen: [
      { episode_art: '1' }, { episode_art: '2', grund_wiedereintritt: '1' }] }),
    mkCase({ fallId: 're-ohne-grund', hauptdiagnose: 'I214', patientenbewegungen: [{ episode_art: '2' }] })
  ] },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
const ext = structProtocol.checks.find(x => x.id === 'external_procedures');
const merge = structProtocol.checks.find(x => x.id === 'case_merge');
check('fremd erbrachte CHOP-Kodes werden gezählt, aber nicht als Befund gewarnt',
  ext && ext.status === 'pass' && /^2 Austritt\(e\).*1 CHOP-Kode\(s\) eines anderen Betriebs/.test(ext.detail),
  ext && ext.detail);
check('eigener Betrieb an anderem Standort wird separat ausgewiesen',
  ext && /1 des eigenen Betriebs an einem anderen Standort/.test(ext.detail), ext && ext.detail);
check('alle gelieferten CHOP-Kodes bleiben gemäss CH-IQI berücksichtigt',
  ext && /alle gelieferten CHOP-Kodes unverändert/.test(ext.detail) &&
  !/falschen Leistungserbringer/.test(ext.detail), ext && ext.detail);
check('Wiedereintrittsepisoden werden gezählt',
  merge && /^2 Wiedereintrittsepisode\(n\) in 2 Fall\/Fällen, davon 1 /.test(merge.detail), merge && merge.detail);
check('fehlender Wiedereintrittsgrund erzeugt eine Warnung',
  merge && merge.status === 'warn', merge && merge.status);
check('Fallzusammenführung enthält keine pauschale Unterjahresverzerrung mehr',
  merge && /angelieferten Datenstand/.test(merge.detail) &&
  !/tendenziell zu hoch|unterjährigen Lieferungen/.test(merge.detail), merge && merge.detail);
check('beide Strukturprüfungen sind nicht blockierend',
  ext && merge && ext.blocking === false && merge.blocking === false);

const unknownExternalProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: [mkCase({ fallId: 'ext-unklar', hauptdiagnose: 'I214',
    behandlungen: [{ chop: '88.53', auswaerts: '9' }] })] },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
const unknownExternal = unknownExternalProtocol.checks.find(x => x.id === 'external_procedures');
check('unbekannte Auswärtszuordnung bleibt ein konkreter Hinweis',
  unknownExternal && unknownExternal.status === 'warn' && /Wert 9 sollten fachlich geklärt/.test(unknownExternal.detail),
  unknownExternal && unknownExternal.detail);

const cleanProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: [mkCase({ fallId: 'clean', hauptdiagnose: 'I214',
    behandlungen: [{ chop: '88.53', auswaerts: null }] })] },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
check('ohne auswärts-Kennzeichnung bestehen beide Strukturprüfungen',
  cleanProtocol.checks.find(x => x.id === 'external_procedures').status === 'pass' &&
  cleanProtocol.checks.find(x => x.id === 'case_merge').status === 'pass');

// --- Altersplausibilität, Geschlecht, Z38 und Wartepatienten ---
const ruleProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: [
    mkCase({ fallId: 'alt-125', hauptdiagnose: 'I214', alterJahre: 125, _admin: { alter: '125' } }),
    mkCase({ fallId: 'sex-3', hauptdiagnose: 'I214', geschlecht: null, _admin: { alter: '70', geschlecht: '3' } }),
    mkCase({ fallId: 'sex-fehlt', hauptdiagnose: 'I214', geschlecht: null, _admin: { alter: '70' } }),
    mkCase({ fallId: 'warte', hauptdiagnose: 'Z75.8', diagnosen: [{ kode: 'Z75.8' }], _admin: { alter: '70', tarif: '1' } }),
    mkCase({ fallId: 'lebend-ohne-z38', hauptdiagnose: 'P073', alterJahre: 0, diagnosen: [{ kode: 'P073' }],
      neugeborene: { vitalstatus: '0' }, _admin: { alter: '0' } }),
    mkCase({ fallId: 'tot-mit-z38', hauptdiagnose: null, alterJahre: 0, diagnosen: [{ kode: 'Z380' }],
      austrittsentscheid: '5', neugeborene: { vitalstatus: '1' }, _admin: { alter: '0' } })
  ] },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
const req = ruleProtocol.checks.find(x => x.id === 'required_fields');
const z38 = ruleProtocol.checks.find(x => x.id === 'newborn_birth_result');
const warte = ruleProtocol.checks.find(x => x.id === 'waiting_cases');
check('Geschlecht 3 wird als ungültig, nicht als fehlend gezählt',
  /1 ohne Geschlecht, 1 mit ungültigem Geschlecht/.test(req.detail), req.detail);
check('Alter 125 ist gültig im XSD-Bereich, aber unplausibel',
  /0 mit ungültigem Alter/.test(req.detail) && /1 mit Alter über 120 Jahren/.test(req.detail), req.detail);
check('Lebendgeburt ohne Z38 und Totgeburt mit Z38 werden gemeldet',
  z38 && z38.status === 'warn' && /1 Lebendgeburt\(en\) ohne Z38/.test(z38.detail) &&
  /1 Totgeburt\(en\) mit Z38/.test(z38.detail), z38 && z38.detail);
check('Wartepatienten werden ausgewiesen, inkl. fehlendem tarif 7',
  warte && warte.status === 'warn' && /^1 Austritt\(e\) mit Hauptdiagnose Z75.8/.test(warte.detail) &&
  /davon 1 ohne tarif 7/.test(warte.detail), warte && warte.detail);

const softProtocol = await Q.buildQualityProtocol({
  file: null,
  parsed: { meta: parsed.meta, cases: [
    mkCase({ fallId: 'nur-alt', hauptdiagnose: 'I214', alterJahre: 125, _admin: { alter: '125' } })] },
  results: [], indicators, caseRowsByIndicator: {},
  engineVersion: E.ENGINE_VERSION, methodMeta: demo.meta
});
check('unplausibles Alter allein ergibt Warnung statt Durchfall',
  softProtocol.checks.find(x => x.id === 'required_fields').status === 'warn',
  softProtocol.checks.find(x => x.id === 'required_fields').status);
check('konsistente Geburtskodierung besteht die Z38-Prüfung',
  sbProtocol.checks.find(x => x.id === 'newborn_birth_result').status === 'pass');

// --- Gruppierung der Prüfungen ---
check('jede Prüfung ist genau einer bekannten Gruppe zugeordnet',
  protocol.checks.every(c => Q.CHECK_GROUPS.indexOf(c.group) !== -1),
  protocol.checks.filter(c => Q.CHECK_GROUPS.indexOf(c.group) === -1).map(c => c.id));
check('Kodierregeln fassen die handbuchbasierten Prüfungen zusammen',
  ['stillbirths', 'newborn_birth_result', 'waiting_cases', 'external_procedures', 'case_merge']
    .every(id => Q.groupForCheck(id) === 'Kodierregeln'));
check('Indikatorprüfungen landen in der Gruppe Indikatoren',
  protocol.checks.filter(c => /^(trace|adjustment|power)_/.test(c.id)).every(c => c.group === 'Indikatoren'));
check('Datei-Hash steht unter Nachweis', Q.groupForCheck('file_hash') === 'Nachweis');
// Die Nachweis-ID hängt am Prüfinhalt, nicht an der Gliederung: der kanonische
// Datensatz enthält weder group noch die Anzeigereihenfolge.
const canonicalChecks = protocol.checks
  .map(c => ({ id: c.id, status: c.status, blocking: c.blocking, detail: c.detail }))
  .sort((a, b) => (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)));
const rebuiltId = 'CHIQI-' + (await Q.sha256Text(Q.stableStringify({
  schemaVersion: 1,
  source: protocol.source,
  software: protocol.software,
  method: protocol.method,
  checks: canonicalChecks,
  verdict: protocol.verdict
}))).slice(0, 16).toUpperCase();
check('Nachweis-ID reproduzierbar ohne Gruppierungsinformation',
  rebuiltId === protocol.certificateId, { rebuiltId, ist: protocol.certificateId });
check('Gruppen bleiben für die Anzeige erhalten',
  protocol.checks.every(c => typeof c.group === 'string' && c.group.length > 0));
const groupSeq = protocol.checks.map(c => Q.CHECK_GROUPS.indexOf(c.group));
check('Prüfungen sind nach Gruppe sortiert ausgegeben',
  groupSeq.every((v, i) => i === 0 || v >= groupSeq[i - 1]), protocol.checks.map(c => c.group));
check('Zeitbasis der Methodik zählt zu den Indikatoren',
  Q.groupForCheck('method_vintage') === 'Indikatoren');
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
const sourceParser = fs.readFileSync(path.join(dir, '..', '..', 'spiges', 'spiges_parser.js'), 'utf8');
const deployParser = fs.readFileSync(path.join(dir, 'spiges_parser.js'), 'utf8');
check('Parser-Quell- und Deploykopie sind identisch', sourceParser === deployParser);

console.log(failed === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + failed + ' TEST(S) FEHLGESCHLAGEN');
process.exit(failed === 0 ? 0 : 1);
