require "json"
require "yaml"

name = ARGV.fetch(0)
now = Time.now.to_i
base = (now / 86_400) * 86_400
times = (0..72).map { |i| base + i * 3600 }
hours = times.map { |t| Time.at(t).utc.hour }
wet = hours.map { |hour| (9..11).include?(hour) }

data = {
  "timezone" => "UTC",
  "daily" => {
    "sunrise" => (0..2).map { |i| base + i * 86_400 + 6 * 3600 },
    "sunset" => (0..2).map { |i| base + i * 86_400 + 18 * 3600 }
  },
  "hourly" => {
    "time" => times,
    "temperature_2m" => hours.map { |hour| 18 - ((hour - 14).abs / 2.0) },
    "precipitation_probability" => wet.map { |value| value ? 70 : 10 },
    "precipitation" => wet.map { |value| value ? 1.2 : 0 },
    "wind_speed_10m" => hours.map { |hour| 5 + (hour % 5) },
    "weather_code" => wet.map { |value| value ? 61 : 1 }
  }
}
fields = {
  "lat_lon" => "47.4,8.8",
  "location_name" => "Sample location",
  "rain_limit" => "20",
  "minimum_hours" => "1",
  "daylight_mode" => "daylight",
  "units" => "metric"
}

case name
when "realistic"
when "imperial_long"
  fields["location_name"] = "Llanfairpwllgwyngyll, United Kingdom"
  fields["units"] = "imperial"
  data["hourly"]["temperature_2m"] = hours.map { |hour| -18 + (hour % 5) }
  data["hourly"]["wind_speed_10m"] = hours.map { |hour| 45 + (hour % 10) }
when "no_window"
  data["hourly"]["precipitation_probability"] = times.map { 90 }
  data["hourly"]["precipitation"] = times.map { 2.0 }
  data["hourly"]["weather_code"] = times.map { 61 }
when "incomplete"
  data["hourly"]["precipitation_probability"] = times.map { nil }
  data["hourly"]["temperature_2m"] = times.map { nil }
  data["hourly"]["wind_speed_10m"] = times.map { nil }
when "insufficient"
  fields["daylight_mode"] = "any"
  fields["minimum_hours"] = "3"
  last_index = ((now - base) / 3600).floor + 2
  data["hourly"].each { |key, values| data["hourly"][key] = values.first(last_index + 1) }
when "outdated"
  data["hourly"]["time"] = times.map { |t| t - 4 * 86_400 }
  data["daily"]["sunrise"] = data["daily"]["sunrise"].map { |t| t - 4 * 86_400 }
  data["daily"]["sunset"] = data["daily"]["sunset"].map { |t| t - 4 * 86_400 }
when "daylight_unavailable"
  data.delete("daily")
when "service_error"
  data = { "error" => "sample upstream failure" }
else
  abort "Unknown fixture: #{name}"
end

settings = YAML.load_file("src/settings.yml")
settings["strategy"] = "static"
settings["static_data"] = JSON.generate(data)
File.write("src/settings.yml", YAML.dump(settings))
File.write(".trmnlp.yml", YAML.dump("custom_fields" => fields))
puts "Prepared #{name}"
