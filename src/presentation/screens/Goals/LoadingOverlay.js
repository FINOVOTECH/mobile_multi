// LoadingOverlay.js
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";

const LoadingOverlay = ({ message = "Calculating your plan..." }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#2B8DF6" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
});
