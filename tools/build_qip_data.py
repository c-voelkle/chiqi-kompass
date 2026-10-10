"""Bettet die BAG-Publikation QIP 2024 kompakt in deploy/cockpit.html ein.

Aufruf (Repo-Wurzel):
    python3 tools/build_qip_data.py <qip24_data.json>

Eingabe ist der Datenexport in der ursprünglichen Form
{codes, betrieb: {insts, rows}, standort: {insts, rows}, meta}, Zeilen
[inst, code, Werte...]. Geschrieben wird der Block #qip-data im Format 2:

- Der Indikatorcode steht als Index in `codes`, nicht als Text in jeder
  Zeile; das Cockpit setzt ihn beim Laden wieder ein.
- Zeilen ohne jeden Wert (alle Raten, SMR und Fallzahlen leer oder 0)
  entfallen. Das Cockpit liest einen fehlenden Wert wie eine Fallzahl 0:
  Radar, Funnel, Trends und Fallzahl-Monitor überspringen solche Zeilen
  ohnehin. Immer erhalten bleiben die Zeilen der Vergleichsgruppen und des
  CH-Werts (Referenz) sowie Zähler-Indikatoren mit verifiziertem Nenner
  (KEEP_CODES), deren Zähler 0 bei Nenner > 0 ein gültiger Punkt ist.
- Ganzzahlige Werte werden ohne «.0» geschrieben.

Die Werte selbst bleiben unverändert; test_indicator_report.mjs vergleicht
die eingebetteten Daten mit dem Export.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COCKPIT = ROOT / 'deploy' / 'cockpit.html'
BLOCK = re.compile(r'(<script type="application/json" id="qip-data">)(.*?)(</script>)', re.S)
# Wie VERIFIED_DENOMINATORS in cockpit.html: publizierte Fallzahl = Zähler.
KEEP_CODES = {'G.5.3.P'}


def empty(row):
    return all(v is None or v == 0 for v in row[2:])


def num(v):
    return int(v) if isinstance(v, float) and v.is_integer() else v


def compact(data):
    index = {c['c']: i for i, c in enumerate(data['codes'])}
    out = {'format': 2, 'codes': data['codes'], 'meta': data['meta']}
    dropped = 0
    for level in ('betrieb', 'standort'):
        insts, rows = data[level]['insts'], []
        for r in data[level]['rows']:
            keep = insts[r[0]]['a'] or r[1] in KEEP_CODES or not empty(r)
            if keep:
                rows.append([r[0], index[r[1]]] + [num(v) for v in r[2:]])
            else:
                dropped += 1
        out[level] = {'insts': insts, 'rows': rows}
    return out, dropped


def main(src):
    data = json.loads(Path(src).read_text(encoding='utf-8'))
    if data.get('format') == 2:
        raise SystemExit('Eingabe ist bereits kompakt; bitte den ursprünglichen Export verwenden.')
    out, dropped = compact(data)
    payload = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    if '</' in payload:
        raise SystemExit('Daten enthalten «</» und würden den Script-Block beenden.')
    html = COCKPIT.read_text(encoding='utf-8')
    if not BLOCK.search(html):
        raise SystemExit('Block #qip-data nicht gefunden in ' + str(COCKPIT))
    before = len(html.encode())
    html = BLOCK.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1)
    COCKPIT.write_text(html, encoding='utf-8')
    kept = sum(len(out[lv]['rows']) for lv in ('betrieb', 'standort'))
    print(f'{kept} Zeilen eingebettet, {dropped} leere entfernt; '
          f'cockpit.html {before / 1e6:.1f} MB -> {len(html.encode()) / 1e6:.1f} MB')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
