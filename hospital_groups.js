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
 *  - Grösse: stationäre Austritte 2024 (Kennzahl AustritteT). Die Klassen
 *    sind eine Festlegung des CH-IQI Kompass, keine BAG-Klassierung.
 *  - Rechtsform: Gruppen R1–R4 der Kennzahlen.
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
  var RFORM = { R1: 'AG / GmbH', R2: 'Verein / Stiftung', R3: 'Einzelfirma / Gesellschaft', R4: 'Öffentliches Unternehmen' };

  function sizeClass(aus) {
    if (aus == null || !isFinite(aus)) return null;
    for (var i = 0; i < SIZES.length; i++) if (aus >= SIZES[i].min && aus < SIZES[i].max) return SIZES[i].value;
    return null;
  }
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
      test: function (a, v) { return sizeClass(a.aus) === v; },
      label_: function (v) { var s = SIZES.filter(function (x) { return x.value === v; })[0]; return s ? s.label : v; } },
    { key: 'rform', label: 'Rechtsform',
      test: function (a, v) { return a.rf === v; },
      label_: function (v) { return RFORM[v] || v; } }
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
      size: [{ group: 'Stationäre Austritte 2024', options: opts(BY_KEY.size, SIZES.map(function (s) { return s.value; })) }],
      rform: [{ group: 'Rechtsform', options: opts(BY_KEY.rform, Object.keys(RFORM)) }]
    };
  }

  function describe(filter) {
    if (!isActive(filter)) return '';
    return DIMENSIONS.filter(function (d) { return !!filter[d.key]; })
      .map(function (d) { return d.label_(filter[d.key]); }).join(' · ');
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
    TYP: TYP, REGIONS: REGIONS, SIZES: SIZES, RFORM: RFORM,
    emptyFilter: emptyFilter,
    isActive: isActive,
    matches: matches,
    options: options,
    describe: describe,
    entries: entries,
    pooledRate: pooledRate,
    sizeClass: sizeClass,
    regionOf: regionOf
  };
});
