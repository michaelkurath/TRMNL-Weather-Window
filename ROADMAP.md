# Weather Window roadmap

Status: prototype. GitHub is the source of truth. Implement on a branch, validate, review OG/X screenshots, then merge and sync to TRMNL.

## P0 — Forecast correctness (in progress)
- [x] Diagnose refresh-minute endpoint: clipping at now + 12 hours produced 04:08.
- [x] Implement complete forecast-hour boundaries; do not invent partial ending hours.
- [x] Distinguish a dry window reaching the available search boundary from rain onset.
- [x] Add explicit overnight wording and a non-duplicating location fallback.
- [x] Add and execute 10 deterministic JavaScript regression checks.
- [ ] Verify against live Open-Meteo responses and confirm serverless settings injection.
- [ ] Extend coverage for timestamp gaps, stale/truncated forecasts, DST, invalid settings and units.
- [ ] Verify in TRMNL, merge and sync the fix.

Completed implementation checkboxes do not mean released. Initial checks ran in the available JavaScript runtime; Node/trmnlp execution is pending.

## P1 — Full layout, OG and X (implemented draft; visual review pending)
- [x] Implement top-aligned Full layout and a two-row, six-column hourly outlook; visual acceptance pending.
- [x] Add larger X typography for hourly rain/temperature and hero supporting text; visual acceptance pending.
- [x] Full: use filled rain-percentage labels for dry hours; retain explicit wet/storm/unknown labels.
- [ ] Confirm configured location appears in footer; verify custom field values reach transform.
- [x] Full: use Framework layout/grid/typography and move attribution into normal flow. Smaller-layout footnotes remain for P2.
- [ ] Review screenshots for dry, wet, overnight, unavailable and long-location cases on OG and X.

## P2 — Smaller layouts and validation
- [ ] Half Horizontal, Half Vertical and Quadrant: normal and edge cases on OG and X.
- [ ] Ensure unavailable/empty forecasts never render an unexplained blank.
- [ ] Check YAML values, defaults, units and 1-bit text contrast.
- [ ] Add reproducible sample fixtures and trmnlp screenshot instructions.

## P3 — Release preparation
- [ ] TRMNL-compatible LICENSE.
- [ ] README: setup, settings, hourly interpretation, limitations, tests and credits.
- [ ] TRMNL recipe ↔ GitHub links and short repository description.
- [ ] Icon, screenshots, source URL checks and Chef/reviewer feedback.
- [ ] Reproducible import ZIP: plugin files including settings.yml at archive root.

## Later — only after core validation
- [ ] Decide whether to add daylight-only windows.
- [ ] Consider activity-specific temperature/wind preferences.

## Running regression checks
With Node installed:
```sh
node -e "console.log(require('./test/weather.js').checkWeather(require('./src/transform.js').run))"
```

Full-layout verification matrix and remaining checks: [docs/layout-review.md](docs/layout-review.md).
