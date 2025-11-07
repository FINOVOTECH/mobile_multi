import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Animated,
  Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { heightToDp, widthToDp } from "../../../helpers/Responsive";
import { useSelector } from "react-redux";
import { baseUrl, clientCode, store_key_login_details } from "../../../helpers/Config";
import { storeData } from "../../../helpers/localStorage";
import { useNavigation } from "@react-navigation/native";
import ReactNativeBiometrics from "react-native-biometrics";

const { height } = Dimensions.get('window');

const BiometricLogin = () => {
  const navigation = useNavigation();
  const LoginData = useSelector(state => state?.login?.loginData);
  const PIN = useSelector(state =>state?.login?.pin)
  const [pin, setPin] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));
  const [isLoading, setIsLoading] = useState(false);

  // PIN input boxes
  const renderPinBoxes = () => {
    return Array.from({ length: 4 }, (_, index) => (
      <View key={index} style={[
        styles.pinBox,
        pin.length > index && styles.pinBoxFilled
      ]}>
        <Text style={styles.pinDot}>
          {pin.length > index ? "●" : ""}
        </Text>
      </View>
    ));
  };

  // Handle number press
  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);

      // Auto verify when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => verifyPin(newPin), 100);
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  // Verify PIN with API
  const verifyPin = async (pinToVerify) => {
    if(PIN !== pinToVerify) {
      setPin
      return Alert.alert('Invalid PIN', 'Please try again');
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/v1/user/function/verify/refresh`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'refreshToken': `${LoginData.refreshToken}`,
        }
      });

      const result = await response.json();
      console.log("PIN Verification Result:", result);

      if (response.ok && result?.accessToken) {
        await storeData(
          store_key_login_details,
          result.accessToken,
        );
         await storeData(clientCode,LoginData?.user?.clientCode);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      } else {
        Alert.alert('Invalid PIN', 'Please try again');
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Show fingerprint modal
  const showFingerprintModal = () => {
    setIsModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Hide fingerprint modal
  const hideFingerprintModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  const handleBiometricAuthentication = async () => {
    try {
      setIsLoading(true);
      
      const rnBiometrics = new ReactNativeBiometrics();
          const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    
          if (!available) {
            Alert.alert('Biometrics not available', 'Please login normally');
            return;
          }
    
         
          const { success, error } = await rnBiometrics.simplePrompt({
            promptMessage: 'Sign in using biometric authentication',
            cancelButtonText: 'Cancel'
          });
      if (success) {
        const response = await fetch(`${baseUrl}/api/v1/user/function/verify/refresh`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'refreshToken': `${LoginData.refreshToken}`,
          }
        });

        const result = await response.json();
        console.log("Biometric Verification Result:", result);

        if (response.ok && result?.accessToken) {
          hideFingerprintModal();
          await storeData(
            store_key_login_details,
            result.accessToken,
          );
          navigation.reset({
            index: 0,
            routes: [{ name: 'Profile' }],
          });
        } else {
          Alert.alert('Authentication Failed', 'Please try again');
          hideFingerprintModal();
        }
      } else {
        hideFingerprintModal();
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      Alert.alert('Error', 'Failed to authenticate. Please try again.');
      hideFingerprintModal();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>Enter your Taurus PIN</Text>
        </View>

        <View style={styles.pinContainer}>
          <View style={styles.pinBoxContainer}>
            {renderPinBoxes()}
          </View>
        </View>

        <TouchableOpacity
          style={styles.fingerprintButton}
          onPress={showFingerprintModal}
          disabled={isLoading}
        >
          <Text style={styles.fingerprintText}>Use fingerprint</Text>
        </TouchableOpacity>

        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {[1, 2, 3].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keypadButton}
                onPress={() => handleNumberPress(num.toString())}
                disabled={isLoading}
              >
                <Text style={styles.keypadText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[4, 5, 6].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keypadButton}
                onPress={() => handleNumberPress(num.toString())}
                disabled={isLoading}
              >
                <Text style={styles.keypadText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[7, 8, 9].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keypadButton}
                onPress={() => handleNumberPress(num.toString())}
                disabled={isLoading}
              >
                <Text style={styles.keypadText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadButton} disabled>
              <Text style={styles.keypadText}>•</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keypadButton}
              onPress={() => handleNumberPress("0")}
              disabled={isLoading}
            >
              <Text style={styles.keypadText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keypadButton}
              onPress={handleBackspace}
              disabled={isLoading || pin.length === 0}
            >
              <Text style={styles.backspaceText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Biometric Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideFingerprintModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={hideFingerprintModal}
          />
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
            </View>

            <View style={styles.modalBody}>
              <View style={styles.fingerprintIcon}>
                <Text style={styles.fingerprintEmoji}>👆</Text>
              </View>

              <Text style={styles.modalTitle}>Biometric Authentication</Text>
              <Text style={styles.modalSubtitle}>
                Use your fingerprint to authenticate
              </Text>

              <TouchableOpacity
                style={styles.authenticateButton}
                onPress={handleBiometricAuthentication}
                disabled={isLoading}
              >
                <Text style={styles.authenticateButtonText}>
                  {isLoading ? 'Authenticating...' : 'Authenticate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={hideFingerprintModal}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Use PIN instead</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    paddingHorizontal: widthToDp(5),
  },
  headerContainer: {
    alignItems: "center",
    marginTop: heightToDp(8),
    marginBottom: heightToDp(6),
  },
  profileImage: {
    width: widthToDp(20),
    height: widthToDp(20),
    borderRadius: widthToDp(10),
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: heightToDp(3),
  },
  profileInitial: {
    fontSize: widthToDp(8),
    fontWeight: "600",
    color: "#ffffff",
  },
  greeting: {
    fontSize: widthToDp(6),
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: heightToDp(1),
  },
  subtitle: {
    fontSize: widthToDp(4),
    color: "#7f8c8d",
  },
  pinContainer: {
    alignItems: "center",
    marginBottom: heightToDp(4),
  },
  pinBoxContainer: {
    flexDirection: "row",
    gap: widthToDp(4),
  },
  pinBox: {
    width: widthToDp(15),
    height: widthToDp(15),
    borderRadius: widthToDp(4),
    borderWidth: 2,
    borderColor: "#e1e8ed",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  pinBoxFilled: {
    borderColor: "#3498db",
    backgroundColor: "#3498db",
  },
  pinDot: {
    fontSize: widthToDp(8),
    color: "#ffffff",
  },
  fingerprintButton: {
    alignSelf: "center",
    marginBottom: heightToDp(4),
  },
  fingerprintText: {
    fontSize: widthToDp(4),
    color: "#00d09c",
    fontWeight: "500",
  },
  keypadContainer: {
    flex: 1,
    maxHeight: heightToDp(45),
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightToDp(2),
  },
  keypadButton: {
    width: widthToDp(20),
    height: widthToDp(20),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: widthToDp(10),
  },
  keypadText: {
    fontSize: widthToDp(7),
    fontWeight: "400",
    color: "#2c3e50",
  },
  backspaceText: {
    fontSize: widthToDp(8),
    fontWeight: "300",
    color: "#2c3e50",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: widthToDp(6),
    borderTopRightRadius: widthToDp(6),
    paddingBottom: heightToDp(4),
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: heightToDp(2),
  },
  modalHandle: {
    width: widthToDp(10),
    height: heightToDp(0.5),
    backgroundColor: "#bdc3c7",
    borderRadius: widthToDp(1),
  },
  modalBody: {
    paddingHorizontal: widthToDp(6),
    alignItems: "center",
  },
  fingerprintIcon: {
    width: widthToDp(20),
    height: widthToDp(20),
    borderRadius: widthToDp(10),
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: heightToDp(3),
  },
  fingerprintEmoji: {
    fontSize: widthToDp(10),
  },
  modalTitle: {
    fontSize: widthToDp(5.5),
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: heightToDp(1),
  },
  modalSubtitle: {
    fontSize: widthToDp(4),
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: heightToDp(4),
  },
  authenticateButton: {
    width: "100%",
    height: heightToDp(6),
    backgroundColor: "#3498db",
    borderRadius: widthToDp(3),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: heightToDp(2),
  },
  authenticateButtonText: {
    fontSize: widthToDp(4.5),
    fontWeight: "600",
    color: "#ffffff",
  },
  cancelButton: {
    paddingVertical: heightToDp(1.5),
  },
  cancelButtonText: {
    fontSize: widthToDp(4),
    color: "#7f8c8d",
    fontWeight: "500",
  },
});

export default BiometricLogin;