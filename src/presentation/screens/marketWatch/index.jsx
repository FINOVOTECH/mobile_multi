import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  BackHandler,
  Animated,
} from "react-native";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import * as Config from "../../../helpers/Config";
import { useDispatch, useSelector } from "react-redux";
import { apiGetService } from "../../../helpers/services";
import { widthToDp, heightToDp } from "../../../helpers/Responsive";
import { getData } from "../../../helpers/localStorage";
import ReturnCalculator from "../../../components/ReturnCalculator";
import {
  setInvestment,
  setInvestType,
} from "../../../store/slices/marketSlice";
import HistoricalNavChart from "../../../components/HistoricalChart";
import Rbutton from "../../../components/Rbutton";
import LinearGradient from "react-native-linear-gradient";
import bgVector from "../../../assets/Icons/vector.png";
import ChartLoader from "../ChartLoader";
import SInfoSvg from "../../svgs";
import { SafeAreaView } from "react-native-safe-area-context";

const MarketWatch = ({ navigation }) => {
  const [fadeAnim] = useState(new Animated.Value(0.3));
  const dispatch = useDispatch();
  const Data = useSelector((state) => state?.marketWatch?.marketData) || {};
  console.log("data===>>", Data);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cagr, setCagr] = useState(null);
  const [currentNav, setCurrentNav] = useState(null);
  const [dayChange, setDayChange] = useState(null);
  const [todayNavData, setTodayNavData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Get schemeISIN for chart
  const schemeISIN = useMemo(() => {
    return Data?.schemeISIN;
  }, [Data?.schemeISIN]);

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [loading, fadeAnim]);

  const animatedLineStyle = {
    opacity: fadeAnim,
  };

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

  const displayData = useMemo(() => {
    return {
      schemeName: Data?.schemeName || "",
      schemeType: Data?.schemeType || "",
      schemeCode: Data?.schemeCode || "",
      amcLogo: Data?.s3Url || Data?.amcLogo || "",
    };
  }, [
    Data?.schemeName,
    Data?.schemeType,
    Data?.schemeCode,
    Data?.s3Url,
    Data?.amcLogo,
  ]);

  const getCurrentNav = useMemo(() => {
    if (!todayNavData || !schemeISIN) return null;

    const navItem = todayNavData?.find((item) => item?.history === schemeISIN);
    return navItem?.price || null;
  }, [todayNavData, schemeISIN]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);

      if (!schemeISIN) {
        setSummaryLoading(false);
        return;
      }

      const token = getData(Config.store_key_login_details);
      const client = getData(Config.clientCode);
      const data = await fetch(
        `${Config.baseUrl}/api/v2/historical/data/fetch/scheme/details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
            clientCode: client,
          },
          body: JSON.stringify({ isinList: [schemeISIN] }),
        }
      );
      const response = await data.json();
      console.log("Summary Data ", response, [schemeISIN]);

      setSummaryData(response?.data?.[0]);
    } catch (error) {
      console.error("Failed to fetch Summary Data ", error);
    } finally {
      setSummaryLoading(false);
    }
  }, [schemeISIN]);

  const fetchTodayNavData = useCallback(async () => {
    if (!schemeISIN) return;

    try {
      const token = getData(Config.store_key_login_details);
      const client = getData(Config.clientCode);
      const data = await fetch(
        `${Config.baseUrl}/api/v2/historical/data/fetch/current/today-nav`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
            clientCode: client,
          },
          body: JSON.stringify({ navISINList: [schemeISIN] }),
        }
      );
      const response = await data.json();
      console.log("NAV DATA", response);

      if (response?.success && response?.data) {
        setTodayNavData(response?.data);
      }
    } catch (error) {
      console.error("Failed to fetch today NAV data:", error);
    }
  }, [schemeISIN]);

  const fetchHistoricalData = useCallback(async () => {
    if (!schemeISIN) {
      setError("No scheme ISIN available");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiGetService(
        `/api/v1/mutualfund/internal/fetch/update/history?history=${schemeISIN}`
      );

      if (response?.data?.history && Array.isArray(response?.data?.history)) {
        setFilteredData(response?.data?.history);
        console.log("Historical Data", response?.data);
        const latestData = response?.data?.history?.[0];
        if (latestData) {
          setCurrentNav(latestData?.nav);
          setCagr(response?.data?.navCalculation);
          const previousData = response?.data?.history?.[1];
          if (previousData) {
            const change =
              ((latestData?.nav - previousData?.nav) / previousData?.nav) * 100;
            setDayChange(change);
          }
        }
      } else {
        setError("Invalid data format received");
      }
    } catch (e) {
      console.error("Failed to fetch historical data:", e);
      setError("Failed to fetch historical data");
    } finally {
      setLoading(false);
    }
  }, [schemeISIN]);

  const filterData = useCallback((fullData) => {
    if (!fullData || !Array.isArray(fullData)) {
      return;
    }

    const sortedData = [...fullData].sort(
      (a, b) => new Date(a?.date) - new Date(b?.date)
    );
    const chartData = sortedData.map((item) => ({
      time: item?.date,
      value: parseFloat(item?.nav || item?.value || 0),
    }));
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-GB", options);
  };

  const renderFundInfo = () => (
    <View style={styles.fundInfo}>
      <View
        style={{
          flexDirection: "column",
          justifyContent: "start",
          marginBottom: heightToDp(2),
          alignItems: "flex-start",
        }}
      >
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {/* <View
            style={{
              width: 40,
              height: 40,
              // backgroundColor: 'white',
              // borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <SInfoSvg.WhiteBackButton onPress={() => navigation.goBack()}/>
          </View> */}
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: "white",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri: displayData?.amcLogo }}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.fundName}>{displayData?.schemeName}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 1, alignItems: "start" }}>
          <Text style={styles.fundSubtitle}>{displayData?.schemeType}</Text>
        </View>
      </View>
    </View>
  );

  const renderChart = () => (
    <View style={styles.chartSection}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonHeader}>
              <View style={styles.skeletonNav}>
                <View
                  style={[styles.skeletonLine, { width: "40%", height: 24 }]}
                />
              </View>
              <View style={styles.skeletonChange}>
                <View
                  style={[styles.skeletonLine, { width: "30%", height: 20 }]}
                />
              </View>
            </View>

            <View style={styles.skeletonChart}>
              {/* <View style={styles.skeletonChartLine}>
                <Animated.View
                  style={[
                    styles.skeletonLine,
                    styles.animatedLine,
                    animatedLineStyle,
                  ]}
                />
                <Text style={styles.loadingText}>Loading Chart Data...</Text>
              </View> */}
              <ChartLoader />
            </View>

            {/* Skeleton Time Range Selector */}
            <View style={styles.skeletonTimeRanges}>
              <View style={[styles.skeletonTimeRange, { width: "25%" }]} />
              <View style={[styles.skeletonTimeRange, { width: "25%" }]} />
              <View style={[styles.skeletonTimeRange, { width: "25%" }]} />
              <View style={[styles.skeletonTimeRange, { width: "25%" }]} />
              <View style={[styles.skeletonTimeRange, { width: "25%" }]} />
            </View>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchHistoricalData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData?.length > 0 ? (
        <HistoricalNavChart
          data={filteredData}
          chartHeight={200}
          primaryColor="#FFFFFF" // White chart lines
          backgroundColor="transparent" // Transparent background
          currency="₹"
          initialTimeRange="1M"
          showTimeRanges={false}
          onDataPointSelect={(point, index) => {
            // console.log('Selected:', point.nav, point.formattedDate);
          }}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No chart data available</Text>
        </View>
      )}
    </View>
  );

  // const renderFundDetails = () => {
  //   const currentNavValue = getCurrentNav;
  //   const navItem = todayNavData?.find((item) => item?.history === schemeISIN);
  //   // const navDate = navItem?.date;

  //   return (
  //     <View style={styles.sectionBox}>
  //       <View style={styles.sectionHeader}>
  //         <Text style={styles.sectionTitle}>Fund Details</Text>
  //       </View>
  //       <View style={styles.fundDetailsCard}>
  //         {/* Basic Fund Information */}
  //         <View style={styles.fundDetailsRow}>
  //           <View style={styles.fundDetailItem}>
  //             <Text style={styles.fundDetailLabel}>NAV :</Text>
  //             <Text style={styles.fundDetailValue}>
  //               ₹ {Data?.mostRecentNAV}
  //             </Text>
  //           </View>
  //           <View style={styles.fundDetailItem}>
  //             <Text style={styles.fundDetailLabel}>Scheme Code</Text>
  //             <View style={styles.ratingContainer}>
  //               <Text
  //                 style={{ ...styles.ratingValue, color: Config.Colors.green }}
  //               >
  //                 {displayData?.schemeCode || "N/A"}
  //               </Text>
  //             </View>
  //           </View>
  //         </View>

  //         {/* SIP Information */}
  //         {Data?.sipFlag === "Y" && (
  //           <View style={styles.fundDetailsRow}>
  //             <View style={styles.fundDetailItem}>
  //               <Text style={styles.fundDetailLabel}>SIP Available</Text>
  //               <Text style={styles.fundDetailValue}>
  //                 Min: ₹{Data?.sipMinimumInstallmentAmount || "100.00"}
  //               </Text>
  //             </View>
  //             <View style={styles.fundDetailItem}>
  //               <Text style={styles.fundDetailLabel}>Frequencies</Text>
  //               <Text style={styles.fundDetailValue}>
  //                 {Data?.sipFrequency?.join(", ") || "Monthly"}
  //               </Text>
  //             </View>
  //           </View>
  //         )}

  //         {/* Minimum Investment */}
  //         <View style={styles.fundDetailsRow}>
  //           <View style={styles.fundDetailItem}>
  //             <Text style={styles.fundDetailLabel}>Min Investment</Text>
  //             <Text style={styles.fundDetailValue}>
  //               ₹{Data?.minimumPurchaseAmount || "100.000"}
  //             </Text>
  //           </View>
  //           {/* <View style={styles.fundDetailItem}>
  //             <Text style={styles.fundDetailLabel}>Exit Load</Text>
  //             <Text style={styles.fundDetailValue}>
  //               {Data?.exitLoadFlag === 'Y' ? `${Data?.exitLoad}%` : 'None'}
  //             </Text>
  //           </View> */}
  //         </View>
  //       </View>
  //     </View>
  //   );
  // };
  const renderFundDetails = () => {
    const currentNavValue = getCurrentNav;
    const navItem = todayNavData?.find((item) => item?.history === schemeISIN);

    // Prepare SIP frequency-wise minimum amount
    const sipOptions = Data?.allSipOptions || [];

    console.log("SIP RAW DATA ==>", sipOptions);

    return (
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fund Details</Text>
        </View>

        <View style={styles.fundDetailsCard}>
          {/* Basic Fund Information */}
          <View style={styles.fundDetailsRow}>
            <View style={styles.fundDetailItem}>
              <Text style={styles.fundDetailLabel}>NAV :</Text>
              <Text style={styles.fundDetailValue}>
                ₹ {Data?.mostRecentNAV ||"N/A" }
              </Text>
            </View>

            <View style={styles.fundDetailItem}>
              <Text style={styles.fundDetailLabel}>Scheme Code</Text>
              <Text
                style={{ ...styles.ratingValue, color: Config.Colors.green }}
              >
                {displayData?.schemeCode || Data?.primarySchemeCode || "N/A"}
              </Text>
            </View>
          </View>

          {/* SIP DETAILS (FULL PATCHED VERSION) */}
          <View style={{ marginTop: heightToDp(1) }}>
            <Text style={styles.fundDetailLabel}>SIP Options</Text>

            <View style={{ marginTop: 6, flexDirection:"row" , gap:4 , justifyContent:'space-between'}}>
              {sipOptions.length > 0 ? (
                sipOptions.map(({ freq, amount }) => (
                  <View
                    key={freq}
                    style={{
                      // flexDirection: "row",
                      justifyContent: "space-between",
                      backgroundColor: "#F5F7FA",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                      width:'33%'
                    }}
                  >
                    <Text
                      style={{ fontSize: 14, color: "#333", fontWeight: "600" }}
                    >
                      {freq}
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        color: "#2B8DF6",
                        fontWeight: "700",
                      }}
                    >
                      ₹{amount}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#666", fontSize: 13 }}>
                  No SIP options available
                </Text>
              )}
            </View>
          </View>

          {/* Minimum Lumpsum Investment */}
          <View style={styles.fundDetailsRow}>
            <View style={styles.fundDetailItem}>
              <Text style={styles.fundDetailLabel}>Min Investment</Text>
              <Text style={styles.fundDetailValue}>
                ₹{Data?.minimumPurchaseAmount || "100.000"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderOverviewDetails = () => {
    if (!summaryData) return null;

    return (
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fund Overview</Text>
        </View>
        <View style={styles.overviewCard}>
          {summaryData?.exitLoad && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Exit Load</Text>
              <Text style={styles.detailValue}>{summaryData?.exitLoad}</Text>
            </View>
          )}

          {summaryData?.annualExpense && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Expense Ratio</Text>
              <Text style={styles.detailValue}>
                {summaryData?.annualExpense}
              </Text>
            </View>
          )}

          {Data?.lockInPeriodFlag === "Y" && Data?.lockInPeriod && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Lock-in Period</Text>
              <Text style={styles.detailValue}>{Data?.lockInPeriod} days</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSummaryContent = () => {
    if (!summaryData) {
      return (
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fund Summary</Text>
          </View>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No summary data available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fund Summary</Text>
        </View>
        <View style={styles.summaryContainer}>
          {summaryData?.objectiveOfScheme && (
            <View style={styles.summaryCard}>
              <Text style={styles.objectiveText}>
                {summaryData?.objectiveOfScheme}
              </Text>
            </View>
          )}
          {summaryData?.statedAssetAllocation && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Investment Philosophy</Text>
              <Text style={styles.summaryCardContent}>
                {summaryData?.statedAssetAllocation}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFundManagerContent = () => {
    if (!summaryData?.fundManagers || summaryData.fundManagers.length === 0) {
      return (
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fund Managers</Text>
          </View>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No fund manager data available
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fund Managers</Text>
        </View>
        <View style={styles.fundManagerContainer}>
          {summaryData.fundManagers.map((manager, index) => (
            <View key={index} style={styles.managerCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {manager.name
                      .split(" ")
                      .map((word) => word.charAt(0))
                      .join("")
                      .substring(0, 2)}
                  </Text>
                </View>
              </View>

              <View style={styles.managerInfo}>
                <Text style={styles.managerName}>
                  {manager.name.replace("Mr. ", "").replace("Mr ", "")}
                </Text>
                <Text style={styles.managerRole}>{manager.type}</Text>
                <Text style={styles.managerRole}>{manager.fromDate}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderReturnsContent = () => {
    // Use CAGR data if available, otherwise use direct NAV data from response
    const returnsData = Data || cagr;

    if (!returnsData) {
      return (
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Returns</Text>
          </View>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No returns data available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Returns</Text>
        </View>
        <View style={styles.returnsCard}>
          <View style={styles.returnsGrid}>
            {[
              { label: "7 Days", value: returnsData?.nav7d || "0" },
              { label: "1 Month", value: returnsData?.nav1m || "0" },
              { label: "3 Months", value: returnsData?.nav3m || "0" },
              { label: "6 Months", value: returnsData?.nav6m || "0" },
              { label: "1 Year", value: returnsData?.nav1y || "0" },
              { label: "3 Years", value: returnsData?.nav3y || "0" },
            ].map((item, index) => (
              <View key={index} style={styles.returnItem}>
                <Text style={styles.returnLabel}>{item.label || "0"}</Text>
                <Text
                  style={[
                    styles.returnValue,
                    {
                      color:
                        parseFloat(item.value) >= 0
                          ? Config.Colors.green
                          : Config.Colors.red,
                    },
                  ]}
                >
                  {parseFloat(item.value).toFixed(2)}%
                </Text>
              </View>
            ))}
          </View>

          <ReturnCalculator cagrData={returnsData} />
        </View>
      </View>
    );
  };

  const renderInvestButton = () => (
    <View
      style={{
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-evenly",
        backgroundColor: "transparent",
        paddingVertical: heightToDp(2),
      }}
    >
      <View style={{ width: "40%" }}>
        <Rbutton
          title="Lumpsum"
          onPress={() => {
            navigation.navigate("Invest");
            dispatch(setInvestType("LUMPSUM"));
            dispatch(setInvestment(Data));
          }}
          style={styles.investButton}
          textStyle={styles.investButtonText}
        />
      </View>

      <View style={{ width: "40%" }}>
        <Rbutton
          title="Start SIP"
          onPress={() => {
            navigation.navigate("Invest");
            dispatch(setInvestType("SIP"));
            dispatch(setInvestment(Data));
          }}
          style={styles.investButton}
          textStyle={styles.investButtonText}
        />
      </View>
    </View>
  );

  useEffect(() => {
    if (schemeISIN) {
      fetchHistoricalData();
    } else {
      setError("No scheme ISIN available");
    }
  }, [schemeISIN, fetchHistoricalData]);

  useEffect(() => {
    fetchTodayNavData();
    fetchSummary();
  }, [fetchTodayNavData, fetchSummary]);

  return (
    // <SafeAreaView style={styles.container}>
    //   {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
    //   <StatusBar barStyle="dark-content" backgroundColor="#2B8DF6" />

    //   {/* Header with Gradient Background */}
    //   <LinearGradient
    //     colors={["#2B8DF6", "#2B8DF6"]}
    //     style={styles.headerGradient}
    //     start={{ x: 0, y: 0 }}
    //     end={{ x: 0, y: 1 }}
    //   >
    //     <Image
    //       source={bgVector}
    //       style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
    //       resizeMode="cover"
    //     />
    //     {renderFundInfo()}

    //     {/* Chart Container with Shadow */}
    //     {/* <View style={styles.chartContainer}>
    //       {renderChart()}

    //       <LinearGradient
    //         colors={['rgba(43, 141, 246, 0.8)', 'transparent']}
    //         style={styles.topShadow}
    //         start={{ x: 0, y: 0 }}
    //         end={{ x: 0, y: 1 }}
    //       />
    //     </View> */}
    //   </LinearGradient>

    //   <ScrollView
    //     style={styles.scrollView}
    //     showsVerticalScrollIndicator={false}
    //     contentContainerStyle={styles.scrollContent}
    //   >
    //     <LinearGradient
    //       colors={["#2B8DF6", "#2B8DF6"]}
    //       style={styles.headerGradient}
    //       start={{ x: 0, y: 0 }}
    //       end={{ x: 0, y: 1 }}
    //     >
    //       <View style={styles.chartContainer}>
    //         {renderChart()}

    //         <LinearGradient
    //           colors={["rgba(43, 141, 246, 0.8)", "transparent"]}
    //           style={styles.topShadow}
    //           start={{ x: 0, y: 0 }}
    //           end={{ x: 0, y: 1 }}
    //         />
    //       </View>
    //     </LinearGradient>

    //     {renderFundDetails()}

    //     {renderOverviewDetails()}

    //     {renderReturnsContent()}
    //     {/* 
    //     {renderSummaryContent()}

    //     {renderFundManagerContent()} */}

    //     <View style={styles.bottomPadding} />
    //   </ScrollView>

    //   {renderInvestButton()}
    // </SafeAreaView>
 
  <SafeAreaView style={styles.container}>
    {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
    <StatusBar barStyle="dark-content" backgroundColor="#2B8DF6" />

    {/* TOP HEADER GRADIENT */}
    <LinearGradient
      colors={["#2B8DF6", "#2B8DF6"]}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Image
        source={bgVector}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        resizeMode="cover"
      />

      {renderFundInfo()}
    </LinearGradient>

    {/* SCROLL CONTENT – NO NESTED GRADIENT */}
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* CHART SECTION WRAPPER (REPLACES INNER LINEAR GRADIENT) */}
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          {renderChart()}

          {/* SAFE SHADOW REPLACEMENT */}
          <View
            style={[
              styles.topShadow,
              { backgroundColor: "rgba(43, 141, 246, 0.45)" },
            ]}
          />
        </View>
      </View>

      {renderFundDetails()}

      {renderOverviewDetails()}

      {renderReturnsContent()}

      {/* {renderSummaryContent()} */}
      {/* {renderFundManagerContent()} */}

      <View style={styles.bottomPadding} />
    </ScrollView>

    {renderInvestButton()}
  </SafeAreaView>


  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    // height: StatusBar.currentHeight,
    backgroundColor: "#2B8DF6",
  },
  headerGradient: {
    backgroundColor: "#2B8DF6",
    paddingBottom: heightToDp(1),
  },
  chartContainer: {
    position: "relative",
    marginTop: heightToDp(1),
  },
  topShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: heightToDp(5),
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
    marginTop: -heightToDp(2), // Overlap the gradient slightly
  },
  scrollContent: {
    paddingBottom: heightToDp(2),
    backgroundColor: Config.Colors.cyan_blue,
    borderTopLeftRadius: widthToDp(4),
    borderTopRightRadius: widthToDp(4),
    // marginTop: heightToDp(2),
  },
  bottomPadding: {
    height: heightToDp(5),
  },
  fundInfo: {
    paddingHorizontal: widthToDp(2.5),
    paddingTop: heightToDp(1),
  },
  fundName: {
    fontSize: widthToDp(4),
    width: "80%",
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fundSubtitle: {
    fontSize: widthToDp(3.2),
    color: "#E6F3FF",
    marginLeft: widthToDp(13),
    padding: heightToDp(0.3),
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 4,
    marginTop: heightToDp(0.5),
  },
  chartSection: {
    backgroundColor: "transparent",
    borderRadius: widthToDp(4),
    height: heightToDp(29),
    marginTop: heightToDp(1),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  chartWrapper: {
  backgroundColor: "#2B8DF6",
  paddingBottom: heightToDp(1),
},
  loadingText: {
    fontSize: widthToDp(3.5),
    color: "#FFFFFF",
    marginTop: heightToDp(1),
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: widthToDp(5),
    backgroundColor: "transparent",
  },
  errorText: {
    fontSize: widthToDp(4),
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: heightToDp(2),
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
  },
  retryButtonText: {
    color: "#2B8DF6",
    fontSize: widthToDp(3.5),
    fontWeight: "600",
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: heightToDp(2),
    backgroundColor: "transparent",
  },
  noDataText: {
    fontSize: widthToDp(4),
    color: "#666",
  },

  // Section Box Styles
  sectionBox: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: widthToDp(4),
    marginTop: heightToDp(2),
    borderRadius: widthToDp(3),
    padding: widthToDp(3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: heightToDp(1),
    marginBottom: heightToDp(1),
  },
  sectionTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: "700",
    color: "#333",
  },

  fundDetailsCard: {
    backgroundColor: "#FFFFFF",
    padding: widthToDp(2),
    gap: 15,
  },
  fundDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightToDp(1),
  },
  fundDetailItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  fundDetailLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
    marginBottom: 4,
  },
  fundDetailValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "600",
  },
  skeletonContainer: {
    flex: 1,
    padding: widthToDp(4),
    backgroundColor: "transparent",
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: heightToDp(2),
  },
  skeletonNav: {
    alignItems: "flex-start",
  },
  skeletonChange: {
    alignItems: "flex-end",
  },
  skeletonChart: {
    height: heightToDp(20),
    backgroundColor: "rgba(255, 255, 255, 0.42)",
    borderRadius: widthToDp(2),
    marginBottom: heightToDp(2),
    overflow: "hidden",
    position: "relative",
  },
  skeletonGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  skeletonGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  skeletonChartLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonLine: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: widthToDp(1),
  },
  animatedLine: {
    width: "90%",
    height: 3,
    borderRadius: widthToDp(0.5),
    marginBottom: heightToDp(1), // Add space between line and text
  },

  // Loading text style
  loadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: widthToDp(3.5),
    fontWeight: "500",
    marginTop: heightToDp(1),
  },

  // If you want to add animation to the loading text
  loadingTextAnimated: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: widthToDp(3.5),
    fontWeight: "500",
    marginTop: heightToDp(1),
  },
  skeletonTimeRanges: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  skeletonTimeRange: {
    height: heightToDp(3),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: widthToDp(1),
  },

  investButton: {
    marginBottom: heightToDp(1),
  },
  investButtonText: {
    color: "black",
    fontSize: widthToDp(4),
    fontWeight: "600",
  },

  summaryContainer: {
    backgroundColor: "#FFFFFF",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: heightToDp(1),
  },
  summaryCardTitle: {
    fontSize: widthToDp(4),
    fontWeight: "600",
    marginBottom: heightToDp(1),
    color: "#333",
  },
  summaryCardContent: {
    fontSize: widthToDp(3.5),
    color: "#666",
    lineHeight: heightToDp(3),
  },
  objectiveText: {
    fontSize: widthToDp(3.5),
    color: "#666",
    lineHeight: heightToDp(3),
  },

  overviewCard: {
    backgroundColor: "#FFFFFF",
    padding: widthToDp(2),
  },
  cardTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: "600",
    color: "#333",
    marginBottom: heightToDp(2),
  },
  detailSection: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: heightToDp(1.5),
  },
  detailLabel: {
    fontSize: widthToDp(3.5),
    color: "#666",
  },
  detailValue: {
    fontSize: widthToDp(3.5),
    color: "#333",
    fontWeight: "500",
  },

  fundManagerContainer: {
    paddingVertical: heightToDp(1),
  },
  managerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: widthToDp(3),
    marginBottom: widthToDp(2),
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976d2",
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: widthToDp(0.5),
  },
  managerRole: {
    fontSize: 12,
    color: "#666",
  },

  returnsCard: {
    backgroundColor: "#FFFFFF",
    padding: widthToDp(2),
    borderRadius: 12,
  },

  returnsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  returnItem: {
    width: "30%",
    borderRadius: 10,
    paddingVertical: heightToDp(1),
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 12,
  },

  returnLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
    textAlign: "center",
  },

  returnValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default MarketWatch;
