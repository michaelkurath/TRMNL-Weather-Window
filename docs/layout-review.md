# Full-layout review

Draft implementation; no rendered screenshot acceptance yet.

## Changes
- Top-aligned hero and a chronological six-column grid, wrapping after hour six.
- Larger rain and temperature typography on X.
- Filled probability labels mean likely dry; a single legend replaces repeated DRY text.
- Non-dry hours retain WET, STORM or ? labels.
- Source/check time appears in normal document flow.
- Empty hours hide the timeline while retaining the unavailable hero.
- Smaller layouts retain their current compact rendering.

## Required screenshots before merge
Capture Full on OG and X for each case below, using trmnlp when available.

| Case | Check |
| --- | --- |
| Twelve dry hours | Two rows of six, legible percentages and temperatures, no overflow |
| Mixed dry/wet | Labels and filled indicators agree with forecast state |
| Thunderstorms | STORM visible even with 0% precipitation probability |
| Missing probabilities | Unknown marker visible; not represented as dry |
| No hourly data | Forecast unavailable hero and attribution; no empty timeline heading |
| Overnight window | Time and date wording fit |
| Long location, imperial units | Title bar and negative/three-digit temperatures fit |
| Partial forecast | Chronological order and boundary wording remain clear |

Compare OG and X separately. Inspect 1-bit text and all four layouts because shared templates changed.
Check source attribution does not collide with the title bar.

## Validation status
Static markup review only. Execution tooling is unavailable, so Liquid rendering, font fit and screenshot review are pending. These changes must remain a draft until visual validation is completed.

Framework references:
- https://trmnl.com/framework/docs/3.3/layout
- https://trmnl.com/framework/docs/3.3/text_size
