function checkWeather(run) {
 const stamp = s => Date.parse(s) / 1000;
 const base = stamp('2026-09-14T00:00:00Z');
 function fixture() {
  const time = Array.from({length:73}, (_,i)=>base+i*3600);
  return {timezone:'Europe/Zurich',daily:{
   sunrise:[stamp('2026-09-14T05:12:00Z'),stamp('2026-09-15T05:13:00Z')],
   sunset:[stamp('2026-09-14T17:38:00Z'),stamp('2026-09-15T17:36:00Z')]},
   hourly:{time,temperature_2m:time.map(()=>20),precipitation_probability:time.map(()=>0),precipitation:time.map(()=>0),wind_speed_10m:time.map(()=>6),weather_code:time.map(()=>0)}};
 }
 const passed=[]; const test=(name,fn)=>{if(!fn())throw new Error(name);passed.push(name);};
 let data=fixture(), now=stamp('2026-09-14T14:08:00Z'), r=run(data,now);
 test('daylight defaults to current daytime window',()=>r.window==='Now–19:00');
 test('duration uses remaining current hour',()=>r.duration==='2h 52m');
 test('today is explicit',()=>r.date.startsWith('Today'));
 now=stamp('2026-09-14T20:08:00Z'); r=run(data,now);
 test('evening finds tomorrow beyond twelve hours',()=>r.window==='08:00–19:00'&&r.date.startsWith('Tomorrow'));
 test('timeline follows recommended day',()=>r.hours[0].day==='Tomorrow'&&r.hours[0].time==='08:00');
 test('sunrise is rounded inward to forecast boundary',()=>r.hours[0].start>=data.daily.sunrise[1]);
 data=fixture();delete data.daily;
 test('missing sunrise is explicit',()=>run(data,now).headline==='Daylight unavailable');
 data.trmnl={plugin_settings:{custom_fields_values:{daylight_mode:'any'}}};
 r=run(data,now);
 test('any time works without sunrise',()=>r.found&&r.window.startsWith('Now'));
 test('search stops at end of tomorrow',()=>r.window.endsWith('00:00'));
 data=fixture();data.hourly.precipitation_probability.fill(null);
 test('missing rain data is unavailable',()=>run(data,now).headline==='Forecast unavailable');
 data=fixture();data.hourly.weather_code.fill(95);
 test('storms cannot become outdoor windows',()=>!run(data,now).found);
 test('empty forecast is unavailable',()=>run({},now).headline==='Forecast unavailable');
 data=fixture();data.daily.sunrise=[null,null];data.daily.sunset=[null,null];
 test('polar/missing solar times do not imply daylight',()=>run(data,now).headline==='Daylight unavailable');
 data=fixture();now=stamp('2026-09-14T16:30:00Z');
 data.trmnl={plugin_settings:{custom_fields_values:{minimum_hours:'1'}}};
 test('short remaining daylight shifts to tomorrow',()=>run(data,now).date.startsWith('Tomorrow'));
 data=fixture(); now=stamp('2026-09-14T14:08:00Z'); data.hourly.precipitation_probability[16]=90;
 test('rain in preceding interval ends window',()=>run(data,now).window==='Now–17:00' || !run(data,now).window.startsWith('Now'));
 data=fixture();data.trmnl={plugin_settings:{custom_fields_values:{units:'imperial'}}};
 test('imperial units retained',()=>run(data,now).temperature.includes('68°F')&&run(data,now).wind.includes('mph'));
 data=fixture();data.hourly.precipitation.fill(2);
 test('rain amount excludes otherwise low probability',()=>!run(data,now).found);
 data=fixture();now=stamp('2026-09-14T20:08:00Z');r=run(data,now);
 test('ribbon selection has positive width',()=>r.ribbon.selection.width>0);
 const first=data.hourly.time.find(t=>t+3600>now);
 const final=stamp('2026-09-15T22:00:00Z');
 const expected=40+880*(stamp('2026-09-15T06:00:00Z')-first)/(final-first);
 test('ribbon selection aligns with actual start timestamp',()=>Math.abs(r.ribbon.selection.x-expected)<0.02);
 test('night shading exists for overnight outlook',()=>r.ribbon.nights.length>0);
 data=fixture();data.hourly.temperature_2m[22]=null;
 r=run(data,now);
 test('missing temperatures break line',()=>r.ribbon.path.split('M').length>=3);
 data=fixture();data.hourly.precipitation_probability[23]=null;
 test('missing rain remains unknown',()=>run(data,now).ribbon.bars.some(b=>b.unknown));
 return passed;
}
if(typeof module!=='undefined')module.exports={checkWeather};
