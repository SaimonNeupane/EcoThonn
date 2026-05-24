import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ThemeText,
  AILoadingAnimation,
  Colors,
  useThemeColors,
} from "../../../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

// const { width, height } = Dimensions.get("window");

export default function ScanScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState("Initializing sensors...");
  const [scanProgress, setScanProgress] = useState(0);

  // Animations
  const laserY = useRef(new Animated.Value(0)).current;
  // const progressAnim = useRef(new Animated.Value(0)).current;

  // Laser Sweep loop animation
  useEffect(() => {
    if (!isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserY, {
            toValue: 240,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(laserY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isScanning, laserY]);

  // AI scanning timeline simulation
  const startSoilScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const steps = [
      { text: "Capturing soil reflectance index...", delay: 0, progress: 20 },
      {
        text: "Analyzing soil coloration spectrum...",
        delay: 800,
        progress: 45,
      },
      { text: "Extracting moisture reflections...", delay: 1600, progress: 70 },
      { text: "Estimating NPK concentrations...", delay: 2400, progress: 90 },
      { text: "Compiling diagnostic model...", delay: 3200, progress: 100 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setScanStepText(step.text);
        setScanProgress(step.progress);

        if (step.progress === 100) {
          setTimeout(() => {
            setIsScanning(false);
            // Navigate to results screen on completion!
            router.push("/result");
          }, 600);
        }
      }, step.delay);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.replace("/root/tab/home")}>
          <Ionicons name="close" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <ThemeText category="h2">Soil Analyzer</ThemeText>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Scan Help",
              "Position the camera directly 1 foot above the soil. Ensure lighting is natural and clear.",
            )
          }
        >
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      {!isScanning ? (
        // 1. ACTIVE VIEWFINDER SIMULATION
        <View style={styles.viewfinderContainer}>
          <ThemeText category="caption" style={styles.guidanceText}>
            Align soil sample within the target boundary
          </ThemeText>

          <View style={styles.scannerViewport}>
            {/* Corner Bracket Overlays */}
            <View
              style={[styles.bracketTL, { borderColor: Colors.lightGreen }]}
            />
            <View
              style={[styles.bracketTR, { borderColor: Colors.lightGreen }]}
            />
            <View
              style={[styles.bracketBL, { borderColor: Colors.lightGreen }]}
            />
            <View
              style={[styles.bracketBR, { borderColor: Colors.lightGreen }]}
            />

            {/* Simulated Soil Background Texture */}
            <View style={styles.mockSoilTexture}>
              <View style={styles.organicPatch1} />
              <View style={styles.organicPatch2} />
              <View style={styles.organicPatch3} />
            </View>

            {/* Target Crosshair */}
            <View style={styles.crosshairContainer}>
              <View
                style={[
                  styles.crosshairLineH,
                  { backgroundColor: "rgba(255,255,255,0.4)" },
                ]}
              />
              <View
                style={[
                  styles.crosshairLineV,
                  { backgroundColor: "rgba(255,255,255,0.4)" },
                ]}
              />
              <View
                style={[styles.centerRing, { borderColor: Colors.lightGreen }]}
              />
            </View>

            {/* Looping Animated Laser Line */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: laserY }] },
              ]}
            />
          </View>

          {/* Action Row */}
          <View style={styles.controlsRow}>
            {/* Gallery Upload Option */}
            <TouchableOpacity
              style={[styles.circleBtn, { backgroundColor: themeColors.card }]}
              onPress={() => {
                Alert.alert(
                  "Upload Photo",
                  "Simulating image upload from gallery.",
                  [
                    { text: "Select Mock Soil", onPress: startSoilScan },
                    { text: "Cancel" },
                  ],
                );
              }}
            >
              <Ionicons name="images" size={22} color={Colors.darkGreen} />
            </TouchableOpacity>

            {/* Main Trigger Button */}
            <TouchableOpacity
              style={styles.mainCaptureBtn}
              onPress={startSoilScan}
              activeOpacity={0.8}
            >
              <View style={styles.captureInnerCircle}>
                <Ionicons name="camera" size={32} color={Colors.darkGreen} />
              </View>
            </TouchableOpacity>

            {/* Flash Simulation */}
            <TouchableOpacity
              style={[styles.circleBtn, { backgroundColor: themeColors.card }]}
              onPress={() => Alert.alert("Flash", "Flash set to Auto.")}
            >
              <Ionicons
                name="flash-outline"
                size={22}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // 2. AI ANALYZING STATE
        <View style={styles.analyzingContainer}>
          <AILoadingAnimation size={80} style={{ marginBottom: 36 }} />

          <ThemeText
            category="h2"
            style={{ color: Colors.darkGreen, fontWeight: "800" }}
          >
            AI Processing Soil
          </ThemeText>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: themeColors.border },
              ]}
            >
              <View
                style={[styles.progressBarFill, { width: `${scanProgress}%` }]}
              />
            </View>
            <ThemeText category="label" style={styles.progressPct}>
              {scanProgress}% Completed
            </ThemeText>
          </View>

          <ThemeText
            category="bodyBold"
            style={[styles.statusText, { color: themeColors.text }]}
          >
            {scanStepText}
          </ThemeText>

          <ThemeText category="caption" style={styles.disclaimer}>
            Computing NPK concentrations using remote neural diagnostics.
          </ThemeText>
        </View>
      )}

      {/* Bottom spacing helper */}
      <View style={styles.footerSpacing} />
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
  viewfinderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  guidanceText: {
    marginVertical: 16,
    fontWeight: "600",
  },
  scannerViewport: {
    width: 260,
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.brown,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  mockSoilTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#6D4C41",
  },
  organicPatch1: {
    position: "absolute",
    width: 140,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#5D4037",
    top: 20,
    left: 10,
    opacity: 0.8,
  },
  organicPatch2: {
    position: "absolute",
    width: 100,
    height: 120,
    borderRadius: 50,
    backgroundColor: "#4E342E",
    bottom: 10,
    right: 20,
    opacity: 0.7,
  },
  organicPatch3: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8D6E63",
    top: 120,
    left: 100,
    opacity: 0.5,
  },
  // Futuristic Target corner brackets
  bracketTL: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    zIndex: 5,
  },
  bracketTR: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRightWidth: 3,
    borderTopWidth: 3,
    zIndex: 5,
  },
  bracketBL: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 28,
    height: 28,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    zIndex: 5,
  },
  bracketBR: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    zIndex: 5,
  },
  // Crosshair
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  crosshairLineH: {
    width: 80,
    height: 1,
  },
  crosshairLineV: {
    width: 1,
    height: 80,
    position: "absolute",
  },
  centerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    position: "absolute",
  },
  laserLine: {
    position: "absolute",
    width: "100%",
    height: 3,
    backgroundColor: Colors.lightGreen,
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
    top: 10,
    zIndex: 4,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 40,
  },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainCaptureBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.lightGreen + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  // AI Analyzing screen styles
  analyzingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 24,
  },
  progressBarBg: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.darkGreen,
    borderRadius: 5,
  },
  progressPct: {
    marginTop: 8,
    fontWeight: "700",
  },
  statusText: {
    textAlign: "center",
    fontSize: 15,
    height: 48,
    maxWidth: 260,
  },
  disclaimer: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 11,
    marginTop: 20,
  },
  footerSpacing: {
    height: 60,
  },
});
