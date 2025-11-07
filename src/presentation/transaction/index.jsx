import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from "../../helpers/Config"

const Invest = ({ navigation }) => {
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text) => {
    setCustomAmount(text);
    setSelectedAmount(0);
  };

  const getCurrentAmount = () => {
    return customAmount ? parseInt(customAmount) || 0 : selectedAmount;
  };

  const NumberPadButton = ({ number, onPress }) => (
    <TouchableOpacity style={styles.numberButton} onPress={() => onPress(number)}>
      <Text style={styles.numberButtonText}>{number}</Text>
    </TouchableOpacity>
  );

  const handleNumberPress = (number) => {
    if (number === '×') {
      setCustomAmount(prev => prev.slice(0, -1));
    } else if (number === '•') {
      return; // Dot functionality can be added if needed
    } else {
      setCustomAmount(prev => prev + number);
    }
    setSelectedAmount(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>SIP</Text>
          <Text style={styles.headerSubtitle}>Nippon India Silver ETF FoF Direct Growth</Text>
        </View>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Instalment amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <Text style={styles.amountValue}>
            {getCurrentAmount() || 0}
          </Text>
        </View>
      </View>

      {/* Quick Amount Buttons */}
      <View style={styles.quickAmountContainer}>
        <TouchableOpacity
          style={[
            styles.quickAmountButton,
            selectedAmount === 1000 && styles.selectedAmountButton
          ]}
          onPress={() => handleAmountSelect(1000)}
        >
          <Text style={styles.quickAmountText}>+ ₹1,000</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.quickAmountButton,
            selectedAmount === 2000 && styles.selectedAmountButton
          ]}
          onPress={() => handleAmountSelect(2000)}
        >
          <Text style={styles.quickAmountText}>+ ₹2,000</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.quickAmountButton,
            selectedAmount === 5000 && styles.selectedAmountButton
          ]}
          onPress={() => handleAmountSelect(5000)}
        >
          <Text style={styles.quickAmountText}>+ ₹5,000</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Schedule */}
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleButton}>
          <Text style={styles.scheduleIcon}>📅</Text>
          <Text style={styles.scheduleText}>Monthly on 15th</Text>
          <Text style={styles.scheduleArrow}>⌄</Text>
        </View>
      </View>

      {/* Bank Details */}
      <View style={styles.bankContainer}>
        <View style={styles.bankInfo}>
          <View style={styles.bankLogo}>
            <Text style={styles.bankLogoText}>∞</Text>
          </View>
          <View style={styles.bankDetails}>
            <Text style={styles.bankName}>Kotak Mahindra Bank Limited</Text>
            <Text style={styles.bankAccount}>****5483 UPI</Text>
            <Text style={styles.bankNote}>Fastest mode of payment</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.bankArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        <View style={styles.numberRow}>
          <NumberPadButton number="1" onPress={handleNumberPress} />
          <NumberPadButton number="2" onPress={handleNumberPress} />
          <NumberPadButton number="3" onPress={handleNumberPress} />
        </View>
        <View style={styles.numberRow}>
          <NumberPadButton number="4" onPress={handleNumberPress} />
          <NumberPadButton number="5" onPress={handleNumberPress} />
          <NumberPadButton number="6" onPress={handleNumberPress} />
        </View>
        <View style={styles.numberRow}>
          <NumberPadButton number="7" onPress={handleNumberPress} />
          <NumberPadButton number="8" onPress={handleNumberPress} />
          <NumberPadButton number="9" onPress={handleNumberPress} />
        </View>
        <View style={styles.numberRow}>
          <NumberPadButton number="•" onPress={handleNumberPress} />
          <NumberPadButton number="0" onPress={handleNumberPress} />
          <TouchableOpacity style={styles.numberButton} onPress={() => handleNumberPress('×')}>
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartText}>Add to cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startSipButton}>
          <Text style={styles.startSipText}>Start SIP</Text>
        </TouchableOpacity>
      </View>
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
    // backgroundColor: Config.Colors.cyan_blue,
    backgroundColor: "transparent",
    // backgroundColor: "black",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthToDp(4),
    // paddingTop: heightToDp(2),
    paddingBottom: heightToDp(1),
    borderWidth: 2,
    borderColor: "green"
  },
  backButton: {
    marginRight: widthToDp(3),
  },
  backArrow: {
    fontSize: widthToDp(6),
    color: '#333333',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: widthToDp(5),
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: widthToDp(3.5),
    color: '#666666',
    marginTop: heightToDp(0.5),
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: heightToDp(1),
    borderColor: "black",
    borderWidth: 1
  },
  amountLabel: {
    fontSize: widthToDp(3),
    color: '#999999',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rupeeSymbol: {
    fontSize: widthToDp(10),
    color: '#333333',
    fontWeight: '300',
  },
  amountValue: {
    fontSize: widthToDp(10),
    color: '#333333',
    fontWeight: '300',
    marginLeft: widthToDp(2),
  },
  quickAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: widthToDp(4),
    marginBottom: heightToDp(4),
    borderColor: "red",
    borderWidth: 1
  },
  quickAmountButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: widthToDp(6),
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
  },
  selectedAmountButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#007AFF',
  },
  quickAmountText: {
    fontSize: widthToDp(4),
    color: '#333333',
  },
  scheduleContainer: {
    alignItems: 'center',
    marginBottom: heightToDp(4),
    borderWidth: 1,
    borderColor: "red"
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: widthToDp(6),
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
  },
  scheduleIcon: {
    fontSize: widthToDp(4),
    marginRight: widthToDp(2),
  },
  scheduleText: {
    fontSize: widthToDp(4),
    color: '#333333',
    marginRight: widthToDp(2),
  },
  scheduleArrow: {
    fontSize: widthToDp(4),
    color: '#666666',
  },
  bankContainer: {
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(4),
    borderWidth: 1,
    borderColor: "green"
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightToDp(2),
  },
  bankLogo: {
    width: widthToDp(12),
    height: widthToDp(12),
    borderRadius: widthToDp(6),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthToDp(4),
  },
  bankLogoText: {
    color: '#ffffff',
    fontSize: widthToDp(5),
    fontWeight: 'bold',
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: heightToDp(0.5),
  },
  bankAccount: {
    fontSize: widthToDp(3.5),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  bankNote: {
    fontSize: widthToDp(3),
    color: '#999999',
  },
  bankArrow: {
    fontSize: widthToDp(6),
    color: '#666666',
  },
  numberPad: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: widthToDp(8),
    borderWidth: 1,
    borderColor: "black"
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: heightToDp(1),
  },
  numberButton: {
    width: widthToDp(10),
    height: widthToDp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "black"
  },
  numberButtonText: {
    fontSize: widthToDp(6),
    color: '#333333',
    fontWeight: '400',
  },
  deleteButtonText: {
    fontSize: widthToDp(6),
    color: '#333333',
    fontWeight: '400',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    paddingBottom: heightToDp(3),
  },
  addToCartButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00C896',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2),
    alignItems: 'center',
    marginRight: widthToDp(2),
  },
  addToCartText: {
    fontSize: widthToDp(4),
    color: '#00C896',
    fontWeight: '500',
  },
  startSipButton: {
    flex: 1,
    backgroundColor: '#00C896',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2),
    alignItems: 'center',
    marginLeft: widthToDp(2),
  },
  startSipText: {
    fontSize: widthToDp(4),
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default Invest;