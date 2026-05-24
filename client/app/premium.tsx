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

interface Message {
  sender: "user" | "ai";
  text: string;
}

export default function PremiumScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );

  // AI Chat Simulation states
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I am your SoilSense AI Agronomist. Ask me anything about crop diseases, fertilizers, or water planning.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const simulateChat = (question: string) => {
    // 1. Add user message
    const userMsg: Message = { sender: "user", text: question };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Generate response after timeout
    let answerText = "";
    if (question.includes("yellowing")) {
      answerText =
        "Yellowing leaves (chlorosis) in soybeans often suggest Nitrogen deficiency or iron chlorosis in high pH soils. Based on your North Field scan (pH 6.5), it is likely a Nitrogen gap. I recommend a foliar urea spray.";
    } else if (question.includes("pH")) {
      answerText =
        "To lower soil pH from 7.8 to an optimal 6.5, you can apply elemental sulfur (approx. 10 lbs per 1000 sq ft for sandy loam) or organic compost mulch. Avoid ammonium fertilizers in dry periods.";
    } else {
      answerText =
        "Maintaining a balanced cover crop schedule like clover will naturally stabilize soil nutrients. Regular soil checks every 14 days are advised.";
    }

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { sender: "ai", text: answerText }]);
    }, 1200);
  };

  const handleCheckout = () => {
    Alert.alert(
      "Subscribe",
      `Simulating premium purchase for the ${billingCycle === "yearly" ? "Annual Harvest ($79.99/yr)" : "Monthly Growth ($9.99/mo)"} plan.`,
      [
        {
          text: "Confirm Payment",
          onPress: () =>
            Alert.alert("Success", "Welcome to SoilSense Premium AI!"),
        },
        { text: "Cancel" },
      ],
    );
  };

  // Custom visual representation of Satellite NDVI (heat map)
  const renderNdviMap = () => {
    return (
      <View style={styles.ndviMapContainer}>
        {/* Heatmap grid mockup */}
        <View style={styles.ndviGrid}>
          <View style={[styles.ndviCell, { backgroundColor: "#388E3C" }]}>
            <Text style={styles.ndviLabel}>+0.8</Text>
          </View>
          <View style={[styles.ndviCell, { backgroundColor: "#4CAF50" }]}>
            <Text style={styles.ndviLabel}>+0.7</Text>
          </View>
          <View style={[styles.ndviCell, { backgroundColor: "#8BC34A" }]}>
            <Text style={styles.ndviLabel}>+0.5</Text>
          </View>

          <View style={[styles.ndviCell, { backgroundColor: "#4CAF50" }]}>
            <Text style={styles.ndviLabel}>+0.7</Text>
          </View>
          <View style={[styles.ndviCell, { backgroundColor: "#CDDC39" }]}>
            <Text style={styles.ndviLabel}>+0.3</Text>
          </View>
          <View style={[styles.ndviCell, { backgroundColor: "#FFEB3B" }]}>
            <Text style={styles.ndviLabel}>+0.2</Text>
          </View>

          <View style={[styles.ndviCell, { backgroundColor: "#CDDC39" }]}>
            <Text style={styles.ndviLabel}>+0.4</Text>
          </View>
          <View style={[styles.ndviCell, { backgroundColor: "#FFC107" }]}>
            <Text style={styles.ndviLabel}>+0.1</Text>
          </View>
          <View style={[styles.ndviCell, { backgroundColor: "#FF5722" }]}>
            <Text style={styles.ndviLabel}>-0.1</Text>
          </View>
        </View>

        {/* Legend bar */}
        <View style={styles.ndviScale}>
          <View style={[styles.scaleColor, { backgroundColor: "#FF5722" }]} />
          <View style={[styles.scaleColor, { backgroundColor: "#FFC107" }]} />
          <View style={[styles.scaleColor, { backgroundColor: "#CDDC39" }]} />
          <View style={[styles.scaleColor, { backgroundColor: "#8BC34A" }]} />
          <View style={[styles.scaleColor, { backgroundColor: "#388E3C" }]} />
        </View>
        <View style={styles.scaleLabelsRow}>
          <ThemeText category="caption">Stressed (-0.1)</ThemeText>
          <ThemeText category="caption">Optimal (+0.9)</ThemeText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <ThemeText category="h2">Premium AI Portal</ThemeText>
        <Ionicons name="sparkles" size={22} color={Colors.accentYellow} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SATELLITE MONITORING WORKCASE */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          🛰️ NDVI Satellite Live Mock
        </ThemeText>
        <EarthyCard style={styles.ndviCard}>
          <View style={styles.ndviHeaderRow}>
            <View>
              <ThemeText category="h3" style={{ color: Colors.white }}>
                Sector Canopy Density
              </ThemeText>
              <ThemeText
                category="caption"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                NDVI Index Telemetry
              </ThemeText>
            </View>
            <View style={styles.satelliteLiveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveText}>LIVE SATELLITE</Text>
            </View>
          </View>

          {renderNdviMap()}

          <ThemeText category="caption" style={styles.ndviCardDesc}>
            NDVI analysis shows high stress (red zones) in Sector C (Orchard
            Hill), likely due to heavy soil acidity. Sector A (North Field)
            remains optimal (dark green).
          </ThemeText>
        </EarthyCard>

        {/* AI FARMING ASSISTANT CHAT */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          💬 Chat with AI Agronomist
        </ThemeText>
        <EarthyCard style={styles.chatCard}>
          {/* Chat feed */}
          <View style={styles.chatFeed}>
            {chatMessages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.chatBubble,
                  msg.sender === "user" ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                <Text
                  style={[
                    styles.chatBubbleText,
                    msg.sender === "user"
                      ? { color: Colors.white }
                      : { color: themeColors.text },
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}

            {isTyping && (
              <View
                style={[styles.chatBubble, styles.bubbleAi, { opacity: 0.7 }]}
              >
                <Text style={{ fontStyle: "italic" }}>
                  AI is diagnosing soil conditions...
                </Text>
              </View>
            )}
          </View>

          {/* Quick Question Steppers */}
          <ThemeText category="caption" style={styles.suggestedQTitle}>
            Suggested Questions:
          </ThemeText>
          <View style={styles.shortcutsRow}>
            <TouchableOpacity
              style={[
                styles.suggestedQBtn,
                { backgroundColor: themeColors.isDark ? "#283C2F" : "#E8F5E9" },
              ]}
              onPress={() =>
                simulateChat("Why are my soybean leaves yellowing?")
              }
            >
              <Text style={styles.suggestedQText}>
                Why are leaves yellowing?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.suggestedQBtn,
                { backgroundColor: themeColors.isDark ? "#283C2F" : "#E8F5E9" },
              ]}
              onPress={() => simulateChat("How do I lower soil pH?")}
            >
              <Text style={styles.suggestedQText}>How do I lower pH?</Text>
            </TouchableOpacity>
          </View>
        </EarthyCard>

        {/* COMPARISON MATRIX FREE VS PREMIUM */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Feature Matrix
        </ThemeText>
        <EarthyCard style={styles.matrixCard}>
          <View style={styles.matrixRowHeader}>
            <ThemeText category="caption" style={styles.colLabel}>
              Features
            </ThemeText>
            <ThemeText
              category="caption"
              style={[styles.colLabel, { textAlign: "center" }]}
            >
              Free
            </ThemeText>
            <ThemeText
              category="caption"
              style={[
                styles.colLabel,
                { textAlign: "right", color: Colors.darkGreen },
              ]}
            >
              Premium
            </ThemeText>
          </View>

          <View style={styles.matrixRow}>
            <ThemeText category="bodyBold" style={styles.featureCell}>
              Soil Scan Scans
            </ThemeText>
            <ThemeText category="caption" style={styles.freeCell}>
              3 scans/mo
            </ThemeText>
            <ThemeText
              category="bodyBold"
              style={[styles.premiumCell, { color: Colors.darkGreen }]}
            >
              Unlimited
            </ThemeText>
          </View>

          <View style={styles.matrixRowDivider} />

          <View style={styles.matrixRow}>
            <ThemeText category="bodyBold" style={styles.featureCell}>
              Satellite NDVI
            </ThemeText>
            <ThemeText category="caption" style={styles.freeCell}>
              Not Included
            </ThemeText>
            <ThemeText
              category="bodyBold"
              style={[styles.premiumCell, { color: Colors.darkGreen }]}
            >
              Daily scans
            </ThemeText>
          </View>

          <View style={styles.matrixRowDivider} />

          <View style={styles.matrixRow}>
            <ThemeText category="bodyBold" style={styles.featureCell}>
              AI Support Chat
            </ThemeText>
            <ThemeText category="caption" style={styles.freeCell}>
              5 prompts/mo
            </ThemeText>
            <ThemeText
              category="bodyBold"
              style={[styles.premiumCell, { color: Colors.darkGreen }]}
            >
              24/7 Unlimited
            </ThemeText>
          </View>

          <View style={styles.matrixRowDivider} />

          <View style={styles.matrixRow}>
            <ThemeText category="bodyBold" style={styles.featureCell}>
              Treatment Timelines
            </ThemeText>
            <ThemeText category="caption" style={styles.freeCell}>
              Basic
            </ThemeText>
            <ThemeText
              category="bodyBold"
              style={[styles.premiumCell, { color: Colors.darkGreen }]}
            >
              Custom Adaptive
            </ThemeText>
          </View>
        </EarthyCard>

        {/* PRICING PLANS */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Subscribe Packages
        </ThemeText>

        {/* Cycle Toggle Button */}
        <View style={styles.billingToggleRow}>
          <TouchableOpacity
            style={[
              styles.cycleBtn,
              billingCycle === "monthly" && styles.cycleBtnActive,
            ]}
            onPress={() => setBillingCycle("monthly")}
          >
            <Text
              style={[
                styles.cycleText,
                billingCycle === "monthly" && { color: Colors.white },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cycleBtn,
              billingCycle === "yearly" && styles.cycleBtnActive,
            ]}
            onPress={() => setBillingCycle("yearly")}
          >
            <Text
              style={[
                styles.cycleText,
                billingCycle === "yearly" && { color: Colors.white },
              ]}
            >
              Yearly (Save 33%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Tier Card */}
        <EarthyCard style={styles.tierSelectCard}>
          <View style={styles.tierHeader}>
            <View>
              <ThemeText
                category="h2"
                style={{ color: Colors.darkGreen, fontSize: 22 }}
              >
                {billingCycle === "yearly"
                  ? "Annual Harvest Plan"
                  : "Monthly Growth Plan"}
              </ThemeText>
              <ThemeText category="caption">All features unlocked</ThemeText>
            </View>
            <Text style={styles.tierPrice}>
              {billingCycle === "yearly" ? "$79.99/yr" : "$9.99/mo"}
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.tierBullet}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.lightGreen}
              />
              <ThemeText category="body" style={styles.bulletText}>
                NDVI Multi-spectral Crop Canopy mapping
              </ThemeText>
            </View>
            <View style={styles.tierBullet}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.lightGreen}
              />
              <ThemeText category="body" style={styles.bulletText}>
                Unlimited soil diagnostics and database scans
              </ThemeText>
            </View>
            <View style={styles.tierBullet}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.lightGreen}
              />
              <ThemeText category="body" style={styles.bulletText}>
                24/7 AI agronomist bot and smart alerts
              </ThemeText>
            </View>
          </View>

          <EarthyButton
            title="Activate Premium License"
            variant="accent"
            onPress={handleCheckout}
            style={{ marginTop: 20 }}
            icon="card-outline"
          />
          <ThemeText category="caption" style={styles.checkoutSub}>
            Secure checkouts • Cancel anytime.
          </ThemeText>
        </EarthyCard>

        <EarthyButton
          title="Back to Dashboard"
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: "800",
    marginVertical: 12,
  },
  ndviCard: {
    backgroundColor: Colors.brown,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  ndviHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  satelliteLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5722",
    marginRight: 6,
  },
  liveText: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.white,
  },
  ndviMapContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  ndviGrid: {
    width: "100%",
    height: 150,
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 12,
    overflow: "hidden",
  },
  ndviCell: {
    width: "33.33%",
    height: "33.33%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  ndviLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.white,
  },
  ndviScale: {
    height: 8,
    width: "100%",
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 12,
  },
  scaleColor: {
    flex: 1,
  },
  scaleLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 4,
  },
  ndviCardDesc: {
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 16,
    marginTop: 12,
  },
  chatCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  chatFeed: {
    minHeight: 180,
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 4,
    maxWidth: "85%",
  },
  bubbleUser: {
    backgroundColor: Colors.darkGreen,
    alignSelf: "flex-end",
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: Colors.lightGray,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 2,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestedQTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  shortcutsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suggestedQBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestedQText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.darkGreen,
  },
  matrixCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  matrixRowHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 6,
    marginBottom: 8,
  },
  colLabel: {
    flex: 1,
    fontWeight: "700",
  },
  matrixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  matrixRowDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  featureCell: {
    flex: 1,
    fontSize: 13,
  },
  freeCell: {
    flex: 1,
    textAlign: "center",
  },
  premiumCell: {
    flex: 1,
    textAlign: "right",
  },
  billingToggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  cycleBtnActive: {
    backgroundColor: Colors.darkGreen,
  },
  cycleText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  tierSelectCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.darkGreen,
    marginBottom: 16,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.darkGreen,
  },
  bulletList: {
    marginVertical: 10,
  },
  tierBullet: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  bulletText: {
    marginLeft: 8,
    fontSize: 13,
  },
  checkoutSub: {
    textAlign: "center",
    marginTop: 10,
  },
});
