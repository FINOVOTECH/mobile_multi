import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';

const EducationCalculator = () => {
  const [currentCost, setCurrentCost] = useState(100000);
  const [inflationRate, setInflationRate] = useState(5);
  const [years, setYears] = useState(10);
  const [futureCost, setFutureCost] = useState(null);
  const debounceTimeout = useRef(null);

  const handleSliderChange = (setter, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setter(value);
    }, 100);
  };

  useEffect(() => {
    calculateFutureCost();
  }, [currentCost, inflationRate, years]);

  const calculateFutureCost = () => {
    const cost = parseFloat(currentCost);
    const rate = parseFloat(inflationRate) / 100;
    const time = parseFloat(years);
    const futureValue = cost * Math.pow(1 + rate, time);
    setFutureCost(futureValue.toFixed(2));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Cost of Education */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Current Cost of Education</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(currentCost)}
                onChangeText={(text) => setCurrentCost(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={currentCost}
            minimumValue={10000}
            maximumValue={1000000}
            step={1000}
            onValueChange={(value) => handleSliderChange(setCurrentCost, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Expected Inflation Rate */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Expected Inflation Rate</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>%</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inflationRate.toFixed(1))}
                onChangeText={(text) => setInflationRate(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={inflationRate}
            minimumValue={1}
            maximumValue={20}
            step={0.5}
            onValueChange={(value) => handleSliderChange(setInflationRate, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Years Until Education */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Years Until Education</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>Yr</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(years)}
                onChangeText={(text) => setYears(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={years}
            minimumValue={1}
            maximumValue={30}
            step={1}
            onValueChange={(value) => handleSliderChange(setYears, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Result */}
        {futureCost !== null && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>Future Cost: ₹{futureCost}</Text>
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

export default EducationCalculator;