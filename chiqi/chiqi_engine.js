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
 * IS NULL, =, <>, <, >, <=, >=, AND, OR, NOT, Klammern.
 *
 * Erwartungswerte: indirekte Standardisierung nach Alter (5er-Gruppen)
 * und Geschlecht mit den offiziellen BAG-Referenzdaten (pCH pro Stratum):
 *   E = Σ über Nenner-Fälle: pCH(AltEGrp, Sex)
 *
 * Lizenz: MIT (Bestandteil von CH-IQI Kompass)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.ChiqiEngine = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ENGINE_VERSION = '0.1.0';

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
  function Parser(tokens) { this.toks = tokens; this.p = 0; }
  Parser.prototype.peek = function () { return this.toks[this.p]; };
  Parser.prototype.next = function () { return this.toks[this.p++]; };
  Parser.prototype.expect = function (t, v) {
    var tok = this.next();
    if (!tok || tok.t !== t || (v !== undefined && tok.v !== v))
      throw new Error('Erwartet ' + (v || t) + ', erhalten ' + JSON.stringify(tok));
    return tok;
  };

  Parser.prototype.parse = function () {
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
          var pat = this.expect('str').v; this.expect('op', ')');
          return { k: 'instr', col: col2, pat: pat };
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
    if (!tok) throw new Error('Prädikat unvollständig');
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
    throw new Error('Unerwartetes Prädikat-Token: ' + JSON.stringify(tok));
  };

  function compile(sql) {
    var ast = new Parser(tokenize(sql)).parse();
    return function (row) { return evalNode(ast, row); };
  }

  function evalValue(node, row) {
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
    }
    throw new Error('evalValue: ' + node.k);
  }

  // SQL-Semantik: Vergleich mit NULL -> false (vereinfachte 3-wertige Logik)
  function evalNode(node, row) {
    switch (node.k) {
      case 'and': return evalNode(node.a, row) && evalNode(node.b, row);
      case 'or': return evalNode(node.a, row) || evalNode(node.b, row);
      case 'not': return !evalNode(node.a, row);
      case 'isnull': return evalValue(node.a, row) == null;
      case 'notnull': return evalValue(node.a, row) != null;
      case 'in': {
        var v = evalValue(node.a, row);
        if (v == null) return false;
        for (var i = 0; i < node.list.length; i++) {
          if (String(v) === String(node.list[i])) return true;
        }
        return false;
      }
      case 'between': {
        var x = evalValue(node.a, row);
        if (x == null) return false;
        return x >= evalValue(node.lo, row) && x <= evalValue(node.hi, row);
      }
      case 'cmp': {
        var a = evalValue(node.a, row), b = evalValue(node.b, row);
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
      VitalStat: c.neugeborene && c.neugeborene.vitalstatus != null
                 ? parseInt(c.neugeborene.vitalstatus, 10) : null,
      GebGew: c.neugeborene && c.neugeborene.geburtsgewicht != null
              ? parseInt(c.neugeborene.geburtsgewicht, 10) : null,
      AufGew: c._admin && c._admin.aufnahmegewicht != null
              ? parseInt(c._admin.aufnahmegewicht, 10) : null
    };
  }

  // ------------------------------------------------- Indikator-Berechnung --

  // 5-Jahres-Altersgruppe wie in den BAG-Referenzdaten: 0-4 -> 1, 5-9 -> 2, …
  function altEGrp(alter) { return Math.floor(alter / 5) + 1; }

  /**
   * computeIndicator(cases, indicator) -> Ergebnis
   * indicator: { id, label, sqlF, sqlM, refStrata:[{altEGrp,sex,pCH}], refJahr }
   * Nur ausgetretene Fälle werden gezählt (CH-IQI zählt Austritte).
   */
  function computeIndicator(cases, ind) {
    var fF = compile(ind.sqlF), fM = compile(ind.sqlM);
    var refMap = {};
    (ind.refStrata || []).forEach(function (s) { refMap[s.altEGrp + '|' + s.sex] = s.pCH; });

    var n = 0, O = 0, E = 0, refMisses = 0;
    var faelleF = [];
    cases.forEach(function (c) {
      if (c.nochHospitalisiert) return;
      var row = caseToRow(c);
      if (!fF(row)) return;
      n++;
      faelleF.push(c.fallId);
      if (fM(row)) O++;
      if (ind.refStrata && row.AltE != null && row.Sex != null) {
        var p = refMap[altEGrp(row.AltE) + '|' + row.Sex];
        if (p !== undefined) E += p; else refMisses++;
      }
    });

    var res = {
      id: ind.id, label: ind.label,
      n: n, O: O,
      rate: n > 0 ? O / n : null,
      E: ind.refStrata ? E : null,
      smr: ind.refStrata && E > 0 ? O / E : null,
      refJahr: ind.refJahr || null,
      refMisses: refMisses,
      fallIds: faelleF
    };
    return res;
  }

  function computeAll(cases, indicators) {
    return indicators.map(function (ind) { return computeIndicator(cases, ind); });
  }

  return {
    compile: compile,
    caseToRow: caseToRow,
    computeIndicator: computeIndicator,
    computeAll: computeAll,
    altEGrp: altEGrp,
    ENGINE_VERSION: ENGINE_VERSION
  };
});
