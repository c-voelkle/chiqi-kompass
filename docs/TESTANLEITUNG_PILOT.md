# CH-IQI Kompass: Testanleitung für Pilotspitäler

**Ziel:** Prüfen, ob der CH-IQI Kompass aus Ihren eigenen SpiGes-Daten dieselben Werte
berechnet wie die BAG-Publikation QIP 2024. Dafür lesen Sie die SpiGes-Datei des
**ganzen Jahres 2024** ein und vergleichen die Ergebnisse mit den publizierten Werten
Ihres Spitals.

**Datenschutz:** Die SpiGes-Datei wird ausschliesslich lokal in Ihrem Browser
verarbeitet. Es werden keine Daten an einen Server übertragen; die Seite funktioniert
auch offline. Die Feedback-Datei, die Sie uns am Ende schicken, enthält nur aggregierte
Kennzahlen (siehe unten), keine Fall-IDs, Diagnosen oder Patientendaten.

Dauer: etwa 15 Minuten.

## Voraussetzungen

- SpiGes-Datendatei (XML, Format 1.4–1.6) mit den Austritten **1.1.–31.12.2024**
  (nicht das Identifikatoren-File).
- Aktueller Browser (Chrome, Edge, Firefox oder Safari).
- https://c-voelkle.github.io/chiqi-kompass/

## Ablauf

1. **Unterjährige Auswertung öffnen:** Tab «Unterjährige Auswertung».
2. **Datei einlesen:** SpiGes-XML in das Feld ziehen oder anklicken. Warten, bis
   «Auswertung, Fallspur und Methodennachweis abgeschlossen» erscheint.
3. **Importprotokoll ansehen:** Aufklappen und kurz prüfen: Anzahl Fälle, Austritte
   nach Quartal (alle vier Quartale 2024 vorhanden?), Warnungen.
4. **Kein Patientenfilter:** Alle Filter auf «alle» lassen.
5. **Mit BAG-Verlauf vergleichen:** Die Ansicht wechselt ins Cockpit.
6. **Institution bestätigen:** Ihr Spital (Betrieb) aus der Liste wählen und
   «Institution bestätigen».
7. **Abgleich mit BAG 2024 prüfen:** Die Tabelle zeigt pro Indikator Fallzahl, Rate
   und erwartete Rate, jeweils «eigen» und «BAG», und eine Einordnung:
   - **übereinstimmend:** gleiche Fallzahl; Raten gleich bis auf Rundung.
   - **kleine Abweichung:** Fallzahl höchstens 2% und Raten höchstens 0.5
     Prozentpunkte daneben.
   - **deutliche Abweichung:** alles darüber.
8. **Feedback-Datei herunterladen** und uns per E-Mail schicken (siehe unten).

Optional: Schritt 4 mit einer **Altersklasse** wiederholen (z. B. 65–84 J.). Das
Cockpit vergleicht dann mit den BAG-Teilindikatoren dieser Altersgruppe.

## Was die Feedback-Datei enthält

`chiqi-kompass-abgleich-JJJJ-MM-TT.json`:

- Name Ihres Spitals, wie er in der BAG-Publikation steht;
- pro Indikator: Fallzahl, beobachtete und erwartete Ereignisse, Raten und SMR, eigen
  und BAG, mit Differenz und Einordnung;
- Zeitraum (Jahr, Quartale), Anzahl Fälle/Austritte, Anzahl Importwarnungen,
  Hinweis auf möglichen Kodierverzug;
- Versionen von Engine, Indikatordefinitionen, Parser und SpiGes-Format.

Die Datei ist lesbarer Text; Sie können sie vor dem Versand öffnen und prüfen.

## Bitte zusätzlich zurückmelden

- Bei **deutlichen Abweichungen**: Ihre Vermutung zur Ursache (z. B. andere
  Datenlieferung als die BFS-Fassung, nachträgliche Korrekturen, Fälle anderer
  Standorte).
- Ob der Ablauf verständlich war und wo Sie gestockt haben.
- Fehlermeldungen oder Warnungen im Importprotokoll (Text kopieren, keine Fallnummern).

**Kontakt:** curtis.voelkle@gmail.com

## Bekannte Grenzen

- Herzinfarkt (A1_01) wird mit dem differenzierten Risikomodell gerechnet; die
  erwartete Rate wird deshalb mit A.1.1.MrG verglichen. Mit Altersfilter ist die
  erwartete Rate dort nicht vergleichbar.
- Die eigene Datei muss denselben Betrieb abdecken wie die BAG-Publikation (alle
  Standorte des Betriebs).
- Der Abgleich ist nur mit Austritten aus 2024 möglich; unterjährige Daten 2026 werden
  wie bisher als vorläufiger Wert gezeigt.
