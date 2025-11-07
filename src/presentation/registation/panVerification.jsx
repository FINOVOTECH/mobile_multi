import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, BackHandler } from 'react-native';
import React, { useState, useEffect } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import { useNavigation } from '@react-navigation/native';
import Rbutton from '../../components/Rbutton';

const PanVerification = ({
  setStatus,
  isLoading,
  setIsLoading,
  errors = {},
  setErrors,
  pinVerify
}) => {
  const navigation = useNavigation();
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [])
  useEffect(() => {
    if (!errors || typeof errors !== 'object') {
      setErrors({});
    }
  }, [setErrors]);

  const validateGender = (genderValue) => {
    return genderValue && (genderValue === 'MALE' || genderValue === 'FEMALE' || genderValue === 'OTHER');
  };

  const validatePanNumber = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validatePanName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validateDob = (dateStr) => {
    const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dobRegex.test(dateStr)) return false;

    const [, day, month, year] = dateStr.match(dobRegex);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    return date.getDate() == day &&
      date.getMonth() == (month - 1) &&
      date.getFullYear() == year &&
      age >= 18 &&
      date <= today;
  };

  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);

    // Clear gender error when valid gender is selected
    if (selectedGender && validateGender(selectedGender)) {
      setErrors(prev => ({
        ...(prev || {}),
        gender: ''
      }));
    }
  };

  const handlePanNumberChange = (text) => {
    const formattedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPanNumber(formattedText);

    // Real-time validation feedback
    if (formattedText && !validatePanNumber(formattedText) && formattedText.length === 10) {
      setErrors(prev => ({
        ...(prev || {}),
        panNumber: 'Please enter a valid PAN number (e.g., ABCDE1234F)'
      }));
    } else if (formattedText && validatePanNumber(formattedText)) {
      setErrors(prev => ({
        ...(prev || {}),
        panNumber: ''
      }));
    }
  };

  const handlePanNameChange = (text) => {
    setPanName(text);

    // Real-time validation feedback
    if (text && !validatePanName(text) && text.length >= 2) {
      setErrors(prev => ({
        ...(prev || {}),
        panName: 'Please enter a valid name (2-50 characters, letters only)'
      }));
    } else if (text && validatePanName(text)) {
      setErrors(prev => ({
        ...(prev || {}),
        panName: ''
      }));
    }
  };

  const handleDobChange = (text) => {
    // Format input as DD/MM/YYYY
    let formattedText = text.replace(/\D/g, '');
    if (formattedText.length >= 3) {
      formattedText = formattedText.slice(0, 2) + '/' + formattedText.slice(2);
    }
    if (formattedText.length >= 6) {
      formattedText = formattedText.slice(0, 5) + '/' + formattedText.slice(5, 9);
    }

    setDob(formattedText);

    // Real-time validation feedback
    if (formattedText && !validateDob(formattedText) && formattedText.length === 10) {
      setErrors(prev => ({
        ...(prev || {}),
        dob: 'Please enter a valid date (DD/MM/YYYY) and must be 18+ years old'
      }));
    } else if (formattedText && validateDob(formattedText)) {
      setErrors(prev => ({
        ...(prev || {}),
        dob: ''
      }));
    }
  };

  const isFormValid = () => {
    const isPanNumberValid = validatePanNumber(panNumber);
    const isPanNameValid = validatePanName(panName);
    const isGenderValid = validateGender(gender);
    const isDobValid = validateDob(dob); // Now DOB is required

    return isPanNumberValid && isPanNameValid && isGenderValid && isDobValid;
  };

  const handleVerifyPan = async () => {
    // Clear previous errors
    setErrors({});

    // Validate all fields
    const newErrors = {};

    if (!panNumber) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!validatePanNumber(panNumber)) {
      newErrors.panNumber = 'Please enter a valid PAN number (e.g., ABCDE1234F)';
    }

    if (!panName) {
      newErrors.panName = 'PAN name is required';
    } else if (!validatePanName(panName)) {
      newErrors.panName = 'Please enter a valid name (2-50 characters, letters only)';
    }

    if (!gender) {
      newErrors.gender = 'Please select a gender';
    } else if (!validateGender(gender)) {
      newErrors.gender = 'Please select a valid gender';
    }

    // DOB validation is now required
    if (!dob) {
      newErrors.dob = 'Date of birth is required';
    } else if (!validateDob(dob)) {
      newErrors.dob = 'Please enter a valid date (DD/MM/YYYY) and must be 18+ years old';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please fill all fields with valid information');
      return;
    }

    if (isLoading) return; // Prevent multiple submissions

    setIsLoading(true);
    const payload = {
      name: panName,
      pan: panNumber,
      gender,
      dob: dob
    }
    console.log("PAN PAYLOAD::", payload, pinVerify)

    try {
      const response = await fetch(`${baseUrl}/api/v1/first/registration/verify/pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "registration-id": pinVerify
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("PAN Verification DATA:::", data);

      if (response.ok && data.success !== false) {
        // Clear form data on success
        setPanNumber('');
        setPanName('');
        setGender('');
        setDob('');
        setErrors({});

        // Show success message
        Alert.alert('Success', 'PAN verification completed successfully!', [
          {
            text: 'OK',
            onPress: () => setStatus(data?.nextStep)
            // onPress: () => navigation.navigate("Home")
          }
        ]);
      } else {
        // Handle API errors
        const errorMessage = data.message || data.error || 'PAN verification failed';

        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        } else {
          setErrors({ general: errorMessage });
        }

        Alert.alert('Verification Failed', errorMessage);

        // If verification failed due to server issues, go back to login verification
        if (setStatus) {
          setStatus("loginVerify");
        }
      }
    } catch (error) {
      console.error('PAN Verification Error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
      Alert.alert('Network Error', 'Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const safeErrors = errors || {};

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
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode='contain'
              />
              <Text style={styles.logoText}>TaurusFund</Text>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>PAN Verification</Text>
              <Text style={styles.subtitleText}>Enter your PAN details for verification</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>PAN NUMBER *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.panNumber && styles.inputError
                  ]}
                  placeholder="e.g., ABCDE1234F"
                  value={panNumber}
                  onChangeText={handlePanNumberChange}
                  maxLength={10}
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {safeErrors.panNumber ? <Text style={styles.errorText}>{safeErrors.panNumber}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PAN NAME *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.panName && styles.inputError
                  ]}
                  placeholder="Enter name as per PAN"
                  value={panName}
                  onChangeText={handlePanNameChange}
                  maxLength={50}
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {safeErrors.panName ? <Text style={styles.errorText}>{safeErrors.panName}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>GENDER *</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'MALE' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleGenderChange('MALE')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      gender === 'MALE' && styles.genderOptionTextSelected
                    ]}>MALE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'FEMALE' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleGenderChange('FEMALE')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      gender === 'FEMALE' && styles.genderOptionTextSelected
                    ]}>FEMALE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'OTHER' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleGenderChange('OTHER')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      gender === 'OTHER' && styles.genderOptionTextSelected
                    ]}>OTHER</Text>
                  </TouchableOpacity>
                </View>
                {safeErrors.gender ? <Text style={styles.errorText}>{safeErrors.gender}</Text> : null}
              </View>

              {/* Date of Birth field - now uncommented and active */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>DATE OF BIRTH *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.dob && styles.inputError
                  ]}
                  placeholder="DD/MM/YYYY (e.g., 10/05/1999)"
                  value={dob}
                  onChangeText={handleDobChange}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor="#999"
                />
                {safeErrors.dob ? <Text style={styles.errorText}>{safeErrors.dob}</Text> : null}
              </View>

              {safeErrors.general && (
                <Text style={styles.generalErrorText}>{safeErrors.general}</Text>
              )}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                📋 Make sure your PAN details match exactly with your PAN card
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Rbutton
              title="VERIFY PAN"
              loading={isLoading}
              onPress={handleVerifyPan}
              disabled={!isFormValid() || isLoading}
              style={[
                // styles.nextButton,
                (!isFormValid() || isLoading)
              ]}
              textStyle={[
                styles.nextButtonText,
                (!isFormValid() || isLoading)
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PanVerification;

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
    alignItems: 'start',
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
    textAlign: 'start',
    // paddingHorizontal: widthToDp(8),
  },
  formContainer: {
    flex: 1,
    // paddingTop: heightToDp(2),
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
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: widthToDp(4),
    borderRadius: widthToDp(2),
    marginTop: heightToDp(2),
  },
  infoText: {
    fontSize: widthToDp(3.5),
    color: '#666',
    textAlign: 'center',
    lineHeight: heightToDp(2.5),
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
  ////

  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(0.5),
  },
  genderOption: {
    flex: 1,
    paddingVertical: heightToDp(1.2),
    paddingHorizontal: widthToDp(3),
    borderWidth: 2,
    borderColor: Config.Colors.primary,
    borderRadius: widthToDp(2),
    marginHorizontal: widthToDp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderOptionSelected: {
    backgroundColor: Config.Colors.primary,
    borderColor: Config.Colors.primary,
  },
  genderOptionText: {
    textAlign: 'center',
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#333',
  },
  genderOptionTextSelected: {
    color: 'white',
  },
});