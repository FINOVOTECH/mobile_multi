// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   BackHandler,
//   TouchableOpacity,
// } from 'react-native';
// import { Button, Text } from 'react-native-paper';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Slider from '@react-native-community/slider';
// import { useNavigation } from '@react-navigation/native';
// import * as Config from '../../helpers/Config';
// import { heightToDp, widthToDp } from '../../helpers/Responsive';

// const SIPCalculator = () => {
//   const [monthlyAmount, setMonthlyAmount] = useState(1000);
//   const [rateOfReturn, setRateOfReturn] = useState(10);
//   const [years, setYears] = useState(5);
//   const [totalAmount, setTotalAmount] = useState(null);
//   const debounceTimeout = useRef(null);
//   const navigation = useNavigation();

//   useEffect(() => {
//     const handleBackPress = () => {
//       if (navigation.canGoBack()) {
//         navigation.goBack();
//       } else {
//         BackHandler.exitApp();
//       }
//       return true;
//     };

//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       handleBackPress,
//     );

//     return () => backHandler.remove();
//   }, [navigation]);

//   const handleSliderChange = (setter, value) => {
//     if (debounceTimeout.current) {
//       clearTimeout(debounceTimeout.current);
//     }
//     debounceTimeout.current = setTimeout(() => {
//       setter(value);
//     }, 100);
//   };

//   const calculateSIP = () => {
//     const p = parseFloat(monthlyAmount);
//     const r = parseFloat(rateOfReturn) / 100 / 12;
//     const n = parseFloat(years) * 12;
//     const futureValue = p * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
//     setTotalAmount(futureValue.toFixed(2));
//   };
//   useEffect(() => {
//     calculateSIP();
//   }, [totalAmount, monthlyAmount, rateOfReturn, years]);

//   return (
//     <View style={styles.container}>
//       <ScrollView>
//         {/* <TouchableOpacity
//           onPress={() => navigation.replace("Home")}
//           style={styles.backContainer}
//         >
//           <Text style={styles.backText}>←</Text>
//         </TouchableOpacity> */}

//         <Text style={styles.heading}>SIP Calculator</Text>

//         <View style={{ marginTop: 15 }}>
//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//             }}
//           >
//             <Text style={styles.paragraph}>Monthly Investment</Text>
//             <View style={styles.inputRow}>
//               <TextInput style={styles.inputrupee} value="₹" editable={false} />
//               <TextInput
//                 style={styles.input}
//                 keyboardType="numeric"
//                 value={String(monthlyAmount)}
//                 onChangeText={text => setMonthlyAmount(Number(text) || 0)}
//               />
//             </View>
//           </View>
//           <Slider
//             value={monthlyAmount}
//             minimumValue={1000}
//             maximumValue={50000}
//             step={1000}
//             onValueChange={value =>
//               handleSliderChange(
//                 setMonthlyAmount,
//                 Array.isArray(value) ? value[0] : value,
//               )
//             }
//             containerStyle={styles.slider}
//             thumbStyle={styles.thumbStyle}
//             trackStyle={styles.trackStyle}
//             minimumTrackTintColor="#1768BF"
//             maximumTrackTintColor="#d3d3d3"
//           />
//         </View>

//         <View style={{ marginTop: 15 }}>
//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//             }}
//           >
//             <Text style={styles.paragraph}>Expected Return Rate (p.a)</Text>
//             <View style={styles.inputRow}>
//               <TextInput style={styles.inputrupee} value="%" editable={false} />
//               <TextInput
//                 style={styles.input}
//                 keyboardType="numeric"
//                 value={String(rateOfReturn.toFixed(0))}
//                 onChangeText={text => setRateOfReturn(Number(text) || 0)}
//               />
//             </View>
//           </View>
//           <Slider
//             value={rateOfReturn}
//             minimumValue={1}
//             maximumValue={20}
//             step={0.1}
//             onValueChange={value =>
//               handleSliderChange(
//                 setRateOfReturn,
//                 Array.isArray(value) ? value[0] : value,
//               )
//             }
//             containerStyle={styles.slider}
//             thumbStyle={styles.thumbStyle}
//             trackStyle={styles.trackStyle}
//             minimumTrackTintColor="#1768BF"
//             maximumTrackTintColor="#d3d3d3"
//           />
//         </View>

//         <View style={{ marginTop: 15 }}>
//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//             }}
//           >
//             <Text style={styles.paragraph}>Investment Duration (Years)</Text>
//             <View style={styles.inputRow}>
//               <TextInput
//                 style={styles.inputrupee}
//                 value="Yr"
//                 editable={false}
//               />
//               <TextInput
//                 style={styles.input}
//                 keyboardType="numeric"
//                 value={String(years)}
//                 onChangeText={text => setYears(Number(text) || 0)}
//               />
//             </View>
//           </View>
//           <Slider
//             value={years}
//             minimumValue={1}
//             maximumValue={30}
//             step={1}
//             onValueChange={value =>
//               handleSliderChange(
//                 setYears,
//                 Array.isArray(value) ? value[0] : value,
//               )
//             }
//             containerStyle={styles.slider}
//             thumbStyle={styles.thumbStyle}
//             trackStyle={styles.trackStyle}
//             minimumTrackTintColor="#1768BF"
//             maximumTrackTintColor="#d3d3d3"
//           />
//         </View>
//         {/* 
//         <Button mode="contained" onPress={calculateSIP} style={styles.button}>
//           Calculate
//         </Button> */}

//         <View style={styles.resultContainer}>
//           <Text style={styles.resultText}>
//             Total Investment Value: ₹{totalAmount}
//           </Text>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 10,
//     backgroundColor: Config.Colors.cyan_blue,
//     margin: 10,
//     // borderWidth: 1,
//     // borderColor: Config.Colors.black,
//   },
//   backContainer: {
//     justifyContent: 'center',
//   },
//   backText: {
//     fontSize: 30,
//     fontWeight: 'bold',
//     color: 'black',
//   },
//   heading: {
//     fontSize: widthToDp(5),
//        fontWeight: '600',
//       //  marginLeft: widthToDp(2),
//        color: '#333333',
//        fontFamily: Config.fontFamilys.Poppins_SemiBold,
//     marginTop: 15,
//   },
//   paragraph: {
//     fontSize: 18,
//     color: '#333',
//   },
//   inputRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#EBF9F5',
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     gap: 10,
//   },
//   inputrupee: {
//     fontSize: 20,
//     // color: "#00B386",
//     color: Config.Colors.secondary,
//     margin: 'auto',
//   },
//   input: {
//     fontSize: 20,
//     // color: "#00B386",
//     color: Config.Colors.secondary,
//     margin: 'auto',
//   },
//   slider: {
//     marginVertical: 15,
//     height: 40,
//   },
//   thumbStyle: {
//     backgroundColor: Config.Colors.primary,
//     width: 20,
//     height: 20,
//   },
//   trackStyle: {
//     height: 4,
//     borderRadius: 2,
//   },
//   button: {
//     marginTop: 16,
//     backgroundColor: '#6200ee',
//   },
//   resultContainer: {
//     marginTop: heightToDp(2),
//     alignItems: 'center',
//   },
//   resultText: {
//     fontSize: widthToDp(4),
//     fontWeight: 'bold',
//     color: Config.Colors.primary,
//   },
// });

// export default SIPCalculator;
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomSlider from '../../components/CustomSlider';
import { useNavigation } from '@react-navigation/native';
import * as Config from '../../helpers/Config';
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import SInfoSvg from '../svgs';

const SIPCalculator = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [rateOfReturn, setRateOfReturn] = useState(10);
  const [years, setYears] = useState(5);
  const [totalAmount, setTotalAmount] = useState(null);
  const debounceTimeout = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const handleBackPress = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        BackHandler.exitApp();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Remove debouncing for real-time calculation
  const handleSliderChange = (setter, value) => {
    setter(value);
  };

  const calculateSIP = () => {
    const p = parseFloat(monthlyAmount);
    const r = parseFloat(rateOfReturn) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (p && r >= 0 && n > 0) {
      const futureValue = p * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
      setTotalAmount(futureValue.toFixed(2));
    } else {
      setTotalAmount('0.00');
    }
  };

  // Fixed useEffect - removed totalAmount from dependencies to avoid circular dependency
  useEffect(() => {
    calculateSIP();
  }, [monthlyAmount, rateOfReturn, years]);

  // Calculate initial value on component mount
  useEffect(() => {
    calculateSIP();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* <TouchableOpacity



          onPress={() => navigation.replace("Home")}
          style={styles.backContainer}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity> */}
        <View style={{  alignItems: "start", gap: 10 }}>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <SInfoSvg.Remote />
          <Text style={styles.heading}>SIP Calculator</Text>
        </View>
            <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            Total Investment Value: ₹{totalAmount || '0.00'}
          </Text>
        </View>

        </View>
        <View style={{ marginTop: 15 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={styles.paragraph}>Monthly Investment</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputrupee} value="₹" editable={false} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(monthlyAmount)}
                onChangeText={text => setMonthlyAmount(Number(text) || 0)}
              />
            </View>
          </View>
          <CustomSlider
            value={monthlyAmount}
            minimumValue={1000}
            maximumValue={50000}
            step={1000}
            onValueChange={value =>
              handleSliderChange(
                setMonthlyAmount,
                Array.isArray(value) ? value[0] : value,
              )
            }
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor="#1768BF"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor={Config.Colors.primary}
          />
        </View>

        <View style={{}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={styles.paragraph}>Expected Return Rate (p.a)</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputrupee} value="%" editable={false} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(rateOfReturn.toFixed(1))}
                onChangeText={text => setRateOfReturn(Number(text) || 0)}
              />
            </View>
          </View>
          <CustomSlider
            value={rateOfReturn}
            minimumValue={1}
            maximumValue={20}
            step={0.1}
            onValueChange={value =>
              handleSliderChange(
                setRateOfReturn,
                Array.isArray(value) ? value[0] : value,
              )
            }
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor="#1768BF"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor={Config.Colors.primary}
          />
        </View>

        <View style={{}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={styles.paragraph}>Investment Duration (Years)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputrupee}
                value="Yr"
                editable={false}
              />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(years)}
                onChangeText={text => setYears(Number(text) || 0)}
              />
            </View>
          </View>
          <CustomSlider
            value={years}
            minimumValue={1}
            maximumValue={30}
            step={1}
            onValueChange={value =>
              handleSliderChange(
                setYears,
                Array.isArray(value) ? value[0] : value,
              )
            }
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor="#1768BF"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor={Config.Colors.primary}
          />
        </View>
        {/* 
        <Button mode="contained" onPress={calculateSIP} style={styles.button}>
          Calculate
        </Button> */}

    
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: Config.Colors.cyan_blue,
    margin: 10,
    // borderWidth: 1,
    // borderColor: Config.Colors.black,
  },
  backContainer: {
    justifyContent: 'center',
  },
  backText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
  },
  heading: {
    fontSize: widthToDp(4),
    fontWeight: '700',
    //  marginLeft: widthToDp(2),
    color: '#333333',
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    // marginTop: 5,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Config.Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    gap: 5,
  },
  inputrupee: {
    fontSize: 20,
    // color: "#00B386",
    color: Config.Colors.white,
    margin: 'auto',
  },
  input: {
    fontSize: 20,
    // color: "#00B386",
    color: Config.Colors.white,
    margin: 'auto',
  },
  slider: {
    // marginVertical: 15,
    height: 40,
  },
  thumbStyle: {
    backgroundColor: Config.Colors.primary,
    width: 24, // Increased from 20 for thicker slider
    height: 24, // Increased from 20 for thicker slider
    borderRadius: 12, // Half of width/height for perfect circle
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
  },
  trackStyle: {
    height: 8, // Increased from 4 for thicker track
    borderRadius: 4, // Half of height for rounded edges
  },
  button: {
    // marginTop: 16,
    backgroundColor: '#6200ee',
  },
  resultContainer: {
    marginTop: heightToDp(2),
    alignItems: 'center',
  },
  resultText: {
    fontSize: widthToDp(5),
    fontWeight: 'bold',
    textAlign: "center",
    color: Config.Colors.primary,
  },
});

export default SIPCalculator;