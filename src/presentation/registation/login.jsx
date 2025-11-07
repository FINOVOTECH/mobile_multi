import { SafeAreaView, StyleSheet, Text, View, TextInput,BackHandler, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import SInfoSvg from '../svgs';
import { navigationRef } from '../../navigation';
import { useNavigation } from '@react-navigation/native';
import Rbutton from '../../components/Rbutton';

const RegiLogin = ({
  setStatus,
  errors,
  setErrors,
  isLoading,
  setIsLoading,
  mobile,
  setMobile,
  email,
  setEmail
}) => {
  const navigation = useNavigation()
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  useEffect(() => {
  const backAction = () => {
    navigation.goBack();
    return true; 
  };

  const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

  return () => backHandler.remove();
}, []);

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleMobileChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setMobile(numericText);

    if (numericText && !validateMobile(numericText)) {
      setErrors(prev => ({ ...prev, mobile: 'Please enter a valid 10-digit mobile number' }));
    } else {
      setErrors(prev => ({ ...prev, mobile: '' }));
    }
  };

  const isFormValid = () => {
    const hasEmail = email && validateEmail(email);
    const hasMobile = mobile && validateMobile(mobile);
    return hasEmail || hasMobile;
  };

  const handleSendOtp = async () => {
    setErrors({});
    const newErrors = {};

    if (!email && !mobile) {
      newErrors.general = 'Please enter either email or mobile number';
    } else {
      if (email && !validateEmail(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (mobile && !validateMobile(mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', newErrors.general || 'Please fix the errors and try again');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/first/registration/registration/email-phone/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || null,
          mobile: mobile || null
        }),
      });

      const data = await response.json();
      console.log("Login DATA:::", data);

      if (response.ok) {
        console.log("OTP PAGE");
        setStatus("loginVerify");
        console.log("OTP DONE");
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
          <View style={styles.mainContent}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <TouchableOpacity onPress={()=>navigation.goBack()}>
              <SInfoSvg.BackButton />
              </TouchableOpacity>
              <View style={{flexDirection:"row", alignItems:"center"}}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode='contain'
                />
                <Text style={styles.logoText}>Jyoti MF</Text>
              </View>
              <Text> </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Mobile Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>MOBILE NUMBER</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.mobile && styles.inputError
                  ]}
                  placeholder="Eg: 9899xxxx"
                  value={mobile}
                  onChangeText={handleMobileChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#999"
                />
                {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError
                  ]}
                  placeholder="Eg: me@gmail.com"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* General Error */}
              {errors.general && (
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              )}
            </View>
          </View>

          {/* Next Button */}
          <View style={styles.buttonContainer}>
          <Rbutton
        title="NEXT"
        loading={isLoading}
        onPress={handleSendOtp}
        disabled={!isFormValid() || isLoading}
        style={[
          // styles.nextButton,
          (!isFormValid() || isLoading) 
        ]}
        textStyle={[
          // styles.nextButtonText,
          (!isFormValid() || isLoading)
        ]}
      />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegiLogin;

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
  mainContent: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: heightToDp(3),
    marginBottom: heightToDp(4),
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
  formContainer: {
    flex: 1,
    paddingTop: heightToDp(2),
  },
  inputContainer: {
    marginBottom: heightToDp(3),
  },
  label: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(0.8),
  },
  input: {
    height: heightToDp(6),
    borderColor: Config.Colors.primary,
    borderBottomWidth: 2,
    borderRadius: widthToDp(2),
    paddingHorizontal: widthToDp(4),
    fontSize: widthToDp(4),
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  buttonContainer: {
    paddingBottom: heightToDp(2),
    paddingTop: heightToDp(2),
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
});