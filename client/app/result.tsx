import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Text,
  Image,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { getScanById, normalizeSoilType, SoilScan } from "../services/api";

const { width } = Dimensions.get("window");

// ─── Soil knowledge base ────────────────────────────────────────────────────

type SoilProfile = {
  classification: string;
  healthScore: number;
  phValue: number;
  phLabel: string;
  phStatus: string;
  moisture: number;
  moistureLabel: string;
  aiSummary: string;
  crops: string[];
  treatments: string[];
  npkWarning: string | null;
  riskFactors: { name: string; risk: string; icon: string; color: string }[];
};

const SOIL_PROFILES: Record<string, SoilProfile> = {
  "Alluvial Soil": {
    classification: "Class I · Very High Yield Potential",
    healthScore: 88,
    phValue: 7.2,
    phLabel: "Neutral",
    phStatus: "IDEAL FOR MOST CROPS",
    moisture: 52,
    moistureLabel: "OPTIMAL MOISTURE",
    aiSummary:
      "Alluvial soil is among the most fertile in the subcontinent, formed by river sediment deposits. It has excellent water retention and a well-balanced nutrient profile. Potassium levels are naturally high, but regular nitrogen supplementation is recommended for high-yield cultivation.",
    crops: ["Rice", "Wheat", "Sugarcane", "Maize", "Pulses"],
    treatments: [
      "Apply urea or ammonium sulphate to replenish nitrogen before sowing.",
      "Use single superphosphate to address phosphorus deficiency.",
      "Practice seasonal crop rotation to prevent nutrient depletion.",
    ],
    npkWarning:
      "Nitrogen (N) and Phosphorus (P) are typically low — supplement before sowing.",
    riskFactors: [
      {
        name: "Waterlogging Risk",
        risk: "Medium",
        icon: "water-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Fungal Pathogens",
        risk: "Low",
        icon: "bug-outline",
        color: Colors.lightGreen,
      },
      {
        name: "Salinity",
        risk: "None Detected",
        icon: "shield-checkmark-outline",
        color: Colors.lightGreen,
      },
    ],
  },
  "Arid Soil": {
    classification: "Class IV · Low Yield Potential",
    healthScore: 34,
    phValue: 8.2,
    phLabel: "Alkaline",
    phStatus: "NEEDS ACIDIFICATION",
    moisture: 12,
    moistureLabel: "CRITICALLY DRY",
    aiSummary:
      "Arid soil is highly alkaline and extremely low in organic matter and nitrogen. Its sandy texture leads to rapid water loss and poor nutrient retention. Cultivation is possible only with heavy amendment — drip irrigation, organic matter addition, and phosphate supplements are essential before sowing.",
    crops: ["Bajra", "Drought-tolerant Sorghum", "Moth Bean", "Cluster Bean"],
    treatments: [
      "Add gypsum or sulphur to reduce alkalinity before planting.",
      "Incorporate large quantities of composted manure to build organic matter.",
      "Install drip irrigation; this soil cannot sustain flood or sprinkler methods.",
    ],
    npkWarning:
      "Nitrogen (N) is very low. Phosphorus is normal but potassium may be adequate — verify with a lab test.",
    riskFactors: [
      {
        name: "Wind Erosion",
        risk: "High",
        icon: "alert-circle-outline",
        color: "#EF5350",
      },
      {
        name: "Saline Accumulation",
        risk: "Medium",
        icon: "alert-circle-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Root Rot",
        risk: "None Detected",
        icon: "shield-checkmark-outline",
        color: Colors.lightGreen,
      },
    ],
  },
  "Black Soil": {
    classification: "Class II · High Yield Potential",
    healthScore: 72,
    phValue: 7.8,
    phLabel: "Mildly Alkaline",
    phStatus: "GOOD FOR COTTON & SOYBEAN",
    moisture: 48,
    moistureLabel: "GOOD MOISTURE",
    aiSummary:
      "Black cotton soil (Regur) is known for its high clay content and excellent moisture retention. Rich in calcium, magnesium, and potassium, it is ideal for dry-land farming. However, it swells when wet and cracks when dry, making it challenging to work with. Nitrogen and phosphorus are consistently low and must be supplemented.",
    crops: ["Cotton", "Soybean", "Jowar", "Sunflower", "Wheat"],
    treatments: [
      "Apply DAP (Di-Ammonium Phosphate) to address nitrogen and phosphorus deficiency.",
      "Avoid over-irrigation — the high clay content causes waterlogging.",
      "Use subsoil tillage (deep ploughing) before the kharif season to break hardpan.",
    ],
    npkWarning:
      "Nitrogen (N) and Phosphorus (P) are low despite good potassium — targeted NPK amendment recommended.",
    riskFactors: [
      {
        name: "Cracking & Shrinkage",
        risk: "High",
        icon: "alert-circle-outline",
        color: "#EF5350",
      },
      {
        name: "Waterlogging",
        risk: "Medium",
        icon: "water-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Fungal Pathogens",
        risk: "Low",
        icon: "bug-outline",
        color: Colors.lightGreen,
      },
    ],
  },
  "Laterite Soil": {
    classification: "Class III · Moderate Yield Potential",
    healthScore: 48,
    phValue: 5.4,
    phLabel: "Acidic",
    phStatus: "NEEDS LIMING",
    moisture: 28,
    moistureLabel: "BELOW OPTIMAL",
    aiSummary:
      "Laterite soil is highly leached and acidic, formed in tropical regions with heavy rainfall. It is poor in all major nutrients due to intense weathering. While it supports tea, coffee, and cashew in its natural state, most food crops require significant soil amendment — liming to raise pH and heavy fertilization for any productive yield.",
    crops: ["Tea", "Coffee", "Cashew", "Rubber", "Tapioca"],
    treatments: [
      "Apply agricultural lime (calcium carbonate) to raise pH above 6.0.",
      "Use NPK complex fertilizers — all three nutrients are deficient.",
      "Incorporate green manure or compost to improve organic carbon and water retention.",
    ],
    npkWarning:
      "All major nutrients (N, P, K) are critically low due to heavy leaching. Complete NPK fertilization is essential.",
    riskFactors: [
      {
        name: "Nutrient Leaching",
        risk: "High",
        icon: "alert-circle-outline",
        color: "#EF5350",
      },
      {
        name: "Iron Toxicity",
        risk: "Medium",
        icon: "alert-circle-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Root Rot",
        risk: "Low",
        icon: "bug-outline",
        color: Colors.lightGreen,
      },
    ],
  },
  "Mountain Soil": {
    classification: "Class II · Moderate–High Potential",
    healthScore: 76,
    phValue: 5.9,
    phLabel: "Slightly Acidic",
    phStatus: "SUITABLE FOR HORTICULTURE",
    moisture: 61,
    moistureLabel: "HIGH MOISTURE",
    aiSummary:
      "Mountain (forest) soil is rich in organic humus from leaf litter and has excellent microbial activity. Nitrogen levels are naturally high, but phosphorus and potassium are consistently low. The acidic pH makes it ideal for tea, fruits, and spices. Drainage management is important due to high moisture retention on slopes.",
    crops: ["Apple", "Tea", "Cardamom", "Ginger", "Potato"],
    treatments: [
      "Apply rock phosphate or bone meal to address phosphorus deficiency.",
      "Use muriate of potash (MOP) to supplement low potassium levels.",
      "Maintain terracing on slopes to prevent erosion and retain moisture.",
    ],
    npkWarning:
      "Phosphorus (P) and Potassium (K) are low despite high nitrogen. Targeted P and K supplementation needed.",
    riskFactors: [
      {
        name: "Slope Erosion",
        risk: "High",
        icon: "alert-circle-outline",
        color: "#EF5350",
      },
      {
        name: "Fungal Spores",
        risk: "Medium",
        icon: "bug-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Nematodes",
        risk: "None Detected",
        icon: "shield-checkmark-outline",
        color: Colors.lightGreen,
      },
    ],
  },
  "Red Soil": {
    classification: "Class III · Moderate Yield Potential",
    healthScore: 55,
    phValue: 6.4,
    phLabel: "Slightly Acidic",
    phStatus: "NEAR IDEAL RANGE",
    moisture: 22,
    moistureLabel: "SLIGHTLY DRY",
    aiSummary:
      "Red soil gets its colour from iron oxide content and is well-drained but porous, leading to low moisture retention. It is deficient in nitrogen, phosphorus, and organic matter, but has a reasonable potassium content. With proper amendment and irrigation, it can support a wide variety of crops including groundnuts and pulses.",
    crops: ["Groundnut", "Millets", "Tobacco", "Pulses", "Potato"],
    treatments: [
      "Apply farmyard manure (FYM) to improve organic carbon and water retention.",
      "Use phosphatic fertilizers (SSP or DAP) to address P deficiency.",
      "Mulch between rows to reduce moisture evaporation during dry months.",
    ],
    npkWarning:
      "Nitrogen (N) and Phosphorus (P) are low. Medium potassium — supplement N and P before sowing.",
    riskFactors: [
      {
        name: "Drought Stress",
        risk: "Medium",
        icon: "alert-circle-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Fungal Pathogens",
        risk: "Low",
        icon: "bug-outline",
        color: Colors.lightGreen,
      },
      {
        name: "Nematodes",
        risk: "None Detected",
        icon: "shield-checkmark-outline",
        color: Colors.lightGreen,
      },
    ],
  },
  "Yellow Soil": {
    classification: "Class III · Moderate Yield Potential",
    healthScore: 51,
    phValue: 6.0,
    phLabel: "Slightly Acidic",
    phStatus: "ACCEPTABLE RANGE",
    moisture: 26,
    moistureLabel: "LOW MOISTURE",
    aiSummary:
      "Yellow soil is similar to red soil but higher in iron content that has been further oxidized to a yellow hue. It has low organic matter and poor fertility across all NPK categories. Fine texture helps retain slightly more moisture than red soil, but it still requires extensive organic and inorganic amendment for productive cultivation.",
    crops: ["Rice", "Millets", "Groundnut", "Pulses"],
    treatments: [
      "Apply composted organic matter to improve soil structure and fertility.",
      "Use balanced NPK fertilizer (e.g. 10:26:26) before sowing.",
      "Consider lime application if pH drops below 5.5.",
    ],
    npkWarning:
      "Nitrogen (N), Phosphorus (P), and Potassium (K) are all low. Full NPK amendment is essential.",
    riskFactors: [
      {
        name: "Nutrient Deficiency",
        risk: "High",
        icon: "alert-circle-outline",
        color: "#EF5350",
      },
      {
        name: "Compaction Risk",
        risk: "Medium",
        icon: "alert-circle-outline",
        color: Colors.accentYellow,
      },
      {
        name: "Fungal Pathogens",
        risk: "Low",
        icon: "bug-outline",
        color: Colors.lightGreen,
      },
    ],
  },
};

// ─── NPK text → number helpers ────────────────────────────────────────────────
function npkTextToValue(text: string): number {
  const t = text.toLowerCase();
  if (t.includes("very low")) return 18;
  if (t.includes("low")) return 35;
  if (t.includes("medium") || t.includes("moderate")) return 58;
  if (t.includes("high")) return 80;
  if (t.includes("adequate") || t.includes("normal")) return 65;
  return 45;
}

export default function ResultScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const params = useLocalSearchParams<{
    scanId?: string;
    prediction?: string;
    confidence?: string;
    imageUri?: string;
    lowConfidence?: string;
    props?: string;
  }>();

  const [scanData, setScanData] = useState<SoilScan | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Entrance animations (declared early so hooks order is stable) ───────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // Fetch scan data if scanId is provided
  useEffect(() => {
    if (params.scanId) {
      console.log("Result screen received scanId:", params.scanId);
      const fetchScan = async () => {
        try {
          setLoading(true);
          const data = await getScanById(params.scanId!);
          if (data) {
            console.log("Successfully fetched scan data:", data);
            setScanData(data);
          } else {
            console.error("getScanById returned null");
            Alert.alert("Error", "Failed to load scan data");
          }
        } catch (error) {
          console.error("Error fetching scan:", error);
          Alert.alert("Error", "Failed to load scan data");
        } finally {
          setLoading(false);
        }
      };
      fetchScan();
    }
  }, [params.scanId]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Derived display values ──────────────────────────────────────────────────
  // FIX 1: normalise soil_type so underscore variants ("Black_Soil") match
  //         SOIL_PROFILES keys ("Black Soil")
  const prediction = normalizeSoilType(
    scanData?.soil_type ?? params.prediction ?? "Unknown Soil",
  );

  // FIX 2: use confidence_score (AI model output) not quality_score (health metric)
  const confidence = scanData
    ? (scanData.confidence_score ?? 0)
    : parseFloat(params.confidence ?? "0");

  // FIX 3: use image_uri alias added in api.ts (backed by image_url)
  const imageUri =
    scanData?.image_uri ?? scanData?.image_url ?? params.imageUri ?? null;

  const isLowConfidence = params.lowConfidence === "true" || confidence < 45;

  // ── Parse backend NPK props ─────────────────────────────────────────────────
  let backendProps: Record<string, string> | null = null;
  if (scanData?.npk_values) {
    backendProps = {
      Nitrogen_N: scanData.npk_values.nitrogen || "Medium",
      Phosphorus_P: scanData.npk_values.phosphorus || "Medium",
      Potassium_K: scanData.npk_values.potassium || "Medium",
    };
    console.log("NPK values:", backendProps);
  } else if (params.props) {
    try {
      backendProps = JSON.parse(params.props);
    } catch {
      backendProps = null;
    }
  }

  // ── Profile lookup ──────────────────────────────────────────────────────────
  // FIX 4: log a warning when the prediction doesn't match any known profile
  //         so it's obvious in dev rather than silently using Red Soil
  const profile: SoilProfile = (() => {
    const found = SOIL_PROFILES[prediction];
    if (!found) {
      console.warn(
        `[ResultScreen] No profile found for "${prediction}". ` +
          `Known keys: ${Object.keys(SOIL_PROFILES).join(", ")}. ` +
          `Falling back to Red Soil.`,
      );
    }
    return found ?? SOIL_PROFILES["Red Soil"];
  })();

  // ── NPK bar values ──────────────────────────────────────────────────────────
  const npkN = backendProps?.Nitrogen_N
    ? npkTextToValue(backendProps.Nitrogen_N)
    : 45;
  const npkP = backendProps?.Phosphorus_P
    ? npkTextToValue(backendProps.Phosphorus_P)
    : 38;
  const npkK = backendProps?.Potassium_K
    ? npkTextToValue(backendProps.Potassium_K)
    : 62;

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `SoilSense AI Report\n` +
          `Soil Type: ${prediction}\n` +
          `Health Score: ${profile.healthScore}%\n` +
          `AI Confidence: ${confidence.toFixed(1)}%\n` +
          `Classification: ${profile.classification}\n` +
          `Recommended crops: ${profile.crops.slice(0, 3).join(", ")}`,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // ── pH bar ──────────────────────────────────────────────────────────────────
  const renderPhSlider = (val: number) => {
    const positionPct = Math.min(Math.max((val / 14) * 100, 4), 96);
    return (
      <View style={styles.phContainer}>
        <View style={styles.phTextRow}>
          <Text style={[styles.phLabel, { color: "#E57373" }]}>Acidic</Text>
          <Text style={[styles.phLabel, { color: Colors.lightGreen }]}>
            Neutral
          </Text>
          <Text style={[styles.phLabel, { color: "#42A5F5" }]}>Alkaline</Text>
        </View>
        <View style={styles.phTrack}>
          <View
            style={[
              styles.phSeg,
              {
                backgroundColor: "#FFCDD2",
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
              },
            ]}
          />
          <View style={[styles.phSeg, { backgroundColor: "#FFE0B2" }]} />
          <View style={[styles.phSeg, { backgroundColor: "#FFF9C4" }]} />
          <View style={[styles.phSeg, { backgroundColor: "#C8E6C9" }]} />
          <View style={[styles.phSeg, { backgroundColor: "#B2DFDB" }]} />
          <View
            style={[
              styles.phSeg,
              {
                backgroundColor: "#B3E5FC",
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
              },
            ]}
          />
          <View style={[styles.phPin, { left: `${positionPct}%` as any }]}>
            <View style={styles.phPinInner} />
          </View>
        </View>
        <View style={styles.phSummaryRow}>
          <Text style={styles.phValue}>pH {val}</Text>
          <View style={styles.phBadge}>
            <Text style={styles.phBadgeText}>{profile.phStatus}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Confidence badge colour ─────────────────────────────────────────────────
  const confColor =
    confidence >= 70
      ? Colors.lightGreen
      : confidence >= 45
        ? Colors.accentYellow
        : "#EF5350";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle="dark-content" />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
          <ThemeText category="body" style={{ marginTop: 12 }}>
            Loading scan details...
          </ThemeText>
        </View>
      )}

      {!loading && (
        <>
          {/* ── HEADER ──────────────────────────────────────────────────────── */}
          <View
            style={[styles.header, { borderBottomColor: themeColors.border }]}
          >
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={themeColors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <ThemeText category="h2" style={styles.headerTitle}>
                Soil Report
              </ThemeText>
              <Text style={[styles.headerDate, { color: themeColors.subText }]}>
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
              <Ionicons
                name="share-outline"
                size={20}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* ── LOW CONFIDENCE BANNER ───────────────────────────────────── */}
              {isLowConfidence && (
                <View style={styles.lowConfBanner}>
                  <Ionicons name="warning-outline" size={16} color="#F57F17" />
                  <Text style={styles.lowConfText}>
                    Low confidence ({confidence.toFixed(0)}%) — results are
                    indicative. Try a clearer photo in better lighting.
                  </Text>
                </View>
              )}

              {/* ── HERO CARD ───────────────────────────────────────────────── */}
              <View style={styles.heroCard}>
                <View style={styles.heroImageWrapper}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.heroImage, styles.heroImageFallback]}>
                      <Ionicons
                        name="leaf"
                        size={36}
                        color={Colors.lightGreen}
                      />
                    </View>
                  )}
                  <View style={styles.heroImageOverlay}>
                    <Ionicons
                      name="sparkles"
                      size={11}
                      color={Colors.accentYellow}
                    />
                    <Text style={styles.heroImageOverlayText}>AI SCANNED</Text>
                  </View>
                </View>

                <View style={styles.heroInfo}>
                  <Text
                    style={[
                      styles.heroClassification,
                      { color: "rgba(255,255,255,0.65)" },
                    ]}
                  >
                    {profile.classification}
                  </Text>
                  <Text style={styles.heroSoilName}>{prediction}</Text>

                  <View style={styles.confRow}>
                    <Text style={styles.confLabel}>AI Confidence</Text>
                    <Text style={[styles.confValue, { color: confColor }]}>
                      {confidence.toFixed(1)}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.confTrack,
                      { backgroundColor: "rgba(255,255,255,0.15)" },
                    ]}
                  >
                    <View
                      style={[
                        styles.confFill,
                        {
                          width: `${Math.min(confidence, 100)}%` as any,
                          backgroundColor: confColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* ── HEALTH SCORE ────────────────────────────────────────────── */}
              <EarthyCard style={styles.card}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Soil Health Score
                </Text>
                <View style={styles.gaugeRow}>
                  <HealthScoreGauge
                    score={profile.healthScore}
                    size={120}
                    strokeWidth={9}
                  />
                  <View style={styles.gaugeDesc}>
                    <Text
                      style={[
                        styles.gaugeHeadline,
                        { color: themeColors.text },
                      ]}
                    >
                      {profile.healthScore >= 75
                        ? "Excellent Condition"
                        : profile.healthScore >= 55
                          ? "Moderate Fertility"
                          : "Needs Amendment"}
                    </Text>
                    <Text
                      style={[styles.gaugeBody, { color: themeColors.subText }]}
                    >
                      {profile.aiSummary.slice(0, 120)}…
                    </Text>
                  </View>
                </View>
              </EarthyCard>

              {/* ── AI SUMMARY ──────────────────────────────────────────────── */}
              <View style={styles.aiCard}>
                <View style={styles.aiCardHeader}>
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color={Colors.accentYellow}
                  />
                  <Text style={styles.aiCardTitle}>SoilSense AI Analysis</Text>
                </View>
                <Text style={styles.aiCardBody}>{profile.aiSummary}</Text>
              </View>

              {/* ── pH ──────────────────────────────────────────────────────── */}
              <EarthyCard style={styles.card}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Acidity Level (pH)
                </Text>
                {renderPhSlider(profile.phValue)}
              </EarthyCard>

              {/* ── MOISTURE ────────────────────────────────────────────────── */}
              <EarthyCard style={styles.card}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Moisture Content
                </Text>
                <View style={styles.moistureRow}>
                  <View style={styles.moistureLeft}>
                    <Ionicons name="water" size={30} color="#42A5F5" />
                    <View style={{ marginLeft: 10 }}>
                      <Text
                        style={[
                          styles.moistureValue,
                          { color: themeColors.text },
                        ]}
                      >
                        {profile.moisture}%
                      </Text>
                      <Text
                        style={[
                          styles.moistureSub,
                          { color: themeColors.subText },
                        ]}
                      >
                        Volumetric
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.moistureBadge,
                      {
                        backgroundColor:
                          profile.moisture >= 45
                            ? Colors.lightGreen + "20"
                            : profile.moisture >= 25
                              ? Colors.accentYellow + "20"
                              : "#EF535020",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.moistureBadgeText,
                        {
                          color:
                            profile.moisture >= 45
                              ? Colors.darkGreen
                              : profile.moisture >= 25
                                ? "#E65100"
                                : "#C62828",
                        },
                      ]}
                    >
                      {profile.moistureLabel}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.moistureTrack,
                    { backgroundColor: themeColors.border, marginTop: 14 },
                  ]}
                >
                  <View
                    style={[
                      styles.moistureFill,
                      {
                        width: `${profile.moisture}%` as any,
                        backgroundColor:
                          profile.moisture >= 45
                            ? Colors.lightGreen
                            : profile.moisture >= 25
                              ? Colors.accentYellow
                              : "#EF5350",
                      },
                    ]}
                  />
                </View>
              </EarthyCard>

              {/* ── NPK ─────────────────────────────────────────────────────── */}
              <EarthyCard style={styles.card}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Nutrient Levels (NPK)
                </Text>
                {backendProps && (
                  <View style={styles.npkQualRow}>
                    <View style={styles.npkQualChip}>
                      <Text style={styles.npkQualKey}>N</Text>
                      <Text
                        style={[
                          styles.npkQualVal,
                          { color: themeColors.subText },
                        ]}
                      >
                        {backendProps.Nitrogen_N ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.npkQualChip}>
                      <Text style={styles.npkQualKey}>P</Text>
                      <Text
                        style={[
                          styles.npkQualVal,
                          { color: themeColors.subText },
                        ]}
                      >
                        {backendProps.Phosphorus_P ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.npkQualChip}>
                      <Text style={styles.npkQualKey}>K</Text>
                      <Text
                        style={[
                          styles.npkQualVal,
                          { color: themeColors.subText },
                        ]}
                      >
                        {backendProps.Potassium_K ?? "—"}
                      </Text>
                    </View>
                  </View>
                )}
                <NPKChart n={npkN} p={npkP} k={npkK} />
                {profile.npkWarning && (
                  <View style={styles.npkWarning}>
                    <Ionicons
                      name="warning-outline"
                      size={15}
                      color="#E65100"
                      style={{ marginTop: 1 }}
                    />
                    <Text style={styles.npkWarningText}>
                      {profile.npkWarning}
                    </Text>
                  </View>
                )}
              </EarthyCard>

              {/* ── DISEASE RISKS ───────────────────────────────────────────── */}
              <EarthyCard style={styles.card}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Pathogen & Disease Risk
                </Text>
                {profile.riskFactors.map((risk, i) => (
                  <View
                    key={i}
                    style={[
                      styles.riskRow,
                      i < profile.riskFactors.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: themeColors.border,
                      },
                    ]}
                  >
                    <View style={styles.riskLeft}>
                      <View
                        style={[
                          styles.riskIconBox,
                          { backgroundColor: risk.color + "18" },
                        ]}
                      >
                        <Ionicons
                          name={risk.icon as any}
                          size={16}
                          color={risk.color}
                        />
                      </View>
                      <Text
                        style={[styles.riskName, { color: themeColors.text }]}
                      >
                        {risk.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.riskBadge,
                        { backgroundColor: risk.color + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.riskBadgeText, { color: risk.color }]}
                      >
                        {risk.risk}
                      </Text>
                    </View>
                  </View>
                ))}
              </EarthyCard>

              {/* ── CROPS ───────────────────────────────────────────────────── */}
              <EarthyCard style={styles.card}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Recommended Crops
                </Text>
                <View style={styles.cropsGrid}>
                  {profile.crops.map((crop, i) => (
                    <View key={i} style={styles.cropChip}>
                      <Ionicons
                        name="leaf"
                        size={11}
                        color={Colors.darkGreen}
                      />
                      <Text style={styles.cropChipText}>{crop}</Text>
                    </View>
                  ))}
                </View>
              </EarthyCard>

              {/* ── TREATMENTS ──────────────────────────────────────────────── */}
              <View style={styles.treatmentsCard}>
                <View style={styles.treatmentsHeader}>
                  <Ionicons
                    name="flask"
                    size={16}
                    color={Colors.accentYellow}
                  />
                  <Text style={styles.treatmentsTitle}>
                    Suggested Treatments
                  </Text>
                </View>
                {profile.treatments.map((t, i) => (
                  <View key={i} style={styles.treatmentRow}>
                    <View style={styles.treatmentNum}>
                      <Text style={styles.treatmentNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.treatmentText}>{t}</Text>
                  </View>
                ))}
              </View>

              {/* ── CTAs ────────────────────────────────────────────────────── */}
              <TouchableOpacity
                style={styles.scanAgainBtn}
                onPress={() => router.replace("/root/tab/scan")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.scanAgainText}>Scan Another Sample</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.homeBtn, { borderColor: themeColors.border }]}
                onPress={() => router.replace("/root/tab/home")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={themeColors.text}
                />
                <Text style={[styles.homeBtnText, { color: themeColors.text }]}>
                  Return to Dashboard
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontWeight: "800", fontSize: 16 },
  headerDate: { fontSize: 11, marginTop: 1 },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 48,
  },

  lowConfBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFB300",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  lowConfText: {
    flex: 1,
    fontSize: 12,
    color: "#E65100",
    lineHeight: 17,
    fontWeight: "500",
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkGreen,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroImageWrapper: {
    width: 92,
    height: 92,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.lightGreen + "60",
  },
  heroImage: { width: "100%", height: "100%" },
  heroImageFallback: {
    backgroundColor: Colors.lightGreen + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
  },
  heroImageOverlayText: {
    color: Colors.accentYellow,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroInfo: { flex: 1, marginLeft: 14 },
  heroClassification: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  heroSoilName: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  confRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  confLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  confValue: { fontSize: 11, fontWeight: "800" },
  confTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  confFill: { height: "100%", borderRadius: 3 },

  card: { borderRadius: 20, padding: 16, marginBottom: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  gaugeRow: { flexDirection: "row", alignItems: "center" },
  gaugeDesc: { flex: 1, marginLeft: 14 },
  gaugeHeadline: { fontSize: 14, fontWeight: "800", marginBottom: 5 },
  gaugeBody: { fontSize: 12, lineHeight: 17 },

  aiCard: {
    backgroundColor: Colors.darkGreen + "0D",
    borderWidth: 1,
    borderColor: Colors.darkGreen + "25",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  aiCardTitle: { fontSize: 14, fontWeight: "800", color: Colors.darkGreen },
  aiCardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.darkGreen,
    fontStyle: "italic",
  },

  phContainer: { marginTop: 4 },
  phTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  phLabel: { fontSize: 10, fontWeight: "700" },
  phTrack: {
    height: 14,
    flexDirection: "row",
    position: "relative",
    borderRadius: 7,
    overflow: "visible",
    marginBottom: 14,
  },
  phSeg: { flex: 1 },
  phPin: {
    position: "absolute",
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -11,
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
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
  },
  phValue: { fontSize: 20, fontWeight: "900", color: Colors.darkGreen },
  phBadge: {
    backgroundColor: Colors.lightGreen + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  phBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.darkGreen,
    letterSpacing: 0.3,
  },

  moistureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moistureLeft: { flexDirection: "row", alignItems: "center" },
  moistureValue: { fontSize: 24, fontWeight: "900" },
  moistureSub: { fontSize: 11 },
  moistureBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  moistureBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  moistureTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  moistureFill: { height: "100%", borderRadius: 4 },

  npkQualRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  npkQualChip: {
    flex: 1,
    backgroundColor: Colors.darkGreen + "0D",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  npkQualKey: { fontSize: 13, fontWeight: "900", color: Colors.darkGreen },
  npkQualVal: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  npkWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 11,
    marginTop: 14,
    gap: 7,
  },
  npkWarningText: { flex: 1, fontSize: 12, color: "#E65100", lineHeight: 17 },

  riskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
  },
  riskLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  riskIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  riskName: { fontSize: 13, fontWeight: "600" },
  riskBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  riskBadgeText: { fontSize: 10, fontWeight: "800" },

  cropsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cropChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkGreen + "0E",
    borderWidth: 1,
    borderColor: Colors.darkGreen + "22",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  cropChipText: { fontSize: 12, fontWeight: "700", color: Colors.darkGreen },

  treatmentsCard: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  treatmentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  treatmentsTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  treatmentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  treatmentNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  treatmentNumText: { fontSize: 10, fontWeight: "900", color: "#1B2E1C" },
  treatmentText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 19,
  },

  scanAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.darkGreen,
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginBottom: 10,
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  scanAgainText: { fontSize: 15, fontWeight: "800", color: Colors.white },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingVertical: 13,
    borderRadius: 16,
    gap: 7,
    marginBottom: 8,
  },
  homeBtnText: { fontSize: 14, fontWeight: "700" },
});
