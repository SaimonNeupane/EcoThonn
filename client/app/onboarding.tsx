import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemeText, EarthyButton, Colors } from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace("/root/tab/home");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Logo Row */}
      <View style={styles.header}>
        <ThemeText category="label" style={styles.logoText}>
          SoilSense AI
        </ThemeText>
      </View>

      {/* Main Core Visual & Intro Block */}
      <View style={styles.content}>
        {/* Premium Diagnostics Visual Graphic */}
        <View style={styles.graphicContainer}>
          <View style={[styles.viewfinder, { borderColor: Colors.lightGreen }]}>
            <View style={styles.soilTextureBlock}>
              <View style={styles.soilLayer1} />
              <View style={styles.soilLayer2} />
              <View
                style={[
                  styles.scannerLine,
                  { backgroundColor: Colors.lightGreen },
                ]}
              />
            </View>
          </View>
          <Ionicons
            name="scan-circle"
            size={44}
            color={Colors.lightGreen}
            style={styles.floatingGraphicIcon}
          />
        </View>

        {/* Text Block */}
        <View style={styles.textBlock}>
          <ThemeText category="h1" style={styles.title}>
            Welcome to SoilSense AI
          </ThemeText>
          <ThemeText category="h3" style={styles.subtitle}>
            AI-Powered Agronomic Diagnostics
          </ThemeText>
          <ThemeText category="body" style={styles.description}>
            Transform your farming decisions instantly. Capture or upload a photo
            of your field soil to analyze pH, moisture, and NPK nutrient profiles,
            and receive dynamic recommendations.
          </ThemeText>
        </View>
      </View>

      {/* Action Footer CTA */}
      <View style={styles.footer}>
        <EarthyButton
          title="Get Started"
          variant="accent"
          onPress={handleGetStarted}
          style={styles.ctaButton}
          icon="arrow-forward"
        />
        <ThemeText category="caption" style={styles.footerVersion}>
          Version 1.0.0 · Production Ready
        </ThemeText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
    minHeight: height - 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  logoText: {
    fontSize: 18,
    color: Colors.darkGreen,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  graphicContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.beige + "40",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 36,
  },
  viewfinder: {
    width: 130,
    height: 130,
    borderRadius: 20,
    borderWidth: 2,
    padding: 6,
    overflow: "hidden",
  },
  soilTextureBlock: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  soilLayer1: {
    flex: 1,
    backgroundColor: Colors.brown,
  },
  soilLayer2: {
    height: 48,
    backgroundColor: "#6D4C41",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  scannerLine: {
    height: 4,
    width: "100%",
    position: "absolute",
    top: "40%",
    opacity: 0.8,
  },
  floatingGraphicIcon: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    color: Colors.darkGreen,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    alignItems: "center",
    width: "100%",
  },
  ctaButton: {
    width: "100%",
  },
  footerVersion: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 16,
    opacity: 0.7,
  },
});
