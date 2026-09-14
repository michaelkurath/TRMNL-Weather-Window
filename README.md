# Weather Window

A [TRMNL](https://trmnl.com) plugin for ePaper displays, connected by
[GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync): every save in TRMNL lands here as a commit.

<img width="150" alt="image" src="https://trmnl.com/images/brand/badges/light/works-with-trmnl/trmnl-badge-works-with-light.svg" />

### Develop locally

Templates and settings live in [`src/`](src/), ready for [trmnlp](https://github.com/usetrmnl/trmnlp):

```sh
gem install trmnl_preview
trmnlp serve
```

### Discoverability

Add the `trmnl` topic to this repo so other TRMNL plugin builders can find it.

### Development status

See [ROADMAP.md](ROADMAP.md) for priorities, validation gates and regression test instructions.

### Location setup

Search for a town or postcode in **Location**, then select the correct match.
Include a country or region when names are ambiguous. TRMNL's built-in autocomplete
resolves your selection; you do not need to find or type coordinates.

**Display name** is optional and only changes the footer. The forecast location
comes from **Location**. If no display name is set, the footer reads “My location.”
The selected friendly place name is not assumed to be available to the transform.

**Upgrading from the coordinate fields:** open the plugin settings, select your
location once, and save before refreshing. The old latitude/longitude fields have
been replaced. No default town is silently selected for new installations.

### Weather data

Open-Meteo supplies hourly temperature, precipitation probability, precipitation
amount, wind speed and weather codes. The plugin calculates likely dry windows
from those values. Timezone selection remains automatic for the chosen location.

- [TRMNL location field documentation](https://help.trmnl.com/en/articles/10513740-custom-plugin-form-builder)
- [Open-Meteo forecast documentation](https://open-meteo.com/en/docs)

### Location change validation

Implementation uses the documented `lat_lon` field and Liquid split filters.
Live form/polling checks remain pending: select Russikon, try a postcode, choose
between ambiguous town names, verify the selected coordinates reach Open-Meteo,
and confirm the optional display name does not change the forecast location.
Existing instances require the one-time location selection described above.
