import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Config from "../../../helpers/Config";
import { heightToDp, widthToDp } from "../../../helpers/Responsive";

export default function RoleDashboard() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>{Config.RuntimeTenant.appName || "Finovo"}</Text>
        <Text style={styles.subtitle}>Access configured by your organization</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Limited Access Mode</Text>
        <Text style={styles.cardDesc}>
          Your role has restricted mobile features configured by Super Admin.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Track")}
        >
          <Text style={styles.actionText}>Search Client</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: widthToDp(5),
    paddingTop: heightToDp(2),
  },
  header: {
    marginBottom: heightToDp(3),
  },
  title: {
    fontSize: widthToDp(6),
    color: Config.Colors.primary,
    fontFamily: Config.fontFamilys.Poppins_Bold || "System",
  },
  subtitle: {
    marginTop: 4,
    color: "#4b5563",
    fontFamily: Config.fontFamilys.Poppins_Medium || "System",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: widthToDp(4),
    backgroundColor: "#f8fafc",
  },
  cardTitle: {
    fontSize: widthToDp(4.3),
    color: "#111827",
    fontFamily: Config.fontFamilys.Poppins_SemiBold || "System",
    marginBottom: 6,
  },
  cardDesc: {
    color: "#6b7280",
    lineHeight: 20,
    fontFamily: Config.fontFamilys.Poppins_Regular || "System",
  },
  actions: {
    marginTop: heightToDp(3),
    gap: 12,
  },
  actionBtn: {
    backgroundColor: Config.Colors.primary,
    borderRadius: 12,
    paddingVertical: heightToDp(1.6),
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontFamily: Config.fontFamilys.Poppins_SemiBold || "System",
    fontSize: widthToDp(3.9),
  },
});
