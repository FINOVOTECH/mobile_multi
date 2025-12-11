import React, { useState, useEffect } from "react";
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
} from "react-native";
import { widthToDp, heightToDp } from "../../../helpers/Responsive";
import SInfoSvg from "../../svgs";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import bgVector from "../../../assets/Icons/vector.png";
import * as Config from "../../../helpers/Config";
import { apiGetService } from "../../../helpers/services";
import {
  setInvestment,
  setMarketData,
} from "../../../store/slices/marketSlice";
import { useDispatch } from "react-redux";

const NFO = ({ navigation }) => {
  // const navigation = useNavigation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("LIVE");
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

      const response = await apiGetService(`/api/v1/mutualfund/nfo/live`);

      if (response?.data) {
        const transformedData = transformNFOData(response?.data, activeTab);
        setNfoData(transformedData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED TRANSFORM LOGIC
  const transformNFOData = (apiData, tab) => {
    if (!apiData?.data) return [];

    let sourceData = [];
    if (tab === "LIVE") sourceData = apiData.data.active || [];
    if (tab === "UPCOMING") sourceData = apiData.data.upcoming || [];
    if (tab === "CLOSED") sourceData = apiData.data.recentlyClosed || [];

    return sourceData.map((item, index) => {
      const v = item.variant;

      return {
        id: `${item._id}-${v.schemeCode}-${index}`, // FIXED UNIQUE KEY
        _id: item._id,

        schemeName: item.schemeName,
        schemeType: item.schemeType,
        amcCode: item.amcCode,
        amcName: getFundHouseName(item.amcCode),

        // FIXED DATES
        startDate: v.startDate,
        endDate: v.endDate,
        reOpeningDate: v.reopeningDate,

        minInvestment: Number(v.minimumPurchaseAmount),
        sipFlag: v.sipFlag,
        purchaseAllowed: v.purchaseAllowed,

        fundHouse: getFundHouseName(item.amcCode),
        rating: 4,
        riskLevel: getRiskLevel(item.schemeType),

        description: `${item.schemeType} - ${v.schemePlan}`,
        logo: "https://cdn5.vectorstock.com/i/1000x1000/44/19/mutual-fund-vector-7404419.jpg",

        schemeCode: v.schemeCode,

        variant: v,
        originalData: item,
      };
    });
  };

  // Date Formatter
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const getRiskLevel = (type) => {
    if (!type) return "Moderate";
    const t = type.toLowerCase();
    if (t.includes("equity")) return "High";
    if (t.includes("debt")) return "Low";
    return "Moderate";
  };

  const getFundHouseName = (amcCode) => {
    const fundHouses = {
      DSP_MF: "DSP Mutual Fund",
      AXISMUTUALFUND_MF: "Axis Mutual Fund",
      KOTAKMAHINDRAMF: "Kotak Mutual Fund",
      NAVIMUTUALFUND_MF: "Navi Mutual Fund",
      MIRAEASSET: "Mirae Asset",
    };
    return fundHouses[amcCode] || amcCode;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNFOData();
    setRefreshing(false);
  };

  const Header = () => (
    <LinearGradient
      colors={["#2B8DF6", "#2B8DF6"]}
      style={styles.headerGradient}
    >
      <Image
        source={bgVector}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
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
          <Text style={styles.headerSubtitle}>
            Invest in new mutual fund schemes
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  // ------------------------------------------------------------
  // CARD COMPONENT (STYLING UNTOUCHED)
  // ------------------------------------------------------------
  const NFOCard = ({ item }) => {
    // console.log("NFO",item)
    return (
      <TouchableOpacity
        style={styles.nfoCard}
        activeOpacity={0.8}
        onPress={() => {
          // dispatch(setMarketData(item.originalData));
          dispatch(setInvestment(item.originalData));
          navigation.navigate("NFoInvest");
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.fundLogoContainer}>
            <Image source={{ uri: item.logo }} style={styles.fundLogo} />
          </View>

          <View style={styles.fundInfo}>
            <Text style={styles.schemeName} numberOfLines={2}>
              {item.schemeName}
            </Text>
            <Text style={styles.fundHouse}>{item.fundHouse}</Text>
            <Text style={styles.schemeCode}>{item.schemeCode}</Text>
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{item.schemeType}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Min Investment</Text>
              <Text style={styles.detailValue}>₹{item.minInvestment}</Text>
            </View>
          </View>

          {/* FIXED OPEN/CLOSE DATE */}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Open Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.startDate)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Close Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.endDate)}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>
                SIP: {item.sipFlag === "Y" ? "Available" : "Not Available"}
              </Text>
            </View>
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>
                Purchase:{" "}
                {item.purchaseAllowed === "Y" ? "Allowed" : "Not Allowed"}
              </Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View
              style={[styles.riskIndicator, { backgroundColor: "#2B8DF6" }]}
            >
              <Text style={styles.riskText}>{item.riskLevel}</Text>
            </View>

            {/* Hide button for CLOSED tab */}
            {activeTab !== "CLOSED" && (
              <TouchableOpacity
                style={[
                  styles.investButton,
                  item.purchaseAllowed !== "Y" && styles.disabledButton,
                ]}
                onPress={() => {
                  dispatch(setInvestment(item.originalData));
                  navigation.navigate("NFoInvest");
                }}
                disabled={item.purchaseAllowed !== "Y"}
              >
                <Text style={styles.investButtonText}>
                  {item.purchaseAllowed === "Y"
                    ? "Invest Now"
                    : "Not Available"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#2B8DF6" />

      <Header />

      <View style={styles.tabContainer}>
        <TabButton
          title="Live NFOs"
          isActive={activeTab === "LIVE"}
          onPress={() => setActiveTab("LIVE")}
        />
        <TabButton
          title="Upcoming"
          isActive={activeTab === "UPCOMING"}
          onPress={() => setActiveTab("UPCOMING")}
        />
        <TabButton
          title="Closed"
          isActive={activeTab === "CLOSED"}
          onPress={() => setActiveTab("CLOSED")}
        />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2B8DF6" />
        ) : (
          <FlatList
            data={nfoData}
            renderItem={({ item }) => <NFOCard item={item} />}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No NFO Available</Text>
                  <Text style={styles.emptyStateText}>
                    There are currently no {activeTab.toLowerCase()} NFOs.
                  </Text>
                </View>
              )
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
    backgroundColor: "#2B8DF6",
  },
  headerGradient: {
    backgroundColor: "#2B8DF6",
    paddingBottom: heightToDp(2),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: widthToDp(3.5),
    color: "#E6F3FF",
    marginTop: heightToDp(0.5),
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: widthToDp(4),
    marginTop: heightToDp(2),
    borderRadius: widthToDp(3),
    padding: widthToDp(1),
    shadowColor: "#000",
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
    alignItems: "center",
    borderRadius: widthToDp(2),
  },
  activeTab: {
    backgroundColor: "#2B8DF6",
  },
  tabText: {
    fontSize: widthToDp(3.5),
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
    marginTop: heightToDp(2),
  },
  listContent: {
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(2),
    paddingBottom: heightToDp(4),
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  nfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginBottom: heightToDp(2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: heightToDp(2),
  },
  fundLogoContainer: {
    marginRight: widthToDp(3),
    alignItems: "center",
  },
  fundLogo: {
    width: widthToDp(12),
    height: widthToDp(12),
    borderRadius: widthToDp(2),
    resizeMode: "contain",
  },
  fundInfo: {
    flex: 1,
    marginRight: widthToDp(2),
  },
  schemeName: {
    fontSize: widthToDp(4),
    fontWeight: "600",
    color: "#333",
    marginBottom: heightToDp(0.5),
  },
  fundHouse: {
    fontSize: widthToDp(3.2),
    color: "#666",
    marginBottom: heightToDp(0.3),
  },
  schemeCode: {
    fontSize: widthToDp(2.8),
    color: "#999",
  },
  ratingContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.5),
    borderRadius: widthToDp(2),
  },
  ratingText: {
    fontSize: widthToDp(3),
    fontWeight: "600",
    color: "#FF9800",
  },
  cardDetails: {
    marginTop: heightToDp(1),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightToDp(1.5),
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: widthToDp(3),
    color: "#666",
    marginBottom: heightToDp(0.3),
  },
  detailValue: {
    fontSize: widthToDp(3.5),
    fontWeight: "600",
    color: "#333",
  },
  featureRow: {
    flexDirection: "row",
    marginBottom: heightToDp(1.5),
    gap: widthToDp(2),
  },
  featureTag: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.5),
    borderRadius: widthToDp(1),
  },
  featureText: {
    fontSize: widthToDp(2.8),
    color: "#666",
  },
  descriptionContainer: {
    marginBottom: heightToDp(2),
  },
  description: {
    fontSize: widthToDp(3.2),
    color: "#666",
    lineHeight: heightToDp(2.5),
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskIndicator: {
    paddingHorizontal: widthToDp(2.5),
    paddingVertical: heightToDp(0.7),
    borderRadius: widthToDp(2),
  },
  riskText: {
    fontSize: widthToDp(2.8),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  investButton: {
    backgroundColor: "#2B8DF6",
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.2),
    borderRadius: widthToDp(2),
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  investButtonText: {
    color: "#FFFFFF",
    fontSize: widthToDp(3.5),
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: heightToDp(10),
  },
  loadingText: {
    marginTop: heightToDp(2),
    fontSize: widthToDp(4),
    color: "#666",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: heightToDp(10),
    paddingHorizontal: widthToDp(8),
  },
  emptyStateTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: "600",
    color: "#333",
    marginBottom: heightToDp(1),
  },
  emptyStateText: {
    fontSize: widthToDp(3.8),
    color: "#666",
    textAlign: "center",
    lineHeight: heightToDp(3),
    marginBottom: heightToDp(2),
  },
  retryButton: {
    backgroundColor: "#2B8DF6",
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: widthToDp(3.5),
    fontWeight: "600",
  },
});

export default NFO;
