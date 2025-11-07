import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import * as Config from '../../../helpers/Config';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';

const SIPCalculator = ({ navigation }) => {
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [rateOfReturn, setRateOfReturn] = useState(10);
  const [years, setYears] = useState(5);
  const [totalAmount, setTotalAmount] = useState(null);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    calculateSIP();
  }, [monthlyAmount, years, rateOfReturn]);

  const handleSliderChange = (setter, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setter(value);
    }, 100);
  };

  const calculateSIP = () => {
    const p = parseFloat(monthlyAmount);
    const r = parseFloat(rateOfReturn) / 100 / 12;
    const n = parseFloat(years) * 12;
    const futureValue = p * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    setTotalAmount(futureValue.toFixed(2));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Monthly Investment */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Monthly Investment</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(monthlyAmount)}
                onChangeText={text => setMonthlyAmount(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={monthlyAmount}
            minimumValue={1000}
            maximumValue={50000}
            step={1000}
            onValueChange={value => handleSliderChange(setMonthlyAmount, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Expected Return Rate */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Expected Return Rate (p.a)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>%</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(rateOfReturn.toFixed(1))}
                onChangeText={text => setRateOfReturn(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={rateOfReturn}
            minimumValue={1}
            maximumValue={20}
            step={0.1}
            onValueChange={value => handleSliderChange(setRateOfReturn, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Investment Duration */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Investment Duration (Years)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>Yr</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(years)}
                onChangeText={text => setYears(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={years}
            minimumValue={1}
            maximumValue={30}
            step={1}
            onValueChange={value => handleSliderChange(setYears, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Result */}
        {totalAmount !== null && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              Total Investment Value: ₹{totalAmount}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: widthToDp(4),
    backgroundColor: '#fff',
  },
  inputSection: {
    marginBottom: heightToDp(3),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightToDp(1),
  },
  label: {
    fontSize: widthToDp(4.2),
    color: '#333',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Config.Colors.primary,
    borderRadius: 8,
    paddingHorizontal: widthToDp(3),
    paddingVertical: heightToDp(1),
    minWidth: widthToDp(20),
  },
  inputPrefix: {
    fontSize: widthToDp(4),
    color: Config.Colors.white,
    marginRight: widthToDp(1),
  },
  input: {
    fontSize: widthToDp(4),
    color: Config.Colors.white,
    textAlign: 'center',
    minWidth: widthToDp(12),
  },
  slider: {
    height: 40,
    marginTop: heightToDp(1),
  },
  thumbStyle: {
    backgroundColor: Config.Colors.primary,
    width: 20,
    height: 20,
  },
  trackStyle: {
    height: 4,
    borderRadius: 2,
  },
  resultContainer: {
    marginTop: heightToDp(2),
    padding: widthToDp(4),
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    fontSize: widthToDp(4.5),
    fontWeight: 'normal', // Changed from 'bold' to 'normal' as requested
    color: Config.Colors.primary,
    textAlign: 'center',
  },
});
export default SIPCalculator;
