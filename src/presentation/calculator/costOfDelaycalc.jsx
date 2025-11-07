import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { Button, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Slider from "@react-native-community/slider";
// import { useRouter } from "expo-router";
import { widthToDp, heightToDp } from "../../helpers/Responsive"; // adjust path if needed
import * as Config from "../../helpers/Config"

const CostOfDelayCalculator = () => {
  const [sipAmount, setSipAmount] = useState(1000);
  const [years, setYears] = useState(5);
  const [rateOfReturn, setRateOfReturn] = useState(12);
  const [delayInMonths, setDelayInMonths] = useState(12);
  const [costOfDelay, setCostOfDelay] = useState(null);
  const debounceTimeout = useRef(null);

  useEffect(()=>{
calculateCostOfDelay()
  },[sipAmount,years,rateOfReturn,delayInMonths])

  const handleSliderChange = (setter, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setter(value);
    }, 100);
  };

  const calculateCostOfDelay = () => {
    const monthlyRate = rateOfReturn / 12 / 100;
    const months = years * 12;
    const delayInMonthsNum = parseInt(delayInMonths);

    const futureValue =
      sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const futureValueWithDelay =
      sipAmount *
      ((Math.pow(1 + monthlyRate, months - delayInMonthsNum) - 1) /
        monthlyRate);

    setCostOfDelay(futureValue - futureValueWithDelay);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* <TouchableOpacity
          // onPress={() => router.replace("/home")}
          style={styles.backContainer}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity> */}
        {/* <Text style={styles.heading}>Cost Of Delay SIP Calculator</Text> */}


        <View style={{  }}>
          <View style={styles.labelRow}>
            <Text style={styles.paragraph}>SIP Amount</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputPrefix} value="₹" editable={false} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(sipAmount)}
                onChangeText={(text) => setSipAmount(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={sipAmount}
            minimumValue={1000}
            maximumValue={1000000}
            step={1000}
            onValueChange={(value) => handleSliderChange(setSipAmount, value)}
            style={styles.slider}
          />
        </View>

        {/* Duration */}
        <View style={{  }}>
          <View style={styles.labelRow}>
            <Text style={styles.paragraph}>Investment Duration (Years)</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputPrefix} value="Yr" editable={false} />
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
          />
        </View>

        {/* Rate of Return */}
        <View style={{ }}>
          <View style={styles.labelRow}>
            <Text style={styles.paragraph}>Expected Return Rate (p.a)</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputPrefix} value="%" editable={false} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(rateOfReturn)}
                onChangeText={(text) => setRateOfReturn(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={rateOfReturn}
            minimumValue={1}
            maximumValue={20}
            step={0.5}
            onValueChange={(value) => handleSliderChange(setRateOfReturn, value)}
            style={styles.slider}
          />
        </View>

        {/* Delay */}
        <View style={{ }}>
          <View style={styles.labelRow}>
            <Text style={styles.paragraph}>Delay in Months</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputPrefix} value="M" editable={false} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(delayInMonths)}
                onChangeText={(text) => setDelayInMonths(Number(text))}
              />
            </View>
          </View>
          <Slider
            value={delayInMonths}
            minimumValue={1}
            maximumValue={24}
            step={1}
            onValueChange={(value) =>
              handleSliderChange(setDelayInMonths, value)
            }
            style={styles.slider}
          />
        </View>

        {/* Calculate */}
        {/* <Button
          mode="contained"
          onPress={calculateCostOfDelay}
          style={styles.button}
        >
          Calculate
        </Button> */}

        {costOfDelay !== null && (
          <View style={styles.resultContainer}>
            {/* <Icon name="chart-line" size={widthToDp(7)} color="#6200ee" /> */}
            <Text style={styles.resultText}>
              Cost of Delay: ₹{costOfDelay.toFixed(2)}
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
    backgroundColor: "white",
  },
  backContainer: {
    justifyContent: "center",
  },
  backText: {
    fontSize: widthToDp(7.5),
    fontWeight: "bold",
    color: "black",
  },
  heading: {
    fontSize: widthToDp(5.2),
    fontWeight: "600",
    color: "black",
    marginTop: heightToDp(2),
  },
  paragraph: {
    fontSize: widthToDp(4.3),
    color: "#333",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF9F5",
    borderRadius: 10,
    paddingHorizontal: widthToDp(3),
    gap: 10,
  },
  inputPrefix: {
    fontSize: widthToDp(4.5),
    color: "#00B386",
  },
  input: {
    fontSize: widthToDp(4.5),
    color: "#00B386",
  },
  slider: {
    marginVertical: heightToDp(2),
  },
  button: {
    marginTop: heightToDp(2),
    backgroundColor: "#6200ee",
  },
  resultContainer: {
    marginTop: heightToDp(3),
    alignItems: "center",
  },
  resultText: {
    fontSize: widthToDp(5),
    fontWeight: "bold",
    color: Config.Colors.primary,
    textAlign:"center"
  },
});

export default CostOfDelayCalculator;
