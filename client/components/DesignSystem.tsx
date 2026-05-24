import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// 1. Color Palette
export const Colors = {
  darkGreen: "#1B5E20",
  lightGreen: "#66BB6A",
  brown: "#8D6E63",
  beige: "#F5F5DC",
  white: "#FFFFFF",
  textPrimary: "#2E3A2F",
  textSecondary: "#6E7A6E",
  accentYellow: "#FFB300",
  accentOrange: "#FF7043",
  cardBackground: "#FFFFFF",
  background: "#F4F6F4",
  lightGray: "#ECEFED",
  border: "#D1DCD2",

  // Dark Mode colors
  darkBg: "#121C14",
  darkCard: "#1B2A1E",
  darkText: "#E3EAE4",
  darkTextSecondary: "#9EADA0",
  darkBorder: "#2E3F32",
};

// Global context or state simulator for Theme
let isDarkModeGlobal = false;
export const setGlobalDarkMode = (val: boolean) => {
  isDarkModeGlobal = val;
};
export const getGlobalDarkMode = () => isDarkModeGlobal;

// Theme Helper Hook
export function useThemeColors() {
  // Simulates theme reactivity
  const isDark = isDarkModeGlobal;
  return {
    isDark,
    bg: isDark ? Colors.darkBg : Colors.background,
    card: isDark ? Colors.darkCard : Colors.white,
    text: isDark ? Colors.darkText : Colors.textPrimary,
    subText: isDark ? Colors.darkTextSecondary : Colors.textSecondary,
    border: isDark ? Colors.darkBorder : Colors.border,
    primary: Colors.darkGreen,
    secondary: Colors.lightGreen,
    accent: Colors.accentYellow,
    brown: Colors.brown,
    white: Colors.white,
  };
}

// 2. Typography Hierarchy
export const ThemeText: React.FC<{
  category?: "h1" | "h2" | "h3" | "body" | "bodyBold" | "label" | "caption";
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
}> = ({ category = "body", style, children, numberOfLines }) => {
  const colors = useThemeColors();

  const getStyleForCategory = () => {
    switch (category) {
      case "h1":
        return {
          fontSize: 26,
          fontWeight: "800" as const,
          color: colors.text,
          letterSpacing: -0.5,
        };
      case "h2":
        return { fontSize: 20, fontWeight: "700" as const, color: colors.text };
      case "h3":
        return { fontSize: 16, fontWeight: "600" as const, color: colors.text };
      case "bodyBold":
        return { fontSize: 14, fontWeight: "700" as const, color: colors.text };
      case "label":
        return {
          fontSize: 12,
          fontWeight: "600" as const,
          color: colors.subText,
          letterSpacing: 0.5,
        };
      case "caption":
        return {
          fontSize: 11,
          fontWeight: "400" as const,
          color: colors.subText,
        };
      case "body":
      default:
        return {
          fontSize: 14,
          fontWeight: "400" as const,
          color: colors.text,
          lineHeight: 20,
        };
    }
  };

  return (
    <Text numberOfLines={numberOfLines} style={[getStyleForCategory(), style]}>
      {children}
    </Text>
  );
};

// 3. EarthyGradient
export const EarthyGradient: React.FC<{
  style?: ViewStyle;
  children: React.ReactNode;
  variant?: "primary" | "light" | "earth" | "radialSim";
}> = ({ style, children, variant = "primary" }) => {
  const colors = useThemeColors();

  const getColors = () => {
    switch (variant) {
      case "light":
        return colors.isDark ? ["#121C14", "#16281C"] : ["#F5F5DC", "#E8EAD8"];
      case "earth":
        return colors.isDark ? ["#1B2A1E", "#2A1F1B"] : ["#FFFFFF", "#F2ECE4"];
      case "radialSim":
        return colors.isDark ? ["#1B5E20", "#121C14"] : ["#E8F5E9", "#F5F5DC"];
      case "primary":
      default:
        return colors.isDark ? ["#1B5E20", "#0D2E11"] : ["#1B5E20", "#388E3C"];
    }
  };

  return (
    <LinearGradient
      colors={getColors() as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

// 4. EarthyCard
export const EarthyCard: React.FC<{
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  onPress?: () => void;
  bordered?: boolean;
}> = ({ style, children, onPress, bordered = false }) => {
  const colors = useThemeColors();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: bordered ? 1 : 0,
    },
    !colors.isDark && styles.cardShadow,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// 5. EarthyButton
export const EarthyButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "accent";
  icon?: string;
  style?: ViewStyle;
  disabled?: boolean;
}> = ({ title, onPress, variant = "primary", icon, style, disabled }) => {
  const colors = useThemeColors();

  const getButtonStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.isDark ? "#2A4D31" : "#E8F5E9",
          borderColor: "transparent",
          borderWidth: 0,
          textColor: colors.isDark ? Colors.lightGreen : Colors.darkGreen,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: colors.border,
          borderWidth: 1,
          textColor: colors.text,
        };
      case "accent":
        return {
          backgroundColor: Colors.accentYellow,
          borderColor: "transparent",
          borderWidth: 0,
          textColor: "#2E3A2F",
        };
      case "primary":
      default:
        return {
          backgroundColor: Colors.darkGreen,
          borderColor: "transparent",
          borderWidth: 0,
          textColor: Colors.white,
        };
    }
  };

  const btn = getButtonStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: btn.backgroundColor,
          borderColor: btn.borderColor,
          borderWidth: btn.borderWidth,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={18}
          color={btn.textColor}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={[styles.buttonText, { color: btn.textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// 6. EarthyInput
export const EarthyInput: React.FC<{
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: string;
  style?: ViewStyle;
  keyboardType?: "default" | "email-address" | "numeric";
}> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  icon,
  style,
  keyboardType = "default",
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <ThemeText category="label" style={styles.inputLabel}>
          {label}
        </ThemeText>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.isDark ? "#17251B" : Colors.lightGray,
            borderColor: colors.border,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={18}
            color={colors.subText}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.subText}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
    </View>
  );
};

// 7. HealthScoreGauge (Radial circular progress simulation)
export const HealthScoreGauge: React.FC<{
  score: number;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
}> = ({ score, size = 120, strokeWidth = 10, style }) => {
  const colors = useThemeColors();

  const getScoreColor = () => {
    if (score >= 80) return Colors.lightGreen;
    if (score >= 50) return Colors.accentYellow;
    return Colors.accentOrange;
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Optimal";
    if (score >= 50) return "Moderate";
    return "Depleted";
  };

  // Pure React Native simulation of circular progress using border radius
  return (
    <View style={[styles.gaugeContainer, style]}>
      <View
        style={[
          styles.gaugeOuter,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.border,
            borderWidth: strokeWidth,
          },
        ]}
      >
        {/* Visual score circle indicator */}
        <View
          style={[
            styles.gaugeInner,
            {
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
              backgroundColor: colors.isDark ? "#16281C" : "#F4F6F4",
            },
          ]}
        >
          <Text style={[styles.gaugeScoreText, { color: getScoreColor() }]}>
            {score}
          </Text>
          <ThemeText category="label" style={{ marginTop: 2 }}>
            Score
          </ThemeText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getScoreColor() + "20" },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: getScoreColor() }]}>
              {getScoreLabel()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 8. Custom Nutrient NPK Chart
export const NPKChart: React.FC<{
  n: number; // 0 to 100
  p: number;
  k: number;
  style?: ViewStyle;
}> = ({ n, p, k, style }) => {
  const colors = useThemeColors();

  const renderBar = (
    label: string,
    value: number,
    color: string,
    fullName: string,
  ) => {
    return (
      <View style={styles.chartRow} key={label}>
        <View style={styles.chartLabelCol}>
          <Text style={[styles.chartBarLabel, { color }]}>{label}</Text>
          <ThemeText category="caption">{fullName}</ThemeText>
        </View>
        <View style={styles.chartBarWrapper}>
          <View style={[styles.chartBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.chartBarFill,
                {
                  width: `${value}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.chartValueCol}>
          <ThemeText category="bodyBold">{value}%</ThemeText>
          <ThemeText
            category="caption"
            style={{
              color:
                value >= 70
                  ? Colors.lightGreen
                  : value >= 40
                    ? Colors.accentYellow
                    : Colors.accentOrange,
            }}
          >
            {value >= 70 ? "Optimal" : value >= 40 ? "Average" : "Low"}
          </ThemeText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.chartContainer, style]}>
      {renderBar("N", n, "#42A5F5", "Nitrogen")}
      {renderBar("P", p, "#FFA726", "Phosphorus")}
      {renderBar("K", k, "#66BB6A", "Potassium")}
    </View>
  );
};

// 9. Modern Skeletons & Loading Indicator
export const SkeletonItem: React.FC<{
  width?: any;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width = "100%", height = 15, borderRadius = 4, style }) => {
  const colors = useThemeColors();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        style,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.isDark ? "#283C2F" : Colors.lightGray,
          opacity: animatedValue,
        },
      ]}
    />
  );
};

// 10. AI Loading Pulse animation
export const AILoadingAnimation: React.FC<{
  size?: number;
  style?: ViewStyle;
}> = ({ size = 60, style }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.6,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityValue, {
            toValue: 0.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [scaleValue, opacityValue]);

  return (
    <View
      style={[
        styles.aiPulseContainer,
        { width: size * 1.8, height: size * 1.8 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.aiPulseCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.lightGreen,
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      />
      <View
        style={[
          styles.aiPulseCore,
          {
            width: size - 12,
            height: size - 12,
            borderRadius: (size - 12) / 2,
            backgroundColor: Colors.darkGreen,
          },
        ]}
      >
        <Ionicons name="sparkles" size={size * 0.4} color={Colors.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginVertical: 8,
    borderWidth: 0,
  },
  cardShadow: {
    shadowColor: Colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  button: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  inputContainer: {
    marginVertical: 8,
    width: "100%",
  },
  inputLabel: {
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
    paddingVertical: 0,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeScoreText: {
    fontSize: 32,
    fontWeight: "800",
  },
  statusBadge: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  chartContainer: {
    width: "100%",
    marginVertical: 10,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  chartLabelCol: {
    width: 80,
  },
  chartBarLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  chartBarWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  chartBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  chartValueCol: {
    width: 60,
    alignItems: "flex-end",
  },
  aiPulseContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  aiPulseCircle: {
    position: "absolute",
  },
  aiPulseCore: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
