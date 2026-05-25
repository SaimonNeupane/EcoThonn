import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  EarthyCard,
  EarthyButton,
  ThemeText,
  HealthScoreGauge,
  Colors,
  useThemeColors,
} from "../../../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../../../hooks/useLocation";
import { getRecentScans, SoilScan } from "../../../services/api";

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
    condition: { text: string; code: number };
    humidity: number;
  };
}

interface ForecastData {
  forecast: {
    forecastday: {
      day: { daily_chance_of_rain: number };
    }[];
  };
}

const getSoilIcon = (soilType: string): any => {
  const soil = soilType?.toLowerCase() || "";
  if (soil.includes("alluvial")) return "water-outline";
  if (soil.includes("black")) return "contrast-outline";
  if (soil.includes("red")) return "flame-outline";
  if (soil.includes("laterite")) return "layers-outline";
  if (soil.includes("arid") || soil.includes("desert")) return "sunny-outline";
  if (soil.includes("clay")) return "cube-outline";
  if (soil.includes("sandy")) return "logo-sand";
  return "leaf";
};

export default function HomeScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  
  // Geolocation
  const {
    location,
    errorMsg: locationError,
    loading: loadingLocation,
    fetchLocation,
  } = useLocation();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  const [recentScans, setRecentScans] = useState<SoilScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const userId = "user123";

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  // Fetch recent scans
  const fetchScans = async () => {
    try {
      setLoadingScans(true);
      const scans = await getRecentScans(userId, 5);
      setRecentScans(scans);
    } catch (error) {
      console.error("Error fetching scans:", error);
    } finally {
      setLoadingScans(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  // Refetch scans when focused
  useFocusEffect(
    React.useCallback(() => {
      fetchScans();
    }, [])
  );

  // Fetch Weather based on fetched coordinates
  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) {
        if (!loadingLocation && locationError) {
          setLoadingWeather(false);
        }
        return;
      }
      try {
        setLoadingWeather(true);
        setWeatherError(null);
        const lat = location.latitude;
        const lon = location.longitude;

        const currentResponse = await fetch(
          `${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&aqi=no`
        );
        if (!currentResponse.ok) throw new Error("Failed to load current weather");
        const currentData = await currentResponse.json();

        const forecastResponse = await fetch(
          `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3&aqi=no`
        );
        if (!forecastResponse.ok) throw new Error("Failed to load forecast");
        const forecastDataResponse = await forecastResponse.json();

        setWeatherData(currentData);
        setForecastData(forecastDataResponse);
      } catch (error: any) {
        console.error("Error fetching weather for dashboard:", error);
        setWeatherError(error.message || "Failed to load weather data");
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [location, locationError, loadingLocation]);

  // Generate dynamic recommendations from RAG response in latest scan
  const generateQuickTips = () => {
    const tips: any[] = [];
    if (recentScans.length === 0) return tips;

    const latestScan = recentScans[0];
    const recs = latestScan.rag_data?.treatments || latestScan.recommendations || [];

    if (recs.length > 0) {
      recs.slice(0, 2).forEach((rec: string, idx: number) => {
        tips.push({
          id: String(idx + 1),
          title: idx === 0 ? "Primary Action" : "Secondary Action",
          text: rec,
          icon: idx === 0 ? "flask-outline" : "water-outline",
          color: idx === 0 ? "#42A5F5" : "#66BB6A",
        });
      });
    }

    return tips;
  };

  const quickTips = generateQuickTips();

  const getWeatherIcon = (code: number): any => {
    if (code === 1000) return "sunny";
    if ([1003, 1006].includes(code)) return "partly-sunny";
    if ([1009, 1030, 1135, 1147].includes(code)) return "cloudy";
    if (
      [
        1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1201,
        1207, 1240, 1243, 1246, 1249, 1252, 1255, 1264, 1267
      ].includes(code)
    )
      return "rainy";
    if ([1087, 1273, 1276].includes(code)) return "thunderstorm";
    if (
      [
        1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237,
        1258, 1261, 1279, 1282
      ].includes(code)
    )
      return "snow";
    return "partly-sunny";
  };

  const getSmartIrrigationAdvice = () => {
    if (!weatherData || !forecastData) return "Loading smart advisory details...";

    const current = weatherData.current;
    const todayForecast = forecastData.forecast.forecastday[0]?.day;
    const tomorrowForecast = forecastData.forecast.forecastday[1]?.day;

    const tomorrowRain = tomorrowForecast?.daily_chance_of_rain || 0;
    const todayRain = todayForecast?.daily_chance_of_rain || 0;
    const humidity = current.humidity;
    const temp = current.temp_c;

    if (tomorrowRain > 50) {
      return `Skip tomorrow's morning cycle. High chance of rain (${tomorrowRain}%) tomorrow, which will provide optimal natural soil saturation.`;
    }
    if (todayRain > 50) {
      return `Skip today's cycle. Heavy precipitation recorded or expected (${todayRain}% chance). Monitor soil runoff.`;
    }
    if (humidity > 80) {
      return `Reduce water duration by 25%. Elevated relative humidity (${humidity}%) decreases evaporation and increases fungal risks.`;
    }
    if (temp > 32) {
      return `Increase water duration by 20%. High ambient temperature (${Math.round(temp)}°C) will accelerate evaporation. Irrigate at early dawn (5:30 AM).`;
    }
    return `Conditions stable. Run standard irrigation cycle tomorrow morning at 6:00 AM.`;
  };

  const tomorrowRainChance =
    forecastData?.forecast?.forecastday[1]?.day?.daily_chance_of_rain || 0;
  const shouldSkipIrrigation = tomorrowRainChance > 50 || (forecastData?.forecast?.forecastday[0]?.day?.daily_chance_of_rain || 0) > 50;

  // Calculate dynamic Soil Health Index average (last 3 scans)
  const averageHealthScore = (() => {
    const subset = recentScans.slice(0, 3);
    if (subset.length === 0) return 0;
    const total = subset.reduce((sum, s) => sum + (s.quality_score ?? 50), 0);
    return Math.round(total / subset.length);
  })();

  const averageHealthZone = (() => {
    if (averageHealthScore >= 75) return "Optimal Zone";
    if (averageHealthScore >= 55) return "Moderate Zone";
    return "Needs Attention";
  })();

  const averageHealthDescription = `Based on your previous ${Math.min(3, recentScans.length)} soil scan${recentScans.length > 1 ? "s" : ""}. The soil health indicator index averages ${averageHealthScore}%.`;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* 1. MINIMAL PRODUCTION HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.userInfo}>
          <ThemeText category="h2" style={styles.userName}>
            SoilSense AI
          </ThemeText>
        </View>

        <View style={styles.headerLocation}>
          {loadingLocation ? (
            <ActivityIndicator size="small" color={Colors.darkGreen} style={{ marginRight: 4 }} />
          ) : location ? (
            <ThemeText category="caption" style={styles.locationLabel}>
              📍 {weatherData?.location?.name ? `${weatherData.location.name}, ${weatherData.location.region}` : `${location.latitude.toFixed(3)}°, ${location.longitude.toFixed(3)}°`}
            </ThemeText>
          ) : (
            <TouchableOpacity onPress={fetchLocation} style={styles.retryLocationBtn}>
              <Ionicons name="warning" size={12} color={Colors.accentOrange} />
              <ThemeText category="caption" style={[styles.locationLabel, { color: Colors.accentOrange, marginLeft: 4 }]}>
                Location Access Denied
              </ThemeText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. DYNAMIC WEATHER WIDGET */}
        <EarthyCard style={styles.weatherCard}>
          {loadingWeather ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={Colors.darkGreen} />
              <ThemeText category="caption" style={{ marginTop: 8 }}>
                Retrieving telemetry conditions...
              </ThemeText>
            </View>
          ) : weatherError ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <Ionicons name="cloud-offline-outline" size={24} color={Colors.accentOrange} />
              <ThemeText category="caption" style={{ marginTop: 8, color: Colors.accentOrange, textAlign: "center" }}>
                {weatherError}
              </ThemeText>
              <TouchableOpacity style={styles.weatherRetryBtn} onPress={fetchLocation}>
                <Text style={styles.weatherRetryBtnText}>Retry Fetch</Text>
              </TouchableOpacity>
            </View>
          ) : !location ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <Ionicons name="location-outline" size={24} color={Colors.textSecondary} />
              <ThemeText category="caption" style={{ marginTop: 8, textAlign: "center" }}>
                Enable device location to fetch live meteorological and irrigation data.
              </ThemeText>
              <TouchableOpacity style={styles.weatherRetryBtn} onPress={fetchLocation}>
                <Text style={styles.weatherRetryBtnText}>Grant Location</Text>
              </TouchableOpacity>
            </View>
          ) : weatherData ? (
            <>
              <View style={styles.weatherHeader}>
                <View style={styles.weatherMain}>
                  <Ionicons
                    name={getWeatherIcon(weatherData.current.condition.code)}
                    size={36}
                    color={Colors.accentYellow}
                  />
                  <View style={{ marginLeft: 12 }}>
                    <ThemeText category="h2">
                      {Math.round(weatherData.current.temp_c)}°C
                    </ThemeText>
                    <ThemeText category="caption">
                      {weatherData.current.condition.text} • Humidity:{" "}
                      {weatherData.current.humidity}%
                    </ThemeText>
                  </View>
                </View>
                <View style={styles.tempBadge}>
                  <ThemeText
                    category="caption"
                    style={{ color: Colors.darkGreen, fontWeight: "700" }}
                  >
                    {shouldSkipIrrigation
                      ? "RAIN EXPECTED"
                      : "NO RAIN EXPECTED"}
                  </ThemeText>
                </View>
              </View>
              <View
                style={[
                  styles.weatherIrrigationTip,
                  {
                    backgroundColor: themeColors.isDark ? "#172E1D" : "#E8F5E9",
                  },
                ]}
              >
                <Ionicons
                  name="water-outline"
                  size={18}
                  color={Colors.darkGreen}
                />
                <ThemeText category="caption" style={styles.irrigationText}>
                  <ThemeText
                    category="bodyBold"
                    style={{ color: Colors.darkGreen }}
                  >
                    Smart Irrigation Advice:{" "}
                  </ThemeText>
                  {getSmartIrrigationAdvice()}
                </ThemeText>
              </View>
            </>
          ) : null}
        </EarthyCard>

        {loadingScans ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.darkGreen} />
            <ThemeText category="body" style={{ marginTop: 12 }}>Loading soil database...</ThemeText>
          </View>
        ) : recentScans.length === 0 ? (
          /* Gorgeous Single Clean Empty State */
          <EarthyCard style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="camera" size={32} color={Colors.darkGreen} />
            </View>
            <ThemeText category="h2" style={styles.emptyTitle}>
              Analyze Your Soil
            </ThemeText>
            <ThemeText category="body" style={styles.emptyText}>
              No diagnostic reports saved. Capture or upload a photo of your field soil to unlock AI composition readings, pH, moisture levels, and RAG recommendations.
            </ThemeText>
            <EarthyButton
              title="Scan Soil Now"
              variant="accent"
              icon="camera"
              onPress={() => router.replace("/root/tab/scan")}
              style={styles.emptyBtn}
            />
          </EarthyCard>
        ) : (
          /* Data-Driven UI Components (Only shown when real scans exist) */
          <>
            {/* 3. DYNAMIC SOIL HEALTH OVERVIEW */}
            <EarthyCard style={styles.healthCard}>
              <View style={styles.healthCardContent}>
                <View style={styles.healthInfo}>
                  <ThemeText
                    category="label"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    AVERAGE SOIL HEALTH
                  </ThemeText>
                  <ThemeText category="h1" style={styles.healthTitle}>
                    {averageHealthZone}
                  </ThemeText>
                  <ThemeText category="caption" style={styles.healthDescription}>
                    {averageHealthDescription}
                  </ThemeText>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => {
                      if (recentScans.length > 0) {
                        router.push(`/result?scanId=${recentScans[0].id}`);
                      }
                    }}
                  >
                    <Text style={styles.detailsBtnText}>View Latest Report</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={Colors.accentYellow}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.gaugeWrapper}>
                  <HealthScoreGauge score={averageHealthScore} size={110} strokeWidth={8} />
                </View>
              </View>
            </EarthyCard>

            {/* 4. RECENT SCANS LIST */}
            <View style={styles.carouselHeader}>
              <ThemeText category="h3" style={styles.sectionTitle}>
                Recent Scans
              </ThemeText>
              <TouchableOpacity
                onPress={() => router.replace("/root/tab/analytics")}
              >
                <ThemeText category="caption" style={styles.viewAllText}>
                  View History
                </ThemeText>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
            >
              {recentScans.map((scan, index) => {
                const scoreColor =
                  (scan.quality_score || 0) >= 80
                    ? Colors.lightGreen
                    : (scan.quality_score || 0) >= 60
                      ? "#FFB300"
                      : "#FF7043";
                const scorePercent = Math.round(scan.quality_score || 0);
                const soilIcon = getSoilIcon(scan.soil_type);
                const imageUri = scan.image_uri || scan.image_url;

                return (
                  <View key={scan.id || `scan-${index}`}>
                    <EarthyCard
                      bordered={true}
                      style={styles.recentScanCard}
                      onPress={() => {
                        router.push(`/result?scanId=${scan.id}`);
                      }}
                    >
                      <View style={styles.imageContainer}>
                        {imageUri ? (
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.cardImagePlaceholder, { backgroundColor: themeColors.isDark ? "#2A3A2C" : "#E8F5E9" }]}>
                            <Ionicons
                              name={soilIcon}
                              size={28}
                              color={Colors.darkGreen}
                            />
                          </View>
                        )}
                        <View
                          style={[
                            styles.scanScoreBadgeOverlay,
                            { backgroundColor: scoreColor },
                          ]}
                        >
                          <Text style={styles.scanScoreTextOverlay}>
                            {scorePercent}%
                          </Text>
                        </View>
                      </View>

                      <View style={styles.scanCardContent}>
                        <ThemeText category="bodyBold" numberOfLines={1} style={styles.scanFieldName}>
                          {scan.field_name || scan.soil_type}
                        </ThemeText>
                        <ThemeText category="caption" numberOfLines={1} style={{ color: themeColors.subText }}>
                          {scan.soil_type}
                        </ThemeText>
                        <View style={styles.scanCardFooter}>
                          <Ionicons
                            name="calendar-outline"
                            size={12}
                            color={themeColors.subText}
                          />
                          <ThemeText category="caption" style={{ marginLeft: 4, color: themeColors.subText }}>
                            {new Date(scan.created_at).toLocaleDateString()}
                          </ThemeText>
                        </View>
                      </View>
                    </EarthyCard>
                  </View>
                );
              })}
            </ScrollView>

            {/* 5. AI recommendations block (only rendered if quickTips exist) */}
            {quickTips.length > 0 && (
              <>
                <ThemeText category="h3" style={styles.sectionTitle}>
                  AI Smart Recommendations
                </ThemeText>
                {quickTips.map((tip, index) => (
                  <View key={tip.id || `tip-${index}`}>
                    <EarthyCard style={styles.tipCard}>
                      <View style={styles.tipCardRow}>
                        <View
                          style={[
                            styles.tipIconCircle,
                            { backgroundColor: tip.color + "15" },
                          ]}
                        >
                          <Ionicons
                            name={tip.icon as any}
                            size={22}
                            color={tip.color}
                          />
                        </View>
                        <View style={styles.tipInfo}>
                          <ThemeText category="bodyBold" style={{ color: tip.color }}>
                            {tip.title}
                          </ThemeText>
                          <ThemeText category="caption" style={styles.tipText}>
                            {tip.text}
                          </ThemeText>
                        </View>
                      </View>
                    </EarthyCard>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Scan Button */}
      <TouchableOpacity
        style={styles.floatingScanButton}
        onPress={() => router.replace("/root/tab/scan")}
      >
        <Ionicons name="scan" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  userName: { fontSize: 18, fontWeight: "800", color: Colors.darkGreen },
  headerLocation: { flexDirection: "row", alignItems: "center" },
  locationLabel: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  retryLocationBtn: { flexDirection: "row", alignItems: "center" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
  healthCard: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  healthCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  healthInfo: { flex: 1, paddingRight: 8 },
  healthTitle: {
    color: Colors.white,
    fontWeight: "900",
    fontSize: 22,
    marginVertical: 4,
  },
  healthDescription: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    lineHeight: 16,
  },
  detailsBtn: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  detailsBtnText: {
    color: Colors.accentYellow,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 6,
  },
  gaugeWrapper: { marginLeft: 12 },
  weatherCard: { padding: 16, borderRadius: 20, marginBottom: 20 },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weatherMain: { flexDirection: "row", alignItems: "center" },
  tempBadge: {
    backgroundColor: "#FFB30015",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weatherIrrigationTip: {
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  irrigationText: { marginLeft: 8, flex: 1, lineHeight: 16 },
  weatherRetryBtn: {
    marginTop: 10,
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  weatherRetryBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  weatherRetryBtnSecond: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.darkGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  weatherRetryBtnSecondText: {
    color: Colors.darkGreen,
    fontSize: 11,
    fontWeight: "700",
  },
  weatherRetryBtnContainer: {
    flexDirection: "row",
    gap: 8,
  },
  weatherRetryBtnTextSecond: {
    color: Colors.darkGreen,
    fontSize: 11,
    fontWeight: "700",
  },
  weatherRetryBtnColor: {
    color: Colors.darkGreen,
  },
  sectionTitle: { marginVertical: 12, fontWeight: "800" },
  carouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: { color: Colors.darkGreen, fontWeight: "700" },
  carouselContainer: { paddingVertical: 8, paddingRight: 24, marginBottom: 16 },
  recentScanCard: {
    width: 155,
    padding: 0,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 100,
    position: "relative",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scanScoreBadgeOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  scanScoreTextOverlay: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.white,
  },
  scanCardContent: {
    padding: 10,
  },
  scanFieldName: { fontSize: 13, marginBottom: 2 },
  scanCardFooter: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  tipCard: { padding: 14, borderRadius: 16, marginVertical: 4 },
  tipCardRow: { flexDirection: "row", alignItems: "center" },
  tipIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tipInfo: { flex: 1, marginLeft: 12 },
  tipText: { marginTop: 2, lineHeight: 16 },
  floatingScanButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  
  // Empty State Styles
  emptyContainer: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: Colors.white,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lightGreen + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.darkGreen,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyBtn: {
    width: "100%",
  },
});
