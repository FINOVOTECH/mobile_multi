import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  BackHandler,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import InvestedPorfolio from '../../../hooks/investedPortfolio';
import { setSipInterface } from '../../../store/slices/marketSlice';
import Loader from '../../../components/handAnimation';
import * as Config from '../../../helpers/Config';
import { heightToDp } from '../../../helpers/Responsive';

const { width } = Dimensions.get('window');

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const InvestmentList = ({ navigation }) => {
  const dispatch = useDispatch();
  const { investmentData, loading, error, refetch } = InvestedPorfolio();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedSchemes, setExpandedSchemes] = useState({});

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  const formatCurrency = amount =>
    `₹${parseFloat(amount ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Data Extraction
  const isEmptyData =
    !investmentData ||
    !investmentData.sipSummary ||
    Object.keys(investmentData.sipSummary.schemes || {}).length === 0;

  const sipSummary = investmentData?.sipSummary || {};
  const schemes = sipSummary?.schemes || {};
  const schemeArray = Object.values(schemes);

  const activeSIPs = sipSummary?.activeSIPs || 0;
  const cancelledSIPs = sipSummary?.cancelledSIPs || 0;
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
        schemeName: schemeData.schemeName || 'Unnamed Scheme',
        ISIN: schemeData.ISIN,
        SIPs: schemeData.SIPs || [],
        active: schemeData.active ?? 0,
        cancelled: schemeData.cancelled ?? 0,
        totalSIPs: schemeData.totalSIPs ?? (schemeData.SIPs || []).length,
      }),
    );
  };

  const schemeWiseSIPs = getSchemeWiseSIPs();

  const isSIPActive = sip => sip.status === 'active';
  const isSIPCancelled = sip => sip.status === 'cancelled';
  const getAllottedUnitsFromBSE = sipRegnNo => {
    if (!investmentData?.bseAllotments || !sipRegnNo) return 0;
    const matching = investmentData.bseAllotments.find(
      a => a.SIPRegnNo === sipRegnNo,
    );
    return matching ? parseFloat(matching.allottedUnit) || 0 : 0;
  };
  const getAllotmentData = sipRegnNo => {
    if (!investmentData?.bseAllotments || !sipRegnNo) return null;
    return investmentData?.bseAllotments.find(a => a.SIPRegnNo === sipRegnNo);
  };

  const toggleSchemeExpand = schemeIdx => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSchemes(prev => ({
      ...prev,
      [schemeIdx]: {
        ...(prev[schemeIdx] || { expanded: false, sips: {} }),
        expanded: !(prev[schemeIdx]?.expanded || false),
      },
    }));
  };

  // UI Components

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
          <View>
            <Text style={styles.schemeCardTitle}>{scheme.schemeName}</Text>
            <Text style={styles.schemeCardSubtitle}>{scheme.schemeCode}</Text>
            <Text style={styles.schemeCardSubtitleSmall}>{scheme.ISIN}</Text>
          </View>
          <Text style={styles.arrowIcon}>{schemeExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        <View style={styles.sipStatsRow}>
          <Text style={styles.statPillDefault}>
            Total SIP: {schemeSIPs.length}
          </Text>
          <Text style={styles.statPillActive}>
            Active: {schemeSIPs.filter(isSIPActive).length}
          </Text>
          <Text style={styles.statPillCancelled}>
            Cancelled: {schemeSIPs.filter(isSIPCancelled).length}
          </Text>
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
                  navigation.navigate('SipInterface');
                }}
                activeOpacity={0.85}
                style={styles.sipItemCard}
              >
                <View style={styles.sipItemHeader}>
                  <Text style={styles.sipItemTitle}>
                    SIP Regn No: {sip.SIPRegnNo}
                  </Text>
                  <Text
                    style={[
                      styles.sipStatusPill,
                      isSIPActive(sip) && styles.statPillActive,
                      isSIPCancelled(sip) && styles.statPillCancelled,
                    ]}
                  >
                    {isSIPActive(sip)
                      ? 'Active'
                      : isSIPCancelled(sip)
                      ? 'Cancelled'
                      : 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.sipItemDetail}>
                  Order: {allotmentData?.orderNo ?? '--'}
                </Text>
                <Text style={styles.sipItemDetail}>
                  Allotted Units: {allottedUnits}
                </Text>
                <Text style={styles.sipItemDetail}>
                  Amount: {allotmentData?.wbr2Details?.amount ?? '--'}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    );
  };

  const SipSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryBlockRow}>
        <View style={[styles.summaryBlock, { backgroundColor: '#EEF2FF' }]}>
          <Text style={styles.summaryBlockLabel}>Total SIPs</Text>
          <Text style={styles.summaryBlockValue}>{totalSIPs}</Text>
        </View>
        <View style={[styles.summaryBlock, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.summaryBlockLabel}>Active</Text>
          <Text style={[styles.summaryBlockValue, { color: '#059669' }]}>
            {activeSIPs}
          </Text>
        </View>
        <View style={[styles.summaryBlock, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.summaryBlockLabel}>Cancelled</Text>
          <Text style={[styles.summaryBlockValue, { color: '#991B1B' }]}>
            {cancelledSIPs}
          </Text>
        </View>
      </View>
      <View style={styles.summaryBlockRow}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryBlockLabel}>Invested</Text>
          <Text style={styles.summaryInvText}>
            {formatCurrency(totalInvested)}
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryBlockLabel}>Gain/Loss</Text>
          <Text
            style={[
              styles.summaryGainText,
              overallGainLoss.gain >= 0 ? styles.gain : styles.loss,
            ]}
          >
            {overallGainLoss.gain >= 0 ? '+' : ''}
            {formatCurrency(overallGainLoss.gain)}
          </Text>
          <Text
            style={[
              styles.summaryPercentText,
              overallGainLoss.gain >= 0 ? styles.gain : styles.loss,
            ]}
          >
            ({overallGainLoss.gain >= 0 ? '+' : ''}
            {overallGainLoss.percentage.toFixed(2)}%)
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryBlockLabel}>Current</Text>
          <Text style={styles.summaryInvText}>
            {formatCurrency(totalCurrentValue)}
          </Text>
        </View>
      </View>
    </View>
  );

  const TabHeader = () => {
    const tabs = [
      { id: 'all', label: 'All Schemes', count: schemeArray.length },
      {
        id: 'active',
        label: 'Active',
        count: schemeArray.filter(s => s.active > 0).length,
      },
      {
        id: 'cancelled',
        label: 'Cancelled',
        count: schemeArray.filter(s => s.cancelled > 0).length,
      },
    ];
    return (
      <View style={styles.tabRow}>
        {tabs.map(tab => (
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
        onPress={() => navigation.navigate('SipScheme')}
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
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>My Investments</Text>
        <Text style={styles.navbarSubtitle}>SIP Portfolio</Text>
      </View>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: '#F5F7FB',
          marginBottom: heightToDp(8),
        }}
      >
        {isEmptyData ? (
          <EmptyState />
        ) : (
          <View>
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
                  {activeTab === 'all'
                    ? 'No investment schemes found'
                    : `No ${activeTab} schemes found`}
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
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#FFFFFF',
  },
  navbar: {
    paddingTop: 30,
    backgroundColor: '#2B8DF6',
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  navbarTitle: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  navbarSubtitle: { fontSize: 14, color: '#B1B7C1', marginTop: 2 },
  summaryCard: {
    margin: 20,
    padding: 22,
    borderRadius: 16,
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#0003',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  summaryBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 18,
  },
  summaryBlockLabel: {
    fontSize: 13,
    color: '#3F3E59',
    marginBottom: 6,
    fontWeight: '600',
  },
  summaryBlockValue: { fontSize: 18, color: '#212134', fontWeight: '700' },
  summaryColumn: { flex: 1, alignItems: 'center' },
  summaryInvText: {
    fontSize: 15,
    color: '#292929',
    fontWeight: '700',
    marginTop: 2,
  },
  summaryGainText: { fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  summaryPercentText: { fontSize: 12, marginTop: 1, fontWeight: '500' },
  gain: { color: '#059669' },
  loss: { color: '#EF4444' },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    marginHorizontal: 4,
  },
  tabBtnActive: { backgroundColor: '#4F46E5' },
  tabBtnTxt: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  tabBtnTxtActive: { color: '#FFF' },
  tabBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 11,
    backgroundColor: '#E0E7FF',
  },
  tabBadgeActive: { backgroundColor: '#6366F1' },
  tabBadgeTxt: { color: '#4F46E5', fontWeight: '700', fontSize: 12 },
  tabBadgeTxtActive: { color: '#FFF' },
  schemeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 19,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#0002',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  schemeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  schemeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#292929',
    marginBottom: 2,
  },
  schemeCardSubtitle: { fontSize: 13, color: '#757E8A', fontWeight: '500' },
  schemeCardSubtitleSmall: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  arrowIcon: { fontSize: 17, color: '#6366F1', fontWeight: 'bold' },
  sipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: -5,
    marginBottom: 12,
  },
  statPillDefault: {
    backgroundColor: '#EFF6FF',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 5,
    fontSize: 13,
    color: '#374151',
    fontWeight: '700',
    marginHorizontal: 2,
  },
  statPillActive: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    paddingHorizontal: 9,
    borderRadius: 15,
  },
  statPillCancelled: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    paddingHorizontal: 9,
    borderRadius: 15,
  },
  sipItemCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    padding: 13,
    elevation: 2,
  },
  sipItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sipItemTitle: { fontWeight: '700', fontSize: 15, color: '#334155' },
  sipStatusPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    fontSize: 13,
    fontWeight: '600',
    color: '#6842FF',
    backgroundColor: '#EDE9FE',
  },
  sipItemDetail: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyStateIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyStateIconText: { fontSize: 36 },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  emptyStateMessage: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  startBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 25,
  },
  startBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorIcon: { fontSize: 50, marginBottom: 12 },
  errorTitle: { fontSize: 23, fontWeight: 'bold', color: '#222' },
  errorMessage: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 13,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  emptyTabState: { alignItems: 'center', paddingVertical: 25 },
  emptyTabStateText: { fontSize: 15, color: '#777', fontWeight: '500' },
});

export default InvestmentList;
