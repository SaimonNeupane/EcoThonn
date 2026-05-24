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

export default function FertilizerScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  // Dynamic land size state
  const [acreage, setAcreage] = useState(5); // default 5 acres

  // Base dosages per acre
  const organicTreatments = [
    {
      id: "o1",
      name: "Organic Compost",
      baseDose: 2.5,
      unit: "Tons",
      schedule: "Pre-sowing (basal)",
      desc: "Builds humus, raises microbial count, stabilizes pH levels.",
    },
    {
      id: "o2",
      name: "Bone Meal (Phosphorus)",
      baseDose: 150,
      unit: "lbs",
      schedule: "At sowing time",
      desc: "Concentrated natural phosphorus to aid seedling root development.",
    },
    {
      id: "o3",
      name: "Green Manures (Cover Crop)",
      baseDose: 1,
      unit: "planting",
      schedule: "Post-harvest",
      desc: "Grow clover or alfalfa in off-season to trap nitrogen organically.",
    },
  ];

  const chemicalTreatments = [
    {
      id: "c1",
      name: "DAP (Diammonium Phosphate)",
      baseDose: 120,
      unit: "lbs",
      schedule: "At sowing",
      desc: "Fast-acting phosphorus boost to resolve critical deficiency.",
    },
    {
      id: "c2",
      name: "Urea (Nitrogen Source)",
      baseDose: 80,
      unit: "lbs",
      schedule: "Week 3 & Week 6 (splits)",
      desc: "Essential for vegetative green growth and leaf chlorophyll.",
    },
    {
      id: "c3",
      name: "Muriate of Potash (K)",
      baseDose: 40,
      unit: "lbs",
      schedule: "Pre-planting",
      desc: "Ensures crop disease resilience and water retention.",
    },
  ];

  const timelineSteps = [
    {
      week: "Week 1",
      title: "Soil Preparation",
      desc: "Till land and apply Organic Compost and Potash. Let soil settle for 3 days.",
    },
    {
      week: "Week 2",
      title: "Sowing & Basal Feed",
      desc: "Apply DAP / Bone Meal directly in crop furrows during seeding.",
    },
    {
      week: "Week 3",
      title: "First Nitrogen Dressing",
      desc: "Top-dress first split of Urea (40 lbs/acre) after early sprouts break soil.",
    },
    {
      week: "Week 6",
      title: "Second Nitrogen Dressing",
      desc: "Apply final Urea top-dress (40 lbs/acre) before vegetative bloom.",
    },
  ];

  const changeAcreage = (amount: number) => {
    const newAcreage = acreage + amount;
    if (newAcreage >= 1 && newAcreage <= 200) {
      setAcreage(newAcreage);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <ThemeText category="h2">Soil Treatment Plan</ThemeText>
          <ThemeText category="caption">Target: High-Yield Recovery</ThemeText>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Dose Info",
              "Dosages are calculated from average crop depletion and the identified soil deficiency from computer vision.",
            )
          }
        >
          <Ionicons
            name="calculator-outline"
            size={24}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ACREAGE INTERACTIVE CALCULATOR */}
        <EarthyCard style={styles.calculatorCard}>
          <ThemeText
            category="caption"
            style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}
          >
            STEP 1: ENTER YOUR FARM LAND SIZE
          </ThemeText>

          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={() => changeAcreage(-5)}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>-5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeAcreage(-1)}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>-1</Text>
            </TouchableOpacity>

            <View style={styles.acreageDisplay}>
              <Text style={styles.acreageValueText}>{acreage}</Text>
              <Text style={styles.acreageUnitText}>Acres</Text>
            </View>

            <TouchableOpacity
              onPress={() => changeAcreage(1)}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>+1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeAcreage(5)}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>+5</Text>
            </TouchableOpacity>
          </View>

          <ThemeText category="caption" style={styles.calcSub}>
            Dosages below have adjusted automatically for {acreage} acres of
            cropland.
          </ThemeText>
        </EarthyCard>

        {/* DEFICIENCY TARGET BANNER */}
        <View
          style={[styles.targetBanner, { borderColor: themeColors.border }]}
        >
          <Ionicons name="warning-outline" size={18} color="#E65100" />
          <ThemeText category="caption" style={styles.targetBannerText}>
            Targeting deficiencies:{" "}
            <ThemeText category="bodyBold" style={{ color: "#E65100" }}>
              Phosphorus (-18%)
            </ThemeText>{" "}
            and{" "}
            <ThemeText category="bodyBold" style={{ color: "#E65100" }}>
              Nitrogen (-8%)
            </ThemeText>
          </ThemeText>
        </View>

        {/* ORGANIC TREATMENTS SECTION */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          1. Organic Suggestions (Recommended)
        </ThemeText>
        {organicTreatments.map((treatment) => {
          const totalDose = (treatment.baseDose * acreage).toFixed(1);
          return (
            <EarthyCard key={treatment.id} style={styles.doseCard}>
              <View style={styles.doseCardHeader}>
                <View style={styles.doseNameBlock}>
                  <Ionicons
                    name="leaf-outline"
                    size={18}
                    color={Colors.lightGreen}
                  />
                  <ThemeText category="h3" style={styles.treatmentName}>
                    {treatment.name}
                  </ThemeText>
                </View>
                <View style={styles.doseAmountBadge}>
                  <Text style={styles.amountText}>
                    {totalDose} {treatment.unit}
                  </Text>
                </View>
              </View>
              <ThemeText category="caption" style={styles.treatmentDesc}>
                {treatment.desc}
              </ThemeText>
              <View style={styles.scheduleRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={themeColors.subText}
                />
                <ThemeText category="caption" style={{ marginLeft: 4 }}>
                  Schedule: {treatment.schedule}
                </ThemeText>
              </View>
            </EarthyCard>
          );
        })}

        {/* CHEMICAL TREATMENTS SECTION */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          2. Chemical Fertilizers (Fast Recovery)
        </ThemeText>
        {chemicalTreatments.map((treatment) => {
          const totalDose = (treatment.baseDose * acreage).toFixed(0);
          return (
            <EarthyCard key={treatment.id} style={styles.doseCard}>
              <View style={styles.doseCardHeader}>
                <View style={styles.doseNameBlock}>
                  <Ionicons name="flask-outline" size={18} color="#FF7043" />
                  <ThemeText category="h3" style={styles.treatmentName}>
                    {treatment.name}
                  </ThemeText>
                </View>
                <View
                  style={[
                    styles.doseAmountBadge,
                    { backgroundColor: "#FF704320" },
                  ]}
                >
                  <Text style={[styles.amountText, { color: "#FF7043" }]}>
                    {totalDose} {treatment.unit}
                  </Text>
                </View>
              </View>
              <ThemeText category="caption" style={styles.treatmentDesc}>
                {treatment.desc}
              </ThemeText>
              <View style={styles.scheduleRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={themeColors.subText}
                />
                <ThemeText category="caption" style={{ marginLeft: 4 }}>
                  Schedule: {treatment.schedule}
                </ThemeText>
              </View>
            </EarthyCard>
          );
        })}

        {/* TIMELINE & RECOVERY SCHEDULE */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          3. Weekly Treatment Schedule
        </ThemeText>
        <EarthyCard style={styles.timelineCard}>
          {timelineSteps.map((step, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDotCircle}>
                  <View style={styles.timelineDotInner} />
                </View>
                {index < timelineSteps.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              <View style={styles.timelineRight}>
                <View style={styles.timelineHeaderRow}>
                  <ThemeText
                    category="bodyBold"
                    style={{ color: Colors.darkGreen }}
                  >
                    {step.week}
                  </ThemeText>
                  <ThemeText category="h3">{step.title}</ThemeText>
                </View>
                <ThemeText category="caption" style={styles.timelineDescText}>
                  {step.desc}
                </ThemeText>
              </View>
            </View>
          ))}
        </EarthyCard>

        {/* SOIL RECOVERY PLAN METADATA */}
        <EarthyCard style={styles.summaryCard}>
          <ThemeText
            category="h3"
            style={{ color: Colors.white, fontWeight: "800" }}
          >
            Soil Health Projection
          </ThemeText>
          <ThemeText
            category="caption"
            style={{ color: "rgba(255,255,255,0.75)", marginVertical: 6 }}
          >
            Estimated recovery timeline and health improvement forecasts:
          </ThemeText>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>45 Days</Text>
              <Text style={styles.statLabel}>Full Recovery</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>+18%</Text>
              <Text style={styles.statLabel}>Health Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>$40/Acre</Text>
              <Text style={styles.statLabel}>Est. Treatment Cost</Text>
            </View>
          </View>
        </EarthyCard>

        <EarthyButton
          title="Return to Diagnosis"
          variant="outline"
          icon="chevron-back"
          onPress={() => router.back()}
          style={{ marginTop: 12, marginBottom: 20 }}
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  calculatorCard: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
  acreageDisplay: {
    alignItems: "center",
  },
  acreageValueText: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.accentYellow,
  },
  acreageUnitText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
    marginTop: -4,
  },
  calcSub: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  targetBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#FFF3E0",
    marginBottom: 16,
  },
  targetBannerText: {
    marginLeft: 8,
    color: "#E65100",
  },
  sectionTitle: {
    fontWeight: "800",
    marginVertical: 12,
  },
  doseCard: {
    borderRadius: 16,
    padding: 14,
    marginVertical: 4,
  },
  doseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  doseNameBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  treatmentName: {
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },
  doseAmountBadge: {
    backgroundColor: Colors.lightGreen + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  amountText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.darkGreen,
  },
  treatmentDesc: {
    lineHeight: 18,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  timelineCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 70,
  },
  timelineLeft: {
    width: 24,
    alignItems: "center",
  },
  timelineDotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.lightGreen + "30",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.darkGreen,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.lightGray,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineDescText: {
    lineHeight: 16,
  },
  summaryCard: {
    backgroundColor: Colors.brown,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.accentYellow,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.white,
    marginTop: 2,
  },
});
