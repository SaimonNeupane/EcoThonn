import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import {
  EarthyCard,
  ThemeText,
  Colors,
  useThemeColors,
  getGlobalDarkMode,
  setGlobalDarkMode,
} from "../../../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  // Local interactive states
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(getGlobalDarkMode());
  const [soilAlerts, setSoilAlerts] = useState(true);

  // Dynamic refresh wrapper for global dark mode
  const toggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    setGlobalDarkMode(value);
    // Since Expo router handles layout reload on state update, this immediately changes the theme colors in the viewport
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of SoilSense AI?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => router.replace("/auth"),
        },
      ],
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      "Reset App",
      "This will erase all cached soil records and custom farm profiles. Continue?",
      [
        { text: "Cancel" },
        {
          text: "Erase All",
          style: "destructive",
          onPress: () => router.replace("/"),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <ThemeText category="h2">Profile & Settings</ThemeText>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={22}
            color={Colors.accentOrange}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* USER PROFILE INFO BANNER */}
        <EarthyCard style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={32} color={Colors.white} />
            </View>
            <View style={styles.profileInfo}>
              <ThemeText category="h2">Keshav Raj Sharma</ThemeText>
              <ThemeText
                category="caption"
                style={{ color: themeColors.subText }}
              >
                keshav@smartfarm.com
              </ThemeText>

              <View style={styles.tierContainer}>
                <Ionicons
                  name="sparkles"
                  size={10}
                  color={Colors.accentYellow}
                />
                <Text style={styles.tierText}>FREE PLAN MEMBER</Text>
              </View>
            </View>
          </View>
        </EarthyCard>

        {/* PREMIUM UPGRADE CALLOUT */}
        <EarthyCard style={styles.upgradeCard}>
          <View style={styles.upgradeHeader}>
            <Ionicons name="sparkles" size={24} color={Colors.white} />
            <ThemeText
              category="h3"
              style={{ color: Colors.white, marginLeft: 10 }}
            >
              Unlock Premium AI Features
            </ThemeText>
          </View>
          <ThemeText category="caption" style={styles.upgradeDesc}>
            Access high-frequency satellite monitoring, infinite crop
            predictions, NDVI heat mapping, and 24/7 AI Agronomist support.
          </ThemeText>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.upgradeBtnText}>Explore Upgrade Tiers</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.darkGreen} />
          </TouchableOpacity>
        </EarthyCard>

        {/* SETTINGS CARD: SYSTEM CONTROLS */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          App Preferences
        </ThemeText>
        <EarthyCard style={styles.settingsGroupCard}>
          {/* Dark Mode Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="moon-outline"
                size={20}
                color={themeColors.text}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">Dark Mode Theme</ThemeText>
                <ThemeText category="caption">
                  Adjust app interface contrast
                </ThemeText>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: Colors.lightGray, true: Colors.lightGreen }}
              thumbColor={darkMode ? Colors.darkGreen : Colors.white}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Push Notifications Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={themeColors.text}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">Push Notifications</ThemeText>
                <ThemeText category="caption">
                  Receive watering and weather alerts
                </ThemeText>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.lightGray, true: Colors.lightGreen }}
              thumbColor={notifications ? Colors.darkGreen : Colors.white}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Soil Alerts Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={themeColors.text}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">
                  Soil Deficiencies Warnings
                </ThemeText>
                <ThemeText category="caption">
                  Notify if NPK drop is predicted
                </ThemeText>
              </View>
            </View>
            <Switch
              value={soilAlerts}
              onValueChange={setSoilAlerts}
              trackColor={{ false: Colors.lightGray, true: Colors.lightGreen }}
              thumbColor={soilAlerts ? Colors.darkGreen : Colors.white}
            />
          </View>
        </EarthyCard>

        {/* SETTINGS CARD: FARM DETAILS */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Farm Profile Settings
        </ThemeText>
        <EarthyCard style={styles.settingsGroupCard}>
          <TouchableOpacity
            style={styles.interactiveRow}
            onPress={() =>
              Alert.alert("Edit Fields", "Simulate Farm Field Sizing Editor.")
            }
          >
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="resize-outline"
                size={20}
                color={themeColors.text}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">Total Farm Acreage</ThemeText>
                <ThemeText category="caption">Currently: 45 Acres</ThemeText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={themeColors.subText}
            />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.interactiveRow}
            onPress={() =>
              Alert.alert("Main Crops", "Select primary harvest types.")
            }
          >
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="leaf-outline"
                size={20}
                color={themeColors.text}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">
                  Primary Crops Cultivated
                </ThemeText>
                <ThemeText category="caption">Wheat, Soybean, Rice</ThemeText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={themeColors.subText}
            />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.interactiveRow}
            onPress={() =>
              Alert.alert("Language Selector", "Select preferred language.", [
                { text: "English (US)" },
                { text: "Spanish (ES)" },
                { text: "Hindi (IN)" },
                { text: "Cancel" },
              ])
            }
          >
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={themeColors.text}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">Preferred Language</ThemeText>
                <ThemeText category="caption">English (US)</ThemeText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={themeColors.subText}
            />
          </TouchableOpacity>
        </EarthyCard>

        {/* SETTINGS CARD: ACCOUNT & SECURITY */}
        <ThemeText category="h3" style={styles.sectionTitle}>
          Account & Security
        </ThemeText>
        <EarthyCard style={styles.settingsGroupCard}>
          <TouchableOpacity
            style={styles.interactiveRow}
            onPress={() =>
              Alert.alert(
                "Password Reset",
                "Security verification code sent to your email.",
              )
            }
          >
            <View style={styles.settingsLabelBlock}>
              <Ionicons name="key-outline" size={20} color={themeColors.text} />
              <View style={{ marginLeft: 12 }}>
                <ThemeText category="bodyBold">Change Password</ThemeText>
                <ThemeText category="caption">
                  Update security passcode credentials
                </ThemeText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={themeColors.subText}
            />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.interactiveRow}
            onPress={handleResetApp}
          >
            <View style={styles.settingsLabelBlock}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={Colors.accentOrange}
              />
              <View style={{ marginLeft: 12 }}>
                <ThemeText
                  category="bodyBold"
                  style={{ color: Colors.accentOrange }}
                >
                  Clear Database
                </ThemeText>
                <ThemeText category="caption">
                  Erase diagnostic logs and memory cache
                </ThemeText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={themeColors.subText}
            />
          </TouchableOpacity>
        </EarthyCard>

        <TouchableOpacity style={styles.logoutFullBtn} onPress={handleLogout}>
          <Ionicons name="power" size={18} color={Colors.white} />
          <Text style={styles.logoutBtnText}>Sign Out of SoilSense AI</Text>
        </TouchableOpacity>

        <ThemeText category="caption" style={styles.footerCopyright}>
          © 2026 SoilSense AI Inc. • Privacy Policy • Terms
        </ThemeText>
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
  profileCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  tierContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  tierText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  upgradeCard: {
    backgroundColor: Colors.brown,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  upgradeDesc: {
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 16,
    marginBottom: 14,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.darkGreen,
    marginRight: 6,
  },
  sectionTitle: {
    fontWeight: "800",
    marginVertical: 10,
  },
  settingsGroupCard: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingsLabelBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 4,
  },
  interactiveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    height: 52,
    borderRadius: 26,
    marginVertical: 16,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    marginLeft: 8,
  },
  footerCopyright: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 20,
  },
});
