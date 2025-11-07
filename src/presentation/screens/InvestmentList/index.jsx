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
} from 'react-native';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import * as Config from '../../../helpers/Config';
import InvestedPorfolio from '../../../hooks/investedPortfolio';
import { useDispatch } from 'react-redux';
import { setSipInterface } from '../../../store/slices/marketSlice';
import Loader from '../../../components/handAnimation';

const InvestmentList = ({ navigation }) => {
  const dispatch = useDispatch();
  const { investmentData, loading, error, refetch } = InvestedPorfolio();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'cancelled'

  const formatCurrency = amount => {
    return `₹${parseFloat(amount ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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

  const calculateGainLoss = (current, invested) => {
    const gain = parseFloat(current ?? 0) - parseFloat(invested ?? 0);
    const percentage = (gain / parseFloat(invested || 1)) * 100;
    return { gain, percentage };
  };

  // Check if data is empty or not available
  const isEmptyData = !investmentData || !investmentData.sipSummary || Object.keys(investmentData.sipSummary.schemes || {}).length === 0;

  // Extract data from new structure with fallback values
  const sipSummary = investmentData?.sipSummary || {};
  const schemes = sipSummary?.schemes || {};
  const totals = investmentData?.totals || {}; // Fixed: totals is directly under investmentData
  
  // Convert schemes object to array for mapping
  const schemeArray = Object.values(schemes);
  
  // Get SIP counts with fallback to 0
  const activeSIPs = sipSummary?.activeSIPs || 0;
  const cancelledSIPs = sipSummary?.cancelledSIPs || 0;
  const pausedSIPs = sipSummary?.pausedSIPs || 0;
  const pendingSIPs = sipSummary?.pendingSIPs || 0;
  const totalSIPs = sipSummary?.totalSIPs || 0;

  // Use the correct property names from your API response
  const totalInvested = parseFloat(totals?.totalInvested || 0);
  const totalCurrentValue = parseFloat(totals?.totalCurrentValue || 0);
  const totalGainLoss = parseFloat(totals?.totalGainLoss || 0);
  const totalReturnPercent = parseFloat(totals?.totalReturnPercent || 0);

  // Calculate gain/loss based on API data
  const overallGainLoss = {
    gain: totalGainLoss,
    percentage: totalReturnPercent
  };

  // Filter schemes based on active tab
  const filteredSchemes = schemeArray.filter(scheme => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return scheme.active > 0;
    if (activeTab === 'cancelled') return scheme.cancelled > 0;
    return true;
  });

  const SchemeCard = ({ scheme, idx }) => {
    if (!scheme) return null;
    
    const isActive = scheme.active > 0;
    const isCancelled = scheme.cancelled > 0;

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isCancelled) { // Disable click for cancelled SIPs
            dispatch(setSipInterface(scheme));
            navigation?.navigate('SipInterface');
          }
        }}
        style={{
          ...styles.card,
          borderLeftColor: isActive ? Config.Colors.primary : Config.Colors.secondary,
          opacity: isCancelled ? 0.6 : 1, // Visual feedback for disabled state
        }}
        disabled={isCancelled} // Disable touch for cancelled SIPs
      >
        <View style={styles.cardHeader}>
          <View style={styles.schemeHeaderContent}>
            <View style={styles.schemeInfo}>
              <Text style={styles.schemeName} numberOfLines={2}>
                {scheme?.schemeName ?? 'No Scheme Name'}
              </Text>
              <Text style={styles.schemeCode} numberOfLines={1}>
                {scheme?.schemeCode ?? 'N/A'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusContainer,
            isActive ? styles.activeStatus : styles.cancelledStatus
          ]}>
            <Text style={styles.statusText}>
              {isActive ? 'ACTIVE' : 'CANCELLED'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>ISIN</Text>
              <Text style={styles.value}>{scheme?.ISIN ?? 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Total SIPs</Text>
              <Text style={styles.value}>{scheme?.totalSIPs ?? 0}</Text>
            </View>
          </View>

          <View style={styles.sipStatsRow}>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Active</Text>
              <Text style={[styles.sipStatValue, styles.activeCount]}>
                {scheme?.active ?? 0}
              </Text>
            </View>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Cancelled</Text>
              <Text style={[styles.sipStatValue, styles.cancelledCount]}>
                {scheme?.cancelled ?? 0}
              </Text>
            </View>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Paused</Text>
              <Text style={styles.sipStatValue}>
                {scheme?.paused ?? 0}
              </Text>
            </View>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Pending</Text>
              <Text style={styles.sipStatValue}>
                {scheme?.pending ?? 0}
              </Text>
            </View>
          </View>

          {/* Disabled overlay message for cancelled SIPs */}
          {isCancelled && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>
                Cancelled SIP - View Only
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const SipSummaryCard = () => {
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>My SIP Investments</Text>
        
        {/* SIP Counts */}
        <View style={styles.sipCountsContainer}>
          <View style={styles.sipCountRow}>
            <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Total SIPs</Text>
              <Text style={styles.sipCountValue}>{totalSIPs}</Text>
            </View>
            <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Active</Text>
              <Text style={[styles.sipCountValue, styles.activeCount]}>{activeSIPs}</Text>
            </View>
            <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Cancelled</Text>
              <Text style={[styles.sipCountValue, styles.cancelledCount]}>{cancelledSIPs}</Text>
            </View>
             <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Paused</Text>
              <Text style={styles.sipCountValue}>{pausedSIPs}</Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialSummary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Total Invested</Text>
              <Text style={styles.summaryInvested}>
                {formatCurrency(totalInvested)}
              </Text>
            </View>
            <View style={styles.summaryColumn}> 
              <Text style={styles.summaryLabel}>Total Gain/Loss</Text>
              <View style={styles.gainLossRow}>
                <Text
                  style={[
                    styles.totalGainAmount,
                    overallGainLoss.gain >= 0 ? styles.profit : styles.loss,
                  ]}
                >
                  {overallGainLoss.gain >= 0 ? '+' : ''}
                  {formatCurrency(overallGainLoss.gain)}
                </Text>
                <Text
                  style={[
                    styles.totalGainPercent,
                    overallGainLoss.gain >= 0 ? styles.profit : styles.loss,
                  ]}
                >
                  ({overallGainLoss.gain >= 0 ? '+' : ''}
                  {overallGainLoss.percentage.toFixed(2)}%)
                </Text>
              </View>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Current Value</Text>
              <Text style={styles.summaryCurrent}>
                {formatCurrency(totalCurrentValue)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const TabHeader = () => {
    const tabs = [
      { id: 'all', label: 'All Schemes', count: schemeArray.length },
      { id: 'active', label: 'Active', count: schemeArray.filter(s => s.active > 0).length },
      { id: 'cancelled', label: 'Cancelled', count: schemeArray.filter(s => s.cancelled > 0).length },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabCount,
              activeTab === tab.id && styles.activeTabCount,
            ]}>
              <Text style={[
                styles.tabCountText,
                activeTab === tab.id && styles.activeTabCountText,
              ]}>
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
        You haven't started any SIP investments yet. Start your investment journey today!
      </Text>
      <TouchableOpacity onPress={()=>{navigation.navigate("SipScheme")}} style={styles.startInvestingButton}>
        <Text style={styles.startInvestingButtonText}>Start Investing</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.backButtonIcon}>
              <Text style={styles.backButtonText}>←</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>My Investments</Text>
          <View style={styles.navbarRight} />
        </View>
        <Loader />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.backButtonIcon}>
              <Text style={styles.backButtonText}>←</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>My Investments</Text>
          <View style={styles.navbarRight} />
        </View>
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
      
      {/* Navbar Header */}
      <View style={styles.navbar}>
        <View style={styles.navbarTitleContainer}>
          <Text style={styles.navbarTitle}>My Investments</Text>
          <Text style={styles.navbarSubtitle}>SIP Portfolio</Text>
        </View>
        
      </View>

      {isEmptyData ? (
        <View style={styles.mainContent}>
          <EmptyState />
        </View>
      ) : (
        <View style={styles.mainContent}>
          {/* Summary Card */}
          <SipSummaryCard />

          {/* Tab Navigation */}
          <TabHeader />

          {/* Schemes List */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredSchemes.map((scheme, idx) => (
              <SchemeCard
                idx={idx}
                key={scheme?.schemeCode || Math.random()}
                scheme={scheme}
              />
            ))}
            
            {filteredSchemes.length === 0 && (
              <View style={styles.emptyTabState}>
                <Text style={styles.emptyTabStateText}>
                  {activeTab === 'all' 
                    ? 'No investment schemes found' 
                    : `No ${activeTab} schemes found`
                  }
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#FFFFFF',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navbarTitleContainer: {
    flex: 1,
  },
  navbarTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#000000',
  },
  navbarSubtitle: {
    fontSize: widthToDp(3.5),
    color: '#666666',
    marginTop: heightToDp(0.5),
  },
  backButton: {
    padding: widthToDp(2),
  },
  backButtonIcon: {
    width: widthToDp(8),
    height: widthToDp(8),
    borderRadius: widthToDp(4),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: widthToDp(4),
    color: '#000000',
  },
  navbarRight: {
    width: widthToDp(8),
  },
  mainContent: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: widthToDp(4),
    padding: widthToDp(4),
    borderRadius: widthToDp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: heightToDp(2),
  },
  sipCountsContainer: {
    marginBottom: heightToDp(2),
  },
  sipCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sipCountItem: {
    alignItems: 'center',
  },
  sipCountLabel: {
    fontSize: widthToDp(3.2),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  sipCountValue: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    color: '#000000',
  },
  activeCount: {
    color: '#4CAF50',
  },
  cancelledCount: {
    color: '#FF6B6B',
  },
  financialSummary: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: heightToDp(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryColumn: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: widthToDp(3.2),
    color: '#666666',
    marginBottom: heightToDp(1),
  },
  summaryInvested: {
    fontSize: widthToDp(3.8),
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryCurrent: {
    fontSize: widthToDp(3.8),
    fontWeight: 'bold',
    color: '#000000',
  },
  gainLossRow: {
    alignItems: 'center',
  },
  totalGainAmount: {
    fontSize: widthToDp(3.8),
    fontWeight: 'bold',
  },
  totalGainPercent: {
    fontSize: widthToDp(3.2),
    fontWeight: '600',
  },
  profit: {
    color: '#4CAF50',
  },
  loss: {
    color: '#FF6B6B',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: heightToDp(1.5),
    marginHorizontal: widthToDp(1),
    borderRadius: widthToDp(2),
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: Config.Colors.primary,
  },
  tabText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#E0E0E0',
    borderRadius: widthToDp(3),
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.5),
    marginLeft: widthToDp(1.5),
  },
  activeTabCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabCountText: {
    fontSize: widthToDp(3),
    fontWeight: 'bold',
    color: '#666666',
  },
  activeTabCountText: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: widthToDp(4),
    paddingBottom: heightToDp(4),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    marginBottom: heightToDp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: widthToDp(1),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: widthToDp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  schemeHeaderContent: {
    flex: 1,
    marginRight: widthToDp(2),
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: widthToDp(3.8),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: heightToDp(0.5),
  },
  schemeCode: {
    fontSize: widthToDp(3.2),
    color: '#666666',
  },
  statusContainer: {
    paddingHorizontal: widthToDp(3),
    paddingVertical: heightToDp(0.8),
    borderRadius: widthToDp(2),
  },
  activeStatus: {
    backgroundColor: '#E8F5E8',
  },
  cancelledStatus: {
    backgroundColor: '#FFE8E8',
  },
  statusText: {
    fontSize: widthToDp(2.8),
    fontWeight: 'bold',
  },
  cardBody: {
    padding: widthToDp(4),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(2),
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: widthToDp(3.2),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  value: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#000000',
  },
  sipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sipStat: {
    alignItems: 'center',
  },
  sipStatLabel: {
    fontSize: widthToDp(3),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  sipStatValue: {
    fontSize: widthToDp(3.5),
    fontWeight: 'bold',
    color: '#000000',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: widthToDp(3),
  },
  disabledText: {
    fontSize: widthToDp(3.5),
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthToDp(8),
  },
  emptyStateIcon: {
    width: widthToDp(20),
    height: widthToDp(20),
    borderRadius: widthToDp(10),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: heightToDp(3),
  },
  emptyStateIconText: {
    fontSize: widthToDp(8),
  },
  emptyStateTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: heightToDp(1),
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: widthToDp(3.8),
    color: '#666666',
    textAlign: 'center',
    marginBottom: heightToDp(3),
    lineHeight: heightToDp(3),
  },
  startInvestingButton: {
    backgroundColor: Config.Colors.primary,
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(3),
  },
  startInvestingButtonText: {
    fontSize: widthToDp(3.8),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthToDp(8),
  },
  errorIcon: {
    fontSize: widthToDp(12),
    marginBottom: heightToDp(2),
  },
  errorTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: heightToDp(1),
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: widthToDp(3.8),
    color: '#666666',
    textAlign: 'center',
    marginBottom: heightToDp(3),
    lineHeight: heightToDp(3),
  },
  retryButton: {
    backgroundColor: Config.Colors.primary,
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(3),
  },
  retryButtonText: {
    fontSize: widthToDp(3.8),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyTabState: {
    paddingVertical: heightToDp(4),
    alignItems: 'center',
  },
  emptyTabStateText: {
    fontSize: widthToDp(3.8),
    color: '#666666',
    textAlign: 'center',
  },
});

export default InvestmentList;