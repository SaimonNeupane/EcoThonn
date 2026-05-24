import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemeText, EarthyButton, Colors } from "../components/DesignSystem";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface SlideData {
  id: number;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  accent: string;
  graphic: () => React.ReactNode;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const slides: SlideData[] = [
    {
      id: 1,
      icon: "camera-outline",
      iconColor: "#42A5F5",
      title: "Scan Soil Instantly",
      body: "Take or upload a photo of your field soil. Our advanced computer vision analyzes texture and composition on the spot.",
      accent: "#42A5F5",
      graphic: () => (
        <View style={styles.graphicContainer}>
          {/* Viewfinder frame */}
          <View style={[styles.viewfinder, { borderColor: Colors.lightGreen }]}>
            <View style={styles.soilTextureBlock}>
              {/* Inner soil representation */}
              <View style={styles.soilLayer1} />
              <View style={styles.soilLayer2} />
              {/* Camera scanner overlay */}
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
            size={40}
            color={Colors.lightGreen}
            style={styles.floatingGraphicIcon}
          />
        </View>
      ),
    },
    {
      id: 2,
      icon: "git-network-outline",
      iconColor: "#FFA726",
      title: "AI-Powered Diagnostics",
      body: "Determine precise pH readings, moisture metrics, and NPK nutrient deficiencies powered by agronomic neural networks.",
      accent: "#FFA726",
      graphic: () => (
        <View style={styles.graphicContainer}>
          {/* Chart/Node display */}
          <View style={styles.diagnosticsBox}>
            <View style={styles.nodeWrapper}>
              <View style={[styles.node, { backgroundColor: "#42A5F5" }]}>
                <ThemeText category="caption" style={{ color: "#FFF" }}>
                  N
                </ThemeText>
              </View>
              <View style={styles.nodeConnector} />
              <View style={[styles.node, { backgroundColor: "#FFA726" }]}>
                <ThemeText category="caption" style={{ color: "#FFF" }}>
                  P
                </ThemeText>
              </View>
              <View style={styles.nodeConnector} />
              <View style={[styles.node, { backgroundColor: "#66BB6A" }]}>
                <ThemeText category="caption" style={{ color: "#FFF" }}>
                  K
                </ThemeText>
              </View>
            </View>
            <View style={styles.microChart}>
              <View
                style={[
                  styles.microBar,
                  { height: 40, backgroundColor: "#42A5F5" },
                ]}
              />
              <View
                style={[
                  styles.microBar,
                  { height: 70, backgroundColor: "#FFA726" },
                ]}
              />
              <View
                style={[
                  styles.microBar,
                  { height: 50, backgroundColor: "#66BB6A" },
                ]}
              />
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 3,
      icon: "leaf-outline",
      iconColor: "#66BB6A",
      title: "Smart Crop Selection",
      body: "Receive seasonal compatibility scores, yield forecasts, and growth planning for crops matched to your exact soil conditions.",
      accent: "#66BB6A",
      graphic: () => (
        <View style={styles.graphicContainer}>
          <View style={styles.cropCardGroup}>
            <View style={[styles.cropCardMini, styles.shadowSubtle]}>
              <Ionicons name="leaf" size={24} color="#66BB6A" />
              <ThemeText category="bodyBold" style={{ marginTop: 4 }}>
                Soybean
              </ThemeText>
              <View style={styles.suitBadge}>
                <Text style={styles.suitText}>94% Match</Text>
              </View>
            </View>
            <View
              style={[
                styles.cropCardMini,
                styles.shadowSubtle,
                { transform: [{ scale: 0.95 }, { translateY: 10 }] },
              ]}
            >
              <Ionicons name="rose-outline" size={24} color="#FFA726" />
              <ThemeText category="bodyBold" style={{ marginTop: 4 }}>
                Wheat
              </ThemeText>
              <View
                style={[styles.suitBadge, { backgroundColor: "#FFA72620" }]}
              >
                <Text style={[styles.suitText, { color: "#FFA726" }]}>
                  81% Match
                </Text>
              </View>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 4,
      icon: "sunny-outline",
      iconColor: "#FFB300",
      title: "Smart Weather Insights",
      body: "Track upcoming precipitation, frost risks, and get intelligent irrigation advice customized to save water and cost.",
      accent: "#FFB300",
      graphic: () => (
        <View style={styles.graphicContainer}>
          <View style={styles.weatherWidget}>
            <View style={styles.weatherHead}>
              <Ionicons name="partly-sunny" size={32} color="#FFB300" />
              <View>
                <ThemeText category="bodyBold">24°C</ThemeText>
                <ThemeText category="caption">Rain: 12%</ThemeText>
              </View>
            </View>
            <View style={styles.weatherTipBox}>
              <Ionicons name="water" size={14} color="#42A5F5" />
              <ThemeText
                category="caption"
                style={{ color: "#42A5F5", marginLeft: 4, fontWeight: "600" }}
              >
                Irrigate tomorrow at 6 AM
              </ThemeText>
            </View>
          </View>
        </View>
      ),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(xOffset / width);
    if (pageIndex !== activePageIndex) {
      setActivePageIndex(pageIndex);
    }
  };

  const navigateNext = () => {
    if (activePageIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activePageIndex + 1) * width,
        animated: true,
      });
    } else {
      router.push("/auth");
    }
  };

  const skipOnboarding = () => {
    router.push("/auth");
  };

  return (
    <View style={styles.container}>
      {/* Top Header Row */}
      <View style={styles.header}>
        <ThemeText category="label" style={styles.logoText}>
          SoilSense AI
        </ThemeText>
        {activePageIndex < slides.length - 1 && (
          <TouchableOpacity onPress={skipOnboarding}>
            <ThemeText category="bodyBold" style={styles.skipBtn}>
              Skip
            </ThemeText>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View style={styles.slideContainer} key={slide.id}>
            {/* Visual Graphic Area */}
            <View style={styles.illustrationWrapper}>{slide.graphic()}</View>

            {/* Information Block */}
            <View style={styles.infoWrapper}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: slide.iconColor + "15" },
                ]}
              >
                <Ionicons
                  name={slide.icon as any}
                  size={28}
                  color={slide.iconColor}
                />
              </View>
              <ThemeText category="h2" style={styles.slideTitle}>
                {slide.title}
              </ThemeText>
              <ThemeText category="body" style={styles.slideBody}>
                {slide.body}
              </ThemeText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Page Dots Indicator */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activePageIndex
                      ? Colors.darkGreen
                      : Colors.lightGray,
                  width: index === activePageIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Buttons */}
        <EarthyButton
          title={
            activePageIndex === slides.length - 1 ? "Let's Begin" : "Continue"
          }
          variant={activePageIndex === slides.length - 1 ? "accent" : "primary"}
          onPress={navigateNext}
          style={styles.nextButton}
          icon={
            activePageIndex === slides.length - 1
              ? "checkmark-circle"
              : "chevron-forward"
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 56,
    height: 100,
  },
  logoText: {
    fontSize: 16,
    color: Colors.darkGreen,
    fontWeight: "700",
  },
  skipBtn: {
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    width: width,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  illustrationWrapper: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  infoWrapper: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  slideTitle: {
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "800",
  },
  slideBody: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    width: "100%",
  },
  // Slide Graphics Styles
  graphicContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.beige + "40",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  viewfinder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    padding: 6,
    overflow: "hidden",
  },
  soilTextureBlock: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  soilLayer1: {
    flex: 1,
    backgroundColor: Colors.brown,
  },
  soilLayer2: {
    height: 40,
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
    bottom: 12,
    right: 12,
  },
  diagnosticsBox: {
    width: 140,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nodeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeConnector: {
    width: 12,
    height: 2,
    backgroundColor: Colors.border,
  },
  microChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 60,
  },
  microBar: {
    width: 20,
    borderRadius: 4,
  },
  cropCardGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  cropCardMini: {
    width: 80,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shadowSubtle: {
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  suitBadge: {
    backgroundColor: Colors.lightGreen + "20",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  suitText: {
    fontSize: 8,
    color: Colors.darkGreen,
    fontWeight: "700",
  },
  weatherWidget: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  weatherHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherTipBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#42A5F515",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});
