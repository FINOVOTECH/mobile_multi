import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { widthToDp, heightToDp } from "../../../helpers/Responsive";
import { useDispatch, useSelector } from "react-redux";
import * as Config from "../../../helpers/Config"
import SInfoSvg from "../../svgs";
import { setMfCentral } from "../../../store/slices/marketSlice";
import { useFocusEffect } from "@react-navigation/native";
import { selectMfData, selectMfDataLoading, selectMfDataError } from "../../../store/slices/mfDataSlice";
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';

const Tracker = ({ navigation }) => {
  const dispatch = useDispatch();
  
  const mfData = useSelector(selectMfData);
  console.log("mfData from Redux:", mfData);
  const loading = useSelector(selectMfDataLoading);
  const error = useSelector(selectMfDataError);

  
  useEffect(() => {
    console.log("Redux mfData:", mfData);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused, current mfData length:", mfData.length);
    }, [])
  );

  const handleCheckPortfolio = (item) => {
    dispatch(setMfCentral(item));
    navigation.navigate("Portfolio");
  }

  const handleAddAccount = () => {
    navigation.navigate("PanVerify");
  };

  const currentDate = new Date();
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  const formattedDate = currentDate.toLocaleDateString('en-US', options).replace(',', '');

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
          <Text style={styles.headerTitle}>Investment Tracker</Text>
          <Text style={styles.headerSubtitle}>Monitor all your investments in one place</Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
      
      <Header />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Show loading state if needed */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2B8DF6" />
            <Text style={styles.loadingText}>Loading your investments...</Text>
          </View>
        )}

        {/* Show error state if needed */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading data</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
          </View>
        )}

        {/* Show feature section if data is empty */}
        {mfData.length === 0 && !loading && !error ? (
          <View style={styles.emptyState}>
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Track All Your Investments</Text>
              <FeatureItem
                icon="trending-up"
                title="Consolidate MFs & Stocks"
                subtitle="One place to monitor all investments"
              />
              <FeatureItem
                icon="pie-chart"
                title="Analyse & Insights"
                subtitle="Get expert insights of investments"
              />
              <FeatureItem
                icon="people"
                title="Add Family Investments"
                subtitle="Track your family's investments"
              />
            </View>
          </View>
        ) : (
          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioTitle}>Your Portfolios</Text>
            {mfData.map((item, idx) => {
              const selectedPortfolio = item?.portfolio?.find(portfolioItem => parseFloat(portfolioItem.costValue) > 0) || item?.portfolio?.[0];
              const portfolioValue = selectedPortfolio?.costValue || "0";

              return (
                <TouchableOpacity
                  onPress={() => handleCheckPortfolio(item)}
                  key={idx}
                  style={styles.portfolioCard}
                >
                  <View style={styles.portfolioHeader}>
                    <View style={styles.portfolioLogo}>
                      <Text style={styles.portfolioLogoText}>
                        {(item?.investorDetails?.investorName?.[0] || "P").toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.portfolioInfo}>
                      <Text style={styles.portfolioName}>
                        {item?.investorDetails?.investorName || "Portfolio"}
                      </Text>
                      <Text style={styles.portfolioPan}>{item?.pan || ""}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.portfolioDetails}>
                    <View>
                      <Text style={styles.lastSyncText}>Last Synced on {formattedDate}</Text>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountText}>
                        ₹{parseFloat(portfolioValue).toLocaleString()}
                      </Text>
                      <SInfoSvg.RightArrow />
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Add Account Button */}
        <TouchableOpacity
          onPress={handleAddAccount}
          style={styles.addAccountButton}>
          <View style={styles.addAccountContent}>
            <View style={styles.plusIcon}>
              <SInfoSvg.Plus />
            </View>
            <Text style={styles.addAccountText}>
              {mfData.length === 0 ? 'Add Account to Track' : 'Add Another Account'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Consolidation via */}
        <View style={styles.consolidationContainer}>
          <Text style={styles.consolidationText}>Consolidation via MF Central</Text>
        </View>

        {/* Why Use Section */}
        <View style={styles.whyUseSection}>
          <View style={styles.whyUseTextContainer}>
            <Text style={styles.whyUseTitle}>Why use Investment Tracker?</Text>
            <Text style={styles.familyTitle}>Track Family's Investments</Text>
            <Text style={styles.familyDescription}>
              Manage and track your family's mutual funds investment by adding
              them in the Family Account on the Web.
            </Text>
          </View>

          <View style={styles.coinContainer}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/1490/1490843.png",
              }}
              style={styles.coinImage}
            />
            <Image
              source={{
                uri: "https://static.vecteezy.com/system/resources/previews/009/306/539/original/growth-arrow-3d-icon-png.png",
              }}
              style={styles.arrowImage}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Reusable FeatureItem Component
const FeatureItem = ({ icon, title, subtitle }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      {icon === "trending-up" && <SInfoSvg.TrendigUp />}
      {icon === "pie-chart" && <SInfoSvg.PieChart />}
      {icon === "people" && <SInfoSvg.People />}
    </View>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

export default Tracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#2B8DF6',
  },

  // Header Styles
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

  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  scrollContent: {
    paddingTop: heightToDp(2),
    paddingHorizontal: widthToDp(4),
    paddingBottom: heightToDp(2),
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: heightToDp(10),
  },
  loadingText: {
    marginTop: heightToDp(2),
    fontSize: widthToDp(4),
    color: '#666',
    fontWeight: '500',
  },

  // Error State
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: widthToDp(4),
    borderRadius: widthToDp(3),
    alignItems: 'center',
    marginBottom: heightToDp(2),
  },
  errorText: {
    fontSize: widthToDp(4),
    color: Config.Colors.red,
    fontWeight: '600',
    marginBottom: heightToDp(0.5),
  },
  errorSubtext: {
    fontSize: widthToDp(3.5),
    color: '#666',
    textAlign: 'center',
  },

  // Empty State & Features
  emptyState: {
    paddingTop: heightToDp(2),
  },
  featuresSection: {
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
  featuresTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#333',
    marginBottom: heightToDp(2),
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightToDp(2.5),
    padding: widthToDp(2),
    borderRadius: widthToDp(2),
    backgroundColor: '#F8F9FF',
  },
  featureIcon: {
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: widthToDp(5),
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthToDp(3),
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(0.5),
  },
  featureSubtitle: {
    fontSize: widthToDp(3.2),
    color: '#666',
    lineHeight: heightToDp(2.5),
  },

  // Portfolio Section
  portfolioSection: {
    paddingTop: heightToDp(1),
  },
  portfolioTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: '700',
    color: '#333',
    marginBottom: heightToDp(2),
  },
  portfolioCard: {
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
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightToDp(1.5),
  },
  portfolioLogo: {
    width: widthToDp(12),
    height: widthToDp(12),
    borderRadius: widthToDp(6),
    backgroundColor: Config.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthToDp(3),
  },
  portfolioLogoText: {
    color: '#FFFFFF',
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioName: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(0.5),
  },
  portfolioPan: {
    fontSize: widthToDp(3.2),
    color: '#666',
  },
  portfolioDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastSyncText: {
    fontSize: widthToDp(3.2),
    color: '#888',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#2B8DF6',
    marginRight: widthToDp(2),
  },

  // Add Account Button
  addAccountButton: {
    backgroundColor: Config.Colors.primary,
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2),
    paddingHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    width: widthToDp(5),
    height: widthToDp(5),
    marginRight: widthToDp(2),
  },
  addAccountText: {
    color: '#FFFFFF',
    fontSize: widthToDp(4),
    fontWeight: '600',
  },

  // Consolidation Section
  consolidationContainer: {
    alignItems: 'center',
    marginBottom: heightToDp(3),
  },
  consolidationText: {
    fontSize: widthToDp(3.2),
    color: '#666',
    textAlign: 'center',
  },

  // Why Use Section
  whyUseSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whyUseTextContainer: {
    flex: 1,
    marginRight: widthToDp(2),
  },
  whyUseTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: '700',
    color: '#333',
    marginBottom: heightToDp(1.5),
  },
  familyTitle: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(1),
  },
  familyDescription: {
    fontSize: widthToDp(3.2),
    color: '#666',
    lineHeight: heightToDp(2.5),
  },
  coinContainer: {
    position: 'relative',
    width: widthToDp(20),
    height: widthToDp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinImage: {
    width: widthToDp(20),
    height: widthToDp(20),
    resizeMode: 'contain',
  },
  arrowImage: {
    position: 'absolute',
    width: widthToDp(10),
    height: widthToDp(10),
    bottom: 0,
    right: 0,
  },

  bottomPadding: {
    height: heightToDp(2),
  },
});