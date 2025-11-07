import {
  SafeAreaView,
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
import React, { useEffect, useState } from 'react';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { apiGetService } from '../../../helpers/services';
import * as Config from '../../../helpers/Config';
import { heightToDp, widthToDp } from '../../../helpers/Responsive';
import SInfoSvg from '../../svgs';

const Transaction = ({ navigation }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const routes = [
    { key: 'SIP', title: 'SIP' },
    { key: 'LUMPSUM', title: 'Lumpsum' },
    { key: 'SWP', title: 'SWP' },
  ];
  useEffect(() => {
    const backAction = () => {
      // BackHandler.exitApp();
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);
  useEffect(() => {
    FetchTransaction(routes[tabIndex].key);
  }, [tabIndex]);

  const FetchTransaction = async item => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://onekyc.finovo.tech:8015/api/v1/admin/feature/history/transaction?transactionType=${item}`,
      );
      const data = await response.json();
      console.log('Transaction data', data);
      setTransactionData(data.results || []);
    } catch (error) {
      console.error(`${error}||${error.message}`);
      setTransactionData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = referenceNumber => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(referenceNumber)) {
        newSet.delete(referenceNumber);
      } else {
        newSet.add(referenceNumber);
      }
      return newSet;
    });
  };

  const renderTransactionItem = ({ item, index }) => {
    const isExpanded = expandedItems.has(item?.referenceNumber);
    const statusColor =
      item?.bseResponseFlag === 'FAILED' ? '#FF4444' : '#00AA00';
    const statusBgColor =
      item?.bseResponseFlag === 'FAILED' ? '#FFEEEE' : '#EEFFEE';

    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleExpanded(item?.referenceNumber)}
          activeOpacity={0.7}
        >
          <View style={styles.headerMainContent}>
            <View style={styles.headerTopRow}>
              <Text style={styles.referenceNumber}>
                #{item?.referenceNumber || 'N/A'}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusBgColor }]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item?.bseResponseFlag || 'Unknown'}
                </Text>
              </View>
            </View>

            <View style={styles.headerMiddleRow}>
              <View>
                <Text style={styles.clientCode}>
                  {item?.clientCode || 'N/A'}
                </Text>
                <Text style={styles.schemaCode}>
                  {item?.schemaCode || 'N/A'}
                </Text>
              </View>
              <Text style={styles.orderValue}>₹{item?.orderValue || '0'}</Text>
            </View>

            <View style={styles.headerBottomRow}>
              <Text style={styles.dateText}>
                {item?.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : 'N/A'}
              </Text>
              <Text style={styles.transactionType}>
                {item?.transactionType}
              </Text>
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
              {/* <Text style={styles.detailsTitle}>Transaction Details</Text> */}

              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>
                    {item?.orderId || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Updated At</Text>
                  <Text style={styles.detailValue}>
                    {item?.updatedAt
                      ? new Date(item.updatedAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>
                    {item?.buySellType || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {item?.orderStatus || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {item?.transactionType === 'SIP' && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>SIP Details</Text>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Start Date</Text>
                    <Text style={styles.detailValue}>
                      {item?.sipStartDate
                        ? new Date(item.sipStartDate).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Installments</Text>
                    <Text style={styles.detailValue}>
                      {item?.noOfInstallment || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mandate ID</Text>
                    <Text style={styles.detailValue}>
                      {item?.mandateId || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Registration ID</Text>
                    <Text style={styles.detailValue}>
                      {item?.registrationId || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {item?.bseRemarks && (
              <View style={styles.remarksSection}>
                <Text style={styles.remarksTitle}>Remarks</Text>
                <Text style={styles.remarksText}>{item?.bseRemarks}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderScene = ({ route }) => {
    return (
      <View style={styles.sceneContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Config?.Colors?.primary} />
          </View>
        ) : (
          <FlatList
            data={transactionData}
            renderItem={renderTransactionItem}
            keyExtractor={(item, index) =>
              `${item?.referenceNumber || index}-${index}`
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No {route?.title} transactions found
                </Text>
              </View>
            }
          />
        )}
      </View>
    );
  };

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor={Config?.Colors?.white}
      inactiveColor={'rgba(255, 255, 255, 0.7)'}
      tabStyle={styles.tabStyle}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Transaction History</Text>
      </View>

      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setTabIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        style={styles.tabView}
      />
    </SafeAreaView>
  );
};

export default Transaction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config?.Colors?.background,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: Config?.Colors?.primary,
    backgroundColor: 'transparent',
    // backgroundColor: "black",
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    // backgroundColor: Config?.Colors?.primary,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Config?.Colors?.black,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: Config?.Colors?.primary,
    elevation: 0,
    shadowOpacity: 0,
    height: 48,
  },
  tabStyle: {
    paddingVertical: 0,
  },
  indicator: {
    backgroundColor: Config?.Colors?.white,
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
    margin: 0,
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: Config?.Colors?.background,
  },
  listContainer: {
    padding: 12,
  },
  accordionContainer: {
    backgroundColor: Config?.Colors?.white,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Config?.Colors?.white,
  },
  headerMainContent: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referenceNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Config?.Colors?.textPrimary,
    marginBottom: 2,
  },
  schemaCode: {
    fontSize: 14,
    color: '#666',
  },
  orderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Config?.Colors?.textPrimary,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '600',
    color: Config?.Colors?.primary,
    textTransform: 'capitalize',
  },
  expandIconContainer: {
    marginLeft: 8,
  },
  accordionContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Config?.Colors?.textPrimary,
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '100%',
    // marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Config?.Colors?.textPrimary,
  },
  remarksSection: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
  },
  remarksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4444',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 13,
    color: '#FF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
