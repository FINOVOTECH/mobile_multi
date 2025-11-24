import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  BackHandler,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import CustomSlider from '../../components/CustomSlider';
import { useNavigation } from '@react-navigation/native';
import * as Config from '../../helpers/Config';
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import SInfoSvg from '../svgs';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../assets/Icons/vector.png';

const SIPCalculator = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [rateOfReturn, setRateOfReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [totalAmount, setTotalAmount] = useState(null);
  const [investedAmount, setInvestedAmount] = useState(null);
  const [estimatedReturns, setEstimatedReturns] = useState(null);
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

  const calculateSIP = () => {
    const p = parseFloat(monthlyAmount);
    const r = parseFloat(rateOfReturn) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (p && r >= 0 && n > 0) {
      const futureValue = p * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
      const totalInvested = p * n;
      const returns = futureValue - totalInvested;
      
      setTotalAmount(futureValue.toFixed(0));
      setInvestedAmount(totalInvested.toFixed(0));
      setEstimatedReturns(returns.toFixed(0));
    } else {
      setTotalAmount('0');
      setInvestedAmount('0');
      setEstimatedReturns('0');
    }
  };

  useEffect(() => {
    calculateSIP();
  }, [monthlyAmount, rateOfReturn, years]);

  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount).toLocaleString('en-IN');
  };

  const Header = () => (
    <LinearGradient
      colors={['#2B8DF6', '#2B8DF6']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Image
        source={bgVector}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        resizeMode="cover"
      />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>SIP Calculator</Text>
          <Text style={styles.headerSubtitle}>Plan your investments wisely</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const InputCard = ({ title, value, onChange, min, max, step, unit, formatValue }) => (
    <View style={styles.inputCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.valueDisplay}>
          <Text style={styles.unit}>{unit}</Text>
          <TextInput
            style={styles.valueInput}
            keyboardType="numeric"
            value={formatValue ? formatValue(value) : String(value)}
            onChangeText={onChange}
            editable={true}
          />
        </View>
      </View>
      
      <CustomSlider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        style={styles.slider}
        minimumTrackTintColor="#2B8DF6"
        maximumTrackTintColor="#E6F3FF"
        thumbTintColor="#2B8DF6"
      />
      
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{formatValue ? formatValue(min) : min}</Text>
        <Text style={styles.rangeLabel}>{formatValue ? formatValue(max) : max}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
      
      <Header />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Results Card */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Estimated Value</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
          
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Invested Amount</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(investedAmount)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Est. Returns</Text>
              <Text style={[styles.breakdownValue, styles.returnsValue]}>
                {formatCurrency(estimatedReturns)}
              </Text>
            </View>
          </View>
        </View>

        {/* Input Cards */}
        <InputCard
          title="Monthly Investment"
          value={monthlyAmount}
          onChange={(value) => setMonthlyAmount(Number(value) || 0)}
          min={1000}
          max={100000}
          step={1000}
          unit="₹"
          formatValue={(val) => val.toLocaleString('en-IN')}
        />

        <InputCard
          title="Expected Return Rate (p.a)"
          value={rateOfReturn}
          onChange={(value) => setRateOfReturn(Number(value) || 0)}
          min={1}
          max={30}
          step={0.1}
          unit="%"
          formatValue={(val) => val.toFixed(1)}
        />

        <InputCard
          title="Investment Duration"
          value={years}
          onChange={(value) => setYears(Number(value) || 0)}
          min={1}
          max={30}
          step={1}
          unit="Yrs"
        />

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How SIP Calculator Works</Text>
          <Text style={styles.infoText}>
            • Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly{'\n'}
            • Returns are calculated based on compound interest{'\n'}
            • Longer duration typically yields higher returns due to compounding{'\n'}
            • Actual returns may vary based on market conditions
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#2B8DF6',
  },

  // Header Styles
  headerGradient: {
    backgroundColor: '#2B8DF6',
    paddingBottom: heightToDp(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(1),
  },
  backButton: {
    marginRight: widthToDp(3),
    padding: widthToDp(1.5),
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: widthToDp(2),
  },
  headerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: widthToDp(3.5),
    color: '#E6F3FF',
    marginTop: heightToDp(0.5),
  },

  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  scrollContent: {
    paddingTop: heightToDp(2),
    paddingHorizontal: widthToDp(4),
    paddingBottom: heightToDp(2),
  },

  // Results Card
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginBottom: heightToDp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: widthToDp(4),
    color: '#666',
    fontWeight: '500',
    marginBottom: heightToDp(1),
  },
  totalAmount: {
    fontSize: widthToDp(8),
    fontWeight: 'bold',
    color: '#2B8DF6',
    marginBottom: heightToDp(2),
  },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontSize: widthToDp(3.2),
    color: '#666',
    marginBottom: heightToDp(0.5),
  },
  breakdownValue: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333',
  },
  returnsValue: {
    color: '#4CAF50',
  },

  // Input Cards
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginBottom: heightToDp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightToDp(2),
  },
  cardTitle: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: widthToDp(2),
    paddingHorizontal: widthToDp(3),
    paddingVertical: heightToDp(1),
    minWidth: widthToDp(25),
  },
  unit: {
    fontSize: widthToDp(3.5),
    color: '#2B8DF6',
    fontWeight: '600',
    marginRight: widthToDp(1),
  },
  valueInput: {
    fontSize: widthToDp(4),
    color: '#2B8DF6',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  slider: {
    height: heightToDp(4),
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(1),
  },
  rangeLabel: {
    fontSize: widthToDp(3.2),
    color: '#666',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginTop: heightToDp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(1.5),
  },
  infoText: {
    fontSize: widthToDp(3.5),
    color: '#666',
    lineHeight: heightToDp(3),
  },

  bottomPadding: {
    height: heightToDp(2),
  },
});

export default SIPCalculator;