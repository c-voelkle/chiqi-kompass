# CH-IQI Kompass: notes for contributors and agents

The app lives in `deploy/` (static pages, no build step). `deploy/` is the only copy:
`.github/workflows/pages.yml` publishes it to GitHub Pages on every push to `main`
that touches it, without the `*.mjs` tests (see `ANLEITUNG.md`). Do not copy app files
to the repository root.

## UI: read `docs/DESIGN_LANGUAGE.md` before styling anything

- Colours, type sizes, radii, shadows and motion come only from `deploy/ui/kompass.css`
  (tokens `--k-*`, classes `k-*`). Pages contain no `<style>` blocks, no `style="…"`
  attributes, no colour literals. Toggle visibility with the `hidden` attribute.
- Figures go through `KompassUI.fmt` (`n`, `oe`, `pct`, `share`, `z`, `period`, `date`):
  decimal point, `–` for missing, never `toFixed`/`toLocaleString` in a page.
- Statistical signals use `KompassUI.badge({ signal })` with the one vocabulary
  `high | low | deviant | inconspicuous | not-assessable`. Green never marks a
  statistical result; it is reserved for workflow states (`tone: 'ok'`).
- Explanations go in an InfoTip (`<button class="k-infotip" data-k-tip="id">` plus
  `<template id="id-c">`) or a `details.k-disclosure`, not in paragraphs under titles.
- No emoji; icons via `KompassUI.icon(name)` or `<i data-k-icon="name"></i>`.
- No `window.confirm`/`alert`; use `await KompassUI.confirm({...})`.
- New shared components go into `deploy/ui/` and appear in `deploy/ui/gallery.html`.
- `deploy/chiqi/ui/` is a byte-identical copy of `deploy/ui/` (each folder runs
  standalone). After changing `deploy/ui/`, run
  `cp deploy/ui/kompass.css deploy/ui/kompass-ui.js deploy/ui/favicon.svg deploy/chiqi/ui/`.

## Checks (run before committing UI changes)

    node deploy/test_design_system.mjs      # rules R1–R11, token sync, UI kit
    node deploy/ui/test_contrast.mjs        # WCAG contrast of all tokens
    node deploy/test_compare_ux.mjs
    node deploy/test_layout_browser.mjs     # needs Playwright; fit at 1536/1280, both themes
    node deploy/chiqi/test_patient_filter.mjs          # patient group filter (no upstream needed)
    node deploy/test_patient_filter_browser.mjs        # needs Playwright
    node deploy/test_hospital_groups.mjs               # comparison groups + KZP24 data coverage
    node deploy/test_hospital_groups_browser.mjs       # needs Playwright
    node deploy/test_own_strata_browser.mjs            # needs Playwright; interim age group → BAG strata, funnel point

CI (`.github/workflows/design-system.yml`) runs the same checks. In Claude Code a
PostToolUse hook (`.claude/hooks/design-check.sh`) runs the rules after every edit
under `deploy/`. If a rule blocks a deliberate exception, change the design doc and
the rule together and say why in the commit.

`deploy/kzp24_attributes.js` is generated from the BAG "Kennzahlen der Schweizer
Spitäler" workbook and its time series:
`python3 tools/build_kzp_attributes.py <kzp24_data.xlsx> <kzp24_KZ_TimeSerie.xlsx>` (needs
openpyxl). Acute beds and CMI come from the time series (2024, else 2023). Name differences between the QIP and KZP publications are listed
explicitly in `ALIASES` in that script; the build fails if a QIP Betrieb has no match.

Other tests (`test_indicator_report*.mjs`, `chiqi/test_qm_workbench.mjs`, `chiqi/test_breast_indicator.mjs`,
`test_breast_workflow_browser.mjs`) need the upstream source folders
(`../chiqi-engine`, `../spiges`, `../qip24_data.json`) that are maintained outside
this repository.
