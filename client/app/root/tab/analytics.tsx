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
import {
  getAnalytics,
  getScanHistory,
  AnalyticsData,
  SoilScan,
} from "../../../services/api";

type TimeframeType = "7D" | "30D" | "6M";

export default function AnalyticsScreen() {
  const themeColors = useThemeColors();
  const [timeframe, setTimeframe] = useState<TimeframeType>("30D");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [pastReports, setPastReports] = useState<SoilScan[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = "user123"; // TODO: Replace with actual user ID from auth context

  // Fetch analytics data and scan history from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await getAnalytics(userId);
        const history = await getScanHistory(userId, 0, 10);

        setAnalyticsData(analytics);
        setPastReports(history);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform NPK data from analytics
  const getNPKData = () => {
    if (!pastReports || pastReports.length === 0) {
      return [];
    }

    return pastReports.slice(0, 3).map((report, idx) => ({
      sector: report.field_name || `Field ${idx + 1}`,
      N: parseInt(report.npk_values?.nitrogen?.match(/\d+/)?.[0] || "50"),
      P: parseInt(report.npk_values?.phosphorus?.match(/\d+/)?.[0] || "50"),
      K: parseInt(report.npk_values?.potassium?.match(/\d+/)?.[0] || "50"),
    }));
  };

  const NPK_COLORS = {
    N: "#4CAF7D",
    P: "#F5A623",
    K: "#5B8DEF",
  };

  const handleExportAll = () => {
    Alert.alert("Export Data", "Format for export:", [
      {
        text: "CSV Spreadsheet",
        onPress: () =>
          Alert.alert("Exported", "CSV file compiled and sent to your email."),
      },
      {
        text: "PDF Summary Pack",
        onPress: () =>
          Alert.alert("Exported", "PDF summary reports downloaded."),
      },
      { text: "Cancel" },
    ]);
  };

  // NPK grouped bar chart
  const renderNPKChart = () => {
    const npkData = getNPKData();
    const maxVal = 100;

    if (npkData.length === 0) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ThemeText category="body">No scan data available yet</ThemeText>
        </View>
      );
    }

    return (
      <View>
        {/* Legend */}
        <View style={styles.npkLegend}>
          {(["N", "P", "K"] as const).map((key) => (
            <View key={key} style={styles.npkLegendItem}>
              <View
                style={[
                  styles.npkLegendDot,
                  { backgroundColor: NPK_COLORS[key] },
                ]}
              />
              <Text
                style={[styles.npkLegendLabel, { color: themeColors.text }]}
              >
                {key === "N"
                  ? "Nitrogen"
                  : key === "P"
                    ? "Phosphorus"
                    : "Potassium"}
              </Text>
            </View>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.npkChartOuter}>
          <View style={styles.npkYAxis}>
            {["100", "75", "50", "25", "0"].map((v) => (
              <ThemeText key={v} category="caption" style={styles.npkYLabel}>
                {v}
              </ThemeText>
            ))}
          </View>

          <View style={styles.npkBarsArea}>
            {npkData.map((sector, i) => (
              <View key={i} style={styles.npkSectorGroup}>
                {(["N", "P", "K"] as const).map((key) => {
                  const pct = (sector[key] / maxVal) * 100;
                  return (
                    <View key={key} style={styles.npkBarTrack}>
                      <View
                        style={[
                          styles.npkBarFill,
                          {
                            height: `${pct}%` as any,
                            backgroundColor: NPK_COLORS[key],
                          },
                        ]}
                      />
                    </View>
                  );
                })}
                <Text
                  style={[styles.npkSectorLabel, { color: themeColors.text }]}
                >
                  {sector.sector}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <ThemeText category="h2">Farm Analytics</ThemeText>
        <TouchableOpacity
          style={[
            styles.exportBtn,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
          onPress={handleExportAll}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={16}
            color={Colors.darkGreen}
          />
          <ThemeText category="caption" style={styles.exportBtnText}>
            Export
          </ThemeText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TIMEFRAME SELECTOR BAR */}
        <View style={styles.timeframeSelector}>
          {(["7D", "30D", "6M"] as TimeframeType[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.tfBtn,
                timeframe === tf
                  ? { backgroundColor: Colors.darkGreen }
                  : {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      borderWidth: 1,
                    },
              ]}
              onPress={() => setTimeframe(tf)}
            >
              <Text
                style={[
                  styles.tfText,
                  timeframe === tf
                    ? { color: Colors.white }
                    : { color: themeColors.text },
                ]}
              >
                {tf === "7D" ? "7 Days" : tf === "30D" ? "30 Days" : "6 Months"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SMART TREND INSIGHT CARD — improved */}
        <EarthyCard style={styles.trendAdvisoryCard}>
          {/* Top accent bar */}
          <View style={styles.trendAccentBar} />
          <View style={styles.trendAdvisoryInner}>
            <View style={styles.trendAdvisoryTitle}>
              <View style={styles.trendIconCircle}>
                <Ionicons
                  name="trending-up"
                  size={16}
                  color={Colors.darkGreen}
                />
              </View>
              <ThemeText
                category="bodyBold"
                style={{
                  marginLeft: 10,
                  color: Colors.darkGreen,
                  fontSize: 14,
                }}
              >
                Soil Improvement Trends
              </ThemeText>
            </View>

            <ThemeText category="body" style={styles.trendAdvisoryText}>
              Soil health scores show an upward trajectory of{" "}
              <ThemeText
                category="bodyBold"
                style={{ color: Colors.darkGreen }}
              >
                +8.4% since March
              </ThemeText>{" "}
              due to active organic treatments in Sector A. pH has stabilized
              within the ideal 6.4–6.5 range.
            </ThemeText>

            {/* Stat pills */}
            <View style={styles.trendStatRow}>
              <View style={styles.trendStatPill}>
                <Text style={styles.trendStatValue}>+8.4%</Text>
                <Text style={styles.trendStatLabel}>Health ↑</Text>
              </View>
              <View style={styles.trendStatPill}>
                <Text style={styles.trendStatValue}>6.5</Text>
                <Text style={styles.trendStatLabel}>pH Stable</Text>
              </View>
              <View style={styles.trendStatPill}>
                <Text style={styles.trendStatValue}>Sector A</Text>
                <Text style={styles.trendStatLabel}>Top Zone</Text>
              </View>
            </View>
          </View>
        </EarthyCard>

        {/* NPK GRAPH CARD */}
        <EarthyCard style={styles.graphCard}>
          <View style={styles.graphCardHeader}>
            <View>
              <ThemeText category="h3">NPK Nutrient Levels</ThemeText>
              <ThemeText category="caption">
                Per-sector macronutrient breakdown
              </ThemeText>
            </View>
          </View>
          {renderNPKChart()}
        </EarthyCard>

        {/* COMPARISON METRICS SECTION */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Sector Performance Matrix
        </ThemeText>
        <EarthyCard style={styles.performanceCard}>
          <View style={styles.perfGridHeader}>
            <View style={styles.gridColName}>
              <ThemeText category="caption" style={{ fontWeight: "700" }}>
                Sector
              </ThemeText>
            </View>
            <View style={styles.gridColScore}>
              <ThemeText category="caption" style={{ fontWeight: "700" }}>
                Score
              </ThemeText>
            </View>
            <View style={styles.gridColPh}>
              <ThemeText category="caption" style={{ fontWeight: "700" }}>
                pH
              </ThemeText>
            </View>
            <View style={styles.gridColTrend}>
              <ThemeText category="caption" style={{ fontWeight: "700" }}>
                Trend
              </ThemeText>
            </View>
          </View>

          <View style={styles.perfGridRow}>
            <View style={styles.gridColName}>
              <ThemeText category="bodyBold">North Field (A)</ThemeText>
            </View>
            <View style={styles.gridColScore}>
              <ThemeText
                category="body"
                style={{ color: Colors.lightGreen, fontWeight: "700" }}
              >
                85%
              </ThemeText>
            </View>
            <View style={styles.gridColPh}>
              <ThemeText category="body">6.5</ThemeText>
            </View>
            <View style={styles.gridColTrend}>
              <Ionicons name="arrow-up" size={16} color={Colors.lightGreen} />
            </View>
          </View>

          <View style={styles.perfGridRow}>
            <View style={styles.gridColName}>
              <ThemeText category="bodyBold">East Meadow (B)</ThemeText>
            </View>
            <View style={styles.gridColScore}>
              <ThemeText
                category="body"
                style={{ color: Colors.accentYellow, fontWeight: "700" }}
              >
                72%
              </ThemeText>
            </View>
            <View style={styles.gridColPh}>
              <ThemeText category="body">6.1</ThemeText>
            </View>
            <View style={styles.gridColTrend}>
              <Ionicons name="arrow-up" size={16} color={Colors.lightGreen} />
            </View>
          </View>

          <View style={styles.perfGridRow}>
            <View style={styles.gridColName}>
              <ThemeText category="bodyBold">Orchard Hill (C)</ThemeText>
            </View>
            <View style={styles.gridColScore}>
              <ThemeText
                category="body"
                style={{ color: Colors.accentOrange, fontWeight: "700" }}
              >
                48%
              </ThemeText>
            </View>
            <View style={styles.gridColPh}>
              <ThemeText category="body">5.4</ThemeText>
            </View>
            <View style={styles.gridColTrend}>
              <Ionicons
                name="trending-down"
                size={16}
                color={Colors.accentOrange}
              />
            </View>
          </View>
        </EarthyCard>

        {/* LOGGED REPORTS DATABASE */}
        <View style={styles.reportsHeaderRow}>
          <ThemeText category="h3" style={styles.sectionTitle}>
            Previous Soil Scans
          </ThemeText>
          <ThemeText
            category="caption"
            style={{ color: Colors.darkGreen, fontWeight: "700" }}
          >
            {pastReports.length} Reports
          </ThemeText>
        </View>

        {loading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={Colors.darkGreen} />
          </View>
        ) : pastReports.length === 0 ? (
          <EarthyCard style={styles.reportRowCard}>
            <ThemeText category="body" style={{ textAlign: "center" }}>
              No scan reports yet
            </ThemeText>
          </EarthyCard>
        ) : (
          pastReports.map((report, index) => (
            <View key={report.id || `report-${index}`}>
              <EarthyCard style={styles.reportRowCard}>
                <View style={styles.reportRowLeft}>
                  <View style={styles.reportIconCircle}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={Colors.darkGreen}
                    />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <ThemeText category="bodyBold">
                      {report.field_name || report.soil_type}
                    </ThemeText>
                    <ThemeText category="caption">
                      {report.soil_type} •{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </ThemeText>
                  </View>
                </View>

                <View style={styles.reportRowRight}>
                  <View
                    style={[
                      styles.reportScoreBadge,
                      {
                        backgroundColor:
                          (report.quality_score || 0) >= 80
                            ? Colors.lightGreen + "15"
                            : (report.quality_score || 0) >= 60
                              ? "#FFB30015"
                              : "#FF704315",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportScoreText,
                        {
                          color:
                            (report.quality_score || 0) >= 80
                              ? Colors.darkGreen
                              : (report.quality_score || 0) >= 60
                                ? "#FFB300"
                                : "#FF7043",
                        },
                      ]}
                    >
                      {Math.round(report.quality_score || 0)}%
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.downloadRowBtn}
                    onPress={() =>
                      Alert.alert(
                        "Download",
                        `Downloading full report PDF for ${report.field_name || report.soil_type}`,
                      )
                    }
                  >
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={themeColors.text}
                    />
                  </TouchableOpacity>
                </View>
              </EarthyCard>
            </View>
          ))
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
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  exportBtnText: {
    marginLeft: 6,
    fontWeight: "700",
    color: Colors.darkGreen,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  timeframeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  tfBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center",
  },
  tfText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Trend Advisory Card (improved) ──────────────────────────────────────────
  trendAdvisoryCard: {
    overflow: "hidden",
    borderRadius: 18,
    marginBottom: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.lightGreen + "40",
    backgroundColor: Colors.lightGreen + "0D",
  },
  trendAccentBar: {
    height: 4,
    width: "100%",
    backgroundColor: Colors.darkGreen,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  trendAdvisoryInner: {
    padding: 14,
  },
  trendAdvisoryTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  trendIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.lightGreen + "25",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.lightGreen + "40",
  },
  trendAdvisoryText: {
    color: Colors.darkGreen,
    lineHeight: 20,
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 12,
  },
  trendStatRow: {
    flexDirection: "row",
    gap: 8,
  },
  trendStatPill: {
    flex: 1,
    backgroundColor: Colors.darkGreen + "12",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.darkGreen + "20",
  },
  trendStatValue: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.darkGreen,
  },
  trendStatLabel: {
    fontSize: 9,
    color: Colors.darkGreen,
    opacity: 0.65,
    marginTop: 2,
    fontWeight: "600",
  },

  // ── Graph / NPK Card ─────────────────────────────────────────────────────────
  graphCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  graphCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  // NPK Legend
  npkLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  npkLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  npkLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  npkLegendLabel: {
    fontSize: 10,
    fontWeight: "600",
  },

  // NPK Chart
  npkChartOuter: {
    flexDirection: "row",
    height: 180,
    alignItems: "stretch",
    paddingTop: 10,
  },
  npkYAxis: {
    width: 30,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 22,
    paddingRight: 4,
  },
  npkYLabel: {
    fontSize: 9,
    opacity: 0.6,
  },
  npkBarsArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.lightGray,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  npkSectorGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: "100%",
    paddingBottom: 18,
  },
  npkBarTrack: {
    width: 10,
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: Colors.lightGray + "80",
    borderRadius: 4,
  },
  npkBarFill: {
    width: "100%",
    borderRadius: 4,
  },
  npkSectorLabel: {
    position: "absolute",
    bottom: 0,
    left: -4,
    right: -4,
    textAlign: "center",
    fontSize: 8,
    fontWeight: "700",
    opacity: 0.6,
  },

  // ── Performance Matrix ───────────────────────────────────────────────────────
  sectionTitle: {
    fontWeight: "800",
    marginVertical: 12,
  },
  performanceCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  perfGridHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 8,
    marginBottom: 8,
  },
  perfGridRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  gridColName: {
    flex: 2,
  },
  gridColScore: {
    flex: 1,
    alignItems: "center",
  },
  gridColPh: {
    flex: 1,
    alignItems: "center",
  },
  gridColTrend: {
    flex: 1,
    alignItems: "flex-end",
  },

  // ── Reports ──────────────────────────────────────────────────────────────────
  reportsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  reportRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.lightGreen + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  reportRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 12,
  },
  reportScoreText: {
    fontSize: 10,
    fontWeight: "700",
  },
  downloadRowBtn: {
    padding: 4,
  },
});
