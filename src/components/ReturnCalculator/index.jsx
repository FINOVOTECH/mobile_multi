import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CustomSlider from '../../components/CustomSlider'; // Import your custom slider
import SInfoSvg from '../../presentation/svgs';
import * as Config from '../../helpers/Config';

// Responsive utility functions
const { width, height } = Dimensions.get('window');
let currentWidth = width;
let currentHeight = height;

const widthToDp = number => {
  let givenWidth = typeof number === 'number' ? number : parseFloat(number);
  return PixelRatio.roundToNearestPixel((currentWidth * givenWidth) / 100);
};

const heightToDp = number => {
  let givenHeight = typeof number === 'number' ? number : parseFloat(number);
  return PixelRatio.roundToNearestPixel((currentHeight * givenHeight) / 100);
};

const ReturnCalculator = ({ cagrData }) => {
  const [principal, setPrincipal] = useState(1000);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [percentage, setPercentage] = useState(cagrData?.nav6m);
  const [showCalc, setShowCalc] = useState(true);
  const [totalReturn, setTotalReturn] = useState('0.00');

  useEffect(() => {
    handlePercentageSelection('6m');
  }, [cagrData]);

  // Real-time calculation effect - removed debounce for instant updates
  useEffect(() => {
    calculateReturn();
  }, [principal, percentage]);

  // Calculate initial value on component mount
  useEffect(() => {
    calculateReturn();
  }, []);

  const calculateReturn = () => {
    const numericPercentage = parseFloat(percentage?.replace('%', '') || '0');
    if (isNaN(principal) || isNaN(numericPercentage)) {
      setTotalReturn('0.00');
      return;
    }
    const percentageReturn = (principal * numericPercentage) / 100;
    const total = (percentageReturn + principal).toFixed(2);
    setTotalReturn(total);
  };

  const handlePercentageSelection = period => {
    setSelectedPeriod(period);
    switch (period) {
      case '6m':
        setPercentage(cagrData?.nav6m);
        break;
      case '1y':
        setPercentage(cagrData?.nav1y);
        break;
      case '3y':
        setPercentage(cagrData?.nav3y);
        break;
      default:
        setPercentage(cagrData?.nav6m);
    }
  };

  // Remove debouncing for real-time calculation
  const handleSliderChange = value => {
    setPrincipal(Array.isArray(value) ? value[0] : value);
  };

  const getPeriodDisplay = period => {
    switch (period) {
      case '6m':
        return '6 Months';
      case '1y':
        return '1 Year';
      case '3y':
        return '3 Years';
      default:
        return '6 Months';
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerContainer,
          !showCalc && {
            borderBottomWidth: 1,
            borderColor: Config.Colors.gray,
          },
        ]}
      >
        <Text style={styles.header}>Return Calculator</Text>
        <TouchableOpacity
          onPress={() => setShowCalc(!showCalc)}
          style={styles.toggleButton}
        >
          {/* <Icon
            name={`arrow-${showCalc ? "up" : "down"}-circle`}
            size={widthToDp(6)}
            color="skyblue"
          /> */}
          {/* {showCalc ?
          <SInfoSvg.UpChevron width={24} height={25} />
          :
          <SInfoSvg.DownArrow width={30} height={30} />
          } */}
        </TouchableOpacity>
      </View>
      {showCalc && (
        <>
          <Text style={styles.label}>
            <Text style={styles.principalAmount}>
              ₹{principal.toLocaleString()}
            </Text>{' '}
            one-time
          </Text>
          <CustomSlider
            value={principal}
            minimumValue={1000}
            maximumValue={1000000}
            step={1000}
            onValueChange={handleSliderChange}
            style={styles.slider}
            thumbStyle={styles.thumbStyle}
            trackStyle={styles.trackStyle}
            minimumTrackTintColor="#1768BF"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor={Config.Colors.primary || '#00B386'}
          />
          <View style={styles.yearSelectionContainer}>
            <Text style={styles.label}>Over the past</Text>
            <View style={styles.cagrButtonContainer}>
              {['6m', '1y', '3y'].map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.cagrButton,
                    selectedPeriod === period && styles.selectedCagrButton,
                  ]}
                  onPress={() => handlePercentageSelection(period)}
                >
                  <Text
                    style={[
                      styles.cagrButtonText,
                      selectedPeriod === period &&
                        styles.selectedCagrButtonText,
                    ]}
                  >
                    {getPeriodDisplay(period)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.separator} />

          <Text style={styles.investmentText}>
            Total investment of ₹ {principal.toLocaleString()}
          </Text>
          <Text style={styles.result}>
            Would have become ₹ {totalReturn}{' '}
            <Text style={styles.percentageText}> ({percentage || '0'}%)</Text>
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: widthToDp(2.5),
    // borderColor:"green",
    // borderWidth:1
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  header: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    color: '#333',
    width: '40%',
  },
  toggleButton: {
    padding: widthToDp(1.2),
  },
  label: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    marginVertical: heightToDp(0.6),
    color: '#555',
  },
  principalAmount: {
    fontWeight: 'bold',
    color: '#00B386',
    fontSize: widthToDp(5),
  },
  slider: {
    marginVertical: heightToDp(1.8),
    height: 40,
  },
  thumbStyle: {
    backgroundColor: Config.Colors.primary || '#00B386',
    width: 24,
    height: 24,
    borderRadius: 12,
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
    height: 8,
    borderRadius: 4,
  },
  yearSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cagrButtonContainer: {
    flexDirection: 'row',
    marginVertical: heightToDp(0.4),
    gap: widthToDp(2.5),
  },
  cagrButton: {
    backgroundColor: '#ddd',
    paddingVertical: heightToDp(0.6),
    paddingHorizontal: widthToDp(2.5),
    borderRadius: widthToDp(2),
  },
  selectedCagrButton: {
    backgroundColor: '#EBF9F5',
  },
  cagrButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: widthToDp(3.5),
  },
  selectedCagrButtonText: {
    color: '#00B386',
  },
  separator: {
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    marginVertical: heightToDp(1.2),
  },
  investmentText: {
    fontSize: widthToDp(4),
    color: 'gray',
  },
  result: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    color: 'black',
    marginVertical: heightToDp(1.2),
  },
  percentageText: {
    color: 'green',
    fontSize: widthToDp(4),
  },
});

export default ReturnCalculator;