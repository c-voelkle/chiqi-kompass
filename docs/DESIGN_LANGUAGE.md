# CH-IQI Kompass: Design Language

**Status:** Proposed v1 · **Scope:** `deploy/` (shell `index.html`, `cockpit.html`, `chiqi/`),
including the printed reports · **Language of this file:** English; all UI copy examples are
German (de-CH), as in the app.

The engine rule applies to the UI: each decision lives in one place. How an O/E value is
written, what a signal looks like, how a table sizes its columns and where an explanation goes
belong to the shared UI layer (`deploy/ui/`). Pages compose it and do not repeat the decisions.

**Audit baseline (2026-10-10)**

- **Styling:** two unrelated style sheets. `cockpit.html` uses 63 distinct hex colours, 18 font
  sizes (9–30px) and 9 radii; `chiqi/index.html` uses 58 hex colours, 23 font sizes (px and rem
  mixed) and 7 radii. The shell and the two pages use three different font stacks and two
  different "blues" (`#12294b`, `#1c4e80`). About 40 inline `style=` attributes.
- **Signals:** two badge systems (`.chip` in the cockpit, `.signal` in the workbench) with
  different colours for the same meaning. The trend chart paints "lower" green while the radar
  paints "signifikant tiefer" blue.
- **Numbers:** `toLocaleString('de-CH')` renders `1.00` and `1’234`, while the copy around it
  says `1,00` and `99,8%`. Local `fmtOE`/`fmtN`/`toFixed` helpers in each page.
- **Copy:** the "no quality judgement" caveat appears 6 times on screen, plus a demo banner, a
  page footer and a demo footer that repeat source and method. Explanatory hints of 4–12 lines
  under most card titles. 13 emoji and dingbats used as icons (🧭 📄 🔒 ⚠ ✔ ✘).
- **Interaction:** 2 `window.confirm` calls; filters live inside the header, step indicators are
  implemented twice (`.own-steps`, `.wb-progress`).

---

## 0. Character

**CH-IQI Kompass is a sleek measuring instrument, not a report.** It reads like a well-built
cockpit display: dark chrome around a quiet light panel, readouts in tabular figures, colour
only where a signal is. Figures lead, words recede, space does the separating. The QM lead is
the expert: the screen states what changes how a value is read or what to do next, and keeps
methodology one step away.

### 0.1 What "sleek machine" means here

These are not moods; each one is checkable in review.

| Trait | Concretely |
|---|---|
| **Colour is a signal** | The panel is monochrome (ink, greys, one navy for controls). Hue appears only for a statistical signal (§2.4), a workflow state (§2.5), or the needle (§0.3). Remove every colour that does neither. |
| **Readouts, not sentences** | A figure is shown as a readout: label above, value in `tabular-nums`, unit and period in a meta line. `O/E 1.43 · 2024 · n 412`, never "Das O/E-Verhältnis beträgt 2024 bei 412 Fällen 1,43." |
| **One grid, hairline precision** | 4px grid; 1px hairlines; numbers right-aligned on a shared edge; labels on a shared baseline. Nothing is "about" aligned. |
| **Fixed instrument layout** | Controls sit where they always sit: the control strip (§5) under the shell, actions top-right of their panel, one primary action per area. A page never rearranges because data arrived. |
| **Quiet surfaces** | Flat panels with a 1px border; no gradients, glows, glass, coloured side bars or drop shadows on cards. Elevation only for popovers and dialogs. |
| **Crisp motion** | 120ms state changes, no bounce, no animated figures. A value appears; it does not count up. |
| **Precise words** | Short labels, exact terms (`O/E`, `n`, `E`, `z`, `95%-Grenze`), no hedging on the surface. |

### 0.2 Basics

| Element | Decision |
|---|---|
| Typeface | One system stack everywhere: `ui-sans-serif, system-ui, "Segoe UI Variable", "Segoe UI", -apple-system, Roboto, sans-serif`. No webfonts (the app runs offline and from `file://`). Figures always `font-variant-numeric: tabular-nums`. Monospace (`ui-monospace, "Cascadia Mono", Consolas, monospace`) only for case references and evidence hashes. |
| Icons | Lucide outlines (ISC licence), inlined as SVG path data by `kompass-ui.js` (`ui.icon("lock")`), because `<use href="sprite.svg#…">` fails under `file://`. 16px in controls and rows, 14px in badges, `stroke-width` 1.75, `currentColor`. An icon replaces a word or aids scanning; no decorative icons. **No emoji anywhere**, including the PDF button and the brand. |
| Mark | A flat SVG compass mark (ring + needle) at 20px in the shell replaces 🧭. The needle uses `needle`; the ring uses `chrome-foreground`. Favicon from the same mark (none exists today). `<meta name="theme-color">` = `chrome`. |
| Surfaces | Shell chrome is the dark navy band; content panels are flat cards on a cool grey canvas. Exactly one level of card nesting. |

### 0.3 The needle (accent amber)

The amber needle is the brand accent, the equivalent of a single warm indicator light on an
instrument. It is permitted **only** in:

- The mark and the active-tab indicator in the shell (2px underline).
- The marker for **"Ihre Institution"** in charts (funnel point outline, highlighted bar edge):
  the needle points at you.
- The `Prototyp` badge in the shell.

It never represents a signal or a workflow state (amber "Achtung" is `caution`, §2.5, a
different hue), and it is never used as text on a light surface.

---

## 1. Principles

1. **Visible if it changes interpretation or action; otherwise one step away.**
   - **Visible:** what changes how the QM lead reads a value or what they do next: *vorläufig*,
     *< 10 Fälle*, *n. b.*, *Kodierverzug möglich*, the comparison basis
     (*eigene Erwartung* vs. *CH-Rohwert*), the period a figure covers, and the instruction
     needed to fill a field correctly. Use a short label, a `Badge`, or a one-line `Hint`.
   - **One step away:** formulas, risk-adjustment details, inclusion criteria, why radar and
     funnel can disagree, source citations. Use `InfoTip` (short) or `Disclosure` (long).
   - **Once per surface:** the interpretive frame *"Statistische Auffälligkeit ist ein
     Prüfhinweis, kein Qualitätsurteil."* It does change how every figure is read, so it stays
     visible, but exactly once: in the page footer line on screen and on the report cover in
     print. It is not repeated in cards.
   - **Not at all:** sentences that restate what a badge, column header or icon already shows,
     and reminders that the tool is a prototype beyond the shell badge.
2. **First glance, then depth.** A summary panel shows a title, one primary readout or signal,
   and one quiet meta line. Detail opens with `Disclosure`. Forms, the import log, the
   evidence record and confirmations show what clarity requires.
3. **Space separates, borders don't.** Separate groups by space first, hairlines second, boxes
   last. No coloured info boxes around paragraphs.
4. **Direction is not favourability.** A higher O/E is "höher als erwartet", not "schlechter".
   Whether a direction is unfavourable comes from the indicator definition's polarity
   (`up-bad` for mortality and Kaiserschnitt, `neutral` for process indicators and the
   brusterhaltende Resektion share), never from the sign alone. Green is never used for a
   statistical signal (§2.4).
5. **Missing is not zero, and not assessable is not inconspicuous.** No data → `–`.
   Data exists but the criteria are not met (< 10 Fälle, E < 3) → `n. b.` with the reason in an
   `InfoTip`. Neither is ever shown as `0`, `0.00` or `unauffällig`. In charts, missing periods
   are gaps.
6. **No technical identifiers on working screens.** No hashes, certificate IDs, storage keys.
   Cases are shown by their **local case reference** (the QM working identifier). The original
   Fall-ID is revealed on demand for lookup in the KIS. Hashes and certificate IDs appear only
   in the evidence record (Nachweis) and its print, where they *are* the evidence.
7. **Everything fits at 100%.** At 1536 × 740 CSS px (1920 × 1080 at 125%, typical hospital
   laptop) and at 1280 × 680, no page scrolls horizontally inside the shell frame. A table may
   scroll inside its own container only once every column is at its minimum width.
8. **Light first, dark equal, print fixed.** Every screen token has a light and a dark value,
   contrast-checked; the theme follows `prefers-color-scheme`. Print always uses the light
   values. Pages never write per-theme colours themselves.

### 1.1 Copy defaults (German UI)

- Labels about 4 words or fewer; panel titles about 6. Normal German capitalisation, no
  all-caps (today: KPI labels, table headers, `ECHTE DATEN · QIP 2024`).
- No hedging and no dash asides on the surface. A qualifier is a label (*vorläufig*,
  *richtungsneutral*, *n. b.*), not a sentence.
- Readouts instead of sentences: `Pneumonie · O/E 1.43 · 2024 · signifikant erhöht`.
- One signal vocabulary for the whole app (§2.4), one workflow vocabulary (§2.5).
- **`Hint` vs `InfoTip`:** a control needs one line to be used correctly → `Hint` (one line,
  12px, `muted-foreground`). Background rarely needed → `InfoTip`. A `title=""` attribute is
  never the only carrier of meaning (today: `o. Ref.`, `Outcome fehlt`).
- Imperatives for actions (`PDF erstellen`, `Institution bestätigen`), nouns for sections.

### 1.2 Before → after (from the current app)

| Today | Proposed |
|---|---|
| **Radar panel:** title, then an 8-line bold-led hint (O/E definition, signal rule, thresholds, which indicators are directional, trend rule, click instruction); a scope select with a sentence "Diese Auswahl wirkt nur auf die Radartabelle." | Title **O/E-Radar** ⓘ · meta `Massstab: eigene Erwartung · ≥ 10 Fälle, E ≥ 3`. Definitions and rules in the `InfoTip`. The scope select sits in the panel toolbar, so its reach is evident; the sentence goes. Rows show a hover fill and chevron instead of "Klick auf eine Zeile …". |
| **"Zwei Ansichten, zwei verschiedene Fragen":** a full section with two articles, kickers and a caveat paragraph above the KPIs. | Each panel carries its basis as meta: `O/E-Radar · Massstab: eigene Erwartung` and `Funnel-Plot · Massstab: CH-Rohwert, unadjustiert`. One `Disclosure` *Warum Radar und Funnel abweichen können* holds the explanation. |
| **Unterjährige result:** 12-line `warnbox` under the table (Kodierverzug, small n, reference years, risk models, G5_03 definition, `o. Ref.`). | Panel meta `ausgetretene, codierte Fälle · Jan–Aug 2026 · vorläufig`. A `caution` badge *Kodierverzug möglich* appears only when the last quarter drops (the engine already counts per quarter). Column `InfoTip`s for `o. Ref.` and `Outcome fehlt`. Risk models and definitions in `Disclosure` *Methodik*. |
| **Privacy box** 🔒 (3 sentences, green box) in the import card and again in the workbench. | Control strip status with a lock icon: `Lokal · keine Übertragung`, with an `InfoTip`. The one instruction that changes action stays as the free-text field `Hint`: *Keine Patientennamen eingeben.* |
| **Demo banner + header subtitle + footer + demo footer** (source, method and disclaimers four times). | Shell: mark, name, tabs, `Prototyp` badge, feedback link. Page end: one footer line (source + the frame sentence from §1.1) and `Disclosure` *Quelle & Methodik*. |

---

## 2. Tokens

CSS custom properties in `deploy/ui/kompass.css`, `:root` for light, overridden under
`@media (prefers-color-scheme: dark)`. Print uses `:root` values. Names are English; values
measured with the contrast script (§2.7). ▲ marks a change from today's dominant value.

### 2.1 Surfaces, text, selection

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#F3F5F8` | `#0A1019` | Page background |
| `card` / `popover` | `#FFFFFF` | `#111925` | Panels, popovers, dialogs |
| `muted` | `#EBEFF4` | `#16202E` | Table header, quiet fills |
| `border` | `#DCE2E9` | `#202C3C` | Decorative hairlines only |
| `input` ▲ | `#7A8797` | `#627287` | Control outlines (≥ 3:1; today `#d5d9de` is 1.4:1) |
| `foreground` | `#0E1A2B` | `#E8EDF3` | Primary text, figures |
| `subtle-foreground` | `#34445A` | `#C1CAD5` | Secondary body text |
| `muted-foreground` ▲ | `#586677` | `#8E9BAC` | Labels, meta, hints (today `#8a9aab` = 2.9:1) |
| `hover` | `#E8EDF3` | `#162438` | Hover fill for rows, menu items, ghost buttons |
| `selected` | `#DCE7F5` | `#17304F` | Selected row/tab fill, always with an indicator |

### 2.2 Chrome and brand

| Token | Light | Dark | Use |
|---|---|---|---|
| `chrome` | `#12294B` | `#0D1A2E` | Shell band (today's header navy, kept) |
| `chrome-foreground` | `#E9EFF7` | `#E9EFF7` | Text and mark ring on chrome |
| `chrome-muted` | `#A9BAD0` | `#93A6BF` | Inactive tabs, labels on chrome |
| `needle` | `#A87700` on light surfaces, `#FFD766` on chrome | `#FFD766` | §0.3 only; graphics, never text on light |
| `primary` | `#1A4478` | `#A8C7F0` | Filled buttons, links, focus, selected indicator |
| `primary-foreground` | `#FFFFFF` | `#06101D` | Text on primary |
| `ring` | = `primary` | = `primary` | Focus ring |

`primary` is navy, not signal blue, so a button or link never reads as "signifikant tiefer".
`primary` never appears in chart marks.

**State recipes** belong to component variants in `kompass.css`; pages never set fills.

| Variant | Default | Hover | Pressed / active | Min. contrast L / D |
|---|---|---|---|---|
| Row / list item | transparent | `hover` | `selected` | 14.0 / 11.3 |
| Selected row | `selected` + 2px `primary` inset bar | stays | — | fg 14.0 / 11.3; bar 7.8 / 7.7 |
| Ghost / outline button | transparent (outline: `input`) | `hover` | `selected` | 14.0 / 11.3 |
| Primary (filled) | `primary` | `#143866` / `#C0D6F4` | `#0F2C52` / `#92B8EA` | 9.8 / 9.3 |
| Destructive (filled) | `#B0232A` / `#F27B7E` | `#961D23` / `#F59496` | `#7D181D` / `#E06467` | 6.7 / 5.8 |
| Link | `primary` text | underline | — | 9.8 / 10.2 |
| Tab (shell) | `chrome-muted` text | `chrome-foreground` | `chrome-foreground` + 2px `needle` underline | 7.4 / 7.0 |

| Other states | Treatment |
|---|---|
| Keyboard focus | 2px `ring` outline, 2px offset, `:focus-visible` only, drawn above hover and selection |
| Disabled | 50% opacity, `cursor: not-allowed`, no hover |
| Read-only | Values as text, not disabled inputs |
| Invalid | Border `danger`; message under the field with `role="alert"` |
| Loading | Skeleton bars for panels; inline spinner in the button (label stays, button disabled). XML parsing shows a determinate bar when the size is known. |

### 2.3 Chart neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `chart-point` | `#8592A2` | `#6B788A` | Other institutions in the funnel (≥ 3:1) |
| `chart-limit` | `#6B7889` | `#8E9BAC` | Control limits: 95% dashed, 99.8% solid |
| `chart-reference` | = `foreground` | = `foreground` | CH value / O/E = 1.00 line |
| `chart-grid` | = `border` | = `border` | Horizontal gridlines (decorative) |

Today the limits are amber and red, which reads as a signal; limits are reference geometry.

### 2.4 Statistical signals (one vocabulary for the whole app)

The signal says what the statistics found, not whether it is good. Tone pairs text / soft fill /
border.

| Signal | Label (de) | Light | Dark | Mark |
|---|---|---|---|---|
| `high` | signifikant erhöht | `#B0232A` / `#FBEAEA` / `#EDB9BC` | `#F27B7E` / `#2C1618` / `#5C2B2F` | ▲ |
| `low` | signifikant tiefer | `#1D58A3` / `#E6EEF9` / `#B4CBEA` | `#7FB4F7` / `#12233A` / `#2A4B76` | ▼ |
| `deviant` | abweichend (richtungsneutral) | `#5A3E9E` / `#F0EBF8` / `#CEC0EA` | `#B8A3F2` / `#211B33` / `#45396B` | ◆ |
| `inconspicuous` ▲ | unauffällig | `#475466` / `#EEF1F5` / `#CDD4DD` | `#B2BCC8` / `#18212D` / `#2F3B4B` | — |
| `not-assessable` | n. b. | `#586677` / transparent / dashed `#DCE2E9` | `#8E9BAC` / transparent / dashed `#202C3C` | — |

- `unauffällig` moves from green to neutral: green on a quality-indicator screen reads as
  "good", which the tool explicitly does not claim.
- `high` is used only for `up-bad` indicators; for `neutral`-polarity indicators the same
  statistic is `deviant`. The engine's indicator definitions own the polarity.
- Each signal also has its mark, because red and blue have nearly equal luminance (1.0:1 light,
  1.2:1 dark). Colour alone never carries a signal; the mark and the label do.
- Trends use the same vocabulary: a significant rise of an `up-bad` indicator is `high`, a
  significant fall is `low` (today: green).

### 2.5 Workflow states (import, review, validation, PDCA)

| Tone | Light | Dark | Meaning |
|---|---|---|---|
| `ok` | `#1C6B3B` / `#E4F3E9` / `#A8D6B8` | `#63D38F` / `#10261A` / `#255338` | Check passed, data taken over, step done |
| `caution` | `#8A5200` / `#FCF1DC` / `#E8C78A` | `#F0B952` / `#2A2110` / `#5C4A1E` | vorläufig, < 10 Fälle, Kodierverzug möglich, check warns |
| `danger` | = `high` values | = `high` values | Import failed, check failed, blocked |
| `info` | = `low` values | = `low` values | Process note, suggestion |
| `neutral` | = `inconspicuous` values | = `inconspicuous` values | Draft, not started, closed |

Green appears only here, for things the *user's process* achieved, never for a hospital's
results. Soft fills are for badges and the one-line validation row; no paragraph boxes.

### 2.6 Type, spacing, radius, elevation, motion, density

**Type scale** (replaces 18 + 23 distinct sizes on the two pages):

| Token | Size / line | Use |
|---|---|---|
| `text-2xs` | 11 / 16 | Badges, table headers, chart axes, readout labels |
| `text-xs` | 12 / 16 | Compact table cells, meta lines, `Hint` |
| `text-sm` | 14 / 20 | Body, controls, panel titles (600) |
| `text-lg` | 18 / 26 | Page title (in the control strip) |
| `text-2xl` | 26 / 32 | Readout figures |

Weights 400 body, 500 labels and controls, 600 titles and figures. Print reports have their own
scale (§5.4).

- **Spacing:** 4px grid; steps 4 · 8 · 12 · 16 · 24 · 32. Sections 24px apart, groups 16px,
  label-to-value 4px. Replaces `--gap:14px` and the `rem` spacing in `chiqi/`.
- **Radius:** 8px panels, 6px controls and table frames, full for badges and the tab underline
  ends. Nothing else (today 11 distinct radii).
- **Elevation:** panels flat (1px `border`). Popovers `--shadow-raised`
  (`0 4px 12px rgb(14 26 43 / .12)`), dialogs `--shadow-overlay` plus a backdrop. In dark mode
  elevation comes from surface lightness.
- **Motion:** 120ms (state), 200ms (popover, disclosure), easing `cubic-bezier(0.2, 0, 0, 1)`.
  Chart.js animation off (`animation: false`): figures never animate. Everything off under
  `prefers-reduced-motion`.
- **Density:** *compact* = 12px text, 32px rows, 8px cell padding (radar, case review,
  Fallzahl-Monitor); *comfortable* = 14px text, 40px rows (result table, forms). Hit targets at
  least 24 × 24px.

### 2.7 Contrast (WCAG 2.1, measured)

| Pair | Light | Dark |
|---|---:|---:|
| foreground on card / canvas | 17.5 / 16.0 | 15.0 / 16.2 |
| subtle-foreground on card | 9.9 | 10.7 |
| muted-foreground on card / canvas / muted | 5.9 / 5.4 / 5.1 | 6.2 / 6.8 / 5.8 |
| muted-foreground on hover / selected | 5.0 / 4.7 | 5.5 / 4.7 |
| signal text on its soft fill (min. across §2.4) | 5.4 | 6.2 |
| workflow text on its soft fill (min. across §2.5) | 5.7 | 6.4 |
| primary text on card | 9.8 | 10.2 |
| button variants (min. across states, §2.2) | 6.7 | 5.8 |
| chrome-foreground / chrome-muted on chrome | 12.6 / 7.4 | 15.1 / 7.0 |
| needle on chrome / on card (non-text, ≥ 3) | 10.5 / 4.0 | 12.6 / 12.8 |
| input outline / chart-point on card (non-text, ≥ 3) | 3.7 / 3.2 | 3.6 / 3.9 |

The script that produced these numbers moves to `deploy/ui/test_contrast.mjs` in step 1 and runs
with the other tests whenever a token changes.

---

## 3. Shared UI (`deploy/ui/`)

There is no build step and no framework: pages are hand-written HTML with template-string
rendering, deployed by upload. The shared layer matches that:

- **`kompass.css`**: tokens (§2) and component classes, prefixed `k-` (`k-panel`, `k-badge`,
  `k-table`, …).
- **`kompass-ui.js`**: a classic script exposing `window.KompassUI` (formatters, render helpers
  returning HTML strings, `confirm`, `icon`, Chart.js theme). Every helper HTML-escapes its text
  arguments by default; imported XML content never reaches `innerHTML` unescaped.
- **`chiqi/ui/`** holds byte-identical copies, following the existing rule that every folder
  runs standalone (like `spiges_parser.js`). A test asserts the copies are identical.

Interfaces start **narrow**: only what the pilot screen needs, grown when a migrating screen
proves the need. The gallery (`deploy/ui/gallery.html`) shows every variant in both themes.

### 3.1 Numbers: `KompassUI.fmt`

Owns every figure on screen and in print, replacing `fmtOE`, `fmtN`, ad-hoc `toFixed` and
`toLocaleString` calls.

| Formatter | Output | Rule |
|---|---|---|
| `fmt.n(v)` | `1’234` | Integers, de-CH grouping (U+2019) |
| `fmt.oe(v)` | `1.43` | 2 decimals |
| `fmt.rate(v)` | `3.4%` | Percent, 1 decimal, no space |
| `fmt.expected(v)` | `12.6` | E, 1 decimal |
| `fmt.z(v)` | `+2.4` / `−1.1` | 1 decimal, sign always, U+2212 minus |
| `fmt.period(p)` | `2019–2023`, `2024`, `Jan–Aug 2026` | En dash for ranges |
| `fmt.date(d)` | `24.09.2026` (tables), `24. Sep.` (meta) | |

- **Decimal point everywhere.** The renderer already outputs de-CH (`1.43`); the copy changes
  to match (`O/E = 1.00`, `99.8%-Grenze`), not the other way round. One separator per app.
- `null`/`undefined` → `–` with `aria-label="nicht verfügbar"`; `fmt.notAssessable(reason)` →
  `n. b.` with the reason in an `InfoTip`. Never `0`.
- Exports (JSON, CSV) use raw numbers with ASCII `-`; formatting is display-only.
- Formatters return text; `ui.value(v, kind)` wraps it in `<span class="k-num">` (tabular,
  right-aligned in tables).

### 3.2 `Badge`

```js
ui.badge({ signal: "high" | "low" | "deviant" | "inconspicuous" | "not-assessable" })
ui.badge({ tone: "ok" | "caution" | "danger" | "info" | "neutral", label, icon? })
```

Owns pill geometry (11px, full radius, 1px border), the mark for signals (§2.4), and the label
text for signals: callers pass the signal, not the words, so the vocabulary cannot drift.
Replaces `.chip`, `.signal`, `.signal-pill`, `.badge`, `.view-kicker`, `.check-pass/warn/fail`.
The engine returns `{ signal }` per indicator result; the UI never derives it from colours or
signs.

### 3.3 `InfoTip` and `Hint`

**`InfoTip`** owns the explanation popover (WCAG 1.4.13):

| Aspect | Contract |
|---|---|
| Trigger | 14px info icon in a 24 × 24px hit area; `<button aria-label="Über {Thema}" aria-expanded>` |
| Open | Hover after 300ms; focus and click/tap immediately |
| Hoverable | Pointer can move into the popover (150ms grace) |
| Persistent | Stays open while hovered or focused; never closes on a timer |
| Dismiss | Esc (focus returns to trigger), click outside, or leaving both; a click pins it open |
| Content | Text only, ~60 words max, 320px max width, linked by `aria-describedby`. Formulas allowed (`z = (O − E) / √(E·(1 − p))`). No links or buttons: those belong in a `Disclosure`. |
| Look | `popover` surface, `text-xs`, `subtle-foreground`, raised elevation |

**`Hint`**: one line under a control, 12px, `muted-foreground`, `aria-describedby`.

### 3.4 `Panel`, `Readout`, `Disclosure`

```js
ui.panel({ title, meta?, signal? | readout?, info?, actions?, body })
ui.readout({ label, value, meta?, signal? })   // label · figure · meta, the instrument gauge
ui.disclosure({ summary, key?, body })         // <details class="k-disclosure">
```

- `Panel` owns the anatomy: title row (title, optional readout or badge, `InfoTip`, actions on
  the right), one meta line, body. Replaces `.card`, `.own-head`, `.wb-head`,
  `.comparison-question`, `.pdca-phase` shells.
- `Readout` replaces the KPI cards and `.wb-stat`/`.rep-ck` boxes: no coloured side bar; the
  signal appears as a badge next to the label. Readouts sit in one row with hairline dividers,
  not as separate shadowed cards.
- `Disclosure` is the one expand pattern: chevron, keyboard, open state remembered per `key`
  in `localStorage` (wrapped in `try/catch`). Replaces the explorer `<details>`, the protocol
  `<details>` and inline `summary` styling.

### 3.5 `Table` and fit

Owns column sizing via `<colgroup>`: `fixed` columns sized to content, `flex` columns with a
minimum; the table equals its container. Numeric columns right-aligned with the unit in the
header (`Rate %`, `n`), sticky header, compact/comfortable density, `aria-sort`, row hover and
selection (§2.2), loading/empty/error rows, and truncation with the full text reachable on
hover, focus or row expansion.

```js
ui.table({ columns: [{ key, header, cell, width: { fixed } | { flex, min }, align?: "num", info? }],
           rows, density: "compact" | "comfortable", onRow? })
```

This replaces `min-width:980px` on the case table and the `overflow-x:auto` wrappers that today
let tables push past their panel.

### 3.6 `Field`, `Select`, `ControlStrip`

`Field` owns label, `Hint`, `InfoTip`, error wiring (`aria-describedby`, `aria-invalid`), the
`input` outline and focus ring. Replaces `.fg`, `.own-field`, `.field`, `.radar-view-control`.

`ControlStrip` is the page's context bar (§5): context selects on the left (Ebene, Institution,
Periode), status and the page action on the right. Filters leave the dark header.

### 3.7 `Stepper`

One step rail for every multi-step flow: numbered steps, `done` (ok tone check icon), `current`
(`primary` 2px top bar), `upcoming` (`border`). Replaces `.own-steps` and `.wb-progress`.

### 3.8 `confirm`

`ui.confirm({ title, body, action, destructive })` on a native `<dialog>`, returning a
promise. Replaces both `window.confirm` calls (Lokale Entwürfe löschen, Falldaten verwerfen).
The destructive button names the action (`Entwürfe löschen`), never `OK`.

---

## 4. Charts (Chart.js, vendored)

### 4.1 Theme

`ui.chartTheme()` returns Chart.js defaults from the tokens and re-applies on a theme change:
system font, axes `muted-foreground` 11px, horizontal gridlines only (`chart-grid`), no
animation, one tooltip anatomy (title = indicator or period; rows = mark, label, formatted
value via `fmt`), legend above the plot when there are 2 or more series. Pages never pass
colour literals to Chart.js (today `COLORS` and `'#b6bcc4CC'`-style alpha suffixes).

### 4.2 Per chart

| Chart | Encoding |
|---|---|
| **Funnel-Plot** | Other institutions `chart-point` 3px dots. CH value `chart-reference` 1px line. 95% limits `chart-limit` dashed, 99.8% solid. **Ihre Institution**: 7px point, `needle` 2px outline, filled with its signal colour if outside the 99.8% limit, else `card`. Log x-axis labelled `n (log)`. |
| **Trendabweichungen** | Horizontal bars of z. Inside ±1.96: `chart-point`. Outside: `high` / `low` by direction and polarity (never green). Zero line `chart-reference`; ±1.96 as `chart-limit` dashed. |
| **Eigene Daten im BAG-Vergleich** | Three separate bars, not a line: Baseline 2019–2023, QIP 2024, unterjährig. Published values solid `subtle-foreground`; the unterjährig bar **hatched** with a dashed outline and a `vorläufig` label, so "preliminary" never depends on colour or opacity. Gaps, not zeros, for missing values. |

### 4.3 States and readability

- Contrast is checked after opacity and composition, in both themes: small text 4.5:1; marks
  needed to read the chart 3:1 against neighbours. Gridlines exempt.
- Preliminary, small-n and not-assessable data each have a distinct mark (hatching, hollow
  point, dashed outline) plus a label.
- Every chart has an accessible name stating what it compares, and its values are reachable in
  the adjacent table.

---

## 5. Page recipes

### 5.1 Shell (`index.html`)

48px `chrome` band: mark + `CH-IQI Kompass` (600) → tabs (`Cockpit QIP 2024`,
`Unterjährige Auswertung`) with the `needle` underline on the active tab → right: `Prototyp`
badge (needle outline) and `Feedback` link. Nothing else in the band. The frame below fills the
viewport. The standalone back link inside sub-pages uses the same band, reduced to mark +
`CH-IQI Kompass`.

### 5.2 Overview: Cockpit

`ControlStrip` (title `Cockpit QIP 2024`, Ebene, Institution, Periode | `PDF erstellen`) →
one row of 4 `Readout`s (signifikant erhöht, signifikant tiefer, Trendwarnungen, Fallzahl-
Monitor) → **O/E-Radar** panel (compact table) → **Funnel-Plot** and **Trendabweichungen** side
by side → **Eigene Daten im BAG-Vergleich** (with `Stepper` while a transfer is in progress) →
**Fallzahl-Monitor** → footer line + `Disclosure` *Quelle & Methodik*.

In comparison mode the comparison panel moves to the top and the rest folds into
`Disclosure` *Gesamtes Cockpit*, as today, but without changing the visual language.

### 5.3 Workflow: Unterjährige Auswertung

`ControlStrip` (title, status `Lokal · keine Übertragung` | `PDF erstellen`) → `Stepper`
(Import · Indikatoren · Fallreview · PDCA · Nachweis) → one panel per step, the current one
open: drop zone (1px dashed `input`, not a 2px blue frame) → result table (comfortable) with
`Mit BAG-Verlauf vergleichen` as the panel's single primary action → `Disclosure`
*Importprotokoll* → QM-Workbench (indicator tabs, case table compact, PDCA fields in a
2-column `Field` grid) → Nachweis.

### 5.4 Document: PDF reports (print)

The report is the one place where prose belongs: it travels without the app. It still uses the
tokens (light values), the type scale below, the same signal vocabulary and marks, and the same
formatters. Cover: mark, title, institution, period, 3 readouts, the frame sentence. A4,
page number from the report itself.

| Print token | Size | Use |
|---|---|---|
| `print-title` | 26pt | Cover title |
| `print-h` | 13pt / 600 | Section titles, with a 1px `foreground` rule |
| `print-body` | 10.5pt / 1.55 | Paragraphs, tables |
| `print-meta` | 9pt | Notes, footers |

**Avoid on screen:** panel-in-panel; a hint paragraph under every title; coloured paragraph
boxes (`warnbox`, `own-method`, `comparison-caveat`, `privacy`); uppercase labels; emoji;
coloured side bars; more than one filled button per area; sentences restating a badge.

**Feedback conventions:** saving shows an inline spinner, then the `save-state` line
(`Gespeichert 14:32`) for 2s; errors inline at the cause; a page-level alert only for import
failures; unsaved PDCA changes show a dot on the tab plus a leave guard.

---

## 6. Rules for pages

Appearance and geometry are different: colour, font size, radius, shadow and motion come from
tokens and `k-` classes; layout values (grid columns, widths) may be literal. A layout decision
that repeats moves into `kompass.css`.

| # | Rule | Enforced by |
|---|---|---|
| R1 | No hex/rgb colour literals outside `kompass.css` (and Chart.js colours only via `chartTheme`) | Ratchet test: per-file ceiling that only shrinks; new files start at 0 |
| R2 | No literal font-size, radius or shadow values outside `kompass.css` | Same ratchet |
| R3 | No inline `style=` attributes except layout | Same ratchet |
| R4 | Figures only via `KompassUI.fmt` | Ratchet on `toFixed(`, `toLocaleString(` outside `ui/` |
| R5 | Signals via `ui.badge({ signal })`, explanations via `InfoTip`/`Hint`, depth via `Disclosure` | Review checklist |
| R6 | No hashes or technical IDs on working screens | Review checklist; known sites below |
| R7 | No emoji or dingbats as icons | Ratchet on the Unicode ranges |
| R8 | No `window.confirm` / `alert` | Test assertion |
| R9 | No page-level horizontal scroll at 1536 and 1280 inside the shell | Playwright check in the browser tests |
| R10 | `deploy/ui/` and `deploy/chiqi/ui/` identical | Test assertion |

The ratchet is `deploy/test_design_ratchet.mjs`, in the style of the existing tests (plain
`node`, `assert`), with its baseline in `deploy/ui/ratchet-baseline.json`. For `cockpit.html`
it scans only markup and code, skipping the embedded data block.

Several existing tests assert exact copy (`Zwei Ansichten, zwei verschiedene Fragen`,
`Diese Auswahl wirkt nur auf die Radartabelle.`). Where this document removes that copy, the
migrating commit updates those assertions to the new structure (`data-testid`, roles) rather
than keeping the sentence for the test.

**UI review checklist:** recipe used · interpretation test applied to every text · signal
vocabulary and polarity correct · no IDs · both themes and print checked · long names,
`–`, `n. b.` and empty states handled · keyboard path works · fits at 1280 · exceptions named
with their reason.

---

## 7. Migration plan

Small atomic commits, each stating its design argument. Two pilot stages with an approval gate.
Changes go to `deploy/` and are uploaded as today; the stale root copies are replaced by that
upload.

| Step | Scope | Done when |
|---|---|---|
| 0 | **Foundation:** `deploy/ui/kompass.css` + `kompass-ui.js` (empty shells), copies in `chiqi/ui/`, identity test; SVG mark replaces 🧭 in the shell; favicon; `theme-color`; one font stack | Existing tests green; pages load from `file://` and Pages |
| 1 | **Tokens** (§2) incl. dark values, state recipes, type scale; `test_contrast.mjs` | Both themes render; contrast test passes |
| 2 | **Ratchet** with today's per-file baseline | `node deploy/test_design_ratchet.mjs` green |
| 3 | **Stage A components (narrow):** `fmt`, `Badge`, `InfoTip`/`Hint`, `Panel`/`Readout`/`Disclosure`, `Table`, `Field`/`ControlStrip`, `chartTheme`; gallery started | Unit tests green; gallery shows both themes |
| 4 | **Stage A screen: shell + Cockpit.** Control strip, readout row, signal vocabulary (green → neutral, trend green → `low`), decimal-point copy, flat Chart.js theme with needle marker, hint paragraphs → `InfoTip`/`Disclosure`, single footer | Cockpit tests updated and green; screenshots at 1536 × 740 and 1280 × 680, light and dark; no horizontal scroll |
| **Gate** | **Your approval** of the shell + Cockpit appearance and the Stage A gallery | Approved screenshots in `docs/design/reference/` |
| 5 | **Stage B: Unterjährige Auswertung.** `Stepper`, drop zone, result table with column `InfoTip`s, conditional `Kodierverzug möglich`, workbench tables fit without `min-width`, `ui.confirm` for both sites, evidence IDs behind *Technische Kennungen* | Workbench and compare tests green; screenshots |
| 6 | **Reports:** both PDF reports on the print tokens and shared formatters | Browser report tests green; sample PDFs approved |
| 7 | Remove the legacy page-local style blocks once every ratchet count is 0 | — |

**Known technical-ID sites:**

- `chiqi/index.html` evidence record: `certificateId`, `Datei-SHA-256` (keep in Nachweis and
  print, behind *Technische Kennungen* on screen, with *Kopieren*).
- `chiqi/index.html` case table: original Fall-ID shown next to the local reference (move to
  row expansion: *Fall-ID für KIS anzeigen*).

---

## 8. Where this lives

- **`docs/DESIGN_LANGUAGE.md`** (this file). Any agent or contributor styling a page reads it
  first.
- **`deploy/ui/gallery.html`** is the living reference once step 3 lands.
- **`docs/design/reference/`** holds the approved screenshots that serve as the visual baseline.
