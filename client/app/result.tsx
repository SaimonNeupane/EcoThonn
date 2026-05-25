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
import type { RagData, RiskFactor } from "../hooks/useInfer";

const { width } = Dimensions.get("window");

// ─── NPK text → bar value ─────────────────────────────────────────────────────
function npkTextToValue(text: string): number {
  const t = (text ?? "").toLowerCase();
  if (t.includes("very low")) return 18;
  if (t.includes("low")) return 35;
  if (t.includes("medium") || t.includes("moderate")) return 58;
  if (t.includes("high")) return 80;
  if (t.includes("adequate") || t.includes("normal")) return 65;
  return 45;
}

// ─── Risk factor colour map ───────────────────────────────────────────────────
function riskColor(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "#EF5350";
    case "medium":
      return Colors.accentYellow;
    case "low":
      return Colors.lightGreen;
    case "none detected":
      return Colors.lightGreen;
    default:
      return Colors.lightGreen;
  }
}

function riskIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes("water") || n.includes("log")) return "water-outline";
  if (n.includes("fungal") || n.includes("pathogen") || n.includes("disease"))
    return "bug-outline";
  if (n.includes("salinity") || n.includes("salt"))
    return "shield-checkmark-outline";
  if (n.includes("erosion") || n.includes("slope"))
    return "alert-circle-outline";
  if (n.includes("nematode")) return "bug-outline";
  if (n.includes("toxicity") || n.includes("iron"))
    return "alert-circle-outline";
  if (n.includes("leach")) return "alert-circle-outline";
  if (n.includes("compaction")) return "alert-circle-outline";
  if (n.includes("deficiency") || n.includes("nutrient"))
    return "alert-circle-outline";
  if (n.includes("wind")) return "alert-circle-outline";
  if (n.includes("drought") || n.includes("dry")) return "alert-circle-outline";
  if (n.includes("crack") || n.includes("shrink"))
    return "alert-circle-outline";
  return "warning-outline";
}

// ─── RAG field-advice renderer ────────────────────────────────────────────────

// ─── Param types ──────────────────────────────────────────────────────────────
function parseRagSections(raw: string): { heading: string; body: string }[] {
  if (!raw || typeof raw !== "string") return [];
  const parts = raw.split(/\*\*([^*]+?)\*\*:?\s*/);
  if (parts.length <= 1) return [{ heading: "", body: raw.trim() }];
  const sections: { heading: string; body: string }[] = [];
  if (parts[0].trim()) sections.push({ heading: "", body: parts[0].trim() });
  for (let i = 1; i < parts.length - 1; i += 2) {
    const heading = parts[i].trim();
    const body = (parts[i + 1] ?? "").trim();
    if (heading || body) sections.push({ heading, body });
  }
  return sections;
}
type ResultParams = {
  scanId?: string;
  prediction?: string;
  confidence?: string;
  imageUri?: string;
  lowConfidence?: string;
  props?: string;
  ragData?: string;
};
// ─── Skeleton placeholder (while DB scan loads) ───────────────────────────────
function SkeletonBlock({ h, mb = 14 }: { h: number; mb?: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        height: h,
        borderRadius: 14,
        backgroundColor: "#e0e0e0",
        marginBottom: mb,
        opacity: anim,
      }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResultScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const params = useLocalSearchParams<ResultParams>();

  const [scanData, setScanData] = useState<SoilScan | null>(null);
  const [loading, setLoading] = useState(!!params.scanId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // ── Fetch from DB if scanId present ──────────────────────────────────────
  useEffect(() => {
    if (!params.scanId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getScanById(params.scanId!);
        if (data) {
          setScanData(data);
        } else {
          console.warn("Failed to find scan by ID in local DB:", params.scanId);
          if (!params.prediction && !params.ragData) {
            Alert.alert("Error", "Failed to load scan data");
          }
        }
      } catch (err) {
        console.error("Error fetching scan by ID:", err);
        if (!params.prediction && !params.ragData) {
          Alert.alert("Error", "Failed to load scan data");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [params.scanId]);

  useEffect(() => {
    // Run the entrance animation whenever the loading state resolves to false.
    // This is critical when scanId is present (loading starts as true) —
    // if we only ran on mount, the animation would complete while the skeleton
    // is shown, leaving the Animated.View invisible when it finally mounts.
    if (!loading) {
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // ── Parse rag_data from URL param (set by scan.tsx after inference) ───────
  const ragData: RagData | null = (() => {
    // Priority 1: DB/Local recommendations → Check for full rag_data first
    if (scanData) {
      if (scanData.rag_data) {
        return scanData.rag_data as RagData;
      }
      return {
        health_score: scanData.quality_score ?? 50,
        ph_value: 6.5,
        ph_label: "Neutral",
        ph_status: "SEE NPK VALUES",
        moisture_pct: 40,
        moisture_label: "UNKNOWN",
        classification: "See scan details",
        ai_summary: scanData.recommendations?.join(" ") ?? "",
        crops: [],
        treatments: [],
        npk_warning: null,
        risk_factors: [],
        field_advice: scanData.recommendations?.join("\n\n") ?? "",
      } as RagData;
    }
    // Priority 2: URI-encoded JSON or direct object from scan.tsx navigation params
    if (params.ragData) {
      try {
        if (typeof params.ragData === "object") {
          return params.ragData as unknown as RagData;
        }
        return JSON.parse(decodeURIComponent(params.ragData)) as RagData;
      } catch {
        try {
          return JSON.parse(params.ragData as string) as RagData;
        } catch (e) {
          console.warn("Failed to parse ragData parameter:", e);
          return null;
        }
      }
    }
    return null;
  })();

  // ── Derived display values ─────────────────────────────────────────────────
  const prediction = normalizeSoilType(
    scanData?.soil_type ?? params.prediction ?? "Unknown Soil",
  );
  const confidence = scanData
    ? (scanData.confidence_score ?? 0)
    : typeof params.confidence === "number"
      ? params.confidence
      : parseFloat(params.confidence ?? "0");
  const imageUri =
    scanData?.image_uri ?? scanData?.image_url ?? params.imageUri ?? null;
  const isLowConfidence = params.lowConfidence === "true" || confidence < 45;

  // ── Parse backend NPK props ────────────────────────────────────────────────
  let backendProps: Record<string, string> | null = null;
  if (scanData?.npk_values) {
    backendProps = {
      Nitrogen_N: scanData.npk_values.nitrogen || "Medium",
      Phosphorus_P: scanData.npk_values.phosphorus || "Medium",
      Potassium_K: scanData.npk_values.potassium || "Medium",
    };
  } else if (params.props) {
    try {
      if (typeof params.props === "object") {
        backendProps = params.props as unknown as Record<string, string>;
      } else {
        backendProps = JSON.parse(decodeURIComponent(params.props));
      }
    } catch {
      try {
        backendProps = JSON.parse(params.props as string);
      } catch (e) {
        console.warn("Failed to parse NPK props parameter:", e);
        backendProps = null;
      }
    }
  }

  // ── RAG-driven display values (with sensible fallbacks) ───────────────────
  const healthScore = ragData?.health_score ?? 50;
  const phValue = ragData?.ph_value ?? 6.5;
  const phLabel = ragData?.ph_label ?? "—";
  const phStatus = ragData?.ph_status ?? "UNKNOWN";
  const moisturePct = ragData?.moisture_pct ?? 40;
  const moistureLabel = ragData?.moisture_label ?? "UNKNOWN";
  const classification = ragData?.classification ?? "";
  const aiSummary = ragData?.ai_summary ?? "";
  const crops = ragData?.crops ?? [];
  const treatments = ragData?.treatments ?? [];
  const npkWarning = ragData?.npk_warning ?? null;
  const riskFactors = ragData?.risk_factors ?? [];
  const fieldAdvice =
    typeof ragData?.field_advice === "string" ? ragData.field_advice : "";
  const ragSections = fieldAdvice ? parseRagSections(fieldAdvice) : null;

  // ── NPK bar values ─────────────────────────────────────────────────────────
  const npkN = backendProps?.Nitrogen_N
    ? npkTextToValue(backendProps.Nitrogen_N)
    : 45;
  const npkP = backendProps?.Phosphorus_P
    ? npkTextToValue(backendProps.Phosphorus_P)
    : 38;
  const npkK = backendProps?.Potassium_K
    ? npkTextToValue(backendProps.Potassium_K)
    : 62;

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `SoilSense AI Report\n` +
          `Soil Type: ${prediction}\n` +
          `Health Score: ${healthScore}%\n` +
          `AI Confidence: ${confidence.toFixed(1)}%\n` +
          `Classification: ${classification}\n` +
          (crops.length
            ? `Recommended crops: ${crops.slice(0, 3).join(", ")}`
            : "") +
          (fieldAdvice
            ? `\n\nField Advice:\n${fieldAdvice.slice(0, 300)}…`
            : ""),
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };



  // ── pH bar ─────────────────────────────────────────────────────────────────
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
          {[
            "#FFCDD2",
            "#FFE0B2",
            "#FFF9C4",
            "#C8E6C9",
            "#B2DFDB",
            "#B3E5FC",
          ].map((bg, i, arr) => (
            <View
              key={i}
              style={[
                styles.phSeg,
                { backgroundColor: bg },
                i === 0 && {
                  borderTopLeftRadius: 8,
                  borderBottomLeftRadius: 8,
                },
                i === arr.length - 1 && {
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                },
              ]}
            />
          ))}
          <View style={[styles.phPin, { left: `${positionPct}%` as any }]}>
            <View style={styles.phPinInner} />
          </View>
        </View>
        <View style={styles.phSummaryRow}>
          <Text style={styles.phValue}>pH {val}</Text>
          <View style={styles.phBadge}>
            <Text style={styles.phBadgeText}>{phStatus}</Text>
          </View>
        </View>
      </View>
    );
  };

  const confColor =
    confidence >= 70
      ? Colors.lightGreen
      : confidence >= 45
        ? Colors.accentYellow
        : "#EF5350";

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
        <View
          style={[styles.header, { borderBottomColor: themeColors.border }]}
        >
          <View style={styles.headerBtn} />
          <View style={styles.headerCenter}>
            <ThemeText category="h2" style={styles.headerTitle}>
              Soil Report
            </ThemeText>
          </View>
          <View style={styles.headerBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SkeletonBlock h={110} />
          <SkeletonBlock h={160} />
          <SkeletonBlock h={100} />
          <SkeletonBlock h={130} />
          <SkeletonBlock h={90} />
        </ScrollView>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
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
            {new Date(scanData?.created_at || Date.now()).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            )}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── LOW CONFIDENCE BANNER ────────────────────────────────── */}
          {isLowConfidence && (
            <View style={styles.lowConfBanner}>
              <Ionicons name="warning-outline" size={16} color="#F57F17" />
              <Text style={styles.lowConfText}>
                Low confidence ({confidence.toFixed(0)}%) — results are
                indicative. Try a clearer photo in better lighting.
              </Text>
            </View>
          )}

          {/* ── NO RAG DATA BANNER ───────────────────────────────────── */}
          {!ragData && (
            <View style={styles.noRagBanner}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#1565C0"
              />
              <Text style={styles.noRagText}>
                AI field analysis unavailable for this scan. Rescan for full
                recommendations.
              </Text>
            </View>
          )}

          {/* ── HERO CARD ────────────────────────────────────────────── */}
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
                  <Ionicons name="leaf" size={36} color={Colors.lightGreen} />
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
              {scanData?.field_name || classification ? (
                <Text
                  style={[
                    styles.heroClassification,
                    { color: "rgba(255,255,255,0.65)" },
                  ]}
                >
                  {scanData?.field_name
                    ? `${scanData.field_name}${classification ? ` • ${classification}` : ""}`
                    : classification}
                </Text>
              ) : null}
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

          {/* ── HEALTH SCORE ─────────────────────────────────────────── */}
          <EarthyCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Soil Health Score
            </Text>
            <View style={styles.gaugeRow}>
              <HealthScoreGauge
                score={healthScore}
                size={120}
                strokeWidth={9}
              />
              <View style={styles.gaugeDesc}>
                <Text
                  style={[styles.gaugeHeadline, { color: themeColors.text }]}
                >
                  {healthScore >= 75
                    ? "Excellent Condition"
                    : healthScore >= 55
                      ? "Moderate Fertility"
                      : "Needs Amendment"}
                </Text>
                {aiSummary ? (
                  <Text
                    style={[styles.gaugeBody, { color: themeColors.subText }]}
                  >
                    {aiSummary.slice(0, 120)}…
                  </Text>
                ) : null}
              </View>
            </View>
          </EarthyCard>

          {/* ── AI SUMMARY ───────────────────────────────────────────── */}
          {aiSummary ? (
            <View style={styles.aiCard}>
              <View style={styles.aiCardHeader}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={Colors.accentYellow}
                />
                <Text style={styles.aiCardTitle}>SoilSense AI Analysis</Text>
              </View>
              <Text style={styles.aiCardBody}>{aiSummary}</Text>
            </View>
          ) : null}

          {/* ── RAG FIELD ADVICE ─────────────────────────────────────── */}
          {ragSections && ragSections.length > 0 && (
            <View style={styles.ragCard}>
              <View style={styles.ragCardHeader}>
                <View style={styles.ragIconBadge}>
                  <Ionicons name="cloud" size={13} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ragCardTitle}>
                    Live Field Recommendations
                  </Text>
                  <Text style={styles.ragCardSubtitle}>
                    Generated from your soil type + current weather context
                  </Text>
                </View>
              </View>

              <View style={styles.ragDivider} />

              {ragSections.map((section, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.ragSection,
                    idx < ragSections.length - 1 && styles.ragSectionBorder,
                  ]}
                >
                  {section.heading ? (
                    <View style={styles.ragSectionHeadingRow}>
                      <View style={styles.ragSectionDot} />
                      <Text style={styles.ragSectionHeading}>
                        {section.heading}
                      </Text>
                    </View>
                  ) : null}
                  {section.body ? (
                    <Text
                      style={[
                        styles.ragSectionBody,
                        !section.heading && styles.ragSectionBodyOnly,
                      ]}
                    >
                      {section.body}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* ── pH ───────────────────────────────────────────────────── */}
          <EarthyCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Acidity Level (pH)
            </Text>
            {renderPhSlider(phValue)}
            {phLabel ? (
              <Text
                style={[styles.phLabelCaption, { color: themeColors.subText }]}
              >
                {phLabel}
              </Text>
            ) : null}
          </EarthyCard>

          {/* ── MOISTURE ─────────────────────────────────────────────── */}
          <EarthyCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Moisture Content
            </Text>
            <View style={styles.moistureRow}>
              <View style={styles.moistureLeft}>
                <Ionicons name="water" size={30} color="#42A5F5" />
                <View style={{ marginLeft: 10 }}>
                  <Text
                    style={[styles.moistureValue, { color: themeColors.text }]}
                  >
                    {moisturePct}%
                  </Text>
                  <Text
                    style={[styles.moistureSub, { color: themeColors.subText }]}
                  >
                    Estimated
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.moistureBadge,
                  {
                    backgroundColor:
                      moisturePct >= 45
                        ? Colors.lightGreen + "20"
                        : moisturePct >= 25
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
                        moisturePct >= 45
                          ? Colors.darkGreen
                          : moisturePct >= 25
                            ? "#E65100"
                            : "#C62828",
                    },
                  ]}
                >
                  {moistureLabel}
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
                    width: `${moisturePct}%` as any,
                    backgroundColor:
                      moisturePct >= 45
                        ? Colors.lightGreen
                        : moisturePct >= 25
                          ? Colors.accentYellow
                          : "#EF5350",
                  },
                ]}
              />
            </View>
          </EarthyCard>

          {/* ── NPK ──────────────────────────────────────────────────── */}
          <EarthyCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Nutrient Levels (NPK)
            </Text>
            {backendProps && (
              <View style={styles.npkQualRow}>
                {[
                  { key: "N", val: backendProps.Nitrogen_N },
                  { key: "P", val: backendProps.Phosphorus_P },
                  { key: "K", val: backendProps.Potassium_K },
                ].map(({ key, val }) => (
                  <View key={key} style={styles.npkQualChip}>
                    <Text style={styles.npkQualKey}>{key}</Text>
                    <Text
                      style={[
                        styles.npkQualVal,
                        { color: themeColors.subText },
                      ]}
                    >
                      {val ?? "—"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <NPKChart n={npkN} p={npkP} k={npkK} />
            {npkWarning && (
              <View style={styles.npkWarning}>
                <Ionicons
                  name="warning-outline"
                  size={15}
                  color="#E65100"
                  style={{ marginTop: 1 }}
                />
                <Text style={styles.npkWarningText}>{npkWarning}</Text>
              </View>
            )}
          </EarthyCard>

          {/* ── DISEASE RISKS ────────────────────────────────────────── */}
          {riskFactors.length > 0 && (
            <EarthyCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Pathogen & Disease Risk
              </Text>
              {riskFactors.map((risk: RiskFactor, i: number) => {
                const color = riskColor(risk.risk);
                return (
                  <View
                    key={i}
                    style={[
                      styles.riskRow,
                      i < riskFactors.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: themeColors.border,
                      },
                    ]}
                  >
                    <View style={styles.riskLeft}>
                      <View
                        style={[
                          styles.riskIconBox,
                          { backgroundColor: color + "18" },
                        ]}
                      >
                        <Ionicons
                          name={riskIcon(risk.name)}
                          size={16}
                          color={color}
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
                        { backgroundColor: color + "20" },
                      ]}
                    >
                      <Text style={[styles.riskBadgeText, { color }]}>
                        {risk.risk}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </EarthyCard>
          )}

          {/* ── CROPS ────────────────────────────────────────────────── */}
          {crops.length > 0 && (
            <EarthyCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Recommended Crops
              </Text>
              <View style={styles.cropsGrid}>
                {crops.map((crop: string, i: number) => (
                  <View key={i} style={styles.cropChip}>
                    <Ionicons name="leaf" size={11} color={Colors.darkGreen} />
                    <Text style={styles.cropChipText}>{crop}</Text>
                  </View>
                ))}
              </View>
            </EarthyCard>
          )}

          {/* ── TREATMENTS ───────────────────────────────────────────── */}
          {treatments.length > 0 && (
            <View style={styles.treatmentsCard}>
              <View style={styles.treatmentsHeader}>
                <Ionicons name="flask" size={16} color={Colors.accentYellow} />
                <Text style={styles.treatmentsTitle}>Suggested Treatments</Text>
              </View>
              {treatments.map((t: string, i: number) => (
                <View key={i} style={styles.treatmentRow}>
                  <View style={styles.treatmentNum}>
                    <Text style={styles.treatmentNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.treatmentText}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── FARMER NOTES ─────────────────────────────────────────── */}
          {scanData?.notes && (
            <EarthyCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Farmer Notes
              </Text>
              <Text
                style={{
                  color: themeColors.text,
                  fontSize: 13,
                  lineHeight: 18,
                  fontStyle: "italic",
                }}
              >
                {"\""}{scanData.notes}{"\""}
              </Text>
            </EarthyCard>
          )}

          {/* ── CTAs ─────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={() => router.replace("/root/tab/scan")}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={18} color={Colors.white} />
            <Text style={styles.scanAgainText}>Scan Another Sample</Text>
          </TouchableOpacity>



          <TouchableOpacity
            style={[styles.homeBtn, { borderColor: themeColors.border }]}
            onPress={() => router.replace("/root/tab/home")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={16} color={themeColors.text} />
            <Text style={[styles.homeBtnText, { color: themeColors.text }]}>
              Return to Dashboard
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

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

  scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 48 },

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

  noRagBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#90CAF9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  noRagText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
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
  confTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
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

  ragCard: {
    backgroundColor: "#0D1F0E",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.lightGreen + "30",
  },
  ragCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  ragIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.lightGreen,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  ragCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -0.2,
  },
  ragCardSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  ragDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.lightGreen + "30",
    marginBottom: 12,
  },
  ragSection: { paddingVertical: 10 },
  ragSectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGreen + "20",
  },
  ragSectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },
  ragSectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentYellow,
    flexShrink: 0,
  },
  ragSectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.accentYellow,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  ragSectionBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.82)",
    paddingLeft: 13,
  },
  ragSectionBodyOnly: {
    paddingLeft: 0,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.75)",
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
  phLabelCaption: { fontSize: 11, marginTop: 6, textAlign: "center" },

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

  npkQualRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
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
  downloadReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightGreen,
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginBottom: 10,
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  downloadReportText: { fontSize: 15, fontWeight: "800", color: Colors.white },
});
