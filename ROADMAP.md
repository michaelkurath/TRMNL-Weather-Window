# Weather Window — product roadmap

## Product goal
Answer **“When should I go outside, and why?”** in one glance.

Success means a useful window, a short reason, and enough context to trust it. More weather metrics alone do not make this a better plugin.

Product principles:
- Reliable data before recommendations; never equate missing data with good weather.
- Describe forecasts as estimates. “Likely dry” is not “safe.”
- One clear visual focus; Full first, then OG/X and smaller layouts.
- Useful defaults and few settings; advanced preferences stay optional.
- GitHub is the source of truth. Prefer existing Framework components, serverless transformation and direct polling; add infrastructure only for demonstrated needs.
- A completed implementation is not a validated release.

## Current status — 14 September 2026
PR [#1](https://github.com/michaelkurath/TRMNL-Weather-Window/pull/1) merged at explicit user request.
TRMNL synchronization and live-device behavior are not yet confirmed.
Ten deterministic JavaScript regression checks passed in the available runtime. Node/trmnlp execution and OG/X screenshot review remain outstanding.

### Implemented
- [x] Four initial layouts and configurable location, rain limit, duration and units.
- [x] Complete forecast-hour endpoints instead of refresh-derived minutes.
- [x] Explain when a dry window reaches the shown forecast boundary.
- [x] Overnight wording and a non-duplicating location fallback.
- [x] Full: two rows of six hours, larger X typography and less repetitive dry labels.
- [x] Full: attribution in normal layout flow.
- [x] Ten regression checks and [layout review matrix](docs/layout-review.md).

## Milestones

| Milestone | Outcome | Priority | Status |
| --- | --- | --- | --- |
| M1 — Trustworthy baseline | Correct, tested forecast with a readable Full view | P0 | In progress |
| M2 — Useful outdoor windows | Daylight-aware, understandable window selection | P1 | Planned; depends on M1 |
| M3 — Personal relevance | Simple activity preferences that change the answer usefully | P2 | Planned; depends on M2 |
| M4 — Polished release | All layouts, onboarding, documentation and release gates | P1 | Preparation can run alongside M1–M3 |
| M5 — Improve from use | Targeted improvements based on actual feedback | P3 | After release |

No calendar promises until rendering and live-data validation are available.

## M1 — Trustworthy baseline

### WW-01: Finish visual and live verification — NEXT
- [ ] Confirm merged source reaches TRMNL, including transform.js and custom fields.
- [ ] Compare a live response with the rendered hours, location, units and window.
- [ ] Run Full screenshot matrix separately on OG and X.
- [ ] Fix overflow, empty space, weak contrast and title-bar/location issues found.
- [ ] Check changed shared templates in all four layouts.
Acceptance: no unexplained blank screen, clipped content or ambiguous endpoint in the documented matrix. Save reviewed screenshots with the relevant source revision.

### WW-02: Strengthen forecast correctness
- [ ] Verify upstream timestamp and precipitation-interval interpretation against primary documentation.
- [ ] Normalize settings; invalid values use documented defaults.
- [ ] Test midnight, year rollover, DST, non-whole-hour time zones, gaps and duplicate/out-of-order timestamps.
- [ ] Test partial current hours, exact minimum durations and truncated/stale forecasts.
- [ ] Test imperial conversions, negative temperatures and missing temperature/wind.
- [ ] Distinguish “no suitable window” from “not enough forecast data.”
- [ ] Give unknown values an explicit state; do not silently discard uncertainty.
Acceptance: deterministic fixtures cover each case; the interval shown and its supporting values describe the same period.

### WW-03: Freshness and graceful failure
- [ ] Distinguish “checked at” from forecast/model issue time; never invent unavailable timestamps.
- [ ] Define and document stale-data behavior and a visible stale/unavailable state.
- [ ] Verify polling failures and recovery without adding a backend by default.
- [ ] If retaining previous data is supported, label its age; otherwise show unavailable.
Acceptance: a failed update cannot make old or absent data appear current.

## M2 — Useful outdoor windows

### WW-04: Daylight-aware planning
- [ ] Add “Daylight only” / “Any time” preference; proposed default: daylight only.
- [ ] Evaluate sunrise/sunset data and define treatment of windows crossing those boundaries.
- [ ] Handle no sunrise/sunset and missing daylight data explicitly.
- [ ] Search through tomorrow, with a documented maximum horizon, so evening use can offer tomorrow morning.
- [ ] Show Today / Tomorrow where helpful; retain dates for clarity.
Acceptance: nighttime is not recommended in daylight mode; missing daylight data is not silently treated as daylight.

### WW-05: Next versus best window
- [ ] Preserve “Next suitable window” as the predictable default.
- [ ] Add best-window selection only after defining explainable ranking.
- [ ] Apply hard limits first; rank eligible windows by documented preferences.
- [ ] Deterministic tie-break: earliest start; avoid unexplained changes on unchanged data.
- [ ] Consider one alternative only when it materially improves the decision.
- [ ] Explain the selection with short reasons such as “Lower rain risk, lighter wind.”
- [ ] If nothing qualifies, explain the limiting condition rather than calling an unsuitable interval good.
Acceptance: every recommendation can be traced to input data and settings. Do not present an arbitrary score as a forecast probability.

### WW-06: Decision-focused visual design
- [ ] Hero: window + duration + one short reason.
- [ ] Timeline: clearly highlight the selected interval and show upcoming changes.
- [ ] Label partial/unknown intervals and overnight transitions.
- [ ] Show temperature and wind as supporting context, not competing headlines.
- [ ] Evaluate whether two six-hour rows remain the clearest Full presentation using actual screenshots.
Acceptance: a user can identify when to go and the main tradeoff within a few seconds.

## M3 — Personal relevance

### WW-07: Activity presets with editable limits
- [ ] Start with general outdoors, dog walking and gardening.
- [ ] Define sensible proposed defaults for rain, duration, temperature and wind, then review them with real examples.
- [ ] Show what each preset changes; keep custom limits available.
- [ ] Add cycling only after checking gust data and exposure limitations.
- [ ] Normalize all thresholds in one internal unit system.
Acceptance: switching activity makes an explainable difference; presets are preferences, not safety guidance.

### WW-08: Low-friction setup and language — location setup promoted to P1
- [x] Implement native TRMNL location autocomplete for towns, addresses and postcodes; no manual coordinates required.
- [x] Feed the selected location into the existing Open-Meteo polling URL.
- [x] Keep the footer display name optional and explain that it does not change the forecast location.
- [ ] Validate autocomplete and polling URL interpolation in TRMNL, including ambiguous towns and postcodes.
- [ ] Existing instances: select and save a location once after updating.
- [ ] Investigate whether TRMNL exposes the selected friendly place name for an automatic footer label; do not infer it from coordinates.
- [ ] Metric/imperial settings behave consistently throughout.
- [ ] English and German labels; locale-aware time/date presentation.
- [ ] Separate translated text from selection logic.
Acceptance: first successful setup requires only location and optional activity choice; defaults work without tuning.

## M4 — Polished release

### WW-09: All layouts and accessibility
- [ ] Full: window, explanation and hourly context.
- [ ] Half Horizontal: window plus compact upcoming conditions.
- [ ] Half Vertical: window plus a short vertical outlook.
- [ ] Quadrant: window and the single most useful supporting detail.
- [ ] Test OG and X independently; include long text, units, missing values and all states.
- [ ] Remove smaller-layout absolute footnotes where they cause collisions.
- [ ] Use 1-bit legible text and signals that do not rely on color.
Acceptance: each view remains useful without squeezing Full into less space.

### WW-10: Reproducible development and packaging
- [ ] Restore/extend sample fixtures and reproducible trmnlp rendering.
- [ ] Add automated forecast validation to CI.
- [ ] Add import ZIP generation with settings.yml at archive root and verify archive contents.
- [ ] Keep candidate UI changes on branches; review screenshots before routine merges.
- [ ] Record test commands, source revision and known limitations in PRs.
Acceptance: another contributor can reproduce tests and import a known version.

### WW-11: Documentation and release review
- [ ] Correct TRMNL-compatible LICENSE.
- [ ] README: purpose, installation, settings, forecast interpretation and limitations.
- [ ] Recipe ↔ GitHub links, short description, sources/credits and icon.
- [ ] Review provider usage terms, attribution and polling limits before public release.
- [ ] Publish OG/X screenshots and address Chef/human reviewer feedback.
- [ ] Confirm live-device refresh and error recovery.
Acceptance: all P0 issues closed, screenshot gates complete, no known misleading forecast behavior.

## M5 — Improve from use
- [ ] Collect concrete examples of confusing or unhelpful recommendations.
- [ ] Evaluate setup friction and whether users understand the main window without explanation.
- [ ] Track reported bugs, review feedback and recurring requests in GitHub.
- [ ] Consider richer outlooks only if they improve decisions without crowding the display.
- [ ] Avoid personal-location telemetry by default.

## Explicitly deferred
Radar maps, generic three-day dashboards, AI-generated weather prose, multiple providers, push alerts, accounts, paid infrastructure and a companion website.
Reconsider only for a specific unmet user need. Severe-weather alerting would require a separately scoped authoritative data source and validation.

## Tracking rules
Use WW-IDs in commits/PRs. Each item moves through Planned → In progress → Implemented → Validated → Released.
Checkboxes record concrete completed work; milestone completion requires its acceptance criteria.
When an issue appears, record expected behavior, actual behavior, fixture/screenshot and affected device/layout.
Keep fixes ahead of features; update this file with each meaningful batch.

## Immediate work order
1. WW-08 + WW-01: validate native location search, selected forecast location, and merged Full layout.
2. WW-02/03: close data correctness and freshness gaps.
3. WW-04: daylight-aware Today/Tomorrow windows.
4. WW-05/06: understandable selection and timeline.
5. WW-07/08 and release gates, guided by actual use.

## Regression checks
With Node installed:
```sh
node -e "console.log(require('./test/weather.js').checkWeather(require('./src/transform.js').run))"
```
