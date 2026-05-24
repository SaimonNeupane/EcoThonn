import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
} from "react-native";
import {
  EarthyCard,
  ThemeText,
  Colors,
  useThemeColors,
} from "../../../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../../../hooks/useLocation";

export default function WeatherScreen() {
  // const router = useRouter();
  const themeColors = useThemeColors();
  const { location } = useLocation();

  // Mock forecast data
  const forecast5Day = [
    {
      day: "Today",
      temp: "24°C / 12°C",
      icon: "sunny",
      iconColor: "#FFB300",
      rain: "12%",
    },
    {
      day: "Tomorrow",
      temp: "26°C / 14°C",
      icon: "partly-sunny",
      iconColor: "#FFA726",
      rain: "20%",
    },
    {
      day: "Mon",
      temp: "23°C / 15°C",
      icon: "rainy",
      iconColor: "#42A5F5",
      rain: "78%",
    },
    {
      day: "Tue",
      temp: "21°C / 11°C",
      icon: "thunderstorm",
      iconColor: "#0288D1",
      rain: "64%",
    },
    {
      day: "Wed",
      temp: "22°C / 10°C",
      icon: "sunny",
      iconColor: "#FFB300",
      rain: "5%",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <ThemeText category="h2">Weather & Smart Farm</ThemeText>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() =>
            Alert.alert(
              "Refresh",
              "Weather and telemetry details refreshed successfully.",
            )
          }
        >
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
              <Text style={styles.currentTempText}>24°</Text>
              <View style={{ marginLeft: 8 }}>
                <ThemeText category="h2" style={{ color: Colors.white }}>
                  Sunny
                </ThemeText>
                <ThemeText
                  category="caption"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Feels like 26°C • 📍 {location ? `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° W` : "Central Valley, CA"}
                </ThemeText>
              </View>
            </View>
            <Ionicons name="sunny" size={64} color={Colors.accentYellow} />
          </View>

          <View style={styles.weatherMetricsDivider} />

          <View style={styles.weatherMetricsGrid}>
            <View style={styles.metricItem}>
              <Ionicons name="water-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>42%</Text>
                <Text style={styles.metricLbl}>Humidity</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="rainy-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>12%</Text>
                <Text style={styles.metricLbl}>Rain Probability</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="cloudy-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>ESE 12 mph</Text>
                <Text style={styles.metricLbl}>Wind Speed</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="sunny-outline" size={18} color={Colors.white} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricVal}>8 (Very High)</Text>
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
          {forecast5Day.map((item, idx) => (
            <EarthyCard key={idx} style={styles.forecastCard}>
              <ThemeText category="bodyBold" style={styles.forecastDay}>
                {item.day}
              </ThemeText>
              <Ionicons
                name={item.icon as any}
                size={28}
                color={item.iconColor}
                style={{ marginVertical: 8 }}
              />
              <ThemeText category="caption" style={{ fontWeight: "700" }}>
                {item.temp}
              </ThemeText>

              <View style={styles.rainBadge}>
                <Ionicons name="water" size={10} color="#42A5F5" />
                <Text style={styles.rainBadgeText}>{item.rain}</Text>
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
                Saving target: 12,000 Gallons
              </ThemeText>
            </View>
          </View>

          <ThemeText category="body" style={styles.irrigationAdvisoryText}>
            “Monsoon rain probability rises to{" "}
            <ThemeText category="bodyBold" style={{ color: Colors.darkGreen }}>
              78% on Monday
            </ThemeText>
            . The advisor suggests skipping the Sunday evening irrigation cycle
            on North Field. Maintain standard light watering in Greenhouse
            Sector 2 where soils are faster draining.”
          </ThemeText>

          <View style={styles.irrigationDetailsGrid}>
            <View style={styles.irrigationDetailBox}>
              <ThemeText category="caption">Status</ThemeText>
              <ThemeText category="bodyBold" style={{ color: "#E65100" }}>
                SKIP ADVISED
              </ThemeText>
            </View>
            <View style={styles.irrigationDetailBox}>
              <ThemeText category="caption">Soil Moist.</ThemeText>
              <ThemeText category="bodyBold">45% (Stable)</ThemeText>
            </View>
            <View style={styles.irrigationDetailBox}>
              <ThemeText category="caption">Precipitation</ThemeText>
              <ThemeText category="bodyBold">0.45 inches</ThemeText>
            </View>
          </View>
        </EarthyCard>

        {/* FARMING ALERTS */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Active Farming Alerts
        </ThemeText>

        <EarthyCard style={styles.alertCard}>
          <View style={styles.alertRow}>
            <View
              style={[styles.alertIconCircle, { backgroundColor: "#FF704320" }]}
            >
              <Ionicons name="bug" size={22} color="#FF7043" />
            </View>
            <View style={styles.alertTexts}>
              <ThemeText category="bodyBold" style={{ color: "#FF7043" }}>
                Fungal Risk Warning
              </ThemeText>
              <ThemeText category="caption" style={styles.alertDesc}>
                Expected heavy humidity on Monday and Tuesday creates high
                conditions for fungal spores. Consider applying organic
                fungicide protection to crop bases by Sunday evening.
              </ThemeText>
            </View>
          </View>
        </EarthyCard>

        <EarthyCard style={styles.alertCard}>
          <View style={styles.alertRow}>
            <View
              style={[styles.alertIconCircle, { backgroundColor: "#FFB30020" }]}
            >
              <Ionicons name="sunny" size={22} color="#FFB300" />
            </View>
            <View style={styles.alertTexts}>
              <ThemeText category="bodyBold" style={{ color: "#E65100" }}>
                Extreme UV Advisory
              </ThemeText>
              <ThemeText category="caption" style={styles.alertDesc}>
                UV index will reach level 9 tomorrow between 11:00 AM - 3:00 PM.
                Move high-sensitivity Greenhouse 3 seedlings under shade
                screens.
              </ThemeText>
            </View>
          </View>
        </EarthyCard>
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
