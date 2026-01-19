import React from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  Keyboard,
  Platform,
} from "react-native";

const AmountInput = React.memo(
  ({
    value = "",
    error = "",
    onChangeText,
    onFocus,
    inputRef,
    minimumAmount,
    label = "Investment amount",
  }) => {
    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>{label}</Text>

        <View style={styles.amountContainer}>
          <Text style={styles.rupeeSymbol}>₹</Text>

          <TextInput
            ref={inputRef}
            style={[styles.amountInput, error && styles.errorInput]}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            placeholder="Enter amount"
            placeholderTextColor="#999"
            maxLength={10}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        {minimumAmount != null && (
          <Text style={styles.minimumText}>
            Min: ₹{Number(minimumAmount).toLocaleString()}
          </Text>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  // 🔥 Prevent unnecessary re-renders
  (prev, next) =>
    prev.value === next.value &&
    prev.error === next.error &&
    prev.minimumAmount === next.minimumAmount
);

export default AmountInput;
const styles = StyleSheet.create({
  sectionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 8,
  },
  rupeeSymbol: {
    fontSize: 26,
    color: "#333",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    color: "#333",
    paddingVertical: 4,
  },
  minimumText: {
    fontSize: 13,
    color: "#888",
    marginTop: 6,
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 6,
  },
  errorInput: {
    borderBottomColor: "#E53935",
  },
});
