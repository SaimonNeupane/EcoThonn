import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
} from "react-native";
import {
  EarthyCard,
  ThemeText,
  Colors,
  useThemeColors,
} from "../../../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../../../hooks/useLocation";

const API_KEY =
  process.env.EXPO_PUBLIC_API_KEY || "c5d369f4fe4e4ffa9ed83005262405";
const BASE_URL = "https://api.weatherapi.com/v1";

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    wind_mph: number;
    wind_dir: string;
    uv: number;
    precip_mm: number;
  };
}

interface ForecastData {
  forecast: {
    forecastday: {
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        daily_chance_of_rain: number;
        condition: {
          text: string;
          code: number;
        };
        uv: number;
      };
    }[];
  };
}

export default function WeatherScreen() {
  const themeColors = useThemeColors();
  const { location, fetchLocation, loading: locationLoading } = useLocation();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [selectedCrop, setSelectedCrop] = useState<string>("General");

  const getWeatherIcon = (code: number): any => {
    if (code === 1000) return "sunny";
    if ([1003, 1006].includes(code)) return "partly-sunny";
    if ([1009, 1030, 1135, 1147].includes(code)) return "cloudy";
    if (
      [
        1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1201,
        1207, 1240, 1243, 1246, 1249, 1252, 1255, 1264, 1267,
      ].includes(code)
    )
      return "rainy";
    if ([1087, 1273, 1276].includes(code)) return "thunderstorm";
    if (
      [
        1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237,
        1258, 1261, 1279, 1282,
      ].includes(code)
    )
      return "snow";
    return "partly-sunny";
  };

  const getWeatherIconColor = (code: number): string => {
    if (code === 1000) return "#FFB300";
    if ([1003, 1006].includes(code)) return "#FFA726";
    if (
      [
        1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1201,
        1207, 1240, 1243, 1246, 1249, 1252, 1255, 1264, 1267,
      ].includes(code)
    )
      return "#42A5F5";
    if ([1087, 1273, 1276].includes(code)) return "#0288D1";
    if (
      [
        1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237,
        1258, 1261, 1279, 1282,
      ].includes(code)
    )
      return "#90CAF9";
    return "#9E9E9E";
  };

  const getUVDescription = (uv: number): string => {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
  };

  const getDayName = (dateString: string, index: number): string => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getCropIrrigationAdvice = (crop: string) => {
    const current = weatherData?.current;
    if (!current || !forecastData) return null;

    const tomorrowForecast = forecastData.forecast.forecastday[1]?.day;
    const tomorrowRainChance = tomorrowForecast?.daily_chance_of_rain || 0;
    const humidity = current.humidity;
    const temp = current.temp_c;
    const uv = current.uv;
    const wind = current.wind_mph;

    const etEstimate = Math.max(
      1.2,
      parseFloat(
        (temp * 0.12 + wind * 0.05 + uv * 0.15 - humidity * 0.02).toFixed(1),
      ),
    );

    let baseVol = 0;
    let cropTerm = "";
    let cycleAdvisory = "";
    let runTimeMinutes = 0;
    let statusText = "NORMAL";
    let statusColor = "#2E7D32";

    switch (crop) {
      case "Rice / Paddy":
        baseVol = 8.5;
        cropTerm = "Paddy fields require standing water (2-5 cm).";
        if (tomorrowRainChance > 70) {
          statusText = "SKIP ADVISED";
          statusColor = "#E65100";
          cycleAdvisory = `Heavy natural rain (${tomorrowRainChance}%) expected. Skip cycle to prevent overflow and bund erosion. Ensure drainage gates are clear.`;
          runTimeMinutes = 0;
        } else if (tomorrowRainChance > 40) {
          statusText = "REDUCED";
          statusColor = "#0288D1";
          cycleAdvisory = `Moderate rain probability (${tomorrowRainChance}%). Reduce supplementation to 15 mins. Let rain top off standing water.`;
          runTimeMinutes = 15;
        } else {
          statusText = "NORMAL";
          statusColor = "#2E7D32";
          cycleAdvisory = `Dry conditions. Maintain standing water level. Run supplemental cycle for 45 mins tomorrow morning.`;
          runTimeMinutes = 45;
        }
        break;

      case "Maize / Corn":
        baseVol = 4.0;
        cropTerm = "Maize is highly sensitive to waterlogging at root level.";
        if (tomorrowRainChance > 40) {
          statusText = "SKIP ADVISED";
          statusColor = "#E65100";
          cycleAdvisory = `Rain chance is ${tomorrowRainChance}%. Skip cycle. Maize roots need breathing room; rainfall will suffice.`;
          runTimeMinutes = 0;
        } else if (temp > 30) {
          statusText = "INCREASED";
          statusColor = "#D32F2F";
          cycleAdvisory = `High heat (${Math.round(temp)}°C). Increase irrigation by 20%. Run for 35 mins at early dawn (5:30 AM) to prevent transpiration stress.`;
          runTimeMinutes = 35;
        } else {
          statusText = "NORMAL";
          statusColor = "#2E7D32";
          cycleAdvisory = `Stable conditions. Run standard 25-minute cycle tomorrow morning.`;
          runTimeMinutes = 25;
        }
        break;

      case "Vegetables":
        baseVol = 3.5;
        cropTerm =
          "Shallow-rooted vegetables require frequent, light watering.";
        if (tomorrowRainChance > 50) {
          statusText = "SKIP ADVISED";
          statusColor = "#E65100";
          cycleAdvisory = `High rain probability (${tomorrowRainChance}%). Skip morning irrigation. Monitor soil surface in afternoon.`;
          runTimeMinutes = 0;
        } else if (humidity > 80) {
          statusText = "REDUCED";
          statusColor = "#0288D1";
          cycleAdvisory = `High humidity (${humidity}%) slows transpiration and increases mold/fungi risk. Reduce run time to 15 mins.`;
          runTimeMinutes = 15;
        } else if (temp > 32) {
          statusText = "INCREASED";
          statusColor = "#D32F2F";
          cycleAdvisory = `Extreme temperature (${Math.round(temp)}°C). Vegetables risk wilting. Run two split cycles: 20 mins at dawn, 10 mins at dusk.`;
          runTimeMinutes = 30;
        } else {
          statusText = "NORMAL";
          statusColor = "#2E7D32";
          cycleAdvisory = `Normal evapotranspiration. Run standard 20-minute cycle tomorrow morning.`;
          runTimeMinutes = 20;
        }
        break;

      case "Citrus / Orchard":
        baseVol = 5.0;
        cropTerm =
          "Orchards require deep root zone watering for fruit development.";
        if (tomorrowRainChance > 60) {
          statusText = "SKIP ADVISED";
          statusColor = "#E65100";
          cycleAdvisory = `Significant rain expected (${tomorrowRainChance}%). Skip cycle. Let deep rain saturate the subsoil.`;
          runTimeMinutes = 0;
        } else if (temp > 33) {
          statusText = "INCREASED";
          statusColor = "#D32F2F";
          cycleAdvisory = `Hot day. Run deep drip system for 40 mins. High ambient temperature increases soil water depletion.`;
          runTimeMinutes = 40;
        } else {
          statusText = "NORMAL";
          statusColor = "#2E7D32";
          cycleAdvisory = `Standard orchard requirements. Run drip system for 30 mins tomorrow morning.`;
          runTimeMinutes = 30;
        }
        break;

      case "General":
      default:
        baseVol = 4.5;
        cropTerm = "Average requirement for standard loamy garden soil.";
        if (tomorrowRainChance > 50) {
          statusText = "SKIP ADVISED";
          statusColor = "#E65100";
          cycleAdvisory = `Rain probability is ${tomorrowRainChance}% tomorrow. Skip irrigation cycle to save water and prevent runoff.`;
          runTimeMinutes = 0;
        } else if (humidity > 80) {
          statusText = "REDUCED";
          statusColor = "#0288D1";
          cycleAdvisory = `Relative humidity is high (${humidity}%). Reduce water cycle duration by 25% to mitigate fungal risks.`;
          runTimeMinutes = 15;
        } else if (temp > 32) {
          statusText = "INCREASED";
          statusColor = "#D32F2F";
          cycleAdvisory = `High temperature (${Math.round(temp)}°C) accelerates evaporation. Increase cycle duration by 20%.`;
          runTimeMinutes = 30;
        } else {
          statusText = "NORMAL";
          statusColor = "#2E7D32";
          cycleAdvisory = `Weather stable. Maintain standard irrigation schedule tomorrow morning.`;
          runTimeMinutes = 25;
        }
        break;
    }

    const isSkip = statusText === "SKIP ADVISED";
    const waterSavingsGallons = isSkip
      ? crop === "Rice / Paddy"
        ? 22000
        : 15000
      : 0;
    const hydrationIndex = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          humidity * 0.5 + (100 - temp * 2) * 0.2 + tomorrowRainChance * 0.3,
        ),
      ),
    );

    return {
      statusText,
      statusColor,
      cycleAdvisory,
      runTimeMinutes,
      baseVol,
      cropTerm,
      etEstimate,
      waterSavingsGallons,
      hydrationIndex,
    };
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setWeatherError(null);

      const currentResponse = await fetch(
        `${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&aqi=no`,
      );
      if (!currentResponse.ok) {
        throw new Error("Failed to fetch current weather details");
      }
      const currentData = await currentResponse.json();

      const forecastResponse = await fetch(
        `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=no`,
      );
      if (!forecastResponse.ok) {
        throw new Error("Failed to fetch forecast details");
      }
      const forecastDataResponse = await forecastResponse.json();

      setWeatherData(currentData);
      setForecastData(forecastDataResponse);
    } catch (error: any) {
      console.error("Error fetching weather:", error);
      setWeatherError(error.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeWeather = async () => {
      let coords = location;
      if (!coords && fetchLocation) {
        coords = await fetchLocation();
      }
      if (coords) {
        await fetchWeatherData(coords.latitude, coords.longitude);
      } else {
        await fetchWeatherData(27.7172, 85.324);
      }
    };

    initializeWeather();
  }, [location]);

  const handleRefresh = async () => {
    let coords = location;
    if (fetchLocation) {
      const newCoords = await fetchLocation();
      coords = newCoords || coords;
    }

    if (coords) {
      await fetchWeatherData(coords.latitude, coords.longitude);
      Alert.alert(
        "Refresh",
        "Weather and telemetry details refreshed successfully.",
      );
    } else {
      await fetchWeatherData(27.7172, 85.324);
      Alert.alert(
        "Refresh",
        "Weather details refreshed successfully using default location.",
      );
    }
  };

  if (locationLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.bg,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.darkGreen} />
        <ThemeText category="body" style={{ marginTop: 16 }}>
          Detecting location...
        </ThemeText>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.bg,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.darkGreen} />
        <ThemeText category="body" style={{ marginTop: 16 }}>
          Loading weather data...
        </ThemeText>
      </View>
    );
  }

  if (weatherError || !weatherData || !forecastData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.bg,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          },
        ]}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={Colors.accentOrange}
          style={{ marginBottom: 16 }}
        />
        <ThemeText category="h2" style={{ textAlign: "center" }}>
          Weather Service Offline
        </ThemeText>
        <ThemeText
          category="body"
          style={{
            marginTop: 8,
            textAlign: "center",
            color: Colors.textSecondary,
          }}
        >
          {weatherError ||
            "Unable to download telemetric data. Please check your internet connection."}
        </ThemeText>
        <TouchableOpacity
          style={styles.retryBtnLarge}
          onPress={() => fetchLocation()}
        >
          <Text style={styles.retryBtnTextLarge}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWeather = weatherData.current;
  const forecastDays = forecastData.forecast.forecastday;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View>
          <ThemeText category="h2">Weather & Smart Farm</ThemeText>
          <ThemeText category="caption" style={{ marginTop: 4 }}>
            {weatherData.location.name}, {weatherData.location.country}
          </ThemeText>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={Colors.darkGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!location && (
          <TouchableOpacity
            style={styles.locationBanner}
            onPress={fetchLocation}
          >
            <Ionicons name="location-outline" size={16} color={Colors.white} />
            <Text style={styles.locationBannerText}>
              Using default location. Tap to grant GPS access for live local
              weather.
            </Text>
          </TouchableOpacity>
        )}

        {/* CURRENT WEATHER OVERVIEW */}
        <EarthyCard style={styles.currentWeatherCard}>
          <View style={styles.weatherSummaryRow}>
            <View style={styles.mainTempBlock}>
              <Text style={styles.currentTempText}>
                {Math.round(currentWeather.temp_c)}°
              </Text>
              <View style={{ marginLeft: 8 }}>
                <ThemeText category="h2" style={{ color: Colors.white }}>
                  {currentWeather.condition.text}
                </ThemeText>
                <ThemeText
                  category="caption"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Feels like {Math.round(currentWeather.feelslike_c)}°C • 📍{" "}
                  {location
                    ? `${location.latitude.toFixed(3)}°, ${location.longitude.toFixed(3)}°`
                    : "Default (Kathmandu)"}
                </ThemeText>
              </View>
            </View>
            <Ionicons
              name={getWeatherIcon(currentWeather.condition.code)}
              size={64}
              color={getWeatherIconColor(currentWeather.condition.code)}
            />
          </View>

          <View style={styles.weatherMetricsDivider} />

          <View style={styles.weatherMetricsGrid}>
            <View style={styles.metricItem}>
              <Ionicons name="water-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>{currentWeather.humidity}%</Text>
                <Text style={styles.metricLbl}>Humidity</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="rainy-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>
                  {currentWeather.precip_mm.toFixed(1)} mm
                </Text>
                <Text style={styles.metricLbl}>Precipitation</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="cloudy-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>
                  {currentWeather.wind_dir}{" "}
                  {Math.round(currentWeather.wind_mph)} mph
                </Text>
                <Text style={styles.metricLbl}>Wind Speed</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="sunny-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>
                  {Math.round(currentWeather.uv)} (
                  {getUVDescription(currentWeather.uv)})
                </Text>
                <Text style={styles.metricLbl}>Solar UV Index</Text>
              </View>
            </View>
          </View>
        </EarthyCard>

        {/* 5-DAY FORECAST */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          5-Day Forecast
        </ThemeText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastScroll}
        >
          {forecastDays.map((item, idx) => (
            <EarthyCard key={idx} style={styles.forecastCard}>
              <ThemeText category="bodyBold" style={styles.forecastDay}>
                {getDayName(item.date, idx)}
              </ThemeText>
              <Ionicons
                name={getWeatherIcon(item.day.condition.code)}
                size={28}
                color={getWeatherIconColor(item.day.condition.code)}
                style={{ marginVertical: 8 }}
              />
              <ThemeText category="caption" style={{ fontWeight: "700" }}>
                {Math.round(item.day.maxtemp_c)}° /{" "}
                {Math.round(item.day.mintemp_c)}°
              </ThemeText>
              <View style={styles.rainBadge}>
                <Ionicons name="water" size={10} color="#42A5F5" />
                <Text style={styles.rainBadgeText}>
                  {item.day.daily_chance_of_rain}%
                </Text>
              </View>
            </EarthyCard>
          ))}
        </ScrollView>

        {/* SMART IRRIGATION ADVISORY */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Smart Irrigation Advisor
        </ThemeText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cropSelectorScroll}
        >
          {[
            "General",
            "Rice / Paddy",
            "Maize / Corn",
            "Vegetables",
            "Citrus / Orchard",
          ].map((crop) => (
            <TouchableOpacity
              key={crop}
              style={[
                styles.cropPill,
                selectedCrop === crop
                  ? { backgroundColor: Colors.darkGreen }
                  : { backgroundColor: themeColors.border + "40" },
              ]}
              onPress={() => setSelectedCrop(crop)}
            >
              <Text
                style={[
                  styles.cropPillText,
                  selectedCrop === crop
                    ? { color: Colors.white, fontWeight: "700" }
                    : { color: themeColors.text },
                ]}
              >
                {crop}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(() => {
          const advice = getCropIrrigationAdvice(selectedCrop);
          if (!advice) return null;

          return (
            <EarthyCard style={styles.irrigationCard}>
              {/* Header row: icon + title + status badge */}
              <View style={styles.irrigationCardHeader}>
                <View style={styles.irrigationIconBg}>
                  <Ionicons name="water" size={20} color={Colors.darkGreen} />
                </View>
                <ThemeText category="h3" style={{ marginLeft: 10, flex: 1 }}>
                  Irrigation Advisory
                </ThemeText>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: advice.statusColor + "18" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: advice.statusColor },
                    ]}
                  >
                    {advice.statusText}
                  </Text>
                </View>
              </View>

              {/* Advisory Text */}
              <View style={styles.advisoryTextBox}>
                <ThemeText
                  category="body"
                  style={styles.irrigationAdvisoryText}
                >
                  {advice.cycleAdvisory}
                </ThemeText>
              </View>

              {/* Hydration bar — single compact row */}
              <View style={styles.hydrationRow}>
                <Text
                  style={[
                    styles.hydrationLabel,
                    { color: themeColors.text + "70" },
                  ]}
                >
                  Hydration
                </Text>
                <View style={styles.hydrationProgressBg}>
                  <View
                    style={[
                      styles.hydrationProgressBar,
                      {
                        width: `${advice.hydrationIndex}%`,
                        backgroundColor:
                          advice.hydrationIndex < 35
                            ? "#FFA726"
                            : advice.hydrationIndex < 75
                              ? "#66BB6A"
                              : "#29B6F6",
                      },
                    ]}
                  />
                </View>
                <ThemeText
                  category="caption"
                  style={{
                    fontWeight: "700",
                    color: Colors.darkGreen,
                    minWidth: 34,
                    textAlign: "right",
                  }}
                >
                  {advice.hydrationIndex}%
                </ThemeText>
              </View>
            </EarthyCard>
          );
        })()}

        {/* ALERTS */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Alerts
        </ThemeText>

        {currentWeather.humidity > 70 && (
          <EarthyCard style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View
                style={[
                  styles.alertIconCircle,
                  { backgroundColor: "#FF704320" },
                ]}
              >
                <Ionicons name="bug" size={22} color="#FF7043" />
              </View>
              <View style={styles.alertTexts}>
                <ThemeText category="bodyBold" style={{ color: "#FF7043" }}>
                  Fungal Risk Warning
                </ThemeText>
                <ThemeText category="caption" style={styles.alertDesc}>
                  Current humidity at {currentWeather.humidity}% creates
                  favorable conditions for fungal growth. Consider applying
                  organic fungicide protection to crop bases.
                </ThemeText>
              </View>
            </View>
          </EarthyCard>
        )}

        {currentWeather.uv >= 8 && (
          <EarthyCard style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View
                style={[
                  styles.alertIconCircle,
                  { backgroundColor: "#FFB30020" },
                ]}
              >
                <Ionicons name="sunny" size={22} color="#FFB300" />
              </View>
              <View style={styles.alertTexts}>
                <ThemeText category="bodyBold" style={{ color: "#E65100" }}>
                  Extreme UV Advisory
                </ThemeText>
                <ThemeText category="caption" style={styles.alertDesc}>
                  UV index at {Math.round(currentWeather.uv)} (
                  {getUVDescription(currentWeather.uv)}). Move high-sensitivity
                  seedlings under shade screens during peak hours.
                </ThemeText>
              </View>
            </View>
          </EarthyCard>
        )}

        {currentWeather.wind_mph > 20 && (
          <EarthyCard style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View
                style={[
                  styles.alertIconCircle,
                  { backgroundColor: "#42A5F520" },
                ]}
              >
                <Ionicons name="cloudy" size={22} color="#42A5F5" />
              </View>
              <View style={styles.alertTexts}>
                <ThemeText category="bodyBold" style={{ color: "#0277BD" }}>
                  High Wind Alert
                </ThemeText>
                <ThemeText category="caption" style={styles.alertDesc}>
                  Wind speeds at {Math.round(currentWeather.wind_mph)} mph from{" "}
                  {currentWeather.wind_dir}. Secure loose structures and delay
                  spraying operations.
                </ThemeText>
              </View>
            </View>
          </EarthyCard>
        )}

        {currentWeather.humidity <= 70 &&
          currentWeather.uv < 8 &&
          currentWeather.wind_mph <= 20 && (
            <EarthyCard style={styles.alertCard}>
              <View style={styles.alertRow}>
                <View
                  style={[
                    styles.alertIconCircle,
                    { backgroundColor: "#4CAF5020" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                </View>
                <View style={styles.alertTexts}>
                  <ThemeText category="bodyBold" style={{ color: "#2E7D32" }}>
                    No Active Alerts
                  </ThemeText>
                  <ThemeText category="caption" style={styles.alertDesc}>
                    Weather conditions are favorable for normal farming
                    operations. Continue with scheduled activities.
                  </ThemeText>
                </View>
              </View>
            </EarthyCard>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  refreshBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  currentWeatherCard: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  weatherSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainTempBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentTempText: {
    fontSize: 56,
    fontWeight: "900",
    color: Colors.white,
  },
  weatherMetricsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 16,
  },
  weatherMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  metricTextGroup: {
    marginLeft: 8,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.white,
  },
  metricLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
  },
  sectionTitle: {
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 10,
  },
  forecastScroll: {
    paddingVertical: 4,
    paddingRight: 24,
    marginBottom: 8,
  },
  forecastCard: {
    width: 96,
    alignItems: "center",
    padding: 12,
    marginRight: 10,
    borderRadius: 16,
  },
  forecastDay: {
    fontSize: 12,
  },
  rainBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#E1F5FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rainBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#0288D1",
    marginLeft: 2,
  },
  irrigationCard: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: Colors.lightGreen + "12",
    borderWidth: 1,
    borderColor: Colors.lightGreen + "35",
  },
  irrigationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  irrigationIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.lightGreen + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  irrigationAdvisoryText: {
    lineHeight: 20,
    color: Colors.darkGreen,
    fontSize: 13,
  },
  advisoryTextBox: {
    backgroundColor: "rgba(0,0,0,0.025)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.darkGreen,
  },
  hydrationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hydrationProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(0,0,0,0.07)",
    borderRadius: 3,
    overflow: "hidden",
  },
  hydrationProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  hydrationLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  alertCard: {
    padding: 14,
    borderRadius: 16,
    marginVertical: 4,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTexts: {
    flex: 1,
    marginLeft: 12,
  },
  alertDesc: {
    marginTop: 4,
    lineHeight: 16,
  },
  retryBtnLarge: {
    marginTop: 24,
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnTextLarge: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationBannerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  cropSelectorScroll: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  cropPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  cropPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
