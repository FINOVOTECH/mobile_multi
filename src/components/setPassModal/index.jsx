// components/SetPassModal/index.js
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
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Config from "../../helpers/Config";

const { height: screenHeight } = Dimensions.get("window");

const SetPasswordModal = ({
  visible = false,
  onClose = () => {},
  onSuccess = () => {},
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [password, setPassword] = useState(["", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState(["", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const passwordRefs = useRef([]);
  const confirmPasswordRefs = useRef([]);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        passwordRefs.current[0]?.focus();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setPassword(["", "", "", ""]);
      setConfirmPassword(["", "", "", ""]);
      setErrors({});

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
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
      Keyboard.dismiss();
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);

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
      ]).start();
    }
  }, [visible]);

  const handlePasswordChange = (text, index, passwordType) => {
    if (text.length > 1) {
      // Handle paste or multiple characters - take only the first character
      text = text.charAt(0);
    }

    const passwordArray = [
      ...(passwordType === "password" ? password : confirmPassword),
    ];
    passwordArray[index] = text;

    if (passwordType === "password") {
      setPassword(passwordArray);
    } else {
      setConfirmPassword(passwordArray);
    }

    // Auto-focus next input
    if (text && index < 3) {
      const refs =
        passwordType === "password" ? passwordRefs : confirmPasswordRefs;
      setTimeout(() => {
        refs.current[index + 1]?.focus();
      }, 10);
    }

    // Auto-focus first confirm input when password is complete
    if (passwordType === "password" && index === 3 && text) {
      setTimeout(() => {
        confirmPasswordRefs.current[0]?.focus();
      }, 10);
    }
  };

  const handleKeyPress = (e, index, passwordType) => {
    if (e.nativeEvent.key === "Backspace") {
      const currentValue =
        passwordType === "password" ? password[index] : confirmPassword[index];

      if (!currentValue && index > 0) {
        // Move to previous input on backspace if current is empty
        const refs =
          passwordType === "password" ? passwordRefs : confirmPasswordRefs;
        setTimeout(() => {
          refs.current[index - 1]?.focus();
        }, 10);
      }
    }
  };

  const validatePassword = () => {
    const newErrors = {};

    // Check if password is complete
    if (password.some((digit) => !digit)) {
      newErrors.password = "Please enter complete 4-digit PIN";
    }

    // Check if confirm password is complete
    if (confirmPassword.some((digit) => !digit)) {
      newErrors.confirm = "Please confirm your 4-digit PIN";
    }

    // Check if passwords match
    if (
      password.join("") !== confirmPassword.join("") &&
      !password.some((digit) => !digit) &&
      !confirmPassword.some((digit) => !digit)
    ) {
      newErrors.match = "PINs do not match";
    }

    // Check if password is exactly 4 digits
    if (password.join("").length !== 4 && !password.some((digit) => !digit)) {
      newErrors.length = "PIN must be exactly 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setPasswordAPI = async (pin) => {
    try {
      setLoading(true);

      // Get data from AsyncStorage
      const [clientCode, token] = await Promise.all([
        AsyncStorage.getItem("clientCode"),
        AsyncStorage.getItem("token"),
      ]);

      if (!clientCode || !token) {
        throw new Error("Authentication data not found");
      }

      const payload = {
        referenceId: clientCode.replace(/"/g, ""), // Remove quotes if present
        password: pin,
      };

      console.log("Setting password with payload:", payload);

      const response = await fetch(
        `${Config.getBaseUrl()}/api/v1/user/onboard/login/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.replace(/"/g, "")}`, // Remove quotes if present
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("dstata==>>", data);
      if (!response.ok) {
        throw new Error(
          data.message || `Failed to set password. Status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("Set password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    // Dismiss keyboard before validation
    Keyboard.dismiss();

    if (!validatePassword()) {
      return;
    }

    const pin = password.join("");

    try {
      const result = await setPasswordAPI(pin);

      Alert.alert("Success", "PIN set successfully!", [
        {
          text: "OK",
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);

      console.log("Password set successful:", result);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to set PIN. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderPasswordInputs = (value, refs, passwordType, label) => (
    <View style={styles.passwordSection}>
      <Text style={styles.passwordLabel}>{label}</Text>
      <View style={styles.passwordContainer}>
        {value.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              refs.current[index] = ref;
            }}
            style={[
              styles.digitInput,
              errors[passwordType] && styles.errorInput,
              digit && styles.filledInput,
            ]}
            value={digit}
            onChangeText={(text) =>
              handlePasswordChange(text, index, passwordType)
            }
            onKeyPress={(e) => handleKeyPress(e, index, passwordType)}
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry={!showPassword}
            textAlign="center"
            editable={!loading}
            selectTextOnFocus={true}
            contextMenuHidden={true} // Disable copy-paste menu
            caretHidden={false} // Show cursor
          />
        ))}
      </View>
      {errors[passwordType] && (
        <Text style={styles.errorText}>{errors[passwordType]}</Text>
      )}
    </View>
  );

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  const getModalHeight = () => {
    if (isKeyboardVisible) {
      return screenHeight;
    }
    return screenHeight * 0.8; // 70% when keyboard is closed
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
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
      </Animated.View>

      {/* Modal Content - Now takes full height when keyboard is open */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
            height: getModalHeight(),
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              {/* Handle Bar - Only show when keyboard is not visible */}
              {!isKeyboardVisible && <View style={styles.handleBar} />}

              {/* Header with Close Button */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Set Your PIN</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={loading}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              </View>

              {/* Message */}
              <View style={styles.messageContainer}>
                <Text style={styles.alertTitle}>Secure Your Account</Text>
                <Text style={styles.alertMessage}>
                  Set a 4-digit PIN to secure your account and enable quick
                  access to your investments.
                </Text>
              </View>

              {/* Password Inputs */}
              {renderPasswordInputs(
                password,
                passwordRefs,
                "password",
                "Enter PIN"
              )}

              {renderPasswordInputs(
                confirmPassword,
                confirmPasswordRefs,
                "confirm",
                "Confirm PIN"
              )}

              {errors.match && (
                <Text style={styles.errorText}>{errors.match}</Text>
              )}

              {errors.length && (
                <Text style={styles.errorText}>{errors.length}</Text>
              )}

              {/* Show Password Toggle */}
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "🔒 Hide PIN" : "👁️ Show PIN"}
                </Text>
              </TouchableOpacity>

              {/* Spacer to ensure button is visible */}
              <View style={styles.spacer} />

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.setButton, loading && styles.disabledButton]}
                  onPress={handleSetPassword}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.setButtonText}>Set PIN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    minHeight: 500,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: widthToDp(4),
    color: "#666",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 32,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  passwordSection: {
    marginBottom: 24,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  digitInput: {
    width: widthToDp(14),
    height: widthToDp(14),
    fontSize: widthToDp(5),
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    textAlign: "center",
  },
  filledInput: {
    backgroundColor: "#e8f4fd",
    borderColor: "#2196F3",
    transform: [{ scale: 1.05 }],
  },
  errorInput: {
    borderColor: "#ff4444",
    backgroundColor: "#fff5f5",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    textAlign: "center",
  },
  showPasswordButton: {
    alignSelf: "center",
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  showPasswordText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
  },
  spacer: {
    height: 20,
  },
  buttonContainer: {
    gap: 12,
    marginTop: "auto",
    marginBottom: 30,
  },
  setButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    shadowColor: "#ccc",
  },
  setButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SetPasswordModal;
