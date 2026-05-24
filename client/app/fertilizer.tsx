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
} from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../hooks/useLocation";

const API_KEY = "c5d369f4fe4e4ffa9ed83005262405";
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

  // Map weather condition codes to Ionicons
  const getWeatherIcon = (code: number): any => {
    if (code === 1000) return "sunny";
    if ([1003, 1006].includes(code)) return "partly-sunny";
    if ([1009, 1030, 1135, 1147].includes(code)) return "cloudy";
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code))
      return "rainy";
    if ([1087, 1273, 1276].includes(code)) return "thunderstorm";
    if ([1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code))
      return "snow";
    return "partly-sunny";
  };

  const getWeatherIconColor = (code: number): string => {
    if (code === 1000) return "#FFB300";
    if ([1003, 1006].includes(code)) return "#FFA726";
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code))
      return "#42A5F5";
    if ([1087, 1273, 1276].includes(code)) return "#0288D1";
    if ([1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code))
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

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setLoading(true);

      // Fetch current weather
      const currentResponse = await fetch(
        `${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&aqi=no`
      );

      if (!currentResponse.ok) {
        throw new Error("Failed to fetch current weather");
      }

      const currentData = await currentResponse.json();

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=no`
      );

      if (!forecastResponse.ok) {
        throw new Error("Failed to fetch forecast");
      }

      const forecastDataResponse = await forecastResponse.json();

      setWeatherData(currentData);
      setForecastData(forecastDataResponse);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      Alert.alert("Error", "Failed to fetch weather data. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeWeather = async () => {
      let coords = location;

      // If no location yet, try to fetch it
      if (!coords && fetchLocation) {
        coords = await fetchLocation();
      }

      // Use location if available, otherwise use default Kathmandu coordinates
      const lat = coords?.latitude || 27.6221;
      const lon = coords?.longitude || 85.5428;

      await fetchWeatherData(lat, lon);
    };

    initializeWeather();
  }, [location]);

  const handleRefresh = async () => {
    // Try to get fresh location
    let coords = location;
    if (fetchLocation) {
      const newCoords = await fetchLocation();
      coords = newCoords || coords;
    }

    const lat = coords?.latitude || 27.6221;
    const lon = coords?.longitude || 85.5428;

    await fetchWeatherData(lat, lon);
    Alert.alert(
      "Refresh",
      "Weather and telemetry details refreshed successfully."
    );
  };

  if (loading || !weatherData || !forecastData) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themeColors.bg, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.darkGreen} />
        <ThemeText category="body" style={{ marginTop: 16 }}>
          {locationLoading ? "Getting your location..." : "Loading weather data..."}
        </ThemeText>
      </View>
    );
  }

  const currentWeather = weatherData.current;
  const forecastDays = forecastData.forecast.forecastday;

  // Calculate irrigation advisory based on forecast
  const getRainProbability = () => {
    if (forecastDays.length >= 2) {
      return forecastDays[2]?.day?.daily_chance_of_rain || 0;
    }
    return 0;
  };

  const rainProbMonday = getRainProbability();
  const shouldSkipIrrigation = rainProbMonday > 50;

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
                  Feels like {Math.round(currentWeather.feelslike_c)}°C
                  {location && (
                    <> • 📍 {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°</>
                  )}
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
                  {currentWeather.wind_dir} {Math.round(currentWeather.wind_mph)} mph
                </Text>
                <Text style={styles.metricLbl}>Wind Speed</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="sunny-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>
                  {Math.round(currentWeather.uv)} ({getUVDescription(currentWeather.uv)})
                </Text>
                <Text style={styles.metricLbl}>Solar UV Index</Text>
              </View>
            </View>
          </View>
        </EarthyCard>

        {/* 5-DAY PREDICTIVE FORECAST */}
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
                {Math.round(item.day.maxtemp_c)}° / {Math.round(item.day.mintemp_c)}°
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
        <EarthyCard style={styles.irrigationCard}>
          <View style={styles.irrigationCardHeader}>
            <View style={styles.irrigationIconBg}>
              <Ionicons name="water" size={24} color={Colors.darkGreen} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <ThemeText category="h3">AI Water Optimizations</ThemeText>
              <ThemeText category="caption">
                Saving target: {shouldSkipIrrigation ? "15,000" : "8,000"} Gallons
              </ThemeText>
            </View>
          </View>

          <ThemeText category="body" style={styles.irrigationAdvisoryText}>
            {shouldSkipIrrigation ? (
              <>
                "Rain probability rises to{" "}
                <ThemeText category="bodyBold" style={{ color: Colors.darkGreen }}>
                  {rainProbMonday}% on {getDayName(forecastDays[2]?.date, 2)}
                </ThemeText>
                . The advisor suggests skipping irrigation cycles to conserve water.
                Monitor soil moisture levels and adjust as needed."
              </>
            ) : (
              <>
                "Weather conditions are stable with low rain probability (
                <ThemeText category="bodyBold" style={{ color: Colors.darkGreen }}>
                  {rainProbMonday}%
                </ThemeText>
                ). Maintain standard irrigation schedule. Monitor UV levels for
                potential increased water needs."
              </>
            )}
          </ThemeText>

          <View style={styles.irrigationDetailsGrid}>
            <View style={styles.irrigationDetailBox}>
              <ThemeText category="caption">Status</ThemeText>
              <ThemeText
                category="bodyBold"
                style={{ color: shouldSkipIrrigation ? "#E65100" : "#2E7D32" }}
              >
                {shouldSkipIrrigation ? "SKIP ADVISED" : "NORMAL"}
              </ThemeText>
            </View>
            <View style={styles.irrigationDetailBox}>
              <ThemeText category="caption">Humidity</ThemeText>
              <ThemeText category="bodyBold">
                {currentWeather.humidity}%
              </ThemeText>
            </View>
            <View style={styles.irrigationDetailBox}>
              <ThemeText category="caption">Precipitation</ThemeText>
              <ThemeText category="bodyBold">
                {currentWeather.precip_mm.toFixed(2)} mm
              </ThemeText>
            </View>
          </View>
        </EarthyCard>

        {/* FARMING ALERTS */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Active Farming Alerts
        </ThemeText>

        {/* High Humidity Alert */}
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
                  Current humidity at {currentWeather.humidity}% creates favorable
                  conditions for fungal growth. Consider applying organic fungicide
                  protection to crop bases.
                </ThemeText>
              </View>
            </View>
          </EarthyCard>
        )}

        {/* UV Alert */}
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
                  UV index at {Math.round(currentWeather.uv)} ({getUVDescription(currentWeather.uv)}).
                  Move high-sensitivity seedlings under shade screens during peak hours
                  (11:00 AM - 3:00 PM).
                </ThemeText>
              </View>
            </View>
          </EarthyCard>
        )}

        {/* Wind Alert */}
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
                  Wind speeds at {Math.round(currentWeather.wind_mph)} mph from {currentWeather.wind_dir}.
                  Secure loose structures and consider delaying spraying operations.
                </ThemeText>
              </View>
            </View>
          </EarthyCard>
        )}

        {/* No Alerts */}
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
                    Weather conditions are favorable for normal farming operations.
                    Continue with scheduled activities.
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
    marginVertical: 18,
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
    marginVertical: 6,
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
    marginVertical: 12,
  },
  forecastScroll: {
    paddingVertical: 8,
    paddingRight: 24,
    marginBottom: 16,
  },
  forecastCard: {
    width: 100,
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
    padding: 16,
    borderRadius: 20,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.lightGreen + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  irrigationAdvisoryText: {
    fontStyle: "italic",
    lineHeight: 18,
    color: Colors.darkGreen,
    fontSize: 13,
  },
  irrigationDetailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGreen + "30",
  },
  irrigationDetailBox: {
    flex: 1,
    alignItems: "center",
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
});
