/* CH-IQI Kompass UI kit. Source of truth: docs/DESIGN_LANGUAGE.md (§3).
   Classic script (no modules, no build) so pages work from file:// and Pages.
   Every helper that takes text HTML-escapes it. A byte-identical copy lives in
   chiqi/ui/ so each folder runs standalone. */
(function (root) {
  'use strict';

  var doc = root.document;
  var MISSING = '–';
  var MINUS = '−';

  // ---------- Escaping ----------
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---------- 3.1 Numbers ----------
  function finite(v) { return v !== null && v !== undefined && v !== '' && isFinite(Number(v)); }
  /* Deterministic de-CH format: grouping U+2019, decimal point. Built by hand
     because toLocaleString('de-CH') differs between ICU versions and browsers. */
  var GROUP = '\u2019';
  function dec(v, digits) {
    if (!finite(v)) return MISSING;
    var d = digits == null ? 2 : digits, n = Number(v);
    var r = Number(Math.round(Number(Math.abs(n) + 'e' + d)) + 'e-' + d);
    var parts = r.toFixed(d).split('.');
    var text = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, GROUP) + (parts[1] ? '.' + parts[1] : '');
    return n < 0 && r !== 0 ? '-' + text : text;
  }
  /** Rounded value with sign always (+/U+2212); zero stays unsigned. */
  function signedDec(v, digits) {
    if (!finite(v)) return MISSING;
    var f = Math.pow(10, digits), r = Math.round(Number(v) * f) / f;
    var t = dec(Math.abs(r), digits);
    return r > 0 ? '+' + t : (r < 0 ? MINUS + t : t);
  }
  var fmt = {
    missing: MISSING,
    /** Integer count with de-CH grouping: 1’234 */
    n: function (v) { return dec(v, 0); },
    /** Plain decimal with fixed digits */
    dec: dec,
    /** O/E or SMR, 2 decimals */
    oe: function (v) { return dec(v, 2); },
    /** Value already in percent units (3.4 → 3.4%) */
    pct: function (v, digits) { return finite(v) ? dec(v, digits == null ? 1 : digits) + '%' : MISSING; },
    /** Fraction (0.034 → 3.4%) */
    share: function (v, digits) { return finite(v) ? dec(Number(v) * 100, digits == null ? 1 : digits) + '%' : MISSING; },
    /** Expected events E, 1 decimal by default */
    expected: function (v, digits) { return dec(v, digits == null ? 1 : digits); },
    /** z value: 1 decimal, sign always, typographic minus */
    z: function (v) { return signedDec(v, 1); },
    /** Signed difference with typographic minus */
    delta: function (v, digits) { return signedDec(v, digits == null ? 2 : digits); },
    /** Period label: '19' | '24' | [from, to] */
    period: function (p) {
      if (p === '19') return '2019–2023';
      if (p === '24') return '2024';
      if (Array.isArray(p)) return p[0] === p[1] ? String(p[0]) : p[0] + '–' + p[1];
      return String(p == null ? MISSING : p);
    },
    /** 24.09.2026 */
    date: function (value) {
      if (!value) return MISSING;
      var d = value instanceof Date ? value : new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    /** 24. September 2026 (report covers) */
    dateLong: function (value) {
      var d = value ? new Date(value) : new Date();
      return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
    },
    time: function (value) {
      var d = value ? new Date(value) : new Date();
      return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    }
  };

  /** Number wrapped for tables: tabular, accessible missing value */
  function num(text) {
    return text === MISSING
      ? '<span class="k-num" aria-label="nicht verfügbar">' + MISSING + '</span>'
      : '<span class="k-num">' + esc(text) + '</span>';
  }

  // ---------- Icons (Lucide, ISC licence) ----------
  var ICONS = {
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
  };
  function icon(name, opts) {
    var o = opts || {};
    var body = ICONS[name];
    if (!body) throw new Error('KompassUI.icon: unknown icon ' + name);
    return '<svg class="k-icon' + (o.small ? ' k-icon--sm' : '') + (o.cls ? ' ' + esc(o.cls) : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  /** Brand mark: ring plus needle. The needle half uses the needle token. */
  function mark(cls) {
    return '<svg class="k-mark' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.75"/>' +
      '<g transform="rotate(35 12 12)"><path d="M12 4.6 14.3 12H9.7Z" class="k-mark__needle"/>' +
      '<path d="M9.7 12h4.6L12 19.4Z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></g></svg>';
  }

  // ---------- 3.2 Badge ----------
  /** One vocabulary for statistical signals (§2.4). Callers pass the signal, never the words. */
  var SIGNALS = {
    high: { label: 'signifikant erhöht', mark: '▲' },
    low: { label: 'signifikant tiefer', mark: '▼' },
    deviant: { label: 'abweichend', mark: '◆' },
    inconspicuous: { label: 'unauffällig', mark: '' },
    'not-assessable': { label: 'n. b.', mark: '' }
  };
  var TONES = { ok: 1, caution: 1, danger: 1, info: 1, neutral: 1 };
  function signalLabel(signal) {
    var s = SIGNALS[signal];
    if (!s) throw new Error('KompassUI: unknown signal ' + signal);
    return s.label;
  }
  function badge(opts) {
    var o = opts || {};
    if (o.signal) {
      var s = SIGNALS[o.signal];
      if (!s) throw new Error('KompassUI.badge: unknown signal ' + o.signal);
      var label = o.label || s.label;
      return '<span class="k-badge" data-signal="' + o.signal + '"' + (o.title ? ' title="' + esc(o.title) + '"' : '') + '>' +
        (s.mark ? '<span class="k-badge__mark" aria-hidden="true">' + s.mark + '</span>' : '') + esc(label) + '</span>';
    }
    var tone = o.tone || 'neutral';
    if (!TONES[tone]) throw new Error('KompassUI.badge: unknown tone ' + tone);
    return '<span class="k-badge" data-tone="' + tone + '">' + (o.icon ? icon(o.icon, { small: true }) : '') + esc(o.label) + '</span>';
  }
  /** Single-line state text with an icon: import status, save state, validation */
  function tone(t, text, iconName) {
    var defaults = { ok: 'check', caution: 'alert', danger: 'x', info: 'info' };
    var name = iconName === undefined ? defaults[t] : iconName;
    return '<span class="k-tone" data-tone="' + t + '">' + (name ? icon(name) : '') + '<span>' + esc(text) + '</span></span>';
  }
  function trendMark(signal) {
    if (signal === 'high') return '<span class="k-trend" data-signal="high" title="Anstieg gegenüber Baseline">▲</span>';
    if (signal === 'low') return '<span class="k-trend" data-signal="low" title="Rückgang gegenüber Baseline">▼</span>';
    if (signal === 'inconspicuous') return '<span class="k-trend" data-signal="inconspicuous" title="keine signifikante Veränderung">→</span>';
    return '<span class="k-trend" data-signal="inconspicuous" aria-label="nicht verfügbar">' + MISSING + '</span>';
  }

  // ---------- 3.3 InfoTip and Hint ----------
  var tipCount = 0;
  /** text: plain string or array of paragraphs. Content is text only (no links). */
  function infoTip(topic, text) {
    var id = 'k-tip-' + (++tipCount) + '-' + Math.random().toString(36).slice(2, 7);
    var paras = Array.isArray(text) ? text : [text];
    return '<button type="button" class="k-infotip" aria-label="Über ' + esc(topic) + '" aria-expanded="false" aria-describedby="' + id + '" data-k-tip="' + id + '">' +
      icon('info', { small: true }) + '</button>' +
      '<template id="' + id + '-c">' + paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</template>';
  }
  function hint(text, id) { return '<p class="k-hint"' + (id ? ' id="' + esc(id) + '"' : '') + '>' + esc(text) + '</p>'; }

  var tip = { btn: null, pop: null, pinned: false, openTimer: 0, closeTimer: 0 };
  function tipContent(btn) {
    var id = btn.getAttribute('data-k-tip');
    var tpl = doc.getElementById(id + '-c');
    if (tpl) return tpl.innerHTML;
    var src = btn.getAttribute('data-k-tip-text');
    return src ? '<p>' + esc(src) + '</p>' : '';
  }
  function placePop() {
    if (!tip.btn || !tip.pop) return;
    var r = tip.btn.getBoundingClientRect(), p = tip.pop.getBoundingClientRect();
    var vw = root.innerWidth, vh = root.innerHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - p.width / 2), vw - p.width - 8);
    var top = r.bottom + 6;
    if (top + p.height > vh - 8) top = Math.max(8, r.top - p.height - 6);
    tip.pop.style.left = left + 'px';
    tip.pop.style.top = top + 'px';
  }
  function openTip(btn, pinned) {
    clearTimeout(tip.closeTimer); clearTimeout(tip.openTimer);
    if (tip.btn && tip.btn !== btn) closeTip(false);
    if (!tip.pop) {
      tip.pop = doc.createElement('div');
      tip.pop.className = 'k-pop';
      tip.pop.setAttribute('role', 'tooltip');
      tip.pop.addEventListener('mouseenter', function () { clearTimeout(tip.closeTimer); });
      tip.pop.addEventListener('mouseleave', function () { if (!tip.pinned) scheduleClose(); });
      doc.body.appendChild(tip.pop);
    }
    tip.btn = btn;
    tip.pinned = tip.pinned || !!pinned;
    tip.pop.id = btn.getAttribute('data-k-tip');
    tip.pop.innerHTML = tipContent(btn);
    tip.pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    placePop();
  }
  function closeTip(returnFocus) {
    clearTimeout(tip.closeTimer); clearTimeout(tip.openTimer);
    if (tip.pop) { tip.pop.hidden = true; tip.pop.removeAttribute('id'); }
    if (tip.btn) {
      tip.btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) tip.btn.focus();
    }
    tip.btn = null; tip.pinned = false;
  }
  function scheduleClose() { clearTimeout(tip.closeTimer); tip.closeTimer = setTimeout(function () { closeTip(false); }, 150); }

  // ---------- 3.4 Readout and Disclosure ----------
  function readout(o) {
    return '<div class="k-readout"' + (o.id ? ' id="' + esc(o.id) + '"' : '') + '>' +
      '<div class="k-readout__label">' + esc(o.label) + (o.signal ? ' ' + badge({ signal: o.signal, label: o.signalLabel }) : '') + '</div>' +
      '<div class="k-readout__value"' + (o.valueId ? ' id="' + esc(o.valueId) + '"' : '') + '>' + esc(o.value) + '</div>' +
      '<div class="k-readout__meta"' + (o.metaId ? ' id="' + esc(o.metaId) + '"' : '') + '>' + esc(o.meta || '') + '</div></div>';
  }
  function storage() { try { return root.localStorage; } catch (e) { return null; } }
  function initDisclosures(scope) {
    var s = storage();
    var list = (scope || doc).querySelectorAll('details[data-k-persist]');
    Array.prototype.forEach.call(list, function (d) {
      if (d.__kBound) return;
      d.__kBound = true;
      var key = 'kompass.disclosure.' + d.getAttribute('data-k-persist');
      try { var v = s && s.getItem(key); if (v === '1') d.open = true; if (v === '0') d.open = false; } catch (e) { /* storage unavailable */ }
      d.addEventListener('toggle', function () { try { if (s) s.setItem(key, d.open ? '1' : '0'); } catch (e) { /* ignore */ } });
    });
  }

  // ---------- 3.8 Confirm ----------
  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var dlg = doc.createElement('dialog');
      dlg.className = 'k-dialog';
      dlg.setAttribute('aria-labelledby', 'k-dlg-title');
      dlg.innerHTML = '<h2 id="k-dlg-title">' + esc(o.title) + '</h2>' + (o.body ? '<p>' + esc(o.body) + '</p>' : '') +
        '<div class="k-dialog__actions"><button type="button" class="k-btn" data-k-cancel>' + esc(o.cancel || 'Abbrechen') + '</button>' +
        '<button type="button" class="k-btn ' + (o.destructive ? 'k-btn--danger' : 'k-btn--primary') + '" data-k-ok>' + esc(o.action) + '</button></div>';
      doc.body.appendChild(dlg);
      var done = false;
      function finish(v) { if (done) return; done = true; if (dlg.open) dlg.close(); dlg.remove(); resolve(v); }
      dlg.querySelector('[data-k-cancel]').addEventListener('click', function () { finish(false); });
      dlg.querySelector('[data-k-ok]').addEventListener('click', function () { finish(true); });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); finish(false); });
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      dlg.querySelector('[data-k-cancel]').focus();
    });
  }

  // ---------- Button busy state ----------
  function busy(button, on) {
    if (!button) return;
    if (on) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      if (!button.querySelector('.k-spinner')) button.insertAdjacentHTML('afterbegin', '<span class="k-spinner" aria-hidden="true"></span>');
    } else {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      var sp = button.querySelector('.k-spinner'); if (sp) sp.remove();
    }
  }

  // ---------- Tokens and charts (§4) ----------
  /* Light fallbacks for environments without computed styles (tests, print
     snapshots before CSS loads). test_ui_kit.mjs checks they equal kompass.css. */
  var TOKEN_FALLBACK = {
    canvas: '#F3F5F8', card: '#FFFFFF', border: '#DCE2E9', foreground: '#0E1A2B',
    'subtle-foreground': '#34445A', 'muted-foreground': '#586677', needle: '#A87700',
    'chart-point': '#8592A2', 'chart-limit': '#6B7889', high: '#B0232A', low: '#1D58A3',
    deviant: '#5A3E9E', inconspicuous: '#475466'
  };
  function token(name) {
    try {
      if (doc && root.getComputedStyle) {
        var v = root.getComputedStyle(doc.documentElement).getPropertyValue('--k-' + name).trim();
        if (v && v.indexOf('var(') !== 0) return v;
        if (name === 'chart-reference') return token('foreground');
        if (name === 'chart-grid') return token('border');
      }
    } catch (e) { /* fall through */ }
    if (name === 'chart-reference') return TOKEN_FALLBACK.foreground;
    if (name === 'chart-grid') return TOKEN_FALLBACK.border;
    return TOKEN_FALLBACK[name] || TOKEN_FALLBACK.foreground;
  }
  /** Hatched fill for preliminary data (§4.2), so "vorläufig" never depends on colour. */
  function hatch(color) {
    if (!doc || !doc.createElement) return color;
    var c = doc.createElement('canvas');
    c.width = 8; c.height = 8;
    var ctx = c.getContext && c.getContext('2d');
    if (!ctx) return color;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, 10); ctx.lineTo(10, -2); ctx.moveTo(-2, 2); ctx.lineTo(2, -2); ctx.moveTo(6, 10); ctx.lineTo(10, 6); ctx.stroke();
    return ctx.createPattern(c, 'repeat') || color;
  }
  function chartTheme(Chart) {
    if (!Chart || !Chart.defaults) return;
    var d = Chart.defaults;
    d.font.family = 'ui-sans-serif, system-ui, "Segoe UI Variable", "Segoe UI", -apple-system, Roboto, sans-serif';
    d.font.size = 11;
    d.color = token('muted-foreground');
    d.borderColor = token('chart-grid');
    d.animation = false;
    d.maintainAspectRatio = false;
    d.plugins.legend.display = false;
    var t = d.plugins.tooltip;
    t.backgroundColor = token('card');
    t.titleColor = token('foreground');
    t.bodyColor = token('subtle-foreground');
    t.borderColor = token('border');
    t.borderWidth = 1;
    t.cornerRadius = 6;
    t.padding = 10;
    t.boxPadding = 4;
    t.titleFont = { weight: '600', size: 12 };
    t.bodyFont = { size: 12 };
    t.usePointStyle = true;
  }
  function onThemeChange(fn) {
    if (!root.matchMedia) return;
    var mq = root.matchMedia('(prefers-color-scheme: dark)');
    var cb = function () { fn(); };
    if (mq.addEventListener) mq.addEventListener('change', cb); else if (mq.addListener) mq.addListener(cb);
  }

  // ---------- Page wiring ----------
  /** Static markup shorthands: <i data-k-icon="lock"></i>, <button class="k-infotip" data-k-tip="id"></button>, <span data-k-mark></span> */
  function upgrade(scope) {
    var s = scope || doc;
    Array.prototype.forEach.call(s.querySelectorAll('[data-k-icon]'), function (el) {
      el.outerHTML = icon(el.getAttribute('data-k-icon'), { small: el.hasAttribute('data-k-small'), cls: el.className });
    });
    Array.prototype.forEach.call(s.querySelectorAll('[data-k-mark]'), function (el) { el.outerHTML = mark(); });
    Array.prototype.forEach.call(s.querySelectorAll('.k-infotip[data-k-tip]'), function (el) {
      if (!el.innerHTML.trim()) el.innerHTML = icon('info', { small: true });
      if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-describedby', el.getAttribute('data-k-tip'));
      el.type = 'button';
    });
  }

  function init(scope) {
    upgrade(scope);
    initDisclosures(scope);
    if (doc.__kInit) return;
    doc.__kInit = true;
    doc.addEventListener('mouseover', function (e) {
      var b = e.target.closest && e.target.closest('[data-k-tip]');
      if (!b || tip.pinned) return;
      clearTimeout(tip.closeTimer);
      if (tip.btn === b) return;
      clearTimeout(tip.openTimer);
      tip.openTimer = setTimeout(function () { openTip(b, false); }, 300);
    });
    doc.addEventListener('mouseout', function (e) {
      var b = e.target.closest && e.target.closest('[data-k-tip]');
      if (!b) return;
      clearTimeout(tip.openTimer);
      if (tip.btn === b && !tip.pinned) scheduleClose();
    });
    doc.addEventListener('focusin', function (e) {
      var b = e.target.closest && e.target.closest('[data-k-tip]');
      if (b) openTip(b, false);
    });
    doc.addEventListener('focusout', function (e) {
      var b = e.target.closest && e.target.closest('[data-k-tip]');
      if (b && tip.btn === b && !tip.pinned) scheduleClose();
    });
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-k-tip]');
      if (b) {
        e.preventDefault(); e.stopPropagation();
        if (tip.btn === b && tip.pinned) closeTip(false); else { tip.pinned = true; openTip(b, true); }
        return;
      }
      if (tip.btn && !(tip.pop && tip.pop.contains(e.target))) closeTip(false);
    }, true);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tip.btn) closeTip(true); });
    root.addEventListener('scroll', function () { if (tip.btn) placePop(); }, true);
    root.addEventListener('resize', function () { if (tip.btn) placePop(); });
    // Standalone pages show their own band; inside the shell frame they don't.
    var inFrame = false;
    try { inFrame = root.top !== root.self; } catch (e) { inFrame = true; }
    if (!inFrame) Array.prototype.forEach.call(doc.querySelectorAll('[data-k-standalone]'), function (el) { el.hidden = false; });
  }

  var api = {
    esc: esc, fmt: fmt, num: num, icon: icon, mark: mark,
    SIGNALS: SIGNALS, signalLabel: signalLabel, badge: badge, tone: tone, trendMark: trendMark,
    infoTip: infoTip, hint: hint, readout: readout,
    confirm: confirmDialog, busy: busy,
    token: token, hatch: hatch, chartTheme: chartTheme, onThemeChange: onThemeChange,
    init: init, upgrade: upgrade, TOKEN_FALLBACK: TOKEN_FALLBACK, ICONS: ICONS
  };
  root.KompassUI = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (doc && doc.addEventListener) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(); });
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
