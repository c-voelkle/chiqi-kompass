# CH-IQI Kompass: Testanleitung für Filter und Spitalgruppen

**Stand:** 11. Oktober 2026.
**Gültig für:** die veröffentlichte Fassung `43299009`.  
**Anwendung:** [CH-IQI Kompass](https://c-voelkle.github.io/chiqi-kompass/).  
**Dauer:** etwa 15–25 Minuten.

**Ziel:** Eigene Patientenfilter, indikatorbezogene Fallspur und den Vergleich mit
selbst definierten Spitalgruppen anhand der verfügbaren Merkmale prüfen.

Die SpiGes-Datei und die Falldaten werden lokal im Browser verarbeitet. Für den
Wechsel ins Cockpit werden aggregierte Kennzahlen im aktuellen Browser-Tab
bereitgestellt.

## Voraussetzungen

- Aktueller Browser und eigene SpiGes-Datendatei (XML, Format 1.4–1.6; kein
  Identifikatoren-File).
- Für einen Vergleich desselben Datenjahres: vollständige Austritte 2024 und
  dieselbe Betriebsabgrenzung wie in der BAG-Publikation, einschliesslich aller
  zugehörigen Standorte.
- Zum Kennenlernen ist auch das in der Anwendung verlinkte synthetische Testfile
  geeignet. Es dient keinem fachlichen Abgleich mit dem eigenen Spital.

## 1. Eigene Patientenfilter prüfen

1. Tab **Unterjährige Auswertung** öffnen und die SpiGes-XML einlesen.
2. Warten, bis **Auswertung, Fallspur und Methodennachweis abgeschlossen** erscheint.
   Im Importprotokoll Zeitraum, Fallzahl und Warnungen prüfen.
3. Zunächst alle Patientenfilter auf **alle** lassen. Fallzahl und beobachtete Rate
   der gewünschten Indikatoren als Ausgangswerte festhalten.
4. Nacheinander eine verfügbare **Altersklasse**, **Geschlecht**, **Eintrittsart**
   und **Aufenthalt vor Eintritt** auswählen. Prüfen, ob die Auswahlbeschreibung,
   Anzahl der Austritte und Indikatorkennzahlen zur Auswahl passen.
5. Zwei oder mehr Merkmale kombinieren, beispielsweise Altersklasse 65–84 und
   Eintrittsart Notfall. Jeder ausgewählte Fall erfüllt alle gewählten Bedingungen.
   Leere Indikatorgruppen sind möglich.
6. **PDF-Bericht** öffnen und prüfen, ob die gewählte Patientengruppe angegeben ist.
7. Den Filter zurücksetzen. Die Ausgangswerte erscheinen wieder.

**Erwartete Grenzen:** Aufenthalt vor Eintritt beschreibt den Herkunftsort
(z. B. Zuhause oder anderes Spital), keinen allgemeinen Eintrittsgrund.
Fallspur und QM-/PDCA-Workbench beziehen sich weiterhin auf alle importierten
Fälle. Beim Resektionsanteil G5_03 steht für frei gefilterte Patientengruppen
keine passende nationale Anteilsreferenz zur Verfügung.

## 2. Altersgruppe mit BAG-Werten vergleichen

1. Nur eine Altersklasse wählen, beispielsweise **65–84 J.**; alle anderen
   Patientenfilter auf **alle** stellen.
2. **Mit BAG-Verlauf vergleichen** wählen.
3. Im Cockpit das passende Spital auf **Betriebsebene** auswählen und
   **Institution bestätigen**.
4. Einen verfügbaren Mortalitätsindikator wählen. Bei 65–84 Jahren sind dies
   A.1.4.M (Herzinfarkt), B.1.4.M (Schlaganfall) und D.1.5.M (Pneumonie).
5. Prüfen, ob die Altersgruppe und der passende BAG-Teilindikator angezeigt werden.
   **Im Funnel-Plot zeigen** wählen, um den eigenen vorläufigen Wert einzuordnen.

**Erwartete Grenze:** Mit Geschlecht, Eintrittsart, Aufenthalt vor Eintritt oder
einer Kombination dieser Merkmale ist die BAG-Übergabe gesperrt. Dafür gibt es
in der aktuellen Umsetzung keine entsprechenden öffentlichen Vergleichsgruppen.
Für G5_03 fehlt die Altersgruppen-Zuordnung.

Eigene unterjährige Werte werden mit historischen BAG-Werten verglichen.
Auch bei identischer Altersklasse kann die Methodik der erwarteten Rate abweichen;
bei Herzinfarkt mit Altersfilter ist die erwartete Rate kein gleichartiger Abgleich.
Ein Filtertest bestätigt deshalb nicht automatisch die fachliche Übereinstimmung.

## 3. Spitalgruppen im Cockpit prüfen

Dieser Teil funktioniert auch ohne SpiGes-Datei.

1. **Cockpit** öffnen und Ebene (Betrieb oder Standort), eigene Institution,
   Indikator und Vergleichsperiode wählen.
2. Im Bereich **Vergleichsgruppe** zunächst nur den **Spitaltyp** einschränken,
   beispielsweise auf Grundversorgung.
3. **Region** (Grossregion oder Kanton) und **Grösse** ergänzen. Grösse kann nach
   stationären Austritten oder nach Akutbetten gewählt werden. Alle gewählten
   Merkmale wirken gemeinsam.
4. Prüfen, ob die angezeigte Gruppengrösse und die Punkte im **Funnel-Plot** wechseln.
   Die Referenz ist nun als **Gruppenwert** bezeichnet.
5. Prüfen, ob die eigene Institution sichtbar bleibt und ob ihre Zugehörigkeit
   zur gewählten Gruppe korrekt angezeigt wird.
6. Optional Rechtsform, Aus-/Weiterbildung oder Merkmale des Leistungsprofils
   ergänzen. Bei **Fallzahl im Indikator** prüfen, dass sich die Klassengrenzen
   beim Wechsel des Indikators anpassen.
7. **Indikatorbericht** öffnen und die Beschreibung der Vergleichsgruppe
   im Bericht prüfen.
8. **Alle Betriebe** wählen: Die Gruppeneinschränkung wird aufgehoben.

### Beispiel: gleiche soH-Werte, anderer Vergleichsrahmen

Für die Solothurner Spitäler AG, A.1.1.M (Herzinfarkt) und BAG 2024 bleibt
der eigene Punkt bei **508 Fällen und 6,1 %**. Vergleichen Sie zwei Gruppen:

- **Grundversorgung / Zürich:** vier Mitglieder; Gruppenwert 1,07 %.
  Die soH gehört nicht zur Gruppe und liegt oberhalb der 99,8%-Grenze.
- **Ab 20'000 stationären Austritten und mit Notfallstation:** 20 Mitglieder;
  Gruppenwert 4,54 %. Die soH gehört zur Gruppe und liegt innerhalb der 95%-Grenzen.

Gruppenwert und Kontrollgrenzen verändern die Einordnung, während die Werte
der soH gleich bleiben. Die Achsen passen sich automatisch an die dargestellten
Betriebe an. Das O/E-Radar behält seine bisherige Referenz.

**Erwartete Grenzen:**

- Die Auswahl bildet Gruppen aus den angebotenen Merkmalsklassen. Einzelne
  Spitäler lassen sich derzeit nicht als beliebige Namensliste zusammenstellen.
- Referenzlinie und Kontrollgrenzen im Funnel beziehen sich auf den
  fallzahlgewichteten **Rohwert** der Gruppe. Das O/E-Radar behält seine bisherige
  Referenz; die Gruppenauswahl erzeugt keine neue Risikoadjustierung.
- Strukturmerkmale stammen aus 2024, Akutbetten und CMI nötigenfalls aus 2023.
  Standorte übernehmen die Merkmale ihres Betriebs.
- Kleine oder leere Gruppen sind möglich und werden angezeigt.
- Für den eigenen übernommenen Wert zuerst **Im Funnel-Plot zeigen** wählen.
  Ein Altersfilter wird über den passenden BAG-Teilindikator berücksichtigt;
  weitere Patientenfilter der Vergleichsspitäler stehen nicht zur Verfügung.

## 4. Einzelfallansicht und erneutes Einlesen

- In der unterjährigen Auswertung die indikatorbezogene Fallspur öffnen.
  Ein-/Ausschluss, Outcome und Erwartungsbeitrag exemplarisch prüfen.
  Die Ansicht zeigt höchstens 200 Zeilen und ist kein vollständiges Falldossier.
- Optional eine zweite SpiGes-Datei einlesen. Die Auswertung zeigt anschliessend
  Zeitraum und Kennzahlen der neuen Datei. **Die neue Datei ersetzt die aktuelle Auswertung.**
  Eine gespeicherte Historie mehrerer Uploadstände oder ein automatisches
  Zusammenführen von Dateien ist noch nicht vorhanden.

## Rückmeldung

Bitte mitteilen:

- welche Filterkombinationen und Spitalgruppen getestet wurden;
- ob Auswahl, Fallzahlen, Darstellung und Berichte verständlich und plausibel waren;
- bei Auffälligkeiten: Indikator, Zeitraum, Filter und Beschreibung des Problems;
- welche noch offenen Funktionen für den nächsten Schritt am wichtigsten sind.

Bitte keine SpiGes-Datei, Fallnummern oder sonstigen Patientendaten mitsenden.
**Kontakt:** curtis.voelkle@gmail.com

## Separates Pilottestpaket: noch nicht veröffentlicht

Der automatische **Abgleich mit BAG 2024**, die Einordnung von Abweichungen und
**Feedback-Datei herunterladen** sind zum Stand dieser Anleitung in
[Pull Request #8](https://github.com/c-voelkle/chiqi-kompass/pull/8) enthalten.
Die dortige `TESTANLEITUNG_PILOT.md` setzt die Zusammenführung und erfolgreiche
Veröffentlichung dieses Pakets voraus. Diese Schritte gehören noch nicht zum
hier beschriebenen veröffentlichten Testablauf.
