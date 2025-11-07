import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Button, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Slider from "@react-native-community/slider";
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import * as Config from "../../helpers/Config";

const LumpSumCalculator = () => {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(5);
  const [time, setTime] = useState(5);
  const [futureValue, setFutureValue] = useState(null);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    calculateFutureValue();
  }, [principal, rate, time]);

  const handleSliderChange = (setter, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setter(value);
    }, 100);
  };

  const calculateFutureValue = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);

    const fv = p * Math.pow(1 + r, t);
    setFutureValue(fv.toFixed(2));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Investment Amount */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Investment Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(principal)}
                onChangeText={(text) => setPrincipal(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={principal}
            minimumValue={1000}
            maximumValue={1000000}
            step={1000}
            onValueChange={(value) => handleSliderChange(setPrincipal, value)}
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
                value={String(rate.toFixed(1))}
                onChangeText={(text) => setRate(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={rate}
            minimumValue={1}
            maximumValue={20}
            step={0.5}
            onValueChange={(value) => handleSliderChange(setRate, value)}
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
                value={String(time)}
                onChangeText={(text) => setTime(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={time}
            minimumValue={1}
            maximumValue={30}
            step={1}
            onValueChange={(value) => handleSliderChange(setTime, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Result */}
        {futureValue !== null && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              Future Value: ₹{futureValue}
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

export default LumpSumCalculator;