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
} from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

// Authentication screen for login, signup, and password reset
type AuthMode = "login" | "signup" | "forgot";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP Dialog state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleAuthAction = () => {
    if (mode === "login") {
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all fields.");
        return;
      }
      // Success simulation -> redirects to app dashboard
      router.replace("/root/tab/home");
    } else if (mode === "signup") {
      if (!name || !email || !password) {
        Alert.alert("Error", "Please fill in all fields.");
        return;
      }
      // Show OTP modal for registration verification
      setShowOtpModal(true);
    } else if (mode === "forgot") {
      if (!email) {
        Alert.alert("Error", "Please enter your email.");
        return;
      }
      Alert.alert(
        "Reset Link Sent",
        "A password reset link has been dispatched to your email address.",
        [{ text: "OK", onPress: () => setMode("login") }],
      );
    }
  };

  const handleOtpVerify = () => {
    if (otpCode.length < 4) {
      Alert.alert("Verification Code", "Please enter the 4-digit code.");
      return;
    }
    setShowOtpModal(false);
    // Success simulation -> redirects to app dashboard
    router.replace("/root/tab/home");
  };

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

        {/* Auth form card */}
        <EarthyCard style={styles.authCard}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              onPress={() => setMode("login")}
              style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}
            >
              <ThemeText
                category="h3"
                style={[
                  styles.tabBtnText,
                  mode === "login" ? styles.textActive : styles.textInactive,
                ]}
              >
                Sign In
              </ThemeText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode("signup")}
              style={[styles.tabBtn, mode === "signup" && styles.tabBtnActive]}
            >
              <ThemeText
                category="h3"
                style={[
                  styles.tabBtnText,
                  mode === "signup" ? styles.textActive : styles.textInactive,
                ]}
              >
                Sign Up
              </ThemeText>
            </TouchableOpacity>
          </View>

          {mode === "forgot" && (
            <View style={styles.forgotHeader}>
              <TouchableOpacity
                onPress={() => setMode("login")}
                style={styles.backBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={Colors.darkGreen}
                />
                <ThemeText category="bodyBold" style={styles.backBtnText}>
                  Back to Sign In
                </ThemeText>
              </TouchableOpacity>
              <ThemeText category="body" style={styles.forgotDesc}>
                Enter your email address below, and we will send you
                instructions to reset your password.
              </ThemeText>
            </View>
          )}

          {/* Form Fields */}
          {mode === "signup" && (
            <EarthyInput
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              icon="person-outline"
            />
          )}

          <EarthyInput
            label="Email Address"
            placeholder="example@farm.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="mail-outline"
          />

          {mode !== "forgot" && (
            <EarthyInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed-outline"
            />
          )}

          {mode === "login" && (
            <TouchableOpacity
              onPress={() => setMode("forgot")}
              style={styles.forgotBtnWrapper}
            >
              <ThemeText category="caption" style={styles.forgotText}>
                Forgot Password?
              </ThemeText>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <EarthyButton
            title={
              mode === "login"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"
            }
            onPress={handleAuthAction}
            style={styles.submitBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <ThemeText category="caption" style={styles.dividerText}>
              or continue with
            </ThemeText>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Logins */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <ThemeText category="bodyBold" style={styles.socialBtnText}>
                Google
              </ThemeText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <ThemeText category="bodyBold" style={styles.socialBtnText}>
                Apple
              </ThemeText>
            </TouchableOpacity>
          </View>
        </EarthyCard>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOtpModal}
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <EarthyCard style={styles.modalContent}>
            <View style={styles.otpHeader}>
              <View style={styles.otpIconBg}>
                <Ionicons
                  name="shield-checkmark"
                  size={32}
                  color={Colors.darkGreen}
                />
              </View>
              <ThemeText category="h2" style={styles.otpTitle}>
                Verify Your Account
              </ThemeText>
              <ThemeText category="body" style={styles.otpSub}>
                We&apos;ve sent a 4-digit code to {email}. Enter it below to
                complete signup.
              </ThemeText>
            </View>

            <EarthyInput
              placeholder="Enter 4-Digit Code"
              value={otpCode}
              onChangeText={(txt: string) => setOtpCode(txt.slice(0, 4))}
              keyboardType="numeric"
              icon="keypad-outline"
              style={styles.otpInput}
            />

            <View style={styles.otpResendRow}>
              <ThemeText category="caption">
                Didn&apos;t receive code?
              </ThemeText>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Resent",
                    "Verification code resent successfully.",
                  )
                }
              >
                <ThemeText category="caption" style={styles.resendBtnText}>
                  {" "}
                  Resend Code
                </ThemeText>
              </TouchableOpacity>
            </View>

            <EarthyButton
              title="Verify & Register"
              onPress={handleOtpVerify}
              style={{ marginTop: 12 }}
            />

            <TouchableOpacity
              onPress={() => setShowOtpModal(false)}
              style={styles.otpCloseBtn}
            >
              <ThemeText
                category="caption"
                style={{ color: Colors.textSecondary }}
              >
                Cancel
              </ThemeText>
            </TouchableOpacity>
          </EarthyCard>
        </View>
      </Modal>
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
  tabHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.darkGreen,
  },
  tabBtnText: {
    fontWeight: "700",
  },
  textActive: {
    color: Colors.darkGreen,
  },
  textInactive: {
    color: Colors.textSecondary,
  },
  forgotHeader: {
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtnText: {
    color: Colors.darkGreen,
    marginLeft: 6,
  },
  forgotDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  forgotBtnWrapper: {
    alignSelf: "flex-end",
    marginVertical: 4,
    paddingVertical: 4,
  },
  forgotText: {
    color: Colors.darkGreen,
    fontWeight: "600",
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "stretch",
  },
  otpHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  otpIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lightGreen + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.darkGreen,
    marginBottom: 8,
  },
  otpSub: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  otpInput: {
    marginBottom: 12,
  },
  otpResendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  resendBtnText: {
    color: Colors.darkGreen,
    fontWeight: "700",
  },
  otpCloseBtn: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
});
