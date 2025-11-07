import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { widthToDp, heightToDp } from "../../../helpers/Responsive";
import * as Config from "../../../helpers/Config"
import SInfoSvg from "../../svgs";
import { addMfData, selectMfData, setLoading as setMfLoading, setError } from "../../../store/slices/mfDataSlice";
import Rbutton from "../../../components/Rbutton";
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;
const DIGIT_REGEX = /^\d{0,10}$/;
const OTP_REGEX = /^\d{0,6}$/;

const PanVerify = ({ navigation }) => {
  const dispatch = useDispatch();
  const mfData = useSelector(selectMfData);
  
  const [pan, setPan] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [otpSend, setOtpSend] = useState("");
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [requestData, setRequestData] = useState([]);
  const [details, setDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  const validateFields = () => {
    if (!PAN_REGEX.test(pan)) {
      Alert.alert(
        "Invalid PAN",
        "Please enter a valid PAN number in uppercase (e.g., ABCDE1234F)"
      );
      return false;
    }

    if (!MOBILE_REGEX.test(phoneOrEmail)) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a 10-digit mobile number."
      );
      return false;
    }

    return true;
  };

  const requestOtp = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://payment.sajagonline.com:5534/api/fetch/mf-central/process?pan=${pan}&phone=${phoneOrEmail}&email=`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("requestData", data);
        Alert.alert("Success", "OTP request sent successfully!");
        setRequestData(data);
        setIsOtpScreen(true);
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!requestData) {
      Alert.alert("Error", "Request data is missing. Please try again.");
      return;
    }

    const { reqId, otpRef, clientRefNo } = requestData;
    console.log("OTP DATA", `https://payment.sajagonline.com:5534/api/fetch/mf-central/otp-process?requestId=${reqId}&otpReference=${otpRef}&clientReferenceNo=${clientRefNo}&otp=${otpSend}`)
    setLoading(true);
    try {
      const response = await fetch(
        `https://payment.sajagonline.com:5534/api/fetch/mf-central/otp-process?requestId=${reqId}&otpReference=${otpRef}&clientReferenceNo=${clientRefNo}&otp=${otpSend}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("second res", data);
      
      if (data.status === "SUCCESS") {
        Alert.alert("Success", data.message || "User Request Submitted Successfully");
        setDetails(true)
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    const { reqId, clientRefNo } = requestData;
    console.log("second req", requestData);
    
    setLoading(true);
    dispatch(setMfLoading(true));
    
    try {
      console.log("FETCH RESPONSE", `https://payment.sajagonline.com:5534/api/fetch/mf-central/get-casdocument?requestId=${reqId}&clientReferenceNo=${clientRefNo}`)
      
      const response = await fetch(
        `https://payment.sajagonline.com:5534/api/fetch/mf-central/get-casdocument?requestId=${reqId}&clientReferenceNo=${clientRefNo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("data ==", data);
      
      if (data.status === "FAILED") {
        Alert.alert("Info", "We are in process of generating the CAS. Please visit after sometime.");
        navigation.goBack();
      } else {
        dispatch(addMfData(data));
        console.log("Data added to Redux store");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error", "Failed to connect to the server");
      dispatch(setError("Failed to connect to the server"));
    } finally {
      setLoading(false);
      dispatch(setMfLoading(false));
    }
  };

  const handleContinue = () => {
    if (isOtpScreen) {
      verifyOtp();
    } else {
      requestOtp();
    }
  };

  const handlePanChange = (text) => setPan(text.toUpperCase());
  const handlePhoneChange = (text) => {
    if (DIGIT_REGEX.test(text)) setPhoneOrEmail(text);
  };
  const handleOtpChange = (text) => {
    if (OTP_REGEX.test(text)) setOtpSend(text);
  };

  const Header = () => (
    <LinearGradient
      colors={['#2B8DF6', '#2B8DF6']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Image
        source={bgVector}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        resizeMode="cover"
      />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <SInfoSvg.WhiteBackButton />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Portfolio Sync</Text>
          <Text style={styles.headerSubtitle}>Sync your external investments</Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
      
      <Header />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.iconSection}>
                <View style={styles.iconBackground}>
                  <SInfoSvg.Cloud />
                  <SInfoSvg.Sync style={styles.syncIcon} />
                </View>
              </View>

              <View style={styles.textSection}>
                <Text style={styles.title}>External Portfolio Sync</Text>
                <Text style={styles.description}>
                  Track, switch and sell your external mutual funds from Wealthy
                </Text>
              </View>
              
              <View style={styles.formSection}>
                {!details && (
                  <View style={styles.inputContainer}>
                    {!isOtpScreen ? (
                      <>
                        <View style={styles.inputWrapper}>
                          <Text style={styles.inputLabel}>PAN Number</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your PAN"
                            value={pan}
                            onChangeText={handlePanChange}
                            maxLength={10}
                            autoCapitalize="characters"
                            editable={!loading}
                            placeholderTextColor="#999"
                          />
                          <Text style={styles.counter}>{pan.length}/10</Text>
                        </View>

                        <View style={styles.inputWrapper}>
                          <Text style={styles.inputLabel}>Mobile Number</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your mobile number"
                            value={phoneOrEmail}
                            onChangeText={handlePhoneChange}
                            maxLength={10}
                            keyboardType="phone-pad"
                            editable={!loading}
                            placeholderTextColor="#999"
                          />
                        </View>
                      </>
                    ) : (
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>OTP Verification</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter OTP sent to your mobile"
                          value={otpSend}
                          onChangeText={handleOtpChange}
                          editable={!details && !loading}
                          maxLength={6}
                          keyboardType="number-pad"
                          placeholderTextColor="#999"
                        />
                        <Text style={styles.otpHelp}>
                          OTP sent to {phoneOrEmail}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {!details ? (
                  <Rbutton
                    title={loading ? "Processing..." : (isOtpScreen ? "Verify OTP" : "Send OTP")}
                    loading={loading}
                    onPress={handleContinue}
                    disabled={loading}
                    style={styles.continueButton}
                  />
                ) : (
                  <Rbutton
                    title={loading ? "Fetching Details..." : "Fetch Portfolio Details"}
                    loading={loading}
                    onPress={fetchDetails}
                    disabled={loading}
                    style={styles.continueButton}
                  />
                )}
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                  Your portfolio data will be securely synced via MF Central
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PanVerify;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#2B8DF6',
  },

  // Header Styles
  headerGradient: {
    backgroundColor: '#2B8DF6',
    paddingBottom: heightToDp(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(1),
  },
  backButton: {
    marginRight: widthToDp(3),
    padding: widthToDp(1.5),
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: widthToDp(2),
  },
  headerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: widthToDp(3.5),
    color: '#E6F3FF',
    marginTop: heightToDp(0.5),
  },

  // Keyboard & Scroll
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(4),
  },

  // Icon Section
  iconSection: {
    alignItems: 'center',
    marginBottom: heightToDp(3),
  },
  iconBackground: {
    width: widthToDp(25),
    height: widthToDp(25),
    borderRadius: widthToDp(12.5),
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  syncIcon: {
    position: 'absolute',
    bottom: widthToDp(-2),
    right: widthToDp(-2),
  },

  // Text Section
  textSection: {
    alignItems: 'center',
    marginBottom: heightToDp(4),
  },
  title: {
    fontSize: widthToDp(5),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },
  description: {
    fontSize: widthToDp(3.8),
    color: '#666',
    textAlign: 'center',
    lineHeight: heightToDp(3),
    paddingHorizontal: widthToDp(4),
  },

  // Form Section
  formSection: {
    marginBottom: heightToDp(3),
  },
  inputContainer: {
    marginBottom: heightToDp(3),
  },
  inputWrapper: {
    marginBottom: heightToDp(2),
    position: 'relative',
  },
  inputLabel: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(1),
  },
  input: {
    height: heightToDp(6),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: widthToDp(2),
    paddingHorizontal: widthToDp(4),
    fontSize: widthToDp(4),
    backgroundColor: '#FFFFFF',
    color: '#333',
  },
  counter: {
    position: 'absolute',
    right: widthToDp(4),
    top: heightToDp(3.5),
    fontSize: widthToDp(3.2),
    color: '#999',
  },
  otpHelp: {
    fontSize: widthToDp(3.2),
    color: '#666',
    marginTop: heightToDp(0.5),
    textAlign: 'center',
  },

  // Continue Button
  continueButton: {
    marginTop: heightToDp(1),
  },

  // Info Section
  infoSection: {
    alignItems: 'center',
    marginTop: heightToDp(2),
    paddingHorizontal: widthToDp(4),
  },
  infoText: {
    fontSize: widthToDp(3.2),
    color: '#666',
    textAlign: 'center',
    lineHeight: heightToDp(2.5),
  },
});