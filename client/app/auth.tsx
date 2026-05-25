import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  EarthyCard,
  ThemeText,
  EarthyButton,
  EarthyInput,
  Colors,
  AILoadingAnimation,
} from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../hooks/useLocation";
import { useFirebaseEmailAuth } from "../hooks/useFirebaseEmailAuth";

// ─── Auth flow stages ────────────────────────────────────────────────────────
// "input"       → user enters their email
// "link_sent"   → email sent, waiting for user to tap the link
// "manual"      → user wants to paste the magic link URL manually
type Stage = "input" | "link_sent" | "manual";

export default function AuthScreen() {
  const router = useRouter();
  const { fetchLocation } = useLocation();
  const {
    sendLink,
    completeSignInFromLink,
    completeSignInManually,
    loading,
    error,
    clearError,
  } = useFirebaseEmailAuth();

  const [stage, setStage] = useState<Stage>("input");
  const [email, setEmail] = useState("");
  const [pastedUrl, setPastedUrl] = useState("");
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // ── After successful sign-in: fetch location then navigate home ────────────
  const completeLogin = async () => {
    setIsLocationLoading(true);
    try {
      await fetchLocation();
    } catch (e) {
      console.warn("Failed to fetch location on login:", e);
    } finally {
      setIsLocationLoading(false);
      router.replace("/root/tab/home");
    }
  };

  // ── Step 1: Send the magic link ────────────────────────────────────────────
  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }
    const sent = await sendLink(email.trim());
    if (sent) setStage("link_sent");
  };

  // ── Step 2a: Complete via deep link URL (called from your deep link handler) ─
  // Wire this up in your Expo linking config / app entry point, e.g.:
  //   const url = await Linking.getInitialURL();
  //   if (url) await completeSignInFromLink(url);
  // Left here as a reference — not called from the UI directly.

  // ── Step 2b: Manual URL paste ─────────────────────────────────────────────
  const handleManualSignIn = async () => {
    if (!pastedUrl.trim()) {
      Alert.alert(
        "Link required",
        "Please paste the full sign-in URL from your email.",
      );
      return;
    }

    // If error is EMAIL_NEEDED (opened on different device), we already have
    // the email field visible; otherwise use the stored email from step 1.
    const success = await completeSignInManually(
      pastedUrl.trim(),
      email.trim(),
    );
    if (success) await completeLogin();
  };

  // ── Show Firebase error as an alert ───────────────────────────────────────
  React.useEffect(() => {
    if (error && error !== "EMAIL_NEEDED") {
      Alert.alert("Authentication Error", error, [
        { text: "OK", onPress: clearError },
      ]);
    }
  }, [error]);

  // ── Location loading screen ────────────────────────────────────────────────
  if (isLocationLoading) {
    return (
      <View
        style={[
          styles.locationLoadingContainer,
          { backgroundColor: Colors.background },
        ]}
      >
        <View style={styles.locationPulseContainer}>
          <AILoadingAnimation size={90} />
        </View>
        <ThemeText category="h1" style={styles.locationLoadingTitle}>
          Syncing Field Context
        </ThemeText>
        <ThemeText category="body" style={styles.locationLoadingBody}>
          Locating your field coordinates to fetch regional climate data and
          soil models.
        </ThemeText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={28} color={Colors.white} />
          </View>
          <ThemeText category="h1" style={styles.brandTitle}>
            SoilSense AI
          </ThemeText>
          <ThemeText category="caption" style={styles.brandSubtitle}>
            AI Powered Soil Intelligence
          </ThemeText>
        </View>

        <EarthyCard style={styles.authCard}>
          {/* ── Stage: input ─────────────────────────────────────────────── */}
          {stage === "input" && (
            <>
              <ThemeText category="h2" style={styles.cardTitle}>
                Sign In / Sign Up
              </ThemeText>
              <ThemeText category="body" style={styles.cardDesc}>
                Enter your email and we will send you a magic link — no password
                needed.
              </ThemeText>

              <EarthyInput
                label="Email Address"
                placeholder="example@farm.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon="mail-outline"
              />

              <EarthyButton
                title={loading ? "Sending…" : "Send Magic Link"}
                onPress={handleSendLink}
                style={styles.submitBtn}
                disabled={loading}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <ThemeText category="caption" style={styles.dividerText}>
                  or continue with
                </ThemeText>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Logins — wire up real OAuth here when ready */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={styles.socialBtn}
                  onPress={() =>
                    Alert.alert("Coming soon", "Google sign-in coming soon.")
                  }
                >
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                  <ThemeText category="bodyBold" style={styles.socialBtnText}>
                    Google
                  </ThemeText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialBtn}
                  onPress={() =>
                    Alert.alert("Coming soon", "Apple sign-in coming soon.")
                  }
                >
                  <Ionicons name="logo-apple" size={20} color="#000000" />
                  <ThemeText category="bodyBold" style={styles.socialBtnText}>
                    Apple
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Stage: link_sent ──────────────────────────────────────────── */}
          {stage === "link_sent" && (
            <>
              <View style={styles.sentIconWrapper}>
                <Ionicons
                  name="mail-open-outline"
                  size={52}
                  color={Colors.darkGreen}
                />
              </View>
              <ThemeText category="h2" style={styles.cardTitle}>
                Check Your Inbox
              </ThemeText>
              <ThemeText category="body" style={styles.cardDesc}>
                We sent a magic link to{" "}
                <ThemeText category="bodyBold">{email}</ThemeText>. Tap it to
                sign in instantly — no password required.
              </ThemeText>

              <ThemeText category="caption" style={styles.hintText}>
                The link expires in 1 hour. Make sure to open it on this device.
              </ThemeText>

              {/* Resend */}
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleSendLink}
                disabled={loading}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={Colors.darkGreen}
                />
                <ThemeText category="caption" style={styles.resendText}>
                  {loading ? "Resending…" : "Resend link"}
                </ThemeText>
              </TouchableOpacity>

              {/* Manual fallback */}
              <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => setStage("manual")}
              >
                <ThemeText category="caption" style={styles.manualBtnText}>
                  Link not working? Paste it manually →
                </ThemeText>
              </TouchableOpacity>

              {/* Change email */}
              <TouchableOpacity
                style={styles.changeEmailBtn}
                onPress={() => {
                  setStage("input");
                  setEmail("");
                }}
              >
                <ThemeText
                  category="caption"
                  style={{ color: Colors.textSecondary }}
                >
                  Use a different email
                </ThemeText>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: manual ─────────────────────────────────────────────── */}
          {stage === "manual" && (
            <>
              <TouchableOpacity
                onPress={() => setStage("link_sent")}
                style={styles.backBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={Colors.darkGreen}
                />
                <ThemeText category="bodyBold" style={styles.backBtnText}>
                  Back
                </ThemeText>
              </TouchableOpacity>

              <ThemeText category="h2" style={styles.cardTitle}>
                Paste Your Link
              </ThemeText>
              <ThemeText category="body" style={styles.cardDesc}>
                Open the email on any device, copy the full sign-in URL, and
                paste it below.
              </ThemeText>

              {/* Show email field if we lost it (different device scenario) */}
              {error === "EMAIL_NEEDED" && (
                <EarthyInput
                  label="Your Email"
                  placeholder="example@farm.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  icon="mail-outline"
                />
              )}

              <EarthyInput
                label="Sign-in URL"
                placeholder="Paste the full link from your email here"
                value={pastedUrl}
                onChangeText={setPastedUrl}
                icon="link-outline"
              />

              <EarthyButton
                title={loading ? "Verifying…" : "Sign In"}
                onPress={handleManualSignIn}
                style={styles.submitBtn}
                disabled={loading}
              />
            </>
          )}
        </EarthyCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.darkGreen,
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },
  authCard: {
    padding: 24,
    borderRadius: 24,
  },
  cardTitle: {
    fontWeight: "800",
    color: Colors.darkGreen,
    marginBottom: 8,
    textAlign: "center",
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  hintText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 16,
    width: "100%",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Colors.textSecondary,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 6,
    backgroundColor: Colors.white,
  },
  socialBtnText: {
    marginLeft: 8,
    color: Colors.textPrimary,
  },
  sentIconWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  resendText: {
    color: Colors.darkGreen,
    fontWeight: "600",
  },
  manualBtn: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  manualBtnText: {
    color: Colors.darkGreen,
    fontWeight: "600",
  },
  changeEmailBtn: {
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  backBtnText: {
    color: Colors.darkGreen,
  },
  locationLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  locationPulseContainer: {
    marginBottom: 32,
  },
  locationLoadingTitle: {
    fontWeight: "900",
    color: Colors.darkGreen,
    textAlign: "center",
    marginBottom: 12,
  },
  locationLoadingBody: {
    textAlign: "center",
    lineHeight: 20,
    color: Colors.textSecondary,
    maxWidth: 300,
  },
});
