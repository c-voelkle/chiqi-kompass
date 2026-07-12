# CH-IQI Kompass — Deploy-Ordner (GitHub Pages)

Self-contained: Inhalt dieses Ordners 1:1 ins Repo hochladen, keine Build-Schritte.

## Struktur (Shell-Konzept)

| Pfad | Rolle |
|---|---|
| `index.html` | **Shell** — Landingpage mit Kopfleiste/Tabs, lädt Unterseiten im Frame. Die kommunizierte URL https://c-voelkle.github.io/chiqi-kompass/ zeigt weiterhin standardmässig das Cockpit. |
| `cockpit.html` | Cockpit QIP 2024 (bisheriger Inhalt der index.html) |
| `spiges/index.html` | SpiGes-Import-Demo (Beta) + Parser + Testdatei |
| `chiqi/index.html` | Unterjährige Indikator-Auswertung (Beta) + Engine |

Teilbare Direktlinks: `…/#cockpit`, `…/#spiges`, `…/#chiqi`.
Unterseiten funktionieren auch standalone (zeigen dann einen Zurück-Link).

## Upload auf github.com (manuell)

1. Falls noch vorhanden: alte `spiges_import_demo.html` im Repo löschen.
2. **Add file → Upload files**: den gesamten Inhalt dieses Ordners hineinziehen —
   inklusive Unterordner `spiges/` und `chiqi/`. Die bestehende `index.html`
   wird automatisch durch die Shell ersetzt; `cockpit.html` kommt neu dazu.
3. Commit. Nach 1–2 Minuten ist Pages aktualisiert.

**Nichts umbenennen, Struktur nicht verändern.** `spiges_parser.js` liegt
bewusst doppelt (in `spiges/` und `chiqi/`), damit jeder Ordner für sich läuft.

## Pflege

Quellcode wird ausserhalb gepflegt (`../spiges/`, `../chiqi-engine/`, Tests dort).
Nach Änderungen kopieren:

    cp spiges/spiges_parser.js deploy/spiges/ && cp spiges/spiges_parser.js deploy/chiqi/
    cp chiqi-engine/chiqi_engine.js chiqi-engine/chiqi_demo_defs.js deploy/chiqi/

BAG-Quelldateien und `chiqi_definitions_v52.json` gehören NICHT hierher
(Nutzungsbedingungen angefragt); die Demos brauchen nur `chiqi_demo_defs.js`.
