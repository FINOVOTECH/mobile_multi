import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, BackHandler } from 'react-native';
import React, { useState, useEffect } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import { useNavigation } from '@react-navigation/native';
import Rbutton from '../../components/Rbutton';

const BankDetails = ({
  setStatus,
  isLoading,
  setIsLoading,
  errors = {},
  setErrors,
  pinVerify
}) => {
  const navigation = useNavigation();
  const [ifscCode, setIfscCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [nameAsOnBank, setNameAsOnBank] = useState('');
  const [accountType, setAccountType] = useState('');

  // Initialize errors state properly
  useEffect(() => {
    if (!errors || typeof errors !== 'object') {
      setErrors({});
    }
  }, [setErrors]);

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);


  // Validation functions
  const validateIfscCode = (ifsc) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  const validateAccountNumber = (accountNum) => {
    const accountRegex = /^[0-9]{9,18}$/;
    return accountRegex.test(accountNum);
  };

  const validateAccountName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validateAccountType = (type) => {
    return type && (type === 'SAVING' || type === 'CURRENT');
  };

  const validateConfirmAccount = (confirmAcc, originalAcc) => {
    return confirmAcc === originalAcc && confirmAcc.length > 0;
  };

  // Handle input changes with real-time validation
  const handleIfscChange = (text) => {
    const formattedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setIfscCode(formattedText);

    // Real-time validation feedback
    if (formattedText && !validateIfscCode(formattedText) && formattedText.length === 11) {
      setErrors(prev => ({
        ...(prev || {}),
        ifscCode: 'Please enter a valid IFSC code (e.g., ICIC0001234)'
      }));
    } else if (formattedText && validateIfscCode(formattedText)) {
      setErrors(prev => ({
        ...(prev || {}),
        ifscCode: ''
      }));
    }
  };

  const handleAccountNumberChange = (text) => {
    const formattedText = text.replace(/[^0-9]/g, '');
    setAccountNumber(formattedText);

    // Real-time validation feedback
    if (formattedText && !validateAccountNumber(formattedText) && formattedText.length >= 9) {
      setErrors(prev => ({
        ...(prev || {}),
        accountNumber: 'Account number must be 9-18 digits long'
      }));
    } else if (formattedText && validateAccountNumber(formattedText)) {
      setErrors(prev => ({
        ...(prev || {}),
        accountNumber: ''
      }));
    }

    // Revalidate confirm account number when account number changes
    if (confirmAccountNumber && !validateConfirmAccount(confirmAccountNumber, formattedText)) {
      setErrors(prev => ({
        ...(prev || {}),
        confirmAccountNumber: 'Account numbers do not match'
      }));
    } else if (confirmAccountNumber && validateConfirmAccount(confirmAccountNumber, formattedText)) {
      setErrors(prev => ({
        ...(prev || {}),
        confirmAccountNumber: ''
      }));
    }
  };

  const handleConfirmAccountNumberChange = (text) => {
    const formattedText = text.replace(/[^0-9]/g, '');
    setConfirmAccountNumber(formattedText);

    // Real-time validation feedback
    if (formattedText && !validateConfirmAccount(formattedText, accountNumber) && formattedText.length >= accountNumber.length) {
      setErrors(prev => ({
        ...(prev || {}),
        confirmAccountNumber: 'Account numbers do not match'
      }));
    } else if (formattedText && validateConfirmAccount(formattedText, accountNumber)) {
      setErrors(prev => ({
        ...(prev || {}),
        confirmAccountNumber: ''
      }));
    }
  };

  const handleAccountTypeChange = (selectedType) => {
    setAccountType(selectedType);

    // Clear account type error when valid type is selected
    if (selectedType && validateAccountType(selectedType)) {
      setErrors(prev => ({
        ...(prev || {}),
        accountType: ''
      }));
    }
  };

  const isFormValid = () => {
    const isIfscValid = validateIfscCode(ifscCode);
    const isAccountNumberValid = validateAccountNumber(accountNumber);
    const isConfirmAccountValid = validateConfirmAccount(confirmAccountNumber, accountNumber);
    // const isNameValid = validateAccountName(nameAsOnBank);
    const isAccountTypeValid = validateAccountType(accountType);

    return isIfscValid && isAccountNumberValid && isConfirmAccountValid && isAccountTypeValid;
  };

  const handleBankValidation = async () => {
    // Clear previous errors
    setErrors({});

    // Validate all fields
    const newErrors = {};

    if (!ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!validateIfscCode(ifscCode)) {
      newErrors.ifscCode = 'Please enter a valid IFSC code (e.g., ICIC0001234)';
    }

    if (!accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!validateAccountNumber(accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits long';
    }

    if (!confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Please confirm your account number';
    } else if (!validateConfirmAccount(confirmAccountNumber, accountNumber)) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!accountType) {
      newErrors.accountType = 'Please select an account type';
    } else if (!validateAccountType(accountType)) {
      newErrors.accountType = 'Please select a valid account type';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please fill all fields with valid information');
      return;
    }

    if (isLoading) return; // Prevent multiple submissions

    setIsLoading(true);
    const payload = {
      ifscCode,
      accountNumber,
      accountType
    }
    console.log("Bank Details PAYLOAD::", payload, pinVerify);

    try {
      const response = await fetch(`${baseUrl}/api/v1/first/registration/add/bank-validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "registration-id": pinVerify
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Bank Validation DATA:::", data);

      if (response.ok && data.success !== false) {
        // Clear form data on success
        setIfscCode('');
        setAccountNumber('');
        setConfirmAccountNumber('');
        // setNameAsOnBank('');
        setAccountType('');
        setErrors({});

        // Show success message
        Alert.alert('Success', 'Bank details validated successfully!', [
          {
            text: 'OK',
            // onPress: () => setStatus("Home")
            onPress: () => navigation.navigate("Home")
          }
        ]);
      } else {
        // Handle API errors
        const errorMessage = data.message || data.error || 'Bank validation failed';

        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        } else {
          setErrors({ general: errorMessage });
        }

        Alert.alert('Validation Failed', errorMessage);

        // If validation failed due to server issues, go back to previous step
        if (setStatus) {
          setStatus("panVerify"); // or whatever the previous step is
        }
      }
    } catch (error) {
      console.error('Bank Validation Error:', error);
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
              <Text style={styles.logoText}>Jyoti MF</Text>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Bank Details</Text>
              <Text style={styles.subtitleText}>Enter your bank account details for verification</Text>
            </View>

            <View style={styles.formContainer}>


              <View style={styles.inputContainer}>
                <Text style={styles.label}>ACCOUNT NUMBER *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.accountNumber && styles.inputError
                  ]}
                  placeholder="Enter your account number"
                  value={accountNumber}
                  onChangeText={handleAccountNumberChange}
                  keyboardType="numeric"
                  maxLength={18}
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
                {safeErrors.accountNumber ? <Text style={styles.errorText}>{safeErrors.accountNumber}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>CONFIRM ACCOUNT NUMBER *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.confirmAccountNumber && styles.inputError
                  ]}
                  placeholder="Re-enter your account number"
                  value={confirmAccountNumber}
                  onChangeText={handleConfirmAccountNumberChange}
                  keyboardType="numeric"
                  maxLength={18}
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
                {safeErrors.confirmAccountNumber ? <Text style={styles.errorText}>{safeErrors.confirmAccountNumber}</Text> : null}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>IFSC CODE *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.ifscCode && styles.inputError
                  ]}
                  placeholder="e.g., ICIC0001234"
                  value={ifscCode}
                  onChangeText={handleIfscChange}
                  maxLength={11}
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {safeErrors.ifscCode ? <Text style={styles.errorText}>{safeErrors.ifscCode}</Text> : null}
              </View>
              {/* <View style={styles.inputContainer}>
                <Text style={styles.label}>BANK NAME *</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.nameAsOnBank && styles.inputError
                  ]}
                  placeholder="Enter name as per bank account"
                  value={nameAsOnBank}
                  onChangeText={handleNameChange}
                  maxLength={50}
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {safeErrors.nameAsOnBank ? <Text style={styles.errorText}>{safeErrors.nameAsOnBank}</Text> : null}
              </View> */}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>ACCOUNT TYPE *</Text>
                <View style={styles.accountTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.accountTypeOption,
                      accountType === 'SAVING' && styles.accountTypeOptionSelected
                    ]}
                    onPress={() => handleAccountTypeChange('SAVING')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.accountTypeOptionText,
                      accountType === 'SAVING' && styles.accountTypeOptionTextSelected
                    ]}>SAVINGS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.accountTypeOption,
                      accountType === 'CURRENT' && styles.accountTypeOptionSelected
                    ]}
                    onPress={() => handleAccountTypeChange('CURRENT')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.accountTypeOptionText,
                      accountType === 'CURRENT' && styles.accountTypeOptionTextSelected
                    ]}>CURRENT</Text>
                  </TouchableOpacity>
                </View>
                {safeErrors.accountType ? <Text style={styles.errorText}>{safeErrors.accountType}</Text> : null}
              </View>

              {safeErrors.general && (
                <Text style={styles.generalErrorText}>{safeErrors.general}</Text>
              )}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                🏦 Make sure your bank details match exactly with your bank account information
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Rbutton
              title="VALIDATE BANK DETAILS"
              loading={isLoading}
              onPress={handleBankValidation}
              disabled={!isFormValid() || isLoading}
              style={[
                (!isFormValid() || isLoading)
              ]}
              textStyle={[
                  (!isFormValid() || isLoading)
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BankDetails;

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
    marginBottom: heightToDp(1),
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
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(0.5),
  },
  accountTypeOption: {
    flex: 1,
    paddingVertical: heightToDp(1.2),
    paddingHorizontal: widthToDp(3),
    borderWidth: 2,
    borderColor: Config.Colors.primary,
    borderRadius: widthToDp(2),
    marginHorizontal: widthToDp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountTypeOptionSelected: {
    backgroundColor: Config.Colors.primary,
    borderColor: Config.Colors.primary,
  },
  accountTypeOptionText: {
    textAlign: 'center',
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#333',
  },
  accountTypeOptionTextSelected: {
    color: 'white',
  },
});