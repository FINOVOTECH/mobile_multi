import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Button, Text } from "react-native-paper";
import * as Config from "../../helpers/Config";
import Slider from "@react-native-community/slider";
import { heightToDp, widthToDp } from "../../helpers/Responsive";

const MarriageCalculator = () => {
  const [currentAge, setCurrentAge] = useState(25);
  const [marriageAge, setMarriageAge] = useState(30);
  const [monthlySavings, setMonthlySavings] = useState(5000);
  const [expectedCost, setExpectedCost] = useState(100000);
  const [totalSavings, setTotalSavings] = useState(null);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    calculateSavings();
  }, [currentAge, marriageAge, monthlySavings, expectedCost]);

  const handleSliderChange = (setter, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setter(value);
    }, 100);
  };

  const calculateSavings = () => {
    const ageDiff = parseInt(marriageAge) - parseInt(currentAge);
    const months = ageDiff * 12;
    const savings = parseFloat(monthlySavings) * months;
    setTotalSavings(savings.toFixed(2));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Age */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Current Age</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>Yr</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(currentAge)}
                onChangeText={(text) => setCurrentAge(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={currentAge}
            minimumValue={18}
            maximumValue={60}
            step={1}
            onValueChange={(value) => handleSliderChange(setCurrentAge, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Expected Marriage Age */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Expected Marriage Age</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>Yr</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(marriageAge)}
                onChangeText={(text) => setMarriageAge(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={marriageAge}
            minimumValue={20}
            maximumValue={40}
            step={1}
            onValueChange={(value) => handleSliderChange(setMarriageAge, value)}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Monthly Savings */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Monthly Savings</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(monthlySavings)}
                onChangeText={(text) => setMonthlySavings(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={monthlySavings}
            minimumValue={1000}
            maximumValue={50000}
            step={500}
            onValueChange={(value) =>
              handleSliderChange(setMonthlySavings, value)
            }
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Expected Marriage Cost */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Expected Marriage Cost</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(expectedCost)}
                onChangeText={(text) => setExpectedCost(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={expectedCost}
            minimumValue={50000}
            maximumValue={1000000}
            step={50000}
            onValueChange={(value) =>
              handleSliderChange(setExpectedCost, value)
            }
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor={Config.Colors.primary}
            maximumTrackTintColor="#d3d3d3"
          />
        </View>

        {/* Result */}
        {totalSavings && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>Total Savings: ₹{totalSavings}</Text>
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

export default MarriageCalculator;