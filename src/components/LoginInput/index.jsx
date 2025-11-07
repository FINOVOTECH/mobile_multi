import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';

export const LoginInput = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  error, 
  keyboardType = 'default',
  autoCapitalize = 'none',
  onSubmitEditing
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
      {error && <Text style={styles.fieldErrorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: heightToDp(2),
  },
  inputLabel: {
    fontSize: widthToDp(3.5),
    color: '#2C3E50',
    fontWeight: '500',
    marginBottom: heightToDp(1),
    marginLeft: widthToDp(1),
  },
  input: {
    height: heightToDp(6.5),
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: widthToDp(3),
    paddingHorizontal: widthToDp(4),
    fontSize: widthToDp(4),
    color: '#2C3E50',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: '#E74C3C',
    fontSize: widthToDp(3),
    marginTop: heightToDp(0.5),
    marginLeft: widthToDp(1),
  },
});