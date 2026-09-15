// Open-Meteo precipitation/probability at t describe [t-1h, t].
function run(input, now = Date.now() / 1000) {
  input = input || {};
  const fields = input.trmnl?.plugin_settings?.custom_fields_values || {};
  const number = (v) => typeof v === 'number' && Number.isFinite(v) ? v : null;
  const bounded = (value, fallback, min, max) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const threshold = bounded(fields.rain_limit, 20, 0, 100);
  const minimum = Math.round(bounded(fields.minimum_hours, 1, 1, 4));
  const imperial = fields.units === 'imperial';
  const daylightOnly = String(fields.daylight_mode || 'daylight').trim().toLowerCase() !== 'any';
  let zone = input.timezone || 'UTC';
  try { new Intl.DateTimeFormat('en-GB', { timeZone: zone }); } catch { zone = 'UTC'; }
  const fmt = (t) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t * 1000));
  const day = (t) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, day: '2-digit', month: 'short' }).format(new Date(t * 1000));
  const dateFormatter = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dateKey = (t) => {
    const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(t * 1000)).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  now = number(now) ?? Date.now() / 1000;
  const today = dateKey(now);
  // Never parse Intl-formatted dates: serverless runtimes may emit 15/09/2026
  // instead of an ISO string even for en-CA. Advancing the Unix timestamp is
  // locale-independent and still lands on the next local calendar day at DST.
  const tomorrow = dateKey(now + 86400);
  const relativeDay = (t) => dateKey(t) === today ? 'Today' : dateKey(t) === tomorrow ? 'Tomorrow' : day(t);
  const temp = (n) => n === null ? '—' : `${Math.round(imperial ? n * 9 / 5 + 32 : n)}°${imperial ? 'F' : 'C'}`;
  const wind = (n) => n === null ? '—' : `${Math.round(imperial ? n / 1.609344 : n)} ${imperial ? 'mph' : 'km/h'}`;
  const result = { location: String(fields.location_name || 'My location').slice(0, 35), zone,
    headline: 'Forecast unavailable', window: 'Try again later', detail: 'No usable hourly forecast.',
    hours: [], found: false, state: 'unavailable', checkedAt: now, modelIssuedAt: null,
    updated: `Checked ${day(now)} ${fmt(now)}`, threshold, minimum, selectionMode: 'next', reason: null };
  const h = input.hourly;
  if (input.error) {
    result.state = 'service_error';
    result.headline = 'Weather service unavailable';
    result.detail = 'Update failed; no cached forecast is shown.';
    return result;
  }
  if (!h || !Array.isArray(h.time)) return result;
  const timestamps = h.time.map(number).filter(t => t !== null);
  if (!timestamps.length) return result;
  const latest = Math.max(...timestamps);
  if (latest <= now) {
    result.state = 'outdated';
    result.headline = 'Forecast outdated';
    result.window = 'Waiting for update';
    result.detail = `Forecast coverage ended ${relativeDay(latest)} ${fmt(latest)}; it is not shown as current.`;
    return result;
  }
  const daylight = (input.daily?.sunrise || []).map((rise, i) => ({ rise: number(rise), set: number(input.daily?.sunset?.[i]) }))
    .filter(d => d.rise !== null && d.set !== null && d.rise > 0 && d.set > d.rise);
  if (daylightOnly && !daylight.length) {
    result.state = 'daylight_unavailable';
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
    rows.push({ start, end, p, mm, t, w, code, storm, known, dry, inDaylight, eligible: dry && (!daylightOnly || inDaylight), daylightKnown,
      day: relativeDay(start), time: fmt(start), temperature: temp(t), wind: wind(w), probability: p === null ? '—' : `${Math.round(p)}%`,
      label: !known ? '?' : dry ? 'DRY' : storm ? 'STORM' : 'WET' });
  }
  result.hours = rows.slice(0, 12);
  if (!rows.length) {
    result.state = 'incomplete';
    result.headline = 'Forecast incomplete';
    result.window = 'Waiting for complete data';
    result.detail = 'No continuous future hourly intervals are available.';
    return result;
  }
  result.ribbon = weatherRibbon(rows, daylight, null, now, fmt, relativeDay, temp);
  if (rows[0].start > now) {
    result.state = 'incomplete';
    result.headline = 'Forecast incomplete';
    result.window = 'Waiting for complete data';
    result.detail = 'The current forecast interval is missing.';
    return result;
  }
  if (!rows.some(r => r.known)) {
    result.state = 'incomplete';
    result.headline = 'Forecast incomplete';
    result.window = 'Weather data missing';
    result.detail = 'Rain or weather-code data is unavailable.';
    return result;
  }
  let chosen = null, group = [];
  const consider = () => {
    if (!chosen && group.length && group[group.length - 1].end - Math.max(now, group[0].start) >= minimum * 3600) chosen = group.slice();
  };
  for (const row of rows) {
    if (!row.eligible || (group.length && row.start !== group[group.length - 1].end)) { consider(); group = []; }
    if (row.eligible) group.push(row);
  }
  consider();
  result.state = 'no_window';
  result.headline = 'No dry window found';
  result.window = 'Today / Tomorrow';
  const relevant = daylightOnly ? rows.filter(r => r.inDaylight) : rows;
  const blockers = [
    { count: relevant.filter(r => !r.known).length, text: 'Required forecast data is missing.' },
    { count: relevant.filter(r => r.storm).length, text: 'Thunderstorms interrupt the available periods.' },
    { count: relevant.filter(r => r.known && r.mm > 0.1).length, text: 'Precipitation amount exceeds the dry limit.' },
    { count: relevant.filter(r => r.known && r.p > threshold).length, text: `Rain probability exceeds ${threshold}%.` }
  ].sort((a, b) => b.count - a.count);
  result.reason = !relevant.length ? 'No complete daylight intervals are available.'
    : relevant.some(r => r.dry) ? `Dry periods are shorter than ${minimum} hour${minimum === 1 ? '' : 's'}.`
    : blockers[0].count ? blockers[0].text
    : `No ${minimum}-hour window meets your limits.`;
  result.detail = result.reason;
  result.ribbon = weatherRibbon(rows, daylight, null, now, fmt, relativeDay, temp);
  if (!chosen) {
    const available = rows[rows.length - 1].end - Math.max(now, rows[0].start);
    if (available < minimum * 3600) {
      result.state = 'insufficient';
      result.headline = 'Not enough forecast data';
      result.window = 'Waiting for more hours';
      result.reason = `Less than ${minimum} hour${minimum === 1 ? '' : 's'} of usable forecast remain.`;
      result.detail = result.reason;
    }
    return result;
  }
  const first = chosen[0], last = chosen[chosen.length - 1];
  const start = Math.max(now, first.start), end = last.end;
  const temperatures = chosen.map(r => r.t).filter(t => t !== null);
  const winds = chosen.map(r => r.w).filter(w => w !== null);
  result.hours = rows.filter(r => r.start >= first.start).slice(0, 12);
  result.ribbon = weatherRibbon(rows, daylight, {start,end}, now, fmt, relativeDay, temp);
  result.found = true;
  result.state = 'ok';
  result.headline = 'Next likely dry window';
  result.window = `${start === now ? 'Now' : fmt(start)}–${fmt(end)}`;
  const minutes = Math.floor((end - start) / 60);
  result.duration = `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
  result.date = `${relativeDay(start)}${dateKey(start) !== dateKey(end) ? `–${relativeDay(end)}` : ''} · ${result.duration}`;
  result.temperature = temperatures.length ? `${temp(Math.min(...temperatures))}–${temp(Math.max(...temperatures))}` : 'Temperature unavailable';
  result.wind = winds.length ? `Wind up to ${wind(Math.max(...winds))}` : 'Wind unavailable';
  const maxRisk = Math.max(...chosen.map(r => r.p));
  result.risk = `Rain risk ≤${maxRisk}%`;
  const firstIndex = rows.indexOf(first), previous = firstIndex > 0 ? rows[firstIndex - 1] : null;
  result.reason = start === now
    ? (maxRisk === 0 ? 'No rain expected during this window.' : `Rain risk stays at or below ${maxRisk}%.`)
    : daylightOnly && previous && !previous.inDaylight ? 'Starts with the next daylight interval.'
    : previous && !previous.known ? 'Starts after uncertain forecast data.'
    : previous && previous.storm ? 'Starts after thunderstorms pass.'
    : previous && (previous.p > threshold || previous.mm > 0.1) ? 'Starts after rain conditions improve.'
    : 'Earliest window meeting your limits.';
  result.detail = result.reason + (last === rows[rows.length - 1] ? ' May continue beyond the shown forecast.' : '');
  return result;
}
if (typeof module !== 'undefined') module.exports = { run };

// Chart geometry uses the same Unix timestamps as window selection.
// Coordinates are viewBox units; no smoothing or invented weather values.
function weatherRibbon(rows, solar, selected, now, fmt, relativeDay, temp) {
 if (!rows.length) return null;
 // A decision graphic needs enough scale to read. Show at most 24 hours and,
 // when the recommendation is later, move the viewport so the whole window
 // remains visible with a little context before it starts.
 const allStart=rows[0].start, allEnd=rows[rows.length-1].end, span=24*3600;
 let viewStart=allStart;
 if(selected&&selected.start>allStart+18*3600)viewStart=Math.max(allStart,selected.start-6*3600);
 if(selected&&selected.end>viewStart+span)viewStart=Math.max(allStart,selected.end-span);
 const viewEnd=Math.min(allEnd,viewStart+span);
 rows=rows.filter(r=>r.end>viewStart&&r.start<viewEnd);
 if(!rows.length)return null;
 const start=rows[0].start, end=rows[rows.length-1].end;
 if (!(end>start)) return null;
 const x=t=>Math.round((40+880*(t-start)/(end-start))*100)/100;
 const temperatures=rows.map(r=>r.t).filter(t=>t!==null);
 const lo=temperatures.length?Math.min(...temperatures):0, hi=temperatures.length?Math.max(...temperatures):1;
 const y=t=>Math.round((155-55*(t-lo)/Math.max(4,hi-lo))*100)/100;
 const step=Math.max(1,Math.ceil(rows.length/5));
 const points=[], bars=[], labels=[], nights=[], events=[], dayMarkers=[];
 let previous=null;
 for (let i=0;i<rows.length;i++) {
  const r=rows[i];
  if (r.t!==null) points.push((previous!==null&&previous===r.start?'L':'M')+x(r.start)+','+y(r.t));
  previous=r.t===null?null:r.end;
  const p=r.p!==null&&r.p>=0&&r.p<=100?r.p:null;
  bars.push({x:x(r.start)+1,width:Math.max(1,x(r.end)-x(r.start)-2),y:p===null?260:260-p*.6,height:p===null?0:p*.6,unknown:p===null});
  if(i%step===0) labels.push({x:x(r.start),time:fmt(r.start),day:relativeDay(r.start),temperature:temp(r.t),ty:r.t===null?135:y(r.t)-10,probability:p===null?'?':Math.round(p)+'%',icon:r.code===null?'unknown':r.code>=95?'storm':r.code>=71&&r.code<=77?'snow':r.code>=51?'rain':r.code===0?'sun':'cloud'});
  if(i===0||relativeDay(r.start)!==relativeDay(rows[i-1].start))dayMarkers.push({x:x(r.start),label:relativeDay(r.start)});
 }
 // Only shade intervals on days with known sunrise and sunset.
 for(const d of solar) {
  const rise=d.rise,set=d.set;
  const dayRows=rows.filter(r=>relativeDay(r.start)===relativeDay(rise));
  if(!dayRows.length)continue;
  for(const [a,b] of [[dayRows[0].start,rise],[set,dayRows[dayRows.length-1].end]]) {
   const left=Math.max(start,a),right=Math.min(end,b);
   if(right>left)nights.push({x:x(left),width:x(right)-x(left)});
  }
  for(const [t,label] of [[rise,'Sunrise'],[set,'Sunset']])if(t>=start&&t<=end)events.push({x:x(t),label});
 }
 const selectedStart=selected?Math.max(start,selected.start):null, selectedEnd=selected?Math.min(end,selected.end):null;
 const selection=selected&&selectedEnd>selectedStart?{x:x(selectedStart),width:x(selectedEnd)-x(selectedStart)}:null;
 return {path:points.join(' '),bars,labels,nights,events,dayMarkers,selection,
  nowX:now>start&&now<end?x(now):null,
  range:'NEXT 24 HOURS · '+relativeDay(start)+' '+fmt(start)+'–'+relativeDay(end)+' '+fmt(end)};
}
