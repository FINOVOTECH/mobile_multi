import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';

export const LoginTabs = ({ loginMethod, onMethodChange }) => {
  const tabs = [
    { key: 'email', label: 'Email' },
    { key: 'client', label: 'Client code' },
    { key: 'phone', label: 'Phone no.' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, loginMethod === tab.key && styles.activeTab]}
          onPress={() => onMethodChange(tab.key)}
        >
          <Text style={[styles.tabText, loginMethod === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: widthToDp(8),
    padding: widthToDp(1),
    marginBottom: heightToDp(3),
  },
  tab: {
    flex: 1,
    paddingVertical: heightToDp(1.5),
    alignItems: 'center',
    borderRadius: widthToDp(7),
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: widthToDp(3.2),
    color: '#95A5A6',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2C3E50',
    fontWeight: '600',
  },
});