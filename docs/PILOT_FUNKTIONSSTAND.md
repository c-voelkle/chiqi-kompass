# CH-IQI Kompass: Funktionsstand für Pilottests

**Stand:** 10. Oktober 2026.  
**Geprüfte veröffentlichte Fassung:** [main, 43299009](https://github.com/c-voelkle/chiqi-kompass/tree/43299009c0ff6155076300e217fc335a126dec07).  
**Anwendung:** [CH-IQI Kompass](https://c-voelkle.github.io/chiqi-kompass/).

Diese Übersicht unterscheidet den veröffentlichten Funktionsumfang, weiteren Ausbau
und Grenzen der verfügbaren Vergleichsdaten. Eine technische Prüfung mit
synthetischen Daten ersetzt keine Gegenvalidierung mit den Daten eines Pilotspitals.

## Implementiert und veröffentlicht

| Wunsch / Bereich | Tatsächlicher Umfang |
|---|---|
| Einzelfallansicht | Indikatorbezogene Fallspur und Fallreview für die vier unterjährigen Indikatoren A1_01, B1_01, D1_01 und G5_03. Ein-/Ausschluss, Outcome und Erwartungsbeitrag sind nachvollziehbar; die Ansicht zeigt höchstens 200 Zeilen. Kein vollständiges klinisches Falldossier. |
| Patientenfilter für eigene Daten | Altersklasse, Geschlecht, Eintrittsart und **Aufenthalt vor Eintritt**. Die vier Merkmale lassen sich kombinieren (UND). Kennzahlen und Auswertungsbericht werden für die Auswahl neu berechnet. |
| Altersgruppen im BAG-Vergleich | Wenn ausschliesslich eine Altersklasse gewählt ist, erfolgt die Zuordnung zu passenden publizierten Altersteilindikatoren für Herzinfarkt, Schlaganfall und Pneumonie. Für G5_03 gibt es diese Zuordnung nicht. |
| Spitalgruppen | Im Cockpit kombinierbar nach Spitaltyp, Grossregion/Kanton, Grösse nach Austritten oder Akutbetten, Rechtsform, Aus-/Weiterbildung, Notfall/IPS, Herzkatheter-Leistungsprofil, CMI und Fallzahl im gewählten Indikator. |
| Gruppenvergleich | Beschränkt die Vergleichspunkte im **Funnel-Plot** und verwendet den fallzahlgewichteten Rohwert der Gruppe. Die eigene Institution bleibt sichtbar, auch wenn sie nicht zur Gruppe gehört. Das O/E-Radar behält seine bisherige Referenz. |
| Wiederholtes Einlesen | Weitere SpiGes-Dateien können nacheinander eingelesen werden. Jede neue Datei ersetzt die aktuelle Auswertung. |

**Wichtige Abgrenzungen:**

- **Aufenthalt vor Eintritt ist kein Eintrittsgrund.** Ein eigener Eintrittsgrund-Filter
  fehlt; gewünschte Bedeutung und SpiGes-Quellfeld sind noch zu klären.
- Patientenfilter wirken auf Indikatortabelle und Auswertungsbericht.
  **Fallspur und QM-/PDCA-Workbench beziehen sich weiterhin auf alle importierten Fälle.**
- Spitalgruppen entstehen aus den angebotenen Merkmalsklassen. Eine frei gepflegte
  Namensliste beliebiger einzelner Spitäler oder benannte, gespeicherte Gruppen
  sind im geprüften Stand nicht implementiert.
- Grössen- und CMI-Klassen sind Festlegungen des Kompass. Merkmale stammen aus den
  BAG-Kennzahlen 2024; Akutbetten und CMI verwenden nötigenfalls 2023.
  Standorte übernehmen die Strukturmerkmale ihres Betriebs.
- Das Herzkatheter-Merkmal beruht auf mindestens 100 publizierten Koronarkatheterfällen
  2024 und ist kein direkter Nachweis eines Herzkatheterlabors.
- Die Gruppenauswahl ist keine neue Risikoadjustierung. Der Funnel zeigt rohe Raten;
  die nationale Erwartungsberechnung wird durch die Gruppenauswahl nicht geändert.

## Geplant / weiterer Ausbau

- Dauerhaft gespeicherte Uploadstände und eine vergleichbare Zeitreihe mit mehreren
  unterjährigen Messpunkten. Die lokale Workbench hat derzeit einen Ausgangswert
  und eine manuelle Nachmessung; periodenspezifische Projekte sind kein Uploadarchiv.
- Eigener Filter nach Eintrittsgrund nach fachlicher Definition und Quellfeldprüfung.
- Falls benötigt: frei gepflegte Spitallisten, gespeicherte Gruppen und eine mit
  Patientenfiltern synchronisierte Fallspur. Diese Punkte sind **offen**, nicht zugesagt.
- Für mehrere Dateien: Umgang mit kumulativen Exporten, Überschneidungen und
  nachträglichen Kodierkorrekturen festlegen. Automatisches Zusammenführen ist
  nicht implementiert.

## Datengrenzen

**Mit der öffentlichen Vergleichsbasis nicht verfügbar:** frei kombinierbare
Patientenfilter aller Vergleichsspitäler nach Geschlecht, Eintrittsart,
Eintrittsgrund usw. Die öffentliche BAG-Publikation enthält Aggregate, keinen
allgemein zugänglichen nationalen SpiGes-Einzelfallbestand.

Die aktuelle Übergabe ins Cockpit ist deshalb mit Patientenfiltern ausser der
Altersklasse gesperrt. Auch beim Altersfilter werden nur tatsächlich passende
publizierte Teilindikatoren verwendet.

Eigene aktuelle unterjährige Werte werden gegen historische publizierte BAG-Werte
eingeordnet. Aktuelle unterjährige Werte anderer Spitäler erfordern zusätzliche
Datenlieferungen. Weitergehende Vergleiche könnten auf passenden, standardisierten
und freigegebenen Aggregaten teilnehmender Spitäler beruhen; dafür ist nicht
zwingend der vollständige nationale Rohdatenbestand erforderlich.

## Validiert: Umfang der technischen Prüfung

Code und Tests der oben genannten Fassung wurden gelesen. Die GitHub-Prüfung
[Design system, Lauf 38055974127](https://github.com/c-voelkle/chiqi-kompass/actions/runs/38055974127)
ist erfolgreich, einschliesslich Patientenfilter, Spitalgruppen, Browserabläufe
und Altersgruppenübergabe in den BAG-Funnel. Der
[Pages-Lauf 38055973987](https://github.com/c-voelkle/chiqi-kompass/actions/runs/38055973987)
hat dieselbe Fassung erfolgreich veröffentlicht.

Das belegt technische Abläufe und die geprüften synthetischen Szenarien.
Eine neue Gegenvalidierung der Filter und Spitalgruppen mit echten Pilotdaten
wurde in diesem Dokumentationsschritt nicht durchgeführt.

## Offen: zusätzliches Pilottestpaket

[Pull Request #8](https://github.com/c-voelkle/chiqi-kompass/pull/8)
enthält einen automatischen **Abgleich mit BAG 2024**, eine aggregierte
**Feedback-Datei** und `docs/TESTANLEITUNG_PILOT.md`.
Zum Prüfzeitpunkt war dieser PR offen und seine Funktionen noch nicht Teil der
veröffentlichten Fassung. Die separat heruntergeladene Testanleitung beschreibt
bereits dieses Paket. Ihre Abgleich-/Downloadschritte setzen dessen
Zusammenführung und erfolgreiche Veröffentlichung voraus.

Für die bereits veröffentlichten Filter- und Gruppentests gilt
[TESTANLEITUNG_FILTER_GRUPPEN.md](TESTANLEITUNG_FILTER_GRUPPEN.md).

## Änderungsprotokoll

- **10. Oktober 2026 – Validiert / dokumentiert:** Aktuellen GitHub-Code und erfolgreiche
  Prüf-/Veröffentlichungsläufe abgeglichen. Vorhandene Patientenfilter und
  Spitalgruppen klar von Ausbaupunkten, Datengrenzen und offenem PR #8 getrennt.
  Keine Funktion implementiert und keine neue Lieferzusage erteilt.
