/*!
 * Vergleichsgruppen für das Cockpit (CH-IQI Kompass)
 * --------------------------------------------------
 * Bildet aus den BAG-Kennzahlen der Schweizer Spitäler (window.KZP24, erzeugt
 * von tools/build_kzp_attributes.py) Vergleichsgruppen nach Spitaltyp,
 * Region, Grösse und Rechtsform und berechnet den gepoolten Rohwert einer
 * Gruppe für den Funnel-Plot.
 *
 *  - Spitaltyp: BFS-Krankenhaustypologie (K111–K235), wie in den Kennzahlen.
 *  - Region: BFS-Grossregionen, abgeleitet aus dem Kanton des Betriebs;
 *    einzelne Kantone sind ebenfalls wählbar.
 *  - Grösse: stationäre Austritte 2024 (AustritteT) oder Akutbetten
 *    (BettenStatA, 2024, ersatzweise 2023). Die Klassen sind eine Festlegung
 *    des CH-IQI Kompass, keine BAG-Klassierung.
 *  - Rechtsform: Gruppen R1–R4 der Kennzahlen.
 *  - Aus- und Weiterbildung (WB): ärztliche Weiterbildung, Ausbildung von
 *    Medizinstudierenden.
 *  - Notfall / IPS (SL): anerkannte Notfallaufnahme, Intensivpflegestation.
 *  - Herzkatheter: mindestens 100 Fälle «A.3.1.F Katheter der
 *    Koronargefässe» 2024 in der QIP-Publikation (vom Cockpit als a.cath
 *    übergeben). Die Kennzahlen weisen kein Herzkatheterlabor aus.
 *  - CMI: Casemix-Index brutto, Akutbereich (CMIbA, 2024, ersatzweise 2023).
 *  - Fallzahl im Indikator: Drittel der Institutionen mit Fällen im gewählten
 *    Indikator und in der gewählten Periode (vom Cockpit als a.volBand
 *    übergeben, Grenzen über setVolumeBands).
 *
 * Läuft im Browser (window.ChiqiHospitalGroups) und in Node (Tests).
 * Lizenz: MIT (Bestandteil von CH-IQI Kompass)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChiqiHospitalGroups = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TYP = {
    K111: 'Universitätsspital (K111)',
    K112: 'Zentrumsversorgung (K112)',
    K121: 'Grundversorgung Niveau 3 (K121)',
    K122: 'Grundversorgung Niveau 4 (K122)',
    K123: 'Grundversorgung Niveau 5 (K123)',
    K211: 'Psychiatrie Niveau 1 (K211)',
    K212: 'Psychiatrie Niveau 2 (K212)',
    K221: 'Rehabilitation (K221)',
    K231: 'Spezialklinik Chirurgie (K231)',
    K232: 'Gynäkologie / Neonatologie (K232)',
    K233: 'Pädiatrie (K233)',
    K234: 'Geriatrie (K234)',
    K235: 'Spezialklinik diverse (K235)'
  };
  // Zusammenfassungen der Typologie: alle Allgemeinspitäler, alle Grundversorger.
  var TYP_GROUPS = {
    'K1*': { label: 'Allgemeinspitäler (K111–K123)', codes: ['K111', 'K112', 'K121', 'K122', 'K123'] },
    'K12*': { label: 'Grundversorgung (K121–K123)', codes: ['K121', 'K122', 'K123'] },
    'K23*': { label: 'Spezialkliniken (K231–K235)', codes: ['K231', 'K232', 'K233', 'K234', 'K235'] }
  };
  // BFS-Grossregionen (NUTS 2).
  var REGIONS = {
    'GR-1': { label: 'Genferseeregion', kt: ['GE', 'VD', 'VS'] },
    'GR-2': { label: 'Espace Mittelland', kt: ['BE', 'FR', 'SO', 'NE', 'JU'] },
    'GR-3': { label: 'Nordwestschweiz', kt: ['BS', 'BL', 'AG'] },
    'GR-4': { label: 'Zürich', kt: ['ZH'] },
    'GR-5': { label: 'Ostschweiz', kt: ['GL', 'SH', 'AR', 'AI', 'SG', 'GR', 'TG'] },
    'GR-6': { label: 'Zentralschweiz', kt: ['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG'] },
    'GR-7': { label: 'Tessin', kt: ['TI'] }
  };
  var SIZES = [
    { value: 'S1', label: 'unter 2’000 Austritte', min: 0, max: 2000 },
    { value: 'S2', label: '2’000–4’999 Austritte', min: 2000, max: 5000 },
    { value: 'S3', label: '5’000–9’999 Austritte', min: 5000, max: 10000 },
    { value: 'S4', label: '10’000–19’999 Austritte', min: 10000, max: 20000 },
    { value: 'S5', label: '20’000 und mehr Austritte', min: 20000, max: Infinity }
  ];
  var BEDS = [
    { value: 'B1', label: 'unter 50 Akutbetten', min: 0, max: 50 },
    { value: 'B2', label: '50–99 Akutbetten', min: 50, max: 100 },
    { value: 'B3', label: '100–199 Akutbetten', min: 100, max: 200 },
    { value: 'B4', label: '200–499 Akutbetten', min: 200, max: 500 },
    { value: 'B5', label: '500 und mehr Akutbetten', min: 500, max: Infinity }
  ];
  var CMI = [
    { value: 'C1', label: 'CMI unter 0.85', min: -Infinity, max: 0.85 },
    { value: 'C2', label: 'CMI 0.85–0.99', min: 0.85, max: 1.0 },
    { value: 'C3', label: 'CMI 1.00–1.14', min: 1.0, max: 1.15 },
    { value: 'C4', label: 'CMI 1.15 und höher', min: 1.15, max: Infinity }
  ];
  var CARE = { NF: 'mit Notfallstation', IPS: 'mit Intensivstation', 'NF+IPS': 'mit Notfall- und Intensivstation', noNF: 'ohne Notfallstation' };
  var TEACH = { Arzt: 'Weiterbildung Ärztinnen und Ärzte', MSt: 'Ausbildung Medizinstudierende', none: 'ohne ärztliche Aus- und Weiterbildung' };
  var CATH_MIN = 100;
  var CATH = { yes: 'Herzkatheter, ≥ ' + CATH_MIN + ' Fälle', no: 'ohne Herzkatheter' };
  var RFORM = { R1: 'AG / GmbH', R2: 'Verein / Stiftung', R3: 'Einzelfirma / Gesellschaft', R4: 'Öffentliches Unternehmen' };

  function classOf(classes, v) {
    if (v == null || !isFinite(v)) return null;
    for (var i = 0; i < classes.length; i++) if (v >= classes[i].min && v < classes[i].max) return classes[i].value;
    return null;
  }
  function sizeClass(aus) { return classOf(SIZES, aus); }
  function bedClass(bet) { return classOf(BEDS, bet); }
  function cmiClass(cmi) { return classOf(CMI, cmi); }
  function has(list, token) { return !!list && list.indexOf(token) !== -1; }
  function labelIn(classes, v) { var c = classes.filter(function (x) { return x.value === v; })[0]; return c ? c.label : v; }

  // Fallzahl im Indikator: Drittel, vom Cockpit je Indikator und Periode gesetzt.
  var VOLUME = { V1: 'unteres Drittel', V2: 'mittleres Drittel', V3: 'oberes Drittel' };
  var volumeBands = null;
  function groupNumber(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’'); }
  /**
   * Drittel aus den Fallzahlen aller Institutionen mit mindestens einem Fall.
   * Rückgabe { cuts: [obere Grenze V1, obere Grenze V2], labels, bandOf(n) };
   * null, wenn weniger als 3 Institutionen Fälle haben.
   */
  function makeVolumeBands(counts) {
    var v = counts.filter(function (n) { return n != null && isFinite(n) && n >= 1; }).sort(function (a, b) { return a - b; });
    if (v.length < 3) return null;
    var c1 = v[Math.ceil(v.length / 3) - 1], c2 = v[Math.ceil(v.length * 2 / 3) - 1];
    var bandOf = function (n) { return n == null || !(n >= 1) ? null : n <= c1 ? 'V1' : n <= c2 ? 'V2' : 'V3'; };
    var range = function (lo, hi) { return lo === hi ? groupNumber(lo) + ' Fälle' : groupNumber(lo) + '–' + groupNumber(hi) + ' Fälle'; };
    var first = function (band) { return v.filter(function (n) { return bandOf(n) === band; }); };
    var labels = {};
    ['V1', 'V2', 'V3'].forEach(function (b) {
      var xs = first(b);
      labels[b] = VOLUME[b] + (xs.length ? ': ' + range(xs[0], xs[xs.length - 1]) : '');
    });
    return { cuts: [c1, c2], labels: labels, bandOf: bandOf };
  }
  function setVolumeBands(bands) { volumeBands = bands; }
  function regionOf(kt) {
    for (var k in REGIONS) if (REGIONS[k].kt.indexOf(kt) !== -1) return k;
    return null;
  }

  var DIMENSIONS = [
    { key: 'typ', label: 'Spitaltyp',
      test: function (a, v) { return TYP_GROUPS[v] ? TYP_GROUPS[v].codes.indexOf(a.typ) !== -1 : a.typ === v; },
      label_: function (v) { return TYP_GROUPS[v] ? TYP_GROUPS[v].label : (TYP[v] || v); } },
    { key: 'region', label: 'Region',
      test: function (a, v) { return REGIONS[v] ? REGIONS[v].kt.indexOf(a.kt) !== -1 : a.kt === v; },
      label_: function (v) { return REGIONS[v] ? REGIONS[v].label : 'Kanton ' + v; } },
    { key: 'size', label: 'Grösse',
      test: function (a, v) { return v.charAt(0) === 'B' ? bedClass(a.bet) === v : sizeClass(a.aus) === v; },
      label_: function (v) { return v.charAt(0) === 'B' ? labelIn(BEDS, v) : labelIn(SIZES, v); } },
    { key: 'rform', label: 'Rechtsform',
      test: function (a, v) { return a.rf === v; },
      label_: function (v) { return RFORM[v] || v; } },
    { key: 'teach', label: 'Aus- und Weiterbildung',
      test: function (a, v) { return v === 'none' ? !has(a.wb, 'Arzt') && !has(a.wb, 'MSt') : has(a.wb, v); },
      label_: function (v) { return TEACH[v] || v; } },
    { key: 'care', label: 'Notfall / IPS',
      test: function (a, v) {
        if (v === 'NF+IPS') return has(a.sl, 'NF') && has(a.sl, 'IPS');
        if (v === 'noNF') return !has(a.sl, 'NF');
        return has(a.sl, v);
      },
      label_: function (v) { return CARE[v] || v; } },
    { key: 'cath', label: 'Herzkatheter',
      test: function (a, v) { return a.cath != null && (v === 'yes' ? a.cath >= CATH_MIN : a.cath < CATH_MIN); },
      label_: function (v) { return CATH[v] || v; } },
    { key: 'cmi', label: 'CMI',
      test: function (a, v) { return cmiClass(a.cmi) === v; },
      label_: function (v) { return labelIn(CMI, v); } },
    { key: 'volume', label: 'Fallzahl im Indikator',
      test: function (a, v) { return a.volBand === v; },
      prefix: 'Fallzahl ',
      label_: function (v) { return volumeBands ? volumeBands.labels[v] : VOLUME[v] || v; } }
  ];
  var BY_KEY = {};
  DIMENSIONS.forEach(function (d) { BY_KEY[d.key] = d; });

  function emptyFilter() {
    var f = {};
    DIMENSIONS.forEach(function (d) { f[d.key] = ''; });
    return f;
  }
  function isActive(filter) {
    return !!filter && DIMENSIONS.some(function (d) { return !!filter[d.key]; });
  }
  /** attrs: Kennzahlen eines Betriebs oder null (ohne Zuordnung). */
  function matches(attrs, filter) {
    if (!isActive(filter)) return true;
    if (!attrs) return false;
    return DIMENSIONS.every(function (d) { return !filter[d.key] || d.test(attrs, filter[d.key]); });
  }

  /**
   * Auswahlwerte je Dimension, gezählt über die übergebenen Betriebe
   * (Array von Kennzahl-Objekten). Werte ohne Betrieb entfallen.
   * Rückgabe je Dimension: [{ group, options: [{ value, label, count }] }].
   */
  function options(attrsList) {
    var list = attrsList.filter(Boolean);
    function count(dim, v) { return list.filter(function (a) { return dim.test(a, v); }).length; }
    function opts(dim, values) {
      return values.map(function (v) { return { value: v, label: dim.label_(v), count: count(dim, v) }; })
        .filter(function (o) { return o.count > 0; });
    }
    var kantone = list.map(function (a) { return a.kt; }).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; }).sort();
    return {
      typ: [{ group: 'Zusammengefasst', options: opts(BY_KEY.typ, Object.keys(TYP_GROUPS)) },
            { group: 'BFS-Typologie', options: opts(BY_KEY.typ, Object.keys(TYP)) }],
      region: [{ group: 'Grossregion', options: opts(BY_KEY.region, Object.keys(REGIONS)) },
               { group: 'Kanton', options: opts(BY_KEY.region, kantone) }],
      size: [{ group: 'Stationäre Austritte 2024', options: opts(BY_KEY.size, SIZES.map(function (s) { return s.value; })) },
             { group: 'Akutbetten', options: opts(BY_KEY.size, BEDS.map(function (s) { return s.value; })) }],
      rform: [{ group: 'Rechtsform', options: opts(BY_KEY.rform, Object.keys(RFORM)) }],
      teach: [{ group: 'Aus- und Weiterbildung', options: opts(BY_KEY.teach, Object.keys(TEACH)) }],
      care: [{ group: 'Notfall / IPS', options: opts(BY_KEY.care, Object.keys(CARE)) }],
      cath: [{ group: 'Koronarkatheter 2024 (A.3.1.F)', options: opts(BY_KEY.cath, Object.keys(CATH)) }],
      cmi: [{ group: 'CMI brutto, akut', options: opts(BY_KEY.cmi, CMI.map(function (s) { return s.value; })) }],
      volume: [{ group: 'Institutionen mit Fällen', options: opts(BY_KEY.volume, Object.keys(VOLUME)) }]
    };
  }

  function describe(filter) {
    if (!isActive(filter)) return '';
    return DIMENSIONS.filter(function (d) { return !!filter[d.key]; })
      .map(function (d) { return (d.prefix || '') + d.label_(filter[d.key]); }).join(' · ');
  }
  function entries(filter) {
    if (!isActive(filter)) return [];
    return DIMENSIONS.filter(function (d) { return !!filter[d.key]; })
      .map(function (d) { return [d.label, d.label_(filter[d.key])]; });
  }

  /**
   * Gepoolter Rohwert einer Gruppe in Prozent: Summe O / Summe n, mit
   * O = Rate × n je Betrieb. points: [{ x: n, y: Rate in % }].
   */
  function pooledRate(points) {
    var sn = 0, so = 0;
    points.forEach(function (p) {
      if (p && isFinite(p.x) && p.x > 0 && isFinite(p.y)) { sn += p.x; so += p.y / 100 * p.x; }
    });
    return sn > 0 ? so / sn * 100 : null;
  }

  return {
    DIMENSIONS: DIMENSIONS.map(function (d) { return { key: d.key, label: d.label }; }),
    TYP: TYP, REGIONS: REGIONS, SIZES: SIZES, BEDS: BEDS, CMI: CMI, RFORM: RFORM, CATH_MIN: CATH_MIN,
    emptyFilter: emptyFilter,
    isActive: isActive,
    matches: matches,
    options: options,
    describe: describe,
    entries: entries,
    pooledRate: pooledRate,
    sizeClass: sizeClass,
    bedClass: bedClass,
    cmiClass: cmiClass,
    makeVolumeBands: makeVolumeBands,
    setVolumeBands: setVolumeBands,
    regionOf: regionOf
  };
});
