import React, { useState } from "react";
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

type TimeframeType = "7D" | "30D" | "6M";

export default function AnalyticsScreen() {
  // const router = useRouter();
  const themeColors = useThemeColors();
  const [timeframe, setTimeframe] = useState<TimeframeType>("30D");

  // Mock comparison reports database
  const pastReports = [
    {
      id: "r1",
      title: "North Field - Sector A",
      date: "May 20, 2026",
      score: 85,
      type: "Sandy Loam",
    },
    {
      id: "r2",
      title: "East Meadow - Sector B",
      date: "May 12, 2026",
      score: 72,
      type: "Clay Soil",
    },
    {
      id: "r3",
      title: "Orchard Hill - Sector C",
      date: "April 28, 2026",
      score: 48,
      type: "Silty Soil",
    },
    {
      id: "r4",
      title: "North Field - Initial",
      date: "April 15, 2026",
      score: 65,
      type: "Sandy Loam",
    },
  ];

  // Mock graph coordinates based on timeframe
  const getGraphData = () => {
    switch (timeframe) {
      case "7D":
        return [
          { label: "Mon", score: 80, ph: 6.4 },
          { label: "Tue", score: 81, ph: 6.4 },
          { label: "Wed", score: 81, ph: 6.4 },
          { label: "Thu", score: 83, ph: 6.5 },
          { label: "Fri", score: 84, ph: 6.5 },
          { label: "Sat", score: 85, ph: 6.5 },
          { label: "Sun", score: 85, ph: 6.5 },
        ];
      case "6M":
        return [
          { label: "Dec", score: 62, ph: 5.7 },
          { label: "Jan", score: 65, ph: 5.9 },
          { label: "Feb", score: 68, ph: 6.0 },
          { label: "Mar", score: 72, ph: 6.2 },
          { label: "Apr", score: 80, ph: 6.4 },
          { label: "May", score: 85, ph: 6.5 },
        ];
      case "30D":
      default:
        return [
          { label: "Wk 1", score: 68, ph: 6.0 },
          { label: "Wk 2", score: 72, ph: 6.1 },
          { label: "Wk 3", score: 80, ph: 6.4 },
          { label: "Wk 4", score: 85, ph: 6.5 },
        ];
    }
  };

  const currentGraphPoints = getGraphData();

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

  // Custom visual representation of a historical line/bar graph
  const renderTrendChart = () => {
    const maxVal = 100;
    return (
      <View style={styles.chartOuter}>
        <View style={styles.chartYAxis}>
          <ThemeText category="caption">100%</ThemeText>
          <ThemeText category="caption">75%</ThemeText>
          <ThemeText category="caption">50%</ThemeText>
          <ThemeText category="caption">25%</ThemeText>
          <ThemeText category="caption">0%</ThemeText>
        </View>

        <View style={styles.chartBarsGrid}>
          {currentGraphPoints.map((pt, i) => {
            const fillHeightPercent = (pt.score / maxVal) * 100;
            return (
              <View key={i} style={styles.chartColumn}>
                <View style={styles.columnBarTrack}>
                  {/* High tech bar filler */}
                  <View
                    style={[
                      styles.columnBarFill,
                      { height: `${fillHeightPercent}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.columnLabel}>{pt.label}</Text>
              </View>
            );
          })}
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

        {/* SMART TREND INSIGHT CARD */}
        <EarthyCard style={styles.trendAdvisoryCard}>
          <View style={styles.trendAdvisoryTitle}>
            <Ionicons name="stats-chart" size={18} color={Colors.darkGreen} />
            <ThemeText
              category="bodyBold"
              style={{ marginLeft: 8, color: Colors.darkGreen }}
            >
              Soil Improvement Trends
            </ThemeText>
          </View>
          <ThemeText category="body" style={styles.trendAdvisoryText}>
            Soil health scores show an upward trajectory of{" "}
            <ThemeText category="bodyBold" style={{ color: Colors.darkGreen }}>
              +8.4% since March
            </ThemeText>{" "}
            due to active organic treatments in Sector A. pH has stabilized
            within the ideal 6.4 - 6.5 range.
          </ThemeText>
        </EarthyCard>

        {/* HISTORICAL GRAPH CARD */}
        <EarthyCard style={styles.graphCard}>
          <View style={styles.graphCardHeader}>
            <View>
              <ThemeText category="h3">Soil Health Score Progress</ThemeText>
              <ThemeText category="caption">
                Average performance value over time
              </ThemeText>
            </View>
            <View style={styles.legendDotContainer}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.darkGreen },
                ]}
              />
              <ThemeText category="caption">Health Score</ThemeText>
            </View>
          </View>

          {renderTrendChart()}
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

        {pastReports.map((report) => (
          <EarthyCard key={report.id} style={styles.reportRowCard}>
            <View style={styles.reportRowLeft}>
              <View style={styles.reportIconCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={Colors.darkGreen}
                />
              </View>
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">{report.title}</ThemeText>
                <ThemeText category="caption">
                  {report.type} • {report.date}
                </ThemeText>
              </View>
            </View>

            <View style={styles.reportRowRight}>
              <View
                style={[
                  styles.reportScoreBadge,
                  {
                    backgroundColor:
                      report.score >= 80
                        ? Colors.lightGreen + "15"
                        : report.score >= 60
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
                        report.score >= 80
                          ? Colors.darkGreen
                          : report.score >= 60
                            ? "#FFB300"
                            : "#FF7043",
                    },
                  ]}
                >
                  {report.score}%
                </Text>
              </View>

              <TouchableOpacity
                style={styles.downloadRowBtn}
                onPress={() =>
                  Alert.alert(
                    "Download",
                    `Downloading full report PDF: ${report.title}`,
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
        ))}
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
  trendAdvisoryCard: {
    backgroundColor: Colors.lightGreen + "12",
    borderWidth: 1,
    borderColor: Colors.lightGreen + "30",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  trendAdvisoryTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  trendAdvisoryText: {
    color: Colors.darkGreen,
    lineHeight: 18,
    fontSize: 13,
  },
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
  legendDotContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chartOuter: {
    flexDirection: "row",
    height: 180,
    alignItems: "stretch",
    paddingTop: 10,
  },
  chartYAxis: {
    width: 36,
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
  },
  chartBarsGrid: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.lightGray,
    paddingBottom: 4,
  },
  chartColumn: {
    alignItems: "center",
    width: "12%",
    height: "100%",
    justifyContent: "flex-end",
  },
  columnBarTrack: {
    flex: 1,
    width: 8,
    justifyContent: "flex-end",
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginBottom: 4,
  },
  columnBarFill: {
    width: "100%",
    backgroundColor: Colors.darkGreen,
    borderRadius: 4,
  },
  columnLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
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
