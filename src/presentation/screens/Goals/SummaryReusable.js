// SummaryReusable.js
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SummaryReusable = ({
  form,
  config,
  onEdit,
  onConfirm,
  image,
  titleField,
  subTitle,
}) => {
  const mainAmount = Number(form[titleField] || 0);
  const mainFormatted = isNaN(mainAmount)
    ? "0"
    : mainAmount.toLocaleString("en-IN");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        
        {/* LEFT CARD */}
        <View style={styles.leftCard}>
          <View style={styles.leftInner}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : null}

            <Text style={styles.leftLabel}>YOU’LL NEED TO INVEST</Text>

            <Text style={styles.leftAmount}>₹ {mainFormatted}</Text>

            {subTitle && (
              <Text style={styles.leftSubtitle}>{subTitle(form)}</Text>
            )}

            {form.lumpsumAvailable ? (
              <Text style={styles.leftLumpsum}>
                + Lumpsum of{" "}
                <Text style={{ fontWeight: "700" }}>
                  ₹{form.lumpsumAvailable}
                </Text>{" "}
                upfront.
              </Text>
            ) : null}

            <TouchableOpacity style={styles.ctaBtn} onPress={onConfirm}>
              <Text style={styles.ctaText}>SEE YOUR PLAN</Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>
              Note: Inflation & return assumptions applied.
            </Text>
          </View>
        </View>

        {/* RIGHT EDIT PANEL */}
        <View style={styles.rightCard}>
          <Text style={styles.rightTitle}>Tap below to edit</Text>

          <View style={styles.fieldsGrid}>
            {config.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.fieldCard}
                onPress={() => onEdit(item.step)}
                activeOpacity={0.9}
              >
                <Text style={styles.fieldLabel}>{item.label}</Text>
                <Text style={styles.fieldValue}>
                  {formatValue(form[item.key])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => onEdit(0)}
            style={styles.editAllBtn}
          >
            <Text style={styles.editAllText}>Edit all inputs</Text>
          </TouchableOpacity>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Consider Inflation</Text>
            <Text style={styles.tipText}>
              Future values may grow significantly due to inflation. Starting
              early helps keep your required investment lower and more
              manageable.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const formatValue = (v) => {
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (v === "" || v === undefined || v === null) return "-";
  if (!isNaN(v)) return v.toString();
  return String(v);
};

export default SummaryReusable;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },
  leftCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  leftInner: {
    padding: 20,
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
    marginBottom: 8,
    opacity: 0.9,
  },
  leftLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#6B7280",
    marginTop: 4,
  },
  leftAmount: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginTop: 10,
  },
  leftSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    textAlign: "center",
  },
  leftLumpsum: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 10,
  },
  ctaBtn: {
    marginTop: 18,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  noteText: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
  },
  rightCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rightTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fieldCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
  },
  fieldLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
  },
  editAllBtn: {
    marginTop: 12,
  },
  editAllText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  tipBox: {
    marginTop: 16,
    backgroundColor: "#DBEAFE",
    borderRadius: 14,
    padding: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  tipText: {
    marginTop: 4,
    fontSize: 12,
    color: "#4B5563",
  },
});
