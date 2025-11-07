import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';

export const OTPInput = ({ otp, onOtpChange, onKeyPress, otpInputRefs, errorMessage }) => {
  return (
    <View style={styles.otpContainer}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={ref => (otpInputRefs.current[index] = ref)}
          style={[
            styles.otpInput,
            digit && styles.otpInputFilled,
            errorMessage && !digit && styles.otpInputError
          ]}
          value={digit}
          onChangeText={value => onOtpChange(value, index)}
          onKeyPress={e => onKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          returnKeyType="done"
          selectTextOnFocus={true}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(3),
    paddingHorizontal: widthToDp(8),
  },
  otpInput: {
    width: widthToDp(14),
    height: widthToDp(14),
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: widthToDp(3),
    fontSize: widthToDp(6),
    fontWeight: 'bold',
    color: '#2C3E50',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#4A90E2',
    borderWidth: 2,
  },
  otpInputError: {
    borderColor: '#E74C3C',
  },
});
