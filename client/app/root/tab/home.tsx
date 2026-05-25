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
import { useRouter, useFocusEffect } from "expo-router";
import {
  EarthyCard,
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

// Soil type to icon mapping
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
  const { location } = useLocation();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [recentScans, setRecentScans] = useState<SoilScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const userId = "user123"; // TODO: Replace with actual user ID from auth context

  // Fetch recent scans from backend
  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoadingScans(true);
        console.log("🔍 Fetching recent scans for userId:", userId);
        const scans = await getRecentScans(userId, 5);
        console.log("✅ Recent scans fetched:", scans);
        console.log("📊 Total scans received:", scans.length);
        if (scans.length > 0) {
          console.log("🔑 First scan ID:", scans[0].id);
          console.log(
            "🔑 First scan object:",
            JSON.stringify(scans[0], null, 2),
          );
        }
        setRecentScans(scans);
      } catch (error) {
        console.error("❌ Error fetching scans:", error);
      } finally {
        setLoadingScans(false);
      }
    };

    fetchScans();
  }, []);

  // Refetch scans when screen is focused
  useFocusEffect(
    React.useCallback(() => {
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

      fetchScans();
    }, []),
  );

  // Generate AI recommendations based on recent scans
  const generateQuickTips = () => {
    const tips: any[] = [];

    if (recentScans.length === 0) {
      return [
        {
          id: "1",
          title: "Start Scanning",
          text: "Perform your first soil scan to get personalized recommendations.",
          icon: "camera-outline",
          color: "#42A5F5",
        },
      ];
    }

    // Analyze recent scans for recommendations
    const latestScan = recentScans[0];

    if (latestScan.recommendations && latestScan.recommendations.length > 0) {
      latestScan.recommendations.slice(0, 2).forEach((rec, idx) => {
        tips.push({
          id: String(idx + 1),
          title: idx === 0 ? "Primary Action" : "Secondary Action",
          text: rec,
          icon: idx === 0 ? "flask-outline" : "water-outline",
          color: idx === 0 ? "#42A5F5" : "#66BB6A",
        });
      });
    }

    return tips.length > 0
      ? tips
      : [
          {
            id: "1",
            title: "Nitrogen Status",
            text: `Current nitrogen level: ${latestScan.npk_values?.nitrogen || "Unknown"}`,
            icon: "flask-outline",
            color: "#42A5F5",
          },
        ];
  };

  const quickTips = generateQuickTips();

  const getWeatherIcon = (code: number): any => {
    if (code === 1000) return "sunny";
    if ([1003, 1006].includes(code)) return "partly-sunny";
    if ([1009, 1030, 1135, 1147].includes(code)) return "cloudy";
    if (
      [1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(
        code,
      )
    )
      return "rainy";
    if ([1087, 1273, 1276].includes(code)) return "thunderstorm";
    if (
      [
        1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237,
        1249, 1252, 1255, 1258, 1261, 1264,
      ].includes(code)
    )
      return "snow";
    return "partly-sunny";
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoadingWeather(true);
        const lat = location?.latitude || 27.6221;
        const lon = location?.longitude || 85.5428;

        const currentResponse = await fetch(
          `${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&aqi=no`,
        );
        const currentData = await currentResponse.json();

        const forecastResponse = await fetch(
          `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3&aqi=no`,
        );
        const forecastDataResponse = await forecastResponse.json();

        setWeatherData(currentData);
        setForecastData(forecastDataResponse);
      } catch (error) {
        console.error("Error fetching weather for dashboard:", error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [location]);

  // Determine rain probability for tomorrow (index 1)
  const tomorrowRainChance =
    forecastData?.forecast?.forecastday[1]?.day?.daily_chance_of_rain || 0;
  const shouldSkipIrrigation = tomorrowRainChance > 50;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* 1. WELCOME SECTION & HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color={Colors.white} />
          </View>
          <View style={styles.headerText}>
            <ThemeText category="caption">Welcome back,</ThemeText>
            <ThemeText category="h2" style={styles.userName}>
              Saimon Neupane
            </ThemeText>
          </View>
        </View>

        {/* Notification & Premium Badge */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.actionIcon,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => router.push("/premium")}
          >
            <Ionicons name="sparkles" size={18} color={Colors.accentYellow} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionIcon,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() =>
              Alert.alert("Notifications", "You have no unread notifications.")
            }
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={themeColors.text}
            />
            <View style={styles.dotIndicator} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. USER FARM SUMMARY */}
        <View style={styles.farmSummaryRow}>
          <View>
            <ThemeText category="h3">Greenhouse Farm • Active</ThemeText>
            <ThemeText category="caption">
              📍{" "}
              {location
                ? `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`
                : "Dhulikhel, Nepal"}{" "}
              • 45 Acres
            </ThemeText>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>ALL OK</Text>
          </View>
        </View>

        {/* 3. SOIL HEALTH OVERVIEW CARD & SCORE GAUGE */}
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
                Optimal Zone
              </ThemeText>
              <ThemeText category="caption" style={styles.healthDescription}>
                Based on your last 3 scans across all active sectors. Moisture
                is high, nitrogen is recovering.
              </ThemeText>
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => {
                  if (recentScans.length > 0) {
                    console.log(
                      "View Last Report - Scan ID:",
                      recentScans[0].id,
                    );
                    console.log("Full scan object:", recentScans[0]);
                    router.push(`/result?scanId=${recentScans[0].id}`);
                  } else {
                    Alert.alert(
                      "No scans",
                      "Perform your first scan to view results.",
                    );
                  }
                }}
              >
                <Text style={styles.detailsBtnText}>View Last Report</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={Colors.accentYellow}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.gaugeWrapper}>
              <HealthScoreGauge score={82} size={110} strokeWidth={8} />
            </View>
          </View>
        </EarthyCard>

        {/* 4. DYNAMIC WEATHER WIDGET & IRRIGATION SUGGESTION */}
        <EarthyCard style={styles.weatherCard}>
          {loadingWeather || !weatherData ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={Colors.darkGreen} />
              <ThemeText category="caption" style={{ marginTop: 8 }}>
                Loading conditions...
              </ThemeText>
            </View>
          ) : (
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
                  {shouldSkipIrrigation
                    ? `High chance of rain (${tomorrowRainChance}%) tomorrow. Consider skipping the morning irrigation cycle to conserve water.`
                    : "Conditions stable. Run water supply on Sector 3 tomorrow at 6:00 AM (duration: 35 mins)."}
                </ThemeText>
              </View>
            </>
          )}
        </EarthyCard>

        {/* 5. QUICK SHORTCUTS ROW */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Quick Analytics
        </ThemeText>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={[
              styles.shortcutBtn,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => router.push("/crops")}
          >
            <View
              style={[styles.shortcutIconBg, { backgroundColor: "#E8F5E9" }]}
            >
              <Ionicons name="leaf" size={20} color={Colors.darkGreen} />
            </View>
            <ThemeText category="bodyBold" style={{ marginTop: 6 }}>
              Crops
            </ThemeText>
            <ThemeText category="caption">Matches</ThemeText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shortcutBtn,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => router.push("/fertilizer")}
          >
            <View
              style={[styles.shortcutIconBg, { backgroundColor: "#FFF3E0" }]}
            >
              <Ionicons name="flask" size={20} color="#E65100" />
            </View>
            <ThemeText category="bodyBold" style={{ marginTop: 6 }}>
              Fertilizers
            </ThemeText>
            <ThemeText category="caption">Dosages</ThemeText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shortcutBtn,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => router.push("/premium")}
          >
            <View
              style={[styles.shortcutIconBg, { backgroundColor: "#E1F5FE" }]}
            >
              <Ionicons name="analytics" size={20} color="#0288D1" />
            </View>
            <ThemeText category="bodyBold" style={{ marginTop: 6 }}>
              NDVI Map
            </ThemeText>
            <ThemeText category="caption">Satellite</ThemeText>
          </TouchableOpacity>
        </View>

        {/* 6. RECENT SCANS CAROUSEL */}
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

        {loadingScans ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={Colors.darkGreen} />
          </View>
        ) : recentScans.length === 0 ? (
          <View style={{ paddingVertical: 20 }}>
            <EarthyCard style={{ padding: 20 }}>
              <ThemeText category="body" style={{ textAlign: "center" }}>
                No scans yet. Tap the camera button to perform your first scan.
              </ThemeText>
            </EarthyCard>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {recentScans.map((scan, index) => {
              const scoreColor =
                scan.quality_score! >= 80
                  ? Colors.lightGreen
                  : scan.quality_score! >= 60
                    ? "#FFB300"
                    : "#FF7043";
              const scorePercent = Math.round(scan.quality_score || 0);
              const soilIcon = getSoilIcon(scan.soil_type);

              return (
                <View key={scan.id || `scan-${index}`}>
                  <EarthyCard
                    style={styles.recentScanCard}
                    onPress={() => {
                      const scanId = scan.id;
                      console.log("🎯 Recent scan card clicked");
                      console.log("   Scan ID:", scanId);
                      console.log("   Scan ID type:", typeof scanId);
                      console.log(
                        "   Full scan object:",
                        JSON.stringify(scan, null, 2),
                      );
                      router.push(`/result?scanId=${scanId}`);
                    }}
                  >
                    <View style={styles.scanCardTop}>
                      <View style={styles.scanIconBg}>
                        <Ionicons
                          name={soilIcon}
                          size={18}
                          color={Colors.darkGreen}
                        />
                      </View>
                      <View
                        style={[
                          styles.scanScoreBadge,
                          { backgroundColor: scoreColor + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.scanScoreText, { color: scoreColor }]}
                        >
                          {scorePercent}%
                        </Text>
                      </View>
                    </View>
                    <ThemeText category="bodyBold" style={styles.scanFieldName}>
                      {scan.field_name || scan.soil_type}
                    </ThemeText>
                    <ThemeText category="caption">{scan.soil_type}</ThemeText>
                    <View style={styles.scanCardFooter}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={themeColors.subText}
                      />
                      <ThemeText category="caption" style={{ marginLeft: 4 }}>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </ThemeText>
                    </View>
                  </EarthyCard>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* 7. AI RECOMMENDATIONS & TIPS */}
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

        {/* 8. SEASONAL FARMING TIPS */}
        <EarthyCard style={styles.seasonalTipsCard}>
          <ThemeText category="h3" style={{ color: Colors.white }}>
            Summer Farming Checklist
          </ThemeText>
          <ThemeText category="caption" style={styles.seasonalTipSub}>
            Maximize your summer crop harvests
          </ThemeText>
          <View style={styles.seasonalBulletRow}>
            <Ionicons name="checkbox" size={16} color={Colors.accentYellow} />
            <ThemeText category="body" style={styles.bulletText}>
              Maintain mulch layers to reduce water loss
            </ThemeText>
          </View>
          <View style={styles.seasonalBulletRow}>
            <Ionicons name="checkbox" size={16} color={Colors.accentYellow} />
            <ThemeText category="body" style={styles.bulletText}>
              Monitor phosphorus runoffs before heavy waterings
            </ThemeText>
          </View>
        </EarthyCard>
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: "800" },
  headerActions: { flexDirection: "row" },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    position: "relative",
  },
  dotIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentOrange,
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
  farmSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: "700", color: Colors.white },
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
  sectionTitle: { marginVertical: 12, fontWeight: "800" },
  shortcutsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shortcutBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  shortcutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: { color: Colors.darkGreen, fontWeight: "700" },
  carouselContainer: { paddingVertical: 8, paddingRight: 24, marginBottom: 16 },
  recentScanCard: {
    width: 140,
    padding: 14,
    marginRight: 12,
    borderRadius: 16,
  },
  scanCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scanIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.lightGreen + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  scanScoreBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  scanScoreText: { fontSize: 9, fontWeight: "700" },
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
  seasonalTipsCard: {
    backgroundColor: Colors.brown,
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
  },
  seasonalTipSub: {
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 12,
    fontWeight: "600",
  },
  seasonalBulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  bulletText: { color: Colors.white, marginLeft: 8, fontSize: 12 },
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
});
