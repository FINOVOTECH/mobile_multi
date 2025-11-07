import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  BackHandler,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import { useSelector } from 'react-redux';
import SInfoSvg from '../svgs';
import { getData } from '../../helpers/localStorage';
import Rbutton from '../../components/Rbutton';
import MandateAlert from '../../components/MandateAlert';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../assets/Icons/vector.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Invest = ({ navigation }) => {
  const InvestData = useSelector(state => state.marketWatch.investment);
  const UserData = useSelector(state => state.login.loginData)
  const investmentType = useSelector(state => state.marketWatch.investType);
  console.log("invest_data---=-=-=>", InvestData, investmentType, UserData);

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [minimumAmount, setMinimumAmount] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [selectedMandate, setSelectedMandate] = useState(null);
  const [showMandateModal, setShowMandateModal] = useState(false);
  const [mandateData, setMandateData] = useState(null);
  const [showMandateAlert, setShowMandateAlert] = useState(false);
  const [mandateOptions, setMandateOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [investmentResponse, setInvestmentResponse] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    fetchingMandate();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        BackHandler.exitApp();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const fetchingMandate = async () => {
    setIsLoading(true);
    try {
      const Token = await getData(Config.store_key_login_details);
      console.log("Token", Token);
      const response = await fetch(
        `${Config.baseUrl}/api/client/registration/mandate/history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            clientcode: UserData?.user?.clientCode,
            "Authorization": Token,
          },
        },
      );

      const data = await response.json();
      console.log('Mandate history response:', data);

      if (response.ok) {
        const filteredIds = data?.mandates
          ?.filter(item => item.UMRNNo)
          .map(item => item);
        setMandateOptions(filteredIds || []);
        if (!filteredIds || filteredIds.length === 0) {
          console.log('No mandate found, showing alert');
          setMandateData(false);
          setShowMandateAlert(true);
        } else {
          console.log('Mandate found, not showing alert');
          setMandateData(true);
          setShowMandateAlert(false);
        }
      } else {
        console.error('Error fetching mandate history:', data?.message);
      }

    } catch (error) {
      console.error('Error fetching mandate history:', error);
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
  if (InvestData) {
    // ✅ If sipMinimumInstallmentAmount exists, use it directly
    if (InvestData.sipMinimumInstallmentAmount?.length > 0) {
      const minAmount = parseFloat(InvestData.sipMinimumInstallmentAmount[0]) || 0;
      setMinimumAmount(minAmount);
      setSelectedAmount(minAmount);
      setCustomAmount('');
    } else {
      // fallback if array missing
      setMinimumAmount(100);
      setSelectedAmount(100);
    }
  }
}, [InvestData]);

  const validateForm = () => {
    const newErrors = {};
    const amount = getCurrentAmount();

    if (amount === 0) {
      newErrors.amount = 'Please enter an amount';
    } else if (amount < minimumAmount) {
      newErrors.amount = `Minimum amount is ₹${minimumAmount}`;
    }
    if (
      !selectedMandate &&
      !(investmentType === 'LUMPSUM' && paymentMethod === 'UPI')
    ) {
      newErrors.mandate = 'Please select a mandate';
    }
    if (investmentType === 'SIP' && !selectedDate) {
      newErrors.date = 'Please select a start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getMinimumDateForMandate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    let minDate = new Date(now);

    if (currentHour >= 14) {
      minDate.setDate(now.getDate() + 3);
    } else {
      minDate.setDate(now.getDate() + 2);
    }
    while (minDate.getDay() === 0 || minDate.getDay() === 6) {
      minDate.setDate(minDate.getDate() + 1);
    }

    return minDate;
  };

  const getMinimumDateForSIPUPI = () => {
    const now = new Date();
    const currentHour = now.getHours();
    let minDate = new Date(now);

    if (currentHour >= 14) {
      minDate.setDate(now.getDate() + 1);
    }

    while (minDate.getDay() === 0 || minDate.getDay() === 6) {
      minDate.setDate(minDate.getDate() + 1);
    }

    return minDate;
  };

  const handleAmountSelect = amount => {
    if (amount < minimumAmount) {
      setErrors(prev => ({ ...prev, amount: `Minimum amount is ₹${minimumAmount}` }));
      return;
    }
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrors(prev => ({ ...prev, amount: '' }));
    Keyboard.dismiss();
  };

  const handleCustomAmountChange = text => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setSelectedAmount(0);
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  const getCurrentAmount = () => {
    return customAmount ? parseInt(customAmount) || 0 : selectedAmount;
  };

  const getQuickAmountButtons = () => {
    if (investmentType === 'SIP') {
      return [100, 500, 1000, 1500, 2000, 5000];
    } else {
      return [500, 1000, 2000, 5000, 8000, 10000];
    }
  };

  const handleAmountInputFocus = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const onDateChange = (event, date) => {
  if (Platform.OS === 'android') {
    setShowDatePicker(false);
  }

  if (date) {
    const selectedDay = date.getDate();

    // ✅ Restrict SIP date: disable 29, 30, 31
    if (investmentType === 'SIP' && selectedDay > 28) {
      // move to the 1st of next month
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      nextMonth.setDate(1);
      setSelectedDate(nextMonth);
    } else {
      setSelectedDate(date);
    }

    setErrors(prev => ({ ...prev, date: '' }));
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  }
};

  const getScheduleText = () => {
    if (!selectedDate) {
      return 'Select start date';
    }

    return selectedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getButtonText = () => {
    return investmentType === 'SIP' ? 'Start SIP' : 'Invest Now';
  };

  const getAmountLabel = () => {
    return investmentType === 'SIP' ? 'Instalment amount' : 'Investment amount';
  };

  const handleInvestment = async () => {
    if (!validateForm()) {
      return;
    }

    const amount = getCurrentAmount();
    let payload = {};

    if (investmentType === 'LUMPSUM') {
      payload = {
        amount: amount.toString(),
        buyType: "FRESH",
        schemaCode: InvestData?.schemeCode,
        mandateId: paymentMethod === 'MANDATE' ? selectedMandate?.mandateId : "",
        paymentMethod: paymentMethod,
      };
    } else if (investmentType === 'SIP') {
      const startDate = selectedDate.toLocaleDateString('en-GB');

      payload = {
        installmentAmount: amount.toString(),
        frequencyType: 'MONTHLY',
        noOfInstallment: 300,
        mandateId: selectedMandate?.mandateId,
        firstOrderToday: paymentMethod === 'UPI' ? true : false,
        startDate: startDate,
        schemaCode: InvestData?.schemeCode,
        buyType: "FRESH",
        paymentMethod: paymentMethod,
      };
    }

    try {
      const Token = await getData(Config.store_key_login_details);
      console.log("Token", Token);
      const endpoint = investmentType === 'SIP'
        ? '/api/v1/order/purchase/sip/entry'
        : '/api/v1/order/purchase/order/entry';

      console.log("Payload before API call:", JSON.stringify(payload), endpoint);

      const response = await fetch(`${Config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          clientcode: UserData?.user?.clientCode,
          "Authorization": Token,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Investment Response:', result);

      if (response.ok) {
        setInvestmentResponse(result);
        setShowResponseModal(true);
        setErrors({});
      } else {
        setErrors({ general: result?.message || 'Something went wrong.' });
      }
    } catch (error) {
      console.error('Investment Error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    }
  };

  const ResponseModal = () => {
    const isSuccess = investmentResponse?.status === 'SUCCESS';
    const isFailed = investmentResponse?.status === 'FAILED';

    const handleContinueToPayment = () => {
      setShowResponseModal(false);

      if (isSuccess) {
        const paymentData = {
          investmentResponse: investmentResponse,
          orderNumber: investmentResponse.resultText?.orderId || investmentResponse.resultText?.orderNumber,
          urNumber: investmentResponse.resultText?.URNumber,
          totalAmount: investmentResponse.totalAmount,
          bseRemarks: investmentResponse.resultText?.bseRemarks,
          bseResponseFlag: investmentResponse.resultText?.bseResponseFlag,
          investmentType: investmentType,
          schemeCode: InvestData?.schemeCode,
          schemeName: InvestData?.description || 'Investment Plan',
          amount: getCurrentAmount(),
          paymentMethod: paymentMethod,
          selectedMandate: selectedMandate,
          startDate: investmentType === 'SIP' ? selectedDate?.toLocaleDateString('en-GB') : null,
          frequency: investmentType === 'SIP' ? 'MONTHLY' : null,
          clientCode: UserData?.user?.clientCode,
          userName: UserData?.user?.name || UserData?.user?.clientName,
          timestamp: new Date().toISOString(),
          investmentStatus: 'CONFIRMED'
        };
        navigation.navigate("PaymentComponent", { paymentData });
      }
    };

    const handleTransactionSuccess = () => {
      setShowResponseModal(false);
      navigation.navigate("MarketWatch");
    };

    const handlePayNow = () => {
      setShowResponseModal(false);

      if (isSuccess) {
        const paymentData = {
          investmentResponse: investmentResponse,
          orderNumber: investmentResponse.resultText?.orderNumber,
          urNumber: investmentResponse.resultText?.URNumber,
          totalAmount: investmentResponse.totalAmount,
          bseRemarks: investmentResponse.resultText?.bseRemarks,
          bseResponseFlag: investmentResponse.resultText?.bseResponseFlag,
          investmentType: investmentType,
          schemeCode: InvestData?.schemeCode,
          schemeName: InvestData?.description || 'Investment Plan',
          amount: getCurrentAmount(),
          paymentMethod: paymentMethod,
          selectedMandate: selectedMandate,
          startDate: investmentType === 'SIP' ? selectedDate?.toLocaleDateString('en-GB') : null,
          frequency: investmentType === 'SIP' ? 'MONTHLY' : null,
          clientCode: UserData?.user?.clientCode,
          userName: UserData?.user?.name || UserData?.user?.clientName,
          timestamp: new Date().toISOString(),
          investmentStatus: 'CONFIRMED'
        };
        navigation.navigate("PaymentComponent", { paymentData });
      }
    };

    const handleCloseFailed = () => {
      setShowResponseModal(false);
    };

    const formatAmount = (amount) => {
      return `₹${parseFloat(amount).toLocaleString()}`;
    };

    const extractSchemeFromRemarks = (remarks) => {
      const schemeMatch = remarks?.match(/SCHEME:\s*([^T]+)/);
      return schemeMatch ? schemeMatch[1].trim() : 'Investment';
    };

    if (!investmentResponse) return null;

    return (
      <Modal
        visible={showResponseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.responseModalOverlay}>
          <View style={styles.responseModalContainer}>
            <View style={styles.responseModalHeader}>
              <View style={[styles.successIcon, !isSuccess && styles.failedIcon]}>
                <Text style={styles.successIconText}>
                  {isSuccess ? '✓' : '✕'}
                </Text>
              </View>
              <Text style={styles.responseModalTitle}>
                {isSuccess
                  ? (investmentType === 'SIP' ? 'SIP Order Confirmed!' : 'Investment Confirmed!')
                  : (investmentType === 'SIP' ? 'SIP Order Failed!' : 'Investment Failed!')
                }
              </Text>
            </View>

            <View style={styles.responseContent}>
              {isSuccess && (
                <>
                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Order Number:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse.resultText?.orderNumber}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>UR Number:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse.resultText?.URNumber}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Amount:</Text>
                    <Text style={styles.responseValue}>
                      {formatAmount(investmentResponse.totalAmount)}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Scheme:</Text>
                    <Text style={styles.responseValue}>
                      {extractSchemeFromRemarks(investmentResponse.resultText?.bseRemarks)}
                    </Text>
                  </View>
                </>
              )}

              {isFailed && (
                <>
                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>UR Number:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse.resultText?.URNumber}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Order ID:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse.resultText?.orderId}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Order Number:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse.resultText?.orderNumber}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.responseRow}>
                <Text style={styles.responseLabel}>Status:</Text>
                <Text style={[
                  styles.responseValue,
                  isSuccess ? styles.successText : styles.failedText
                ]}>
                  {investmentResponse.resultText?.bseResponseFlag}
                </Text>
              </View>

              {investmentResponse.resultText?.bseRemarks && (
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>
                    {isFailed ? 'Error Details:' : 'Details:'}
                  </Text>
                  <Text style={[
                    styles.remarksText,
                    isFailed && styles.failedRemarksText
                  ]}>
                    {investmentResponse.resultText.bseRemarks}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.responseModalButtons}>
              {isSuccess && (
                <>
                  {paymentMethod === 'UPI' ? (
                    <TouchableOpacity
                      style={styles.responseModalButton}
                      onPress={handleContinueToPayment}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.responseModalButtonText}>Continue to Payment</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.mandateButtonsContainer}>
                      <TouchableOpacity
                        style={styles.responseModalButton}
                        onPress={handleTransactionSuccess}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.responseModalButtonText}>Transaction Successful</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.responseModalButton, styles.payNowButton]}
                        onPress={handlePayNow}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.responseModalButtonText}>Pay Now</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {isFailed && (
                <TouchableOpacity
                  style={[styles.responseModalButton, styles.failedButton]}
                  onPress={handleCloseFailed}
                  activeOpacity={0.8}
                >
                  <Text style={styles.responseModalButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const DatePickerComponent = () => {
    let minimumDate;
    if (investmentType === 'SIP' && paymentMethod === 'UPI') {
      minimumDate = getMinimumDateForSIPUPI();
    } else {
      minimumDate = getMinimumDateForMandate();
    }

    const maximumDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={styles.iosDatePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.datePickerButton}
                    >
                      <Text style={styles.datePickerButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select Start Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.datePickerButton}
                    >
                      <Text style={[styles.datePickerButtonText, styles.doneButton]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate || minimumDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    locale="en-US"
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }

    return showDatePicker ? (
      <DateTimePicker
        value={selectedDate || minimumDate}
        mode="date"
        display="default"
        onChange={onDateChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        is24Hour={true}
      />
    ) : null;
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backArrow}>
            <SInfoSvg.BackButton />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{investmentType}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {InvestData?.description || 'Investment Plan'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const AmountSection = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>{getAmountLabel()}</Text>
      <View style={styles.amountContainer}>
        <Text style={styles.rupeeSymbol}>₹</Text>
        <TextInput
          ref={amountInputRef}
          style={[styles.amountInput, errors.amount && styles.errorInput]}
          value={customAmount || (selectedAmount > 0 ? selectedAmount.toString() : '')}
          onChangeText={handleCustomAmountChange}
          onFocus={handleAmountInputFocus}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor="#999999"
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>
      <Text style={styles.minimumText}>
        Min: ₹{minimumAmount?.toLocaleString()}
      </Text>
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
    </View>
  );

  const QuickAmountSection = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>Quick Select</Text>
      <View style={styles.quickAmountContainer}>
        {getQuickAmountButtons().map((amount, index) => (
          <TouchableOpacity
            key={`${amount}-${index}`}
            style={[
              styles.quickAmountButton,
              selectedAmount === amount && !customAmount && styles.selectedAmountButton,
            ]}
            onPress={() => handleAmountSelect(amount)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.quickAmountText,
              selectedAmount === amount && !customAmount && styles.selectedAmountText,
            ]}>
              ₹{amount.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const PaymentMethodSection = () => {
    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethodContainer}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'UPI' && styles.selectedPaymentOption
            ]}
            onPress={() => {
              setPaymentMethod('UPI');
              setErrors(prev => ({ ...prev, mandate: '' }));
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.radioButton,
              paymentMethod === 'UPI' && styles.selectedRadioButton
            ]}>
              {paymentMethod === 'UPI' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[
              styles.paymentOptionText,
              paymentMethod === 'UPI' && styles.selectedPaymentOptionText
            ]}>
              Payment via UPI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'MANDATE' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('MANDATE')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.radioButton,
              paymentMethod === 'MANDATE' && styles.selectedRadioButton
            ]}>
              {paymentMethod === 'MANDATE' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[
              styles.paymentOptionText,
              paymentMethod === 'MANDATE' && styles.selectedPaymentOptionText
            ]}>
              Payment via Mandate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const MandateSelection = () => {
    const handleMandateSelect = (mandate) => {
      setSelectedMandate(mandate);
      setShowMandateModal(false);
      setErrors(prev => ({ ...prev, mandate: '' }));
    };

    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Select Mandate</Text>
        <TouchableOpacity
          style={[styles.mandateSelector, errors.mandate && styles.errorInput]}
          onPress={() => setShowMandateModal(true)}
          activeOpacity={0.7}
        >
          {selectedMandate ? (
            <>
              <View style={[styles.mandateLogo, { backgroundColor: Config.Colors.primary }]}>
                <Text style={styles.mandateLogoText}>{selectedMandate?.bankName?.slice(0, 1)}</Text>
              </View>
              <View style={styles.mandateDetails}>
                <Text style={styles.mandateId}>{selectedMandate?.mandateId}</Text>
                <Text style={styles.mandateBankName}>Bank Name: {selectedMandate?.bankName}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.mandatePlaceholder}>Select mandate</Text>
          )}
          <Text style={styles.mandateArrow}>⌄</Text>
        </TouchableOpacity>
        {errors.mandate && <Text style={styles.errorText}>{errors.mandate}</Text>}

        <Modal
          visible={showMandateModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMandateModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowMandateModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={styles.mandateModalContainer}>
                  <View style={styles.mandateModalHeader}>
                    <Text style={styles.mandateModalTitle}>Select Mandate</Text>
                    <TouchableOpacity onPress={() => setShowMandateModal(false)}>
                      <Text style={styles.mandateModalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.mandateList}>
                    {mandateOptions?.map((mandate) => (
                      <TouchableOpacity
                        key={mandate?.UMRNNo}
                        style={[
                          styles.mandateOption,
                          selectedMandate?.UMRNNo === mandate?.UMRNNo && styles.selectedMandateOption
                        ]}
                        onPress={() => handleMandateSelect(mandate)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.mandateLogo, { backgroundColor: Config.Colors.primary }]}>
                          <Text style={styles.mandateLogoText}>{mandate?.bankName?.slice(0, 1)}</Text>
                        </View>
                        <View style={styles.mandateDetails}>
                          <Text style={styles.mandateId}>{mandate?.mandateId}</Text>
                          <Text style={styles.mandateBankInfo}>
                            Registration Date: {mandate?.registrationDate}
                          </Text>
                          <Text style={styles.mandateBankInfo}>
                            Approved Date: {mandate?.approvedDate}
                          </Text>
                          <Text style={styles.mandateBankName}>Bank Name: {mandate?.bankName}</Text>
                        </View>
                        {selectedMandate?.UMRNNo === mandate?.UMRNNo && (
                          <View style={styles.mandateCheckmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  const ScheduleSection = () => {
    if (investmentType === 'SIP') {
      return (
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>SIP Start Date</Text>
          <TouchableOpacity
            style={[styles.scheduleButton, errors.date && styles.errorInput]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.scheduleIcon}>📅</Text>
            <Text style={styles.scheduleText}>{getScheduleText()}</Text>
            <Text style={styles.scheduleArrow}>⌄</Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>
      );
    }
    return null;
  };

  const handleCreateMandate = () => {
    navigation.navigate("BankMandate")
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B8DF6" />
        </View>
      ) : (
        <>
          <Header />

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <AmountSection />
            <QuickAmountSection />
            <PaymentMethodSection />
            {!(investmentType === 'LUMPSUM' && paymentMethod === 'UPI') && (
              <MandateSelection />
            )}
            <ScheduleSection />

            {errors.general && (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={styles.bottomButtons}>
            <Rbutton
              title={getButtonText()}
              onPress={handleInvestment}
            />
          </View>

          <DatePickerComponent />
          <ResponseModal />
          <MandateAlert
            visible={showMandateAlert}
            onClose={() => navigation.goBack()}
            showCancelButton={true}
            onCreateMandate={handleCreateMandate}
          />
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Config.Colors.cyan_blue,
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
  backArrow: {
    fontSize: widthToDp(8),
    color: '#FFFFFF',
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

  // Scroll View Styles
  scrollView: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  scrollContent: {
    paddingTop: heightToDp(2),
    paddingHorizontal: widthToDp(4),
    paddingBottom: heightToDp(2),
  },

  // Section Box Styles
  sectionBox: {
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
  sectionTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: '700',
    color: '#333',
    marginBottom: heightToDp(1.5),
  },

  // Amount Section
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: heightToDp(1),
    marginBottom: heightToDp(0.5),
  },
  rupeeSymbol: {
    fontSize: widthToDp(6),
    color: '#333333',
    fontWeight: '300',
  },
  amountInput: {
    fontSize: widthToDp(6),
    color: '#333333',
    fontWeight: '400',
    marginLeft: widthToDp(2),
    flex: 1,
    paddingVertical: heightToDp(0.5),
  },
  minimumText: {
    fontSize: widthToDp(3.2),
    color: '#888888',
  },

  // Quick Amount Section
  quickAmountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthToDp(3),
  },
  quickAmountButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: widthToDp(2),
    paddingVertical: heightToDp(1.5),
    paddingHorizontal: widthToDp(3),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    minWidth: widthToDp(20),
  },
  selectedAmountButton: {
    backgroundColor: '#f0f0f0',
    borderColor: Config.Colors.primary,
  },
  quickAmountText: {
    fontSize: widthToDp(3.5),
    color: '#333333',
    fontWeight: '500',
  },
  selectedAmountText: {
    color: Config.Colors.primary,
    fontWeight: '600',
  },

  // Payment Method Section
  paymentMethodContainer: {
    gap: heightToDp(2),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightToDp(1),
  },
  selectedPaymentOption: {
    // Add selected styling if needed
  },
  radioButton: {
    width: widthToDp(5),
    height: widthToDp(5),
    borderRadius: widthToDp(2.5),
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: widthToDp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: Config.Colors.primary,
  },
  radioButtonInner: {
    width: widthToDp(2.5),
    height: widthToDp(2.5),
    borderRadius: widthToDp(1.25),
    backgroundColor: Config.Colors.primary,
  },
  paymentOptionText: {
    fontSize: widthToDp(3.8),
    color: '#333333',
    fontWeight: '500',
  },
  selectedPaymentOptionText: {
    color: Config.Colors.primary,
    fontWeight: '600',
  },

  // Mandate Selection Styles
  mandateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightToDp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mandateLogo: {
    width: widthToDp(8),
    height: widthToDp(8),
    borderRadius: widthToDp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthToDp(3),
  },
  mandateLogoText: {
    color: '#ffffff',
    fontSize: widthToDp(3.5),
    fontWeight: 'bold',
  },
  mandateDetails: {
    flex: 1,
  },
  mandateId: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333333',
    marginBottom: heightToDp(0.3),
  },
  mandateBankName: {
    fontSize: widthToDp(3.5),
    color: '#666666',
  },
  mandatePlaceholder: {
    fontSize: widthToDp(3.8),
    color: '#999999',
    flex: 1,
  },
  mandateArrow: {
    fontSize: widthToDp(4),
    color: '#666666',
  },

  // Schedule Section
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: heightToDp(1.5),
  },
  scheduleIcon: {
    fontSize: widthToDp(4.5),
    marginRight: widthToDp(2),
  },
  scheduleText: {
    fontSize: widthToDp(3.8),
    color: '#333333',
    flex: 1,
    fontWeight: '500',
  },
  scheduleArrow: {
    fontSize: widthToDp(4),
    color: '#666666',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mandateModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: widthToDp(5),
    borderTopRightRadius: widthToDp(5),
    maxHeight: screenHeight * 0.7,
  },
  mandateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mandateModalTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#333333',
  },
  mandateModalClose: {
    fontSize: widthToDp(5),
    color: '#666666',
    paddingHorizontal: widthToDp(2),
    paddingVertical: widthToDp(1),
  },
  mandateList: {
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1),
  },
  mandateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedMandateOption: {
    backgroundColor: '#f8f9ff',
  },
  mandateCheckmark: {
    width: widthToDp(5),
    height: widthToDp(5),
    borderRadius: widthToDp(2.5),
    backgroundColor: Config.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: widthToDp(2),
  },
  checkmarkText: {
    fontSize: widthToDp(3),
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Date Picker Styles
  iosDatePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: widthToDp(5),
    borderTopRightRadius: widthToDp(5),
    paddingBottom: heightToDp(4),
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#333333',
  },
  datePickerButton: {
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1),
  },
  datePickerButtonText: {
    fontSize: widthToDp(4),
    color: Config.Colors.primary,
  },
  doneButton: {
    fontWeight: '600',
  },

  // Error Styles
  errorText: {
    color: Config.Colors.red,
    fontSize: widthToDp(3.2),
    marginTop: heightToDp(0.5),
  },
  errorInput: {
    borderColor: Config.Colors.red,
  },
  generalErrorContainer: {
    backgroundColor: '#FFE6E6',
    padding: widthToDp(3),
    borderRadius: widthToDp(2),
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
  },

  // Bottom Section
  bottomPadding: {
    height: heightToDp(1),
  },
  bottomButtons: {
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    backgroundColor: Config.Colors.cyan_blue,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  // Response Modal Styles (keep existing response modal styles)
  responseModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  responseModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  responseModalHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  failedIcon: {
    backgroundColor: Config.Colors.red,
  },
  successIconText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  responseModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  responseContent: {
    padding: 20,
    maxHeight: 300,
  },
  responseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  responseLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  responseValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  successText: {
    color: '#4CAF50',
  },
  failedText: {
    color: Config.Colors.red,
  },
  remarksContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  remarksLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  remarksText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  failedRemarksText: {
    color: Config.Colors.red,
  },
  responseModalButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  responseModalButton: {
    backgroundColor: Config.Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  responseModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payNowButton: {
    backgroundColor: '#4CAF50',
  },
  failedButton: {
    backgroundColor: Config.Colors.red,
  },
  mandateButtonsContainer: {
    gap: 10,
  },
});

export default Invest;