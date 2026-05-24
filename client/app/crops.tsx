import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  EarthyCard,
  ThemeText,
  EarthyButton,
  Colors,
  useThemeColors,
} from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type SeasonType = "Summer" | "Winter" | "Monsoon" | "Spring";

interface CropItem {
  id: string;
  name: string;
  season: SeasonType;
  suitability: number;
  yieldForecast: string;
  waterNeed: "Low" | "Medium" | "High" | "Very High";
  duration: string;
  profitability: "High" | "Medium" | "Low";
  desc: string;
  iconName: string;
  iconColor: string;
}

export default function CropsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [selectedSeason, setSelectedSeason] = useState<SeasonType>("Summer");

  const seasonsList: SeasonType[] = ["Summer", "Winter", "Monsoon", "Spring"];

  const cropsData: CropItem[] = [
    // Summer
    {
      id: "s1",
      name: "Soybeans",
      season: "Summer",
      suitability: 94,
      yieldForecast: "+15% (Optimal)",
      waterNeed: "Medium",
      duration: "110 Days",
      profitability: "High",
      desc: "Ideal root matching. Requires moderate moisture. Fixes nitrogen, reducing fertilizer cost.",
      iconName: "leaf",
      iconColor: "#66BB6A",
    },
    {
      id: "s2",
      name: "Maize (Corn)",
      season: "Summer",
      suitability: 88,
      yieldForecast: "+8% (Above Avg)",
      waterNeed: "High",
      duration: "120 Days",
      profitability: "High",
      desc: "Strong sunlight match. Requires light phosphorus boosting at planting.",
      iconName: "sparkles",
      iconColor: "#FFA726",
    },
    {
      id: "s3",
      name: "Sorghum",
      season: "Summer",
      suitability: 82,
      yieldForecast: "+5% (Stable)",
      waterNeed: "Low",
      duration: "100 Days",
      profitability: "Medium",
      desc: "Highly drought-resistant. Excellent fit for Sandy Loam under minimal irrigation.",
      iconName: "sunny",
      iconColor: "#FFB300",
    },
    // Winter
    {
      id: "w1",
      name: "Wheat",
      season: "Winter",
      suitability: 91,
      yieldForecast: "+10% (Good)",
      waterNeed: "Medium",
      duration: "115 Days",
      profitability: "High",
      desc: "Perfect temperature compatibility. Requires balanced potassium content.",
      iconName: "rose",
      iconColor: "#8D6E63",
    },
    {
      id: "w2",
      name: "Barley",
      season: "Winter",
      suitability: 84,
      yieldForecast: "+4% (Stable)",
      waterNeed: "Low",
      duration: "90 Days",
      profitability: "Medium",
      desc: "Extremely resilient crop. Flourishes in neutral-to-slightly-acidic soils.",
      iconName: "grid",
      iconColor: "#78909C",
    },
    // Monsoon
    {
      id: "m1",
      name: "Rice (Paddy)",
      season: "Monsoon",
      suitability: 96,
      yieldForecast: "+18% (Excellent)",
      waterNeed: "Very High",
      duration: "130 Days",
      profitability: "High",
      desc: "Takes advantage of maximum water retention. Loam limits drainage perfectly.",
      iconName: "water",
      iconColor: "#42A5F5",
    },
    {
      id: "m2",
      name: "Jute",
      season: "Monsoon",
      suitability: 85,
      yieldForecast: "+6% (Stable)",
      waterNeed: "High",
      duration: "120 Days",
      profitability: "Medium",
      desc: "Enjoys warm weather and high water levels. Solid secondary fiber option.",
      iconName: "git-merge",
      iconColor: "#8D6E63",
    },
    // Spring
    {
      id: "sp1",
      name: "Sunflower",
      season: "Spring",
      suitability: 89,
      yieldForecast: "+11% (Optimal)",
      waterNeed: "Medium",
      duration: "95 Days",
      profitability: "High",
      desc: "Flourishes in sandy loam. Requires high sunshine but moderate irrigation.",
      iconName: "flower",
      iconColor: "#FFB300",
    },
    {
      id: "sp2",
      name: "Cotton",
      season: "Spring",
      suitability: 80,
      yieldForecast: "+3% (Average)",
      waterNeed: "High",
      duration: "140 Days",
      profitability: "High",
      desc: "High market value. Demands rich nitrogen levels and regular pest monitoring.",
      iconName: "shirt",
      iconColor: "#B0BEC5",
    },
  ];

  const filteredCrops = cropsData.filter(
    (crop) => crop.season === selectedSeason,
  );

  const getAiSummary = () => {
    switch (selectedSeason) {
      case "Winter":
        return "Wheat is highly recommended for winter due to neutral pH. Consider preparing fields with potassium salts.";
      case "Monsoon":
        return "Heavy monsoon water retention suits Rice. Ensure clay sectors are drained to prevent waterlog.";
      case "Spring":
        return "Warm spring sunlight is perfect for Sunflower. Moderate nitrogen depletion is manageable.";
      case "Summer":
      default:
        return "Sandy Loam soil (pH 6.5) matches perfectly with Soybeans. Legumes will naturally replenish depleted nitrogen.";
    }
  };

  const getWaterColor = (need: string) => {
    if (need === "Low") return "#81C784";
    if (need === "Medium") return "#42A5F5";
    if (need === "High") return "#FF8A65";
    return "#E57373";
  };

  const getProfitColor = (p: string) => {
    if (p === "High") return Colors.lightGreen;
    if (p === "Medium") return Colors.accentYellow;
    return "#E57373";
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <ThemeText category="h2" style={styles.headerTitle}>
            Crop Recommendations
          </ThemeText>
          <ThemeText category="caption" style={styles.headerSubtitle}>
            Based on Sandy Loam analysis
          </ThemeText>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() =>
            Alert.alert(
              "How it works",
              "Suitability is calculated based on soil NPK levels, moisture capacity, regional weather, and average market pricing.",
            )
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      {/* ── SEASON SELECTOR ── */}
      <View style={[styles.seasonBar, { borderBottomColor: themeColors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonScrollContent}
        >
          {seasonsList.map((season) => {
            const isActive = selectedSeason === season;
            return (
              <TouchableOpacity
                key={season}
                onPress={() => setSelectedSeason(season)}
                style={[
                  styles.seasonTab,
                  isActive
                    ? styles.seasonTabActive
                    : {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.seasonTabText,
                    { color: isActive ? Colors.white : themeColors.text },
                  ]}
                >
                  {season}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── MAIN SCROLL ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AI Advisory card */}
        <EarthyCard style={styles.aiCard}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={16} color={Colors.darkGreen} />
            <ThemeText category="bodyBold" style={styles.aiTitle} numberOfLines={1}>
              SoilSense AI • {selectedSeason} Advisory
            </ThemeText>
          </View>
          <ThemeText category="caption" style={styles.aiText}>
            &ldquo;{getAiSummary()}&rdquo;
          </ThemeText>
        </EarthyCard>

        {/* Section heading */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Suitable Varieties
        </ThemeText>

        {filteredCrops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={themeColors.subText}
            />
            <ThemeText category="body" style={{ marginTop: 8, textAlign: "center" }}>
              No matches found for {selectedSeason}.
            </ThemeText>
          </View>
        ) : (
          filteredCrops.map((crop) => (
            <EarthyCard key={crop.id} style={styles.cropCard}>

              {/* ── TOP: icon + match badge in its own row ── */}
              <View style={styles.cropTopRow}>
                {/* Icon + name */}
                <View style={styles.cropIconAndName}>
                  <View
                    style={[
                      styles.cropIconBg,
                      { backgroundColor: crop.iconColor + "18" },
                    ]}
                  >
                    <Ionicons
                      name={crop.iconName as any}
                      size={22}
                      color={crop.iconColor}
                    />
                  </View>
                  <ThemeText category="h2" style={styles.cropName}>
                    {crop.name}
                  </ThemeText>
                </View>

                {/* Match badge */}
                <View style={styles.suitBadge}>
                  <Text style={styles.suitBadgeVal}>{crop.suitability}%</Text>
                  <Text style={styles.suitBadgeLabel}>Match</Text>
                </View>
              </View>

              {/* ── Description (full width, no overlap) ── */}
              <ThemeText
                category="caption"
                style={[styles.cropDesc, { color: themeColors.subText }]}
              >
                {crop.desc}
              </ThemeText>

              {/* ── Divider ── */}
              <View
                style={[styles.divider, { backgroundColor: themeColors.border }]}
              />

              {/* ── Metrics grid (2 columns) ── */}
              <View style={styles.metricsGrid}>
                {/* Yield */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconWrap}>
                    <Ionicons
                      name="trending-up-outline"
                      size={15}
                      color={Colors.lightGreen}
                    />
                  </View>
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption" style={styles.metricLabel}>
                      Yield Forecast
                    </ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{ color: Colors.lightGreen, fontSize: 12 }}
                    >
                      {crop.yieldForecast}
                    </ThemeText>
                  </View>
                </View>

                {/* Water */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconWrap}>
                    <Ionicons
                      name="water-outline"
                      size={15}
                      color={getWaterColor(crop.waterNeed)}
                    />
                  </View>
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption" style={styles.metricLabel}>
                      Water Demand
                    </ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{ color: getWaterColor(crop.waterNeed), fontSize: 12 }}
                    >
                      {crop.waterNeed}
                    </ThemeText>
                  </View>
                </View>

                {/* Duration */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconWrap}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={themeColors.subText}
                    />
                  </View>
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption" style={styles.metricLabel}>
                      Duration
                    </ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{ color: themeColors.text, fontSize: 12 }}
                    >
                      {crop.duration}
                    </ThemeText>
                  </View>
                </View>

                {/* Profit */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconWrap}>
                    <Ionicons
                      name="cash-outline"
                      size={15}
                      color={getProfitColor(crop.profitability)}
                    />
                  </View>
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption" style={styles.metricLabel}>
                      Profit Index
                    </ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{ color: getProfitColor(crop.profitability), fontSize: 12 }}
                    >
                      {crop.profitability}
                    </ThemeText>
                  </View>
                </View>
              </View>

              {/* ── CTA button ── */}
              <TouchableOpacity
                style={[
                  styles.guideBtn,
                  {
                    backgroundColor: themeColors.isDark
                      ? Colors.darkGreen + "30"
                      : Colors.lightGreen + "18",
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    `${crop.name} – Growth Guide`,
                    `Soil depth: 8–10 inches.\nFertilizer mix: 20-10-10 NPK.\nMarket buyers available in central region.`,
                  )
                }
              >
                <Ionicons name="book-outline" size={14} color={Colors.darkGreen} />
                <Text style={styles.guideBtnText}>View Growth Guide</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.darkGreen} />
              </TouchableOpacity>
            </EarthyCard>
          ))
        )}

        <EarthyButton
          title="Back to Diagnosis"
          variant="outline"
          icon="chevron-back"
          onPress={() => router.back()}
          style={{ marginTop: 8, marginBottom: 16 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSubtitle: {
    textAlign: "center",
    marginTop: 1,
  },

  // ── Season selector ─────────────────────────────────────────────────────
  seasonBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  seasonScrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  seasonTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  seasonTabActive: {
    backgroundColor: Colors.darkGreen,
  },
  seasonTabText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Scroll content ──────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── AI advisory card ────────────────────────────────────────────────────
  aiCard: {
    backgroundColor: Colors.lightGreen + "12",
    borderWidth: 1,
    borderColor: Colors.lightGreen + "35",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  aiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  aiTitle: {
    color: Colors.darkGreen,
    flex: 1,
    fontSize: 13,
  },
  aiText: {
    color: Colors.darkGreen,
    lineHeight: 18,
    fontStyle: "italic",
  },

  // ── Section title ───────────────────────────────────────────────────────
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 12,
  },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },

  // ── Crop card ───────────────────────────────────────────────────────────
  cropCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },

  // Top row: icon+name  |  badge
  cropTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cropIconAndName: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 10,
  },
  cropIconBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cropName: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },

  // Match badge
  suitBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: Colors.lightGreen,
    backgroundColor: Colors.lightGreen + "12",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  suitBadgeVal: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.darkGreen,
  },
  suitBadgeLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // Description (full width under header row)
  cropDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: 12,
  },

  // Metrics 2-col grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  metricItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 8,
    marginBottom: 12,
    gap: 8,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.lightGray + "80",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  metricTexts: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    marginBottom: 2,
  },

  // Growth Guide button
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  guideBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.darkGreen,
    flex: 1,
    textAlign: "center",
  },
});
