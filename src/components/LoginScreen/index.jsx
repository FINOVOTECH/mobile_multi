import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import { LoginTabs } from '../LoginTabs';
import { LoginInput } from '../LoginInput';
import { ActionButton } from '../ActionButton';
import { ErrorMessage } from '../ErrorMessage';

export const LoginScreen = ({
  loginMethod,
  setLoginMethod,
  referenceId,
  handleInputChange,
  validationErrors,
  errorMessage,
  isLoading,
  isInputValid,
  handleSendOtp,
  navigation,
  getInputLabel,
  getPlaceholder,
}) => {
  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Login Account</Text>
      <Text style={styles.subtitle}>
        Hello, Welcome back to your account.
      </Text>

      <LoginTabs 
        loginMethod={loginMethod} 
        onMethodChange={setLoginMethod} 
      />

      <LoginInput
        label={getInputLabel()}
        placeholder={getPlaceholder()}
        value={referenceId}
        onChangeText={handleInputChange}
        error={validationErrors.referenceId}
        keyboardType={loginMethod === 'phone' ? 'phone-pad' : loginMethod === 'email' ? 'email-address' : 'default'}
        autoCapitalize={loginMethod === 'email' ? 'none' : 'characters'}
        onSubmitEditing={isInputValid() ? handleSendOtp : undefined}
      />

      <ErrorMessage message={errorMessage} />

      <ActionButton
        title="Request OTP"
        onPress={handleSendOtp}
        disabled={!isInputValid()}
        loading={isLoading}
      />

      <TouchableOpacity onPress={() => navigation?.navigate('Registration')}>
        <Text style={styles.registerText}>
          Don't have an account?
          <Text style={styles.registerLink}> Create Now</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 0.4,
    backgroundColor: Config.Colors.cyan_blue,
    borderTopLeftRadius: widthToDp(8),
    borderTopRightRadius: widthToDp(8),
    paddingHorizontal: widthToDp(6),
    paddingTop: heightToDp(4),
    paddingBottom: heightToDp(3),
    minHeight: heightToDp(50),
  },
  title: {
    fontSize: widthToDp(6),
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },
  subtitle: {
    fontSize: widthToDp(3.5),
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: heightToDp(3),
    lineHeight: heightToDp(2.5),
  },
  registerText: {
    textAlign: 'center',
    fontSize: widthToDp(3.5),
    color: '#7F8C8D',
  },
  registerLink: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});