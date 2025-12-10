import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Target,
  Calendar,
  Coins,
  Percent,
  Sparkles,
  ChartLine,
  PieChart,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { widthToDp } from "../../../helpers/Responsive";
import Svg, { Path } from "react-native-svg";

const safeNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN");
};
const resetGoal = async () => {
  await AsyncStorage.removeItem("selectedGoal");
  setSelectedGoal(null);
};
const WhiteBackButton = props => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    fill="#2563EB" 
    {...props}
  >
    <Path
      d="M224 480h640a32 32 0 110 64H224a32 32 0 010-64z" 
      fill="#2563EB" 
    />
    <Path 
      d="M237.248 512l265.408 265.344a32 32 0 01-45.312 45.312l-288-288a32 32 0 010-45.312l288-288a32 32 0 1145.312 45.312L237.248 512z" 
      fill="#2563EB" 
    />
  </Svg>
);

const SimulationResult = ({ data }) => {
  if (!data) return null;

  const {
    yearsToInvest,
    futureTargetAmount,
    netCorpusNeeded,
    requiredSipMonthly,
    requiredLumpsum,
    allocation,
    projection,
    recommendedSchemes,
    schemeAllocation,
  } = data;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* <TouchableOpacity style={styles.backBtn} onPress={resetGoal}>
           <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <WhiteBackButton />
          </TouchableOpacity>
          <Text style={styles.backBtnText}> Back</Text>
        </TouchableOpacity> */}

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <Target size={26} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Your Investment Plan</Text>
              <Text style={styles.headerSubtitle}>
                Tailored based on your goal inputs
              </Text>
            </View>
          </View>

          <View style={styles.headerBadgeRow}>
            <View style={styles.headerBadge}>
              <Sparkles size={14} color="#059669" />
              <Text style={styles.headerBadgeText}>Plan Generated</Text>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={<Calendar size={18} color="#1D4ED8" />}
            title="Investment Horizon"
            value={`${yearsToInvest} yrs`}
          />
          <MetricCard
            icon={<Target size={18} color="#7C3AED" />}
            title="Future Target Amount"
            value={`₹${safeNumber(futureTargetAmount)}`}
          />
          <MetricCard
            icon={<Coins size={18} color="#059669" />}
            title="Net Corpus Needed"
            value={`₹${safeNumber(netCorpusNeeded)}`}
          />
          <MetricCard
            icon={<Coins size={18} color="#EA580C" />}
            title="Monthly SIP Required"
            value={`₹${safeNumber(requiredSipMonthly)}`}
          />
          <MetricCard
            icon={<Coins size={18} color="#DB2777" />}
            title="Initial Lumpsum"
            value={`₹${safeNumber(requiredLumpsum)}`}
          />
          <MetricCard
            icon={<Percent size={18} color="#2B8DF6" />}
            title="Assumed Returns"
            value=""
          />
        </View>

        {/* Allocation */}
        {allocation && Object.keys(allocation).length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <PieChart size={20} color="#2563EB" />
                <Text style={styles.sectionTitle}>Asset Allocation</Text>
              </View>
              <Text style={styles.sectionSub}>
                Recommended mix based on your risk profile
              </Text>
            </View>

            {Object.entries(allocation).map(([asset, percentage], index) => (
              <View key={asset} style={styles.allocRow}>
                <View style={styles.allocLabelRow}>
                  <View
                    style={[
                      styles.allocDot,
                      {
                        backgroundColor:
                          allocColors[index % allocColors.length],
                      },
                    ]}
                  />
                  <Text style={styles.allocLabel}>{asset}</Text>
                </View>
                <Text style={styles.allocPercent}>{percentage}%</Text>
                <View style={styles.allocBarOuter}>
                  <View
                    style={[
                      styles.allocBarInner,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          allocColors[index % allocColors.length],
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projection */}
        {projection && projection.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <ChartLine size={20} color="#059669" />
                <Text style={styles.sectionTitle}>Projection Over Time</Text>
              </View>
              <Text style={styles.sectionSub}>
                Estimated value growth by year
              </Text>
            </View>

            {projection.slice(-5).map((p, idx) => {
              const prev = projection[idx - 1];
              const lastValue = projection[projection.length - 1].value || 1;
              const widthPct = (p.value / lastValue) * 100;

              let growthPct = null;
              if (idx > 0 && prev?.value) {
                growthPct = ((p.value / prev.value - 1) * 100).toFixed(1);
              }

              return (
                <View key={p.year} style={styles.projItem}>
                  <View style={styles.projRowTop}>
                    <Text style={styles.projYear}>Year {p.year}</Text>
                    <Text style={styles.projAmount}>
                      ₹{safeNumber(p.value)}
                    </Text>
                  </View>
                  {growthPct && (
                    <Text style={styles.projGrowth}>
                      +{growthPct}% vs previous
                    </Text>
                  )}
                  <View style={styles.projBarOuter}>
                    <View
                      style={[styles.projBarInner, { width: `${widthPct}%` }]}
                    />
                  </View>
                </View>
              );
            })}

            <View style={styles.projFooter}>
              <View style={styles.projFooterRow}>
                <Text style={styles.projFooterLabel}>Starting value</Text>
                <Text style={styles.projFooterValue}>
                  ₹{safeNumber(projection[0]?.value)}
                </Text>
              </View>
              <View style={styles.projFooterRow}>
                <Text style={styles.projFooterLabel}>
                  Projected final value
                </Text>
                <Text style={[styles.projFooterValue, { fontWeight: "700" }]}>
                  ₹{safeNumber(projection[projection.length - 1]?.value)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recommended Schemes */}
        {recommendedSchemes && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color="#A855F7" />
                <Text style={styles.sectionTitle}>Recommended Schemes</Text>
              </View>
              <Text style={styles.sectionSub}>
                Based on your time horizon & risk
              </Text>
            </View>

            {recommendedSchemes.equity &&
              recommendedSchemes.equity.length > 0 && (
                <SchemeCategory
                  title="Equity Funds"
                  schemes={recommendedSchemes.equity}
                />
              )}

            {recommendedSchemes.debt && recommendedSchemes.debt.length > 0 && (
              <SchemeCategory
                title="Debt Funds"
                schemes={recommendedSchemes.debt}
              />
            )}
          </View>
        )}

        {/* Scheme allocation */}
        {schemeAllocation && schemeAllocation.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color="#2B8DF6" />
                <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
              </View>
              <Text style={styles.sectionSub}>Split across specific funds</Text>
            </View>

            {schemeAllocation.map((scheme, index) => (
              <View key={index} style={styles.allocCard}>
                <View style={styles.allocCardHeader}>
                  <View
                    style={[
                      styles.allocCardIcon,
                      {
                        backgroundColor:
                          allocColors[index % allocColors.length],
                      },
                    ]}
                  >
                    <Text style={styles.allocCardIconText}>
                      {scheme.schemeName?.charAt(0) || "F"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.allocCardTitle}>
                      {scheme.schemeName}
                    </Text>
                    {scheme.schemeCode && (
                      <Text style={styles.allocCardCode}>
                        Code: {scheme.schemeCode}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.allocCardPercent}>
                      {scheme.percentage?.toFixed(1) || "0.0"}%
                    </Text>
                    {scheme.amount && (
                      <Text style={styles.allocCardAmount}>
                        ₹{scheme.amount.toFixed(0)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const allocColors = ["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

const MetricCard = ({ icon, title, value }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricIcon}>{icon}</View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </View>
);

const SchemeCategory = ({ title, schemes }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.schemeCategoryTitle}>{title}</Text>
    {schemes.map((s, i) => (
      <View key={i} style={styles.schemeCard}>
        <Text style={styles.schemeName}>{s.schemeName}</Text>
        <View style={styles.schemeReturnsRow}>
          {s.return1y != null && (
            <Text style={styles.schemeReturn}>1Y: {s.return1y}%</Text>
          )}
          {s.return3y != null && (
            <Text style={styles.schemeReturn}>3Y: {s.return3y}%</Text>
          )}
          {s.return5y != null && (
            <Text style={styles.schemeReturn}>5Y: {s.return5y}%</Text>
          )}
        </View>
      </View>
    ))}
  </View>
);

export default SimulationResult;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  backgroundTop: {
    position: "absolute",
    top: -140,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(191,219,254,0.6)",
  },
  backgroundBottom: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(209,250,229,0.5)",
  },
  container: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    paddingBottom: 32,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#2B8DF6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  headerBadgeRow: {
    marginLeft: 10,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(220,252,231,0.9)",
  },
  headerBadgeText: {
    fontSize: 11,
    color: "#15803D",
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    width: "48%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  metricTitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  sectionCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  allocRow: {
    marginTop: 8,
  },
  allocLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  allocDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
  },
  allocLabel: {
    fontSize: 13,
    color: "#111827",
    flex: 1,
  },
  allocPercent: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  allocBarOuter: {
    marginTop: 4,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  allocBarInner: {
    height: 6,
    borderRadius: 999,
  },
  projItem: {
    marginTop: 8,
  },
  projRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projYear: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  projAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  projGrowth: {
    fontSize: 11,
    color: "#16A34A",
    marginTop: 2,
  },
  projBarOuter: {
    marginTop: 4,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  projBarInner: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  projFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  projFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  projFooterLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  projFooterValue: {
    fontSize: 12,
    color: "#111827",
  },
  schemeCategoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  schemeCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  schemeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  schemeReturnsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  schemeReturn: {
    fontSize: 11,
    color: "#4B5563",
  },
  allocCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  allocCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  allocCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  allocCardIconText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  allocCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  allocCardCode: {
    fontSize: 11,
    color: "#6B7280",
  },
  allocCardPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
  },
  allocCardAmount: {
    fontSize: 12,
    color: "#4B5563",
    textAlign: "right",
  },
  backBtn: {
    // paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    flexDirection: "row",
  },
  backBtnText: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "600",
  },
  backButton: {
    // marginRight: widthToDp(4),
  },
});
