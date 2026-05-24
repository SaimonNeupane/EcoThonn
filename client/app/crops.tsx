import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
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

  // Database of recommended crops
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
      desc: "High market value. Demands rich nitrogen levels and regular pest monitor.",
      iconName: "shirt",
      iconColor: "#B0BEC5",
    },
  ];

  const filteredCrops = cropsData.filter(
    (crop) => crop.season === selectedSeason,
  );

  // Custom AI summary statement depending on selected season
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
    return "#E57373";
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <ThemeText category="h2">Crop Recommendations</ThemeText>
          <ThemeText category="caption">Based on Sandy Loam analysis</ThemeText>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Tips",
              "Suitability is calculated based on soil NPK levels, moisture capacity, current regional weather, and average market pricing.",
            )
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      {/* SEASON SELECTOR BAR */}
      <View
        style={[styles.seasonTabs, { borderBottomColor: themeColors.border }]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {seasonsList.map((season) => (
            <TouchableOpacity
              key={season}
              onPress={() => setSelectedSeason(season)}
              style={[
                styles.tabBtn,
                selectedSeason === season
                  ? { backgroundColor: Colors.darkGreen }
                  : {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      borderWidth: 1,
                    },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedSeason === season
                    ? { color: Colors.white }
                    : { color: themeColors.text },
                ]}
              >
                {season}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SMART AI INSIGHTS CARD */}
        <EarthyCard style={styles.aiCard}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={18} color={Colors.darkGreen} />
            <ThemeText category="bodyBold" style={styles.aiTitle}>
              SoilSense AI Advisory • {selectedSeason}
            </ThemeText>
          </View>
          <ThemeText category="caption" style={styles.aiText}>
            “{getAiSummary()}”
          </ThemeText>
        </EarthyCard>

        {/* LIST OF RECOMMENDED CROPS */}
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
            <ThemeText category="body" style={{ marginTop: 8 }}>
              No matches found for {selectedSeason}.
            </ThemeText>
          </View>
        ) : (
          filteredCrops.map((crop) => (
            <EarthyCard key={crop.id} style={styles.cropCard}>
              {/* Card top row */}
              <View style={styles.cropCardHeader}>
                <View style={styles.cropInfoLeft}>
                  <View
                    style={[
                      styles.cropIconBg,
                      { backgroundColor: crop.iconColor + "15" },
                    ]}
                  >
                    <Ionicons
                      name={crop.iconName as any}
                      size={24}
                      color={crop.iconColor}
                    />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <ThemeText category="h2" style={styles.cropName}>
                      {crop.name}
                    </ThemeText>
                    <ThemeText category="caption">{crop.desc}</ThemeText>
                  </View>
                </View>

                {/* Match percentage gauge badge */}
                <View style={styles.suitBadgeOuter}>
                  <Text style={styles.suitBadgeVal}>{crop.suitability}%</Text>
                  <Text style={styles.suitBadgeLabel}>Match</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Data Indicators Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Ionicons
                    name="trending-up-outline"
                    size={16}
                    color={themeColors.subText}
                  />
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption">Yield Forecast</ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{ color: Colors.lightGreen }}
                    >
                      {crop.yieldForecast}
                    </ThemeText>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Ionicons
                    name="water-outline"
                    size={16}
                    color={themeColors.subText}
                  />
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption">Water Demand</ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{ color: getWaterColor(crop.waterNeed) }}
                    >
                      {crop.waterNeed}
                    </ThemeText>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={themeColors.subText}
                  />
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption">Duration</ThemeText>
                    <ThemeText category="bodyBold">{crop.duration}</ThemeText>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={themeColors.subText}
                  />
                  <View style={styles.metricTexts}>
                    <ThemeText category="caption">Profit Index</ThemeText>
                    <ThemeText
                      category="bodyBold"
                      style={{
                        color:
                          crop.profitability === "High"
                            ? Colors.lightGreen
                            : Colors.accentYellow,
                      }}
                    >
                      {crop.profitability}
                    </ThemeText>
                  </View>
                </View>
              </View>

              {/* CTA Row Inside Card */}
              <View style={styles.cropCardActions}>
                <TouchableOpacity
                  style={[
                    styles.actionLinkBtn,
                    {
                      backgroundColor: themeColors.isDark
                        ? "#2E3F32"
                        : "#F4F6F4",
                    },
                  ]}
                  onPress={() =>
                    Alert.alert(
                      `${crop.name} details`,
                      `Detailed soil depth requirements: 8-10 inches.\nIdeal fertilizer mix: 20-10-10 NPK.\nReady market buyers found in California central region.`,
                    )
                  }
                >
                  <ThemeText
                    category="caption"
                    style={{ color: Colors.darkGreen, fontWeight: "700" }}
                  >
                    View Growth Guide
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </EarthyCard>
          ))
        )}

        <EarthyButton
          title="Back to Diagnosis"
          variant="outline"
          icon="chevron-back"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        />
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
  headerTitleBox: {
    alignItems: "center",
  },
  seasonTabs: {
    height: 60,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  aiCard: {
    backgroundColor: Colors.lightGreen + "12",
    borderWidth: 1,
    borderColor: Colors.lightGreen + "30",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  aiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  aiTitle: {
    marginLeft: 6,
    color: Colors.darkGreen,
  },
  aiText: {
    color: Colors.darkGreen,
    lineHeight: 18,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  cropCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  cropCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cropInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cropIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cropName: {
    fontSize: 16,
    fontWeight: "800",
  },
  suitBadgeOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.lightGreen,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightGreen + "10",
  },
  suitBadgeVal: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.darkGreen,
  },
  suitBadgeLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: -1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 14,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  metricTexts: {
    marginLeft: 8,
  },
  cropCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  actionLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
