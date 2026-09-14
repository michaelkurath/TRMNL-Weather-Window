function checkWeather(run) {
  const now = Date.parse('2026-09-14T14:08:00Z') / 1000;
  const base = Date.parse('2026-09-14T14:00:00Z') / 1000;
  function fixture() {
    const time = Array.from({length: 26}, (_, i) => base + i * 3600);
    return {timezone: 'Europe/Zurich', hourly: {time,
      precipitation_probability: time.map(() => 0), precipitation: time.map(() => 0),
      temperature_2m: time.map(() => 20), wind_speed_10m: time.map(() => 6),
      weather_code: time.map(() => 0)}};
  }
  const passed = [];
  function test(name, fn) { if (!fn()) throw new Error(name); passed.push(name); }
  let data = fixture(), result = run(data, now);
  test('refresh minutes do not become forecast endpoint', () => result.window === 'Now–04:00');
  test('overnight window is explicit', () => result.date.includes('overnight'));
  test('search boundary is not presented as rain onset', () => result.detail.includes('May continue'));
  test('no hidden thirteenth partial hour', () => result.hours.length === 12 && result.hours.at(-1).end <= now + 43200);
  test('default location does not repeat title', () => result.location === 'My location');
  data = fixture(); data.hourly.precipitation_probability[3] = 90;
  result = run(data, now);
  test('rain interval ends the current dry window', () => result.window === 'Now–18:00');
  data = fixture(); data.trmnl = {plugin_settings: {custom_fields_values: {minimum_hours: '2'}}};
  data.hourly.precipitation_probability[3] = 90;
  result = run(data, now);
  test('partial current hour counts only remaining duration', () => result.window.startsWith('19:00'));
  data = fixture(); data.hourly.precipitation_probability.fill(null);
  test('missing data is unavailable', () => run(data, now).headline === 'Forecast unavailable');
  data = fixture(); data.hourly.weather_code.fill(95);
  test('thunderstorms are not dry windows', () => !run(data, now).found);
  test('empty response is unavailable', () => run({}, now).headline === 'Forecast unavailable');
  return passed;
}
if (typeof module !== 'undefined') module.exports = { checkWeather };
