import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
} from "react-native";

const GoalInputStep = ({
  title,
  question,
  placeholder,
  type,
  value,
  options = [],
  onChange,
  onNext,
  onBack,
  onStartOver,
  isFirstStep,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  const isValid = !!value && (type !== "select" || value !== "");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNextClick = () => {
    if (isValid) onNext();
  };

  const isNumber = type === "number";

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      {/* Back button */}
      {!isFirstStep && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      )}

      {/* Start over */}
      {onStartOver && (
        <TouchableOpacity style={styles.resetBtn} onPress={onStartOver}>
          <Text style={styles.resetText}>Start Over</Text>
        </TouchableOpacity>
      )}

      <View style={styles.backgroundCircleTop} />
      <View style={styles.backgroundCircleBottom} />

      <Animated.View
        style={[
          styles.cardWrap,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        <View style={styles.progressBarOuter}>
          <View style={styles.progressBarInner} />
        </View>

        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 24 }}>🎯</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.question}>{question}</Text>

        {/* Input / select */}
        {type === "select" ? (
          <View style={styles.optionsWrap}>
            {options.map((opt) => {
              const selected = value === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionChip,
                    selected && styles.optionChipSelected,
                  ]}
                  onPress={() => onChange(opt)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              keyboardType={isNumber ? "numeric" : "default"}
              value={value}
              onChangeText={onChange}
            />
          </View>
        )}

        {value ? (
          <View style={styles.readyRow}>
            <View style={styles.readyDot} />
            <Text style={styles.readyText}>Ready to continue</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
          onPress={handleNextClick}
          disabled={!isValid}
        >
          <Text style={styles.nextText}>Continue →</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default GoalInputStep;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 20,
  },
  backText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 14,
  },
  resetBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 20,
  },
  resetText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
  backgroundCircleTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: "rgba(59,130,246,0.15)",
  },
  backgroundCircleBottom: {
    position: "absolute",
    bottom: -130,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(234,179,8,0.15)",
  },
  cardWrap: {
    width: "86%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
  },
  progressBarOuter: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 18,
  },
  progressBarInner: {
    height: 4,
    width: "35%",
    backgroundColor: "#2B8DF6",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#1E293B",
    marginBottom: 6,
  },
  question: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 18,
  },
  inputWrap: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  optionChipSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#2B8DF6",
  },
  optionText: {
    fontSize: 13,
    color: "#4B5563",
  },
  optionTextSelected: {
    color: "#2B8DF6",
    fontWeight: "600",
  },
  readyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  readyText: {
    fontSize: 12,
    color: "#16A34A",
  },
  nextBtn: {
    marginTop: 6,
    backgroundColor: "#2B8DF6",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 12,
  },
  nextBtnDisabled: {
    backgroundColor: "#CBD5F5",
  },
  nextText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});
