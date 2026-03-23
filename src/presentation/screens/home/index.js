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
import { setPass } from "../../../store/slices/passSlice";
import {
  fetchAndCacheTenantBranding,
  refreshTenantBrandingForToken,
} from "../../../helpers/tenantBrandingRuntime";
import { ScreenName } from "../../../constant/screenName";

export default function Home() {
  const buildTenantCode = String(Config?.defaultTenantId || "")
    .trim()
    .toUpperCase();
  const showTenantSelector = __DEV__ && !buildTenantCode;
  const otpInputRefs = useRef([]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const LoginData = useSelector((state) => state.login.loginData);
  const DATA = useSelector((state) => state.login);
console.log("DATA",DATA?.enabled , DATA.pin )
  const [referenceId, setReferenceId] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginMethod, setLoginMethod] = useState("phone");
  const [validationErrors, setValidationErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [tenantCode, setTenantCode] = useState(
    String(Config?.RuntimeTenant?.tenantId || "").toUpperCase()
  );
  const [tenantLoading, setTenantLoading] = useState(false);
  const [authRole, setAuthRole] = useState("client");
  const [authPassword, setAuthPassword] = useState("");

  const ensureTenantSelected = () => {
    const selectedTenant = String(Config?.RuntimeTenant?.tenantId || "")
      .trim()
      .toUpperCase();
    if (selectedTenant) return true;
    if (buildTenantCode) {
      Config.RuntimeTenant.tenantId = buildTenantCode;
      setTenantCode(buildTenantCode);
      return true;
    }
    if (!showTenantSelector) return true;
    if (!selectedTenant) {
      setErrorMessage("Please apply tenant code first.");
      return false;
    }
    return true;
  };

  const handleApplyTenant = async () => {
    const key = String(tenantCode || "").trim().toUpperCase();
    if (!key) {
      setErrorMessage("Please enter tenant code.");
      return;
    }
    setTenantLoading(true);
    setErrorMessage("");
    try {
      await fetchAndCacheTenantBranding(key);
      setTenantCode(String(Config?.RuntimeTenant?.tenantId || key));
    } catch (err) {
      setErrorMessage(err?.message || "Failed to load tenant branding.");
    } finally {
      setTenantLoading(false);
    }
  };

  useEffect(() => {
    if (!buildTenantCode) return;
    const runtimeTenant = String(Config?.RuntimeTenant?.tenantId || "")
      .trim()
      .toUpperCase();
    if (runtimeTenant !== buildTenantCode) {
      Config.RuntimeTenant.tenantId = buildTenantCode;
    }
    setTenantCode(buildTenantCode);
  }, [buildTenantCode]);

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
      if (isOtpSent) {
        handleBackToLogin();
        return true;
      } else {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isOtpSent]);

  useEffect(() => {
    let interval;
    if (isOtpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpSent]);

  useEffect(() => {
    if (referenceId) {
      setErrorMessage("");
      setValidationErrors({});
    }
  }, [referenceId]);

  const validateOtp = (otpArray) => {
    const otpString = otpArray.join("");
    if (otpString.length !== 4) {
      return "Please enter complete 4-digit OTP";
    }
    if (!/^\d{4}$/.test(otpString)) {
      return "OTP must contain only numbers";
    }
    return null;
  };

  const validateInput = (value) => {
    const errors = {};

    if (!value || value.trim() === "") {
      errors.referenceId = `${
        loginMethod === "phone" ? "Mobile number" : "Client code"
      } is required`;
      return errors;
    }

    const trimmedValue = value.trim();

    switch (loginMethod) {
      case "phone":
        const phoneDigits = trimmedValue.replace(/\D/g, "");
        if (phoneDigits.length === 0) {
          errors.referenceId = "Please enter a valid mobile number";
        } else if (phoneDigits.length > 10) {
          errors.referenceId = "Mobile number cannot exceed 10 digits";
        } else if (!/^[6-9]/.test(phoneDigits)) {
          errors.referenceId = "Mobile number should start with 6-9";
        }
        break;
      case "clientCode":
        if (trimmedValue.length === 0) {
          errors.referenceId = "Please enter a valid client code";
        } else if (!/^[A-Za-z0-9]+$/.test(trimmedValue)) {
          errors.referenceId =
            "Client code should contain only letters and numbers";
        } else if (trimmedValue.length < 4) {
          errors.referenceId = "Client code should be at least 4 characters";
        } else if (trimmedValue.length > 20) {
          errors.referenceId = "Client code cannot exceed 20 characters";
        }
        break;
      default:
        errors.referenceId = "Invalid input";
    }

    return errors;
  };

  const handleInputChange = (value) => {
    setReferenceId(String(value || "").replace(/\s/g, ""));
  };

  const inferAuthRole = () => {
    const identity = String(referenceId || "").trim();
    const pwd = String(authPassword || "").trim();
    if (!pwd) return "client";
    if (identity.includes("@")) return "staff_email";
    return "tenant_admin";
  };

  const handleSendOtp = async () => {
    if (!ensureTenantSelected()) return;
    const inferredRole = inferAuthRole();
    const identity = String(referenceId || "").trim();
    if (inferredRole !== "client") {
      const pwd = String(authPassword || "").trim();

      if (!identity || !pwd) {
        setErrorMessage("Please enter credentials.");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setValidationErrors({});

      try {
        let response = null;
        let resolvedRole = inferredRole;

        if (inferredRole === "staff_email") {
          // Try tenant-admin first for broker email; fallback to employee.
          try {
            response = await apiPostService("/api/v1/admin/tenant-login", {
              email: identity.toLowerCase(),
              password: pwd,
            });
            resolvedRole = "tenant_admin";
          } catch (_) {
            response = await apiPostService("/api/v1/employee/login", {
              email: identity.toLowerCase(),
              password: pwd,
            });
            resolvedRole = "employee";
          }
        } else {
          response = await apiPostService("/api/v1/admin/tenant-login", {
            arnCode: identity.toUpperCase(),
            password: pwd,
          });
          resolvedRole = "tenant_admin";
        }

        if (response?.status === 200 && String(response?.data?.status || "").toUpperCase() === "SUCCESS") {
          setAuthRole(resolvedRole);
          setIsOtpSent(true);
          setOtp(["", "", "", ""]);
          setResendTimer(30);
          setCanResend(false);
          setTimeout(() => {
            otpInputRefs.current[0]?.focus();
          }, 500);
        } else {
          throw new Error(response?.data?.message || "Failed to send OTP");
        }
      } catch (err) {
        setErrorMessage(err?.response?.data?.message || err?.message || "Failed to send OTP.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setAuthRole("client");
    const errors = validateInput(referenceId);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setValidationErrors({});

    try {
      const payload = {
        referenceId: referenceId.trim(),
        type: loginMethod === "phone" ? "phone" : "clientCode",
      };

      const response = await apiPostService(
        "/api/v1/user/onboard/login/send",
        payload
      );
      // const data = response.json()
      if (response?.status === 200) {
        dispatch(setPass(response?.data));
        // const data = response.json()
        // console.log(response?.data?.hasPassword,"======================");
        
        setIsOtpSent(true);
        setOtp(["", "", "", ""]);
        setResendTimer(30);
        setCanResend(false);

        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 500);
      } else {
        throw new Error(response?.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.log("Send OTP Error:", err.response?.data || err.message);

      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.toLowerCase().includes("not found")) {
        setErrorMessage(
          `${
            loginMethod === "phone" ? "Mobile number" : "Client code"
          } not found. Please check your input.`
        );
      } else if (errorMsg.toLowerCase().includes("invalid")) {
        setErrorMessage(
          `Invalid ${
            loginMethod === "phone" ? "mobile number" : "client code"
          } format.`
        );
      } else {
        setErrorMessage("Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!ensureTenantSelected()) return;
    const otpError = validateOtp(otp);
    if (otpError) {
      setErrorMessage(otpError);
      return;
    }

    const otpString = otp.join("");
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (authRole !== "client") {
        const endpoint = authRole === "employee" ? "/api/v1/employee/verify-otp" : "/api/v1/admin/tenant-login/verify-otp";
        const identity = String(referenceId || "").trim();
        const payload = authRole === "employee"
          ? { email: identity.toLowerCase(), password: String(authPassword || "").trim(), otp: otpString }
          : identity.includes("@")
            ? { email: identity.toLowerCase(), password: String(authPassword || "").trim(), otp: otpString }
            : { arnCode: identity.toUpperCase(), password: String(authPassword || "").trim(), otp: otpString };

        const response = await apiPostService(endpoint, payload);
        const token = response?.data?.accessToken;
        if (response?.status === 200 && token) {
          await storeData(Config.store_key_login_details, token);
          await storeData(Config.store_key_login_role, authRole);
          await storeData(Config.clientCode, "");
          await refreshTenantBrandingForToken(token);
          dispatch(setLoginData(response?.data || {}));
          navigation.reset({
            index: 0,
            routes: [{ name: "Profile" }],
          });
          return;
        }
        throw new Error(response?.data?.message || "Invalid OTP");
      }

      const response = await apiPostService(
        "/api/v1/user/onboard/login/verify",
        {
          referenceId: referenceId.trim(),
          otp: otpString,
          type: loginMethod === "phone" ? "phone" : "clientCode",
        }
      );

      if (response?.status === 200 && response?.data?.accessToken) {
        await storeData(
          Config.store_key_login_details,
          response?.data?.accessToken
        );
        await storeData(Config.store_key_login_role, "client");
        await refreshTenantBrandingForToken(response?.data?.accessToken);
dispatch(setPass(response?.data?.user?.passwordPlain));
        if (response?.data?.user?.clientCode) {
          await storeData(Config.clientCode, response?.data?.user?.clientCode);
        }

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
        throw new Error(response?.data?.message || "Invalid OTP");
      }
    } catch (err) {
      console.log("Verify OTP Error:", err.response?.data || err.message);

      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.toLowerCase().includes("expired")) {
        setErrorMessage("OTP has expired. Please request a new one.");
      } else if (
        errorMsg.toLowerCase().includes("invalid") ||
        errorMsg.toLowerCase().includes("incorrect")
      ) {
        setErrorMessage("Invalid OTP. Please check and try again.");
      } else {
        setErrorMessage("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value) setErrorMessage("");
    if (value && index < otp.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleBackToLogin = () => {
    setIsOtpSent(false);
    setOtp(["", "", "", ""]);
    setErrorMessage("");
    setAuthRole("client");
    setResendTimer(30);
    setCanResend(false);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    await handleSendOtp();
  };

  const isInputValid = () => {
    if (inferAuthRole() !== "client") {
      return !!String(referenceId || "").trim() && !!String(authPassword || "").trim();
    }
    if (!referenceId.trim()) return false;
    const errors = validateInput(referenceId);
    return Object.keys(errors).length === 0;
  };

  const isOtpValid = () => {
    return otp.every((digit) => digit) && validateOtp(otp) === null;
  };

  const getInputLabel = () => {
    return loginMethod === "phone" ? "Mobile number" : "Client code";
  };

  const getInputPlaceholder = () => {
    return loginMethod === "phone"
      ? "Enter your mobile number"
      : "Enter your client code";
  };

  const getOtpMessage = () => {
    if (authRole === "employee") {
      return `Enter the 4-digit code sent to your registered contact for ${referenceId}`;
    }
    if (authRole === "tenant_admin") {
      return `Enter the 4-digit code sent to your registered contact for ${referenceId}`;
    }
    if (loginMethod === "phone") {
      return `Enter the 4-digit code sent to **${referenceId.slice(
        0,
        2
      )}XX-XXX-${referenceId.slice(-3)}**`;
    } else {
      return `Enter the 4-digit code sent to your registered mobile number for client code: ${referenceId}`;
    }
  };

  const handleLoginWithOPass = () => {
    navigation.navigate("LoginWithPass");
  };

  const renderLoginScreen = () => (
    <View style={simpleStyles.container}>
      <Text style={simpleStyles.mainTitle}>Login</Text>
      {showTenantSelector ? (
        <View style={simpleStyles.tenantWrap}>
          <Text style={simpleStyles.inputLabel}>Tenant Code</Text>
          <View style={simpleStyles.tenantRow}>
            <View style={[simpleStyles.inputOuterContainer, { flex: 1 }]}>
              <View style={simpleStyles.inputInnerContainer}>
                <TextInput
                  style={simpleStyles.input}
                  placeholder="e.g. MOTISONS"
                  placeholderTextColor="#AAB7B8"
                  value={tenantCode}
                  autoCapitalize="characters"
                  onChangeText={(v) => setTenantCode(String(v || "").replace(/[^A-Za-z0-9_-]/g, "").toUpperCase())}
                />
              </View>
            </View>
            <TouchableOpacity
              style={simpleStyles.applyTenantBtn}
              onPress={handleApplyTenant}
              disabled={tenantLoading}
            >
              <Text style={simpleStyles.applyTenantTxt}>
                {tenantLoading ? "..." : "Apply"}
              </Text>
            </TouchableOpacity>
          </View>
          {!!Config?.RuntimeTenant?.appName && (
            <Text style={simpleStyles.tenantHint}>Brand: {Config.RuntimeTenant.appName}</Text>
          )}
        </View>
      ) : null}

      {inferAuthRole() === "client" ? (
        <Text style={simpleStyles.mainTitle}>
          Enter your mobile number or client code
        </Text>
      ) : null}

      {inferAuthRole() === "client" ? <View style={simpleStyles.methodToggle}>
        <TouchableOpacity
          style={[
            simpleStyles.toggleButton,
            loginMethod === "phone" && simpleStyles.toggleButtonActive,
          ]}
          onPress={() => {
            setLoginMethod("phone");
            setReferenceId("");
            setValidationErrors({});
          }}
        >
          <Text
            style={[
              simpleStyles.toggleText,
              loginMethod === "phone" && simpleStyles.toggleTextActive,
            ]}
          >
            Mobile Number
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            simpleStyles.toggleButton,
            loginMethod === "clientCode" && simpleStyles.toggleButtonActive,
          ]}
          onPress={() => {
            setLoginMethod("clientCode");
            setReferenceId("");
            setValidationErrors({});
          }}
        >
          <Text
            style={[
              simpleStyles.toggleText,
              loginMethod === "clientCode" && simpleStyles.toggleTextActive,
            ]}
          >
            Client Code
          </Text>
        </TouchableOpacity>
      </View> : null}

      <View style={simpleStyles.inputGroup}>
        <Text style={simpleStyles.inputLabel}>
          Login ID
        </Text>

        {/* Apply Rbutton border style to input container */}
        <View
          style={[
            simpleStyles.inputOuterContainer,
            (validationErrors.referenceId || errorMessage) &&
              simpleStyles.inputOuterError,
          ]}
        >
          <View
            style={[
              simpleStyles.inputInnerContainer,
              (validationErrors.referenceId || errorMessage) &&
                simpleStyles.inputInnerError,
            ]}
          >
            <TextInput
              style={simpleStyles.input}
              placeholder={inferAuthRole() === "client" ? getInputPlaceholder() : "Enter email or ARN code"}
              placeholderTextColor="#AAB7B8"
              value={referenceId}
              onChangeText={handleInputChange}
              keyboardType="default"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={isInputValid() ? handleSendOtp : undefined}
            />
          </View>
        </View>

        <View style={[simpleStyles.inputOuterContainer, { marginTop: 10 }]}>
          <View style={simpleStyles.inputInnerContainer}>
            <TextInput
              style={simpleStyles.input}
              placeholder="Password (only for admin/employee)"
              placeholderTextColor="#AAB7B8"
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>
        </View>

        {validationErrors.referenceId && (
          <Text style={simpleStyles.fieldErrorText}>
            {validationErrors.referenceId}
          </Text>
        )}
        {errorMessage ? (
          <Text style={simpleStyles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>

      <View style={simpleStyles.spacer} />

      <View style={simpleStyles.footer}>
        <Text style={simpleStyles.policyText}>
          By proceeding, you agree with {(Config?.RuntimeTenant?.appName || "your broker") + "'s"}{" "}
          <Text style={simpleStyles.policyLink}>terms and conditions</Text> and{" "}
          <Text style={simpleStyles.policyLink}>privacy policy.</Text>
        </Text>

        <Rbutton
          title="Get OTP"
          onPress={handleSendOtp}
          disabled={!isInputValid()}
          loading={isLoading}
        />
        {inferAuthRole() === "client" ? (
          <TouchableOpacity
            style={simpleStyles.otpLoginButton}
            onPress={handleLoginWithOPass}
          >
            <Text style={simpleStyles.otpLoginText}>Login with Password</Text>
          </TouchableOpacity>
        ) : null}

        {/* <View style={simpleStyles.trustBadge}>
          <Text style={simpleStyles.trustIcon}>✔️</Text>
          <Text style={simpleStyles.trustText}>Trusted by many Brokers</Text>
        </View> */}

        {inferAuthRole() === "client" ? (
          <TouchableOpacity
            style={simpleStyles.registerContainer}
            onPress={() => navigation?.navigate("Registration")}
          >
            <Text style={simpleStyles.registerText}>
              Don't have an account?
              <Text style={simpleStyles.registerLink}> Register Now</Text>
            </Text>
          </TouchableOpacity>
        ) : null}

        {inferAuthRole() === "client" ? (
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

  const renderOtpScreen = () => (
    <View style={simpleStyles.container}>
      <TouchableOpacity
        style={simpleStyles.backButton}
        onPress={handleBackToLogin}
      >
        <SInfoSvg.BackButton
          height={widthToDp(5)}
          width={widthToDp(5)}
          color="#1C1C1C"
        />
      </TouchableOpacity>

      <Text style={[simpleStyles.mainTitle, { marginTop: heightToDp(3) }]}>
        Verification
      </Text>
      <Text style={simpleStyles.subtitle}>{getOtpMessage()}</Text>

      {/* Apply Rbutton border style to OTP container */}
      <View style={simpleStyles.otpOuterContainer}>
        {otp.map((digit, index) => (
          <View key={index} style={simpleStyles.otpDigitContainer}>
            <View
              style={[
                simpleStyles.otpInnerContainer,
                digit && simpleStyles.otpInnerFilled,
                errorMessage && !digit && simpleStyles.otpInnerError,
              ]}
            >
              <TextInput
                ref={(ref) => (otpInputRefs.current[index] = ref)}
                style={simpleStyles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus={true}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={simpleStyles.resendContainer}>
        <Text style={simpleStyles.resendText}>Didn't receive code?</Text>
        {canResend ? (
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={simpleStyles.resendLink}> Resend OTP</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[simpleStyles.resendText, simpleStyles.resendDisabled]}>
            {" "}
            Resend in {resendTimer}s
          </Text>
        )}
      </View>

      {errorMessage ? (
        <Text style={simpleStyles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={simpleStyles.spacer} />

      <View style={simpleStyles.footer}>
        <Rbutton
          title="Verify & Continue"
          onPress={handleVerifyOtp}
          disabled={isLoading || !isOtpValid()}
          loading={isLoading}
        />
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
            {isOtpSent ? renderOtpScreen() : renderLoginScreen()}
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
    marginBottom: heightToDp(2),
    fontFamily: Config.fontFamilys?.Poppins_ExtraBold || "System",
  },
  subtitle: {
    fontSize: widthToDp(3.8),
    color: "#555",
    textAlign: "left",
    marginBottom: heightToDp(5),
    lineHeight: heightToDp(2.5),
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  methodToggle: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: widthToDp(2),
    padding: widthToDp(1),
    marginBottom: heightToDp(3),
    borderWidth: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(1.5),
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleText: {
    fontSize: widthToDp(3.8),
    color: "#7A7A7A",
    fontWeight: "500",
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  toggleTextActive: {
    color: "#000000", // Using Rbutton green color
    fontWeight: "600",
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || "System",
  },
  inputGroup: {
    marginBottom: heightToDp(3),
  },
  tenantWrap: {
    marginBottom: heightToDp(2.5),
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  applyTenantBtn: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.7),
    minWidth: widthToDp(18),
    alignItems: "center",
    justifyContent: "center",
  },
  applyTenantTxt: {
    color: "#ffffff",
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || "System",
    fontSize: widthToDp(3.4),
  },
  tenantHint: {
    marginTop: heightToDp(0.8),
    color: "#6B7280",
    fontSize: widthToDp(3.1),
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  inputLabel: {
    fontSize: widthToDp(3.5),
    color: "#7A7A7A",
    marginBottom: heightToDp(1),
    fontFamily: Config.fontFamilys?.Poppins_Medium || "System",
  },
  // Rbutton style applied to input container
  inputOuterContainer: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: "#000000", // Dark green border from Rbutton
    alignSelf: "stretch",
  },
  inputOuterError: {
    backgroundColor: "#A0A0A0", // Lighter color for error state
  },
  inputInnerContainer: {
    backgroundColor: "#FFFFFF", // White background from Rbutton
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderRadius: 6,
    // Shadow effect from Rbutton
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputInnerError: {
    backgroundColor: "#F0F0F0", // Light gray background when error
  },
  input: {
    height: heightToDp(4),
    padding: 0,
    fontSize: widthToDp(4.5),
    color: "#1C1C1C",
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || "System",
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
    marginBottom: heightToDp(8),
  },
  registerText: {
    textAlign: "center",
    fontSize: widthToDp(3.5),
    color: "#7F8C8D",
    fontFamily: Config.fontFamilys?.Poppins_Regular || "System",
  },
  registerLink: {
    color: "#000000", // Using Rbutton green color
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
    color: "#0F172A",
  },
  staffLinkSubText: {
    fontSize: widthToDp(3),
    color: "#6B7280",
  },
  backButton: {
    width: widthToDp(10),
    height: widthToDp(10),
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: heightToDp(2),
  },
  // Rbutton style applied to OTP container
  otpOuterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightToDp(4),
    paddingHorizontal: widthToDp(1),
  },
  otpDigitContainer: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: "#000000", // Dark green border from Rbutton
  },
  otpInnerContainer: {
    width: widthToDp(14),
    height: widthToDp(14),
    backgroundColor: "#FFFFFF", // White background from Rbutton
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    // Shadow effect from Rbutton
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  otpInnerFilled: {
    backgroundColor: "#E6F0FF",
  },
  otpInnerError: {
    backgroundColor: "#F0F0F0",
  },
  otpInput: {
    width: "100%",
    height: "100%",
    fontSize: widthToDp(6),
    fontWeight: "bold",
    color: "#1C1C1C",
    textAlign: "center",
    fontFamily: Config.fontFamilys?.Poppins_Bold || "System",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: heightToDp(3),
  },
  resendText: {
    fontSize: widthToDp(3.5),
    color: "#7F8C8D",
    fontFamily: Config.fontFamilys?.Poppins_Regular || "System",
  },
  resendLink: {
    fontSize: widthToDp(3.5),
    color: "#000000", // Using Rbutton green color
    fontWeight: "700",
    fontFamily: Config.fontFamilys?.Poppins_Bold || "System",
  },
  resendDisabled: {
    color: "#AAB7B8",
  },
    otpLoginButton: {
      marginTop: heightToDp(2),
      marginBottom: heightToDp(2),
      paddingVertical: heightToDp(1.5),
      alignItems: 'center',
    },
    otpLoginText: {
      fontSize: widthToDp(3.8),
      color: '#000000',
      fontWeight: '600',
      fontFamily: Config.fontFamilys?.Poppins_SemiBold || 'System',
      textDecorationLine: 'underline',
    },
});
