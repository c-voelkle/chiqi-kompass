"""Baut deploy/kzp24_attributes.js aus den BAG-Kennzahlen der Schweizer Spitäler.

Aufruf (Repo-Wurzel):
    python3 tools/build_kzp_attributes.py <kzp24_data.xlsx>

Quelle: BAG, Kennzahlen der Schweizer Spitäler 2024 (kzp24_data.xlsx, Blatt
KZ2024_KZP24). Übernommen werden je Betrieb nur die Merkmale, nach denen das
Cockpit Vergleichsgruppen bildet: Kanton, Spitaltyp (BFS-Typologie),
Rechtsform, Aktivitätstyp und stationäre Austritte.

Zuordnung zu den Betrieben der QIP-Publikation (cockpit.html, #qip-data):
über den normalisierten Betriebsnamen. Namen, die sich zwischen den beiden
BAG-Publikationen unterscheiden, stehen ausdrücklich in ALIASES; jede
Zuordnung ist damit nachvollziehbar und wird nicht unscharf geraten.
Benötigt openpyxl.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
COCKPIT = ROOT / 'deploy' / 'cockpit.html'
OUT = ROOT / 'deploy' / 'kzp24_attributes.js'

# QIP-Betriebsname -> Betriebsname in den Kennzahlen (geprüft anhand von Kanton und Typ).
ALIASES = {
    "Swiss Medical Network Hospitals SA Clinica Sant'Anna": "SMN - Clinica Sant'Anna",
    "Swiss Medical Network Hospitals SA Clinica Ars Medica": "SMN - Clinica Ars Medica",
    "Swiss Medical Network Hospitals SA Clinique Générale Ste-Anne": "SMN - Clinique Générale - Ste-Anne SA",
    "Swiss Medical Network Hospitals SA Clinique de Valère": "SMN - Clinique de Valère",
    "Swiss Medical Network Hospitals SA Privatklinik Obach": "SMN - Privatklinik Obach",
    "Swiss Medical Network Hospitals SA Neuchâtel": "SMN - Neuchâtel",
    "Swiss Medical Network Hospitals SA Privatklinik Siloah": "SMN - Privatklinik Siloah",
    "Swiss Medical Network Hospitals SA Privatklinik Villa im Park": "SMN - Klinik Villa im Park",
    "Swiss Medical Network Hospitals SA Privatklinik Belair": "SMN - Privatklinik Belair",
    "Pôle santé du Pays-d’Enhaut": "Pôle santé du Pays-d'Enhaut",
    "Genossenschaft Geburtshaus Simmental-Saanenland: Maternité Alpine":
        "Genossenschaft Geburtshaus Simmental-Saaneland - Maternité Alpine",
}


def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def main(xlsx):
    html = COCKPIT.read_text(encoding='utf-8')
    data = json.loads(re.search(r'<script type="application/json" id="qip-data">(.*?)</script>', html, re.S).group(1))
    qip = [x['n'] for x in data['betrieb']['insts'] if not x['a']]

    ws = openpyxl.load_workbook(xlsx, read_only=True)['KZ2024_KZP24']
    rows = list(ws.iter_rows(values_only=True))
    hdr = rows[0]
    kzp = {}
    for r in rows[1:]:
        rec = dict(zip(hdr, r))
        if rec.get('Inst'):
            key = norm(rec['Inst'])
            if key in kzp:
                raise SystemExit('Doppelter Betriebsname in den Kennzahlen: ' + rec['Inst'])
            kzp[key] = rec

    out, missing = {}, []
    for name in qip:
        rec = kzp.get(norm(ALIASES.get(name, name)))
        if not rec:
            missing.append(name)
            continue
        aus = rec.get('AustritteT')
        out[name] = {
            'kt': rec['KT'],
            'typ': rec['Typ'] or None,
            'rf': rec['RForm'] or None,
            'akt': rec['Akt'] or None,
            'aus': int(aus) if isinstance(aus, (int, float)) else None,
            'kzp': rec['Inst'],
        }
    if missing:
        raise SystemExit('Ohne Zuordnung: ' + '; '.join(missing))

    payload = {
        'quelle': 'BAG, Kennzahlen der Schweizer Spitäler 2024 (kzp24_data.xlsx, Blatt KZ2024_KZP24)',
        'jahr': 2024,
        'betriebe': out,
    }
    OUT.write_text(
        '// Automatisch erzeugt von tools/build_kzp_attributes.py. Nicht von Hand editieren.\n'
        '// Quelle: ' + payload['quelle'] + '. Auszugsweiser Abdruck unter Quellenangabe gestattet.\n'
        'window.KZP24 = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n',
        encoding='utf-8')
    print(f'{len(out)} von {len(qip)} QIP-Betrieben zugeordnet -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
