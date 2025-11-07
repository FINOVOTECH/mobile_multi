import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import { OTPInput } from '../OTPInput';
import { ResendTimer } from '../ResendTimer';
import { ActionButton } from '../ActionButton';
import { ErrorMessage } from '../ErrorMessage';

export const OTPScreen = ({
  loginMethod,
  referenceId,
  otp,
  handleOtpChange,
  handleKeyPress,
  otpInputRefs,
  errorMessage,
  canResend,
  resendTimer,
  handleResendOtp,
  isLoading,
  isOtpValid,
  handleVerifyOtp,
}) => {
  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Verification Code</Text>
      <Text style={styles.subtitle}>
        We have sent OTP code verification{'\n'}to your {loginMethod === 'phone' ? 'mobile number' : loginMethod}
      </Text>

      <OTPInput
        otp={otp}
        onOtpChange={handleOtpChange}
        onKeyPress={handleKeyPress}
        otpInputRefs={otpInputRefs}
        errorMessage={errorMessage}
      />

      <ResendTimer
        canResend={canResend}
        resendTimer={resendTimer}
        onResend={handleResendOtp}
      />

      <ErrorMessage message={errorMessage} />

      <ActionButton
        title="Verify & Continue"
        onPress={handleVerifyOtp}
        disabled={!isOtpValid()}
        loading={isLoading}
      />
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
});
