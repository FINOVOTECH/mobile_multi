import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Slider from "@react-native-community/slider";
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import * as Config from "../../helpers/Config";

const EMICalculator = () => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(8);
  const [time, setTime] = useState(10);
  const [emi, setEmi] = useState(null);

  useEffect(() => {
    calculateEMI();
  }, [principal, rate, time]);

  const calculateEMI = () => {
    const P = parseFloat(principal);
    const R = parseFloat(rate) / 12 / 100;
    const N = parseFloat(time) * 12;

    if (!P || !R || !N) {
      setEmi(null);
      return;
    }

    const emiValue = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    setEmi(emiValue.toFixed(2));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Principal Amount */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Principal Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(principal)}
                onChangeText={(text) => {
                  const val = parseFloat(text.replace(/[^0-9.]/g, ""));
                  setPrincipal(val || 0);
                }}
                returnKeyType="done"
              />
            </View>
          </View>
          <Slider
            value={principal}
            minimumValue={10000}
            maximumValue={1000000}
            step={1000}
            onValueChange={setPrincipal}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Annual Interest Rate */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Annual Interest Rate</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>%</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(rate.toFixed(1))}
                onChangeText={(text) => {
                  const val = parseFloat(text.replace(/[^0-9.]/g, ""));
                  setRate(val || 0);
                }}
                returnKeyType="done"
              />
            </View>
          </View>
          <Slider
            value={rate}
            minimumValue={1}
            maximumValue={20}
            step={0.5}
            onValueChange={setRate}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Loan Duration */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Loan Duration (Years)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>Yr</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(time)}
                onChangeText={(text) => {
                  const val = parseFloat(text.replace(/[^0-9]/g, ""));
                  setTime(val || 0);
                }}
                returnKeyType="done"
              />
            </View>
          </View>
          <Slider
            value={time}
            minimumValue={1}
            maximumValue={30}
            step={1}
            onValueChange={setTime}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Result */}
        {emi && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>EMI: ₹{emi} per month</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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

export default EMICalculator;