/*!
 * CH-IQI Engine für CH-IQI Kompass
 * ---------------------------------
 * Berechnet CH-IQI-Indikatoren direkt aus SpiGes-Falldaten (Output des
 * SpiGes-Parsers), komplett client-seitig.
 *
 * Kern: ein Mini-Evaluator für den SQL-Dialekt der offiziellen
 * BAG-Spezifikationen («SQL Strings CH-IQI»). Die Definitionen werden
 * NICHT von Hand übersetzt, sondern per Build-Skript (extract_chiqi_sql.py)
 * aus der BAG-Datei extrahiert und hier 1:1 ausgewertet.
 * Unterstützte Konstrukte: LEFT(x,n), InStr(x,y), IN (...), BETWEEN,
 * IS NULL, =, <>, <, >, <=, >=, AND, OR, NOT, Klammern; nacktes
 * InStr(x,y) als boolesches Prädikat (v5.5, implizit >0).
 * Laufzeit-Codelisten (v5.5): compile(sql, lists) bindet R-Listennamen aus
 * der BAG-Datei - InStr(col, ListName), nackter ListName als Prädikat
 * (Suche in AllBeh) sowie SelGENOR/SelGENORA308 jahresabhängig über die
 * genor_JJJJ-Listen (Auswahl per Austrittsjahr, Fallback: neueste Liste).
 *
 * Erwartungswerte: indirekte Standardisierung nach Alter (5er-Gruppen)
 * und Geschlecht mit den offiziellen BAG-Referenzdaten (pCH pro Stratum):
 *   E = Σ über Nenner-Fälle: pCH(AltEGrp, Sex)
 *
 * Differenzierte Risikomodelle (v5.5, 5 Indikatoren): logistische
 * Regression mit den offiziellen BAG-Koeffizienten (glm_riskAdj_v55.json):
 *   p = 1/(1+exp(-(b0 + Σ bi*xi))), E = Σ p über Nenner-Fälle.
 * Terme: Alter (kontinuierlich), weibliches Geschlecht (Sex=2), Zuverlegung
 * (AVor=6), Komorbiditäten via str_detect auf HD/NebDia/AllDia/AllBeh.
 * Gemäss BAG-FAQ V5.5 (S.16) ersetzen diese Modelle die reine
 * Alter/Geschlecht-Adjustierung für die betroffenen Indikatoren.
 *
 * Lizenz: MIT (Bestandteil von CH-IQI Kompass)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.ChiqiEngine = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ENGINE_VERSION = '0.6.0';

  // ------------------------------------------------------ SQL-Mini-Parser --

  var KEYWORDS = ['AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'IS', 'NULL'];

  function tokenize(sql) {
    var tokens = [], i = 0, n = sql.length;
    while (i < n) {
      var c = sql[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === "'") {                                   // String-Literal
        var j = sql.indexOf("'", i + 1);
        if (j === -1) throw new Error('Unbeendetes String-Literal: ' + sql.slice(i, i + 30));
        tokens.push({ t: 'str', v: sql.slice(i + 1, j) }); i = j + 1; continue;
      }
      if (c >= '0' && c <= '9') {
        var m = /^\d+(\.\d+)?/.exec(sql.slice(i));
        tokens.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var w = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sql.slice(i))[0];
        var up = w.toUpperCase();
        if (KEYWORDS.indexOf(up) !== -1) tokens.push({ t: 'kw', v: up });
        else tokens.push({ t: 'id', v: w });
        i += w.length; continue;
      }
      if (c === '<' && sql[i + 1] === '>') { tokens.push({ t: 'op', v: '<>' }); i += 2; continue; }
      if ((c === '<' || c === '>') && sql[i + 1] === '=') { tokens.push({ t: 'op', v: c + '=' }); i += 2; continue; }
      if ('=<>(),'.indexOf(c) !== -1) { tokens.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('Unerwartetes Zeichen "' + c + '" in SQL: …' + sql.slice(Math.max(0, i - 20), i + 10) + '…');
    }
    return tokens;
  }

  // Rekursiver Abstieg: orExpr -> andExpr -> notExpr -> predicate
  function Parser(tokens, lists) { this.toks = tokens; this.p = 0; this.lists = lists || null; }
  Parser.prototype.knownList = function (name) {
    if (!this.lists) return false;
    if (name === 'SelGENOR' || name === 'SelGENORA308') return true;
    return listCandidates(name).some(function (k) { return this.lists[k] !== undefined; }, this);
  };
  Parser.prototype.peek = function () { return this.toks[this.p]; };
  Parser.prototype.next = function () { return this.toks[this.p++]; };
  Parser.prototype.expect = function (t, v) {
    var tok = this.next();
    if (!tok || tok.t !== t || (v !== undefined && tok.v !== v))
      throw new Error('Erwartet ' + (v || t) + ', erhalten ' + JSON.stringify(tok));
    return tok;
  };

  Parser.prototype.parse = function () {
    if (!this.toks.length) throw new Error('Leere Definition');
    var e = this.orExpr();
    if (this.p < this.toks.length) throw new Error('Überzählige Tokens ab ' + JSON.stringify(this.peek()));
    return e;
  };
  Parser.prototype.orExpr = function () {
    var left = this.andExpr();
    while (this.peek() && this.peek().t === 'kw' && this.peek().v === 'OR') {
      this.next(); left = { k: 'or', a: left, b: this.andExpr() };
    }
    return left;
  };
  Parser.prototype.andExpr = function () {
    var left = this.notExpr();
    while (this.peek() && this.peek().t === 'kw' && this.peek().v === 'AND') {
      this.next(); left = { k: 'and', a: left, b: this.notExpr() };
    }
    return left;
  };
  Parser.prototype.notExpr = function () {
    if (this.peek() && this.peek().t === 'kw' && this.peek().v === 'NOT') {
      this.next(); return { k: 'not', a: this.notExpr() };
    }
    return this.predicate();
  };

  // Wert-Ausdruck: Zahl, String, Spalte, LEFT(col,n), InStr(col,'x')
  Parser.prototype.value = function () {
    var tok = this.next();
    if (tok.t === 'num') return { k: 'num', v: tok.v };
    if (tok.t === 'str') return { k: 'str', v: tok.v };
    if (tok.t === 'id') {
      var name = tok.v, lower = name.toLowerCase();
      if (this.peek() && this.peek().t === 'op' && this.peek().v === '(') {
        this.next();                                     // '('
        if (lower === 'left') {
          var col = this.expect('id').v; this.expect('op', ',');
          var len = this.expect('num').v; this.expect('op', ')');
          return { k: 'left', col: col, len: len };
        }
        if (lower === 'instr') {
          var col2 = this.expect('id').v; this.expect('op', ',');
          var arg = this.next();
          if (arg && arg.t === 'str') {
            this.expect('op', ')');
            return { k: 'instr', col: col2, pat: arg.v };
          }
          if (arg && arg.t === 'id' && this.knownList(arg.v)) {
            this.expect('op', ')');
            return { k: 'instrList', col: col2, name: arg.v };
          }
          throw new Error('InStr: unbekannte Liste/Argument ' + JSON.stringify(arg));
        }
        throw new Error('Unbekannte Funktion: ' + name);
      }
      return { k: 'col', name: name };
    }
    throw new Error('Unerwarteter Wert: ' + JSON.stringify(tok));
  };

  Parser.prototype.predicate = function () {
    if (this.peek() && this.peek().t === 'op' && this.peek().v === '(') {
      // Klammer: kann Bool-Gruppe ODER Wert-Klammer sein -> Backtracking
      var save = this.p;
      this.next();
      try {
        var grp = this.orExpr();
        this.expect('op', ')');
        return grp;
      } catch (e) { this.p = save; }
    }
    var left = this.value();
    var tok = this.peek();
    // v5.5: nacktes InStr(...) als boolesches Prädikat (implizit >0);
    // nackter Listen-Name als Prädikat = Suche in AllBeh
    var instrBool = { k: 'cmp', op: '>', a: left, b: { k: 'num', v: 0 } };
    var bareList = left.k === 'col' && this.knownList(left.name)
      ? { k: 'cmp', op: '>', a: { k: 'instrList', col: 'AllBeh', name: left.name }, b: { k: 'num', v: 0 } }
      : null;
    if (!tok) {
      if (left.k === 'instr' || left.k === 'instrList') return instrBool;
      if (bareList) return bareList;
      throw new Error('Prädikat unvollständig');
    }
    if (tok.t === 'kw' && tok.v === 'IS') {
      this.next();
      var neg = false;
      if (this.peek().t === 'kw' && this.peek().v === 'NOT') { this.next(); neg = true; }
      this.expect('kw', 'NULL');
      return { k: neg ? 'notnull' : 'isnull', a: left };
    }
    if (tok.t === 'kw' && tok.v === 'IN') {
      this.next(); this.expect('op', '(');
      var list = [];
      for (;;) {
        var el = this.next();
        if (el.t !== 'str' && el.t !== 'num') throw new Error('IN-Liste: ' + JSON.stringify(el));
        list.push(el.v);
        var sep = this.next();
        if (sep.v === ')') break;
        if (sep.v !== ',') throw new Error('IN-Liste: erwartet , oder )');
      }
      return { k: 'in', a: left, list: list };
    }
    if (tok.t === 'kw' && tok.v === 'BETWEEN') {
      this.next();
      var lo = this.value(); this.expect('kw', 'AND');
      var hi = this.value();
      return { k: 'between', a: left, lo: lo, hi: hi };
    }
    if (tok.t === 'kw' && tok.v === 'NOT') {           // x NOT BETWEEN a AND b
      this.next(); this.expect('kw', 'BETWEEN');
      var lo2 = this.value(); this.expect('kw', 'AND');
      var hi2 = this.value();
      return { k: 'not', a: { k: 'between', a: left, lo: lo2, hi: hi2 } };
    }
    if (tok.t === 'op' && ['=', '<>', '<', '>', '<=', '>='].indexOf(tok.v) !== -1) {
      this.next();
      return { k: 'cmp', op: tok.v, a: left, b: this.value() };
    }
    if (left.k === 'instr' || left.k === 'instrList') return instrBool; // z.B. (InStr(AllDia,'J80')) AND …
    if (bareList) return bareList;               // z.B. (TransfusionenKomplikB) AND …
    throw new Error('Unerwartetes Prädikat-Token: ' + JSON.stringify(tok));
  };

  function listCandidates(name) {
    var c = [name, name + '_leer_pipe', name + '_pipe', name + '_leer'];
    if (/_leer$/.test(name)) c.push(name.replace(/_leer$/, ''));
    return c;
  }

  // Liste als Array normalisieren (Pipe-String oder Array); null wenn unbekannt
  function lookupList(lists, name) {
    var cand = listCandidates(name);
    for (var i = 0; i < cand.length; i++) {
      var v = lists[cand[i]];
      if (v === undefined) continue;
      return typeof v === 'string' ? v.split('|') : v;
    }
    return null;
  }

  // SelGENOR/SelGENORA308: jahresabhängige GENOR-Liste (BAG: genor_JJJJ).
  // Fallback: neueste verfügbare Liste <= Jahr, sonst neueste überhaupt
  // (unterjährige Daten neuer Jahre).
  function resolveList(lists, name, jahr) {
    if (name !== 'SelGENOR' && name !== 'SelGENORA308') return lookupList(lists, name);
    var base = name === 'SelGENOR' ? 'genor' : 'genorA308';
    var years = [];
    for (var k in lists) {
      var m = new RegExp('^' + base + '_(\\d{4})(_leer(_pipe)?|_pipe)?$').exec(k);
      if (m) years.push(parseInt(m[1], 10));
    }
    if (!years.length) return null;
    years.sort(function (a, b) { return a - b; });
    var pick = null;
    for (var i = 0; i < years.length; i++) { if (jahr != null && years[i] <= jahr) pick = years[i]; }
    if (pick === null) pick = years[years.length - 1];
    return lookupList(lists, base + '_' + pick);
  }

  function matchList(ctx, colName, name, row) {
    var s = row[colName];
    if (s == null) return false;
    s = String(s);
    var jahr = row.Jahr != null ? Number(row.Jahr) : null;
    var key = name + '|' + jahr;
    var arr = ctx.cache[key];
    if (arr === undefined) {
      var raw = resolveList(ctx.lists, name, jahr);
      arr = null;
      if (raw) {
        arr = raw.map(function (e) {
          e = String(e);
          if (colName === 'AllBeh') return e.charAt(0) === ' ' ? e : ' ' + e;
          return e.charAt(0) === ' ' ? e.slice(1) : e;
        });
      }
      ctx.cache[key] = arr;
    }
    if (!arr) throw new Error('Laufzeitliste nicht auflösbar: ' + name);
    for (var i = 0; i < arr.length; i++) {
      if (s.indexOf(arr[i]) !== -1) return true;
    }
    return false;
  }

  function compile(sql, lists) {
    var ast = new Parser(tokenize(sql), lists).parse();
    var ctx = { lists: lists || {}, cache: {} };
    return function (row) { return evalNode(ast, row, ctx); };
  }

  function evalValue(node, row, ctx) {
    switch (node.k) {
      case 'num': return node.v;
      case 'str': return node.v;
      case 'col': {
        var v = row[node.name];
        return v === undefined ? null : v;
      }
      case 'left': {
        var s = row[node.col];
        return s == null ? null : String(s).slice(0, node.len);
      }
      case 'instr': {
        var s2 = row[node.col];
        return s2 == null ? 0 : String(s2).indexOf(node.pat) + 1;  // 1-basiert, 0 = nicht gefunden
      }
      case 'instrList':
        return matchList(ctx, node.col, node.name, row) ? 1 : 0;
    }
    throw new Error('evalValue: ' + node.k);
  }

  // SQL-Semantik: Vergleich mit NULL -> false (vereinfachte 3-wertige Logik)
  function evalNode(node, row, ctx) {
    switch (node.k) {
      case 'and': return evalNode(node.a, row, ctx) && evalNode(node.b, row, ctx);
      case 'or': return evalNode(node.a, row, ctx) || evalNode(node.b, row, ctx);
      case 'not': return !evalNode(node.a, row, ctx);
      case 'isnull': return evalValue(node.a, row, ctx) == null;
      case 'notnull': return evalValue(node.a, row, ctx) != null;
      case 'in': {
        var v = evalValue(node.a, row, ctx);
        if (v == null) return false;
        for (var i = 0; i < node.list.length; i++) {
          if (String(v) === String(node.list[i])) return true;
        }
        return false;
      }
      case 'between': {
        var x = evalValue(node.a, row, ctx);
        if (x == null) return false;
        return x >= evalValue(node.lo, row, ctx) && x <= evalValue(node.hi, row, ctx);
      }
      case 'cmp': {
        var a = evalValue(node.a, row, ctx), b = evalValue(node.b, row, ctx);
        if (a == null || b == null) return false;
        if (typeof a === 'number' || typeof b === 'number') { a = Number(a); b = Number(b); }
        switch (node.op) {
          case '=': return a === b || String(a) === String(b);
          case '<>': return !(a === b || String(a) === String(b));
          case '<': return a < b;
          case '>': return a > b;
          case '<=': return a <= b;
          case '>=': return a >= b;
        }
      }
    }
    throw new Error('evalNode: ' + node.k);
  }

  // ------------------------------------------- SpiGes-Fall -> SQL-Zeile ----

  /**
   * Bildet einen Fall aus dem SpiGes-Parser auf die Spalten der
   * CH-IQI-SQL-Definitionen ab.
   * Konventionen der BAG-SQL-Strings:
   *  - AllDia/NebDia: konkatenierte ICD-Codes (Präfixsuche via InStr)
   *  - AllBeh: konkatenierte CHOP-Codes OHNE Punkte, mit führendem
   *    Leerzeichen pro Code (Suchmuster ' 9386' etc.)
   */
  function caseToRow(c) {
    var nd = c.nebendiagnosen || [];
    var alle = (c.hauptdiagnose ? [c.hauptdiagnose] : []).concat(nd);
    var beh = c.chopsNorm || [];
    return {
      HD: c.hauptdiagnose || null,
      NebDia: nd.length ? ' ' + nd.join(' ') : '',
      AllDia: alle.length ? ' ' + alle.join(' ') : '',
      AllBeh: beh.length ? ' ' + beh.join(' ') + ' ' : '',
      AltE: c.alterJahre,
      ATage: c.alterTageU1 != null ? c.alterTageU1
             : (c.alterJahre != null && c.alterJahre > 0 ? 9999 : null),
      EAus: c.austrittsentscheid != null ? parseInt(c.austrittsentscheid, 10) : null,
      ANach: c.austrittAufenthalt != null ? parseInt(c.austrittAufenthalt, 10) : null,
      AVor: c.eintrittAufenthalt != null ? parseInt(c.eintrittAufenthalt, 10) : null,
      EArt: c.eintrittsart != null ? parseInt(c.eintrittsart, 10) : null,
      HBeat: c.beatmungStunden,
      StdIPS: c.aufenthaltIpsStunden,
      Sex: c.geschlecht === 'M' ? 1 : c.geschlecht === 'F' ? 2 : null,
      Jahr: c.austrittsjahr,
      // SpiGes-nativ: VitStat 0=lebend, 1=verstorben (v5.5-Definitionen).
      // VitalStat (invertiert, 1=lebend) nur für die *_23-Definitionen
      // der Datenjahre bis 2023.
      VitStat: c.neugeborene && c.neugeborene.vitalstatus != null
               ? parseInt(c.neugeborene.vitalstatus, 10) : null,
      VitalStat: c.neugeborene && c.neugeborene.vitalstatus != null
                 ? (parseInt(c.neugeborene.vitalstatus, 10) === 0 ? 1 : 0) : null,
      GebGew: c.neugeborene && c.neugeborene.geburtsgewicht != null
              ? parseInt(c.neugeborene.geburtsgewicht, 10) : null,
      AufGew: c._admin && c._admin.aufnahmegewicht != null
              ? parseInt(c._admin.aufnahmegewicht, 10) : null
    };
  }

  // ------------------------------------- GLM (differenzierte Risikomodelle) --

  // Übersetzt einen Koeffizienten-Term in eine Funktion row -> x_i.
  // Rückgabe null = Merkmal nicht bestimmbar (fehlendes Alter/Geschlecht).
  function compileGlmTerm(term) {
    if (term.term === '(Intercept)') return function () { return 1; };
    var spec = term.spec || '';
    if (spec.indexOf('s_alte') !== -1)
      return function (row) { return row.AltE == null ? null : Number(row.AltE); };
    if (spec.indexOf('s_sex') !== -1)
      return function (row) { return row.Sex == null ? null : (Number(row.Sex) === 2 ? 1 : 0); };
    if (spec.indexOf('s_avor') !== -1)
      return function (row) { return row.AVor == null ? null : (Number(row.AVor) === 6 ? 1 : 0); };
    var m = /^str_detect\((HD|NebDia|AllDia|AllBeh)\s*,\s*'([^']*)'\)$/.exec(spec.trim());
    if (m) {
      var col = m[1];
      var pats = m[2].split('|').map(function (e) {
        if (col === 'AllBeh') return e.charAt(0) === ' ' ? e : ' ' + e;
        return e;
      });
      return function (row) {
        var s = row[col];
        if (s == null) return 0;
        s = String(s);
        for (var i = 0; i < pats.length; i++) if (s.indexOf(pats[i]) !== -1) return 1;
        return 0;
      };
    }
    throw new Error('GLM-Term nicht unterstützt: ' + term.term + ' / ' + spec);
  }

  // glmYears: { '2022': [terme], '2023': [...], ... } (glm_riskAdj_v55.json)
  // Jahreswahl: exakt, sonst neuestes Jahr <= Falljahr, sonst neuestes.
  function compileGlm(glmYears) {
    var models = {};
    var years = Object.keys(glmYears).map(Number).sort(function (a, b) { return a - b; });
    years.forEach(function (y) {
      models[y] = glmYears[y].map(function (t) {
        return { est: Number(t.estimate), f: compileGlmTerm(t) };
      });
    });
    function pickYear(jahr) {
      var pick = null;
      for (var i = 0; i < years.length; i++) if (jahr != null && years[i] <= jahr) pick = years[i];
      return pick === null ? years[years.length - 1] : pick;
    }
    var scorer = function (row) {
      var terms = models[pickYear(row.Jahr != null ? Number(row.Jahr) : null)];
      var lp = 0;
      for (var i = 0; i < terms.length; i++) {
        var x = terms[i].f(row);
        if (x == null) return null;                    // Merkmal fehlt -> kein p
        lp += terms[i].est * x;
      }
      return 1 / (1 + Math.exp(-lp));
    };
    scorer.modelYear = function (row) {
      return pickYear(row && row.Jahr != null ? Number(row.Jahr) : null);
    };
    return scorer;
  }

  // ------------------------------------------ fCHIQI-Evaluator (R-Dialekt) --
  // Unterstützt: str_detect(col, 'a|b'|Listenname), is.na(col), ==, !=, <,
  // >, <=, >=, %between% c(lo,hi), %in%/%notin% c(...), &, |, !, Klammern.
  // Dreiwertige Logik wie R (NA); ein NA-Gesamtergebnis zählt als false
  // (dplyr/data.table-Filtersemantik). Muster werden als Substrings
  // interpretiert (BAG nutzt nur Alternationen von Codes).

  function tokenizeR(s) {
    var toks = [], i = 0, n = s.length;
    while (i < n) {
      var c = s[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === "'") {
        var j = s.indexOf("'", i + 1);
        if (j === -1) throw new Error('Unbeendetes String-Literal: ' + s.slice(i, i + 30));
        toks.push({ t: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue;
      }
      if (c >= '0' && c <= '9') {
        var m = /^\d+(\.\d+)?/.exec(s.slice(i));
        toks.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue;
      }
      if (/[A-Za-z_.]/.test(c)) {
        var w = /^[A-Za-z_.][A-Za-z0-9_.]*/.exec(s.slice(i))[0];
        toks.push({ t: 'id', v: w }); i += w.length; continue;
      }
      if (c === '%') {
        var mm = /^%[a-z]+%/.exec(s.slice(i));
        if (!mm) throw new Error('Unbekannter %-Operator: ' + s.slice(i, i + 12));
        toks.push({ t: 'op', v: mm[0] }); i += mm[0].length; continue;
      }
      if ((c === '=' || c === '!' || c === '<' || c === '>') && s[i + 1] === '=') {
        toks.push({ t: 'op', v: c + '=' }); i += 2; continue;
      }
      if ('!<>&|(),$'.indexOf(c) !== -1) { toks.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('Unerwartetes Zeichen "' + c + '" in Filter: …' + s.slice(Math.max(0, i - 20), i + 10) + '…');
    }
    return toks;
  }

  function RParser(toks, ctx) { this.toks = toks; this.p = 0; this.ctx = ctx; this.lists = ctx.lists; }
  RParser.prototype.peek = function () { return this.toks[this.p]; };
  RParser.prototype.next = function () { return this.toks[this.p++]; };
  RParser.prototype.expect = function (t, v) {
    var tok = this.next();
    if (!tok || tok.t !== t || (v !== undefined && tok.v !== v))
      throw new Error('Filter: erwartet ' + (v || t) + ', erhalten ' + JSON.stringify(tok));
    return tok;
  };
  RParser.prototype.parse = function () {
    if (!this.toks.length) throw new Error('Leere Filterdefinition');
    var e = this.orExpr();
    if (this.p < this.toks.length) throw new Error('Filter: überzählige Tokens ab ' + JSON.stringify(this.peek()));
    return e;
  };
  RParser.prototype.orExpr = function () {
    var l = this.andExpr();
    while (this.peek() && this.peek().t === 'op' && this.peek().v === '|') {
      this.next(); l = { k: 'ror', a: l, b: this.andExpr() };
    }
    return l;
  };
  RParser.prototype.andExpr = function () {
    var l = this.notExpr();
    while (this.peek() && this.peek().t === 'op' && this.peek().v === '&') {
      this.next(); l = { k: 'rand', a: l, b: this.notExpr() };
    }
    return l;
  };
  RParser.prototype.notExpr = function () {
    if (this.peek() && this.peek().t === 'op' && this.peek().v === '!') {
      this.next(); return { k: 'rnot', a: this.notExpr() };
    }
    return this.cmpExpr();
  };
  RParser.prototype.cVec = function () {
    this.expect('id', 'c'); this.expect('op', '(');
    var list = [];
    for (;;) {
      var el = this.next();
      if (!el || (el.t !== 'str' && el.t !== 'num')) throw new Error('c(): ' + JSON.stringify(el));
      list.push(el.v);
      var sep = this.next();
      if (sep && sep.v === ')') break;
      if (!sep || sep.v !== ',') throw new Error('c(): erwartet , oder )');
    }
    return list;
  };
  RParser.prototype.cmpExpr = function () {
    var left = this.primary();
    var tok = this.peek();
    if (tok && tok.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].indexOf(tok.v) !== -1) {
      this.next();
      return { k: 'rcmp', op: tok.v, a: left, b: this.primary() };
    }
    if (tok && tok.t === 'op' && tok.v === '%between%') {
      this.next(); var lohi = this.cVec();
      if (lohi.length !== 2) throw new Error('%between% braucht c(lo,hi)');
      return { k: 'rbetween', a: left, lo: lohi[0], hi: lohi[1] };
    }
    if (tok && tok.t === 'op' && (tok.v === '%in%' || tok.v === '%notin%')) {
      var op = this.next().v;
      var nx = this.peek();
      if (nx && nx.t === 'id' && nx.v === 'c') {
        return { k: op === '%in%' ? 'rin' : 'rnotin', a: left, list: this.cVec() };
      }
      // JID %in% SelGENOR_JID: Fall gehört zur jahresspezifischen
      // GENOR-Auswahl (äquivalent zu str_detect(AllBeh, genor_JJJJ))
      if (nx && nx.t === 'id' && /^SelGENOR(A308)?_JID$/.test(nx.v) &&
          left.k === 'col' && left.name === 'JID') {
        this.next();
        return { k: 'rgenor', neg: op === '%notin%',
                 base: nx.v.indexOf('A308') !== -1 ? 'SelGENORA308' : 'SelGENOR' };
      }
      // JID %in% CHIQI_<Name>_JID: Fall erfüllt den referenzierten Filter
      // (die JID-Menge ist in der BAG-Auswertung genau die Menge der Fälle,
      // die den Filter <Name> erfüllen)
      var mref = nx && nx.t === 'id' ? /^CHIQI_([A-Za-z0-9_]+)_JID$/.exec(nx.v) : null;
      if (mref && left.k === 'col' && left.name === 'JID' &&
          this.ctx.filters && this.ctx.filters[mref[1]] != null) {
        this.next();
        return { k: 'rref', ref: mref[1], neg: op === '%notin%' };
      }
      throw new Error('Filter: %in% auf Nicht-Vektor (Data-Frame-Konstrukt?) nicht unterstützt');
    }
    return left;                                       // boolescher Ausdruck (str_detect etc.)
  };
  RParser.prototype.primary = function () {
    var tok = this.next();
    if (!tok) throw new Error('Filter: Ausdruck unvollständig');
    if (tok.t === 'op' && tok.v === '(') {
      var e = this.orExpr(); this.expect('op', ')');
      return e;
    }
    if (tok.t === 'num') return { k: 'num', v: tok.v };
    if (tok.t === 'str') return { k: 'str', v: tok.v };
    if (tok.t === 'id') {
      var name = tok.v;
      if (this.peek() && this.peek().t === 'op' && this.peek().v === '$')
        throw new Error('Filter: Data-Frame-Konstrukt ' + name + '$… nicht unterstützt');
      if (this.peek() && this.peek().t === 'op' && this.peek().v === '(') {
        this.next();
        if (name === 'str_detect') {
          var col = this.expect('id').v; this.expect('op', ',');
          var arg = this.next(), pats;
          if (arg && arg.t === 'str') pats = arg.v.split('|');
          else if (arg && arg.t === 'id') {
            var lst = lookupList(this.lists, arg.v);
            if (!lst) throw new Error('Filter: Liste nicht auflösbar: ' + arg.v);
            pats = (typeof lst === 'string' ? lst.split('|') : lst).slice();
          } else throw new Error('str_detect: ' + JSON.stringify(arg));
          this.expect('op', ')');
          return { k: 'rdetect', col: col, pats: pats };
        }
        if (name === 'is.na') {
          var col2 = this.expect('id').v; this.expect('op', ')');
          return { k: 'risna', col: col2 };
        }
        throw new Error('Filter: unbekannte Funktion ' + name);
      }
      return { k: 'col', name: name };
    }
    throw new Error('Filter: unerwartetes Token ' + JSON.stringify(tok));
  };

  // Dreiwertige Auswertung: true / false / null (NA)
  function evalR(node, row, ctx) {
    switch (node.k) {
      case 'rand': {
        var a = evalR(node.a, row, ctx), b = evalR(node.b, row, ctx);
        if (a === false || b === false) return false;
        if (a === null || b === null) return null;
        return true;
      }
      case 'ror': {
        var a2 = evalR(node.a, row, ctx), b2 = evalR(node.b, row, ctx);
        if (a2 === true || b2 === true) return true;
        if (a2 === null || b2 === null) return null;
        return false;
      }
      case 'rnot': {
        var x = evalR(node.a, row, ctx);
        return x === null ? null : !x;
      }
      case 'rdetect': {
        var s = row[node.col];
        if (s == null) return null;                    // R: str_detect(NA) = NA
        s = String(s);
        for (var i = 0; i < node.pats.length; i++)
          if (s.indexOf(node.pats[i]) !== -1) return true;
        return false;
      }
      case 'risna': return row[node.col] == null;
      case 'rgenor': {
        // Mengen-Semantik: Fälle mit NA-AllBeh sind nicht in der JID-Menge
        var beh = row.AllBeh, hitG = false;
        if (beh != null) {
          beh = String(beh);
          var jahrG = row.Jahr != null ? Number(row.Jahr) : null;
          var key = node.base + '|' + jahrG;
          var lst = ctx.rlCache[key];
          if (lst === undefined) {
            lst = resolveList(ctx.lists, node.base, jahrG);
            ctx.rlCache[key] = lst;
          }
          if (!lst) throw new Error('Laufzeitliste nicht auflösbar: ' + node.base);
          for (var g = 0; g < lst.length; g++)
            if (beh.indexOf(lst[g]) !== -1) { hitG = true; break; }
        }
        return node.neg ? !hitG : hitG;
      }
      case 'rref': {
        var sub = ctx.compiled[node.ref];
        if (!sub) {
          if (ctx.building[node.ref]) throw new Error('Zyklus in Filter-Referenz: ' + node.ref);
          ctx.building[node.ref] = true;
          sub = ctx.compiled[node.ref] = new RParser(tokenizeR(ctx.filters[node.ref]), ctx).parse();
          delete ctx.building[node.ref];
        }
        // Mengen-Semantik: nur Fälle mit Filter=TRUE sind in der JID-Menge
        var inSet = evalR(sub, row, ctx) === true;
        return node.neg ? !inSet : inSet;
      }
      case 'rbetween': {
        var v = rval(node.a, row, ctx);
        if (v == null) return null;
        return Number(v) >= node.lo && Number(v) <= node.hi;
      }
      case 'rin': case 'rnotin': {
        var v2 = rval(node.a, row, ctx);
        if (v2 == null) return null;
        var hit = false;
        for (var j = 0; j < node.list.length; j++)
          if (String(v2) === String(node.list[j])) { hit = true; break; }
        return node.k === 'rin' ? hit : !hit;
      }
      case 'rcmp': {
        var l = rval(node.a, row, ctx), r = rval(node.b, row, ctx);
        if (l == null || r == null) return null;
        if (typeof l === 'number' || typeof r === 'number') { l = Number(l); r = Number(r); }
        switch (node.op) {
          case '==': return l === r || String(l) === String(r);
          case '!=': return !(l === r || String(l) === String(r));
          case '<': return l < r;
          case '>': return l > r;
          case '<=': return l <= r;
          case '>=': return l >= r;
        }
      }
    }
    throw new Error('evalR: ' + node.k);
  }
  function rval(node, row, ctx) {
    if (node.k === 'num' || node.k === 'str') return node.v;
    if (node.k === 'col') { var v = row[node.name]; return v === undefined ? null : v; }
    // boolesche Teilausdruecke als 0/1 (BAG schreibt teils str_detect(...)>0)
    var b = evalR(node, row, ctx);
    return b === null ? null : (b ? 1 : 0);
  }

  // compileFilter(expr, lists, filters) -> function(row) -> boolean (NA -> false)
  // filters: Map Name -> fCHIQI-Ausdruck (für JID-Referenzen wie CHIQI_I6_01_F_JID)
  function compileFilter(expr, lists, filters) {
    var ctx = { lists: lists || {}, filters: filters || {}, compiled: {}, building: {}, rlCache: {} };
    var ast = new RParser(tokenizeR(expr), ctx).parse();
    return function (row) { return evalR(ast, row, ctx) === true; };
  }

  // ------------------------------------------------- Indikator-Berechnung --

  // 5-Jahres-Altersgruppe wie in den BAG-Referenzdaten: 0-4 -> 1, 5-9 -> 2, …
  function altEGrp(alter) { return Math.floor(alter / 5) + 1; }

  /**
   * Erstellt eine gemeinsame fallbezogene Auswertung. Dieselbe Auswertung
   * speist sowohl die Aggregation als auch die lokale QM-Fallreview-Ansicht.
   * Dadurch sind n, O und E jederzeit auf die angezeigten Fälle rückführbar.
   */
  function createIndicatorEvaluator(ind, lists) {
    var fF = compile(ind.sqlF, lists), fM = compile(ind.sqlM, lists);
    var refMap = {}, refGrpBySex = {};
    (ind.refStrata || []).forEach(function (s) {
      refMap[s.altEGrp + '|' + s.sex] = s.pCH;
      var g = refGrpBySex[s.sex] || (refGrpBySex[s.sex] = { min: s.altEGrp, max: s.altEGrp });
      if (s.altEGrp < g.min) g.min = s.altEGrp;
      if (s.altEGrp > g.max) g.max = s.altEGrp;
    });
    var glmP = ind.glm ? compileGlm(ind.glm) : null;

    return function (c, caseIndex) {
      var row = caseToRow(c);
      var ruleMatch = fF(row);
      var denominator = !c.nochHospitalisiert && ruleMatch;
      var numerator = denominator && fM(row);
      var expectedAgeSex = null, expectedGlm = null, refGroup = null;

      if (denominator && ind.refStrata && row.AltE != null && row.Sex != null) {
        // Offene Randgruppen: die BAG-Referenz endet oben bei 95-99 (bzw.
        // beginnt bei der ersten belegten Gruppe). Ein Hochbetagter >= 100
        // ergibt sonst eine Gruppe ohne Referenzrate und wurde faelschlich
        // aus E verworfen (refMiss); das senkt E und hebt den SMR. IQM/BAG
        // behandeln die aeusserste Gruppe als offen, daher auf den belegten
        // Bereich des jeweiligen Geschlechts clampen.
        var g = refGrpBySex[row.Sex], grp = altEGrp(row.AltE);
        if (g) { if (grp > g.max) grp = g.max; else if (grp < g.min) grp = g.min; }
        var p = refMap[grp + '|' + row.Sex];
        refGroup = grp + '|' + row.Sex;
        if (p !== undefined) expectedAgeSex = p;
      }
      if (denominator && glmP) {
        expectedGlm = glmP(row);
      }
      var expected = denominator ? (glmP ? expectedGlm : expectedAgeSex) : null;
      var outcomeMissing = denominator && row.EAus == null;
      var expectedMissing = denominator && expected == null;
      var reason = denominator ? 'included'
        : (c.nochHospitalisiert ? 'still_hospitalized' : 'definition_not_matched');

      return {
        caseIndex: caseIndex,
        caseId: c.fallId,
        burnr: c.burnr,
        denominator: denominator,
        numerator: numerator,
        expected: expected,
        expectedAgeSex: denominator ? expectedAgeSex : null,
        adjustment: glmP ? 'GLM (differenziertes Risikomodell)'
                         : (ind.refStrata ? 'Alter/Geschlecht' : null),
        modelYear: denominator && glmP && glmP.modelYear ? glmP.modelYear(row) : null,
        refGroup: denominator ? refGroup : null,
        expectedMissing: expectedMissing,
        outcomeMissing: outcomeMissing,
        ruleMatch: ruleMatch,
        reason: reason,
        qualityFlags: [
          outcomeMissing ? 'OUTCOME_MISSING' : null,
          expectedMissing ? 'EXPECTED_MISSING' : null
        ].filter(Boolean)
      };
    };
  }

  function evaluateIndicatorCases(cases, ind, lists) {
    var evaluate = createIndicatorEvaluator(ind, lists);
    return cases.map(function (c, i) { return evaluate(c, i); });
  }

  /**
   * computeIndicator(cases, indicator) -> Ergebnis
   * indicator: { id, label, sqlF, sqlM, refStrata:[{altEGrp,sex,pCH}], refJahr }
   * Nur ausgetretene Fälle werden gezählt (CH-IQI zählt Austritte).
   */
  function computeIndicator(cases, ind, lists) {
    var evaluations = evaluateIndicatorCases(cases, ind, lists);
    var n = 0, O = 0, EPartial = 0, refMisses = 0, outcomeMisses = 0;
    var faelleF = [], modelYears = {};
    evaluations.forEach(function (ev) {
      if (!ev.denominator) return;
      n++;
      faelleF.push(ev.caseId);
      if (ev.numerator) O++;
      if (ev.outcomeMissing) outcomeMisses++;
      if (ev.expectedMissing) refMisses++;
      else if (ev.expected != null) EPartial += ev.expected;
      if (ev.modelYear != null) modelYears[ev.modelYear] = true;
    });

    // Ein Erwartungswert aus nur einem Teil des Nenners würde den SMR
    // systematisch verzerren. Deshalb wird E/SMR bei jeder Lücke gesperrt.
    var hasExpected = !!ind.refStrata || !!ind.glm;
    var Eeff = hasExpected && refMisses === 0 ? EPartial : null;
    var outcomeComplete = outcomeMisses === 0;
    var res = {
      id: ind.id, label: ind.label,
      n: n, O: O,
      rate: n > 0 && outcomeComplete ? O / n : null,
      E: Eeff,
      EPartial: hasExpected ? EPartial : null,
      smr: Eeff != null && Eeff > 0 && outcomeComplete ? O / Eeff : null,
      adjustierung: ind.glm ? 'GLM (differenziertes Risikomodell)' : (ind.refStrata ? 'Alter/Geschlecht' : null),
      EAlterGeschlecht: null,
      refJahr: ind.refJahr || null,
      refMisses: refMisses,
      outcomeMisses: outcomeMisses,
      modelYears: Object.keys(modelYears).map(Number).sort(function (a, b) { return a - b; }),
      dataComplete: refMisses === 0 && outcomeMisses === 0,
      fallIds: faelleF
    };
    if (ind.refStrata) {
      var ageSexSum = 0, ageSexMisses = 0;
      evaluations.forEach(function (ev) {
        if (!ev.denominator) return;
        if (ev.expectedAgeSex == null) ageSexMisses++;
        else ageSexSum += ev.expectedAgeSex;
      });
      res.EAlterGeschlecht = ageSexMisses === 0 ? ageSexSum : null;
    }
    return res;
  }

  function computeAll(cases, indicators, lists) {
    return indicators.map(function (ind) { return computeIndicator(cases, ind, lists); });
  }

  return {
    compile: compile,
    compileGlm: compileGlm,
    compileFilter: compileFilter,
    caseToRow: caseToRow,
    createIndicatorEvaluator: createIndicatorEvaluator,
    evaluateIndicatorCases: evaluateIndicatorCases,
    computeIndicator: computeIndicator,
    computeAll: computeAll,
    altEGrp: altEGrp,
    ENGINE_VERSION: ENGINE_VERSION
  };
});
