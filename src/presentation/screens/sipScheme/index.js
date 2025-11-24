import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSelector, useDispatch } from 'react-redux';
import { setMarketData } from '../../../store/slices/marketSlice';
import CommonHeader from '../../../components/CommonHeader';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import * as Config from '../../../helpers/Config';
import HandAnimation from '../../../components/handAnimation';
import SInfoSvg from '../../svgs';

// Get screen width for TabView initial layout
const { width: screenWidth } = Dimensions.get('window');

// API configuration
const API_BASE_URL = `${Config.baseUrl}/api/v1/mutualfund/filter/universal`;
const LIMIT = 50;

const tabs = [
  { id: 'all', title: 'All Funds', priority: 'All', key: 'all' },
  { id: 'large', title: 'Large Cap', priority: 'LARGE', key: 'large' },
  { id: 'mid', title: 'Mid Cap', priority: 'MID', key: 'mid' },
  { id: 'small', title: 'Small Cap', priority: 'SMALL', key: 'small' },
  { id: 'hybrid', title: 'Hybrid Funds', priority: 'HYBRID', key: 'hybrid' },
  { id: 'liquid', title: 'Liquid Funds', priority: 'LIQUID', key: 'liquid' },
  { id: 'gold', title: 'Gold Funds', priority: 'GOLD', key: 'gold' },
  { id: 'debt', title: 'DEBT', priority: 'DEBT', key: 'debt' },
  { id: 'tax', title: 'Tax Saving', priority: 'tax', key: 'tax' },
  { id: 'elss', title: 'ELSS', priority: 'ELSS', key: 'elss' },
];

const routes = tabs.map(tab => ({ key: tab.key, title: tab.title }));

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Fetch wrapper for mutual funds.
 * Accepts `options` object which may include `signal` for abort.
 */
const fetchMutualFundsFromApi = async (
  search = '',
  page = 1,
  limit = LIMIT,
  options = {},
) => {
  const encoded = encodeURIComponent(search);
  const url = `${API_BASE_URL}?q=${encoded}&page=${page}&limit=${limit}`;
  console.log('Fetching URL:', url);

  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // spread options so caller can pass signal etc.
    ...options,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${text}`);
  }

  const responseData = await response.json();
  console.log('API Response:', responseData);
  return responseData;
};

const FundCard = React.memo(({ dispatch, navigation, fund, index }) => {
  const isEven = index % 2 === 0;
  const imageSize = 40;
  const borderRadius = 25;
  const marginRight = 8;

  return (
    <TouchableOpacity
      onPress={() => {
        dispatch(setMarketData(fund));
        navigation.navigate('MarketWatch');
      }}
      style={[
        styles.fundCard,
        {
          borderLeftColor: isEven
            ? Config.Colors.primary
            : Config.Colors.secondary,
        },
      ]}
    >
      <View style={styles.fundHeader}>
        <View style={styles.fundInfo}>
          <View style={styles.fundInfoRow}>
            <Image
              source={{
                uri:
                  fund.s3Url ||
                  fund.amcLogo ||
                  'https://cdn5.vectorstock.com/i/1000x1000/44/19/mutual-fund-vector-7404419.jpg',
              }}
              style={[
                styles.fundImage,
                {
                  width: imageSize,
                  height: imageSize,
                  borderRadius,
                  marginRight,
                },
              ]}
              resizeMode="contain"
            />
            <View style={styles.fundTextContainer}>
              <Text style={styles.fundName} numberOfLines={2}>
                {fund.schemeName || fund.variantFamilyName}
              </Text>
              <Text style={styles.amcName} numberOfLines={1}>
                {fund.amcCode || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
        {/* <View style={styles.schemeTypeContainer}>
          <Text style={styles.schemeType}>{fund.schemeType || 'N/A'}</Text>
        </View> */}
      </View>
    </TouchableOpacity>
  );
});

const TabContent = React.memo(
  ({
    tabKey,
    dispatch,
    navigation,
    data,
    isLoading,
    isLoadingMore,
    onEndReached,
    error,
    searchQuery,
  }) => {
    const renderFundItem = useCallback(
      ({ item, index }) => (
        <FundCard
          key={`${item.amcCode || 'unknown'}-${
            item.schemeName || 'unknown'
          }-${index}`}
          index={index}
          dispatch={dispatch}
          navigation={navigation}
          fund={item}
        />
      ),
      [dispatch, navigation],
    );

    const getItemLayout = useCallback(
      (_, index) => ({
        length: 120,
        offset: 120 * index,
        index,
      }),
      [],
    );

    const keyExtractor = useCallback(
      (item, index) =>
        `${item.amcCode || 'unknown'}-${item.schemeName || 'unknown'}-${index}`,
      [],
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
          <Text style={styles.noResultsText}>
            Try adjusting your search term "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsTitle}>No schemes available</Text>
          <Text style={styles.noResultsText}>
            No mutual fund schemes found for this category.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        renderItem={renderFundItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.fundList}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
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
  },
);

// --- Main SipScheme component ---
const SipScheme = React.memo(({ navigation }) => {
  const loginData = useSelector(state => state.login.loginData);
  const loadFundValue = useSelector(state => state.marketWatch?.fundType);
  const dispatch = useDispatch();

  const [isReady, setIsReady] = useState(false);

  // active tab index
  const [tabIndex, setTabIndex] = useState(0);

  // search input & debounced value
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  // data & pagination state for the active view
  const [data, setData] = useState([]); // currently displayed list (appended pages)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // store last used search param so we know if we should reset vs append
  const lastSearchRef = useRef('');
  const abortControllerRef = useRef(null);

  const getTabPriorityByIndex = useCallback(index => {
    const t = tabs[index];
    return t ? t.priority : 'All';
  }, []);

  const getInitialTabIndex = useCallback(() => {
    if (!loadFundValue || !loadFundValue.value) {
      return 0;
    }
    const idx = tabs.findIndex(tab => tab.priority === loadFundValue.value);
    return idx !== -1 ? idx : 0;
  }, [loadFundValue]);

  // build the search param used for API calls:
  // - if user typed something (non-empty and not equal to the All placeholder), use user input + " " + tabIndex
  // - otherwise use the tab priority + " " + tabIndex
  const buildSearchParam = useCallback(
    (tabIndexArg, userInput) => {
      const input = (userInput ?? '').trim();
      const priority = getTabPriorityByIndex(tabIndexArg) || 'All';
      const suffix = String(tabIndexArg ?? 0); // ensure we always append the tab index as a string

      if (input !== '' && input.toLowerCase() !== 'all') {
        return `${input} ${suffix}`.trim();
      }

      return `${priority} ${suffix}`.trim();
    },
    [getTabPriorityByIndex],
  );

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

      const resp = await fetchMutualFundsFromApi(searchParam, pageToLoad, LIMIT, {
        signal: abortControllerRef.current.signal,
      });

      // Defensive: ensure resp is an object
      const respData = resp || {};
      const items = Array.isArray(respData.data) ? respData.data : [];

      // Support both old 'families -> variants' format and new flat 'data' format
      let fetched = [];

      if (items.length > 0 && items[0] && items[0].variants) {
        // OLD format: families with variants[]
        fetched = items.flatMap(fam => {
          const variants = fam.variants || [];
          return variants.map(v => ({
            ...v,
            variantFamilyName: fam.variantFamilyName,
            amcCode: fam.amcCode,
            amcLogo: fam.amcLogo || fam.s3Url,
            familyId: fam._id,
          }));
        });
      } else {
        // NEW format: flat list of schemes in resp.data
        fetched = items.map(it => ({
          ...it,
          // keep existing properties if present, otherwise try sensible fallbacks
          variantFamilyName: it.variantFamilyName || it.schemeName || '',
          amcCode: it.amcCode || it.amc || 'N/A',
          amcLogo: it.amcLogo || it.s3Url || it.logo || null,
          familyId: it.familyId || it._id || null,
        }));
      }

      // Prefer server-provided pagination flag if available
      const more =
        typeof respData.hasNextPage === 'boolean'
          ? Boolean(respData.hasNextPage)
          : fetched.length === LIMIT;

      if (pageToLoad === 1) {
        setData(fetched);
      } else {
        setData(prev => [...prev, ...fetched]);
      }

      // Use server page if provided, otherwise local pageToLoad
      setPage(typeof respData.page === 'number' ? respData.page : pageToLoad);
      setHasMore(more);
      lastSearchRef.current = searchParam;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setError(err?.message || 'Failed to load mutual funds');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial mount: set initial tab index & fetch page 1 with its priority (or 'All')
  useEffect(() => {
    const initialIndex = getInitialTabIndex();
    setTabIndex(initialIndex);

    const initialSearchParam = buildSearchParam(initialIndex, 'All'); // initial 'All'
    loadPage(initialSearchParam, 1);

    setTimeout(() => setIsReady(true), 100);
    // cleanup on unmount
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [getInitialTabIndex, buildSearchParam, loadPage]);

  // when tab changes: reset page and fetch using tab priority (with appended index or user input + index)
  useEffect(() => {
    const effectiveSearch = buildSearchParam(tabIndex, debouncedSearchQuery);
    loadPage(effectiveSearch, 1);
  }, [tabIndex]); // intentionally not including debouncedSearchQuery here

  // when debounced user search changes: call API with user input + tabIndex
  useEffect(() => {
    const effectiveSearch = buildSearchParam(tabIndex, debouncedSearchQuery);
    loadPage(effectiveSearch, 1);
  }, [debouncedSearchQuery, tabIndex, buildSearchParam, loadPage]);

  // handle infinite scroll: fetch next page if hasMore and not loading
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isLoading) return;
    if (!hasMore) return;

    const nextPage = page + 1;
    const effectiveSearch = buildSearchParam(tabIndex, debouncedSearchQuery);
    loadPage(effectiveSearch, nextPage);
  }, [
    isLoadingMore,
    isLoading,
    hasMore,
    page,
    tabIndex,
    debouncedSearchQuery,
    buildSearchParam,
    loadPage,
  ]);

  // local filter to enforce the tab priority on the returned server results.
  // This ensures the UI always respects the tab even if server search is broader.
  const filteredData = useCallback(() => {
    const currentPriority = getTabPriorityByIndex(tabIndex);

    if (!data || data.length === 0) return [];

    // All tab → return all schemes
    if (!currentPriority || currentPriority === 'All') return data;

    // Filter schemes based on schemeName or variantFamilyName
    return data.filter(
      fund =>
        fund.schemeName?.toUpperCase().includes(currentPriority) ||
        fund.variantFamilyName?.toUpperCase().includes(currentPriority),
    );
  }, [data, tabIndex, getTabPriorityByIndex]);

  // handlers for UI search input
  const handleSearchChange = useCallback(text => {
    setSearchQuery(text);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // render scene for TabView
  const renderScene = useCallback(
    ({ route }) => {
      return (
        <TabContent
          tabKey={route.key}
          dispatch={dispatch}
          navigation={navigation}
          data={filteredData()}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          onEndReached={handleLoadMore}
          error={error}
          searchQuery={searchQuery}
        />
      );
    },
    [
      dispatch,
      navigation,
      filteredData,
      isLoading,
      isLoadingMore,
      handleLoadMore,
      error,
      searchQuery,
    ],
  );

  const renderTabBar = useCallback(
    props => (
      <TabBar
        {...props}
        scrollEnabled={true}
        indicatorStyle={styles.tabIndicator}
        style={styles.tabBarStyle}
        tabStyle={styles.tab}
        labelStyle={styles.tabLabel}
        activeColor={Config.Colors.white}
        inactiveColor={Config.Colors.lightGray}
        renderLabel={({ route, focused }) => (
          <Text
            style={[
              styles.tabText,
              focused ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            {route.title}
          </Text>
        )}
      />
    ),
    [],
  );

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
        <StatusBar barStyle="dark-content" backgroundColor="#2B8DF6" />
        <View style={styles.loadingContainer}>
          <HandAnimation size="large" color="#007bff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search schemes, AMC, or codes"
            placeholderTextColor="#6c757d"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={idx => setTabIndex(idx)}
        initialLayout={{ width: screenWidth }}
        style={styles.tabView}
        lazy={true}
        lazyPreloadDistance={1}
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
    height: StatusBar.currentHeight || 0,
    backgroundColor: '#2B8DF6',
  },
  header: {
    backgroundColor: '#2B8DF6',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    // borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    color: '#212529',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  tabView: {
    flex: 1,
  },
  tabBarStyle: {
    backgroundColor: '#2B8DF6',
    elevation: 0,
    shadowOpacity: 0,
    padding: 4,
  },
  tabIndicator: {
    backgroundColor: '#ffffff',
    borderWidth: 0,
    borderRadius: 4,
    height: 5,
  },
  tab: {
    width: 'auto',
    minWidth: 100,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'none',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  activeTabText: {
    color: Config.Colors.white,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: Config.Colors.lightGray,
  },
  fundList: {
    padding: 16,
  },
  fundCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: widthToDp(3) || 12,
    marginBottom: 12,
    width: 'auto',
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fundInfo: {
    flex: 1,
    marginRight: 12,
  },
  fundInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fundImage: {
    // Dynamic styles applied inline
  },
  fundTextContainer: {
    maxWidth: '80%',
    flex: 1,
  },
  fundName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    lineHeight: 22,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  amcName: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  schemeTypeContainer: {
    alignItems: 'flex-end',
  },
  schemeType: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Config.Colors.primary,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});

export default SipScheme;
