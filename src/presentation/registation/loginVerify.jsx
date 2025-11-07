import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, Animated, BackHandler } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import { useNavigation } from '@react-navigation/native';
import Rbutton from '../../components/Rbutton';

const LoginVerify = ({
  setStatus,
  setErrors,
  errors,
  emailOtp,
  setEmailOtp,
  mobileOtp,
  setMobileOtp,
  isLoading,
  setIsLoading,
  pinVerify,
  setPinVerify,
  email,
  mobile,
}) => {
  const navigation = useNavigation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinErrors, setPinErrors] = useState({});
  const [pinToken, setPinToken] = useState()

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [])

  const slideAnim = useRef(new Animated.Value(0)).current;

  const validateOtp = (otp) => {
    const otpRegex = /^\d{4}$/;
    return otpRegex.test(otp);
  };

  const handleMobileChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setMobileOtp(numericText);

    if (numericText && !validateOtp(numericText)) {
      setErrors(prev => ({ ...prev, mobile: 'Please enter a valid 4-digit OTP' }));
    } else {
      setErrors(prev => ({ ...prev, mobile: '' }));
    }
  };

  const handleEmailChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setEmailOtp(numericText);

    if (numericText && !validateOtp(numericText)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid 4-digit OTP' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const getPinStepSubtitle = () => {
    switch (pinStep) {
      case 1: return 'Enter a 4-digit PIN for secure access';
      case 2: return 'Re-enter your PIN to confirm';
      case 3: return 'Please wait while we set up your account';
      default: return '';
    }
  };

  const getPinStepTitle = () => {
    switch (pinStep) {
      case 1: return 'Create 4-Digit PIN';
      case 2: return 'Confirm Your PIN';
      case 3: return 'Setting up Account...';
      default: return 'Create PIN';
    }
  };

  const showPinModalWithAnimation = () => {
    setShowPinModal(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hidePinModalWithAnimation = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPinModal(false);
      setPinStep(1);
      setPin('');
      setConfirmPin('');
      setPinErrors({});
    });
  };

  const handlePinStepNext = () => {
    if (pinStep === 1) {
      if (pin.length !== 4) {
        setPinErrors({ pin: 'PIN must be 4 digits' });
        return;
      }
      setPinErrors({});
      setPinStep(2);
    } else if (pinStep === 2) {
      if (confirmPin.length !== 4) {
        setPinErrors({ confirmPin: 'PIN must be 4 digits' });
        return;
      }
      if (pin !== confirmPin) {
        setPinErrors({ confirmPin: 'PINs do not match' });
        return;
      }
      setPinErrors({});
      setPinStep(3);
      handleSetPassword();
    }
  };

  const handleSetPassword = async () => {
    setIsPinLoading(true);

    try {
      console.log("Setting Password::", {
        password: pin,
        passwordResetToken: pinToken,
        registrationId: pinVerify
      });

      const response = await fetch(`${baseUrl}/api/v1/first/registration/set-first/password`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            password: pin,
            passwordResetToken: pinToken,
            registrationId: pinVerify
          })
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Password Set Success:", data);
        Alert.alert('Success', 'Account setup completed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              hidePinModalWithAnimation();
              setStatus("PAN_VERIFICATION");
            }
          }
        ]);
      } else {
        console.log("Password Set Error:", data);
        Alert.alert('Error', data.message || 'Failed to set up account');
        setPinStep(1);
        setPin('');
        setConfirmPin('');
      }
    } catch (error) {
      console.log("Password Set Network Error:", error);
      Alert.alert('Error', 'Network error. Please try again.');
      setPinStep(1);
      setPin('');
      setConfirmPin('');
    } finally {
      setIsPinLoading(false);
    }
  };

  const isFormValid = () => {
    const isEmailOtpValid = validateOtp(emailOtp);
    const isMobileOtpValid = validateOtp(mobileOtp);
    return isEmailOtpValid && isMobileOtpValid;
  };

  const handlePinChange = (text) => {
    const numericText = text.replace(/\D/g, '');
    if (numericText.length <= 4) {
      setPin(numericText);
      setPinErrors(prev => ({ ...prev, pin: '' }));
    }
  };

  const handleVerifyOtp = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    const newErrors = {};

    if (!emailOtp || !validateOtp(emailOtp)) {
      newErrors.email = 'Please enter a valid 4-digit Email OTP';
    }

    if (!mobileOtp || !validateOtp(mobileOtp)) {
      newErrors.mobile = 'Please enter a valid 4-digit Mobile OTP';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please enter valid 4-digit OTPs for both Email and Mobile');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: email,
        mobile: mobile,
        emailBelongsTo: "SELF",
        mobileBelongsTo: "SELF",
        mobileOtp: mobileOtp,
        emailOtp: emailOtp,
      }

      const response = await fetch(`${baseUrl}/api/v1/first/registration/verify/otp-submitted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("OTP Verification DATA:::", data);

      if (data.status === "SUCCESS") {
        if (data?.passwordResetToken) {
          showPinModalWithAnimation();
          setPinVerify(data.registrationId);
          setPinToken(data.passwordResetToken)
        } else {
          setPinVerify(data.registrationId);
          Alert.alert('Success', 'OTP verified successfully', [
            {
              text: 'OK',
              onPress: () => {
                // showPinModalWithAnimation();
                setStatus(data.nextStep || "PAN_VERIFICATION")
              }
            }
          ]);
        }
      } else {
        Alert.alert('Error', data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.log("OTP Verification Error:", error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPinChange = (text) => {
    const numericText = text.replace(/\D/g, '');
    if (numericText.length <= 4) {
      setConfirmPin(numericText);
      setPinErrors(prev => ({ ...prev, confirmPin: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode='contain'
              />
              <Text style={styles.logoText}>Jyoti MF</Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.subtitleText}>Enter the 4-digit OTP sent to your email and mobile</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Mobile OTP Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>MOBILE OTP</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.mobile && styles.inputError
                  ]}
                  placeholder="Enter 4-digit OTP"
                  value={mobileOtp}
                  onChangeText={handleMobileChange}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor="#999"
                  textAlign="start"
                />
                {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
              </View>

              {/* Email OTP Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>EMAIL OTP</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError
                  ]}
                  placeholder="Enter 4-digit OTP"
                  value={emailOtp}
                  onChangeText={handleEmailChange}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor="#999"
                  textAlign="start"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* General Error */}
              {errors.general && (
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              )}
            </View>

            {/* Resend OTP Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive OTP? </Text>
              <TouchableOpacity onPress={() => setStatus("login")}>
                <Text style={styles.resendButton}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Verify Button */}
          <View style={styles.buttonContainer}>
            <Rbutton
              title="VERIFY OTP"
              loading={isLoading}
              onPress={handleVerifyOtp}
              disabled={!isFormValid() || isLoading}
              style={[
                // styles.nextButton,
                !isFormValid()
              ]}
              textStyle={[
                // styles.nextButtonText,
                !isFormValid()
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        animationType="none"
        onRequestClose={hidePinModalWithAnimation}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={pinStep < 3 ? hidePinModalWithAnimation : undefined}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [heightToDp(50), 0],
                  }),
                }],
              }
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{getPinStepTitle()}</Text>
              <Text style={styles.modalSubtitle}>{getPinStepSubtitle()}</Text>

              {pinStep === 1 && (
                <View style={styles.pinInputContainer}>
                  <TextInput
                    style={[styles.pinInput, pinErrors.pin && styles.inputError]}
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChangeText={handlePinChange}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    placeholderTextColor="#999"
                    textAlign="center"
                  />
                  {pinErrors.pin && <Text style={styles.errorText}>{pinErrors.pin}</Text>}
                </View>
              )}

              {pinStep === 2 && (
                <View style={styles.pinInputContainer}>
                  <TextInput
                    style={[styles.pinInput, pinErrors.confirmPin && styles.inputError]}
                    placeholder="Re-enter PIN"
                    value={confirmPin}
                    onChangeText={handleConfirmPinChange}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    placeholderTextColor="#999"
                    textAlign="center"
                  />
                  {pinErrors.confirmPin && <Text style={styles.errorText}>{pinErrors.confirmPin}</Text>}
                </View>
              )}

              {pinStep === 3 && (
                <View style={styles.verificationContainer}>
                  <ActivityIndicator size="large" color={Config.Colors.primary} />
                  <Text style={styles.verificationText}>Setting up your account...</Text>
                </View>
              )}

              {pinStep < 3 && (
                <Rbutton
                  title={pinStep === 1 ? 'CONTINUE' : 'SET PASSWORD'}
                  loading={isPinLoading}
                  onPress={handlePinStepNext}
                  disabled={
                    (pinStep === 1 && pin.length !== 4) ||
                    (pinStep === 2 && confirmPin.length !== 4) ||
                    isPinLoading
                  }
                  style={[
                    // styles.modalButton,
                    ((pinStep === 1 && pin.length !== 4) || (pinStep === 2 && confirmPin.length !== 4))
                  ]}
                  textStyle={[
                    // styles.modalButtonText,
                    ((pinStep === 1 && pin.length !== 4) || (pinStep === 2 && confirmPin.length !== 4))
                  ]}
                />
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LoginVerify;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: heightToDp(3),
    marginBottom: heightToDp(1),
    gap: widthToDp(2),
  },
  logo: {
    borderRadius: widthToDp(10),
    width: widthToDp(12),
    height: heightToDp(5.5),
  },
  logoText: {
    fontSize: widthToDp(6),
    fontWeight: '700',
    color: "black",
    opacity: 0.8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: heightToDp(3),
  },
  titleText: {
    fontSize: widthToDp(5.5),
    fontWeight: '700',
    color: '#333',
    marginBottom: heightToDp(0.5),
  },
  subtitleText: {
    fontSize: widthToDp(3.5),
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: widthToDp(8),
  },
  formContainer: {
    flex: 1,
    paddingTop: heightToDp(2),
  },
  inputContainer: {
    marginBottom: heightToDp(2.5),
  },
  label: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(0.5),
  },
  input: {
    height: heightToDp(6),
    borderColor: Config.Colors.primary,
    borderBottomWidth: 2,
    borderRadius: widthToDp(2),
    paddingHorizontal: widthToDp(4),
    fontSize: widthToDp(5),
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '600',
    letterSpacing: widthToDp(0.5),
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: widthToDp(3),
    marginTop: heightToDp(0.5),
    fontWeight: '500',
  },
  generalErrorText: {
    color: '#ff4444',
    fontSize: widthToDp(3.5),
    textAlign: 'center',
    marginTop: heightToDp(1),
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: widthToDp(3.5),
    color: '#666',
  },
  resendButton: {
    fontSize: widthToDp(3.5),
    color: Config.Colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingBottom: heightToDp(2),
  },
  nextButton: {
    backgroundColor: Config.Colors.primary,
    paddingVertical: heightToDp(1.8),
    borderRadius: widthToDp(3),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  nextButtonText: {
    textAlign: "center",
    fontSize: widthToDp(5),
    color: "white",
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: widthToDp(5),
    borderTopRightRadius: widthToDp(5),
    paddingBottom: heightToDp(5),
    minHeight: heightToDp(45),
  },
  modalHandle: {
    width: widthToDp(12),
    height: heightToDp(0.6),
    backgroundColor: '#ddd',
    borderRadius: widthToDp(2),
    alignSelf: 'center',
    marginTop: heightToDp(1),
    marginBottom: heightToDp(2),
  },
  modalContent: {
    paddingHorizontal: widthToDp(6),
    paddingTop: heightToDp(1),
  },
  modalTitle: {
    fontSize: widthToDp(5.5),
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },
  modalSubtitle: {
    fontSize: widthToDp(3.5),
    color: '#666',
    textAlign: 'center',
    marginBottom: heightToDp(3),
  },
  pinInputContainer: {
    marginBottom: heightToDp(3),
  },
  pinInput: {
    height: heightToDp(6),
    borderColor: Config.Colors.primary,
    borderWidth: 2,
    borderRadius: widthToDp(2),
    paddingHorizontal: widthToDp(4),
    fontSize: widthToDp(5),
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    letterSpacing: widthToDp(2),
  },
  verificationContainer: {
    alignItems: 'center',
    paddingVertical: heightToDp(3),
  },
  verificationText: {
    fontSize: widthToDp(4),
    color: '#666',
    marginTop: heightToDp(2),
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: Config.Colors.primary,
    paddingVertical: heightToDp(1.8),
    borderRadius: widthToDp(3),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: heightToDp(2),
  },
  modalButtonText: {
    textAlign: "center",
    fontSize: widthToDp(4.5),
    color: "white",
    fontWeight: '600',
  },
});