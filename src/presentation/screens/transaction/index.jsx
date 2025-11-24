import React, { useEffect, useState, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, TabBar } from 'react-native-tab-view';
import * as Config from '../../../helpers/Config';
import SInfoSvg from '../../svgs';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const Transaction = ({ navigation }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [page, setPage] = useState(1);
  const [TOKEN, setTOKEN] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  const [fromDate, setFromDate] = useState(new Date('2025-05-01'));
  const [toDate, setToDate] = useState(new Date('2025-10-31'));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setTOKEN(storedToken);
          setTokenLoaded(true);
        }
      } catch (err) {
        console.error('Error fetching token:', err);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (tokenLoaded && TOKEN) {
      FetchTransaction(1, true);
    }
  }, [fromDate, toDate, TOKEN, tokenLoaded]);

  const FetchTransaction = async (pageNumber = 1, reset = false) => {
    if (!TOKEN) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    try {
      const from = moment(fromDate).format('DD/MM/YYYY');
      const to = moment(toDate).format('DD/MM/YYYY');
      const url = `${Config.baseUrl}/api/v1/mutualfund/orderstatus/me?fromDate=${from}&toDate=${to}&page=${pageNumber}&limit=20`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const results = data?.data || [];

      if (reset) {
        setTransactionData(results);
      } else {
        setTransactionData((prev) => [...prev, ...results]);
      }

      setHasMore(pageNumber < data?.totalPages);
      setPage(pageNumber);
    } catch (error) {
      console.error('Transaction fetch error:', error.message);
      setTransactionData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (orderNo) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderNo)) newSet.delete(orderNo);
      else newSet.add(orderNo);
      return newSet;
    });
  };

  const loadMoreData = useCallback(() => {
    if (!loading && hasMore) {
      FetchTransaction(page + 1, false);
    }
  }, [page, loading, hasMore]);

  const renderTransactionItem = ({ item }) => {
    const isExpanded = expandedItems.has(item?.orderNo);
    const statusColor =
      item?.orderStatus === 'INVALID' || item?.orderStatus === 'FAILED'
        ? '#FF4444'
        : '#00AA00';
    const statusBgColor =
      item?.orderStatus === 'INVALID' || item?.orderStatus === 'FAILED'
        ? '#FFEEEE'
        : '#EEFFEE';

    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleExpanded(item?.orderNo)}
          activeOpacity={0.7}>
          <View style={styles.headerMainContent}>
            <View style={styles.headerTopRow}>
              <Text style={styles.referenceNumber}>#{item?.orderNo}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item?.orderStatus}
                </Text>
              </View>
            </View>

            <View style={styles.headerMiddleRow}>
              <View>
                <Text style={styles.clientCode}>{item?.clientName}</Text>
                <Text style={styles.schemaCode}>{item?.schemeName}</Text>
              </View>
              <Text style={styles.orderValue}>₹{item?.amount}</Text>
            </View>

            <View style={styles.headerBottomRow}>
              <Text style={styles.dateText}>{item?.date || 'N/A'}</Text>
              <Text style={styles.transactionType}>{item?.buySellType}</Text>
            </View>
          </View>

          <View style={styles.expandIconContainer}>
            {!isExpanded ? (
              <SInfoSvg.DownArrow width={20} height={20} color="#666" />
            ) : (
              <SInfoSvg.UpChevron width={20} height={20} color="#666" />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.accordionContent}>
            <View style={styles.detailsSection}>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Client Code</Text>
                  <Text style={styles.detailValue}>{item?.clientCode}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ISIN</Text>
                  <Text style={styles.detailValue}>{item?.isin}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DP Folio</Text>
                  <Text style={styles.detailValue}>{item?.dpFolioNo}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>KYC Flag</Text>
                  <Text style={styles.detailValue}>{item?.kycFlag}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Remarks</Text>
                  <Text style={styles.detailValue}>{item?.orderRemarks || '—'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Created At</Text>
                  <Text style={styles.detailValue}>
                    {moment(item?.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderScene = () => (
    <View style={styles.sceneContainer}>
      {loading && transactionData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Config?.Colors?.primary} />
        </View>
      ) : (
        <FlatList
          data={transactionData}
          renderItem={renderTransactionItem}
          keyExtractor={(item, index) => `${item?.orderNo || index}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loading && transactionData.length > 0 ? (
              <ActivityIndicator size="small" color={Config?.Colors?.primary} />
            ) : null
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No transactions found</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Order Status</Text>
      </View>

      <View style={styles.dateFilterContainer}>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateTextBtn}>
            From: {moment(fromDate).format('DD/MM/YYYY')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateTextBtn}>
            To: {moment(toDate).format('DD/MM/YYYY')}
          </Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setFromDate(selectedDate);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) setToDate(selectedDate);
          }}
        />
      )}

      {renderScene()}
    </SafeAreaView>
  );
};

export default Transaction;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Config?.Colors?.white },
  androidStatusBar: { height: StatusBar.currentHeight, backgroundColor: 'transparent' },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: { position: 'absolute', left: 16 },
  pageTitle: { fontSize: 18, fontWeight: '600', color: Config?.Colors?.black },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  dateButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateTextBtn: { fontSize: 14, color: '#333' },
  listContainer: { padding: 12 },
  accordionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  headerMainContent: { flex: 1 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  referenceNumber: { fontSize: 14, fontWeight: '500', color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  headerMiddleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  clientCode: { fontSize: 16, fontWeight: '600', color: Config?.Colors?.textPrimary },
  schemaCode: { fontSize: 14, color: '#666' },
  orderValue: { fontSize: 18, fontWeight: '700', color: Config?.Colors?.textPrimary },
  headerBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { fontSize: 12, color: '#666' },
  transactionType: { fontSize: 12, fontWeight: '600', color: Config?.Colors?.primary },
  accordionContent: { padding: 16, backgroundColor: '#FAFAFA' },
  detailItem: { marginBottom: 6 },
  detailLabel: { fontSize: 12, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '500', color: Config?.Colors?.textPrimary },
  remarksSection: { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 12 },
  remarksTitle: { fontSize: 14, fontWeight: '600', color: '#FF4444' },
  remarksText: { fontSize: 13, color: '#FF4444' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
});
