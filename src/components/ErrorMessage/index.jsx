import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';

export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return <Text style={styles.errorText}>{message}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    color: '#E74C3C',
    fontSize: widthToDp(3.5),
    textAlign: 'center',
    marginBottom: heightToDp(2),
    fontWeight: '500',
  },
});
