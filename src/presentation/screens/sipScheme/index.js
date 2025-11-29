import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { TabView, TabBar } from "react-native-tab-view";
import { useSelector, useDispatch } from "react-redux";
import { setMarketData } from "../../../store/slices/marketSlice";
import { SafeAreaView } from "react-native-safe-area-context";
import { widthToDp } from "../../../helpers/Responsive";
import * as Config from "../../../helpers/Config";
import HandAnimation from "../../../components/handAnimation";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get("window");
const API_BASE_URL = `${Config.baseUrl}/api/v1/mutualfund/filter/universal`;
const LIMIT = 50;

const tabs = [
  { id: "all", title: "All Funds", priority: "All", key: "all" },
  { id: "large", title: "Large Cap", priority: "LARGE", key: "large" },
  { id: "mid", title: "Mid Cap", priority: "MID", key: "mid" },
  { id: "small", title: "Small Cap", priority: "SMALL", key: "small" },
  { id: "hybrid", title: "Hybrid Funds", priority: "HYBRID", key: "hybrid" },
  { id: "liquid", title: "Liquid Funds", priority: "LIQUID", key: "liquid" },
  { id: "gold", title: "Gold Funds", priority: "GOLD", key: "gold" },
  { id: "debt", title: "DEBT", priority: "DEBT", key: "debt" },
  { id: "elss", title: "ELSS", priority: "ELSS", key: "elss" },
];

const routes = tabs.map((tab) => ({ key: tab.key, title: tab.title }));

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const fetchMutualFundsFromApi = async (search = "", page = 1, options = {}) => {
  const encoded = encodeURIComponent(search);
  const url = `${API_BASE_URL}?q=${encoded}&page=${page}&limit=${LIMIT}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};


const SipScheme = React.memo(({ navigation }) => {
  const dispatch = useDispatch();
  const loadFundValue = useSelector((state) => state.marketWatch?.fundType);
  
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 800);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const getInitialTabIndex = useCallback(() => {
    if (!loadFundValue?.value) return 0;
    const idx = tabs.findIndex((tab) => tab.priority === loadFundValue.value);
    return idx !== -1 ? idx : 0;
  }, [loadFundValue]);

  const buildSearchParam = useCallback((tabIndexArg, userInput) => {
    const input = (userInput ?? "").trim();
    const priority = tabs[tabIndexArg]?.priority || "All";
    const suffix = String(tabIndexArg ?? 0);

    if (input !== "" && input.toLowerCase() !== "all") {
      return `${input} ${suffix}`.trim();
    }
    return `${priority} ${suffix}`.trim();
  }, []);

  const loadPage = useCallback(async (searchParam, pageToLoad = 1) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (pageToLoad === 1) {
        setIsLoading(true);
        setError(null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const resp = await fetchMutualFundsFromApi(searchParam, pageToLoad, {
        signal: abortControllerRef.current.signal,
      });

      const respData = resp || {};
      const items = Array.isArray(respData.data) ? respData.data : [];
      
      let fetched = items.map((it) => ({
        ...it,
        variantFamilyName: it.variantFamilyName || it.schemeName || "",
        amcCode: it.amcCode || it.amc || "N/A",
        amcLogo: it.amcLogo || it.s3Url || it.logo || null,
      }));

      const more = typeof respData.hasNextPage === "boolean" 
        ? Boolean(respData.hasNextPage) 
        : fetched.length === LIMIT;

      if (pageToLoad === 1) {
        setData(fetched);
      } else {
        setData((prev) => [...prev, ...fetched]);
      }

      setPage(typeof respData.page === "number" ? respData.page : pageToLoad);
      setHasMore(more);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to load mutual funds");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const initialIndex = getInitialTabIndex();
    setTabIndex(initialIndex);
    const initialSearchParam = buildSearchParam(initialIndex, "All");
    loadPage(initialSearchParam, 1);

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [getInitialTabIndex, buildSearchParam, loadPage]);

  useEffect(() => {
    const effectiveSearch = buildSearchParam(tabIndex, debouncedSearchQuery);
    loadPage(effectiveSearch, 1);
  }, [tabIndex, debouncedSearchQuery, buildSearchParam, loadPage]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) return;
    const nextPage = page + 1;
    const effectiveSearch = buildSearchParam(tabIndex, debouncedSearchQuery);
    loadPage(effectiveSearch, nextPage);
  }, [isLoadingMore, isLoading, hasMore, page, tabIndex, debouncedSearchQuery, buildSearchParam, loadPage]);

  const renderScene = useCallback(
    ({ route }) => (
      <TabContent
        data={data}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onEndReached={handleLoadMore}
        error={error}
        searchQuery={searchQuery}
      />
    ),
    [data, isLoading, isLoadingMore, handleLoadMore, error, searchQuery]
  );

  const renderTabBar = useCallback(
    (props) => (
      <TabBar
        {...props}
        scrollEnabled={true}
        indicatorStyle={styles.tabIndicator}
        style={styles.tabBarStyle}
        tabStyle={styles.tab}
        renderLabel={({ route, focused }) => (
          <Text style={[styles.tabText, focused ? styles.activeTabText : styles.inactiveTabText]}>
            {route.title}
          </Text>
        )}
      />
    ),
    []
  );
const FundCard = React.memo(({ dispatch, navigation, fund, index }) => {
  const isEven = index % 2 === 0;
  const loginDetails = useSelector(state => state.login.loginData);

  const holdingMode = loginDetails?.user?.holdingMode; 
  // "PHYSICAL" or "DEMAT"

const sipList = fund?.sipDetails || [];

// FILTER BY HOLDING MODE
const validByMode = sipList.filter((item) => {
  if (holdingMode === "PHYSICAL") return item.sipTransactionMode === "P";
  if (holdingMode === "DEMAT")
    return item.sipTransactionMode === "DP" || item.sipTransactionMode === "D";
  return true;
});

// GROUP MINIMUM AMT BY FREQUENCY
const groupedSip = Object.entries(
  validByMode.reduce((acc, cur) => {
    const freq = cur.sipFrequency;
    const amt = Number(cur.sipMinimumInstallmentAmount);
    if (!acc[freq] || amt < acc[freq]) acc[freq] = amt;
    return acc;
  }, {})
).map(([freq, amount]) => ({ freq, amount }));


  if (validByMode.length === 0) return null;


  return (
    <TouchableOpacity
    onPress={() => {
  dispatch(
    setMarketData({
      ...fund,
      allSipOptions: groupedSip,  // 💥 Attach cleaned SIP data
    })
  );
  navigation.navigate("MarketWatch");
}}

      style={[
        styles.fundCard,
        { borderLeftColor: isEven ? Config.Colors.primary : Config.Colors.secondary },
      ]}
    >
      {/* TOP ROW */}
      <View style={styles.fundInfoRow}>
        <Image
          source={{
            uri:
              fund.s3Url ||
              fund.amcLogo ||
              "https://cdn5.vectorstock.com/i/1000x1000/44/19/mutual-fund-vector-7404419.jpg",
          }}
          style={styles.fundImage}
          resizeMode="contain"
        />

        <View style={styles.fundTextContainer}>
          <Text style={styles.fundName} numberOfLines={2}>
            {fund.schemeName || fund.variantFamilyName}
          </Text>
          <Text style={styles.amcName} numberOfLines={1}>
            {fund.schemeCode || fund.amcCode}
          </Text>
        </View>
      </View>

      {/* SIP FREQUENCY SECTION */}
   {groupedSip.length > 0 && (
  <View style={{ marginTop: 12 }}>
    <Text style={{ fontSize: 11, color: "#6c757d", marginBottom: 6 }}>
      Min SIP Amount
    </Text>

    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {groupedSip.map(({ freq, amount }) => (
        <View
          key={freq}
          style={{
            backgroundColor: "#F1F3F5",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6",
            flexDirection: "row",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", marginRight: 4 }}>
            {freq}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E88E5" }}>
            ₹{amount}
          </Text>
        </View>
      ))}
    </View>
  </View>
)}

    </TouchableOpacity>
  );
});


const TabContent = React.memo(({ data, isLoading, isLoadingMore, onEndReached, error, searchQuery }) => {
  const renderFundItem = useCallback(
   ({ item, index }) => (
  <FundCard 
    dispatch={dispatch}
    navigation={navigation}
    index={index}
    fund={item}
  />
)

  );

  const keyExtractor = useCallback(
    (item, index) => `${item.amcCode}-${item.schemeName}-${index}`,
    []
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <HandAnimation />
      </View>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error Loading Data</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (searchQuery && data.length === 0 && !isLoading) {
    return (
      <View style={styles.noResultsContainer}>
        <Text style={styles.noResultsTitle}>No schemes found</Text>
        <Text style={styles.noResultsText}>Try adjusting your search term "{searchQuery}"</Text>
      </View>
    );
  }

  if ((!data || data.length === 0) && !isLoading) {
    return (
      <View style={styles.noResultsContainer}>
        <Text style={styles.noResultsTitle}>No schemes available</Text>
        <Text style={styles.noResultsText}>No mutual fund schemes found for this category.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderFundItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.fundList}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.loadingMoreContainer}>
            <HandAnimation />
          </View>
        ) : null
      }
    />
  );
});

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#2B8DF6" />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search schemes, AMC, or codes"
            placeholderTextColor="#6c757d"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setTabIndex}
        initialLayout={{ width: screenWidth }}
        style={styles.tabView}
        lazy={true}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    backgroundColor: "#2B8DF6",
  },
  header: {
    backgroundColor: "#2B8DF6",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomColor: "#e9ecef",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "bold",
  },
  tabView: {
    flex: 1,
  },
  tabBarStyle: {
    backgroundColor: "#2B8DF6",
    elevation: 0,
    shadowOpacity: 0,
    padding: 4,
  },
  tabIndicator: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    height: 5,
  },
  tab: {
    width: "auto",
    minWidth: 100,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: Config.Colors.white,
    fontWeight: "600",
  },
  inactiveTabText: {
    color: Config.Colors.lightGray,
  },
  fundList: {
    padding: 16,
  },
  fundCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: widthToDp(3) || 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fundInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fundImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 8,
  },
  fundTextContainer: {
    flex: 1,
  },
  fundName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212529",
    lineHeight: 22,
    marginBottom: 4,
  },
  amcName: {
    fontSize: 10,
    color: "#6c757d",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#dc3545",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  fundSIPTag: {
  backgroundColor: "#F1F3F5",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#DEE2E6",
  flexDirection: "row",
  alignItems: "center",
  marginRight: 8,
  marginBottom: 8,
},

});

export default SipScheme;