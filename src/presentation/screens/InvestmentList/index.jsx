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
import LinearGradient from "react-native-linear-gradient";
import InvestedPorfolio from "../../../hooks/investedPortfolio";
import { setSipInterface } from "../../../store/slices/marketSlice";
import Loader from "../../../components/handAnimation";
import * as Config from "../../../helpers/Config";
import { heightToDp, widthToDp } from "../../../helpers/Responsive";
import { SafeAreaView } from "react-native-safe-area-context";
import SInfoSvg from "../../svgs";

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
  const [expandedAllotments, setExpandedAllotments] = useState({});
  const [dataSource, setDataSource] = useState('BSE'); // 'BSE' | 'BACKOFFICE'
  const exchangePreference = String(Config?.RuntimeTenant?.exchangePreference || "BOTH").toUpperCase();
  const sourceTabs = exchangePreference === "BSE"
    ? [{ key: "BSE", label: "BSE" }]
    : exchangePreference === "NSE"
      ? [{ key: "BACKOFFICE", label: "NSE" }]
      : [{ key: "BSE", label: "BSE" }, { key: "BACKOFFICE", label: "NSE" }];

  // Update active view when data source changes
  useEffect(() => {
    if (dataSource === 'BACKOFFICE') {
      setActiveView('ALL');
    } else {
      setActiveView('SIP');
    }
  }, [dataSource]);

  useEffect(() => {
    if (exchangePreference === "NSE" && dataSource !== "BACKOFFICE") {
      setDataSource("BACKOFFICE");
    }
  }, [exchangePreference, dataSource]);

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
    !investmentData.sipSummaryAggregated ||
    Object.keys(investmentData.sipSummaryAggregated.schemes || {}).length === 0;

  const sipSummary = investmentData?.sipSummaryAggregated || {};
  const schemes = sipSummary?.schemes || {};
  const schemeArray = Object.values(schemes);
  const lumpsumSummary = investmentData?.lumpsumSummary || {};

  const activeSIPs = sipSummary?.activeSIPs || 0;
  const totalLumpsums = lumpsumSummary?.totalLumpsums || 0;
  const totalSIPs = sipSummary?.totalSIPs || 0;

  const totals = investmentData?.portfolioSummary?.bse?.overall || {};
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

  const toggleAllotmentExpand = (schemeIdx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAllotments((prev) => ({
      ...prev,
      [schemeIdx]: !prev[schemeIdx],
    }));
  };

  const isRedeemAllowed = (order) => order?.netUnits > 0;

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
          total: 0,
          active: 0,
          cancelled: 0,
        };
      }

      acc[key].allotments.push(item);
      acc[key].total += 1;
      if (item.orderStatus === "VALID") {
        acc[key].active += 1;
      } else if (item.orderStatus === "CANCELLED") {
        acc[key].cancelled += 1;
      }
      return acc;
    }, {});

  const BSEAllotmentCard = ({ scheme, index: schemeIdx }) => {
    const isExpanded = !!expandedAllotments[schemeIdx];
    return (
      <View style={styles.schemeCard}>
        <TouchableOpacity style={styles.allotmentHeaderContainer} onPress={() => toggleAllotmentExpand(schemeIdx)}>
          <View style={styles.schemeHeaderContent}>
            <Text style={styles.schemeCardTitle}>{scheme.schemeName}</Text>
            <Text style={styles.schemeCardSubtitle}>Scheme Code: {scheme.schemeCode}</Text>
            <Text style={styles.schemeCardSubtitle}>ISIN: {scheme.ISIN}</Text>
          </View>
          <TouchableOpacity
            style={styles.hideShowBtn}

          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* <Text style={[styles.arrowIcon, { color: '#FFF', fontSize: 14, marginRight: 8, marginLeft: 0 }]}>
                {isExpanded ? "▲" : "▼"}
              </Text> */}
              <Text style={styles.arrowIcon}>{isExpanded ? "▲" : "▼"}</Text>
              {/* <Text style={styles.hideShowBtnText}>{isExpanded ? "Hide" : "Show"}</Text> */}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.allotmentStatsRow}>
          <View style={[styles.allotmentStatPill, styles.totalPill]}>
            <Text style={styles.allotmentStatText}>Total SIPs: {scheme.total}</Text>
          </View>
          <View style={[styles.allotmentStatPill, styles.activePill]}>
            <Text style={styles.allotmentStatText}>Active: {scheme.active}</Text>
          </View>
          <View style={[styles.allotmentStatPill, styles.cancelledPill]}>
            <Text style={styles.allotmentStatText}>Cancelled: {scheme.cancelled}</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.allotmentListContainer}>
            {scheme.allotments.map((item, i) => (
              <View key={i} style={styles.orderDetailCard}>
                <View style={[styles.orderDetailHeader, { marginBottom: 8 }]}>
                  <Text style={styles.orderDetailSchemeName}>{item.schemeName}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderDetailAmount}>₹ {item.investedRemaining?.toFixed(2) || item.currentValue?.toFixed(2) || "0.00"}</Text>
                    <Text style={[styles.orderDetailGain, { color: (item.gainAmount || 0) >= 0 ? "#10B981" : "#EF4444" }]}>
                      {(item.gainAmount || 0) >= 0 ? "+" : ""}{item.gainAmount} ({item.gainPercent || 0}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetailRow}>
                  <View style={styles.orderDetailCol}>
                    <Text style={styles.orderDetailLabel}>Order No: {item.orderNo}</Text>
                    <Text style={styles.orderDetailLabel}>Folio No: {item.folioNo}</Text>
                    <Text style={styles.orderDetailLabel}>Order Date: {item.orderDate}</Text>
                    <Text style={styles.orderDetailLabel}>
                      Units: <Text style={styles.orderDetailBold}>{item.originalAllottedUnits}</Text> | Allotted NAV: <Text style={styles.orderDetailBold}>₹{item.allottedNav}</Text>
                    </Text>
                  </View>
                  <View style={[styles.orderDetailCol, { alignItems: 'flex-end', justifyContent: 'flex-end' }]}>
                    <Text style={styles.orderDetailSecondaryLabel}>Current: ₹ {item.currentValue}</Text>
                    <Text style={styles.orderDetailSecondaryLabel}>Current NAV: ₹{item.currentNav}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const LumpsumCard = ({ scheme }) => {
    // { console.log("isRedeemAllowed", isRedeemAllowed(order)) }
    return (
      <View style={styles.schemeCard}>
        <View style={styles.schemeCardHeader}>
          <View style={styles.schemeHeaderContent}>
            <Text style={styles.schemeCardTitle}>{scheme?.schemeName}</Text>
            <Text style={styles.schemeCardSubtitle}>{scheme?.schemeCode}</Text>
          </View>
        </View>

        {/* Safety check: ensure orders exists before mapping */}
        {/* {(scheme || []).map((order, i) => { */}
        {/* {console.log("isRedeemAllowed", isRedeemAllowed(order))} */}
        {/* return ( */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Invested: {scheme?.investedAmount}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Current Value</Text>
              <Text style={styles.detailValue}>
                {scheme?.currentValue}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Units</Text>
              <Text style={styles.detailValue}>
                {scheme?.netUnits}
              </Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            {isRedeemAllowed(scheme) ? (
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => {
                  dispatch(
                    setSipInterface({
                      investmentType: "LUMPSUM",
                      allotmentData: {
                        ...scheme,
                        schemeName: scheme?.schemeName,
                      },
                      sip: scheme, // Potentially risky if empty
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
        {/* ) */}
        {/* })} */}
      </View>
    );
  }

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
                  {/* <View
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
                  </View> */}
                </View>

                <View style={styles.sipDetailsGrid}>
                  <View style={styles.sipDetailItem}>
                    <Text style={styles.sipDetailLabel}>Order</Text>
                    <Text style={styles.sipDetailValue}>
                      {sip?.orderNo ?? "--"}
                    </Text>
                  </View>
                  <View style={styles.sipDetailItem}>
                    <Text style={styles.sipDetailLabel}>Units</Text>
                    <Text style={styles.sipDetailValue}>{sip?.netUnits}</Text>
                  </View>
                  <View style={styles.sipDetailItem}>
                    <Text style={styles.sipDetailLabel}>Amount</Text>
                    <Text style={styles.sipDetailValue}>
                      ₹{sip?.netAmount ? sip?.netAmount.toFixed(2) : "-"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>
    );
  };

  const SipSummaryCard = () => {
    // Determine data based on dataSource
    const bseOverall = investmentData?.portfolioSummary?.bse?.overall || {};
    const boOverall = investmentData?.portfolioSummary?.backoffice?.overall || {};

    const isBackOffice = dataSource === 'BACKOFFICE';

    // For BSE
    const bseInvested = parseFloat(bseOverall.invested || 0);
    const bseCurrent = parseFloat(bseOverall.currentValue || 0);
    const bseGain = parseFloat(bseOverall.gainAmount || 0);
    const bsePercent = parseFloat(bseOverall.gainPercent || 0);

    // For BackOffice
    const totalAUM = parseFloat(boOverall.totalAUM || 0);
    const camsAUM = parseFloat(boOverall.camsAUM || 0);
    const kfinAUM = parseFloat(boOverall.kfintechAUM || 0);

    return (
      <View style={styles.summaryCard}>
        <LinearGradient
          colors={['#2B8DF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.summaryCardAccent}
        />
        <View style={styles.summaryBlockRow}>
          <View style={[styles.summaryBlock, { backgroundColor: "#EEF2FF" }]}>
            <Text style={styles.summaryBlockLabel}>{dataSource === 'BSE' ? 'Total SIPs' : 'Total AUM'}</Text>
            <Text style={styles.summaryBlockValue}>{dataSource === 'BSE' ? totalSIPs : formatCurrency(totalAUM)}</Text>
          </View>
          <View style={[styles.summaryBlock, { backgroundColor: "#D1FAE5" }]}>
            <Text style={styles.summaryBlockLabel}>{dataSource === 'BSE' ? 'Active SIPs' : 'CAMS AUM'}</Text>
            <Text style={[styles.summaryBlockValue, { color: "#059669" }]}>
              {dataSource === 'BSE' ? activeSIPs : formatCurrency(camsAUM)}
            </Text>
          </View>
          <View style={[styles.summaryBlock, { backgroundColor: "#FEE2E2" }]}>
            <Text style={styles.summaryBlockLabel}>{dataSource === 'BSE' ? 'Lumpsums' : 'KFintech AUM'}</Text>
            <Text style={[styles.summaryBlockValue, { color: "#DC2626" }]}>
              {dataSource === 'BSE' ? totalLumpsums : formatCurrency(kfinAUM)}
            </Text>
          </View>
        </View>

        {dataSource === 'BSE' && <><View style={styles.summaryDivider} />

          <View style={styles.summaryBottomRow}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Invested</Text>
              <Text style={styles.summaryColumnValue}>
                {formatCurrency(bseInvested)}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Gain/Loss</Text>
              <View style={[styles.gainLossContainer, bseGain >= 0 ? styles.gainBg : styles.lossBg]}>
                <Text
                  style={[
                    styles.summaryColumnValue,
                    styles.gainLossValue,
                    bseGain >= 0 ? styles.gain : styles.loss,
                  ]}
                >
                  {bseGain >= 0 ? "+" : ""}
                  {formatCurrency(bseGain)}
                </Text>
                <Text
                  style={[
                    styles.summaryColumnPercent,
                    bseGain >= 0 ? styles.gain : styles.loss,
                  ]}
                >
                  ({bseGain >= 0 ? "+" : ""}
                  {bsePercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Current</Text>
              <Text style={styles.summaryColumnValue}>
                {formatCurrency(bseCurrent)}
              </Text>
            </View>
          </View></>}
      </View>
    );
  };

  const ProvisionalOrderCard = ({ order, index }) => {
    return (
      <View style={styles.provisionalOrderCard}>
        <View style={styles.provisionalHeader}>
          <View style={styles.provisionalStatusContainer}>
            <View style={[styles.statusPill, styles.provisionalBadge]}>
              <Text style={styles.provisionalBadgeText}>PROVISIONAL ORDER IN PROGRESS</Text>
            </View>
          </View>
          <View style={styles.provisionalTimestamps}>
            <Text style={styles.provisionalTimestamp}>
              Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "NA"}
            </Text>
            <Text style={styles.provisionalTimestamp}>
              Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : new Date(order.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.provisionalDetailsGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID:</Text>
            <Text style={styles.infoValue}>{order.orderId || order.orderNo || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SIP Reg No:</Text>
            <Text style={styles.infoValue}>{order.sipRegnNo || order.referenceNumber || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SIP Reg Date:</Text>
            <Text style={styles.infoValue}>{order.sipStartDate || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frequency:</Text>
            <Text style={styles.infoValue}>{order.frequencyType || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client Code:</Text>
            <Text style={styles.infoValue}>{order.clientCode || "CHA01"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction Type:</Text>
            <Text style={styles.infoValue}>{order.transactionType || "SIP"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Value:</Text>
            <Text style={styles.infoValue}>₹{order.orderValue || order.amount || "0"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Folio No:</Text>
            <Text style={styles.infoValue}>{order.folioNo || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source:</Text>
            <Text style={styles.infoValue}>{order.source || "cron-sync"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BSE Remarks:</Text>
            <Text style={styles.infoValue}>{order.bseRemarks || "ALLOTMENT DONE"}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Removed unused ViewToggle and TabHeader from render logic scope

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <View style={styles.mainSwitchContainer}>
          {sourceTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.mainSwitchButton, dataSource === tab.key && styles.mainSwitchActive]}
              onPress={() => setDataSource(tab.key)}
            >
              <Text style={[styles.mainSwitchText, dataSource === tab.key && styles.mainSwitchTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.viewToggleRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.viewToggleScroll}
        >
          {(dataSource === 'BSE' ? ["SIP", "LUMPSUM", "ALLOTMENTS", "PROVISIONAL"] : ["SIP", "LUMPSUM", "ALLOTMENTS", "PROVISIONAL"]).map((tab) => (
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
        {dataSource === 'BSE' ? (
          <>
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
                    <BSEAllotmentCard key={idx} scheme={scheme} index={idx} />
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
                {(investmentData?.lumpsumSummary?.schemes || []).length > 0 ? (
                  (investmentData?.lumpsumSummary?.schemes || []).map(
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
                {(investmentData?.provisionalOrders || []).length > 0 ? (
                  (investmentData?.provisionalOrders || []).map((order, idx) => (
                    <ProvisionalOrderCard key={idx} order={order} index={idx} />
                  ))
                ) : (
                  <View style={styles.emptyTabState}>
                    <Text style={styles.emptyTabStateText}>No provisional orders found</Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.contentContainer}>
            <SipSummaryCard />
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
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
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
    fontSize: 10,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "600",
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryBlockValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
    fontFamily: Config.fontFamilys.Poppins_Bold,
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
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "600",
    fontFamily: Config.fontFamilys.Poppins_Medium,
  },
  summaryColumnValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "700",
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  gainLossContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  gainBg: {
    backgroundColor: '#D1FAE5',
  },
  lossBg: {
    backgroundColor: '#FEE2E2',
  },
  gainLossValue: {
    fontSize: 15,
    fontWeight: "bold",
  },
  summaryColumnPercent: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  gain: { color: "#059669" },
  loss: { color: "#DC2626" },
  viewToggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  viewToggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    marginHorizontal: 6,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  viewToggleBtnActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#2B8DF6",
    ...Platform.select({
      ios: {
        shadowColor: '#2B8DF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  viewToggleTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
  },
  viewToggleTxtActive: {
    color: "#2B8DF6",
  },
  schemeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
    color: "#1E293B",
    marginBottom: 6,
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  schemeCardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    fontFamily: Config.fontFamilys.Poppins_Medium,
  },
  schemeCardSubtitleSmall: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 4,
    fontFamily: Config.fontFamilys.Poppins_Regular,
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
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  allotmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  allotmentTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1E293B",
    flex: 1,
    fontFamily: Config.fontFamilys.Poppins_Bold,
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
    fontSize: 11,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "500",
    fontFamily: Config.fontFamilys.Poppins_Medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderHeader: {
    marginBottom: 16,
  },
  orderTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1E293B",
    fontFamily: Config.fontFamilys.Poppins_Bold,
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
    backgroundColor: "#EEF2FF",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  provisional: {
    backgroundColor: "#FEF3C7",
  },
  redeemBtn: {
    backgroundColor: "#2B8DF6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: '#2B8DF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  redeemTxt: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  disabledContainer: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  disabledTxt: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
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
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  errorMessage: {
    color: "#64748B",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    fontFamily: Config.fontFamilys.Poppins_Regular,
  },
  retryButton: {
    backgroundColor: "#2B8DF6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#2B8DF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  emptyTabState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTabStateText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
    fontFamily: Config.fontFamilys.Poppins_Medium,
    lineHeight: 24,
  },
  viewToggleScroll: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  // Switch Styles
  mainSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#2B8DF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mainSwitchButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 26,
  },
  mainSwitchActive: {
    backgroundColor: '#2B8DF6',
    ...Platform.select({
      ios: {
        shadowColor: '#2B8DF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mainSwitchText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
  },
  mainSwitchTextActive: {
    color: '#FFFFFF',
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  navbarTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    fontFamily: Config.fontFamilys.Poppins_Bold,
    letterSpacing: 0.5,
  },
  placeholderButton: {
    width: 40,
  },
  provisionalOrderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  provisionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  provisionalStatusContainer: {
    flex: 1,
  },
  provisionalBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  provisionalBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E",
    fontFamily: Config.fontFamilys.Poppins_Bold,
    letterSpacing: 0.5,
  },
  provisionalTimestamps: {
    alignItems: 'flex-end',
  },
  provisionalTimestamp: {
    fontSize: 10,
    color: "#64748B",
    fontFamily: Config.fontFamilys.Poppins_Medium,
    marginBottom: 2,
  },
  provisionalDetailsGrid: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    width: 140,
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  infoValue: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
    fontFamily: Config.fontFamilys.Poppins_Medium,
  },
  allotmentHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
  },
  hideShowBtn: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  hideShowBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  allotmentStatsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
    flexWrap: 'wrap',
  },
  allotmentStatPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 110,
    alignItems: "center",
    justifyContent: 'center',
  },
  totalPill: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  activePill: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  cancelledPill: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  allotmentStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  allotmentListContainer: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  orderDetailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  orderDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderDetailSchemeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 10,
    textTransform: 'uppercase',
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  orderDetailAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    fontFamily: Config.fontFamilys.Poppins_Bold,
  },
  orderDetailGain: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  orderDetailCol: {
    flex: 1,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontFamily: Config.fontFamilys.Poppins_Regular,
  },
  orderDetailBold: {
    fontWeight: "700",
    color: "#475569",
  },
  orderDetailSecondaryLabel: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: Config.fontFamilys.Poppins_Medium,
    marginBottom: 2,
  },
});

export default InvestmentList;
