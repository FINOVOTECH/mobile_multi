import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';

export const ActionButton = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false, 
  style = {} 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: heightToDp(6.5),
    backgroundColor: '#4A90E2',
    borderRadius: widthToDp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: heightToDp(3),
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: widthToDp(4.2),
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
});