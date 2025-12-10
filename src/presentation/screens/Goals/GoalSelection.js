import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import SInfoSvg from "../../svgs";

const goals = [
  {
    label: "Buy House",
    icon: SInfoSvg.Home,
    badge: "Long-term",
    description: "Plan and build a corpus for your dream home.",
  },
  {
    label: "Education",
    icon: SInfoSvg.Book,
    badge: "Education goal",
    description: "Create a stress-free education funding plan.",
  },
  {
    label: "Retirement",
    icon: SInfoSvg.Rwtire,
    badge: "Retirement",
    description: "Build a retirement corpus for life after work.",
  },
  {
    label: "Child Education",
    icon: SInfoSvg.ChildEdu,
    badge: "Family",
    description: "Secure your child’s education with a clear plan.",
  },
  {
    label: "Custom goal",
    icon: SInfoSvg.Custom,
    badge: "Flexible",
    description: "Create your own personalized financial goal.",
  },
];

const GoalSelection = ({ onSelect = () => {} }) => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const handleSelect = (label) => {
    setSelectedGoal(label);
    setTimeout(() => onSelect(label), 200); 
  };

  const activeGoal = goals.find((g) => g.label === selectedGoal) || goals[0];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundBlobTop} />
      <View style={styles.backgroundBlobBottom} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Left section */}
        <View style={styles.leftSection}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeIconWrap}>
              {/* <Target size={18} color="#fff" /> */}
            </View>
            <Text style={styles.badgeText}>SMART GOAL-BASED INVESTING</Text>
          </View>

          <Text style={styles.heading}>
            Plan your{" "}
            <Text style={styles.headingGradient}>next financial milestone</Text>
          </Text>

          <Text style={styles.subHeading}>
            Choose a goal and we’ll help you turn it into a clear, actionable
            investment plan with the right amount, horizon, and asset mix.
          </Text>

          {/* Feature rows */}
          <View style={styles.features}>
            <FeatureRow
              icon={<SInfoSvg.Sparkles/>}
              text="Personalized projections based on your inputs"
            />
            <FeatureRow
             icon={<SInfoSvg.target/>}
              text="Goal-based SIP & lumpsum recommendations"
            />
            <FeatureRow
             icon={<SInfoSvg.Right/>}
              text="Curated scheme suggestions aligned to your risk"
            />
          </View>

          {/* Active goal preview */}
          {activeGoal && (
            <View style={styles.previewCard}>
              <View style={styles.previewIconWrap}>
                <activeGoal.icon size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.previewBadgeRow}>
                  <Text style={styles.previewBadge}>{activeGoal.badge}</Text>
                </View>
                <Text style={styles.previewTitle}>{activeGoal.label}</Text>
                <Text style={styles.previewDesc}>{activeGoal.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Right section (grid) */}
        <View style={styles.rightSection}>
          <View style={styles.gridHeaderRow}>
            <View>
              <Text style={styles.gridTitle}>Choose your goal</Text>
              <Text style={styles.gridSubtitle}>
                We’ll guide you step by step based on your choice.
              </Text>
            </View>
            <View style={styles.liveDotRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveDotText}>{goals.length} options</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.label;

              return (
                <TouchableOpacity
                  key={goal.label}
                  onPress={() => handleSelect(goal.label)}
                  activeOpacity={0.85}
                  style={[
                    styles.cardWrap,
                    isSelected && styles.cardWrapSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.card,
                      isSelected && styles.cardSelected,
                    ]}
                  >
                    <View style={styles.cardIconBg}>
                      <Icon size={20} color="#fff" />
                    </View>
                    <Text
                      style={[
                        styles.cardLabel,
                        isSelected && styles.cardLabelSelected,
                      ]}
                    >
                      {goal.label}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {goal.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Pick a goal to begin your plan.</Text>
            <View style={styles.footerLiveRow}>
              <View style={styles.footerLiveDot} />
              <Text style={styles.footerLiveText}>Guided flow</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureRow = ({ icon, text }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIconWrap}>{icon}</View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

export default GoalSelection;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  backgroundBlobTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(59,130,246,0.15)",
  },
  backgroundBlobBottom: {
    position: "absolute",
    bottom: -140,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(129,140,248,0.18)",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    gap: 24,
  },
  leftSection: {
     width: "100%", 
  },
  rightSection: {
    width: "100%", 
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
    marginBottom: 16,
  },
  badgeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 12,
    backgroundColor: "#2B8DF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#475569",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  headingGradient: {
    color: "#2563EB",
  },
  subHeading: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  features: {
    marginTop: 8,
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: "#475569",
  },
  previewCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
     zIndex: 0,
  },
  previewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#2B8DF6",
    justifyContent: "center",
    alignItems: "center",
  },
  previewBadgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  previewBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    color: "#374151",
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  previewDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  gridHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  gridSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  liveDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  liveDotText: {
    fontSize: 11,
    color: "#64748B",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  cardWrap: {
    width: "48%",
  },
  cardWrapSelected: {
    transform: [{ scale: 0.97 }],
  },
  card: {
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  cardSelected: {
    borderColor: "#2B8DF6",
    shadowColor: "#2B8DF6",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },
  cardIconBg: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#2B8DF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "left",
  },
  cardLabelSelected: {
    color: "#1D4ED8",
  },
  cardDesc: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footerLiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  footerLiveText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
