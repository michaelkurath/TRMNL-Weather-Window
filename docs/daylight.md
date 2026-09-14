# Daylight windows

Outdoor hours defaults to Daylight only, including existing installations without a saved preference. Select Any time to allow nighttime.

We search today and tomorrow in the forecast timezone. Three upstream forecast days supply the final hourly endpoint; recommendations stop at the end of tomorrow. Sunrise/sunset come from Open-Meteo daily data using Unix timestamps.

Only whole forecast intervals inside daylight qualify, except that the remaining current hour can qualify after sunrise. Sunrise at 07:12 therefore yields a future start at 08:00; sunset at 19:38 yields an end at 19:00. Minimum duration uses time remaining from now, not full elapsed clock hours.

Missing or unusable solar data never implies daylight. With no usable times, the display explains that Any time is available. Polar locations with no ordinary sunrise/sunset are not supported in daylight mode yet.

Today/Tomorrow and duration appear under the main time range. The timeline starts at the selected window, and labels days explicitly. Rain estimates remain hourly, not guarantees.

Source: https://open-meteo.com/en/docs

Validation: deterministic daylight and weather checks plus trmnlp live polling and OG/X rendering in GitHub Actions. Visual review and live-device daylight acceptance remain pending.
