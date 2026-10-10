# CH-IQI Kompass: Deploy-Ordner (GitHub Pages)

Self-contained: Inhalt dieses Ordners 1:1 ins Repo hochladen, keine Build-Schritte.

## Struktur (Shell-Konzept)

| Pfad | Rolle |
|---|---|
| `index.html` | **Shell**: Landingpage mit Kopfleiste/Tabs, lädt Unterseiten im Frame. Die kommunizierte URL https://c-voelkle.github.io/chiqi-kompass/ zeigt weiterhin standardmässig das Cockpit. |
| `cockpit.html` | Cockpit QIP 2024 (bisheriger Inhalt der index.html) |
| `spiges/index.html` | SpiGes-Import-Demo (Beta) + Parser + Testdatei |
| `kzp24_attributes.js` | Spitalmerkmale (Typ, Kanton, Rechtsform, Austritte) aus den BAG-Kennzahlen der Schweizer Spitäler 2024; erzeugt mit `tools/build_kzp_attributes.py` |
| `hospital_groups.js` | Vergleichsgruppen im Cockpit (Spitaltyp, Region, Grösse, Rechtsform) |
| `chiqi/index.html` | Unterjährige Indikator-Auswertung (Beta) + Engine + lokale QM-Workbench |
| `chiqi/patient_filter.js` | Patientengruppen-Filter (Altersklasse, Geschlecht, Eintrittsart, Aufenthalt vor Eintritt) für Indikatortabelle und PDF-Bericht |
| `chiqi/qm_workbench.js` | Fallreview, PDCA und automatisch erzeugter Datenqualitäts-/Methodennachweis |
| `ui/` | Gemeinsames Design-System: `kompass.css` (Tokens, Komponenten), `kompass-ui.js` (Formatierung, Signale, InfoTips, Dialoge), `favicon.svg`, `gallery.html` (Referenz). Siehe `docs/DESIGN_LANGUAGE.md`. |
| `chiqi/ui/` | Identische Kopie von `ui/`, damit `chiqi/` auch allein läuft |
| `vendor/` | Chart.js (lokal, offline) |

Teilbare Direktlinks: `…/#cockpit`, `…/#spiges`, `…/#chiqi`.
Unterseiten funktionieren auch standalone (zeigen dann einen Zurück-Link).

## Unterjährigen BAG-Vergleich prüfen

1. `…/#chiqi` öffnen und eine SpiGes-XML einlesen.
2. **Mit BAG-Verlauf vergleichen** wählen.
3. Im fokussierten Vergleichsmodus die passende Institution bestätigen.
4. A1.1, B1.1 oder D1.1 wählen. Baseline 2019–2023, QIP 2024 und der
   unterjährige Wert erscheinen als getrennte Vergleichspunkte.
5. **Gesamtes Cockpit erkunden** öffnet bei Bedarf Radar, Funnel-Plots und
   weitere Analysen. Der Radarfilter steuert nur das Radar, nicht den
   unterjährigen Vergleich.

## Upload auf github.com (manuell)

1. Falls noch vorhanden: alte `spiges_import_demo.html` im Repo löschen.
2. **Add file → Upload files**: den gesamten Inhalt dieses Ordners hineinziehen,
   inklusive Unterordner `spiges/` und `chiqi/`. Die bestehende `index.html`
   wird automatisch durch die Shell ersetzt; `cockpit.html` kommt neu dazu.
3. Commit. Nach 1–2 Minuten ist Pages aktualisiert.

**Nichts umbenennen, Struktur nicht verändern.** `spiges_parser.js` liegt
bewusst doppelt (in `spiges/` und `chiqi/`), damit jeder Ordner für sich läuft.
Dasselbe gilt für `ui/` und `chiqi/ui/`: Beide Ordner mit hochladen.

## Pflege

Quellcode wird ausserhalb gepflegt (`../spiges/`, `../chiqi-engine/`, Tests dort).
Nach Änderungen kopieren:

    cp spiges/spiges_parser.js deploy/spiges/ && cp spiges/spiges_parser.js deploy/chiqi/
    cp chiqi-engine/chiqi_engine.js chiqi-engine/chiqi_demo_defs.js deploy/chiqi/
    cp deploy/ui/kompass.css deploy/ui/kompass-ui.js deploy/ui/favicon.svg deploy/chiqi/ui/

Vor dem Upload: `node deploy/test_design_system.mjs` (Design-Regeln, siehe `AGENTS.md`).

BAG-Quelldateien und `chiqi_definitions_v55.json` gehören NICHT hierher;
die Demos brauchen nur `chiqi_demo_defs.js`. (Nutzung der BAG-Spezifikationen
mit Quellenangabe ist seit Juli 2026 schriftlich freigegeben; die grossen
Quelldateien bleiben trotzdem draussen, um das Pages-Repo schlank zu halten.)
