import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  StatusBar
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setBiometricEnabled, setBiometricPin } from "../../store/slices/loginSlice";
import { heightToDp, widthToDp } from "../../helpers/Responsive";
import * as Config from "../../helpers/Config";
import SInfoSvg from "../../presentation/svgs";

const Biometric = ({ navigation }) => {
  const dispatch = useDispatch();
  const isBiometricEnabled = useSelector((state) => state.login.enabled);
  const savedPin = useSelector((state) => state.login.pin);

  const [password, setPassword] = useState(savedPin || "");
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isBiometricEnabled) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isBiometricEnabled]);

  const toggleSwitch = () => {
    dispatch(setBiometricEnabled(!isBiometricEnabled));
    if (!isBiometricEnabled === false) {
      setPassword("");
    }
  };

  const handleSubmit = () => {
    if (password.length !== 4) {
      alert("Please enter a valid 4-digit PIN.");
      return;
    }
    dispatch(setBiometricPin(password));
    alert("Biometric enabled and PIN saved.");
    navigation.navigate("Profile");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: null })}
    >
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          {/* <Text style={styles.backText}>←</Text> */}
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <Text style={styles.header}>Biometric Settings</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Enable Biometric</Text>
          <Switch value={isBiometricEnabled} onValueChange={toggleSwitch} />
        </View>

        {isBiometricEnabled && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter 4-digit PIN"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.status}>
          Current Status: {isBiometricEnabled ? "ON" : "OFF"}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "transparent",
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: widthToDp(2.5), // Responsive positioning
  },
  backText: {
    fontSize: widthToDp(6.5), // Responsive font size
    fontWeight: 'bold',
    color: 'black',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightToDp(1.8), // Responsive margin
  },
  header: {
    fontSize: widthToDp(5),
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2D3D",
    marginBottom: heightToDp(3),
    marginTop: heightToDp(1),   
  },
  card: {
    backgroundColor: "white",
    borderRadius: widthToDp(3),
    padding: widthToDp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: heightToDp(2),
  },
  label: {
    fontSize: widthToDp(4.5),
    fontWeight: "500",
    color: "#333",
  },
  inputContainer: {
    marginTop: heightToDp(1),
  },
  input: {
    height: heightToDp(6.5),
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: widthToDp(2),
    paddingHorizontal: widthToDp(3),
    fontSize: widthToDp(4.5),
    marginBottom: heightToDp(2),
    backgroundColor: "#F9FAFB",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: widthToDp(4.5),
  },
  status: {
    marginTop: heightToDp(2),
    textAlign: "center",
    fontSize: widthToDp(4.5),
    color: "#555",
  },
});

export default Biometric;