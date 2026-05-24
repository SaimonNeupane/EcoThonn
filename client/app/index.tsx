import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import {
  EarthyGradient,
  ThemeText,
  EarthyButton,
  Colors,
} from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();

  // Animation refs
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run intro animations in parallel
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 15,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Slide up button
        Animated.parallel([
          Animated.timing(buttonSlide, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }, [logoScale, logoOpacity, textOpacity, buttonSlide, buttonOpacity]);

  return (
    <View style={styles.container}>
      <EarthyGradient variant="primary" style={styles.gradient}>
        {/* Animated Background Decorative Elements */}
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />

        <View style={styles.content}>
          {/* Pulsing AI Logo Core */}
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: logoScale }], opacity: logoOpacity },
            ]}
          >
            <View style={styles.outerCircle}>
              <View style={styles.middleCircle}>
                <View style={styles.innerCircle}>
                  <Ionicons name="leaf" size={60} color={Colors.white} />
                  <Ionicons
                    name="sparkles"
                    size={24}
                    color={Colors.accentYellow}
                    style={styles.sparkleIcon}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Animated Text Block */}
          <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
            <ThemeText category="h1" style={styles.title}>
              SoilSense AI
            </ThemeText>
            <ThemeText category="h3" style={styles.tagline}>
              AI Powered Soil Intelligence
            </ThemeText>
            <View style={styles.divider} />
            <ThemeText category="caption" style={styles.description}>
              Transform your soil analysis with mobile computer vision and
              instant crop recommendations.
            </ThemeText>
          </Animated.View>
        </View>

        {/* Slide-in CTA Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ translateY: buttonSlide }],
              opacity: buttonOpacity,
            },
          ]}
        >
          <EarthyButton
            title="Get Started"
            variant="accent"
            icon="arrow-forward"
            onPress={() => router.push("/onboarding")}
            style={styles.ctaButton}
          />
          <ThemeText category="caption" style={styles.footerText}>
            Version 1.0.0 • Premium Agritech
          </ThemeText>
        </Animated.View>
      </EarthyGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGreen,
  },
  gradient: {
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    paddingBottom: 40,
    position: "relative",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  middleCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.lightGreen,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  sparkleIcon: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  textBlock: {
    alignItems: "center",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 8,
  },
  tagline: {
    color: Colors.beige,
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: Colors.accentYellow,
    borderRadius: 2,
    marginBottom: 20,
  },
  description: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 280,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  ctaButton: {
    width: "100%",
    shadowColor: Colors.accentYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 16,
  },
  // Ambient bubbles
  bubble1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(102, 187, 106, 0.2)",
    top: -100,
    right: -100,
  },
  bubble2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(141, 110, 99, 0.15)",
    bottom: 50,
    left: -120,
  },
  bubble3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: height * 0.4,
    right: 40,
  },
});
