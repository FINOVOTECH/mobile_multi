import React, { useEffect, useState, useCallback } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Config from "../../../helpers/Config";
import SInfoSvg from "../../svgs";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import DatePickerModal from "../../../components/DatePickerModal";

const Transaction = ({ navigation }) => {
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [page, setPage] = useState(1);
  const [TOKEN, setTOKEN] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("AUTO");
  const [availableExchanges, setAvailableExchanges] = useState(
    Config?.RuntimeTenant?.availableExchanges || ["BSE", "NSE", "ALL"]
  );

  const today = new Date();

  const [fromDate, setFromDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [toDate, setToDate] = useState(today);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setTOKEN(storedToken);
          setTokenLoaded(true);
        }
      } catch (err) {
        console.error("Error fetching token:", err);
      }
    };
    fetchToken();
  }, []);

  /* -------------------- BACK HANDLER -------------------- */
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

  /* -------------------- FETCH ON DATE CHANGE -------------------- */
  useEffect(() => {
    if (tokenLoaded && TOKEN) {
      setPage(1);
      setHasMore(true);
      FetchTransaction(1, true);
    }
  }, [fromDate, toDate, TOKEN, tokenLoaded, selectedExchange]);

  useEffect(() => {
    if (selectedExchange !== "AUTO") return;
    const pref = String(Config?.RuntimeTenant?.exchangePreference || "BOTH").toUpperCase();
    if (pref === "BSE" || pref === "NSE") setSelectedExchange(pref);
  }, [selectedExchange]);

  /* -------------------- FETCH API -------------------- */
  const FetchTransaction = async (pageNumber = 1, reset = false) => {
    if (!TOKEN) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    try {
      const from = moment(fromDate).format("DD/MM/YYYY");
      const to = moment(toDate).format("DD/MM/YYYY");

      const url = `${Config.getBaseUrl()}/api/v1/user/orderstatus/transactions/me?fromDate=${from}&toDate=${to}&exchange=${selectedExchange}&page=${pageNumber}&limit=20&sync=1`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const results = data?.data || [];
      if (Array.isArray(data?.availableExchanges) && data.availableExchanges.length) {
        setAvailableExchanges(data.availableExchanges);
      }

      setTransactionData(prev => (reset ? results : [...prev, ...results]));
      setHasMore(pageNumber < (data?.totalPages || 1));
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
       setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- DATE PICKER HANDLERS -------------------- */
  const onFromDateChange = (event, date) => {
    if (Platform.OS === "android") setShowFromPicker(false);
    if (date) setFromDate(date);
  };

  const onToDateChange = (event, date) => {
    if (Platform.OS === "android") setShowToPicker(false);
    if (date) setToDate(date);
  };

   const toggleExpanded = (orderNo) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderNo)) newSet.delete(orderNo);
      else newSet.add(orderNo);
      return newSet;
    });
  }

  /* -------------------- LOAD MORE -------------------- */
  const loadMoreData = useCallback(() => {
    if (!loading && hasMore) {
      FetchTransaction(page + 1 ,false);
    }
  }, [page, loading, hasMore]);

  /* -------------------- LIST ITEM -------------------- */
  const renderTransactionItem = ({ item }) => {
    const isExpanded = expandedItems.has(item?.orderNo);
    const statusColor =
      item?.orderStatus === "INVALID" || item?.orderStatus === "FAILED"
        ? "#FF4444"
        : "#00AA00";
    const statusBgColor =
      item?.orderStatus === "INVALID" || item?.orderStatus === "FAILED"
        ? "#FFEEEE"
        : "#EEFFEE";

     return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleExpanded(item?.orderNo)}
          activeOpacity={0.7}
        >
          <View style={styles.headerMainContent}>
            <View style={styles.headerTopRow}>
              <Text style={styles.referenceNumber}>#{item?.orderNo}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusBgColor }]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item?.orderStatus}
                </Text>
              </View>
            </View>

            <View style={styles.headerMiddleRow}>
              <View style={{ width: "80%" }}>
                <Text style={styles.clientCode}>{item?.clientName}</Text>
                <Text style={styles.schemaCode}>{item?.schemeName}</Text>
              </View>
              <Text style={styles.orderValue}>₹{item?.amount}</Text>
            </View>

            <View style={styles.headerBottomRow}>
              <Text style={styles.dateText}>{item?.date || "N/A"}</Text>
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
                  <Text style={styles.detailValue}>
                    {item?.orderRemarks || "—"}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Created At</Text>
                  <Text style={styles.detailValue}>
                    {moment(item?.createdAt).format("DD/MM/YYYY HH:mm")}
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
        {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />


      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Order Status</Text>
      </View>

      {/* -------------------- DATE RANGE -------------------- */}
       <View style={styles.dateCard}>
        <Text style={styles.dateTitle}>Date Range</Text>

        <View style={styles.dateRow}>
          {/* FROM DATE */}
          <TouchableOpacity
            style={styles.dateInput}
            activeOpacity={0.8}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.dateLabel}>From</Text>
            <View style={styles.dateValueRow}>
              <SInfoSvg.Calender width={16} height={16} />
              <Text style={styles.dateValue}>
                {moment(fromDate).format("DD MMM YYYY")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* TO DATE */}
          <TouchableOpacity
            style={styles.dateInput}
            activeOpacity={0.8}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.dateLabel}>To</Text>
            <View style={styles.dateValueRow}>
              <SInfoSvg.Calender width={16} height={16} />
              <Text style={styles.dateValue}>
                {moment(toDate).format("DD MMM YYYY")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
  {/* TODAY */}
  <TouchableOpacity
    onPress={() => {
      const today = new Date();
      setFromDate(today);
      setToDate(today);
    }}
    style={styles.quickBtn}
  >
    <Text style={styles.quickText}>Today</Text>
  </TouchableOpacity>

  {/* THIS MONTH */}
  <TouchableOpacity
    onPress={() => {
      const today = new Date();
      setFromDate(new Date(today.getFullYear(), today.getMonth(), 1));
      setToDate(today);
    }}
    style={styles.quickBtn}
  >
    <Text style={styles.quickText}>This Month</Text>
  </TouchableOpacity>
</View>
      </View>

      <View style={styles.exchangeTabs}>
        {(availableExchanges || []).map((exchange) => {
          const selected = selectedExchange === exchange;
          return (
            <TouchableOpacity
              key={exchange}
              style={[styles.exchangeTab, selected && styles.exchangeTabActive]}
              onPress={() => setSelectedExchange(exchange)}
            >
              <Text style={[styles.exchangeTabText, selected && styles.exchangeTabTextActive]}>
                {exchange}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* -------------------- FROM PICKER -------------------- */}
      {showFromPicker && Platform.OS === "ios" && (
        <DatePickerModal
          visible={showFromPicker}
          onClose={() => setShowFromPicker(false)}
        >
          <DateTimePicker
            value={fromDate}
            mode="date"
            display="spinner"
            maximumDate={toDate}
            onChange={onFromDateChange}
          />
        </DatePickerModal>
      )}

      {showFromPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          maximumDate={toDate}
          onChange={onFromDateChange}
        />
      )}

      {/* -------------------- TO PICKER -------------------- */}
      {showToPicker && Platform.OS === "ios" && (
        <DatePickerModal
          visible={showToPicker}
          onClose={() => setShowToPicker(false)}
        >
          <DateTimePicker
            value={toDate}
            mode="date"
            display="spinner"
            minimumDate={fromDate}
            maximumDate={new Date()}
            onChange={onToDateChange}
          />
        </DatePickerModal>
      )}

      {showToPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          minimumDate={fromDate}
          maximumDate={new Date()}
          onChange={onToDateChange}
        />
      )}

        {renderScene()}
    </SafeAreaView>
  );
};

export default Transaction;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Config?.Colors?.white },
  androidStatusBar: {
    // height: StatusBar.currentHeight,
    backgroundColor: "transparent",
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    position: "relative",
  },
  backButton: { position: "absolute", left: 16 },
  pageTitle: { fontSize: 18, fontWeight: "600", color: Config?.Colors?.black },
  dateFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
  },
  dateButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dateTextBtn: { fontSize: 14, color: "#333" },
  listContainer: { padding: 12 },
  accordionContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  headerMainContent: { flex: 1 },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  referenceNumber: { fontSize: 14, fontWeight: "500", color: "#666" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  headerMiddleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  clientCode: {
    fontSize: 16,
    fontWeight: "600",
    color: Config?.Colors?.textPrimary,
  },
  schemaCode: { fontSize: 14, color: "#666" },
  orderValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Config?.Colors?.textPrimary,
  },
  headerBottomRow: { flexDirection: "row", justifyContent: "space-between" },
  dateText: { fontSize: 12, color: "#666" },
  transactionType: {
    fontSize: 12,
    fontWeight: "600",
    color: Config?.Colors?.primary,
  },
  accordionContent: { padding: 16, backgroundColor: "#FAFAFA" },
  detailItem: { marginBottom: 6 },
  detailLabel: { fontSize: 12, color: "#666" },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Config?.Colors?.textPrimary,
  },
  remarksSection: { backgroundColor: "#FFF5F5", borderRadius: 8, padding: 12 },
  remarksTitle: { fontSize: 14, fontWeight: "600", color: "#FF4444" },
  remarksText: { fontSize: 13, color: "#FF4444" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center" },
  dateCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  dateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },

  dateRow: {
    flexDirection: "row",
    gap: 12,
  },

  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  dateLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },

  dateValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 16,
  },

  quickBtn: {
    paddingVertical: 6,
  },

  quickText: {
    fontSize: 13,
    fontWeight: "600",
    color: Config?.Colors?.primary,
  },
  exchangeTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  exchangeTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  exchangeTabActive: {
    backgroundColor: Config?.Colors?.primary,
    borderColor: Config?.Colors?.primary,
  },
  exchangeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  exchangeTabTextActive: {
    color: "#FFFFFF",
  },
});
