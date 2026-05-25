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

export default function AnalyticsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [pastReports, setPastReports] = useState<SoilScan[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = "user123";

  const fetchData = async () => {
    try {
      setLoading(true);
      const history = await getScanHistory(userId, 0, 10);
      setPastReports(history);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh history when page is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  // Transform NPK data from the previous 3 scans only
  const getNPKData = () => {
    const subset = pastReports.slice(0, 3);
    if (subset.length < 3) return [];

    return subset.map((report, idx) => ({
      sector: report.field_name || `Field ${idx + 1}`,
      N: parseInt(report.npk_values?.nitrogen?.match(/\d+/)?.[0] || "50"),
      P: parseInt(report.npk_values?.phosphorus?.match(/\d+/)?.[0] || "50"),
      K: parseInt(report.npk_values?.potassium?.match(/\d+/)?.[0] || "50"),
    }));
  };

  // Sector performance matrix from the previous 3 scans only
  const getSectorPerformance = () => {
    const subset = pastReports.slice(0, 3);
    if (subset.length < 3) return [];

    const sectors: Record<
      string,
      { scores: number[]; phs: number[]; latestScore: number; prevScore: number }
    > = {};

    const sorted = [...subset].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sorted.forEach((scan) => {
      const field = scan.field_name || scan.soil_type || "Unknown Sector";
      if (!sectors[field]) {
        sectors[field] = { scores: [], phs: [], latestScore: 0, prevScore: 0 };
      }

      const phVal = parseFloat(scan.ph_range || "6.5");
      const scoreVal = scan.quality_score ?? 50;

      sectors[field].scores.push(scoreVal);
      sectors[field].phs.push(phVal);
      sectors[field].prevScore = sectors[field].latestScore;
      sectors[field].latestScore = scoreVal;
    });

    return Object.entries(sectors).map(([name, data]) => {
      const avgScore = Math.round(
        data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
      );
      const avgPhVal =
        data.phs.reduce((sum, p) => sum + p, 0) / data.phs.length;
      const avgPh = isNaN(avgPhVal) ? "—" : avgPhVal.toFixed(1);
      const trend =
        data.latestScore >= (data.prevScore || data.latestScore)
          ? "up"
          : "down";

      return {
        name,
        score: avgScore,
        ph: avgPh,
        trend,
      };
    });
  };

  // Generate dynamic trend advisory from the last 3 scans
  const getTrendAdvisory = () => {
    const subset = pastReports.slice(0, 3);
    if (subset.length < 3) return null;

    const latest = subset[0];
    const oldest = subset[subset.length - 1];

    const latestScore = latest.quality_score ?? 50;
    const oldestScore = oldest.quality_score ?? 50;
    const diff = latestScore - oldestScore;
    const trendSign = diff >= 0 ? "+" : "";

    const totalPh = subset.reduce((sum, s) => sum + parseFloat(s.ph_range || "6.5"), 0);
    const avgPh = (totalPh / subset.length).toFixed(1);

    const trendText = `Soil health scores show a ${diff >= 0 ? "upward" : "downward"} trajectory of ${trendSign}${diff}% over your previous 3 scans. Average pH is stabilized around ${avgPh}.`;

    return {
      diffPercent: `${trendSign}${diff}%`,
      avgPh,
      trendLabel: diff >= 0 ? "Health ↑" : "Health ↓",
      text: trendText,
      topSector: latest.field_name || latest.soil_type,
    };
  };

  const trendAdvisory = getTrendAdvisory();

  const NPK_COLORS = {
    N: "#4CAF7D",
    P: "#F5A623",
    K: "#5B8DEF",
  };



  const renderNPKChart = () => {
    const npkData = getNPKData();
    const maxVal = 100;

    if (npkData.length === 0) return null;

    return (
      <View>
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
                  numberOfLines={1}
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.darkGreen} />
            <ThemeText category="body" style={{ marginTop: 12 }}>Loading telemetry metrics...</ThemeText>
          </View>
        ) : pastReports.length < 3 ? (
          /* Graceful Empty State Card when less than 3 scans exist */
          <EarthyCard style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bar-chart" size={32} color={Colors.darkGreen} />
            </View>
            <ThemeText category="h2" style={styles.emptyTitle}>
              Insufficient Scans
            </ThemeText>
            <ThemeText category="body" style={styles.emptyText}>
              To analyze nutrient progress, sector comparison indexes, and trend charts, SoilSense AI requires at least 3 scans. Currently, you have completed {pastReports.length} / 3 scans.
            </ThemeText>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace("/root/tab/scan")}>
              <Text style={styles.emptyBtnText}>Scan Soil Now</Text>
            </TouchableOpacity>
          </EarthyCard>
        ) : (
          /* Real Data Analytics Display */
          <>
            {trendAdvisory && (
              <EarthyCard style={styles.trendAdvisoryCard}>
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
                    {trendAdvisory.text}
                  </ThemeText>

                  <View style={styles.trendStatRow}>
                    <View style={styles.trendStatPill}>
                      <Text style={styles.trendStatValue}>{trendAdvisory.diffPercent}</Text>
                      <Text style={styles.trendStatLabel}>{trendAdvisory.trendLabel}</Text>
                    </View>
                    <View style={styles.trendStatPill}>
                      <Text style={styles.trendStatValue}>{trendAdvisory.avgPh}</Text>
                      <Text style={styles.trendStatLabel}>pH Avg</Text>
                    </View>
                    <View style={styles.trendStatPill}>
                      <Text style={styles.trendStatValue} numberOfLines={1}>{trendAdvisory.topSector}</Text>
                      <Text style={styles.trendStatLabel}>Latest Sector</Text>
                    </View>
                  </View>
                </View>
              </EarthyCard>
            )}

            <EarthyCard style={styles.graphCard}>
              <View style={styles.graphCardHeader}>
                <View>
                  <ThemeText category="h3">NPK Nutrient Levels</ThemeText>
                  <ThemeText category="caption">
                    Macronutrient breakdown from last 3 scans
                  </ThemeText>
                </View>
              </View>
              {renderNPKChart()}
            </EarthyCard>

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

              {getSectorPerformance().map((sector, i) => {
                const scoreColor =
                  sector.score >= 80
                    ? Colors.lightGreen
                    : sector.score >= 60
                      ? Colors.accentYellow
                      : Colors.accentOrange;

                return (
                  <View key={i} style={styles.perfGridRow}>
                    <View style={styles.gridColName}>
                      <ThemeText category="bodyBold" numberOfLines={1}>{sector.name}</ThemeText>
                    </View>
                    <View style={styles.gridColScore}>
                      <ThemeText
                        category="body"
                        style={{ color: scoreColor, fontWeight: "700" }}
                      >
                        {sector.score}%
                      </ThemeText>
                    </View>
                    <View style={styles.gridColPh}>
                      <ThemeText category="body">{sector.ph}</ThemeText>
                    </View>
                    <View style={styles.gridColTrend}>
                      <Ionicons
                        name={sector.trend === "up" ? "arrow-up" : "trending-down"}
                        size={16}
                        color={sector.trend === "up" ? Colors.lightGreen : Colors.accentOrange}
                      />
                    </View>
                  </View>
                );
              })}
            </EarthyCard>
          </>
        )}

        {/* LOGGED REPORTS DATABASE (Available at all times for real reports) */}
        {!loading && (
          <>
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

            {pastReports.length === 0 ? (
              <EarthyCard style={styles.reportRowCard}>
                <ThemeText category="body" style={{ textAlign: "center" }}>
                  No scan reports yet
                </ThemeText>
              </EarthyCard>
            ) : (
              pastReports.map((report, index) => {
                const imageUri = report.image_uri || report.image_url;
                return (
                  <View key={report.id || `report-${index}`}>
                    <EarthyCard
                      style={styles.reportRowCard}
                      onPress={() => {
                        router.push(`/result?scanId=${report.id}`);
                      }}
                    >
                      <View style={styles.reportRowLeft}>
                        <View style={styles.reportIconCircle}>
                          {imageUri ? (
                            <Image
                              source={{ uri: imageUri }}
                              style={styles.reportRowImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons
                              name="document-text-outline"
                              size={20}
                              color={Colors.darkGreen}
                            />
                          )}
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <ThemeText category="bodyBold" numberOfLines={1}>
                            {report.field_name || report.soil_type}
                          </ThemeText>
                          <ThemeText category="caption" numberOfLines={1}>
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
                              `Downloading full report PDF for ${report.field_name || report.soil_type}`
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
                );
              })
            )}
          </>
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

  // Trend Advisory Card
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
    fontSize: 12,
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

  // Graph / NPK Card
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
    left: -8,
    right: -8,
    textAlign: "center",
    fontSize: 8,
    fontWeight: "700",
    opacity: 0.6,
  },

  // Performance Matrix
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

  // Reports
  reportsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
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
    flex: 1,
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.lightGreen + "15",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  reportRowImage: {
    width: "100%",
    height: "100%",
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
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyBtn: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  emptyBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
