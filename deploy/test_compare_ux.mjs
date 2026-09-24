import assert from 'node:assert/strict';
import fs from 'node:fs';

const cockpit = fs.readFileSync(new URL('./cockpit.html', import.meta.url), 'utf8');
const chiqi = fs.readFileSync(new URL('./chiqi/index.html', import.meta.url), 'utf8');

console.log('Test 1: fokussierter Vergleichsmodus');
assert.match(chiqi, />Mit BAG-Verlauf vergleichen<\/button>/);
assert.doesNotMatch(chiqi, />Im Cockpit vergleichen<\/button>/);
assert.match(cockpit, /id="comparison-slot"/);
assert.match(cockpit, /data-testid="comparison-mode"/);
assert.match(cockpit, /Unterjährige Auswertung übernommen:/);
assert.match(cockpit, /Gesamtes Cockpit erkunden/);
assert.match(cockpit, /explorer\.open=false/);
console.log('  ✔ Vergleich ist als eigener, fokussierter Modus angelegt');

console.log('Test 2: getrennte Steuerungen');
assert.match(cockpit, /data-testid="comparison-institution"/);
assert.match(cockpit, /data-testid="comparison-indicator"/);
assert.match(cockpit, /ownMappingForCockpit\(\$\('own-ind'\)\.value\)/);
assert.match(cockpit, /\$\('f-ind'\)\.addEventListener\('change',renderFunnel\)/);
assert.match(cockpit, /\$\('r-view'\)\.addEventListener\('change',renderRadar\)/);
assert.doesNotMatch(cockpit, /\$\('r-view'\)\.addEventListener\('change',renderOwnHistory\)/);
assert.match(cockpit, /Diese Auswahl wirkt nur auf die Radartabelle\./);
console.log('  ✔ Radar, Funnel und unterjähriger Vergleich sind entkoppelt');

console.log('Test 2b: O/E und Funnel werden als verschiedene Fragen erklärt');
assert.match(cockpit, /Zwei Ansichten, zwei verschiedene Fragen/);
assert.match(cockpit, /Vergleichsmassstab: erwartete Ereignisse der gewählten Institution/);
assert.match(cockpit, /Vergleichsmassstab: beobachteter Schweizer Gesamtwert, ohne Risikoadjustierung/);
assert.match(cockpit, /id="funnel-reading"/);
assert.match(cockpit, /Das ist kein Rechenfehler/);
assert.match(cockpit, /function renderFunnelReading\(radar,point,p0\)/);
assert.match(cockpit, /Diese Kombination ist möglich und kein Rechenfehler/);
assert.match(cockpit, /Ein abweichendes Patientengut kann diesen Unterschied erklären/);
console.log('  ✔ Vergleichsmassstäbe und gemeinsame Einordnung sind sichtbar');

console.log('Test 3: Pilotumfang und Datenschutz');
for (const pair of [
  ["A1_01", "A.1.1.M"],
  ["B1_01", "B.1.1.M"],
  ["D1_01", "D.1.1.M"],
  ["G5_03", "G.5.3.P"]
]) {
  assert.match(cockpit, new RegExp(`sourceId:'${pair[0]}',cockpitCode:'${pair[1].replaceAll('.', '\\.')}'`));
}
assert.match(chiqi, /return \{ id: r\.id, n: r\.n, O: r\.O, E: r\.E, smr: r\.smr \};/);
assert.doesNotMatch(chiqi, /sessionStorage\.setItem\([^;]*(caseId|fallId|diagnos)/i);
console.log('  ✔ Vier aggregierte Pilotindikatoren ohne Falldaten werden übertragen');

console.log('Test 4: methodisch getrennte Vergleichspunkte');
assert.match(cockpit, /ownHistoryChart=new Chart\([^]*?\{type:'bar'/);
assert.match(cockpit, /Die drei Säulen sind getrennte Vergleichspunkte, keine fortlaufende Zeitreihe/);
assert.match(cockpit, /currentRate=current\.n>0\?current\.O\/current\.n\*100:null/);
assert.match(cockpit, /currentExpected=current\.n>0&&current\.E!==null\?current\.E\/current\.n\*100:null/);
console.log('  ✔ Baseline, 2024 und unterjähriger Wert werden als getrennte Säulen gezeigt');

console.log('\nALLE TESTS BESTANDEN');
