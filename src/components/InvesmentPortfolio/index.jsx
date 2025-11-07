import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Button,
} from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive'; // Import your responsive utility
import * as Config from '../../helpers/Config';
import * as Icons from '../../helpers/Icons';
import SInfoSvg from '../../presentation/svgs';
import InvestedPorfolio from '../../hooks/investedPortfolio';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { setSipInterface } from '../../store/slices/marketSlice';
import Rbutton from '../Rbutton';

const InvestmentPortfolio = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { investmentData, loading, error, refetch } = InvestedPorfolio();
  console.log('Investment Data:', investmentData, loading, error);

  const formatCurrency = amount => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = dateString => {
    if (!dateString) return '0';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateGainLoss = (current, invested) => {
    const currentValue = parseFloat(current || 0);
    const investedValue = parseFloat(invested || 0);

    if (investedValue === 0) return { gain: 0, percentage: 0 };

    const gain = currentValue - investedValue;
    const percentage = (gain / investedValue) * 100;
    return { gain, percentage };
  };

  const totalInvested =
    investmentData?.consolidatedData?.reduce(
      (sum, item) => sum + parseFloat(item?.amount || 0),
      0,
    ) || 0;

  const totalCurrent =
    investmentData?.consolidatedData?.reduce(
      (sum, item) => sum + parseFloat(item?.currentMarketPrice || 0),
      0,
    ) || 0;

  const overallGainLoss = calculateGainLoss(totalCurrent, totalInvested);

  const InvestmentCard = ({ idx, investment }) => {
    if (!investment) return null;

    const gainLoss = calculateGainLoss(
      investment?.currentMarketPrice,
      investment?.amount,
    );
    const isProfit = gainLoss.gain >= 0;

    return (
      <TouchableOpacity
        style={{
          ...styles.card,
          borderLeftColor:
            (idx + 1) % 2 === 0
              ? Config.Colors.primary
              : Config.Colors.secondary,
        }}
        onPress={() => {
          dispatch(setSipInterface(investment));
          navigation?.navigate('SipInterface');
        }}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: investment?.amcLogoUrl }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 25,
              marginRight: widthToDp(2),
            }}
            resizeMode="contain"
          />
          <Text style={styles.schemeName} numberOfLines={2}>
            {investment?.schemeName || '0'}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Invested Amount</Text>
              <Text style={styles.investedAmount}>
                {formatCurrency(investment?.investedAmount)}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Current Value</Text>
              <Text style={styles.currentValue}>
                {formatCurrency(investment?.currentMarketPrice)}
              </Text>
            </View>
          </View>
          {/* <View style={styles.navRow}>
            <View style={styles.column}>
              <Text style={styles.label}>Purchase</Text>
              <Text style={styles.value}>
                ₹{investment?.allottedNav ? parseFloat(investment.allottedNav).toFixed(4) : '0.0000'}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Current NAV</Text>
              <Text style={styles.value}>
                ₹{investment?.currentNAV ? parseFloat(investment.currentNAV).toFixed(2) : '0.00'}
              </Text>
            </View>
          </View> */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Folio No.</Text>
              <Text style={styles.value}>{investment?.folioNo || '0'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Units</Text>
              <Text style={styles.value}>
                {investment?.totalUnits
                  ? parseFloat(investment.totalUnits).toFixed(4)
                  : '0.0000'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading investment data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SInfoSvg.PigBank />
            <Text style={styles.headerTitle}>Investments</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation?.navigate('InvestmentList')}
            // onPress={()=>navigation.navigate("InvestmentList")}
            style={styles.clientName}
          >
            <Text style={{ fontSize: 15, fontWeight: 600 }}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={Icons.no_active_sip}
            resizeMode="contain"
            style={{
              width: widthToDp(70),
              height: heightToDp(20),
            }}
          />
          <Text
            style={{
              fontWeight: 600,
              fontSize: widthToDp(5),
              color: Config.Colors.black,
            }}
          >
            No active SIPs
          </Text>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>
            Invest every month and grow your wealth
          </Text>
          {/* <TouchableOpacity
            style={{
              backgroundColor: Config.Colors.secondary,
              borderRadius: widthToDp(8),
              paddingVertical: heightToDp(1.5),
              width: '30%',
              shadowColor: Config.Colors.black,
              shadowOffset: { width: 0, height: heightToDp(0.3) },
              shadowOpacity: 0.2,
              shadowRadius: widthToDp(1),
              elevation: 3,
              marginVertical: heightToDp(2),
            }}
            onPress={() => navigation.navigate('SipScheme')}
            activeOpacity={0.8}
          >
            <Text
              style={{
                textAlign: 'center',
                color: Config.Colors.white,
                fontSize: widthToDp(4),
              }}
            >
              Start a SIP
            </Text>
          </TouchableOpacity> */}
          <Rbutton
            title={"Start a SIP"}
            onPress={() => navigation.navigate('SipScheme')}
            style={{
              shadowColor: Config.Colors.black,
              shadowOffset: { width: 0, height: heightToDp(0.3) },
              shadowOpacity: 0.2,
              shadowRadius: widthToDp(1),
              elevation: 3,
              marginVertical: heightToDp(2),
            }}
          />
        </View>
      </View>
    );
  }

  if (!investmentData?.consolidatedData?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SInfoSvg.PigBank />
            <Text style={styles.headerTitle}>Investments</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation?.navigate('InvestmentList')}
            // onPress={()=>navigation.navigate("InvestmentList")}
            style={styles.clientName}
          >
            <Text style={{ fontSize: 15, fontWeight: 600 }}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={Icons.no_active_sip}
            resizeMode="contain"
            style={{
              width: widthToDp(70),
              height: heightToDp(20),
            }}
          />
          <Text
            style={{
              fontWeight: 600,
              fontSize: widthToDp(5),
              color: '#333333',
            }}
          >
            No active SIPs
          </Text>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>
            Invest every month and grow your wealth
          </Text>
          <View style={{alignItems:'center'}}>

          <Rbutton
            title={"Start a SIP"}
            onPress={() => navigation.navigate('SipScheme')}
            style={{
              shadowColor: Config.Colors.black,
              shadowOffset: { width: 0, height: heightToDp(0.3) },
              shadowOpacity: 0.2,
              shadowRadius: widthToDp(1),
              elevation: 3,
              marginVertical: heightToDp(1),
              width: '50%',
            }}
            />
            </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SInfoSvg.PigBank />
          <Text style={styles.headerTitle}>Investments</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation?.navigate('InvestmentList')}
          // onPress={()=>navigation.navigate("InvestmentList")}
          style={styles.clientName}
        >
          <Text style={{ fontSize: 15, fontWeight: 600 }}>View All</Text>
        </TouchableOpacity>
      </View>
      {/* Investment Cards */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {investmentData?.consolidatedData
          ?.slice(0, 2)
          ?.map((investment, idx) => (
            <InvestmentCard
              key={investment?._id || Math.random()}
              investment={investment}
              idx={idx}
            />
          ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: widthToDp(4),
    color: Config.Colors.black,
    textAlign: 'center',
  },
  errorText: {
    fontSize: widthToDp(4),
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: heightToDp(2),
  },
  emptyText: {
    fontSize: widthToDp(4),
    color: '#FFFFFF',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
  },
  retryButtonText: {
    color: Config.Colors.cyan_blue,
    fontSize: widthToDp(3.5),
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
    // borderWidth:1,
    // borderColor:"black"
  },
  headerTitle: {
    fontSize: widthToDp(4),
    fontWeight: '700',
    // marginBottom: widthToDp(2),
    color: '#333333',
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    fontSize: widthToDp(5),
    marginRight: widthToDp(2),
    color: Config.Colors.primary,
  },
  sectionTitle: {
    fontSize: widthToDp(4.8),
    marginHorizontal: widthToDp(2),
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    color: '#2C3E50',
  },
  clientName: {
    fontSize: widthToDp(3.5),
    color: Config.Colors.black,
    textAlign: 'center',
    marginTop: heightToDp(0.5),
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
    padding: widthToDp(4),
    borderRadius: widthToDp(3),
    borderWidth: 1,
    borderColor: '#1768BF',
    elevation: 2,
    shadowColor: '#1768BF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  summaryTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#1768BF',
    marginBottom: heightToDp(1.5),
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: widthToDp(3.2),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  summaryInvested: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#1768BF',
  },
  summaryCurrent: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#1768BF',
  },
  totalGainLoss: {
    alignItems: 'center',
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalGainAmount: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
  },
  totalGainPercent: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    marginLeft: widthToDp(1),
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: widthToDp(4),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    marginBottom: heightToDp(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderLeftWidth: widthToDp(1),
  },
  cardHeader: {
    backgroundColor: '#F8F9FF',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderTopLeftRadius: widthToDp(3),
    borderTopRightRadius: widthToDp(3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schemeName: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#1768BF',
    flex: 1,
    marginRight: widthToDp(2),
  },
  orderTypeContainer: {
    backgroundColor: '#1768BF',
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.3),
    borderRadius: widthToDp(1),
  },
  orderType: {
    fontSize: widthToDp(2.8),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardBody: {
    padding: widthToDp(4),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
    paddingVertical: heightToDp(0.5),
    // backgroundColor: '#F8F9FF',
    // paddingHorizontal: widthToDp(3),
    borderRadius: widthToDp(2),
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: widthToDp(3),
    color: '#666666',
    marginBottom: heightToDp(0.3),
  },
  value: {
    fontSize: widthToDp(3.5),
    color: '#333333',
    fontWeight: '500',
  },
  investedAmount: {
    fontSize: widthToDp(3.8),
    color: '#1768BF',
    fontWeight: '600',
  },
  currentValue: {
    fontSize: widthToDp(3.8),
    color: '#1768BF',
    fontWeight: '600',
  },
  gainLossContainer: {
    marginTop: heightToDp(1),
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  gainLossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gainLossAmount: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
  },
  gainLossPercent: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    marginLeft: widthToDp(1),
  },
  profit: {
    color: '#28A745',
  },
  loss: {
    color: '#DC3545',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(1),
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateText: {
    fontSize: widthToDp(2.8),
    color: '#888888',
  },
});

export default InvestmentPortfolio;
