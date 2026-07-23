/*!
 * CH-IQI Kompass: lokale QM-Workbench
 * -----------------------------------
 * Fallreview, PDCA-Arbeitsaufträge und automatisch erzeugter
 * Datenqualitäts-/Methodennachweis. Alle Funktionen laufen lokal.
 * Rohfälle und Original-Fall-IDs werden niemals persistiert oder exportiert.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChiqiQm = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var STORAGE_KEY = 'chiqiKompass.qmProjects.v1';
  var SECRET_KEY = 'chiqiKompass.localReferenceKey.v1';
  var PROJECT_SCHEMA = 1;

  var INDICATOR_META = {
    A1_01: { shortLabel: 'Herzinfarkt', prefixes: ['I21', 'I22'] },
    B1_01: { shortLabel: 'Schlaganfall', prefixes: ['I60', 'I61', 'I63', 'I64'] },
    D1_01: { shortLabel: 'Pneumonie', prefixes: ['A481', 'J100', 'J110', 'J12', 'J13', 'J14', 'J15', 'J16', 'J17', 'J18', 'J69'] }
  };

  var REVIEW_CLASSES = [
    { value: '', label: 'Noch nicht klassifiziert' },
    { value: 'daten_kodierung', label: 'Kodierung oder Datenqualität' },
    { value: 'dokumentation', label: 'Dokumentation' },
    { value: 'case_mix', label: 'Case-Mix oder Risikoprofil' },
    { value: 'versorgungsprozess', label: 'Versorgungsprozess' },
    { value: 'klinische_behandlung', label: 'Klinische Behandlung' },
    { value: 'schnittstelle', label: 'Schnittstelle oder Transfer' },
    { value: 'kein_hinweis', label: 'Kein Verbesserungshinweis' },
    { value: 'unklar', label: 'Nicht beurteilbar oder unklar' }
  ];

  var WORKFLOW_STATUSES = [
    'neu', 'datenpruefung', 'fallreview', 'massnahme',
    'wirkungsmessung', 'abgeschlossen', 'ohne_massnahme'
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function asNumber(value) {
    if (value === '' || value == null) return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function round(value, digits) {
    if (value == null || !isFinite(value)) return null;
    var p = Math.pow(10, digits == null ? 6 : digits);
    return Math.round(value * p) / p;
  }

  function startsWithAny(value, prefixes) {
    if (!value) return false;
    value = String(value);
    for (var i = 0; i < prefixes.length; i++) {
      if (value.indexOf(prefixes[i]) === 0) return true;
    }
    return false;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + stableStringify(value[key]);
    }).join(',') + '}';
  }

  function bytesToHex(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function fallbackHash(text) {
    var h1 = 0x811c9dc5, h2 = 0x9e3779b9;
    for (var i = 0; i < text.length; i++) {
      h1 ^= text.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= h1 + text.charCodeAt(i);
      h2 = Math.imul(h2, 0x85ebca6b);
    }
    return ('00000000' + (h1 >>> 0).toString(16)).slice(-8) +
      ('00000000' + (h2 >>> 0).toString(16)).slice(-8);
  }

  async function sha256Text(text) {
    text = String(text);
    var cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (cryptoObj && cryptoObj.subtle && typeof TextEncoder !== 'undefined') {
      var digest = await cryptoObj.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return bytesToHex(new Uint8Array(digest));
    }
    return fallbackHash(text);
  }

  // Inkrementelles SHA-256 für grosse SpiGes-Dateien. WebCrypto.digest
  // akzeptiert nur den gesamten Buffer; diese Implementierung erhält die
  // Streaming-Eigenschaft des Imports und begrenzt den Zusatzspeicher.
  var SHA256_K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  function rotr32(x, n) { return (x >>> n) | (x << (32 - n)); }
  function StreamingSha256() {
    this.h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    this.buffer = new Uint8Array(64);
    this.bufferLength = 0;
    this.bytesHashed = 0;
    this.finished = false;
    this.words = new Uint32Array(64);
  }
  StreamingSha256.prototype.process = function (chunk, offset) {
    var w = this.words, i;
    for (i = 0; i < 16; i++) {
      var j = offset + i * 4;
      w[i] = ((chunk[j] << 24) | (chunk[j + 1] << 16) | (chunk[j + 2] << 8) | chunk[j + 3]) >>> 0;
    }
    for (i = 16; i < 64; i++) {
      var x = w[i - 15], y = w[i - 2];
      var s0 = rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
      var s1 = rotr32(y, 17) ^ rotr32(y, 19) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    var a=this.h[0],b=this.h[1],c=this.h[2],d=this.h[3],
        e=this.h[4],f=this.h[5],g=this.h[6],h=this.h[7];
    for (i = 0; i < 64; i++) {
      var S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      var S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + maj) >>> 0;
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    this.h[0]=(this.h[0]+a)>>>0; this.h[1]=(this.h[1]+b)>>>0;
    this.h[2]=(this.h[2]+c)>>>0; this.h[3]=(this.h[3]+d)>>>0;
    this.h[4]=(this.h[4]+e)>>>0; this.h[5]=(this.h[5]+f)>>>0;
    this.h[6]=(this.h[6]+g)>>>0; this.h[7]=(this.h[7]+h)>>>0;
  };
  StreamingSha256.prototype.update = function (data) {
    if (this.finished) throw new Error('SHA-256 wurde bereits abgeschlossen.');
    if (!(data instanceof Uint8Array)) data = new Uint8Array(data);
    this.bytesHashed += data.length;
    var pos = 0;
    while (pos < data.length) {
      var take = Math.min(data.length - pos, 64 - this.bufferLength);
      this.buffer.set(data.subarray(pos, pos + take), this.bufferLength);
      this.bufferLength += take;
      pos += take;
      if (this.bufferLength === 64) {
        this.process(this.buffer, 0);
        this.bufferLength = 0;
      }
    }
    return this;
  };
  StreamingSha256.prototype.digest = function () {
    if (this.finished) throw new Error('SHA-256 wurde bereits abgeschlossen.');
    this.finished = true;
    var bits = this.bytesHashed * 8;
    this.buffer[this.bufferLength++] = 0x80;
    if (this.bufferLength > 56) {
      while (this.bufferLength < 64) this.buffer[this.bufferLength++] = 0;
      this.process(this.buffer, 0);
      this.bufferLength = 0;
    }
    while (this.bufferLength < 56) this.buffer[this.bufferLength++] = 0;
    var high = Math.floor(bits / 0x100000000);
    var low = bits >>> 0;
    this.buffer[56]=(high>>>24)&255; this.buffer[57]=(high>>>16)&255;
    this.buffer[58]=(high>>>8)&255; this.buffer[59]=high&255;
    this.buffer[60]=(low>>>24)&255; this.buffer[61]=(low>>>16)&255;
    this.buffer[62]=(low>>>8)&255; this.buffer[63]=low&255;
    this.process(this.buffer, 0);
    var out = new Uint8Array(32);
    for (var i = 0; i < 8; i++) {
      out[i*4]=(this.h[i]>>>24)&255; out[i*4+1]=(this.h[i]>>>16)&255;
      out[i*4+2]=(this.h[i]>>>8)&255; out[i*4+3]=this.h[i]&255;
    }
    return out;
  };

  async function sha256Blob(blob) {
    if (!blob) return null;
    var hash = new StreamingSha256();
    if (typeof blob.stream === 'function') {
      var reader = blob.stream().getReader();
      for (;;) {
        var part = await reader.read();
        if (part.done) break;
        hash.update(part.value);
      }
    } else if (typeof blob.arrayBuffer === 'function') {
      hash.update(new Uint8Array(await blob.arrayBuffer()));
    } else return null;
    return bytesToHex(hash.digest());
  }

  function randomSecret() {
    var cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    var bytes = new Uint8Array(32);
    if (cryptoObj && cryptoObj.getRandomValues) cryptoObj.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return bytesToHex(bytes);
  }

  function getLocalSecret(storage) {
    var secret = null;
    try { secret = storage && storage.getItem(SECRET_KEY); } catch (e) {}
    if (!secret) {
      secret = randomSecret();
      try { if (storage) storage.setItem(SECRET_KEY, secret); } catch (e2) {}
    }
    return secret;
  }

  async function makeLocalReferences(rows, context, storage) {
    var secret = getLocalSecret(storage);
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var rawKey = [context.entId || '', row.burnr || '', row.caseId || '', context.periodKey || ''].join('|');
      if (!map[rawKey]) {
        var digest = await sha256Text(secret + '|' + rawKey);
        map[rawKey] = 'F-' + digest.slice(0, 12).toUpperCase();
      }
      row.localRef = map[rawKey];
    }
    return rows;
  }

  function exclusionLabel(ev, c, relevant) {
    if (ev.denominator) return ev.numerator ? 'Nenner und Zähler' : 'Nenner';
    if (c.nochHospitalisiert) return 'Noch hospitalisiert';
    if (!relevant) return 'Hauptdiagnose nicht im Themenbereich';
    if (c.alterJahre == null) return 'Alter fehlt';
    if ((ev.indicatorId === 'A1_01' || ev.indicatorId === 'B1_01') && c.alterJahre <= 19) return 'Alter ≤19';
    return 'Ausschluss gemäss CH-IQI-Nennerdefinition';
  }

  function buildCaseRows(cases, indicator, engine) {
    var meta = INDICATOR_META[indicator.id];
    if (!meta) throw new Error('Keine Review-Metadaten für ' + indicator.id);
    var evaluations = engine.evaluateIndicatorCases(cases, indicator);
    var rows = [];
    evaluations.forEach(function (ev, i) {
      var c = cases[i];
      var relevant = startsWithAny(c.hauptdiagnose, meta.prefixes);
      if (!relevant && !ev.denominator) return;
      ev.indicatorId = indicator.id;
      rows.push({
        indicatorId: indicator.id,
        caseIndex: i,
        caseId: c.fallId,
        burnr: c.burnr,
        dischargeDate: c.austritt,
        quarter: c.austrittsjahr && c.austrittsquartal
          ? c.austrittsjahr + '-Q' + c.austrittsquartal : null,
        age: c.alterJahre,
        sex: c.geschlecht,
        mainDiagnosis: c.hauptdiagnose,
        deceased: c.verstorben,
        denominator: ev.denominator,
        numerator: ev.numerator,
        expected: ev.expected,
        expectedAgeSex: ev.expectedAgeSex,
        contribution: ev.denominator && ev.expected != null
          ? (ev.numerator ? 1 : 0) - ev.expected : null,
        adjustment: ev.adjustment,
        modelYear: ev.modelYear,
        refGroup: ev.refGroup,
        expectedMissing: ev.expectedMissing,
        outcomeMissing: ev.outcomeMissing,
        reasonCode: ev.reason,
        reasonLabel: exclusionLabel(ev, c, relevant),
        qualityFlags: ev.qualityFlags.slice()
      });
    });
    return rows;
  }

  function assessResult(result) {
    if (result.outcomeMisses || result.refMisses)
      return { code: 'blocked', label: 'nicht interpretierbar', z: null };
    if (result.E == null || result.n < 10 || result.E < 3)
      return { code: 'small', label: 'noch nicht belastbar', z: null };
    var se = Math.sqrt(result.E * (1 - result.E / result.n));
    if (!(se > 0)) return { code: 'blocked', label: 'nicht interpretierbar', z: null };
    var z = (result.O - result.E) / se;
    return z > 1.96
      ? { code: 'high', label: 'prüfenswert erhöht', z: z }
      : z < -1.96
        ? { code: 'low', label: 'tiefer als Erwartung', z: z }
        : { code: 'normal', label: 'ohne statistisches Signal', z: z };
  }

  function median(values) {
    if (!values.length) return null;
    values = values.slice().sort(function (a, b) { return a - b; });
    return values[Math.floor(values.length / 2)];
  }

  function addCheck(checks, id, label, status, detail, blocking) {
    checks.push({
      id: id,
      label: label,
      status: status,
      detail: detail,
      blocking: !!blocking
    });
  }

  function periodFromCases(cases) {
    var dates = cases.filter(function (c) { return !c.nochHospitalisiert && c.austritt; })
      .map(function (c) { return c.austritt.slice(0, 10); }).sort();
    var years = {};
    dates.forEach(function (d) { years[d.slice(0, 4)] = true; });
    return {
      from: dates.length ? dates[0] : null,
      to: dates.length ? dates[dates.length - 1] : null,
      years: Object.keys(years).sort(),
      key: Object.keys(years).sort().join('_') || 'ohne-austritt'
    };
  }

  async function buildQualityProtocol(options) {
    var parsed = options.parsed;
    var cases = parsed.cases;
    var results = options.results;
    var definitions = options.indicators;
    var caseRowsByIndicator = options.caseRowsByIndicator || {};
    var checks = [];
    var completed = cases.filter(function (c) { return !c.nochHospitalisiert; });
    var period = periodFromCases(cases);
    var formatOk = ['1.4', '1.5'].indexOf(parsed.meta.formatVersion) !== -1;
    addCheck(checks, 'spiges_format', 'SpiGes-Format',
      formatOk ? 'pass' : 'fail',
      'Erkannt: ' + (parsed.meta.formatVersion || 'unbekannt') + '. Unterstützt: 1.4 und 1.5.', true);
    addCheck(checks, 'cases', 'Gelieferte Fälle',
      cases.length ? 'pass' : 'fail',
      cases.length + ' Fälle, davon ' + completed.length + ' mit Austritt.', true);

    var idSeen = {}, duplicateIds = 0, missingIds = 0;
    cases.forEach(function (c) {
      if (!c.fallId) { missingIds++; return; }
      var key = (c.burnr || '') + '|' + c.fallId;
      if (idSeen[key]) duplicateIds++; else idSeen[key] = true;
    });
    addCheck(checks, 'case_ids', 'Eindeutige Fall-IDs',
      missingIds || duplicateIds ? 'fail' : 'pass',
      missingIds + ' fehlend, ' + duplicateIds + ' doppelt je Standort.', true);

    var missingHd = 0, invalidAge = 0, missingOutcome = 0, missingSex = 0;
    completed.forEach(function (c) {
      if (!c.hauptdiagnose) missingHd++;
      var rawAge = c._admin && c._admin.alter;
      if (c.alterJahre == null || c.alterJahre < 0 || c.alterJahre > 135 ||
          (rawAge != null && !/^\d+$/.test(String(rawAge)))) invalidAge++;
      if (!c.austrittsentscheid) missingOutcome++;
      if (!c.geschlecht) missingSex++;
    });
    addCheck(checks, 'required_fields', 'Pflichtfelder der Austritte',
      missingHd || invalidAge || missingOutcome || missingSex ? 'fail' : 'pass',
      missingHd + ' ohne Hauptdiagnose, ' + invalidAge + ' mit ungültigem Alter, ' +
        missingSex + ' ohne Geschlecht, ' + missingOutcome + ' ohne Austrittsentscheid.', true);

    addCheck(checks, 'period', 'Eindeutige Auswertungsperiode',
      period.years.length <= 1 ? 'pass' : 'fail',
      period.from && period.to
        ? period.from + ' bis ' + period.to + ' (' + period.years.join(', ') + ')'
        : 'Keine Austrittsdaten vorhanden.', true);

    var qs = {};
    completed.forEach(function (c) {
      if (c.austrittsjahr && c.austrittsquartal) {
        var q = c.austrittsjahr + '-Q' + c.austrittsquartal;
        qs[q] = (qs[q] || 0) + 1;
      }
    });
    var qKeys = Object.keys(qs).sort(), codingLag = false;
    if (qKeys.length >= 2) {
      var med = median(qKeys.slice(0, -1).map(function (q) { return qs[q]; }));
      codingLag = med > 0 && qs[qKeys[qKeys.length - 1]] < 0.6 * med;
    }
    addCheck(checks, 'coding_maturity', 'Kodierreife',
      codingLag ? 'warn' : 'pass',
      codingLag
        ? 'Das letzte gelieferte Quartal liegt unter 60% des Medians der Vorquartale.'
        : 'Kein starker Rückgang des letzten gelieferten Quartals erkannt.', false);

    var parserWarns = parsed.meta.warnings || [];
    addCheck(checks, 'parser_warnings', 'Parserhinweise',
      parserWarns.length ? 'warn' : 'pass',
      parserWarns.length ? parserWarns.length + ' Hinweis(e) im Importprotokoll.' : 'Keine Parserhinweise.', false);

    var dataYears = period.years.map(Number);
    var referenceYears = {};
    results.forEach(function (r) { if (r.refJahr != null) referenceYears[r.refJahr] = true; });
    var refYearList = Object.keys(referenceYears).map(Number).sort(function (a, b) { return a - b; });
    var vintageDiffers = dataYears.some(function (year) { return refYearList.indexOf(year) === -1; });
    addCheck(checks, 'method_vintage', 'Zeitbasis der Methodik',
      vintageDiffers ? 'warn' : 'pass',
      'Austrittsjahr(e): ' + (dataYears.join(', ') || 'nicht bestimmbar') +
        '. Referenzjahr(e): ' + (refYearList.join(', ') || 'nicht bestimmbar') +
        (vintageDiffers ? '. Die jüngste verfügbare Referenz wird auf neuere unterjährige Daten angewendet.' : '.'),
      false);

    var indicatorProtocols = [];
    for (var i = 0; i < results.length; i++) {
      var r = results[i], def = definitions.filter(function (d) { return d.id === r.id; })[0];
      var rows = caseRowsByIndicator[r.id] || [];
      var included = rows.filter(function (row) { return row.denominator; });
      var sumO = included.reduce(function (a, row) { return a + (row.numerator ? 1 : 0); }, 0);
      var expectedComplete = included.every(function (row) { return row.expected != null; });
      var sumE = expectedComplete
        ? included.reduce(function (a, row) { return a + row.expected; }, 0) : null;
      var invariantOk = included.length === r.n && sumO === r.O &&
        ((sumE == null && r.E == null) || (sumE != null && r.E != null && Math.abs(sumE - r.E) < 1e-9));
      addCheck(checks, 'trace_' + r.id, r.id + ': Fallspur',
        invariantOk ? 'pass' : 'fail',
        'Fallspur: n=' + included.length + ', O=' + sumO +
          ', E=' + (sumE == null ? 'nicht vollständig' : round(sumE, 6)) + '.', true);
      addCheck(checks, 'adjustment_' + r.id, r.id + ': vollständige Adjustierung',
        r.refMisses || r.outcomeMisses ? 'fail' : 'pass',
        (r.refMisses || 0) + ' fehlende Erwartungswerte, ' +
          (r.outcomeMisses || 0) + ' fehlende Outcomes.', true);
      var assessment = assessResult(r);
      addCheck(checks, 'power_' + r.id, r.id + ': statistische Belastbarkeit',
        assessment.code === 'small' ? 'warn' : (assessment.code === 'blocked' ? 'fail' : 'pass'),
        'n=' + r.n + ', E=' + (r.E == null ? 'nicht verfügbar' : round(r.E, 3)) +
          '. Einordnung: ' + assessment.label + '.', assessment.code === 'blocked');
      if (r.modelYears && r.modelYears.length && dataYears.some(function (year) {
        return r.modelYears.indexOf(year) === -1;
      })) {
        addCheck(checks, 'model_fallback_' + r.id, r.id + ': GLM-Modelljahr',
          'warn',
          'Verwendetes Modelljahr: ' + r.modelYears.join(', ') +
            '. Austrittsjahr(e): ' + dataYears.join(', ') + '. Der Fallback ist ausgewiesen.',
          false);
      }

      var definitionHash = await sha256Text(
        (def ? def.sqlF : '') + '\n' + (def ? def.sqlM : '') + '\n' +
        stableStringify(def && def.glm ? def.glm : null) + '\n' +
        stableStringify(def && def.refStrata ? def.refStrata : [])
      );
      indicatorProtocols.push({
        id: r.id,
        label: r.label,
        n: r.n,
        O: r.O,
        E: r.E == null ? null : round(r.E, 9),
        smr: r.smr == null ? null : round(r.smr, 9),
        adjustment: r.adjustierung,
        modelYears: r.modelYears || [],
        referenceYear: r.refJahr,
        refMisses: r.refMisses || 0,
        outcomeMisses: r.outcomeMisses || 0,
        assessment: assessment.label,
        definitionSha256: definitionHash
      });
    }

    var fileHash = null;
    try { fileHash = await sha256Blob(options.file); } catch (hashError) {}
    if (!fileHash) addCheck(checks, 'file_hash', 'SHA-256 der Eingabedatei', 'warn',
      'In diesem Browser konnte kein Datei-Hash erzeugt werden.', false);
    else addCheck(checks, 'file_hash', 'SHA-256 der Eingabedatei', 'pass', fileHash, false);
    var failCount = checks.filter(function (c) { return c.status === 'fail'; }).length;
    var warningCount = checks.filter(function (c) { return c.status === 'warn'; }).length;
    var verdict = failCount ? 'nicht_interpretierbar' : (warningCount ? 'mit_warnungen' : 'gueltig');

    var canonical = {
      schemaVersion: 1,
      source: {
        fileSha256: fileHash,
        sizeBytes: options.file && options.file.size != null ? options.file.size : parsed.meta.importprotokoll.groesseBytes,
        formatVersion: parsed.meta.formatVersion,
        namespace: parsed.meta.namespace,
        entId: parsed.meta.entId,
        locations: (parsed.meta.standorte || []).slice().sort(),
        period: period,
        caseCount: cases.length,
        dischargeCount: completed.length
      },
      software: {
        parserVersion: parsed.meta.parserVersion,
        engineVersion: options.engineVersion,
        workbenchVersion: VERSION
      },
      method: {
        chiqiVersion: options.methodMeta.chiqiVersion,
        source: options.methodMeta.quelle,
        calculationPath: 'BAG-sCHIQI SQL-Dialekt, lokal ausgewertet',
        indicators: indicatorProtocols
      },
      checks: checks.map(function (c) {
        return { id: c.id, status: c.status, blocking: c.blocking, detail: c.detail };
      }),
      verdict: verdict
    };
    var fingerprint = await sha256Text(stableStringify(canonical));
    return {
      schemaVersion: 1,
      generatedAt: nowIso(),
      certificateId: 'CHIQI-' + fingerprint.slice(0, 16).toUpperCase(),
      fingerprintSha256: fingerprint,
      verdict: verdict,
      failCount: failCount,
      warningCount: warningCount,
      source: canonical.source,
      software: canonical.software,
      method: canonical.method,
      checks: checks,
      limitations: [
        'Automatisch lokal erzeugter Prüf- und Methodennachweis, keine Zertifizierung durch BAG, BFS oder eine Fachgesellschaft.',
        'Der Parser prüft die verwendeten Pflichtfelder und Strukturen, führt jedoch keine vollständige XSD-Validierung im Browser durch.',
        'Unterjährige Daten sind vorläufig. Kodierverzug und saisonale Effekte können die Ergebnisse beeinflussen.',
        'O−E bezeichnet eine statistische Differenz, nicht die Anzahl vermeidbarer Ereignisse.'
      ]
    };
  }

  function projectContext(parsed, period) {
    return {
      entId: parsed.meta.entId || 'unbekannt',
      locations: (parsed.meta.standorte || []).slice(),
      periodKey: period.key,
      periodFrom: period.from,
      periodTo: period.to,
      formatVersion: parsed.meta.formatVersion
    };
  }

  function projectKey(context, indicatorId) {
    return [context.entId || 'unbekannt', context.periodKey || 'ohne-periode', indicatorId].join('|');
  }

  function createProject(context, result) {
    var timestamp = nowIso();
    return {
      schemaVersion: PROJECT_SCHEMA,
      projectId: projectKey(context, result.id),
      indicatorId: result.id,
      indicatorLabel: result.label,
      createdAt: timestamp,
      updatedAt: timestamp,
      context: clone(context),
      baseline: {
        measuredAt: timestamp,
        n: result.n,
        O: result.O,
        E: result.E,
        smr: result.smr,
        rate: result.rate,
        engineVersion: null,
        referenceYear: result.refJahr,
        adjustment: result.adjustierung
      },
      status: 'neu',
      owner: '',
      dueDate: '',
      reviewer: '',
      plan: {
        signalQuestion: '',
        hypothesis: '',
        goal: '',
        targetMetric: 'SMR',
        targetValue: '',
        measure: ''
      },
      do: {
        status: 'nicht_begonnen',
        implementedAt: '',
        implementationNote: ''
      },
      check: {
        measuredAt: '',
        n: '',
        O: '',
        E: '',
        methodComparable: true,
        evidence: ''
      },
      act: {
        decision: '',
        conclusion: ''
      },
      reviews: {},
      audit: [{ at: timestamp, event: 'Prüfauftrag erstellt' }]
    };
  }

  function hydrateProject(raw, context, result) {
    if (!raw || raw.schemaVersion !== PROJECT_SCHEMA || raw.indicatorId !== result.id)
      return createProject(context, result);
    var p = clone(raw);
    p.context = clone(context);
    p.baseline = {
      measuredAt: p.baseline && p.baseline.measuredAt || nowIso(),
      n: result.n, O: result.O, E: result.E, smr: result.smr, rate: result.rate,
      engineVersion: p.baseline && p.baseline.engineVersion || null,
      referenceYear: result.refJahr, adjustment: result.adjustierung
    };
    p.reviews = p.reviews || {};
    p.audit = p.audit || [];
    return p;
  }

  function loadProjects(storage) {
    try {
      var raw = storage && storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && parsed.schemaVersion === PROJECT_SCHEMA && parsed.projects
        ? parsed.projects : {};
    } catch (e) { return {}; }
  }

  function saveProject(storage, project) {
    if (!storage) throw new Error('Lokaler Browserspeicher ist nicht verfügbar.');
    var projects = loadProjects(storage);
    project.updatedAt = nowIso();
    projects[project.projectId] = clone(project);
    storage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: PROJECT_SCHEMA,
      updatedAt: project.updatedAt,
      projects: projects
    }));
    return project;
  }

  function removeProject(storage, projectId) {
    var projects = loadProjects(storage);
    delete projects[projectId];
    storage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: PROJECT_SCHEMA,
      updatedAt: nowIso(),
      projects: projects
    }));
  }

  function recordAudit(project, event) {
    project.audit = project.audit || [];
    var last = project.audit.length ? project.audit[project.audit.length - 1].event : null;
    if (last !== event) project.audit.push({ at: nowIso(), event: event });
  }

  function reviewSummary(project) {
    var reviews = project && project.reviews ? project.reviews : {};
    var values = Object.keys(reviews).map(function (key) { return reviews[key]; });
    var selected = values.filter(function (r) { return r.selected; });
    var completed = selected.filter(function (r) { return r.classification && r.reviewer && r.reviewedAt; });
    var classes = {};
    completed.forEach(function (r) {
      classes[r.classification] = (classes[r.classification] || 0) + 1;
    });
    return { selected: selected.length, completed: completed.length, classes: classes };
  }

  function followUp(project) {
    var n = asNumber(project.check.n), O = asNumber(project.check.O), E = asNumber(project.check.E);
    var rate = n != null && n > 0 && O != null ? O / n : null;
    var smr = E != null && E > 0 && O != null ? O / E : null;
    var baselineSmr = project.baseline.smr;
    return {
      n: n, O: O, E: E, rate: rate, smr: smr,
      smrChange: smr != null && baselineSmr != null ? smr - baselineSmr : null,
      comparable: project.check.methodComparable !== false &&
        project.baseline.adjustment != null && project.baseline.referenceYear != null
    };
  }

  function validateProject(project) {
    var errors = [];
    var review = reviewSummary(project);
    if (project.status === 'fallreview' && !review.selected)
      errors.push('Wählen Sie mindestens einen Fall für das Review aus.');
    if (['massnahme', 'wirkungsmessung', 'abgeschlossen'].indexOf(project.status) !== -1) {
      if (!project.owner) errors.push('Verantwortliche Person fehlt.');
      if (!project.dueDate) errors.push('Termin fehlt.');
      if (!project.plan.goal) errors.push('Messbares Ziel fehlt.');
      if (!project.plan.measure) errors.push('Geplante Massnahme fehlt.');
    }
    if (['wirkungsmessung', 'abgeschlossen'].indexOf(project.status) !== -1) {
      var fu = followUp(project);
      if (fu.n == null || fu.O == null || fu.E == null || !project.check.measuredAt)
        errors.push('Für die Wirkungsmessung fehlen Messdatum, n, O oder E.');
      if (!project.check.evidence) errors.push('Evidenz oder Quellenhinweis der Nachmessung fehlt.');
    }
    if (project.status === 'abgeschlossen' && (!project.act.decision || !project.act.conclusion))
      errors.push('Für den Abschluss fehlen Entscheidung und Schlussfolgerung.');
    if (project.status === 'ohne_massnahme' && !project.act.conclusion)
      errors.push('Der Abschluss ohne Massnahme braucht eine dokumentierte Begründung.');
    return errors;
  }

  function progress(project) {
    var review = reviewSummary(project);
    var fu = followUp(project);
    return {
      data: true,
      review: review.selected > 0 && review.completed === review.selected,
      plan: !!(project.owner && project.dueDate && project.plan.goal && project.plan.measure),
      do: project.do.status === 'umgesetzt' && !!project.do.implementedAt,
      check: fu.n != null && fu.O != null && fu.E != null && !!project.check.measuredAt,
      act: !!(project.act.decision && project.act.conclusion)
    };
  }

  function exportProjectBundle(context, projects, protocol) {
    var safeProjects = projects.map(function (project) {
      var copy = clone(project);
      // reviews enthalten nur lokal erzeugte Fallreferenzen und strukturierte
      // QM-Informationen. Roh-IDs und klinische Falldaten sind nie Teil davon.
      return copy;
    });
    return {
      schemaVersion: 1,
      exportedAt: nowIso(),
      product: 'CH-IQI Kompass',
      context: clone(context),
      projects: safeProjects,
      qualityProtocol: clone(protocol),
      privacy: {
        containsRawCases: false,
        containsOriginalCaseIds: false,
        note: 'Die Datei kann vertrauliche QM-Notizen und lokale Fallreferenzen enthalten.'
      }
    };
  }

  function aggregateEvidence(project) {
    var review = reviewSummary(project), fu = followUp(project);
    return {
      indicatorId: project.indicatorId,
      indicatorLabel: project.indicatorLabel,
      status: project.status,
      owner: project.owner,
      dueDate: project.dueDate,
      baseline: clone(project.baseline),
      review: review,
      plan: clone(project.plan),
      implementation: clone(project.do),
      followUp: fu,
      act: clone(project.act),
      audit: clone(project.audit || [])
    };
  }

  return {
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    PROJECT_SCHEMA: PROJECT_SCHEMA,
    INDICATOR_META: INDICATOR_META,
    REVIEW_CLASSES: REVIEW_CLASSES,
    WORKFLOW_STATUSES: WORKFLOW_STATUSES,
    stableStringify: stableStringify,
    sha256Text: sha256Text,
    sha256Blob: sha256Blob,
    makeLocalReferences: makeLocalReferences,
    buildCaseRows: buildCaseRows,
    assessResult: assessResult,
    periodFromCases: periodFromCases,
    buildQualityProtocol: buildQualityProtocol,
    projectContext: projectContext,
    projectKey: projectKey,
    createProject: createProject,
    hydrateProject: hydrateProject,
    loadProjects: loadProjects,
    saveProject: saveProject,
    removeProject: removeProject,
    recordAudit: recordAudit,
    reviewSummary: reviewSummary,
    followUp: followUp,
    validateProject: validateProject,
    progress: progress,
    exportProjectBundle: exportProjectBundle,
    aggregateEvidence: aggregateEvidence
  };
});
