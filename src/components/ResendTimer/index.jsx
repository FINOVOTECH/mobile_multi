import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';

export const ResendTimer = ({ canResend, resendTimer, onResend }) => {
  return (
    <View style={styles.resendContainer}>
      <Text style={styles.resendText}>Didn't receive code?</Text>
      {canResend ? (
        <TouchableOpacity onPress={onResend}>
          <Text style={styles.resendLink}> Resend OTP</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.resendLink, styles.resendDisabled]}>
          {' '}Resend in {resendTimer}s
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: heightToDp(3),
  },
  resendText: {
    fontSize: widthToDp(3.5),
    color: '#7F8C8D',
  },
  resendLink: {
    fontSize: widthToDp(3.5),
    color: '#4A90E2',
    fontWeight: '500',
  },
  resendDisabled: {
    color: '#BDC3C7',
  },
});