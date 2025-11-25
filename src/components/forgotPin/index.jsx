import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
  BackHandler,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { widthToDp } from "../../helpers/Responsive";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import * as Config from "../../helpers/Config";

const { height: screenHeight } = Dimensions.get("window");

const ForgotPin = ({
  visible = false,
  onClose = () => {},
}) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const LoginData = useSelector((state) => state?.login?.loginData);

  const [newPin, setNewPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
const [clientCode, setClientCode] = useState("");
  useEffect(() => {
    const backAction = () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [visible]);

  // Slide Animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight * 0.45,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setNewPin(""); // Reset input when modal closes
      });
    }
  }, [visible]);

  // API CALL – RESET PIN
  const handleResetPin = async () => {
    if (newPin.length !== 4) {
      return alert("Please enter a valid 4-digit PIN");
    }

    const payload = {
      referenceId: clientCode,
      password: newPin,
    };

    try {
      setIsLoading(true);
      const response = await fetch(
        `${Config.baseUrl}/api/v1/user/onboard/login/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Reset PIN result:", result);

      if (response.status === 200) {
        alert("PIN reset successful! Please login again.");
        onClose();
      } else {
        alert(result?.message || "Failed to reset PIN");
      }
    } catch (error) {
      console.log("Reset PIN error:", error);
      alert("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="dark-content" />

      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.modalContent}>

          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Title */}
          <Text style={styles.title}>Reset Your PIN</Text>
          <Text style={styles.subtitle}>
            Enter a new 4-digit PIN to continue
          </Text>

          {/* PIN Input */}
          <TextInput
            style={styles.pinInput}
            placeholder="Enter new pin"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            value={newPin}
            onChangeText={setNewPin}
          />

          {/* Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Reset PIN</Text>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
    backgroundColor: "white",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
  },
  modalContent: {
    paddingHorizontal: widthToDp(6),
  },
  handleBar: {
    width: 45,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 8,
  },
  title: {
    fontSize: widthToDp(5.5),
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    fontSize: widthToDp(4),
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  pinInput: {
    width: "100%",
    height: widthToDp(14),
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    paddingHorizontal: 15,
    fontSize: widthToDp(5),
    backgroundColor: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 10,
    marginBottom: 28,
  },
  resetButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  resetButtonText: {
    color: "white",
    fontSize: widthToDp(4.5),
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: widthToDp(4),
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default ForgotPin;
