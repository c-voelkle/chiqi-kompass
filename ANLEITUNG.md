# CH-IQI Kompass: Struktur und Veröffentlichung

Die App liegt ausschliesslich in `deploy/`: statische Seiten ohne Build-Schritt.
Veröffentlicht wird sie automatisch: Jeder Push auf `main`, der `deploy/` ändert,
startet den Workflow `.github/workflows/pages.yml`. Er prüft die Design-Regeln und
stellt `deploy/` ohne Testdateien (`*.mjs`) auf GitHub Pages bereit:
https://c-voelkle.github.io/chiqi-kompass/ (nach 1–2 Minuten aktuell).

Voraussetzung (einmalig): Settings → Pages → Source: «GitHub Actions». Ein manueller
Lauf ist unter Actions → Pages → «Run workflow» möglich.

## Struktur (`deploy/`)

| Pfad | Rolle |
|---|---|
| `index.html` | **Shell**: Kopfleiste mit Tabs, lädt die Unterseiten im Frame. Standardmässig das Cockpit. |
| `cockpit.html` | Cockpit QIP 2024 mit eingebetteten BAG-Daten (`#qip-data`, kompaktes Format 2 aus `tools/build_qip_data.py`) |
| `kzp24_attributes.js` | Spitalmerkmale (Typ, Kanton, Rechtsform, Austritte, Notfall/IPS, Aus- und Weiterbildung, Akutbetten, CMI) aus den BAG-Kennzahlen der Schweizer Spitäler 2024 und der Zeitreihe; erzeugt mit `tools/build_kzp_attributes.py` |
| `hospital_groups.js` | Vergleichsgruppen im Cockpit (Struktur: Spitaltyp, Region, Grösse, Rechtsform, Aus- und Weiterbildung; Leistungsprofil: Notfall/IPS, Herzkatheter, CMI, Fallzahl im Indikator) |
| `chiqi/index.html` | Unterjährige Indikator-Auswertung (Beta) mit SpiGes-Import, Engine und lokaler QM-Workbench |
| `chiqi/patient_filter.js` | Patientengruppen-Filter (Altersklasse, Geschlecht, Eintrittsart, Aufenthalt vor Eintritt) |
| `chiqi/qm_workbench.js` | Fallreview, PDCA und automatisch erzeugter Datenqualitäts-/Methodennachweis |
| `ui/` | Gemeinsames Design-System: `kompass.css`, `kompass-ui.js`, `favicon.svg`, `gallery.html`. Siehe `docs/DESIGN_LANGUAGE.md`. |
| `chiqi/ui/` | Identische Kopie von `ui/`, damit `chiqi/` auch allein läuft |
| `vendor/` | Chart.js (lokal, offline) |

Teilbare Direktlinks: `…/#cockpit`, `…/#chiqi`. Unterseiten funktionieren auch
standalone (zeigen dann einen Zurück-Link) und offline über `file://`.

## Unterjährigen BAG-Vergleich prüfen

1. `…/#chiqi` öffnen und eine SpiGes-XML einlesen.
2. Optional eine Altersklasse filtern (nur dafür publiziert das BAG Teilindikatoren).
3. **Mit BAG-Verlauf vergleichen** wählen und im Cockpit die Institution bestätigen.
4. Indikator wählen: Baseline 2019–2023, QIP 2024 und der unterjährige Wert erscheinen
   als getrennte Vergleichspunkte. **Im Funnel-Plot zeigen** ordnet den unterjährigen
   Wert gegen den CH-Wert oder eine Vergleichsgruppe ein.

## Funktionsstand und Filtertests

- [Funktionsstand für Pilottests](docs/PILOT_FUNKTIONSSTAND.md): verfügbare Funktionen,
  Ausbaupunkte, Datengrenzen und Veröffentlichungsstatus.
- [Testanleitung für Filter und Spitalgruppen](docs/TESTANLEITUNG_FILTER_GRUPPEN.md):
  Tests der bereits veröffentlichten Funktionen.

## Pilottest mit Echtdaten

Anleitung für die Pilotspitäler: `docs/TESTANLEITUNG_PILOT.md`. Mit einer SpiGes-Datei
des ganzen Jahres 2024 zeigt das Cockpit nach der Institutionsbestätigung den
**Abgleich mit BAG 2024** und bietet eine **Feedback-Datei** (JSON, nur aggregierte
Kennzahlen, Zeitraum und Versionen) zum Download an.

## Pflege

- Prüfungen vor einem Commit: siehe `AGENTS.md` (laufen auch in der CI).
- Engine, Parser und Indikatordefinitionen werden ausserhalb gepflegt
  (`../chiqi-engine/`, `../spiges/`) und nach `deploy/chiqi/` kopiert:

      cp ../spiges/spiges_parser.js deploy/chiqi/
      cp ../chiqi-engine/chiqi_engine.js ../chiqi-engine/chiqi_demo_defs.js deploy/chiqi/

- Nach Änderungen am Design-System:
  `cp deploy/ui/kompass.css deploy/ui/kompass-ui.js deploy/ui/favicon.svg deploy/chiqi/ui/`
- BAG-Daten (QIP) neu einbetten, kompakt (Format 2):
  `python3 tools/build_qip_data.py <qip24_data.json>`
- Spitalmerkmale neu erzeugen:
  `python3 tools/build_kzp_attributes.py <kzp24_data.xlsx> <kzp24_KZ_TimeSerie.xlsx>`

BAG-Quelldateien und `chiqi_definitions_v55.json` gehören nicht ins Repo; die App
braucht nur `chiqi_demo_defs.js`. (Nutzung der BAG-Spezifikationen mit Quellenangabe
ist seit Juli 2026 schriftlich freigegeben; die grossen Quelldateien bleiben trotzdem
draussen, um das Repo schlank zu halten.)
