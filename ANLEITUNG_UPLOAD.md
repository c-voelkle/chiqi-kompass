# CH-IQI Kompass — Deploy-Ordner (GitHub Pages)

Dieser Ordner ist **self-contained**: Er kann 1:1 als Inhalt des GitHub-Repos
(bzw. des Pages-Wurzelverzeichnisses) hochgeladen werden. Alle Pfade sind
relativ innerhalb dieses Ordners — nichts verweist nach aussen.

## Struktur

| Pfad | Seite |
|---|---|
| `index.html` | CH-IQI Cockpit (BAG-Publikationsdaten QIP 2024) |
| `spiges/index.html` | SpiGes-Import-Demo (Beta) + Parser + Testdatei |
| `chiqi/index.html` | Unterjährige Indikator-Auswertung (Beta) + Engine |

Die drei Seiten sind über die dunkle Navigationsleiste oben verlinkt.

## Upload auf github.com (manuell)

1. Im Repo auf **Add file → Upload files**.
2. Den **gesamten Inhalt** dieses Ordners hineinziehen — inklusive der
   Unterordner `spiges/` und `chiqi/` (Drag-and-drop des ganzen Ordnerinhalts
   erhält die Unterordner; einzelne Dateien flach hochladen zerstört die Pfade).
3. Commit. Fertig — keine Build-Schritte nötig.

**Wichtig:** Ordnerstruktur nicht verändern und Dateien nicht umbenennen.
`spiges_parser.js` liegt bewusst doppelt vor (in `spiges/` und `chiqi/`),
damit jeder Unterordner für sich funktioniert.

## Quellcode-Hinweis

Die Originale werden ausserhalb dieses Ordners gepflegt
(`../spiges/`, `../chiqi-engine/` mit Tests und Build-Skript).
Nach Änderungen dort die Dateien hierher kopieren:

    cp spiges/spiges_parser.js deploy/spiges/  &&  cp spiges/spiges_parser.js deploy/chiqi/
    cp chiqi-engine/chiqi_engine.js chiqi-engine/chiqi_demo_defs.js deploy/chiqi/

Die BAG-Quelldateien (SQL-Strings, Referenzdaten, PDF-Manual) und
`chiqi_definitions_v52.json` gehören **nicht** in dieses Verzeichnis
(Nutzungsbedingungen beim BAG angefragt); die Demos brauchen nur
`chiqi_demo_defs.js`.
