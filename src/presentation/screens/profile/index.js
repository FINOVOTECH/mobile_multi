import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  BackHandler,
} from 'react-native';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import * as Config from '../../../helpers/Config';
import * as Icons from '../../../helpers/Icons';
import { useDispatch, useSelector } from 'react-redux';
import SInfoSvg from '../../svgs';
import { getData } from '../../../helpers/localStorage';
import useGetPortfolioData from '../../../hooks/getPortfolio';
import StartInvestingCard from '../../../components/StartInvstingCard';
import QuickLinksSection from '../../../components/QuickLinksSection';
import SIPCalculator from '../../calculator/sipCalculator';
import InvestmentPortfolio from '../../../components/InvesmentPortfolio';
import Collection from '../../../components/Collection';
import DeviceInfo from 'react-native-device-info';
import MandateAlert from '../../../components/MandateAlert';
import { setMandateAlert } from '../../../store/slices/marketSlice';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';
import HandAnimation from '../../../components/handAnimation';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export default function Profile({}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const Alert = useSelector(state => state.marketWatch.mandateAlert);
  const loginData = useSelector(state => state?.login?.loginData);
  const [isLoading, setIsLoading] = useState(true);
  const [mandateData, setMandateData] = useState(null);
  const [showMandateAlert, setShowMandateAlert] = useState(false);
  const { portfolioData } = useGetPortfolioData();
  const Return = portfolioData?.totals?.totalGainLoss > 0;
  console.log('values:::', portfolioData?.totals?.totalCurrentValue);
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyThreshold = 140;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, stickyThreshold],
    outputRange: [0, -heightToDp(25)],
    extrapolate: 'clamp',
  });

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold - 50, stickyThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyHeaderTranslateY = scrollY.interpolate({
    inputRange: [0, stickyThreshold],
    outputRange: [50, 0],
    extrapolate: 'clamp',
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, stickyThreshold - 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchingMandate();
  }, []);

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  const fetchingMandate = async () => {
    setIsLoading(true);
    try {
      const rawToken = await getData(Config.store_key_login_details);
      const clientCode = await getData(Config.clientCode);
      const cleanToken = rawToken ? rawToken.replace(/"/g, '') : '';
      const response = await fetch(
        `${Config.baseUrl}/api/client/registration/mandate/history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            clientcode: clientCode?.replace(/^"|"$/g, ''),
            Authorization: cleanToken,
          },
        },
      );

      const data = await response.json();
      const filteredIds = data?.mandates?.filter(item => item.UMRNNo);
      if (!filteredIds || filteredIds.length === 0) {
        if (Alert === false) {
          setMandateData(false);
          setShowMandateAlert(true);
        }
      } else {
        setMandateData(true);
        setShowMandateAlert(false);
      }
    } catch (error) {
      console.error('Error fetching mandate history:', error);
      setMandateData(null);
      setShowMandateAlert(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseMandateAlert = () => {
    setShowMandateAlert(false);
    dispatch(setMandateAlert(true));
  };

  const handleCreateMandate = () => {
    dispatch(setMandateAlert(true));
    navigation.navigate('BankMandate');
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />

      {isLoading ? (
        <HandAnimation />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.stickyHeader,
              {
                opacity: stickyHeaderOpacity,
                transform: [{ translateY: stickyHeaderTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={['#2B8DF6', '#2B8DF6']}
              style={styles.stickyHeaderGradient}
            >
              <View style={styles.stickyHeaderContent}>
                <View style={styles.stickyLeftSection}>
                  <TouchableOpacity   onPress={() => navigation.navigate('Settings')}>
                  <Image source={Icons.logo} style={styles.stickyLogo} />
                  </TouchableOpacity>
                  <Text style={styles.stickyGreeting} numberOfLines={1}>
                    Hello {loginData?.user?.primaryHolderFirstName}!
                  </Text>
                </View>
                <View style={styles.stickyPortfolioSection}>
                  <Text style={styles.stickyPortfolioText}>
                    PORTFOLIO BALANCE
                  </Text>
                  <Text style={styles.stickyPortfolioAmount}>
                    ₹{portfolioData?.totals?.totalCurrentValue || '0'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Main Animated Header */}
          <Animated.View
            style={[
              styles.animatedHeader,
              { transform: [{ translateY: headerTranslateY }] },
            ]}
          >
            <LinearGradient
              colors={['#2B8DF6', '#2B8DF6']}
              style={styles.headerGradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Image
                source={bgVector}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}
                resizeMode="cover"
              />

              {/* Fixed Header Row */}
              <View style={styles.headerRow}>
                <View style={styles.headerTopRow}>
                  <View style={styles.leftHeader}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Settings')}
                      style={styles.iconButton}
                    >
                      <Image source={Icons.logo} style={styles.logoImage} />
                    </TouchableOpacity>
                    <Text style={styles.greetingText} numberOfLines={1}>
                      Hello {loginData?.user?.primaryHolderFirstName}!
                    </Text>
                  </View>
                </View>

                <View style={styles.portfolioHeader}>
                  <View style={styles.portfolioLeft}>
                    <Text style={styles.portfolioBalanceTitle}>
                      PORTFOLIO BALANCE
                    </Text>
                    <Text style={styles.portfolioBalanceAmount}>
                      ₹
                      {portfolioData?.totals?.totalCurrentValue?.toLocaleString() ||
                        '0'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Collapsing Portfolio Info */}
              <Animated.View
                style={{ opacity: contentOpacity, marginTop: heightToDp(2) }}
              >
                <TouchableOpacity
                  onPress={() => navigation?.navigate('Dashboard')}
                >
                  <View style={styles.portfolioBalanceCard}>
                    <View style={styles.metricsContainer}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Invested</Text>
                        <Text style={styles.metricValue}>
                          ₹{' '}
                          {portfolioData?.totals?.totalCurrentValue?.toLocaleString() ||
                            '00'}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Current Returns</Text>
                        <Text
                          style={[
                            styles.metricValue,
                            Return
                              ? styles.positiveReturns
                              : styles.negativeReturns,
                          ]}
                        >
                          {Return ? '+' : '-'} ₹
                          {Math.abs(
                            (portfolioData?.totals?.totalCurrentValue || 0) -
                              (portfolioData?.totals?.totalInvested || 0),
                          )?.toFixed(2) || '0.00'}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Returns %</Text>
                        <Text
                          style={[
                            styles.metricValue,
                            Return
                              ? styles.positiveReturns
                              : styles.negativeReturns,
                          ]}
                        >
                          {Return ? '+' : '-'}
                          {portfolioData?.totals?.totalReturnPercent || '0'}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Scrollable Section */}
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
          >
            <View style={{ height: heightToDp(35) }} />
            <StartInvestingCard
              onStartInvesting={() => navigation.navigate('SipScheme')}
            />
            <Collection />
            <QuickLinksSection onViewAll={() => {}} />
            <SIPCalculator />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Powered By FinovoTech</Text>
              <Text style={styles.footerText}>
                Version : v.{DeviceInfo.getVersion()}
              </Text>
            </View>
          </Animated.ScrollView>

          <MandateAlert
            visible={showMandateAlert}
            onClose={handleCloseMandateAlert}
            showCancelButton={true}
            onCreateMandate={handleCreateMandate}
          />
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.white,
    position: 'relative',
  },
  safeArea: { flex: 1, position: 'relative' },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#2B8DF6',
  },

  // Sticky Header Styles
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: heightToDp(8),
    zIndex: 20,
    backgroundColor: '#2B8DF6',
  },
  stickyHeaderGradient: {
    flex: 1,
    paddingHorizontal: widthToDp(4),
    justifyContent: 'center',
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stickyLogo: {
    width: widthToDp(9),
    height: widthToDp(9),
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Config.Colors.white,
    backgroundColor: Config.Colors.white,
  },
  stickyGreeting: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontWeight: '600',
    fontSize: widthToDp(4),
    marginLeft: widthToDp(3),
    flex: 1,
  },
  stickyPortfolioSection: {
    alignItems: 'flex-end',
  },
  stickyPortfolioText: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontSize: widthToDp(2.5),
    opacity: 0.9,
  },
  stickyPortfolioAmount: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Bold,
    fontSize: widthToDp(4.5),
  },

  // Main Header Styles
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: heightToDp(35),
    zIndex: 10,
    overflow: 'hidden',
  },
  headerGradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  headerRow: {
    paddingHorizontal: widthToDp(4),
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightToDp(1),
  },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  logoImage: {
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Config.Colors.white,
    backgroundColor: Config.Colors.white,
  },
  iconButton: {
    width: widthToDp(10),
    height: widthToDp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontWeight: '600',
    fontSize: widthToDp(4.5),
    marginLeft: widthToDp(3),
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: heightToDp(2),
  },
  portfolioLeft: { flex: 1 },
  portfolioRight: { marginLeft: widthToDp(2) },
  portfolioBalanceTitle: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontSize: widthToDp(3.2),
    opacity: 0.9,
    letterSpacing: 0.8,
  },
  portfolioBalanceAmount: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Bold,
    fontSize: widthToDp(7),
  },
  portfolioBalanceCard: {
    marginHorizontal: widthToDp(4),
    borderRadius: widthToDp(1),
    padding: widthToDp(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  returnsBadge: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    paddingHorizontal: widthToDp(2.5),
    paddingVertical: heightToDp(0.8),
    borderRadius: widthToDp(3),
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.4)',
  },
  returnsText: {
    color: '#4CD964',
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontSize: widthToDp(2.5),
  },
  metricsContainer: { marginTop: heightToDp(1) },
  metricItem: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: heightToDp(0.5),
  },
  metricLabel: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Regular,
    fontSize: widthToDp(3.2),
    opacity: 0.8,
  },
  metricValue: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontSize: widthToDp(3.8),
  },
  positiveReturns: { color: '#4CD964' },
  negativeReturns: { color: '#FF3B30' },
  scrollView: { flex: 1, backgroundColor: Config.Colors.white },
  scrollViewContent: { flexGrow: 1 },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: heightToDp(10),
    paddingHorizontal: widthToDp(4),
    marginTop: heightToDp(2),
  },
  footerText: {
    fontSize: widthToDp(2.5),
    color: Config.Colors.textColor.textColor_5,
    textAlign: 'center',
    marginBottom: heightToDp(0.5),
  },
});
