// Open-Meteo precipitation/probability at t describe [t-1h, t].
function run(input, now = Date.now() / 1000) {
  input = input || {};
  const fields = input.trmnl?.plugin_settings?.custom_fields_values || {};
  const number = (v) => typeof v === 'number' && Number.isFinite(v) ? v : null;
  const threshold = Math.min(100, Math.max(0, Number(fields.rain_limit ?? 20) || 0));
  const minimum = Math.min(4, Math.max(1, Number(fields.minimum_hours) || 1));
  const imperial = fields.units === 'imperial';
  const daylightOnly = String(fields.daylight_mode || 'daylight').trim().toLowerCase() !== 'any';
  let zone = input.timezone || 'UTC';
  try { new Intl.DateTimeFormat('en-GB', { timeZone: zone }); } catch { zone = 'UTC'; }
  const fmt = (t) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t * 1000));
  const day = (t) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, day: '2-digit', month: 'short' }).format(new Date(t * 1000));
  const dateKey = (t) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t * 1000));
  const today = dateKey(now);
  const tomorrowDate = new Date(today + 'T12:00:00Z');
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const relativeDay = (t) => dateKey(t) === today ? 'Today' : dateKey(t) === tomorrow ? 'Tomorrow' : day(t);
  const temp = (n) => n === null ? '—' : `${Math.round(imperial ? n * 9 / 5 + 32 : n)}°${imperial ? 'F' : 'C'}`;
  const wind = (n) => n === null ? '—' : `${Math.round(imperial ? n / 1.609344 : n)} ${imperial ? 'mph' : 'km/h'}`;
  const result = { location: String(fields.location_name || 'My location').slice(0, 35), zone,
    headline: 'Forecast unavailable', window: 'Try again later', detail: 'No usable hourly forecast.',
    hours: [], found: false, updated: `Checked ${day(now)} ${fmt(now)}`, threshold, minimum };
  const h = input.hourly;
  if (!h || !Array.isArray(h.time) || input.error) return result;
  const daylight = (input.daily?.sunrise || []).map((rise, i) => ({ rise: number(rise), set: number(input.daily?.sunset?.[i]) }))
    .filter(d => d.rise !== null && d.set !== null && d.rise > 0 && d.set > d.rise);
  if (daylightOnly && !daylight.length) {
    result.headline = 'Daylight unavailable';
    result.window = 'Check settings';
    result.detail = 'No usable sunrise/sunset. Try Any time.';
    return result;
  }
  const rows = [];
  for (let i = 1; i < h.time.length; i++) {
    const end = number(h.time[i]), start = number(h.time[i - 1]);
    if (end === null || start === null || end - start !== 3600 || end <= now || dateKey(end - 1) > tomorrow) continue;
    const p = number(h.precipitation_probability?.[i]), mm = number(h.precipitation?.[i]);
    const t = number(h.temperature_2m?.[i - 1]), w = number(h.wind_speed_10m?.[i - 1]);
    const code = number(h.weather_code?.[i - 1]), nextCode = number(h.weather_code?.[i]);
    const known = p !== null && p >= 0 && p <= 100 && mm !== null && mm >= 0 && code !== null && nextCode !== null;
    const storm = code >= 95 || nextCode >= 95;
    const daylightKnown = daylight.some(d => dateKey(d.rise) === dateKey(start));
    const inDaylight = daylight.some(d => Math.max(start, now) >= d.rise && end <= d.set);
    const dry = known && p <= threshold && mm <= 0.1 && !storm;
    rows.push({ start, end, p, t, w, known, dry, eligible: dry && (!daylightOnly || inDaylight), daylightKnown,
      day: relativeDay(start), time: fmt(start), temperature: temp(t), wind: wind(w), probability: p === null ? '—' : `${Math.round(p)}%`,
      label: !known ? '?' : dry ? 'DRY' : storm ? 'STORM' : 'WET' });
  }
  result.hours = rows.slice(0, 12);
  if (!rows.length || rows[0].start > now || !rows.some(r => r.known)) return result;
  let chosen = null, group = [];
  const consider = () => {
    if (!chosen && group.length && group[group.length - 1].end - Math.max(now, group[0].start) >= minimum * 3600) chosen = group.slice();
  };
  for (const row of rows) {
    if (!row.eligible || (group.length && row.start !== group[group.length - 1].end)) { consider(); group = []; }
    if (row.eligible) group.push(row);
  }
  consider();
  result.headline = 'No dry window found';
  result.window = 'Today / Tomorrow';
  result.detail = `No ${minimum}-hour ${daylightOnly ? 'daylight ' : ''}window meets your limits.${rows.some(r => !r.known || (daylightOnly && !r.daylightKnown)) ? ' Some data is missing.' : ''}`;
  if (!chosen) return result;
  const first = chosen[0], last = chosen[chosen.length - 1];
  const start = Math.max(now, first.start), end = last.end;
  const temperatures = chosen.map(r => r.t).filter(t => t !== null);
  const winds = chosen.map(r => r.w).filter(w => w !== null);
  result.hours = rows.filter(r => r.start >= first.start).slice(0, 12);
  result.found = true;
  result.headline = 'Next likely dry window';
  result.window = `${start === now ? 'Now' : fmt(start)}–${fmt(end)}`;
  const minutes = Math.floor((end - start) / 60);
  result.duration = `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
  result.date = `${relativeDay(start)}${dateKey(start) !== dateKey(end) ? `–${relativeDay(end)}` : ''} · ${result.duration}`;
  result.temperature = temperatures.length ? `${temp(Math.min(...temperatures))}–${temp(Math.max(...temperatures))}` : 'Temperature unavailable';
  result.wind = winds.length ? `Wind up to ${wind(Math.max(...winds))}` : 'Wind unavailable';
  result.risk = `Rain risk ≤${Math.max(...chosen.map(r => r.p))}%`;
  result.detail = last === rows[rows.length - 1]
    ? 'Dry through shown forecast · May continue beyond it'
    : daylightOnly ? 'Daylight hours · Hourly estimate' : 'Hourly estimate · Conditions may change';
  return result;
}
if (typeof module !== 'undefined') module.exports = { run };
