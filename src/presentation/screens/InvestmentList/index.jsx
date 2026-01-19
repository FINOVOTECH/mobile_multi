import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  BackHandler,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from "react-native";
import { useDispatch } from "react-redux";
import InvestedPorfolio from "../../../hooks/investedPortfolio";
import { setSipInterface } from "../../../store/slices/marketSlice";
import Loader from "../../../components/handAnimation";
import * as Config from "../../../helpers/Config";
import { heightToDp } from "../../../helpers/Responsive";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const InvestmentList = ({ navigation }) => {
  const dispatch = useDispatch();
  const { investmentData, loading, error, refetch } = InvestedPorfolio();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedSchemes, setExpandedSchemes] = useState({});
  const [activeView, setActiveView] = useState("SIP");
  const [expandedProvisionals, setExpandedProvisionals] = useState({});

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  const formatCurrency = (amount) =>
    `₹${parseFloat(amount ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const isEmptyData =
    !investmentData ||
    !investmentData.sipSummary ||
    Object.keys(investmentData.sipSummary.schemes || {}).length === 0;

  const sipSummary = investmentData?.sipSummary || {};
  const schemes = sipSummary?.schemes || {};
  const schemeArray = Object.values(schemes);
  const lumpsumSummary = investmentData?.lumpsumSummary || {};

  const activeSIPs = sipSummary?.activeSIPs || 0;
  const totalLumpsums = lumpsumSummary?.totalLumpsums || 0;
  const totalSIPs = sipSummary?.totalSIPs || 0;

  const totals = investmentData?.portfolioSummary?.overall || {};
  const totalInvested = parseFloat(totals?.invested || 0);
  const totalCurrentValue = parseFloat(totals?.currentValue || 0);
  const totalGainLoss = parseFloat(totals?.gainAmount || 0);
  const totalReturnPercent = parseFloat(totals?.gainPercent || 0);

  const overallGainLoss = {
    gain: totalGainLoss,
    percentage: totalReturnPercent,
  };

  const getSchemeWiseSIPs = () => {
    if (!sipSummary.schemes) return [];
    return Object.entries(sipSummary.schemes).map(
      ([schemeCode, schemeData]) => ({
        schemeCode,
        schemeName: schemeData.schemeName || "Unnamed Scheme",
        ISIN: schemeData.ISIN,
        SIPs: schemeData.SIPs || [],
        active: schemeData.active ?? 0,
        cancelled: schemeData.cancelled ?? 0,
        totalSIPs: schemeData.totalSIPs ?? (schemeData.SIPs || []).length,
      })
    );
  };

  const schemeWiseSIPs = getSchemeWiseSIPs();
  const getAllottedUnitsFromBSE = (sipRegnNo) => {
    if (!investmentData?.bseAllotments || !sipRegnNo) return 0;
    const matching = investmentData.bseAllotments.find(
      (a) => a.SIPRegnNo === sipRegnNo
    );
    return matching ? parseFloat(matching.originalAllottedUnits.toFixed(2)) || 0 : 0;
  };
  const getAllotmentData = (sipRegnNo) => {
    if (!investmentData?.bseAllotments || !sipRegnNo) return null;
    return investmentData?.bseAllotments.find((a) => a.SIPRegnNo === sipRegnNo);
  };

  const toggleSchemeExpand = (schemeIdx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSchemes((prev) => ({
      ...prev,
      [schemeIdx]: {
        ...(prev[schemeIdx] || { expanded: false, sips: {} }),
        expanded: !(prev[schemeIdx]?.expanded || false),
      },
    }));
  };

  const toggleProvisionalExpand = (index) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedProvisionals((prev) => ({
    ...prev,
    [index]: !prev[index],
  }));
};

  const isSIPActive = (sip) =>
    sip?.status === "SUCCESS" ||
    sip?.orderConfirmationStatus === "ORDER CONFIRMED";

  const isSIPCancelled = (sip) =>
    sip?.status === "CANCEL" || sip?.status === "CANCELLED";

  const isSIPPending = (sip) =>
    sip?.status === "RECO_PENDING" || sip?.status === "PENDING";

  const isSIPProvisional = (sip) =>
    sip?.orderConfirmationStatus === "PROVISIONAL ORDER IN PROGRESS";

  const isRedeemAllowed = (order) => order?.status === "SUCCESS";

  const textOrNA = (val) =>
    val !== undefined && val !== null && val !== "" ? val : "NA";

  const numberOrZero = (val) =>
    val !== undefined && val !== null && !isNaN(val) ? Number(val) : 0;
  const groupedBSEAllotments = (investmentData?.bseAllotments || [])
    .filter(
      (item) =>
        item?.orderStatus === "VALID" ||
        item?.orderConfirmationStatus === "PROVISIONAL ORDER IN PROGRESS"
    )
    .reduce((acc, item) => {
      const key = item.schemeCode || "UNKNOWN";

      if (!acc[key]) {
        acc[key] = {
          schemeCode: item.schemeCode || "NA",
          schemeName: item.schemeName || "NA",
          ISIN: item.ISIN || "NA",
          allotments: [],
        };
      }

      acc[key].allotments.push(item);
      return acc;
    }, {});

  const BSEAllotmentCard = ({ scheme }) => (
    <View style={styles.schemeCard}>
      <View style={styles.schemeCardHeader}>
        <View style={styles.schemeHeaderContent}>
          <Text style={styles.schemeCardTitle}>{scheme.schemeName}</Text>
          <Text style={styles.schemeCardSubtitle}>{scheme.schemeCode}</Text>
        </View>
      </View>

      {scheme.allotments.map((item, i) => (
        <View key={i} style={styles.allotmentCard}>
          <View style={styles.allotmentHeader}>
            <Text style={styles.allotmentTitle}>
              Order: {textOrNA(item.orderNo)}
            </Text>
            <Text
              style={[
                styles.statusPill,
                item.orderConfirmationStatus ===
                  "PROVISIONAL ORDER IN PROGRESS" && styles.provisional,
              ]}
            >
              {item.orderConfirmationStatus === "PROVISIONAL ORDER IN PROGRESS"
                ? "Provisional"
                : "Confirmed"}
            </Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Units</Text>
              <Text style={styles.detailValue}>
                {numberOrZero(item.originalAllottedUnits.toFixed(2))}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                ₹{numberOrZero(item.investedAmount.toFixed(2))}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Current Value</Text>
              <Text style={styles.detailValue}>
                ₹{numberOrZero(item.currentValue)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const LumpsumCard = ({ scheme }) => (
    <View style={styles.schemeCard}>
      <View style={styles.schemeCardHeader}>
        <View style={styles.schemeHeaderContent}>
          <Text style={styles.schemeCardTitle}>{scheme?.schemeName}</Text>
          <Text style={styles.schemeCardSubtitle}>{scheme?.schemeCode}</Text>
        </View>
      </View>

      {scheme?.orders.map((order, i) => (
        <View key={i} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Order: {order?.orderNo}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Units</Text>
              <Text style={styles.detailValue}>
                {numberOrZero(order?.allottedUnit)}
              </Text>
            </View>
            {/* <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                ₹{numberOrZero(order.amount)}
              </Text>
            </View> */}
          </View>

          <View style={styles.actionContainer}>
            {isRedeemAllowed(order) ? (
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => {
                  dispatch(
                    setSipInterface({
                      investmentType: "LUMPSUM",
                      // scheme,
                      allotmentData: {
                        ...order,
                        schemeName: scheme?.schemeName,
                      },
                      sip: scheme?.orders?.[0],
                    })
                  );
                  navigation.navigate("SipInterface");
                }}
              >
                <Text style={styles.redeemTxt}>Redeem</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.disabledContainer}>
                <Text style={styles.disabledTxt}>Redeem Not Available</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const SchemeCard = ({ scheme, index: schemeIndex }) => {
    if (!scheme) return null;
    const schemeSIPs = Array.isArray(scheme.SIPs) ? scheme.SIPs : [];
    const schemeExpanded = !!expandedSchemes[schemeIndex]?.expanded;

    return (
      <View style={styles.schemeCard}>
        <TouchableOpacity
          style={styles.schemeCardHeader}
          onPress={() => toggleSchemeExpand(schemeIndex)}
          activeOpacity={0.5}
        >
          <View style={styles.schemeHeaderContent}>
            <Text style={styles.schemeCardTitle}>{scheme.schemeName}</Text>
            <Text style={styles.schemeCardSubtitle}>{scheme.schemeCode}</Text>
            <Text style={styles.schemeCardSubtitleSmall}>{scheme.ISIN}</Text>
          </View>
          <Text style={styles.arrowIcon}>{schemeExpanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        <View style={styles.sipStatsRow}>
          <View style={[styles.statPill, styles.statPillDefault]}>
            <Text style={styles.statPillText}>Total: {schemeSIPs.length}</Text>
          </View>
          <View style={[styles.statPill, styles.statPillActive]}>
            <Text style={styles.statPillText}>
              Active: {schemeSIPs.filter(isSIPActive).length}
            </Text>
          </View>
          <View style={[styles.statPill, styles.statPillCancelled]}>
            <Text style={styles.statPillText}>
              Cancelled: {schemeSIPs.filter(isSIPCancelled).length}
            </Text>
          </View>
        </View>

        {schemeExpanded &&
          schemeSIPs.map((sip, sipIndex) => {
            const allottedUnits = getAllottedUnitsFromBSE(sip.SIPRegnNo);
            const allotmentData = getAllotmentData(sip.SIPRegnNo);
            return (
              <TouchableOpacity
                key={`${schemeIndex}-${sipIndex}-${sip?.SIPRegnNo}`}
                onPress={() => {
                  dispatch(setSipInterface({ allotmentData, sip }));
                  navigation.navigate("SipInterface");
                }}
                activeOpacity={0.85}
                style={styles.sipItemCard}
              >
                <View style={styles.sipItemHeader}>
                  <Text style={styles.sipItemTitle}>SIP: {sip.SIPRegnNo}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isSIPActive(sip) && styles.statPillActive,
                      isSIPCancelled(sip) && styles.statPillCancelled,
                      isSIPProvisional(sip) && styles.provisional,
                    ]}
                  >
                    <Text style={styles.statusPillText}>
                      {isSIPActive(sip)
                        ? "Active"
                        : isSIPCancelled(sip)
                        ? "Cancelled"
                        : isSIPProvisional(sip)
                        ? "Provisional"
                        : "Pending"}
                    </Text>
                  </View>
                </View>

                <View style={styles.sipDetailsGrid}>
                  <View style={styles.sipDetailItem}>
                    <Text style={styles.sipDetailLabel}>Order</Text>
                    <Text style={styles.sipDetailValue}>
                      {allotmentData?.orderNo ?? "--"}
                    </Text>
                  </View>
                  <View style={styles.sipDetailItem}>
                    <Text style={styles.sipDetailLabel}>Units</Text>
                    <Text style={styles.sipDetailValue}>{allottedUnits}</Text>
                  </View>
                  <View style={styles.sipDetailItem}>
                    <Text style={styles.sipDetailLabel}>Amount</Text>
                    <Text style={styles.sipDetailValue}>
                      ₹{allotmentData?.investedAmount? allotmentData?.investedAmount.toFixed(2) : "-"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>
    );
  };

  const SipSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryBlockRow}>
        <View style={[styles.summaryBlock, { backgroundColor: "#EEF2FF" }]}>
          <Text style={styles.summaryBlockLabel}>Total SIPs</Text>
          <Text style={styles.summaryBlockValue}>{totalSIPs}</Text>
        </View>
        <View style={[styles.summaryBlock, { backgroundColor: "#D1FAE5" }]}>
          <Text style={styles.summaryBlockLabel}>Active SIPs</Text>
          <Text style={[styles.summaryBlockValue, { color: "#059669" }]}>
            {activeSIPs}
          </Text>
        </View>
        <View style={[styles.summaryBlock, { backgroundColor: "#FEE2E2" }]}>
          <Text style={styles.summaryBlockLabel}>Lumpsums</Text>
          <Text style={[styles.summaryBlockValue, { color: "#991B1B" }]}>
            {totalLumpsums}
          </Text>
        </View>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryBottomRow}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryColumnLabel}>Invested</Text>
          <Text style={styles.summaryColumnValue}>
            {formatCurrency(totalInvested)}
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryColumnLabel}>Gain/Loss</Text>
          <Text
            style={[
              styles.summaryColumnValue,
              styles.gainLossValue,
              overallGainLoss.gain >= 0 ? styles.gain : styles.loss,
            ]}
          >
            {overallGainLoss.gain >= 0 ? "+" : ""}
            {formatCurrency(overallGainLoss.gain)}
          </Text>
          <Text
            style={[
              styles.summaryColumnPercent,
              overallGainLoss.gain >= 0 ? styles.gain : styles.loss,
            ]}
          >
            ({overallGainLoss.gain >= 0 ? "+" : ""}
            {overallGainLoss.percentage.toFixed(2)}%)
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryColumnLabel}>Current</Text>
          <Text style={styles.summaryColumnValue}>
            {formatCurrency(totalCurrentValue)}
          </Text>
        </View>
      </View>
    </View>
  );

const ProvisionalOrderCard = ({ order, index }) => {
  const expanded = !!expandedProvisionals[index];

  return (
    <View style={styles.schemeCard}>
      {/* Header */}
      <TouchableOpacity
        style={styles.schemeCardHeader}
        activeOpacity={0.7}
        onPress={() => toggleProvisionalExpand(index)}
      >
        <View style={styles.schemeHeaderContent}>
          <Text style={styles.schemeCardTitle}>
            {order.schemeName || "Unknown Scheme"}
          </Text>

          <Text style={styles.schemeCardSubtitle}>
            {order.schemaCode||order?.schemeCode || "--"}
          </Text>

          {/* <Text style={styles.schemeCardSubtitleSmall}>
            Reg No: {order.registrationId || "--"}
          </Text> */}
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <View style={[styles.statusPill, styles.provisional]}>
            <Text style={styles.statusPillText}>Provisional</Text>
          </View>

          <Text style={styles.arrowIcon}>
            {expanded ? "▲" : "▼"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Collapsed quick info */}
      {!expanded && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        {(order.orderValue || order.frequencyType) && (
  <View style={styles.detailsGrid}>
    {order.orderValue && (
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Order Value</Text>
        <Text style={styles.detailValue}>₹{order.orderValue}</Text>
      </View>
    )}

    {order.frequencyType && (
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Frequency</Text>
        <Text style={styles.detailValue}>{order.frequencyType}</Text>
      </View>
    )}
  </View>
)}

        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>{order.orderId}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>SIP Start Date</Text>
              <Text style={styles.detailValue}>{order.sipStartDate}</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Installments</Text>
              <Text style={styles.detailValue}>
                {order.noOfInstallment || "NA"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pending</Text>
              <Text style={styles.detailValue}>
                {order.pendingInstallments}
              </Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Completed</Text>
              <Text style={styles.detailValue}>
                {order.completedInstallments}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>
                {order.referenceNumber}
              </Text>
            </View>
          </View>

          {order.bseRemarks && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.detailLabel}>BSE Remarks</Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                {order.bseRemarks}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 8 }}>
            <Text style={styles.detailLabel}>Created At</Text>
            <Text style={styles.detailValue}>
              {new Date(order.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};


  const TabHeader = () => {
    const tabs = [
      { id: "all", label: "All Schemes", count: schemeArray.length },
      {
        id: "active",
        label: "Active",
        count: schemeArray.filter((s) => s.active > 0).length,
      },
      {
        id: "cancelled",
        label: "Cancelled",
        count: schemeArray.filter((s) => s.cancelled > 0).length,
      },
    ];
    return (
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabBtnTxt,
                activeTab === tab.id && styles.tabBtnTxtActive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === tab.id && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeTxt,
                  activeTab === tab.id && styles.tabBadgeTxtActive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const ViewToggle = () => (
    <View style={styles.viewToggleRow}>
      {["SIP", "BSE", "LUMPSUM"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.viewToggleBtn,
            activeView === tab && styles.viewToggleBtnActive,
          ]}
          onPress={() => setActiveView(tab)}
        >
          <Text
            style={[
              styles.viewToggleTxt,
              activeView === tab && styles.viewToggleTxtActive,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Text style={styles.emptyStateIconText}>💼</Text>
      </View>
      <Text style={styles.emptyStateTitle}>No Investments Yet</Text>
      <Text style={styles.emptyStateMessage}>
        You haven't started any SIP investments yet. Start your investment
        journey today!
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("SipScheme")}
        style={styles.startBtn}
      >
        <Text style={styles.startBtnTxt}>Start Investing</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Loader />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Data</Text>
          <Text style={styles.errorMessage}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>My Investments</Text>
        <Text style={styles.navbarSubtitle}>SIP Portfolio</Text>
      </View>
    <View style={styles.viewToggleRow}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.viewToggleScroll}
  >
    {["SIP", "ALLOTMENTS", "PROVISIONAL", "LUMPSUM"].map((tab) => (
      <TouchableOpacity
        key={tab}
        style={[
          styles.viewToggleBtn,
          activeView === tab && styles.viewToggleBtnActive,
        ]}
        onPress={() => setActiveView(tab)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.viewToggleTxt,
            activeView === tab && styles.viewToggleTxtActive,
          ]}
        >
          {tab}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>


      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeView === "SIP" && (
          <View style={styles.contentContainer}>
            <SipSummaryCard />
            {schemeWiseSIPs.length > 0 ? (
              schemeWiseSIPs.map((scheme, idx) => (
                <SchemeCard
                  index={idx}
                  key={scheme?.schemeCode || idx}
                  scheme={scheme}
                />
              ))
            ) : (
              <View style={styles.emptyTabState}>
                <Text style={styles.emptyTabStateText}>
                  {activeTab === "all"
                    ? "No investment schemes found"
                    : `No ${activeTab} schemes found`}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeView === "ALLOTMENTS" && (
          <View style={styles.contentContainer}>
            {Object.values(groupedBSEAllotments).length > 0 ? (
              Object.values(groupedBSEAllotments).map((scheme, idx) => (
                <BSEAllotmentCard key={idx} scheme={scheme} />
              ))
            ) : (
              <View style={styles.emptyTabState}>
                <Text style={styles.emptyTabStateText}>
                  No BSE allotments found
                </Text>
              </View>
            )}
          </View>
        )}

        {activeView === "LUMPSUM" && (
          <View style={styles.contentContainer}>
            {Object.values(investmentData?.lumpsumSummary?.schemes || {})
              .length > 0 ? (
              Object.values(investmentData?.lumpsumSummary?.schemes || {}).map(
                (scheme, idx) => <LumpsumCard key={idx} scheme={scheme} />
              )
            ) : (
              <View style={styles.emptyTabState}>
                <Text style={styles.emptyTabStateText}>
                  No lumpsum investments found
                </Text>
              </View>
            )}
          </View>
        )}

       {activeView === "PROVISIONAL" && (
  <View style={styles.contentContainer}>
    {Array.isArray(investmentData?.provisionalOrders) &&
    investmentData.provisionalOrders.length > 0 ? (
      investmentData.provisionalOrders.map((order, idx) => (
        <ProvisionalOrderCard
          key={order._id || idx}
          order={order}
          index={idx}
        />
      ))
    ) : (
      <View style={styles.emptyTabState}>
        <Text style={styles.emptyTabStateText}>
          No provisional orders found
        </Text>
      </View>
    )}
  </View>
)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  androidStatusBar: {
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  contentContainer: {
    paddingBottom: 80,
  },
  navbar: {
    paddingTop: 20,
    backgroundColor: "#2B8DF6",
    paddingBottom: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  navbarTitle: {
    fontSize: 24,
    color: "#FFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  navbarSubtitle: {
    fontSize: 14,
    color: "#E9F0FF",
    marginTop: 4,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#0001",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryBlockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryBlock: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 6,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  summaryBlockLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
    fontWeight: "600",
  },
  summaryBlockValue: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "700",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  summaryBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryColumn: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  summaryColumnLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
    fontWeight: "600",
  },
  summaryColumnValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
  },
  gainLossValue: {
    fontSize: 15,
    fontWeight: "bold",
  },
  summaryColumnPercent: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  gain: { color: "#059669" },
  loss: { color: "#EF4444" },
  viewToggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  viewToggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: "center",
  },
  viewToggleBtnActive: {
    backgroundColor: "#1568dcff",
  },
  viewToggleTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4683e5ff",
  },
  viewToggleTxtActive: {
    color: "#FFFFFF",
  },
  schemeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#0001",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    overflow: "hidden",
  },
  schemeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  schemeHeaderContent: {
    flex: 1,
  },
  schemeCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  schemeCardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  schemeCardSubtitleSmall: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: "#4F46E5",
    fontWeight: "bold",
    marginLeft: 12,
  },
  sipStatsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statPillDefault: {
    backgroundColor: "#EFF6FF",
  },
  statPillActive: {
    backgroundColor: "#D1FAE5",
  },
  statPillCancelled: {
    backgroundColor: "#FEE2E2",
  },
  sipItemCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sipItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sipItemTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  sipDetailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sipDetailItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  sipDetailLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  sipDetailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  allotmentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  allotmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  allotmentTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderHeader: {
    marginBottom: 16,
  },
  orderTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#374151",
  },
  actionContainer: {
    marginTop: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  provisional: {
    backgroundColor: "#FEF3C7",
  },
  redeemBtn: {
    backgroundColor: "#3a7fedff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  redeemTxt: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledTxt: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateIconText: { fontSize: 40 },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateMessage: {
    color: "#6B7280",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 2,
  },
  startBtnTxt: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#6B7280",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyTabState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTabStateText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  viewToggleScroll: {
  paddingHorizontal: 8,
  alignItems: "center",
},
});

export default InvestmentList;
