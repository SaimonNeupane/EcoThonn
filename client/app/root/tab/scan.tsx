import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  StatusBar,
  Image,
  Dimensions,

  Text
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import {
  ThemeText,
  AILoadingAnimation,
  Colors,
  useThemeColors,
} from "../../../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const BACKEND_URL = "http://192.168.76.201:8000/infer";

type FlashState = "off" | "on" | "auto";

const FLASH_ICONS: Record<FlashState, keyof typeof Ionicons.glyphMap> = {
  off: "flash-off-outline",
  on: "flash",
  auto: "flash-outline",
};
const FLASH_LABELS: Record<FlashState, string> = {
  off: "Off",
  on: "On",
  auto: "Auto",
};
const FLASH_CYCLE: FlashState[] = ["off", "on", "auto"];

// Scan step definitions with progress values
const SCAN_STEPS = [
  { text: "Uploading soil sample…", progress: 15 },
  { text: "Preprocessing image…", progress: 35 },
  { text: "Running EfficientNet-b0…", progress: 60 },
  { text: "Analyzing NPK profile…", progress: 80 },
  { text: "Generating soil report…", progress: 95 },
];

export default function ScanScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [flash, setFlash] = useState<FlashState>("off");
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showFlashHint, setShowFlashHint] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const scanLineY = useRef(new Animated.Value(0)).current;
  const captureRing = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scan-line loop
  useEffect(() => {
    if (!isScanning && !capturedImageUri) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: FRAME_SIZE - 3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isScanning, capturedImageUri]);

  // Cleanup step timer on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  const animateProgress = useCallback(
    (toValue: number) => {
      Animated.timing(progressAnim, {
        toValue,
        duration: 600,
        useNativeDriver: false,
      }).start();
    },
    [progressAnim]
  );

  const cycleStepText = useCallback(() => {
    let idx = 0;
    setScanStepIndex(0);
    stepTimerRef.current = setInterval(() => {
      idx = (idx + 1) % SCAN_STEPS.length;
      // Fade out → update → fade in
      Animated.timing(stepFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setScanStepIndex(idx);
        Animated.timing(stepFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 1400);
  }, [stepFadeAnim]);

  const pulseCapture = useCallback(() => {
    Animated.sequence([
      Animated.timing(captureRing, { toValue: 1.18, duration: 100, useNativeDriver: true }),
      Animated.timing(captureRing, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [captureRing]);

  const resetScanState = useCallback(() => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setIsScanning(false);
    setCapturedImageUri(null);
    setScanProgress(0);
    progressAnim.setValue(0);
  }, [progressAnim]);

  const runAIScan = useCallback(
    async (imageUri: string) => {
      setIsScanning(true);
      setScanProgress(0);
      progressAnim.setValue(0);
      setCapturedImageUri(imageUri);

      // Fade in scanning overlay
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // Start cycling step text
      cycleStepText();

      try {
        animateProgress(15);

        const formData = new FormData();
        formData.append("file", {
          uri: imageUri,
          name: "soil_sample.jpg",
          type: "image/jpeg",
        } as any);

        animateProgress(55);

        const response = await fetch(BACKEND_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server error ${response.status}. Check your connection.`);
        }

        const data = await response.json();
        console.log("Inference result:", data);

        animateProgress(90);

        if (!data.success || !data.prediction || data.prediction === "Unknown") {
          throw new Error(
            data.error || "Could not identify the soil type. Try better lighting or a closer shot."
          );
        }

        animateProgress(100);
        setScanProgress(100);

        // Clean up prediction string ("Red_Soil" → "Red Soil")
        const formattedPrediction = data.prediction.replace(/_/g, " ");

        setTimeout(() => {
          if (stepTimerRef.current) clearInterval(stepTimerRef.current);
          setIsScanning(false);
          setCapturedImageUri(null);

          router.push({
            pathname: "/result",
            params: {
              prediction: formattedPrediction,
              confidence: data.confidence_score,
              imageUri: imageUri,
              lowConfidence: data.low_confidence ? "true" : "false",
            },
          });
        }, 900);
      } catch (error: any) {
        console.error("Inference Error:", error);
        resetScanState();

        const msg: string = error.message ?? "Something went wrong. Please try again.";

        // Distinguish network errors from model errors
        const isNetworkError =
          msg.includes("Network request failed") ||
          msg.includes("fetch") ||
          msg.includes("Server error");

        Alert.alert(
          isNetworkError ? "Connection Error" : "Analysis Failed",
          isNetworkError
            ? "Could not reach the AI server. Make sure your backend is running and both devices are on the same network."
            : msg,
          [
            {
              text: "Try Again",
              onPress: () => { },
            },
            {
              text: "Pick Different Image",
              onPress: pickFromGallery,
              style: "default",
            },
          ]
        );
      }
    },
    [animateProgress, cycleStepText, overlayAnim, resetScanState, router]
  );

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert("Camera not ready", "Please wait a moment and try again.");
      return;
    }
    pulseCapture();
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: false,
      });
      if (photo?.uri) runAIScan(photo.uri);
    } catch (err: any) {
      Alert.alert("Capture Error", err.message ?? "Failed to take photo.");
    }
  }, [cameraReady, pulseCapture, runAIScan]);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow photo library access in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      runAIScan(result.assets[0].uri);
    }
  }, [runAIScan]);

  const cycleFlash = useCallback(() => {
    setFlash((prev) => {
      const idx = FLASH_CYCLE.indexOf(prev);
      return FLASH_CYCLE[(idx + 1) % FLASH_CYCLE.length];
    });
    setShowFlashHint(true);
    setTimeout(() => setShowFlashHint(false), 1600);
  }, []);

  const flipCamera = useCallback(() => {
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  // ── Permission loading ────────────────────────────────────────────────────
  if (!cameraPermission) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: themeColors.bg }]}>
        <AILoadingAnimation size={60} />
        <ThemeText category="body" style={{ marginTop: 16 }}>
          Loading camera…
        </ThemeText>
      </View>
    );
  }

  // ── Permission denied ────────────────────────────────────────────────────
  if (!cameraPermission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: themeColors.bg }]}>
        <View style={styles.permissionIconRing}>
          <Ionicons name="camera-outline" size={52} color={Colors.darkGreen} />
        </View>
        <ThemeText category="h2" style={styles.permissionTitle}>
          Camera Access Required
        </ThemeText>
        <ThemeText category="body" style={styles.permissionBody}>
          SoilSense AI needs your camera to scan soil samples. Your images are
          processed on-device and never stored.
        </ThemeText>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestCameraPermission}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={18} color={Colors.white} />
          <ThemeText category="bodyBold" style={styles.permissionBtnText}>
            Enable Camera
          </ThemeText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionGalleryBtn}
          onPress={pickFromGallery}
          activeOpacity={0.85}
        >
          <Ionicons name="images-outline" size={18} color={Colors.darkGreen} />
          <ThemeText category="bodyBold" style={styles.permissionGalleryText}>
            Pick from Gallery Instead
          </ThemeText>
        </TouchableOpacity>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace("/root/tab/home")}
        >
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerDot} />
          <ThemeText category="h2" style={styles.headerTitle}>
            Soil Analyzer
          </ThemeText>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            Alert.alert(
              "📸 Scan Tips",
              "• Hold camera 20–30 cm above soil\n• Use even, natural lighting\n• Fill the frame with the sample\n• Avoid shadows and glare\n• Keep camera steady when shooting"
            )
          }
        >
          <Ionicons name="help-circle-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {!isScanning ? (
        // ── CAMERA VIEWFINDER ───────────────────────────────────────────
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash as FlashMode}
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Vignette overlays */}
          <View style={styles.topOverlay} />
          <View style={styles.bottomOverlay} />
          <View style={styles.leftOverlay} />
          <View style={styles.rightOverlay} />

          {/* Flash hint toast */}
          {showFlashHint && (
            <Animated.View style={styles.flashHint}>
              <Ionicons name={FLASH_ICONS[flash]} size={13} color={Colors.white} />
              <Text style={styles.flashHintText}>Flash {FLASH_LABELS[flash]}</Text>
            </Animated.View>
          )}

          {/* ── SCAN TARGET FRAME ─────────────────────────────────────── */}
          <View style={styles.targetFrame}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Center reticle */}
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
            <View style={styles.centerRing} />

            {/* Animated scan line */}
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
            />
          </View>

          {/* Guidance pill */}
          <View style={styles.guidancePill}>
            <Ionicons name="leaf-outline" size={13} color={Colors.lightGreen} />
            <Text style={styles.guidanceText}>
              Center soil sample · 20–30 cm away
            </Text>
          </View>

          {/* ── CONTROLS ─────────────────────────────────────────────── */}
          <View style={styles.controlsRow}>
            {/* Gallery */}
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={pickFromGallery}
              activeOpacity={0.75}
            >
              <View style={styles.sideBtnIcon}>
                <Ionicons name="images" size={22} color={Colors.white} />
              </View>
              <Text style={styles.sideBtnLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Capture */}
            <Animated.View
              style={[styles.captureBtnOuter, { transform: [{ scale: captureRing }] }]}
            >
              <TouchableOpacity
                style={[styles.captureBtnInner, !cameraReady && styles.captureBtnDisabled]}
                onPress={takePicture}
                activeOpacity={0.85}
                disabled={!cameraReady}
              >
                {cameraReady ? (
                  <Ionicons name="camera" size={32} color={Colors.darkGreen} />
                ) : (
                  <AILoadingAnimation size={28} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Flash */}
            <TouchableOpacity
              style={[styles.sideBtn, flash === "on" && styles.sideBtnFlashActive]}
              onPress={cycleFlash}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.sideBtnIcon,
                  flash === "on" && { backgroundColor: "rgba(255,179,0,0.22)" },
                ]}
              >
                <Ionicons
                  name={FLASH_ICONS[flash]}
                  size={22}
                  color={flash === "on" ? Colors.accentYellow : Colors.white}
                />
              </View>
              <Text
                style={[
                  styles.sideBtnLabel,
                  flash === "on" && { color: Colors.accentYellow },
                ]}
              >
                {FLASH_LABELS[flash]}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Flip camera */}
          <TouchableOpacity style={styles.flipBtn} onPress={flipCamera} activeOpacity={0.75}>
            <View style={styles.flipBtnInner}>
              <Ionicons name="camera-reverse-outline" size={19} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        // ── AI ANALYZING STATE ─────────────────────────────────────────
        <View style={[styles.analyzingContainer, { backgroundColor: themeColors.bg }]}>
          {/* Soil image thumbnail */}
          {capturedImageUri && (
            <View style={styles.thumbnailCard}>
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.thumbnailOverlay}>
                <View style={styles.thumbnailBadge}>
                  <Ionicons name="sparkles" size={11} color={Colors.accentYellow} />
                  <Text style={styles.thumbnailBadgeText}>AI SCANNING</Text>
                </View>
              </View>
            </View>
          )}

          <AILoadingAnimation size={72} style={{ marginTop: 28, marginBottom: 20 }} />

          <Text style={styles.analyzingTitle}>Analyzing Soil Sample</Text>
          <Text style={styles.analyzingSubtitle}>
            EfficientNet-b0 · 7 soil classes
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: themeColors.border }]}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth as any }]}
              />
              {/* Shimmer dot */}
              <Animated.View
                style={[
                  styles.progressDot,
                  { left: progressWidth as any },
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Animated.Text
                style={[styles.progressPct, { color: Colors.darkGreen }]}
              >
                {Math.round(scanProgress > 0 ? scanProgress : 0)}%
              </Animated.Text>
              <Text style={[styles.progressStatus, { color: themeColors.subText }]}>
                Processing…
              </Text>
            </View>
          </View>

          {/* Step text with fade animation */}
          <Animated.View
            style={[styles.stepContainer, { opacity: stepFadeAnim }]}
          >
            <View style={styles.stepBadge}>
              <View style={styles.stepPulse} />
              <Text style={styles.stepText}>
                {SCAN_STEPS[scanStepIndex]?.text ?? "Analyzing…"}
              </Text>
            </View>
          </Animated.View>

          {/* Soil class chips (visual decoration) */}
          <View style={styles.classChipsRow}>
            {["Alluvial", "Red", "Black", "Laterite", "Arid"].map((c) => (
              <View key={c} style={styles.classChip}>
                <Text style={styles.classChipText}>{c}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.disclaimer, { color: themeColors.subText }]}>
            Neural diagnostics via EfficientNet-b0 · Results are indicative
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const FRAME_SIZE = Math.min(width * 0.68, 270);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  permissionIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.lightGreen + "15",
    borderWidth: 1.5,
    borderColor: Colors.lightGreen + "35",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  permissionTitle: { fontWeight: "800", textAlign: "center", marginBottom: 10 },
  permissionBody: {
    textAlign: "center",
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkGreen,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
    width: "100%",
    justifyContent: "center",
  },
  permissionBtnText: { color: Colors.white, marginLeft: 6 },
  permissionGalleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.darkGreen,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },
  permissionGalleryText: { color: Colors.darkGreen, marginLeft: 6 },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.lightGreen,
  },
  headerTitle: { color: Colors.white, fontWeight: "800" },

  // Camera
  cameraWrapper: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  topOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, height: 140,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 210,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  leftOverlay: {
    position: "absolute", top: 140, bottom: 210, left: 0,
    width: (width - FRAME_SIZE) / 2,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  rightOverlay: {
    position: "absolute", top: 140, bottom: 210, right: 0,
    width: (width - FRAME_SIZE) / 2,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  flashHint: {
    position: "absolute",
    top: 148,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    zIndex: 10,
  },
  flashHintText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Target frame
  targetFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    marginTop: -(FRAME_SIZE / 2 + 20),
    marginLeft: -(FRAME_SIZE / 2),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 2.5,
    borderColor: Colors.lightGreen,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  crosshairH: {
    position: "absolute",
    width: 50,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  crosshairV: {
    position: "absolute",
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  centerRing: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.lightGreen + "90",
    borderStyle: "dashed",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 2.5,
    backgroundColor: Colors.lightGreen,
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },

  guidancePill: {
    position: "absolute",
    bottom: 210,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  guidanceText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 2,
  },

  // Controls
  controlsRow: {
    position: "absolute",
    bottom: 55,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
  },
  sideBtn: { alignItems: "center", gap: 5 },
  sideBtnFlashActive: {},
  sideBtnIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sideBtnLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "600",
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  captureBtnDisabled: { opacity: 0.5 },

  flipBtn: { position: "absolute", bottom: 72, right: 22 },
  flipBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  // Analyzing state
  analyzingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 90,
  },
  thumbnailCard: {
    width: 110,
    height: 110,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.lightGreen + "80",
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  thumbnail: { width: "100%", height: "100%" },
  thumbnailOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(20,75,25,0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  thumbnailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  thumbnailBadgeText: {
    color: Colors.accentYellow,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  analyzingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.darkGreen,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  analyzingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  progressContainer: { width: "100%", marginVertical: 18 },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.darkGreen,
    borderRadius: 4,
  },
  progressDot: {
    position: "absolute",
    top: "50%",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.lightGreen,
    marginTop: -6,
    marginLeft: -6,
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressPct: { fontSize: 13, fontWeight: "800" },
  progressStatus: { fontSize: 12, fontWeight: "500" },

  stepContainer: { alignItems: "center", marginVertical: 4 },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkGreen + "12",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.darkGreen + "25",
    gap: 8,
  },
  stepPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.lightGreen,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.darkGreen,
  },

  classChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    marginBottom: 4,
  },
  classChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.darkGreen + "0E",
    borderWidth: 1,
    borderColor: Colors.darkGreen + "20",
  },
  classChipText: {
    fontSize: 11,
    color: Colors.darkGreen,
    fontWeight: "600",
  },

  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 16,
    lineHeight: 16,
  },
});
