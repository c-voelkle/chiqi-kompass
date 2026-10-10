# Unterjähriger Resektionsanteil G5_03

Lokal implementiert am 24. September 2026. Kein Online-Deployment.

## Methodik und Datenbasis

- BAG CH-IQI v5.5 / QIP 2024: `G.5.3.P`, Anteil brusterhaltende Resektionen bei Brustkrebs.
- Nenner: `G.5.2.F`; Zähler: `G.5.3.F`. Verwendet werden die unverändert extrahierten fCHIQI-Filter aus `chiqi-engine/chiqi_definitions_v55.json`, nicht eine eigene vereinfachte CHOP-Liste.
- Weibliches Geschlecht, C50/D05 in sämtlichen Diagnosen, passende Resektions-CHOPs. Nicht brusterhaltende Eingriffe im selben Fall schliessen diesen aus dem Zähler aus. Nur ausgetretene Fälle; Fallzählung, keine Operations- oder Patientinnenzählung.
- Nationale Referenz 2024: 7’638 / 10’047, publizierter Anteil 76,02269 %. Quelle: `RefCHData_2024_V5-5_CHIQI_G5_03_P_CH.txt`. E = n × Referenzanteil; **keine Risikoadjustierung und kein SMR**.
- Prüfhinweise richtungsneutral; mindestens n=10, E=3 und n−E=3 für den approximativen z-Test. Kleine Fallzahlen bleiben deskriptiv, fehlende Referenz sperrt Inferenz. Die CH-Referenz ist kein Qualitätsziel.
- Der Austrittsentscheid lebend/verstorben bestimmt diesen Zähler nicht. Fehlende Pflichtfelder bleiben im allgemeinen Import-/Qualitätsprotokoll sichtbar. Fehlende Diagnosen/CHOPs können eine unvollständige Kodierung nicht von tatsächlichem Fehlen unterscheiden.
- Definition und Referenzjahr bleiben 2024. Neuere Datenjahre sind vorläufig; keine Gleichsetzung mit einer freigegebenen aktuellen BAG-Jahresauswertung, DKG-Kennzahl oder realen Hirslanden-Validierung.

Offizielle Quellen: [BAG QIP-2024-Daten und Spezifikationen](https://opendata.swiss/de/dataset/qualitatsindikatoren-der-schweizer-akutspitaler-2024).

## Ablauf

SpiGes-XML lokal importieren → G5_03 in der Ergebnistabelle und QM-Workbench → Fallreview/PDCA → Nachmessung mit n und O → «Mit BAG-Verlauf vergleichen» → Institution ausdrücklich bestätigen → G.5.3.P wählen. Nur aggregierte Werte werden via sessionStorage übergeben. Der Vergleich nutzt Betriebsebene, gepoolte Baseline 2019–2023 und BAG 2024; die Institution muss zum Umfang der importierten Daten passen. BAG-P-Fallzahlen sind Zähler; die Bezugszahlen werden ausdrücklich aus G.5.2.F gelesen.

Der bestehende unterjährige Druckbericht enthält den neuen Indikator und die lokale PDCA-Zusammenfassung. Der öffentliche Einzelbericht bleibt ein BAG-Bericht und enthält keine internen Daten.

## Reproduzierbarkeit / Offline

`node chiqi-engine/build_demo_subset.mjs` generiert alle vier Definitionen aus den versionierten Quellen und synchronisiert Definitions- und Enginekopie nach deploy. Auch der Python-Gesamtextraktor ruft diesen Builder auf. Die ersten drei Definitionen wurden beim Umbau auf inhaltliche Identität geprüft.

Chart.js 4.5.1 liegt unverändert in `deploy/vendor/chart.umd.min.js` mit MIT-Lizenz. SHA-256: `48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a`. Bezug: `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js`. Damit benötigt das vollständig lokal vorliegende deploy-Paket für den getesteten Ablauf keine Netzwerkverbindung. Dies ist keine automatische Offline-Installation oder Cache-Garantie für die öffentlich gehostete URL.

## Tests

```text
node deploy/chiqi/test_breast_indicator.mjs
node deploy/chiqi/test_qm_workbench.mjs
node chiqi-engine/test_chiqi_engine.mjs
node spiges/test_spiges_parser.mjs
node deploy/test_compare_ux.mjs
node deploy/test_indicator_report.mjs
node deploy/test_breast_workflow_browser.mjs
node deploy/test_indicator_report_browser.mjs
```

Die Browsertests benötigen Chrome und Playwright; alternativ ist `CHIQI_PLAYWRIGHT_PATH` auf die installierte Bibliothek zu setzen. Der neue Ablauf arbeitet mit ausschliesslich synthetischen Daten bei deaktiviertem Netzwerk. Einschluss-/Ausschlussfälle, 47 BAG-CHOP-Präfixe, s/f-Parität, Nullfälle, Null-/Vollzähler, kleine Fallzahlen, fehlende Referenz, Fallspur, Nachmessung, Persistenzgrenzen und Source-/Deploy-Synchronität werden geprüft. Eine klinische beziehungsweise reale SpiGes-Gegenvalidierung durch Hirslanden bleibt offen.
