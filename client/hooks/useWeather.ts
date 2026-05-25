import { useState, useEffect, useCallback } from "react";

// ─── Open-Meteo endpoints ────────────────────────────────────────────────────
const BASE_URL = "https://api.open-meteo.com/v1/forecast";

// WMO Weather Interpretation Code → Ionicon name + colour
export const WMO_ICON_MAP: Record<number, { icon: string; color: string }> = {
  0: { icon: "sunny", color: "#FFB300" },
  1: { icon: "sunny", color: "#FFB300" },
  2: { icon: "partly-sunny", color: "#FFA726" },
  3: { icon: "cloudy", color: "#9E9E9E" },
  45: { icon: "cloudy", color: "#BDBDBD" },
  48: { icon: "cloudy", color: "#BDBDBD" },
  51: { icon: "rainy", color: "#64B5F6" },
  53: { icon: "rainy", color: "#42A5F5" },
  55: { icon: "rainy", color: "#1E88E5" },
  61: { icon: "rainy", color: "#64B5F6" },
  63: { icon: "rainy", color: "#1E88E5" },
  65: { icon: "rainy", color: "#1565C0" },
  71: { icon: "snow", color: "#90CAF9" },
  73: { icon: "snow", color: "#90CAF9" },
  75: { icon: "snow", color: "#BBDEFB" },
  80: { icon: "rainy", color: "#42A5F5" },
  81: { icon: "rainy", color: "#1E88E5" },
  82: { icon: "rainy", color: "#0D47A1" },
  95: { icon: "thunderstorm", color: "#0288D1" },
  96: { icon: "thunderstorm", color: "#01579B" },
  99: { icon: "thunderstorm", color: "#01579B" },
};

export const WMO_TEXT_MAP: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Slight Snowfall",
  73: "Moderate Snowfall",
  75: "Heavy Snowfall",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Thunderstorm with Heavy Hail",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurrentWeather {
  temperature_2m: number; // °C
  apparent_temperature: number; // °C
  relative_humidity_2m: number; // %
  precipitation: number; // mm (last hour)
  rain: number; // mm
  weather_code: number; // WMO code
  wind_speed_10m: number; // km/h
  wind_direction_10m: number; // degrees
  surface_pressure: number; // hPa
  cloud_cover: number; // %
  is_day: number; // 0 | 1
  et0_fao_evapotranspiration: number; // mm (hourly)
  soil_temperature_0cm: number; // °C
  soil_moisture_0_1cm: number; // m³/m³
}

export interface DailyForecast {
  date: string;
  weather_code: number;
  temp_max: number;
  temp_min: number;
  precipitation_sum: number; // mm
  rain_sum: number; // mm
  precipitation_probability_max: number; // %
  wind_speed_10m_max: number;
  et0_fao_evapotranspiration: number; // mm/day
  uv_index_max: number;
  sunrise: string;
  sunset: string;
}

export interface HourlySlice {
  time: string;
  temperature: number;
  precipitation: number;
  precipitation_probability: number;
  soil_temperature_0cm: number;
  soil_moisture_0_1cm: number;
  et0_fao_evapotranspiration: number;
}

/**
 * FarmWeatherContext — rich structured context for RAG / LLM chatbot ingestion.
 * Embed or pass this object to the chatbot as system context.
 */
export interface FarmWeatherContext {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    elevation_m: number;
    timezone: string;
  };
  current: {
    condition_text: string;
    temperature_c: number;
    feels_like_c: number;
    humidity_pct: number;
    cloud_cover_pct: number;
    wind_speed_kmh: number;
    wind_direction_deg: number;
    surface_pressure_hpa: number;
    precipitation_last_hour_mm: number;
    soil_temp_surface_c: number;
    soil_moisture_surface_m3m3: number;
    et0_evapotranspiration_mm: number;
    is_daytime: boolean;
  };
  season: {
    label: string; // e.g. "Pre-monsoon transitional"
    monsoon_onset_expected: boolean;
    days_since_last_rain: number;
  };
  rainfall_summary: {
    last_7_days_mm: number;
    last_14_days_mm: number;
    next_7_days_forecast_mm: number;
    next_14_days_forecast_mm: number;
  };
  forecast_14_days: {
    date: string;
    condition: string;
    temp_max_c: number;
    temp_min_c: number;
    rain_probability_pct: number;
    rain_sum_mm: number;
    uv_index: number;
    et0_mm: number;
  }[];
  irrigation_advisory: {
    skip_recommended: boolean;
    reason: string;
    next_significant_rain_date: string | null;
    estimated_water_saving_gallons: number;
  };
  farming_alerts: {
    type:
      | "fungal_risk"
      | "extreme_uv"
      | "high_wind"
      | "drought_stress"
      | "frost_risk"
      | "flood_risk"
      | "all_clear";
    severity: "low" | "moderate" | "high";
    message: string;
  }[];
  soil_signals: {
    surface_moisture_status: "dry" | "optimal" | "wet" | "saturated";
    surface_temp_status: "cold" | "optimal" | "warm" | "hot";
    evapotranspiration_rate: "low" | "moderate" | "high";
  };
}

export interface WeatherState {
  current: CurrentWeather | null;
  daily: DailyForecast[];
  hourly: HourlySlice[]; // next 48h window
  farmContext: FarmWeatherContext | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function windDegToDir(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getUVLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function getSoilMoistureStatus(
  m3m3: number,
): FarmWeatherContext["soil_signals"]["surface_moisture_status"] {
  if (m3m3 < 0.1) return "dry";
  if (m3m3 < 0.25) return "optimal";
  if (m3m3 < 0.4) return "wet";
  return "saturated";
}

function getSoilTempStatus(
  t: number,
): FarmWeatherContext["soil_signals"]["surface_temp_status"] {
  if (t < 10) return "cold";
  if (t < 25) return "optimal";
  if (t < 35) return "warm";
  return "hot";
}

function getETRate(
  et: number,
): FarmWeatherContext["soil_signals"]["evapotranspiration_rate"] {
  if (et < 2) return "low";
  if (et < 5) return "moderate";
  return "high";
}

function getSeasonLabel(month: number): string {
  // Nepal agricultural seasons
  if ([3, 4].includes(month)) return "Pre-monsoon transitional";
  if ([5, 6, 7, 8].includes(month)) return "Monsoon (Kharif season)";
  if ([9, 10].includes(month)) return "Post-monsoon / Rabi planting";
  if ([11, 12, 1, 2].includes(month)) return "Winter dry season";
  return "Transitional";
}

function isMonsoonOnset(month: number, nextRainMm: number): boolean {
  return (month === 5 || month === 6) && nextRainMm > 30;
}

function daysSinceLastRain(
  dailyHistory: { rain_sum: number; date: string }[],
): number {
  for (let i = dailyHistory.length - 1; i >= 0; i--) {
    if (dailyHistory[i].rain_sum > 0.5) {
      return dailyHistory.length - 1 - i;
    }
  }
  return dailyHistory.length;
}

function nextSignificantRainDate(forecast: DailyForecast[]): string | null {
  const hit = forecast.find(
    (d) => d.rain_sum > 2 || d.precipitation_probability_max >= 60,
  );
  return hit ? hit.date : null;
}

function buildFarmingAlerts(
  current: CurrentWeather,
  forecast: DailyForecast[],
): FarmWeatherContext["farming_alerts"] {
  const alerts: FarmWeatherContext["farming_alerts"] = [];

  if (current.relative_humidity_2m > 75) {
    alerts.push({
      type: "fungal_risk",
      severity: current.relative_humidity_2m > 85 ? "high" : "moderate",
      message: `Humidity at ${current.relative_humidity_2m}% — favorable for fungal/mould growth. Apply preventative fungicide to crop bases.`,
    });
  }

  const uvMax = forecast[0]?.uv_index_max ?? 0;
  if (uvMax >= 8) {
    alerts.push({
      type: "extreme_uv",
      severity: uvMax >= 11 ? "high" : "moderate",
      message: `UV Index ${uvMax} (${getUVLabel(uvMax)}) expected today. Move sensitive seedlings under shade 11AM–3PM.`,
    });
  }

  if (current.wind_speed_10m > 30) {
    alerts.push({
      type: "high_wind",
      severity: current.wind_speed_10m > 50 ? "high" : "moderate",
      message: `Wind speed ${current.wind_speed_10m} km/h from ${windDegToDir(current.wind_direction_10m)}. Secure structures; delay spraying.`,
    });
  }

  if (current.soil_moisture_0_1cm < 0.08 && current.rain < 0.1) {
    alerts.push({
      type: "drought_stress",
      severity: current.soil_moisture_0_1cm < 0.05 ? "high" : "low",
      message:
        "Surface soil moisture critically low. Immediate irrigation recommended for shallow-rooted crops.",
    });
  }

  const floodRisk = forecast.slice(0, 3).some((d) => d.rain_sum > 25);
  if (floodRisk) {
    alerts.push({
      type: "flood_risk",
      severity: "high",
      message:
        "Heavy rain (>25mm/day) forecast in next 3 days. Check drainage channels and embankments.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "all_clear",
      severity: "low",
      message:
        "Weather conditions are favorable for normal farming operations.",
    });
  }

  return alerts;
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useWeather(
  latitude: number = 27.7172,
  longitude: number = 85.324,
  locationName: string = "Kathmandu Valley, Nepal",
  elevationM: number = 1340,
) {
  const [state, setState] = useState<WeatherState>({
    current: null,
    daily: [],
    hourly: [],
    farmContext: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchWeather = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        elevation: elevationM.toString(),
        timezone: "Asia/Kathmandu",
        // Current
        current: [
          "temperature_2m",
          "apparent_temperature",
          "relative_humidity_2m",
          "precipitation",
          "rain",
          "weather_code",
          "wind_speed_10m",
          "wind_direction_10m",
          "surface_pressure",
          "cloud_cover",
          "is_day",
        ].join(","),
        // Hourly (for soil & ET data, returned as arrays)
        hourly: [
          "temperature_2m",
          "precipitation",
          "precipitation_probability",
          "soil_temperature_0cm",
          "soil_moisture_0_1cm",
          "et0_fao_evapotranspiration",
        ].join(","),
        // Daily forecast (16 days)
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "rain_sum",
          "precipitation_probability_max",
          "wind_speed_10m_max",
          "et0_fao_evapotranspiration",
          "uv_index_max",
          "sunrise",
          "sunset",
        ].join(","),
        forecast_days: "14",
        past_days: "7",
      });

      const res = await fetch(`${BASE_URL}?${params}`);
      if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);
      const data = await res.json();

      // ── Parse current ──
      const c = data.current;
      const current: CurrentWeather = {
        temperature_2m: c.temperature_2m,
        apparent_temperature: c.apparent_temperature,
        relative_humidity_2m: c.relative_humidity_2m,
        precipitation: c.precipitation,
        rain: c.rain,
        weather_code: c.weather_code,
        wind_speed_10m: c.wind_speed_10m,
        wind_direction_10m: c.wind_direction_10m,
        surface_pressure: c.surface_pressure,
        cloud_cover: c.cloud_cover,
        is_day: c.is_day,
        // Pull nearest hourly values for soil/ET
        et0_fao_evapotranspiration:
          data.hourly?.et0_fao_evapotranspiration?.[0] ?? 0,
        soil_temperature_0cm: data.hourly?.soil_temperature_0cm?.[0] ?? 20,
        soil_moisture_0_1cm: data.hourly?.soil_moisture_0_1cm?.[0] ?? 0.2,
      };

      // ── Parse daily ──
      const daily: DailyForecast[] = (data.daily?.time ?? []).map(
        (date: string, i: number) => ({
          date,
          weather_code: data.daily.weather_code[i],
          temp_max: data.daily.temperature_2m_max[i],
          temp_min: data.daily.temperature_2m_min[i],
          precipitation_sum: data.daily.precipitation_sum[i],
          rain_sum: data.daily.rain_sum[i],
          precipitation_probability_max:
            data.daily.precipitation_probability_max[i],
          wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
          et0_fao_evapotranspiration: data.daily.et0_fao_evapotranspiration[i],
          uv_index_max: data.daily.uv_index_max[i],
          sunrise: data.daily.sunrise[i],
          sunset: data.daily.sunset[i],
        }),
      );

      // Split past (history) vs future
      const today = new Date().toISOString().split("T")[0];
      const todayIdx = daily.findIndex((d) => d.date >= today);
      const history = todayIdx > 0 ? daily.slice(0, todayIdx) : [];
      const forecast = daily.slice(todayIdx >= 0 ? todayIdx : 0);

      // ── Parse hourly slice (next 48h from now) ──
      const nowISO = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
      const hourly: HourlySlice[] = (data.hourly?.time ?? [])
        .map((t: string, i: number) => ({
          time: t,
          temperature: data.hourly.temperature_2m[i],
          precipitation: data.hourly.precipitation[i],
          precipitation_probability: data.hourly.precipitation_probability[i],
          soil_temperature_0cm: data.hourly.soil_temperature_0cm[i],
          soil_moisture_0_1cm: data.hourly.soil_moisture_0_1cm[i],
          et0_fao_evapotranspiration: data.hourly.et0_fao_evapotranspiration[i],
        }))
        .filter((h: HourlySlice) => h.time >= nowISO)
        .slice(0, 48);

      // ── Compute rainfall summaries ──
      const last7 = history
        .slice(-7)
        .reduce((s, d) => s + (d.rain_sum || 0), 0);
      const last14 = history.reduce((s, d) => s + (d.rain_sum || 0), 0);
      const next7 = forecast
        .slice(0, 7)
        .reduce((s, d) => s + (d.rain_sum || 0), 0);
      const next14 = forecast
        .slice(0, 14)
        .reduce((s, d) => s + (d.rain_sum || 0), 0);

      // ── Season ──
      const month = new Date().getMonth() + 1;
      const seasonLabel = getSeasonLabel(month);
      const monsoonOnset = isMonsoonOnset(month, next14);
      const daysSince = daysSinceLastRain(history);

      // ── Irrigation advisory ──
      const rainIn2Days = forecast
        .slice(0, 2)
        .some((d) => d.precipitation_probability_max > 50);
      const skipIrrigation = rainIn2Days;
      const irrigationSave = skipIrrigation ? 15000 : 8000;

      // ── Farming alerts ──
      const farmingAlerts = buildFarmingAlerts(current, forecast);

      // ── Soil signals ──
      const soilSignals: FarmWeatherContext["soil_signals"] = {
        surface_moisture_status: getSoilMoistureStatus(
          current.soil_moisture_0_1cm,
        ),
        surface_temp_status: getSoilTempStatus(current.soil_temperature_0cm),
        evapotranspiration_rate: getETRate(current.et0_fao_evapotranspiration),
      };

      // ── Build FarmWeatherContext ──
      const farmContext: FarmWeatherContext = {
        location: {
          name: locationName,
          latitude,
          longitude,
          elevation_m: elevationM,
          timezone: "Asia/Kathmandu",
        },
        current: {
          condition_text: WMO_TEXT_MAP[current.weather_code] ?? "Unknown",
          temperature_c: current.temperature_2m,
          feels_like_c: current.apparent_temperature,
          humidity_pct: current.relative_humidity_2m,
          cloud_cover_pct: current.cloud_cover,
          wind_speed_kmh: current.wind_speed_10m,
          wind_direction_deg: current.wind_direction_10m,
          surface_pressure_hpa: current.surface_pressure,
          precipitation_last_hour_mm: current.precipitation,
          soil_temp_surface_c: current.soil_temperature_0cm,
          soil_moisture_surface_m3m3: current.soil_moisture_0_1cm,
          et0_evapotranspiration_mm: current.et0_fao_evapotranspiration,
          is_daytime: current.is_day === 1,
        },
        season: {
          label: seasonLabel,
          monsoon_onset_expected: monsoonOnset,
          days_since_last_rain: daysSince,
        },
        rainfall_summary: {
          last_7_days_mm: Math.round(last7 * 10) / 10,
          last_14_days_mm: Math.round(last14 * 10) / 10,
          next_7_days_forecast_mm: Math.round(next7 * 10) / 10,
          next_14_days_forecast_mm: Math.round(next14 * 10) / 10,
        },
        forecast_14_days: forecast.slice(0, 14).map((d) => ({
          date: d.date,
          condition: WMO_TEXT_MAP[d.weather_code] ?? "Unknown",
          temp_max_c: d.temp_max,
          temp_min_c: d.temp_min,
          rain_probability_pct: d.precipitation_probability_max,
          rain_sum_mm: d.rain_sum,
          uv_index: d.uv_index_max,
          et0_mm: d.et0_fao_evapotranspiration,
        })),
        irrigation_advisory: {
          skip_recommended: skipIrrigation,
          reason: skipIrrigation
            ? `Rain probability >50% in next 48h. Skipping irrigation conserves ~${irrigationSave.toLocaleString()} gallons.`
            : `No significant rain forecast. Maintain standard irrigation schedule.`,
          next_significant_rain_date: nextSignificantRainDate(forecast),
          estimated_water_saving_gallons: irrigationSave,
        },
        farming_alerts: farmingAlerts,
        soil_signals: soilSignals,
      };

      setState({
        current,
        daily: forecast,
        hourly,
        farmContext,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message ?? "Failed to fetch weather data",
      }));
    }
  }, [latitude, longitude, locationName, elevationM]);

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    ...state,
    refresh: fetchWeather,
    windDegToDir,
    getUVLabel,
    WMO_ICON_MAP,
    WMO_TEXT_MAP,
  };
}
