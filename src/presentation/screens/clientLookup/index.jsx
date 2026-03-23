import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Config from "../../../helpers/Config";
import { apiGetService } from "../../../helpers/services";
import { storeData } from "../../../helpers/localStorage";
import { heightToDp, widthToDp } from "../../../helpers/Responsive";

export default function ClientLookup() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const canSearch = useMemo(() => String(query || "").trim().length >= 2, [query]);

  const runSearch = async () => {
    if (!canSearch || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiGetService("/api/v1/admin/search/minimal-client-list", {
        search: String(query || "").trim(),
        page: 1,
        limit: 25,
      });
      const rows = Array.isArray(response?.data?.results) ? response.data.results : [];
      setResults(rows);
      if (!rows.length) setError("No clients found.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openClientContext = async (item) => {
    const code = String(item?.clientCode || "").trim();
    if (!code) return;
    await storeData(Config.clientCode, code);
    navigation.navigate("Transaction");
  };

  const renderClient = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item?.name || "-"}</Text>
        <Text style={styles.meta}>Client Code: {item?.clientCode || "-"}</Text>
        <Text style={styles.meta}>PAN: {item?.primaryHolderPAN || "-"}</Text>
        <Text style={styles.meta}>Mobile: {item?.mobileNumber || "-"}</Text>
      </View>
      <TouchableOpacity style={styles.openBtn} onPress={() => openClientContext(item)}>
        <Text style={styles.openTxt}>Open</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Search</Text>
        <Text style={styles.subtitle}>Select a client to open limited view.</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by name / client code / PAN / mobile"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={runSearch}
        />
        <TouchableOpacity
          style={[styles.searchBtn, (!canSearch || loading) && styles.searchBtnDisabled]}
          disabled={!canSearch || loading}
          onPress={runSearch}
        >
          <Text style={styles.searchTxt}>{loading ? "..." : "Search"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Config.Colors.primary} />
        </View>
      ) : null}

      {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item?.clientCode || "client"}-${idx}`}
        renderItem={renderClient}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(1),
  },
  header: { marginBottom: 10 },
  title: {
    fontSize: widthToDp(5.4),
    color: "#111827",
    fontFamily: Config.fontFamilys.Poppins_Bold || "System",
  },
  subtitle: {
    marginTop: 4,
    color: "#6B7280",
    fontFamily: Config.fontFamilys.Poppins_Regular || "System",
  },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
  },
  searchBtn: {
    backgroundColor: Config.Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchTxt: {
    color: "#fff",
    fontFamily: Config.fontFamilys.Poppins_SemiBold || "System",
  },
  center: { paddingVertical: 14 },
  error: { color: "#B91C1C", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    color: "#111827",
    fontSize: widthToDp(4.2),
    fontFamily: Config.fontFamilys.Poppins_SemiBold || "System",
    marginBottom: 4,
  },
  meta: {
    color: "#6B7280",
    fontSize: widthToDp(3.2),
    fontFamily: Config.fontFamilys.Poppins_Regular || "System",
  },
  openBtn: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  openTxt: {
    color: "#fff",
    fontFamily: Config.fontFamilys.Poppins_SemiBold || "System",
  },
});
