import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import * as Config from "../../../helpers/Config";
import { widthToDp, heightToDp } from "../../../helpers/Responsive";
import { apiPostService } from "../../../helpers/services";
import {
  setLoginData,
  setRegi,
  setRegiId,
} from "../../../store/slices/loginSlice";
import { getData, storeData } from "../../../helpers/localStorage";
import SInfoSvg from "../../svgs";
import * as Icons from "../../../helpers/Icons";
import ReactNativeBiometrics from "react-native-biometrics";
import BiometricLogin from "../BiometricLogin/index.jsx";
import Rbutton from "../../../components/Rbutton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setPass, setPassData } from "../../../store/slices/passSlice";
import { refreshTenantBrandingForToken } from "../../../helpers/tenantBrandingRuntime";
import { ScreenName } from "../../../constant/screenName";

export default function LoginWithPass() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const LoginData = useSelector((state) => state.login.loginData);
  const DATA = useSelector((state) => state.login);
const PIN_LENGTH = 4;
const pinInputRef = useRef(null);
  const [clientCode, setClientCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (DATA.enabled === true) {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert("Biometrics not available", "Please login normally");
        return;
      }

      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: "Sign in using biometric authentication",
        cancelButtonText: "Cancel",
      });

      if (success) {
        await verifyWithServer();
      } else {
        console.log("Biometric authentication cancelled or failed:", error);
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Alert.alert(
        "Biometric auth failed",
        error.message || "Please try again or login normally."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWithServer = async () => {
    try {
      const response = await fetch(
        `${Config.getBaseUrl()}/api/v1/user/function/verify/refresh`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            refreshToken: `${LoginData.refreshToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result?.accessToken) {
        await storeData(Config.store_key_login_details, result.accessToken);
        await storeData(Config.store_key_login_role, "client");
        await refreshTenantBrandingForToken(result.accessToken);
        await storeData(Config.clientCode, LoginData?.user?.clientCode);
        navigation.reset({
          index: 0,
          routes: [{ name: "Profile" }],
        });
      } else {
        Alert.alert("Authentication Failed", "Please login normally");
      }
    } catch (error) {
      console.error("Server verification error:", error);
      Alert.alert("Error", "Failed to authenticate. Please login normally.");
    }
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Exit App", "Are you sure you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (clientCode || password) {
      setErrorMessage("");
      setValidationErrors({});
    }
  }, [clientCode, password]);

  const validateInputs = () => {
    const errors = {};

    if (!clientCode.trim()) {
      errors.clientCode = "Client code is required";
    } else if (!/^[A-Za-z0-9]+$/.test(clientCode.trim())) {
      errors.clientCode = "Client code should contain only letters and numbers";
    } else if (clientCode.trim().length < 4) {
      errors.clientCode = "Client code should be at least 4 characters";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.trim().length < 4) {
      errors.password = "Password must be at least 4 characters";
    }

    return errors;
  };

  const handleLoginWithPassword = async () => {
    const errors = validateInputs();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        referenceId: clientCode.trim(),
        password: password.trim(),
      };

      const response = await apiPostService(
        "/api/v1/user/onboard/login-pwd/verify",
        payload
      );

      if (response?.status === 200 && response?.data?.accessToken) {
        await storeData(
          Config.store_key_login_details,
          response?.data?.accessToken
        );
        await storeData(Config.store_key_login_role, "client");
        await refreshTenantBrandingForToken(response?.data?.accessToken);

        if (response?.data?.user?.clientCode) {
          await storeData(Config.clientCode, response?.data?.user?.clientCode);
        }
        dispatch(setPass(response?.data?.user?.passwordPlain));
        dispatch(setLoginData(response?.data));

        navigation.reset({
          index: 0,
          routes: [{ name: "Profile" }],
        });
      } else if (
        response?.status === 200 &&
        (response?.data?.nextStep === "REGISTRATION" ||
          response?.data?.nextStep)
      ) {
        await storeData(
          Config.store_key_login_details,
          response?.data?.accessToken
        );
        await storeData(Config.store_key_login_role, "client");
        await refreshTenantBrandingForToken(response?.data?.accessToken);

        if (response?.data?.user?.clientCode) {
          await storeData(Config.clientCode, response?.data?.user?.clientCode);
        }

        dispatch(setLoginData(response?.data));

        if (response?.data?.nextStep) {
          dispatch(setRegiId(response?.data?.registeredData?.registrationId));
          dispatch(setRegi(response?.data?.nextStep));
          navigation.navigate("Registration");
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Profile" }],
          });
        }
      } else {
        throw new Error(response?.data?.message || "Login failed");
      }
    } catch (err) {
      console.log("Login Error:", err.response?.data || err.message);

      const errorMsg = err.response?.data?.message || err.message;
      if (
        errorMsg.toLowerCase().includes("invalid") ||
        errorMsg.toLowerCase().includes("incorrect")
      ) {
        setErrorMessage(
          "Invalid client code or password. Please check your credentials."
        );
      } else if (errorMsg.toLowerCase().includes("not found")) {
        setErrorMessage("Client code not found. Please check your input.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithOtp = () => {
    navigation.navigate("Home");
  };

  const isFormValid = () => {
    return clientCode.trim().length >= 4 && password.trim().length >= 4;
  };

  const renderLoginScreen = () => (
    <View style={simpleStyles.container}>
      <Text style={simpleStyles.mainTitle}>Login with Client Code</Text>

      <View style={simpleStyles.inputGroup}>
        <Text style={simpleStyles.inputLabel}>Client Code</Text>

        <View
          style={[
            simpleStyles.inputOuterContainer,
            validationErrors.clientCode && simpleStyles.inputOuterError,
          ]}
        >
          <View
            style={[
              simpleStyles.inputInnerContainer,
              validationErrors.clientCode && simpleStyles.inputInnerError,
            ]}
          >
            <TextInput
              style={simpleStyles.input}
              placeholder="Enter your client code"
              placeholderTextColor="#AAB7B8"
              value={clientCode}
              onChangeText={setClientCode}
              autoCapitalize="characters"
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus on password input
              }}
            />
          </View>
        </View>

        {validationErrors.clientCode && (
          <Text style={simpleStyles.fieldErrorText}>
            {validationErrors.clientCode}
          </Text>
        )}
      </View>

      <View style={simpleStyles.inputGroup}>
        <View style={{ flexDirection: "row", justifyContent: "space-between",alignItems: "center" }}>
          
        <Text style={simpleStyles.inputLabel}>Password</Text>
         <TouchableOpacity
              style={simpleStyles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={simpleStyles.eyeIconText}>
                {showPassword ? "HIDE" : "SHOW"}
              </Text>
            </TouchableOpacity>
        </View>

        <View
          style={[
            // simpleStyles.inputOuterContainer,
            validationErrors.password && simpleStyles.inputOuterError,
          ]}
        >
          <View
            style={[
              // simpleStyles.inputInnerContainer,
              validationErrors.password && simpleStyles.inputInnerError,{ backgroundColor: "white" },
            ]}
          >
           <TouchableOpacity
  activeOpacity={1}
  onPress={() => pinInputRef.current?.focus()}
  style={simpleStyles.pinContainer}
>
  {Array.from({ length: PIN_LENGTH }).map((_, index) => {
    const digit = password[index] || "";
    return (
      <View
        key={index}
        style={[
          simpleStyles.pinBox,
          validationErrors.password && simpleStyles.pinBoxError,
        ]}
      >
        <Text style={simpleStyles.pinText}>
          {digit ? (showPassword ? digit : "●") : ""}
        </Text>
      </View>
    );
  })}

  {/* Hidden TextInput */}
  <TextInput
    ref={pinInputRef}
    value={password}
    onChangeText={(text) => {
      if (/^\d*$/.test(text) && text.length <= PIN_LENGTH) {
        setPassword(text);
      }
    }}
    keyboardType="number-pad"
    maxLength={PIN_LENGTH}
    secureTextEntry={!showPassword}
    style={simpleStyles.hiddenInput}
    autoFocus={false}
    onSubmitEditing={
      password.length === PIN_LENGTH
        ? handleLoginWithPassword
        : undefined
    }
  />
</TouchableOpacity>
           
          </View>
        </View>

        {validationErrors.password && (
          <Text style={simpleStyles.fieldErrorText}>
            {validationErrors.password}
          </Text>
        )}
      </View>

        {errorMessage ? (
          <Text style={simpleStyles.errorText}>{errorMessage}</Text>
        ) : null}

      <View style={simpleStyles.spacer} />

      <View style={simpleStyles.footer}>
        <Text style={simpleStyles.policyText}>
          By proceeding, you agree with {(Config?.RuntimeTenant?.appName || "your broker") + "'s"}{" "}
          <Text style={simpleStyles.policyLink}>terms and conditions</Text> and{" "}
          <Text style={simpleStyles.policyLink}>privacy policy.</Text>
        </Text>

        <Rbutton
          title="Login"
          onPress={handleLoginWithPassword}
          disabled={!isFormValid()}
          loading={isLoading}
        />

        {/* Login with OTP Button */}
        <TouchableOpacity
          style={simpleStyles.otpLoginButton}
          onPress={handleLoginWithOtp}
        >
          <Text style={simpleStyles.otpLoginText}>Login with OTP instead</Text>
        </TouchableOpacity>

        <View style={simpleStyles.trustBadge}>
          <Text style={simpleStyles.trustIcon}>✔️</Text>
          <Text style={simpleStyles.trustText}>Trusted by many Brokers</Text>
        </View>

        <TouchableOpacity
          style={simpleStyles.registerContainer}
          onPress={() => navigation?.navigate("Registration")}
        >
          <Text style={simpleStyles.registerText}>
            Don't have an account?
            <Text style={simpleStyles.registerLink}> Register Now</Text>
          </Text>
        </TouchableOpacity>

        {Config.useHybridApp ? (
          <TouchableOpacity
            style={simpleStyles.staffLinkContainer}
            onPress={() => navigation?.navigate(ScreenName.HybridWeb)}
          >
            <Text style={simpleStyles.staffLinkText}>Staff Login</Text>
            <Text style={simpleStyles.staffLinkSubText}>Broker & Employee access</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return DATA?.enabled === true || DATA.pin ? (
    <BiometricLogin handleBiometricAuth={handleBiometricAuth} />
  ) : (
    <SafeAreaView style={simpleStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={simpleStyles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={simpleStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderLoginScreen()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const simpleStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: widthToDp(6),
    paddingTop: heightToDp(5),
    backgroundColor: "#FFFFFF",
  },
  mainTitle: {
    fontSize: widthToDp(6.5),
    fontWeight: "bold",
    color: "#1C1C1C",
    marginBottom: heightToDp(4),
    fontFamily: Config.fontFamilys?.Poppins_ExtraBold || "System",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: heightToDp(3),
  },
  inputLabel: {
    fontSize: widthToDp(3.5),
    color: "#7A7A7A",
    marginBottom: heightToDp(1),
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  inputOuterContainer: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: "#000000",
    alignSelf: "stretch",
  },
  inputOuterError: {
    backgroundColor: "#A0A0A0",
  },
  inputInnerContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputInnerError: {
    backgroundColor: "#F0F0F0",
  },
  input: {
    flex: 1,
    height: heightToDp(4),
    padding: 0,
    fontSize: widthToDp(4.5),
    color: "#1C1C1C",
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || "System",
  },
  eyeIcon: {
    padding: widthToDp(1),
    marginLeft: widthToDp(2),
  },
  eyeIconText: {
    fontSize: widthToDp(4),
    textAlign: "right",
    color: "#7A7A7A",
    marginTop:10
  },
  fieldErrorText: {
    color: "#E74C3C",
    fontSize: widthToDp(3.5),
    marginTop: heightToDp(1),
    marginLeft: widthToDp(1),
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  errorText: {
    color: "#E74C3C",
    fontSize: widthToDp(3.5),
    textAlign: "center",
    marginTop: heightToDp(2),
    fontWeight: "500",
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingVertical: heightToDp(1),
  },
  policyText: {
    fontSize: widthToDp(3.2),
    color: "#7A7A7A",
    textAlign: "center",
    marginBottom: heightToDp(3),
    fontFamily: Config.fontFamilys?.Poppins_Regular || "System",
  },
  policyLink: {
    color: "#1C1C1C",
    fontWeight: "bold",
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || "System",
  },
  otpLoginButton: {
    marginTop: heightToDp(2),
    marginBottom: heightToDp(2),
    paddingVertical: heightToDp(1.5),
    alignItems: "center",
  },
  otpLoginText: {
    fontSize: widthToDp(3.8),
    color: "#000000",
    fontWeight: "600",
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || "System",
    textDecorationLine: "underline",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: heightToDp(1),
    marginBottom: heightToDp(2),
  },
  trustIcon: {
    fontSize: widthToDp(3.5),
    color: "#5CB85C",
    marginRight: widthToDp(1.5),
  },
  trustText: {
    fontSize: widthToDp(3.5),
    color: "#7A7A7A",
    fontWeight: "500",
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  registerContainer: {
    marginTop: heightToDp(2),
    marginBottom: heightToDp(6),
  },
  registerText: {
    textAlign: "center",
    fontSize: widthToDp(3.5),
    color: "#7F8C8D",
    fontFamily: Config.fontFamilys?.Poppins_Regular || "System",
  },
  registerLink: {
    color: "#000000",
    fontWeight: "700",
    fontFamily: Config.fontFamilys?.Poppins_Bold || "System",
  },
  staffLinkContainer: {
    marginTop: heightToDp(1),
    paddingVertical: heightToDp(1),
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  staffLinkText: {
    fontSize: widthToDp(3.5),
    fontWeight: "700",
    color: "#0f172a",
  },
  staffLinkSubText: {
    fontSize: widthToDp(3),
    color: "#6b7280",
  },
  pinContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: heightToDp(1),
},

pinBox: {
  width: widthToDp(14),
  height: heightToDp(6),
  borderRadius: 8,
  borderBottomWidth: 1,
  borderColor: "#000",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#FFFFFF",
},

pinBoxError: {
  borderColor: "#E74C3C",
},

pinText: {
  fontSize: widthToDp(6),
  fontFamily: Config.fontFamilys?.Poppins_Bold || "System",
  color: "#000",
},

hiddenInput: {
  position: "absolute",
  opacity: 0,
  height: 0,
  width: 0,
},

});
