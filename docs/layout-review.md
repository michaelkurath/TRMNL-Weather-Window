# Layout review matrix

Automated by `.github/workflows/trmnlp-validation.yml` using `test/prepare_fixture.rb`.
Every pull request renders all four views at OG (800×480, 1-bit) and X
(1040×780, 4-bit) for each case. The workflow stores individual PNGs and
labelled 2×2 review sheets.

| Fixture | Primary risk |
| --- | --- |
| realistic | Temperature changes, rain bars, selected-window alignment |
| imperial_long | Long location, mph, negative Fahrenheit values |
| no_window | Limiting-condition explanation without a selection |
| incomplete | Missing rain, temperature and wind values |
| insufficient | Forecast horizon shorter than requested duration |
| outdated | Expired coverage must not look current |
| daylight_unavailable | Missing sunrise/sunset response |
| service_error | Upstream error with no cached-data implication |

Review each sheet for clipped text, title-bar collisions, readable 1-bit
contrast, visible unknown/error states and consistent meaning across layouts.
TRMNL X emulation remains limited by trmnlp's fixed 800 px design-system
wrapper: the X PNG dimensions and responsive classes are exercised, but final
physical-device validation is still required.

## Current status

The matrix is reproducible in CI. The realistic compact-layout batch was
visually reviewed at source revision `3f37e98`. Full matrix acceptance is
recorded in the pull request that introduces this file revision.
