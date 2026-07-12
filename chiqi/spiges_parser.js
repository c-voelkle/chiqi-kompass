/*!
 * SpiGes-Parser für CH-IQI Kompass
 * ---------------------------------
 * Liest SpiGes-Daten-Files (BFS, XML Format 1.4/1.5) und erzeugt eine
 * normalisierte, fallbasierte Datenstruktur als Grundlage für die
 * CH-IQI-Indikatorberechnung.
 *
 * Eigenschaften:
 *  - Läuft komplett client-seitig (Browser) sowie in Node.js (Tests/CI).
 *    Es werden KEINE Daten an einen Server übermittelt.
 *  - Streaming-fähig: verarbeitet Chunks (Browser File.stream() /
 *    Node ReadStream), damit auch Files > 100 MB ohne DOM-Aufbau
 *    verarbeitet werden können. SpiGes trägt alle Daten in XML-Attributen,
 *    Textknoten existieren nicht. Das erlaubt einen schlanken SAX-Ansatz.
 *  - Nur das Daten-File wird gelesen. Das Identifikatoren-File (AHV-Nr.,
 *    Geburtsdatum) wird bewusst NICHT unterstützt: Es wird für die
 *    CH-IQI-Auswertung nicht benötigt.
 *
 * Quellen:
 *  - BFS: «SpiGes XML Format 1.5 - Beschreibung der XML-Datei für den
 *    Datenimport in die SpiGes-Plattform», 08.08.2025 (do-d-14.04-spiges-b)
 *  - SpiGesXML (R-Paket, Fachstelle für Statistik Kt. SG):
 *    https://swissstatsr.org/SpiGesXML/ (Node-/Variablennamen, XSD-Referenzen)
 *
 * Lizenz: MIT (Bestandteil von CH-IQI Kompass)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();            // Node.js / Bundler
  } else {
    root.SpiGesParser = factory();         // Browser (globales Objekt)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PARSER_VERSION = '0.1.0';

  // Namespaces gemäss BFS-Spezifikation
  var NS_V15 = 'http://www.bfs.admin.ch/xmlns/gvs/spiges-data';        // ab 1.5 ohne Versionssuffix
  var NS_PREFIX_VERSIONED = 'http://www.bfs.admin.ch/xmlns/gvs/spiges-data/'; // 1.0–1.4

  // Elemente unterhalb von <Fall>, die für CH-IQI nicht benötigt werden und
  // standardmässig übersprungen werden (Speicher!). Per Option zuschaltbar.
  var DEFAULT_SKIP = ['Medikament', 'Rechnung', 'KostentraegerFall',
    'KostentraegerStandort', 'KostentraegerUnternehmen', 'Kantonsdaten',
    'Operierende'];

  // ---------------------------------------------------------------- utils --

  var ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
  function decodeEntities(s) {
    if (s.indexOf('&') === -1) return s;
    return s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, function (m, e) {
      if (e[0] === '#') {
        var code = e[1] === 'x' || e[1] === 'X'
          ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return isNaN(code) ? m : String.fromCodePoint(code);
      }
      return ENTITIES[e] !== undefined ? ENTITIES[e] : m;
    });
  }

  function localName(name) {
    var i = name.indexOf(':');
    return i === -1 ? name : name.slice(i + 1);
  }

  // SpiGes-Datumsformate (XSD v1.5):
  //  - eintritts-/austrittsdatum:  yyyymmdd oder yyyymmddhh   (8 / 10-stellig)
  //  - behandlung_beginn:          yyyymmdd oder yyyymmddhhmm (8 / 12-stellig)
  //  - episode_beginn/-ende:       yyyymmddhh                 (10-stellig)
  // -> ISO-String (Datum bzw. Datum+Zeit) oder null
  function parseSpigesDate(raw) {
    if (!raw) return null;
    var s = String(raw);
    if (!/^\d{8}(\d{2}|\d{4})?$/.test(s)) return null;
    var iso = s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
    if (s.length >= 10) iso += 'T' + s.slice(8, 10) + ':' + (s.length === 12 ? s.slice(10, 12) : '00');
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : iso;
  }

  function dateMs(iso) { return iso ? new Date(iso).getTime() : NaN; }

  // ------------------------------------------------------------- tokenizer --

  /**
   * Minimaler streaming XML-Tokenizer.
   * Verlässt sich auf XML-Wohlgeformtheit: '<' ist in Attributwerten illegal
   * (muss &lt; sein) und markiert daher immer Markup-Beginn. '>' kann in
   * Attributwerten vorkommen; deshalb Quote-Tracking beim Tag-Scan.
   */
  function Tokenizer(onStart, onEnd, onError) {
    this.buf = '';
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.onError = onError;
  }

  var ATTR_RE = /([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  Tokenizer.prototype.push = function (chunk) {
    this.buf += chunk;
    var buf = this.buf, pos = 0, len = buf.length;

    while (pos < len) {
      var lt = buf.indexOf('<', pos);
      if (lt === -1) { pos = len; break; }           // Rest ist Text/Whitespace
      pos = lt;

      // Sonderkonstrukte
      if (buf.startsWith('<!--', pos)) {
        var ce = buf.indexOf('-->', pos + 4);
        if (ce === -1) break; pos = ce + 3; continue;
      }
      if (buf.startsWith('<![CDATA[', pos)) {
        var de = buf.indexOf(']]>', pos + 9);
        if (de === -1) break; pos = de + 3; continue;
      }
      if (buf.startsWith('<!', pos) || buf.startsWith('<?', pos)) {
        var pe = buf.indexOf('>', pos);
        if (pe === -1) break; pos = pe + 1; continue;
      }

      // Element-Tag: '>' ausserhalb von Anführungszeichen suchen
      var q = null, end = -1;
      for (var i = pos + 1; i < len; i++) {
        var c = buf[i];
        if (q) { if (c === q) q = null; }
        else if (c === '"' || c === "'") q = c;
        else if (c === '>') { end = i; break; }
      }
      if (end === -1) break;                          // Tag unvollständig -> auf nächsten Chunk warten

      var inner = buf.slice(pos + 1, end);
      pos = end + 1;

      if (inner[0] === '/') {                         // End-Tag
        this.onEnd(localName(inner.slice(1).trim()));
        continue;
      }
      var selfClosing = inner[inner.length - 1] === '/';
      if (selfClosing) inner = inner.slice(0, -1);

      var sp = inner.search(/[\s]/);
      var name = sp === -1 ? inner : inner.slice(0, sp);
      var attrs = {};
      if (sp !== -1) {
        var rest = inner.slice(sp), m;
        ATTR_RE.lastIndex = 0;
        while ((m = ATTR_RE.exec(rest)) !== null) {
          attrs[m[1]] = decodeEntities(m[2] !== undefined ? m[2] : m[3]);
        }
      }
      this.onStart(localName(name), attrs, selfClosing);
      if (selfClosing) this.onEnd(localName(name));
    }
    this.buf = buf.slice(pos);
    if (this.buf.length > 5e6) {
      this.onError('Unvollständiges XML-Konstrukt > 5 MB, Abbruch (Datei defekt?)');
    }
  };

  // --------------------------------------------------------------- builder --

  function CaseBuilder(options) {
    this.options = options;
    this.skip = new Set(options.include ? DEFAULT_SKIP.filter(function (e) {
      return options.include.indexOf(e) === -1;
    }) : DEFAULT_SKIP);
    this.skipDepth = 0;
    this.stack = [];
    this.meta = {
      parserVersion: PARSER_VERSION,
      formatVersion: null,
      namespace: null,
      entId: null,
      standorte: [],
      counts: { faelle: 0, diagnosen: 0, behandlungen: 0, standorte: 0 },
      warnings: []
    };
    this.currentBurnr = null;
    this.currentCase = null;
    this.cases = [];
    this.onCase = options.onCase || null;   // Streaming-Callback (optional)
  }

  CaseBuilder.prototype.warn = function (msg) {
    if (this.meta.warnings.length < 200) this.meta.warnings.push(msg);
  };

  CaseBuilder.prototype.start = function (name, attrs) {
    if (this.skipDepth > 0) { this.skipDepth++; return; }
    if (this.skip.has(name)) { this.skipDepth = 1; return; }
    this.stack.push(name);

    switch (name) {
      case 'Unternehmen':
        this.meta.entId = attrs.ent_id || null;
        this.meta.formatVersion = attrs.version || null;
        this.meta.namespace = attrs.xmlns || null;
        if (attrs.xmlns) {
          var ok = attrs.xmlns === NS_V15 ||
                   attrs.xmlns.indexOf(NS_PREFIX_VERSIONED) === 0;
          if (!ok) this.warn('Unbekannter Namespace: ' + attrs.xmlns);
        }
        if (attrs.version && ['1.4', '1.5'].indexOf(attrs.version) === -1) {
          this.warn('Formatversion "' + attrs.version + '". Der Parser ist für 1.4/1.5 ausgelegt.');
        }
        break;

      case 'Standort':
        this.currentBurnr = attrs.burnr || null;
        if (this.currentBurnr && this.meta.standorte.indexOf(this.currentBurnr) === -1) {
          this.meta.standorte.push(this.currentBurnr);
          this.meta.counts.standorte++;
        }
        break;

      case 'Fall':
        this.currentCase = {
          fallId: attrs.fall_id || null,
          burnr: this.currentBurnr,
          admin: null,
          diagnosen: [],
          behandlungen: [],
          neugeborene: null,
          psychiatrie: null,
          patientenbewegungen: []
        };
        break;

      case 'Administratives':
        if (this.currentCase) {
          if (this.currentCase.admin) this.warn('Fall ' + this.currentCase.fallId + ': mehrfaches <Administratives>');
          this.currentCase.admin = attrs;
        }
        break;

      case 'Diagnose':
        if (this.currentCase) {
          this.currentCase.diagnosen.push({
            id: attrs.diagnose_id || null,
            kode: attrs.diagnose_kode || null,
            seitigkeit: attrs.diagnose_seitigkeit || null,
            poa: attrs.diagnose_poa || null,     // present on admission
            zusatz: attrs.diagnose_zusatz || null
          });
          this.meta.counts.diagnosen++;
        }
        break;

      case 'Behandlung':
        if (this.currentCase) {
          this.currentCase.behandlungen.push({
            id: attrs.behandlung_id || null,
            chop: attrs.behandlung_chop || null,
            beginn: parseSpigesDate(attrs.behandlung_beginn),
            seitigkeit: attrs.behandlung_seitigkeit || null,
            _attrs: attrs
          });
          this.meta.counts.behandlungen++;
        }
        break;

      case 'Neugeborene':
        if (this.currentCase) this.currentCase.neugeborene = attrs;
        break;

      case 'Psychiatrie':
        if (this.currentCase) this.currentCase.psychiatrie = attrs;
        break;

      case 'Patientenbewegung':
        if (this.currentCase) this.currentCase.patientenbewegungen.push(attrs);
        break;
    }
  };

  CaseBuilder.prototype.end = function (name) {
    if (this.skipDepth > 0) { this.skipDepth--; return; }
    if (this.stack[this.stack.length - 1] === name) this.stack.pop();
    if (name === 'Fall' && this.currentCase) {
      var c = finalizeCase(this.currentCase, this);
      this.meta.counts.faelle++;
      if (this.onCase) this.onCase(c); else this.cases.push(c);
      this.currentCase = null;
    }
    if (name === 'Standort') this.currentBurnr = null;
  };

  /**
   * Abgeleitete, CH-IQI-relevante Felder pro Fall.
   * Kodierung folgt der Medizinischen Statistik (MS) / SpiGes-Variablenliste:
   *  - geschlecht: 1 = männlich, 2 = weiblich
   *  - austrittsentscheid (MS 1.5.V02): 5 = gestorben
   *  - Hauptdiagnose: Diagnose mit diagnose_id = 1 (sonst erste gelieferte)
   */
  function finalizeCase(raw, builder) {
    var a = raw.admin || {};
    var eintrittIso = parseSpigesDate(a.eintrittsdatum);
    var austrittIso = parseSpigesDate(a.austrittsdatum);

    var hd = null, nd = [];
    for (var i = 0; i < raw.diagnosen.length; i++) {
      var d = raw.diagnosen[i];
      if (hd === null && (d.id === '1' || raw.diagnosen.length === 1)) hd = d;
      else nd.push(d);
    }
    if (hd === null && raw.diagnosen.length > 0) { hd = raw.diagnosen[0]; nd = raw.diagnosen.slice(1); }

    var vwd = null;
    if (eintrittIso && austrittIso) {
      var ms = dateMs(austrittIso) - dateMs(eintrittIso);
      if (ms < 0) builder.warn('Fall ' + raw.fallId + ': Austritt vor Eintritt');
      else vwd = Math.round(ms / 864e5 * 100) / 100;   // Tage, 2 Dezimalstellen
    }

    return {
      fallId: raw.fallId,
      burnr: raw.burnr,

      // Demografie
      geschlecht: a.geschlecht === '1' ? 'M' : a.geschlecht === '2' ? 'F' : null,
      alterJahre: a.alter !== undefined ? parseInt(a.alter, 10) : null,
      alterTageU1: a.alter_U1 !== undefined ? parseInt(a.alter_U1, 10) : null,

      // Aufenthalt
      eintritt: eintrittIso,
      austritt: austrittIso,
      austrittsjahr: austrittIso ? parseInt(austrittIso.slice(0, 4), 10) : null,
      austrittsquartal: austrittIso ? Math.ceil(parseInt(austrittIso.slice(5, 7), 10) / 3) : null,
      verweildauerTage: vwd,
      adminUrlaubStunden: a.admin_urlaub !== undefined ? parseInt(a.admin_urlaub, 10) : null,
      nochHospitalisiert: !austrittIso,               // unterjährige Lieferung!

      eintrittsart: a.eintrittsart || null,
      eintrittAufenthalt: a.eintritt_aufenthalt || null,
      austrittsentscheid: a.austrittsentscheid || null,
      austrittAufenthalt: a.austritt_aufenthalt || null,
      verstorben: a.austrittsentscheid === '5',

      // Behandlungskontext
      aufenthaltIpsStunden: a.aufenthalt_ips !== undefined ? parseInt(a.aufenthalt_ips, 10) : null,
      beatmungStunden: a.beatmung !== undefined ? parseInt(a.beatmung, 10) : null,
      hauptleistungsstelle: a.hauptleistungsstelle || null,
      liegeklasse: a.liegeklasse || null,

      // Kodierung
      hauptdiagnose: hd ? hd.kode : null,
      nebendiagnosen: nd.map(function (d) { return d.kode; }).filter(Boolean),
      diagnosen: raw.diagnosen,
      chops: raw.behandlungen.map(function (b) { return b.chop; }).filter(Boolean),
      // CHOP normalisiert (ohne Punkte) für den Abgleich mit Indikator-Codelisten
      chopsNorm: raw.behandlungen.map(function (b) {
        return b.chop ? b.chop.replace(/\./g, '') : null;
      }).filter(Boolean),
      behandlungen: raw.behandlungen,

      neugeborene: raw.neugeborene,
      psychiatrie: raw.psychiatrie,
      patientenbewegungen: raw.patientenbewegungen,

      _admin: a   // vollständige Rohattribute für spätere Indikatordefinitionen
    };
  }

  // ------------------------------------------------------------------ API --

  /**
   * parseSpiGes(input, options) -> Promise<{meta, cases}>
   *
   * input:
   *  - string                       (kompletter XML-Inhalt)
   *  - Browser File/Blob            (wird gestreamt, UTF-8)
   *  - AsyncIterable<string|Uint8Array>  (z.B. Node ReadStream)
   *
   * options:
   *  - onCase(fall)   Callback pro Fall (dann bleibt result.cases leer)
   *  - include: []    Zusätzliche Elemente einlesen (z.B. ['Rechnung'])
   *  - fileName       für das Importprotokoll
   */
  async function parseSpiGes(input, options) {
    options = options || {};
    var t0 = Date.now();
    var builder = new CaseBuilder(options);
    var fatal = null;
    var tok = new Tokenizer(
      function (n, a, s) { builder.start(n, a, s); },
      function (n) { builder.end(n); },
      function (msg) { fatal = msg; }
    );
    var decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
    var bytes = 0;

    function feed(chunk) {
      if (fatal) return;
      if (typeof chunk === 'string') { tok.push(chunk); }
      else { bytes += chunk.byteLength || chunk.length || 0;
             tok.push(decoder ? decoder.decode(chunk, { stream: true }) : String(chunk)); }
    }

    if (typeof input === 'string') {
      bytes = input.length;
      feed(input);
    } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
      bytes = input.size;
      var reader = input.stream().getReader();
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        feed(r.value);
        if (fatal) break;
      }
    } else if (input && typeof input[Symbol.asyncIterator] === 'function') {
      for await (var ch of input) { feed(ch); if (fatal) break; }
    } else {
      throw new Error('parseSpiGes: nicht unterstützter Input-Typ');
    }
    if (decoder) tok.push(decoder.decode());   // Decoder-Flush

    if (fatal) throw new Error(fatal);
    if (builder.meta.counts.faelle === 0) {
      builder.warn('Keine Fälle gefunden. Ist dies ein SpiGes-DATEN-File (nicht das Identifikatoren-File)?');
    }

    builder.meta.importprotokoll = {
      datei: options.fileName || null,
      groesseBytes: bytes || null,
      importDatum: new Date().toISOString(),
      dauerMs: Date.now() - t0
    };
    return { meta: builder.meta, cases: builder.cases };
  }

  /**
   * Kompakte Zusammenfassung für Importprotokoll / Plausibilisierung.
   */
  function summarizeCases(cases) {
    var s = {
      faelle: cases.length,
      austritte: 0, nochHospitalisiert: 0, verstorben: 0,
      nachAustrittsjahr: {}, nachQuartal: {},
      topHauptdiagnosen: {}, faelleMitChop: 0
    };
    cases.forEach(function (c) {
      if (c.nochHospitalisiert) s.nochHospitalisiert++; else s.austritte++;
      if (c.verstorben) s.verstorben++;
      if (c.austrittsjahr) {
        s.nachAustrittsjahr[c.austrittsjahr] = (s.nachAustrittsjahr[c.austrittsjahr] || 0) + 1;
        var q = c.austrittsjahr + '-Q' + c.austrittsquartal;
        s.nachQuartal[q] = (s.nachQuartal[q] || 0) + 1;
      }
      if (c.hauptdiagnose) {
        var k3 = c.hauptdiagnose.slice(0, 3);
    
        s.topHauptdiagnosen[k3] = (s.topHauptdiagnosen[k3] || 0) + 1;
      }
      if (c.chops.length > 0) s.faelleMitChop++;
    });
    s.topHauptdiagnosen = Object.entries(s.topHauptdiagnosen)
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15)
      .map(function (e) { return { icd3: e[0], n: e[1] }; });
    return s;
  }

  return {
    parseSpiGes: parseSpiGes,
    summarizeCases: summarizeCases,
    parseSpigesDate: parseSpigesDate,
    PARSER_VERSION: PARSER_VERSION
  };
});
