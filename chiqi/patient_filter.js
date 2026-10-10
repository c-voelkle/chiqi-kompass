/*!
 * Patientengruppen-Filter für die unterjährige Auswertung (CH-IQI Kompass)
 * ------------------------------------------------------------------------
 * Schränkt die importierten SpiGes-Fälle auf eine Patientengruppe ein
 * (Altersklasse, Geschlecht, Eintrittsart, Aufenthalt vor Eintritt). Die
 * Indikatoren werden danach unverändert mit ChiqiEngine.computeAll berechnet:
 * Jeder Fall behält seinen Erwartungswert aus der CH-Referenz, darum bleibt
 * O/E auch für eine Teilgruppe indirekt standardisiert.
 *
 * Kodierungen gemäss BFS-Variablenliste (Medizinische Statistik / SpiGes):
 *  - eintrittsart (MS 1.2.V03): 1 Notfall, 2 angemeldet/geplant (elektiv), 3 Geburt,
 *    4 interner Übertritt, 5 Verlegung innert 24 h, 8 andere, 9 unbekannt
 *  - eintritt_aufenthalt (MS 1.2.V01): 1 Zuhause, 2 Zuhause mit Spitex,
 *    3 Krankenheim/Pflegeheim, 4 Altersheim/andere sozialmed. Institution,
 *    5/55 psychiatrische Klinik (anderer/gleicher Betrieb), 6/66 Akutspital
 *    oder Geburtshaus (anderer/gleicher Betrieb), 7 Strafvollzug, 8 andere,
 *    9 unbekannt
 * Altersklassen wie die BAG-Altersstrata der CH-IQI-Indikatoren
 * (z. B. A.1.2–A.1.5: 20–44, 45–64, 65–84, > 84).
 *
 * Läuft im Browser (window.ChiqiPatientFilter) und in Node (Tests).
 * Lizenz: MIT (Bestandteil von CH-IQI Kompass)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChiqiPatientFilter = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var UNKNOWN = 'unbekannt';

  function ageClass(c) {
    var a = c.alterJahre;
    if (a == null || isNaN(a)) return c.alterTageU1 != null ? '0-19' : null;
    if (a < 20) return '0-19';
    if (a < 45) return '20-44';
    if (a < 65) return '45-64';
    if (a < 85) return '65-84';
    return '85+';
  }
  function code(v) {
    if (v == null) return null;
    var s = String(v).trim();
    return s === '' || s === '9' ? null : s;
  }

  var DIMENSIONS = [
    { key: 'age', label: 'Altersklasse', fixed: true,
      classify: ageClass,
      labels: { '0-19': '0–19 J.', '20-44': '20–44 J.', '45-64': '45–64 J.', '65-84': '65–84 J.', '85+': '85+ J.' } },
    { key: 'sex', label: 'Geschlecht', fixed: true,
      classify: function (c) { return c.geschlecht === 'M' || c.geschlecht === 'F' ? c.geschlecht : null; },
      labels: { M: 'männlich', F: 'weiblich' } },
    { key: 'admission', label: 'Eintrittsart',
      classify: function (c) { return code(c.eintrittsart); },
      labels: { '1': 'Notfall', '2': 'elektiv', '3': 'Geburt', '4': 'interner Übertritt', '5': 'Verlegung < 24 h', '8': 'andere' } },
    { key: 'origin', label: 'Aufenthalt vor Eintritt',
      classify: function (c) { return code(c.eintrittAufenthalt); },
      labels: { '1': 'Zuhause', '2': 'Zuhause mit Spitex', '3': 'Pflegeheim', '4': 'Altersheim', '5': 'Psychiatrie',
        '55': 'Psychiatrie, gleicher Betrieb', '6': 'anderes Spital', '66': 'Spital, gleicher Betrieb', '7': 'Strafvollzug', '8': 'andere' } }
  ];
  var BY_KEY = {};
  DIMENSIONS.forEach(function (d) { BY_KEY[d.key] = d; });

  function valueOf(dim, c) {
    var v = dim.classify(c);
    return v == null ? UNKNOWN : v;
  }
  function labelOf(dim, value) {
    if (value === UNKNOWN) return 'unbekannt';
    return dim.labels[value] || 'Code ' + value;
  }
  function sortValues(dim, values) {
    var order = Object.keys(dim.labels);
    return values.sort(function (a, b) {
      if (a === UNKNOWN) return 1;
      if (b === UNKNOWN) return -1;
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return Number(a) - Number(b);
    });
  }

  /** Empty filter: every dimension on "alle" (''). */
  function emptyFilter() {
    var f = {};
    DIMENSIONS.forEach(function (d) { f[d.key] = ''; });
    return f;
  }
  function isActive(filter) {
    return !!filter && DIMENSIONS.some(function (d) { return !!filter[d.key]; });
  }
  function matches(c, filter) {
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var d = DIMENSIONS[i], want = filter && filter[d.key];
      if (want && valueOf(d, c) !== want) return false;
    }
    return true;
  }
  /** Nur die Altersklasse gewählt: dafür publiziert das BAG Teilindikatoren. */
  function isAgeOnly(filter) {
    return isActive(filter) && filter.age !== UNKNOWN && DIMENSIONS.every(function (d) { return d.key === 'age' ? !!filter.age : !filter[d.key]; });
  }
  function apply(cases, filter) {
    if (!isActive(filter)) return cases.slice();
    return cases.filter(function (c) { return matches(c, filter); });
  }

  /**
   * Auswahlwerte je Dimension mit der Zahl der Austritte. Altersklasse und
   * Geschlecht zeigen immer alle Klassen; kodierte Merkmale nur die
   * vorkommenden Codes. "unbekannt" erscheint, sobald Fälle ohne Wert vorliegen.
   */
  function options(cases) {
    var out = {};
    DIMENSIONS.forEach(function (d) {
      var counts = {};
      if (d.fixed) Object.keys(d.labels).forEach(function (v) { counts[v] = 0; });
      cases.forEach(function (c) {
        if (c.nochHospitalisiert) return;
        var v = valueOf(d, c);
        counts[v] = (counts[v] || 0) + 1;
      });
      out[d.key] = sortValues(d, Object.keys(counts)).map(function (v) {
        return { value: v, label: labelOf(d, v), count: counts[v] };
      });
    });
    return out;
  }

  /** Kurzbeschreibung der aktiven Auswahl, z. B. "65–84 J. · Notfall". */
  function describe(filter) {
    if (!isActive(filter)) return '';
    return DIMENSIONS.filter(function (d) { return !!filter[d.key]; })
      .map(function (d) { return labelOf(d, filter[d.key]); }).join(' · ');
  }
  /** Auswahl als Tabellenzeilen [Merkmal, Wert] für Bericht und Druckkopf. */
  function entries(filter) {
    if (!isActive(filter)) return [];
    return DIMENSIONS.filter(function (d) { return !!filter[d.key]; })
      .map(function (d) { return [d.label, labelOf(d, filter[d.key])]; });
  }

  return {
    DIMENSIONS: DIMENSIONS.map(function (d) { return { key: d.key, label: d.label }; }),
    UNKNOWN: UNKNOWN,
    emptyFilter: emptyFilter,
    isActive: isActive,
    isAgeOnly: isAgeOnly,
    matches: matches,
    apply: apply,
    options: options,
    describe: describe,
    entries: entries,
    ageClass: ageClass
  };
});
