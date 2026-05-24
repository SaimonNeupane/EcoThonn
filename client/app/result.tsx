import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import {
  EarthyCard,
  ThemeText,
  EarthyButton,
  HealthScoreGauge,
  NPKChart,
  Colors,
  useThemeColors,
} from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

// const { width } = Dimensions.get("window");

export default function ResultScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  // Simulated data for Soil Report
  const reportData = {
    fieldName: "North Field (Sector A)",
    date: "May 23, 2026",
    soilType: "Sandy Loam",
    classification: "Class II (High Yield Potential)",
    confidence: 94.8,
    healthScore: 85,
    pH: 6.5,
    moisture: 45,
    npk: { n: 78, p: 42, k: 88 },
    riskFactors: [
      {
        id: "1",
        name: "Fungal Spores",
        risk: "Low",
        icon: "bug-outline",
        color: Colors.lightGreen,
      },
      {
        id: "2",
        name: "Root Rot Vulnerability",
        risk: "Medium",
        icon: "alert-circle-outline",
        color: Colors.accentYellow,
      },
      {
        id: "3",
        name: "Nematodes",
        risk: "None Detected",
        icon: "shield-checkmark-outline",
        color: Colors.lightGreen,
      },
    ],
    improvements: [
      "Incorporate 2 inches of composted organic matter to raise soil carbon.",
      "Add bone meal or rock phosphate to target phosphorus deficiencies.",
      "Plant cover crops (e.g. clover or alfalfa) to fix nitrogen naturally.",
    ],
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `SoilSense AI Report: ${reportData.fieldName} has a health score of ${reportData.healthScore}% (${reportData.soilType}, pH ${reportData.pH}). Recommended crops include Soybeans.`,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      "Download Report",
      "PDF report has been generated and saved to your device.",
      [{ text: "Open File" }, { text: "Dismiss" }],
    );
  };

  // Custom component to render pH slider
  const renderPhSlider = (val: number) => {
    // 0 = acidic, 7 = neutral, 14 = alkaline
    const positionPct = (val / 14) * 100;
    return (
      <View style={styles.phContainer}>
        <View style={styles.phTextRow}>
          <ThemeText category="bodyBold" style={{ color: "#E57373" }}>
            Acidic (0)
          </ThemeText>
          <ThemeText category="bodyBold" style={{ color: Colors.lightGreen }}>
            Neutral (7)
          </ThemeText>
          <ThemeText category="bodyBold" style={{ color: "#81C784" }}>
            Alkaline (14)
          </ThemeText>
        </View>
        <View style={styles.phTrack}>
          {/* Colors gradient blocks */}
          <View
            style={[
              styles.phColorBlock,
              {
                backgroundColor: "#FFCDD2",
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
              },
            ]}
          />
          <View style={[styles.phColorBlock, { backgroundColor: "#FFF9C4" }]} />
          <View style={[styles.phColorBlock, { backgroundColor: "#C8E6C9" }]} />
          <View style={[styles.phColorBlock, { backgroundColor: "#B2DFDB" }]} />
          <View
            style={[
              styles.phColorBlock,
              {
                backgroundColor: "#B3E5FC",
                borderTopRightRadius: 6,
                borderBottomRightRadius: 6,
              },
            ]}
          />

          {/* pH Indicator Pin */}
          <View style={[styles.phIndicatorPin, { left: `${positionPct}%` }]}>
            <View style={styles.phPinInner} />
          </View>
        </View>
        <View style={styles.phSummaryRow}>
          <ThemeText category="h2" style={{ color: Colors.darkGreen }}>
            pH {val}
          </ThemeText>
          <View style={styles.phStatusLabel}>
            <ThemeText
              category="caption"
              style={{ color: Colors.darkGreen, fontWeight: "700" }}
            >
              SLIGHTLY ACIDIC (IDEAL)
            </ThemeText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER BAR */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <ThemeText category="h2">Diagnostic Report</ThemeText>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
            <Ionicons name="share-outline" size={22} color={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDownload}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name="download-outline"
              size={22}
              color={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SOIL PREVIEW & CLASSIFICATION SUMMARY */}
        <EarthyCard style={styles.summaryCard}>
          <View style={styles.previewRow}>
            {/* Mock captured soil image */}
            <View style={styles.soilImagePreview}>
              <View style={styles.soilTextureBg}>
                <View style={styles.pebble1} />
                <View style={styles.pebble2} />
              </View>
              <View style={styles.analysisOverlay}>
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={Colors.accentYellow}
                />
                <Text style={styles.overlayText}>AI Scanned</Text>
              </View>
            </View>

            <View style={styles.classDetails}>
              <ThemeText category="caption" style={styles.sectorLabel}>
                {reportData.fieldName}
              </ThemeText>
              <ThemeText category="h2" style={styles.soilTypeName}>
                {reportData.soilType}
              </ThemeText>
              <ThemeText category="body" style={{ color: themeColors.subText }}>
                {reportData.classification}
              </ThemeText>

              {/* Confidence progress bar */}
              <View style={styles.confidenceBox}>
                <View style={styles.confidenceLabelRow}>
                  <ThemeText category="caption">AI Confidence</ThemeText>
                  <ThemeText category="caption" style={{ fontWeight: "700" }}>
                    {reportData.confidence}%
                  </ThemeText>
                </View>
                <View
                  style={[
                    styles.confidenceBarBg,
                    { backgroundColor: themeColors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.confidenceBarFill,
                      { width: `${reportData.confidence}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </EarthyCard>

        {/* HEALTH SCORE GAUGE */}
        <EarthyCard style={styles.gaugeCard}>
          <ThemeText category="h3" style={styles.cardSectionTitle}>
            Soil Health Status
          </ThemeText>
          <View style={styles.gaugeInnerContent}>
            <HealthScoreGauge
              score={reportData.healthScore}
              size={130}
              strokeWidth={9}
            />
            <View style={styles.gaugeDescBlock}>
              <ThemeText category="bodyBold">
                Excellent Soil Organic Carbon
              </ThemeText>
              <ThemeText category="caption" style={styles.gaugeDescText}>
                Your soil is rich in microbiological activity and demonstrates
                good root aeration. Water absorption and drainage ratios are
                highly balanced.
              </ThemeText>
            </View>
          </View>
        </EarthyCard>

        {/* pH VISUALIZATION */}
        <EarthyCard style={styles.pHCard}>
          <ThemeText category="h3" style={styles.cardSectionTitle}>
            Acidity Level (pH)
          </ThemeText>
          {renderPhSlider(reportData.pH)}
        </EarthyCard>

        {/* MOISTURE ANALYTICS */}
        <EarthyCard style={styles.moistureCard}>
          <ThemeText category="h3" style={styles.cardSectionTitle}>
            Moisture Analytics
          </ThemeText>
          <View style={styles.moistureRow}>
            <View style={styles.moistureMetricBox}>
              <Ionicons name="water" size={32} color="#42A5F5" />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="h2">{reportData.moisture}%</ThemeText>
                <ThemeText category="caption">Volumetric Moisture</ThemeText>
              </View>
            </View>
            <View style={styles.moistureBadge}>
              <ThemeText
                category="caption"
                style={{ color: Colors.darkGreen, fontWeight: "700" }}
              >
                STABLE MOISTURE
              </ThemeText>
            </View>
          </View>
          <ThemeText category="caption" style={styles.moistureDesc}>
            Moisture readings indicate the loam retains irrigation properly.
            Ideal for seeding high-demand crops within the next 5 days.
          </ThemeText>
        </EarthyCard>

        {/* NPK NUTRIENT GRAPHS */}
        <EarthyCard style={styles.npkCard}>
          <ThemeText category="h3" style={styles.cardSectionTitle}>
            Nutrient Levels (NPK)
          </ThemeText>
          <NPKChart
            n={reportData.npk.n}
            p={reportData.npk.p}
            k={reportData.npk.k}
          />

          <View style={styles.npkNoteBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#E65100"
              style={{ marginTop: 2 }}
            />
            <ThemeText category="caption" style={styles.npkNoteText}>
              <ThemeText category="bodyBold" style={{ color: "#E65100" }}>
                Warning:{" "}
              </ThemeText>
              Phosphorus (P) levels are low (42%). This might limit root system
              expansions on young plants. Consider targeted phosphate boosters.
            </ThemeText>
          </View>
        </EarthyCard>

        {/* AI EXPLANATION SECTION */}
        <EarthyCard style={styles.explanationCard}>
          <View style={styles.aiHeaderRow}>
            <Ionicons name="sparkles" size={20} color={Colors.darkGreen} />
            <ThemeText
              category="h3"
              style={{ marginLeft: 8, color: Colors.darkGreen }}
            >
              SoilSense AI Analysis
            </ThemeText>
          </View>
          <ThemeText category="body" style={styles.aiText}>
            “The soil profile shows an optimal Sandy Loam texture ideal for
            summer sowing. Due to last winter&apos;s crop, Nitrogen remains
            moderate but Phosphorus has depleted by 15%. Soil microbial activity
            is strong, supported by a healthy pH of 6.5. There is low fungal
            risk, though crop rotation is recommended to prevent root pathogen
            buildup.”
          </ThemeText>
        </EarthyCard>

        {/* DISEASE RISK INDICATORS */}
        <EarthyCard style={styles.riskCard}>
          <ThemeText category="h3" style={styles.cardSectionTitle}>
            Pathogen & Disease Risks
          </ThemeText>
          {reportData.riskFactors.map((risk) => (
            <View key={risk.id} style={styles.riskRow}>
              <View style={styles.riskLabelPart}>
                <Ionicons
                  name={risk.icon as any}
                  size={18}
                  color={themeColors.text}
                />
                <ThemeText category="body" style={{ marginLeft: 10 }}>
                  {risk.name}
                </ThemeText>
              </View>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: risk.color + "20" },
                ]}
              >
                <Text style={[styles.riskBadgeText, { color: risk.color }]}>
                  {risk.risk}
                </Text>
              </View>
            </View>
          ))}
        </EarthyCard>

        {/* SUGGESTED IMPROVEMENTS */}
        <EarthyCard style={styles.improvementsCard}>
          <ThemeText
            category="h3"
            style={[styles.cardSectionTitle, { color: Colors.white }]}
          >
            Suggested Soil Treatments
          </ThemeText>
          {reportData.improvements.map((improvement, index) => (
            <View key={index} style={styles.impBulletRow}>
              <View style={styles.impNumberCircle}>
                <Text style={styles.impNumberText}>{index + 1}</Text>
              </View>
              <ThemeText category="body" style={styles.impText}>
                {improvement}
              </ThemeText>
            </View>
          ))}
        </EarthyCard>

        {/* ACTION CTAs */}
        <View style={styles.ctaRow}>
          <EarthyButton
            title="Recommended Crops"
            variant="primary"
            icon="leaf-outline"
            onPress={() => router.push("/crops")}
            style={styles.ctaHalfBtn}
          />
          <EarthyButton
            title="Fertilizer Treatment"
            variant="secondary"
            icon="flask-outline"
            onPress={() => router.push("/fertilizer")}
            style={styles.ctaHalfBtn}
          />
        </View>

        <EarthyButton
          title="Return to Dashboard"
          variant="outline"
          icon="home-outline"
          onPress={() => router.replace("/root/tab/home")}
          style={{ width: "100%", marginBottom: 12 }}
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
  headerIcons: {
    flexDirection: "row",
  },
  headerIconBtn: {
    marginLeft: 16,
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  soilImagePreview: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  soilTextureBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.brown,
  },
  pebble1: {
    position: "absolute",
    width: 30,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6D4C41",
    top: 20,
    left: 10,
  },
  pebble2: {
    position: "absolute",
    width: 40,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#4E342E",
    bottom: 10,
    right: 15,
  },
  analysisOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(27,94,32,0.8)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  overlayText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
    marginLeft: 3,
  },
  classDetails: {
    flex: 1,
    marginLeft: 16,
  },
  sectorLabel: {
    fontWeight: "600",
  },
  soilTypeName: {
    fontSize: 18,
    fontWeight: "800",
    marginVertical: 2,
  },
  confidenceBox: {
    marginTop: 10,
  },
  confidenceLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  confidenceBarBg: {
    height: 6,
    borderRadius: 3,
  },
  confidenceBarFill: {
    height: "100%",
    backgroundColor: Colors.lightGreen,
    borderRadius: 3,
  },
  cardSectionTitle: {
    fontWeight: "800",
    marginBottom: 12,
  },
  gaugeCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  gaugeInnerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gaugeDescBlock: {
    flex: 1,
    marginLeft: 16,
  },
  gaugeDescText: {
    marginTop: 4,
    lineHeight: 16,
  },
  pHCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  phContainer: {
    marginVertical: 6,
  },
  phTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  phTrack: {
    height: 12,
    flexDirection: "row",
    position: "relative",
    marginBottom: 12,
  },
  phColorBlock: {
    flex: 1,
  },
  phIndicatorPin: {
    position: "absolute",
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  phPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  phSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  phStatusLabel: {
    backgroundColor: Colors.lightGreen + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moistureCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  moistureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moistureMetricBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  moistureBadge: {
    backgroundColor: Colors.lightGreen + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moistureDesc: {
    marginTop: 12,
    lineHeight: 16,
  },
  npkCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  npkNoteBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFE0B2",
    padding: 12,
    borderRadius: 12,
  },
  npkNoteText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
    color: "#E65100",
  },
  explanationCard: {
    backgroundColor: Colors.lightGreen + "12",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.lightGreen + "40",
    marginBottom: 16,
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiText: {
    fontStyle: "italic",
    lineHeight: 20,
    color: Colors.darkGreen,
  },
  riskCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  riskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 10,
  },
  riskLabelPart: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  improvementsCard: {
    backgroundColor: Colors.brown,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  impBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 6,
  },
  impNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  impNumberText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2E3A2F",
  },
  impText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.white,
    fontSize: 13,
  },
  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  ctaHalfBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
