import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import SInfoSvg from '../../svgs';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';
import * as Config from '../../../helpers/Config';
import { apiGetService } from '../../../helpers/services';
import { setInvestment, setMarketData } from '../../../store/slices/marketSlice';
import { useDispatch } from 'react-redux';

const NFO = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('LIVE');
  const [nfoData, setNfoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNFOData();
  }, [activeTab]);

  const fetchNFOData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiGetService(`/api/v1/mutualfund/update/nfo/live`);

    //   const result = await response.json();
      console.log('NFO Fetch Response:', response?.data);
      
      if (response?.data) {
        // Transform and filter the data based on active tab
        const transformedData = transformNFOData(response?.data, activeTab);
        setNfoData(transformedData);
        console.log(`Transformed NFO Data for tab ${activeTab}:`, transformedData);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

const transformNFOData = (apiData, tab) => {
  if (!apiData?.data) return [];

  const currentDate = new Date();

  let sourceData = [];
  switch (tab) {
    case 'LIVE':
      sourceData = apiData.data.active || [];
      break;
    case 'UPCOMING':
      sourceData = apiData.data.upcoming || [];
      break;
    case 'CLOSED':
      sourceData = apiData.data.recentlyClosed || [];
      break;
    default:
      sourceData = [];
  }

  const filteredData = sourceData
    .filter(item => {
      const openDate = new Date(item.startDate || item.openDate);
      const closeDate = new Date(item.endDate || item.closeDate);
      if (isNaN(openDate) || isNaN(closeDate)) return false;

      // Condition 1: Open date should be within the last 20 days
      const diffOpenDays = (currentDate - openDate) / (1000 * 60 * 60 * 24);
      const isRecentOpen = diffOpenDays <= 20 && diffOpenDays >= 0;

      // Condition 2: Close date should NOT be within next 4-5 days
      const diffCloseDays = (closeDate - currentDate) / (1000 * 60 * 60 * 24);
      const isClosingSoon = diffCloseDays <= 5 && diffCloseDays >= 0;

      // Show only if recently opened and not closing soon
      return isRecentOpen && !isClosingSoon;
    })
    .map((item, index) => ({
      id: item._id || `nfo-${index}-${Date.now()}`,
      schemeName: item.schemeName || 'N/A',
      category: item.schemeType || 'Other',
      openDate: formatDate(item.startDate || item.openDate),
      closeDate: formatDate(item.endDate || item.closeDate),
      minInvestment: 5000,
      fundHouse: getFundHouseName(item.amcCode),
      riskLevel: getRiskLevel(item.schemeType),
      rating: 4,
      description: `${item.schemeType} Fund - ${item.schemePlan || 'Regular Plan'}`,
      logo: getFundLogo(item.amcCode),
      schemeCode: item.schemeCode,
      purchaseAllowed: item.purchaseAllowed,
      sipFlag: item.sipFlag,
      originalData: item,
    }));

  return filteredData;
};

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get fund house name from amcCode
  const getFundHouseName = (amcCode) => {
    if (!amcCode) return 'N/A';
    
    const fundHouses = {
      'SBIMutualFund_MF': 'SBI Mutual Fund',
      'BirlaSunLifeMutualFund_MF': 'Aditya Birla Sun Life',
      'GROWWMUTUALFUND_MF': 'Groww Mutual Fund',
      'ICICIPrudentialMutualFund_MF': 'ICICI Prudential',
      'HDFCMutualFund_MF': 'HDFC Mutual Fund',
      'NipponIndiaMutualFund_MF': 'Nippon India',
      'UTIMutualFund_MF': 'UTI Mutual Fund',
      'KotakMutualFund_MF': 'Kotak Mahindra',
      'AxisMutualFund_MF': 'Axis Mutual Fund'
    };

    return fundHouses[amcCode] || amcCode.replace('_MF', '').replace(/([A-Z])/g, ' $1').trim();
  };

  // Helper function to determine risk level based on scheme type
  const getRiskLevel = (schemeType) => {
    if (!schemeType) return 'Moderate';
    
    const type = schemeType.toLowerCase();
    if (type.includes('equity') || type.includes('sector')) return 'High';
    if (type.includes('debt') || type.includes('liquid')) return 'Low';
    return 'Moderate';
  };

  // Helper function to get fund logo
  const getFundLogo = (amcCode) => {
    const fundLogos = {
      'SBIMutualFund_MF': 'https://via.placeholder.com/60/9013FE/FFFFFF?text=SBI',
      'BirlaSunLifeMutualFund_MF': 'https://via.placeholder.com/60/4A90E2/FFFFFF?text=ABSL',
      'GROWWMUTUALFUND_MF': 'https://via.placeholder.com/60/00D09F/FFFFFF?text=GROWW',
      'ICICIPrudentialMutualFund_MF': 'https://via.placeholder.com/60/0047AB/FFFFFF?text=ICICI',
      'HDFCMutualFund_MF': 'https://via.placeholder.com/60/50E3C2/FFFFFF?text=HDFC',
      'NipponIndiaMutualFund_MF': 'https://via.placeholder.com/60/666666/FFFFFF?text=NIPPON',
      'UTIMutualFund_MF': 'https://via.placeholder.com/60/FF6B6B/FFFFFF?text=UTI',
      'KotakMutualFund_MF': 'https://via.placeholder.com/60/F5A623/FFFFFF?text=KOTAK',
      'AxisMutualFund_MF': 'https://via.placeholder.com/60/417505/FFFFFF?text=AXIS'
    };

    return fundLogos[amcCode] || 'https://via.placeholder.com/60/666666/FFFFFF?text=MF';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNFOData();
    setRefreshing(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const retryFetch = () => {
    setError(null);
    fetchNFOData();
  };

  const Header = () => (
    <LinearGradient
      colors={['#2B8DF6', '#2B8DF6']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Image
        source={bgVector}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        resizeMode="cover"
      />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SInfoSvg.WhiteBackButton />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>New Fund Offers</Text>
          <Text style={styles.headerSubtitle}>Invest in new mutual fund schemes</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const RiskIndicator = ({ level }) => {
    const getRiskColor = () => {
      switch (level) {
        case 'Low': return '#4CAF50';
        case 'Moderate': return '#FF9800';
        case 'High': return '#F44336';
        default: return '#666';
      }
    };

    return (
      <View style={[styles.riskIndicator, { backgroundColor: getRiskColor() }]}>
        <Text style={styles.riskText}>{level}</Text>
      </View>
    );
  };

  const RatingStars = ({ rating }) => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>⭐ {rating}</Text>
      </View>
    );
  };

  const NFOCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.nfoCard}
      activeOpacity={0.8}
        onPress={() => {
              dispatch(setMarketData(item?.originalData));
              dispatch(setInvestment(item?.originalData));
              navigation.navigate('MarketWatch');
            }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.fundLogoContainer}>
          <Image 
            source={{ uri: 'https://cdn5.vectorstock.com/i/1000x1000/44/19/mutual-fund-vector-7404419.jpg' }} 
            style={styles.fundLogo} 
          />
        </View>
        <View style={styles.fundInfo}>
          <Text style={styles.schemeName} numberOfLines={2}>
            {item.schemeName}
          </Text>
          <Text style={styles.fundHouse}>{item.fundHouse}</Text>
          <Text style={styles.schemeCode}>{item.schemeCode}</Text>
        </View>
        <RatingStars rating={item.rating} />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{item.category}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Min Investment</Text>
            <Text style={styles.detailValue}>₹{item.minInvestment?.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Open Date</Text>
            <Text style={styles.detailValue}>{item.openDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Close Date</Text>
            <Text style={styles.detailValue}>{item.closeDate}</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureTag}>
            <Text style={styles.featureText}>
              SIP: {item.sipFlag === 'Y' ? 'Available' : 'Not Available'}
            </Text>
          </View>
          <View style={styles.featureTag}>
            <Text style={styles.featureText}>
              Purchase: {item.purchaseAllowed === 'Y' ? 'Allowed' : 'Not Allowed'}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <RiskIndicator level={item.riskLevel} />
          <TouchableOpacity 
            style={[
              styles.investButton,
              item.purchaseAllowed !== 'Y' && styles.disabledButton
            ]}
        onPress={() => {
              dispatch(setMarketData(item?.originalData));
               dispatch(setInvestment(item?.originalData));
              navigation.navigate('MarketWatch');
            }}
            disabled={activeTab === 'LIVE' && item.purchaseAllowed !== 'Y'}
          >
            <Text style={styles.investButtonText}>
              {activeTab === 'LIVE' ? 
                (item.purchaseAllowed === 'Y' ? 'Invest Now' : 'Not Available') : 
                'View Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No NFOs Available</Text>
      <Text style={styles.emptyStateText}>
        There are no {activeTab.toLowerCase()} New Fund Offers for the current month.
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Error Loading Data</Text>
      <Text style={styles.emptyStateText}>
        Failed to load NFO data. Please check your connection and try again.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
      
      <Header />

      <View style={styles.tabContainer}>
        <TabButton 
          title="Live NFOs" 
          isActive={activeTab === 'LIVE'} 
          onPress={() => handleTabChange('LIVE')} 
        />
        <TabButton 
          title="Upcoming" 
          isActive={activeTab === 'UPCOMING'} 
          onPress={() => handleTabChange('UPCOMING')} 
        />
        <TabButton 
          title="Closed" 
          isActive={activeTab === 'CLOSED'} 
          onPress={() => handleTabChange('CLOSED')} 
        />
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2B8DF6" />
            <Text style={styles.loadingText}>Loading NFOs...</Text>
          </View>
        ) : error && nfoData.length === 0 ? (
          <ErrorState />
        ) : (
          <FlatList
            data={nfoData}
            renderItem={({ item }) => <NFOCard item={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              nfoData.length === 0 && styles.emptyListContent
            ]}
            ListEmptyComponent={EmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2B8DF6']}
                tintColor="#2B8DF6"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#2B8DF6',
  },
  headerGradient: {
    backgroundColor: '#2B8DF6',
    paddingBottom: heightToDp(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(1),
  },
  backButton: {
    marginRight: widthToDp(3),
    padding: widthToDp(1.5),
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: widthToDp(2),
  },
  headerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: widthToDp(3.5),
    color: '#E6F3FF',
    marginTop: heightToDp(0.5),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: widthToDp(4),
    marginTop: heightToDp(2),
    borderRadius: widthToDp(3),
    padding: widthToDp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: heightToDp(1.5),
    alignItems: 'center',
    borderRadius: widthToDp(2),
  },
  activeTab: {
    backgroundColor: '#2B8DF6',
  },
  tabText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  listContent: {
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(2),
    paddingBottom: heightToDp(4),
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  nfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginBottom: heightToDp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightToDp(2),
  },
  fundLogoContainer: {
    marginRight: widthToDp(3),
    alignItems: 'center',
  },
  fundLogo: {
    width: widthToDp(12),
    height: widthToDp(12),
    borderRadius: widthToDp(2),
    resizeMode: 'contain',
  },
  fundInfo: {
    flex: 1,
    marginRight: widthToDp(2),
  },
  schemeName: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(0.5),
  },
  fundHouse: {
    fontSize: widthToDp(3.2),
    color: '#666',
    marginBottom: heightToDp(0.3),
  },
  schemeCode: {
    fontSize: widthToDp(2.8),
    color: '#999',
  },
  ratingContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.5),
    borderRadius: widthToDp(2),
  },
  ratingText: {
    fontSize: widthToDp(3),
    fontWeight: '600',
    color: '#FF9800',
  },
  cardDetails: {
    marginTop: heightToDp(1),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: widthToDp(3),
    color: '#666',
    marginBottom: heightToDp(0.3),
  },
  detailValue: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#333',
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: heightToDp(1.5),
    gap: widthToDp(2),
  },
  featureTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.5),
    borderRadius: widthToDp(1),
  },
  featureText: {
    fontSize: widthToDp(2.8),
    color: '#666',
  },
  descriptionContainer: {
    marginBottom: heightToDp(2),
  },
  description: {
    fontSize: widthToDp(3.2),
    color: '#666',
    lineHeight: heightToDp(2.5),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskIndicator: {
    paddingHorizontal: widthToDp(2.5),
    paddingVertical: heightToDp(0.7),
    borderRadius: widthToDp(2),
  },
  riskText: {
    fontSize: widthToDp(2.8),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  investButton: {
    backgroundColor: '#2B8DF6',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.2),
    borderRadius: widthToDp(2),
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  investButtonText: {
    color: '#FFFFFF',
    fontSize: widthToDp(3.5),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: heightToDp(10),
  },
  loadingText: {
    marginTop: heightToDp(2),
    fontSize: widthToDp(4),
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: heightToDp(10),
    paddingHorizontal: widthToDp(8),
  },
  emptyStateTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(1),
  },
  emptyStateText: {
    fontSize: widthToDp(3.8),
    color: '#666',
    textAlign: 'center',
    lineHeight: heightToDp(3),
    marginBottom: heightToDp(2),
  },
  retryButton: {
    backgroundColor: '#2B8DF6',
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: widthToDp(3.5),
    fontWeight: '600',
  },
});

export default NFO;