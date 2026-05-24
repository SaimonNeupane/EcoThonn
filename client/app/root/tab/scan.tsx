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

const { width, height } = Dimensions.get("window");

// ─── Flash mode cycle: off → on → auto ──────────────────────────────────────
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

export default function ScanScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  // ── Camera permission ──────────────────────────────────────────────────────
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState("Initializing sensors...");
  const [scanProgress, setScanProgress] = useState(0);
  const [flash, setFlash] = useState<FlashState>("off");
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showFlashHint, setShowFlashHint] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const cameraRef = useRef<CameraView>(null);
  const scanLineY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const captureRing = useRef(new Animated.Value(1)).current;

  // ── Scan-line loop (visible when NOT scanning) ─────────────────────────────
  useEffect(() => {
    if (!isScanning && !capturedImageUri) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: 240,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isScanning, capturedImageUri, scanLineY]);

  // ── Capture-ring pulse animation ───────────────────────────────────────────
  const pulseCapture = useCallback(() => {
    Animated.sequence([
      Animated.timing(captureRing, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(captureRing, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [captureRing]);

  // ── AI scanning simulation (same steps as before) ─────────────────────────
  const runAIScan = useCallback(
    (imageUri: string) => {
      setIsScanning(true);
      setScanProgress(0);
      setCapturedImageUri(imageUri);

      // Fade-in overlay with preview image
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      const steps = [
        { text: "Capturing soil reflectance index...", delay: 0, progress: 20 },
        {
          text: "Analyzing soil coloration spectrum...",
          delay: 900,
          progress: 45,
        },
        {
          text: "Extracting moisture reflections...",
          delay: 1800,
          progress: 70,
        },
        {
          text: "Estimating NPK concentrations...",
          delay: 2700,
          progress: 90,
        },
        { text: "Compiling diagnostic model...", delay: 3600, progress: 100 },
      ];

      steps.forEach((step) => {
        setTimeout(() => {
          setScanStepText(step.text);
          setScanProgress(step.progress);

          if (step.progress === 100) {
            setTimeout(() => {
              setIsScanning(false);
              setCapturedImageUri(null);
              router.push("/result");
            }, 700);
          }
        }, step.delay);
      });
    },
    [overlayOpacity, router]
  );

  // ── Take photo from camera ─────────────────────────────────────────────────
  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert("Camera not ready", "Please wait a moment and try again.");
      return;
    }
    pulseCapture();
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      if (photo?.uri) {
        runAIScan(photo.uri);
      }
    } catch (err: any) {
      Alert.alert("Capture Error", err.message ?? "Failed to take photo.");
    }
  }, [cameraReady, pulseCapture, runAIScan]);

  // ── Pick image from gallery ────────────────────────────────────────────────
  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library in Settings.",
        [{ text: "OK" }]
      );
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

  // ── Cycle flash mode ───────────────────────────────────────────────────────
  const cycleFlash = useCallback(() => {
    setFlash((prev) => {
      const idx = FLASH_CYCLE.indexOf(prev);
      const next = FLASH_CYCLE[(idx + 1) % FLASH_CYCLE.length];
      return next;
    });
    setShowFlashHint(true);
    setTimeout(() => setShowFlashHint(false), 1500);
  }, []);

  // ── Flip camera ────────────────────────────────────────────────────────────
  const flipCamera = useCallback(() => {
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  // ── Permission gate ────────────────────────────────────────────────────────
  if (!cameraPermission) {
    // Still loading permission status
    return (
      <View style={[styles.permissionContainer, { backgroundColor: themeColors.bg }]}>
        <AILoadingAnimation size={60} />
        <ThemeText category="body" style={{ marginTop: 16 }}>
          Loading camera…
        </ThemeText>
      </View>
    );
  }

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
          SoilSense AI needs your camera to scan soil samples and run AI
          diagnostics. Your images are processed locally.
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

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace("/root/tab/home")}
        >
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>

        <ThemeText category="h2" style={styles.headerTitle}>
          Soil Analyzer
        </ThemeText>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            Alert.alert(
              "Scan Tips",
              "• Hold the camera 20–30 cm above the soil\n• Ensure even natural lighting\n• Fill the frame with soil sample\n• Avoid shadows on the sample"
            )
          }
        >
          <Ionicons name="help-circle-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {!isScanning ? (
        // ── CAMERA / VIEWFINDER STATE ────────────────────────────────────
        <View style={styles.cameraWrapper}>
          {/* Live Camera */}
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash as FlashMode}
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Dark overlay at top */}
          <View style={styles.topOverlay} />

          {/* Flash hint toast */}
          {showFlashHint && (
            <View style={styles.flashHint}>
              <Ionicons
                name={FLASH_ICONS[flash]}
                size={14}
                color={Colors.white}
              />
              <ThemeText category="caption" style={styles.flashHintText}>
                Flash: {FLASH_LABELS[flash]}
              </ThemeText>
            </View>
          )}

          {/* Scan target frame */}
          <View style={styles.targetFrame}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: Colors.lightGreen }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: Colors.lightGreen }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: Colors.lightGreen }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: Colors.lightGreen }]} />

            {/* Crosshair */}
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
            <View style={[styles.centerRing, { borderColor: Colors.lightGreen }]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineY }] },
              ]}
            />
          </View>

          {/* Bottom overlay */}
          <View style={styles.bottomOverlay} />

          {/* Guidance text */}
          <View style={styles.guidanceRow}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="rgba(255,255,255,0.7)"
            />
            <ThemeText category="caption" style={styles.guidanceText}>
              Align soil within the target frame, 20–30 cm away
            </ThemeText>
          </View>

          {/* Controls row */}
          <View style={styles.controlsRow}>
            {/* Gallery picker */}
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={pickFromGallery}
              activeOpacity={0.8}
            >
              <Ionicons name="images" size={24} color={Colors.white} />
              <ThemeText category="caption" style={styles.sideBtnLabel}>
                Gallery
              </ThemeText>
            </TouchableOpacity>

            {/* Main capture button */}
            <Animated.View
              style={[
                styles.captureBtnOuter,
                { transform: [{ scale: captureRing }] },
              ]}
            >
              <TouchableOpacity
                style={styles.captureBtnInner}
                onPress={takePicture}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={34} color={Colors.darkGreen} />
              </TouchableOpacity>
            </Animated.View>

            {/* Flash toggle */}
            <TouchableOpacity
              style={[
                styles.sideBtn,
                flash === "on" && styles.sideBtnActive,
              ]}
              onPress={cycleFlash}
              activeOpacity={0.8}
            >
              <Ionicons
                name={FLASH_ICONS[flash]}
                size={24}
                color={
                  flash === "on" ? Colors.accentYellow : Colors.white
                }
              />
              <ThemeText
                category="caption"
                style={[
                  styles.sideBtnLabel,
                  flash === "on" && { color: Colors.accentYellow },
                ]}
              >
                {FLASH_LABELS[flash]}
              </ThemeText>
            </TouchableOpacity>
          </View>

          {/* Flip camera */}
          <TouchableOpacity style={styles.flipBtn} onPress={flipCamera}>
            <Ionicons
              name="camera-reverse-outline"
              size={20}
              color={Colors.white}
            />
            <ThemeText category="caption" style={styles.flipBtnText}>
              Flip
            </ThemeText>
          </TouchableOpacity>
        </View>
      ) : (
        // ── AI ANALYZING STATE ──────────────────────────────────────────
        <View style={[styles.analyzingContainer, { backgroundColor: themeColors.bg }]}>
          {/* Captured image preview (small thumbnail) */}
          {capturedImageUri && (
            <View style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.thumbnailOverlay}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={Colors.accentYellow}
                />
                <ThemeText
                  category="caption"
                  style={{ color: Colors.white, marginLeft: 4, fontWeight: "700" }}
                >
                  AI Scanning
                </ThemeText>
              </View>
            </View>
          )}

          <AILoadingAnimation size={80} style={{ marginVertical: 28 }} />

          <ThemeText
            category="h2"
            style={{ color: Colors.darkGreen, fontWeight: "800", textAlign: "center" }}
          >
            AI Processing Soil
          </ThemeText>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBg,
                { backgroundColor: themeColors.border },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${scanProgress}%` as any },
                ]}
              />
            </View>
            <View style={styles.progressLabelRow}>
              <ThemeText category="label" style={styles.progressPct}>
                {scanProgress}% Completed
              </ThemeText>
              {scanProgress < 100 && (
                <ThemeText
                  category="caption"
                  style={{ color: themeColors.subText }}
                >
                  Please wait…
                </ThemeText>
              )}
            </View>
          </View>

          <ThemeText
            category="bodyBold"
            style={[styles.stepText, { color: themeColors.text }]}
          >
            {scanStepText}
          </ThemeText>

          <ThemeText category="caption" style={styles.disclaimer}>
            Computing NPK concentrations via remote neural diagnostics.
          </ThemeText>
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const FRAME_SIZE = Math.min(width * 0.7, 280);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ── Permission screen ────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  permissionIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGreen + "18",
    borderWidth: 2,
    borderColor: Colors.lightGreen + "40",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
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
    marginBottom: 14,
    width: "100%",
    justifyContent: "center",
  },
  permissionBtnText: {
    color: Colors.white,
    marginLeft: 6,
  },
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
  permissionGalleryText: {
    color: Colors.darkGreen,
    marginLeft: 6,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.white,
    fontWeight: "800",
  },

  // ── Camera view ───────────────────────────────────────────────────────────
  cameraWrapper: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // Flash hint toast
  flashHint: {
    position: "absolute",
    top: 140,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    zIndex: 10,
  },
  flashHintText: {
    color: Colors.white,
    marginLeft: 4,
    fontWeight: "600",
  },

  // Scan target frame
  targetFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    marginTop: -(FRAME_SIZE / 2),
    marginLeft: -(FRAME_SIZE / 2),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  crosshairH: {
    position: "absolute",
    width: 60,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  crosshairV: {
    position: "absolute",
    width: 1,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  centerRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 3,
    backgroundColor: Colors.lightGreen,
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },

  // Guidance text
  guidanceRow: {
    position: "absolute",
    bottom: 200,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  guidanceText: {
    color: "rgba(255,255,255,0.85)",
    marginLeft: 4,
    fontWeight: "500",
  },

  // Controls row
  controlsRow: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
  },
  sideBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    gap: 2,
  },
  sideBtnActive: {
    backgroundColor: "rgba(255,179,0,0.18)",
  },
  sideBtnLabel: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  captureBtnOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  captureBtnInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  // Flip button
  flipBtn: {
    position: "absolute",
    bottom: 80,
    right: 20,
    alignItems: "center",
    opacity: 0.8,
  },
  flipBtnText: {
    color: Colors.white,
    fontSize: 9,
    marginTop: 2,
    fontWeight: "600",
  },

  // ── AI analyzing ─────────────────────────────────────────────────────────
  analyzingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingTop: 100,
  },
  thumbnailWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.lightGreen,
    marginBottom: 4,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(27,94,32,0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  progressContainer: {
    width: "100%",
    marginVertical: 20,
  },
  progressBg: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.darkGreen,
    borderRadius: 5,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressPct: {
    fontWeight: "700",
    color: Colors.darkGreen,
  },
  stepText: {
    textAlign: "center",
    fontSize: 15,
    minHeight: 48,
    maxWidth: 280,
  },
  disclaimer: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 11,
    marginTop: 20,
    lineHeight: 16,
  },
});
