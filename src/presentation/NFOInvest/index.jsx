// NFOInvest.js — FULL UPDATED FILE

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Platform,
  ScrollView,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import StartDatePickerComponent from '../../utils/StartDatePickerComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NFOInvest = ({ navigation }) => {
  const InvestData = useSelector(state => state.marketWatch.investment);
  const UserData = useSelector(state => state.login.loginData);
  const investmentType = useSelector(state => state.marketWatch.investType);

  console.log('InvestData (NFOInvest):', InvestData);

  // ----- STATE -----
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [minimumAmount, setMinimumAmount] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // SIP start date (Date object)

  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('UPI'); // kept for backward compat (UI only)
  const [paymentToday, setPaymentToday] = useState('no');    // "yes" | "no" – matches web logic

  const [selectedMandate, setSelectedMandate] = useState(null);
  const [showMandateModal, setShowMandateModal] = useState(false);
  const [mandateOptions, setMandateOptions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [investmentResponse, setInvestmentResponse] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const [showMandateAlert, setShowMandateAlert] = useState(false);

  // ----- EFFECTS -----
  useEffect(() => {
    fetchingMandate();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) navigation.goBack();
      else BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Use InvestData.variant.minimumPurchaseAmount for minimum
  useEffect(() => {
    const variantMin = InvestData?.variant?.minimumPurchaseAmount;
    const parsedMin = variantMin ? Math.ceil(parseFloat(variantMin)) : 0;

    setMinimumAmount(parsedMin || 0);

    if (parsedMin && parsedMin > 0) {
      setSelectedAmount(parsedMin);
      setCustomAmount('');
    } else {
      setSelectedAmount(0);
      setCustomAmount('');
    }
  }, [InvestData, investmentType]);

  // Auto-set default SIP date similar to web logic
  useEffect(() => {
    if (investmentType === 'SIP' && !selectedDate) {
      const minDate = getMinSelectableDate();
      setSelectedDate(minDate);
    }
  }, [investmentType, selectedDate]);

  // ----- HELPERS -----
  const getCurrentAmount = () =>
    customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const getQuickAmountButtons = () =>
    investmentType === 'SIP'
      ? [1000, 5000, 10000, 25000]
      : [500, 1000, 2000, 5000, 8000, 10000];

  const handleAmountSelect = amount => {
    if (minimumAmount && amount < minimumAmount) {
      setErrors(prev => ({
        ...prev,
        amount: `Minimum amount is ₹${minimumAmount}`,
      }));
      return;
    }
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrors(prev => ({ ...prev, amount: '' }));
    Keyboard.dismiss();
  };

  const handleCustomAmountChange = text => {
    const numeric = text.replace(/[^0-9]/g, '');
    const value = parseInt(numeric || '0', 10);

    if (minimumAmount && value && value < minimumAmount) {
      setErrors(prev => ({
        ...prev,
        amount: `Minimum amount is ₹${minimumAmount}`,
      }));
    } else {
      setErrors(prev => ({ ...prev, amount: '' }));
    }

    setCustomAmount(numeric);
    setSelectedAmount(0);
  };

  // ---------- DATE LOGIC (MATCH REACT WEB) ----------

  // Min selectable SIP date:
  //  - If current time >= 14:00 -> tomorrow
  //  - Else -> today
  //  (No weekend skipping here because web also doesn't)
  const getMinSelectableDate = () => {
    const now = new Date();
    const cutoffHour = 14;

    let baseDate = new Date(now.getTime());

    if (now.getHours() >= cutoffHour) {
      baseDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    }

    baseDate.setHours(0, 0, 0, 0);
    return baseDate;
  };

  const computeMaximumDate = () => {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  };

  // Format Date -> "DD/MM/YYYY" (for API)
  const formatToDDMMYYYY = dateObj => {
    if (!dateObj) return '';
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // This mimics handleDateSelect from web:
  // - User selects date (Date object)
  // - If day >= 28 → move to next month 1st
  // - Clear date error if any
  const handleStartDateChange = date => {
    if (!date) {
      setSelectedDate(null);
      return;
    }

    const selected = new Date(date);
    if (isNaN(selected.getTime())) {
      console.log('Invalid selected date in StartDatePickerComponent');
      return;
    }

    const day = selected.getDate();
    if (day >= 28) {
      selected.setMonth(selected.getMonth() + 1);
      selected.setDate(1);
    }

    setSelectedDate(selected);
    setErrors(prev => ({ ...prev, date: '' }));
  };

  // ----- MANDATE FETCH -----
  const fetchingMandate = async () => {
    setIsLoading(true);
    try {
      const Token = await getData(Config.store_key_login_details);

      const response = await fetch(
        `${Config.getBaseUrl()}/api/client/registration/mandate/history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            clientcode: UserData?.user?.clientCode,
            Authorization: Token,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        const filtered = data?.mandates?.filter(m => m.UMRNNo) || [];
        setMandateOptions(filtered);
        setShowMandateAlert(filtered.length === 0);
      } else {
        setMandateOptions([]);
        setShowMandateAlert(true);
      }
    } catch (err) {
      console.error('fetchingMandate error:', err);
      setMandateOptions([]);
      setShowMandateAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ----- VALIDATION (MATCHING WEB LOGIC) -----
  const validateForm = () => {
    const newErrors = {};
    const amount = getCurrentAmount();

    // amount validation
    if (!amount || amount === 0) newErrors.amount = 'Please enter an amount';
    else if (minimumAmount && amount < minimumAmount)
      newErrors.amount = `Minimum amount is ₹${minimumAmount}`;

    // SIP checks
    if (investmentType === 'SIP') {
      const sipAllowed = InvestData?.variant?.sipFlag === 'Y';
      if (!sipAllowed) newErrors.general = 'SIP not allowed for this NFO';

      if (!selectedDate) newErrors.date = 'Please select a SIP start date';
    }

    // Mandate requirement:
    //  - SIP: mandate always required (same as web)
    //  - LUMPSUM: mandate required only when paymentToday === 'no'
    if (investmentType === 'SIP' && !selectedMandate) {
      newErrors.mandate = 'Please select a mandate';
    }

    if (investmentType === 'LUMPSUM' && paymentToday === 'no' && !selectedMandate) {
      newErrors.mandate = 'Please select a mandate';
    }

    // Lumpsum purchase allowed check
    if (investmentType === 'LUMPSUM') {
      const lumpsumAllowed = InvestData?.variant?.purchaseAllowed === 'Y';
      if (!lumpsumAllowed)
        newErrors.general = 'Lumpsum purchase is not allowed for this NFO';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ----- HEADER -----
  const Header = () => (
    <LinearGradient
      colors={['#2B8DF6', '#2B8DF6']}
      style={styles.headerGradient}
    >
      <Image
        source={bgVector}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.08 }]}
        resizeMode="cover"
      />
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SInfoSvg.WhiteBackButton />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{investmentType}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {InvestData?.schemeName || InvestData?.description || 'Investment Plan'}
          </Text>
          <Text
            style={{
              color: '#E6F3FF',
              marginTop: 6,
              fontSize: widthToDp(3),
            }}
          >
            {InvestData?.schemeCode || InvestData?.variant?.schemeCode}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  // ----- AMOUNT SECTION -----
  const AmountSection = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>
        {investmentType === 'SIP' ? 'Instalment amount' : 'Investment amount'}
      </Text>

      <View style={styles.amountContainer}>
        <Text style={styles.rupeeSymbol}>₹</Text>
        <TextInput
          ref={amountInputRef}
          style={[styles.amountInput, errors.amount && styles.errorInput]}
          value={
            customAmount || (selectedAmount > 0 ? selectedAmount.toString() : '')
          }
          onChangeText={handleCustomAmountChange}
          keyboardType="numeric"
          placeholder="Enter amount"
          maxLength={10}
        />
      </View>

      <Text style={styles.minimumText}>
        Min: ₹{minimumAmount?.toLocaleString() || '—'}
      </Text>

      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
    </View>
  );

  // ----- QUICK AMOUNT -----
  const QuickAmountSection = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>Quick Select</Text>
      <View style={styles.quickAmountContainer}>
        {getQuickAmountButtons().map((amt, idx) => (
          <TouchableOpacity
            key={`${amt}-${idx + 1}`}
            style={[
              styles.quickAmountButton,
              selectedAmount === amt &&
                !customAmount &&
                styles.selectedAmountButton,
            ]}
            onPress={() => handleAmountSelect(amt)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.quickAmountText,
                selectedAmount === amt &&
                  !customAmount &&
                  styles.selectedAmountText,
              ]}
            >
              ₹{amt.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ----- PAYMENT METHOD SECTION (kept as extra option) -----
  const PaymentMethodSection = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.paymentMethodContainer}>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'UPI' && styles.selectedPaymentOption,
          ]}
          onPress={() => {
            setPaymentMethod('UPI');
          }}
        >
          <View
            style={[
              styles.radioButton,
              paymentMethod === 'UPI' && styles.selectedRadioButton,
            ]}
          >
            {paymentMethod === 'UPI' && <View style={styles.radioButtonInner} />}
          </View>
          <Text
            style={[
              styles.paymentOptionText,
              paymentMethod === 'UPI' && styles.selectedPaymentOptionText,
            ]}
          >
            Payment via UPI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'MANDATE' && styles.selectedPaymentOption,
          ]}
          onPress={() => setPaymentMethod('MANDATE')}
        >
          <View
            style={[
              styles.radioButton,
              paymentMethod === 'MANDATE' && styles.selectedRadioButton,
            ]}
          >
            {paymentMethod === 'MANDATE' && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <Text
            style={[
              styles.paymentOptionText,
              paymentMethod === 'MANDATE' && styles.selectedPaymentOptionText,
            ]}
          >
            Payment via Mandate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ----- PAYMENT TODAY SECTION (matching web) -----
  const PaymentTodaySection = () => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>Payment Today</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => setPaymentToday('yes')}
        >
          <View
            style={[
              styles.radioButton,
              paymentToday === 'yes' && styles.selectedRadioButton,
            ]}
          >
            {paymentToday === 'yes' && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <Text
            style={[
              styles.paymentOptionText,
              paymentToday === 'yes' && styles.selectedPaymentOptionText,
            ]}
          >
            Yes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => setPaymentToday('no')}
        >
          <View
            style={[
              styles.radioButton,
              paymentToday === 'no' && styles.selectedRadioButton,
            ]}
          >
            {paymentToday === 'no' && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <Text
            style={[
              styles.paymentOptionText,
              paymentToday === 'no' && styles.selectedPaymentOptionText,
            ]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>

      {paymentToday === 'yes' && (
        <Text style={{ fontSize: widthToDp(3.2), color: '#777', marginTop: 8 }}>
          You&apos;ll be redirected to payment after confirmation (for Lumpsum).
        </Text>
      )}
    </View>
  );

  // ----- MANDATE SELECTION UI -----
  const MandateSelection = () => {
    const handleMandateSelect = m => {
      setSelectedMandate(m);
      setShowMandateModal(false);
      setErrors(prev => ({ ...prev, mandate: '' }));
    };

    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Select Mandate</Text>

        <TouchableOpacity
          style={[styles.mandateSelector, errors.mandate && styles.errorInput]}
          onPress={() => setShowMandateModal(true)}
          activeOpacity={0.8}
        >
          {selectedMandate ? (
            <>
              <View
                style={[
                  styles.mandateLogo,
                  { backgroundColor: Config.Colors.primary },
                ]}
              >
                <Text style={styles.mandateLogoText}>
                  {selectedMandate?.bankName?.slice(0, 1)}
                </Text>
              </View>

              <View style={styles.mandateDetails}>
                <Text style={styles.mandateId}>
                  {selectedMandate?.mandateId}
                </Text>
                <Text style={styles.mandateBankName}>
                  Bank Name: {selectedMandate?.bankName}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.mandatePlaceholder}>Select mandate</Text>
          )}

          <Text style={styles.mandateArrow}>⌄</Text>
        </TouchableOpacity>

        {errors.mandate && (
          <Text style={styles.errorText}>{errors.mandate}</Text>
        )}

        <Modal
          visible={showMandateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMandateModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowMandateModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.mandateModalContainer}>
                  <View style={styles.mandateModalHeader}>
                    <Text style={styles.mandateModalTitle}>Select Mandate</Text>
                    <TouchableOpacity
                      onPress={() => setShowMandateModal(false)}
                    >
                      <Text style={styles.mandateModalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.mandateList}>
                    {mandateOptions?.map((m, index) => (
                      <TouchableOpacity
                        key={m?.UMRNNo || m?.mandateId || index}
                        style={[
                          styles.mandateOption,
                          selectedMandate?.UMRNNo === m?.UMRNNo &&
                            styles.selectedMandateOption,
                        ]}
                        onPress={() => handleMandateSelect(m)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.mandateLogo,
                            { backgroundColor: Config.Colors.primary },
                          ]}
                        >
                          <Text style={styles.mandateLogoText}>
                            {m?.bankName?.slice(0, 1)}
                          </Text>
                        </View>

                        <View style={styles.mandateDetails}>
                          <Text style={styles.mandateId}>{m?.mandateId}</Text>
                          <Text style={styles.mandateBankInfo}>
                            Registration Date: {m?.registrationDate}
                          </Text>
                          <Text style={styles.mandateBankInfo}>
                            Approved Date: {m?.approvedDate}
                          </Text>
                          <Text style={styles.mandateBankName}>
                            Bank Name: {m?.bankName}
                          </Text>
                        </View>

                        {selectedMandate?.UMRNNo === m?.UMRNNo && (
                          <View style={styles.mandateCheckmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}

                    {(!mandateOptions || mandateOptions.length === 0) && (
                      <View style={{ padding: 20 }}>
                        <Text style={{ color: '#666' }}>
                          No mandates found. Create a mandate to use mandate
                          payments.
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.responseModalButton,
                            { marginTop: 12 },
                          ]}
                          onPress={() => {
                            setShowMandateModal(false);
                            navigation.navigate('BankMandate');
                          }}
                        >
                          <Text style={styles.responseModalButtonText}>
                            Create Mandate
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  // ----- SCHEDULE SECTION -----
  const ScheduleSection = () => {
    if (investmentType !== 'SIP') return null;

    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>SIP Start Date</Text>

        <TouchableOpacity
          style={[styles.scheduleButton, errors.date && styles.errorInput]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.scheduleIcon}>📅</Text>
          <Text style={styles.scheduleText}>
            {selectedDate
              ? selectedDate.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Select start date'}
          </Text>
          <Text style={styles.scheduleArrow}>⌄</Text>
        </TouchableOpacity>

        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
      </View>
    );
  };

  // ----- INVESTMENT HANDLER + API CALL (uses variant.schemeCode) -----
  const handleInvestment = async () => {
    if (!validateForm()) return;

    const amount = getCurrentAmount();
    const variant = InvestData?.variant || {};
    const schemeCodeToSend = variant?.schemeCode || InvestData?.schemeCode;

    let payload = {};

    if (investmentType === 'LUMPSUM') {
      // Match web: mandate required only when paymentToday === "no"
      payload = {
        amount: amount.toString(),
        buyType: 'FRESH',
        schemaCode: schemeCodeToSend,
        mandateId: paymentToday === 'yes' ? '' : selectedMandate?.mandateId,
        paymentMethod, // kept for compatibility
      };
    } else {
      // SIP
      const sipStartDateObject = selectedDate || getMinSelectableDate();
      const startDate = formatToDDMMYYYY(sipStartDateObject);

      payload = {
        installmentAmount: amount.toString(),
        frequencyType: 'MONTHLY',
        noOfInstallment: 300, // static like your RN code
        mandateId: selectedMandate?.mandateId,
        firstOrderToday: paymentToday === 'yes',
        startDate,
        endDate: '',
        schemaCode: schemeCodeToSend,
        buyType: 'FRESH',
        paymentMethod,
      };
    }

    console.log('NFO invest payload:',investmentType);

    try {
      setIsLoading(true);
      const Token = await getData(Config.store_key_login_details);

      const endpoint =
        investmentType === 'SIP'
          ? '/api/v1/purchase/sip/entry'
          : '/api/v1/purchase/order/entry';

      const response = await fetch(`${Config.getBaseUrl()}/api/v1/purchase/sip/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          clientcode: UserData?.user?.clientCode,
          Authorization: Token,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Investment API result:', result);

      setInvestmentResponse(result);
      setShowResponseModal(true);

      if (!response.ok) {
        setErrors(prev => ({
          ...prev,
          general: result?.message || 'Something went wrong',
        }));
      } else {
        setErrors({});
      }
    } catch (err) {
      console.error('Investment error:', err);
      setErrors(prev => ({
        ...prev,
        general: 'Network error. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // ----- START DATE PICKER COMPONENT USAGE -----
  const minimumDateForPicker = getMinSelectableDate();
  const maximumDateForPicker = computeMaximumDate();

  // ----- RESPONSE MODAL -----
  const ResponseModal = () => {
    const isSuccess = investmentResponse?.status === 'SUCCESS';
    const isFailed = investmentResponse?.status === 'FAILED';

    if (!investmentResponse) return null;

    const handleContinue = () => {
      setShowResponseModal(false);
      if (!isSuccess) return;

      // Match web: go to payment only for LUMPSUM + paymentToday === "yes"
      if (investmentType === 'LUMPSUM' && paymentToday === 'yes') {
        navigation.navigate('PaymentComponent', {
          paymentData: {
            investmentResponse,
            orderNumber:
              investmentResponse?.resultText?.orderId ||
              investmentResponse?.resultText?.orderNumber,
            urNumber: investmentResponse?.resultText?.URNumber,
            totalAmount: investmentResponse?.totalAmount,
            bseRemarks: investmentResponse?.resultText?.bseRemarks,
            bseResponseFlag: investmentResponse?.resultText?.bseResponseFlag,
            investmentType,
            schemeCode:
              InvestData?.variant?.schemeCode || InvestData?.schemeCode,
            schemeName: InvestData?.schemeName || 'Investment Plan',
            amount: getCurrentAmount(),
            paymentMethod,
            selectedMandate,
            startDate:
              investmentType === 'SIP'
                ? formatToDDMMYYYY(selectedDate)
                : null,
            frequency: investmentType === 'SIP' ? 'MONTHLY' : null,
            clientCode: UserData?.user?.clientCode,
            userName: UserData?.user?.name || UserData?.user?.clientName,
            timestamp: new Date().toISOString(),
            investmentStatus: 'CONFIRMED',
          },
        });
      }
    };

    return (
      <Modal
        visible={showResponseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.responseModalOverlay}>
          <View style={styles.responseModalContainer}>
            {/* HEADER */}
            <View style={styles.responseModalHeader}>
              <View
                style={[
                  styles.successIcon,
                  !isSuccess && styles.failedIcon,
                ]}
              >
                <Text style={styles.successIconText}>
                  {isSuccess ? '✓' : '✕'}
                </Text>
              </View>

              <Text style={styles.responseModalTitle}>
                {isSuccess
                  ? investmentType === 'SIP'
                    ? 'SIP Order Confirmed!'
                    : 'Investment Confirmed!'
                  : 'Transaction Failed'}
              </Text>
            </View>

            {/* CONTENT */}
            <View style={styles.responseContent}>
              {isSuccess && (
                <>
                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Order No.:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse?.resultText?.orderNumber}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>UR No.:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse?.resultText?.URNumber}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Amount:</Text>
                    <Text style={styles.responseValue}>
                      ₹
                      {investmentResponse?.totalAmount?.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Scheme:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse?.resultText?.bseRemarks}
                    </Text>
                  </View>
                </>
              )}

              {isFailed && (
                <>
                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>UR No.:</Text>
                    <Text style={styles.responseValue}>
                      {investmentResponse?.resultText?.URNumber}
                    </Text>
                  </View>

                  <View style={styles.responseRow}>
                    <Text style={styles.responseLabel}>Message:</Text>
                    <Text
                      style={[
                        styles.responseValue,
                        styles.failedText,
                      ]}
                    >
                      {investmentResponse?.resultText?.bseRemarks}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* BUTTONS */}
            <View style={styles.responseModalButtons}>
              {isSuccess ? (
                <TouchableOpacity
                  style={styles.responseModalButton}
                  onPress={handleContinue}
                >
                  <Text style={styles.responseModalButtonText}>
                    {investmentType === 'LUMPSUM' && paymentToday === 'yes'
                      ? 'Continue to Payment'
                      : 'Close'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.responseModalButton,
                    styles.failedButton,
                  ]}
                  onPress={() => setShowResponseModal(false)}
                >
                  <Text style={styles.responseModalButtonText}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ----- UI RENDER -----
  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && (
        <View style={styles.androidStatusBar} />
      )}

      <StatusBar barStyle="dark-content" backgroundColor="#2B8DF6" />

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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AmountSection />
            <QuickAmountSection />
            <PaymentMethodSection />
            <PaymentTodaySection />

            {/* Mandate not required ONLY when LUMPSUM + paymentToday === "yes" */}
            {!(
              investmentType === 'LUMPSUM' && paymentToday === 'yes'
            ) && <MandateSelection />}

            <ScheduleSection />

            {investmentType === 'SIP' && (
              <Text
                style={{
                  fontSize: widthToDp(3),
                  color: '#777',
                  textAlign: 'center',
                  marginBottom: heightToDp(1),
                }}
              >
                {new Date().getHours() >= 14
                  ? 'After 2:00 PM, SIP can only start from tomorrow'
                  : 'SIP can start today if selected before 2:00 PM'}
              </Text>
            )}

            {errors.general && (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={styles.bottomButtons}>
            <Rbutton
              title={investmentType === 'SIP' ? 'Start SIP' : 'Invest Now'}
              onPress={handleInvestment}
            />
          </View>

          {/* Date Picker */}
          <StartDatePickerComponent
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            selectedDate={selectedDate}
            setSelectedDate={handleStartDateChange}
            minimumDate={minimumDateForPicker}
            maximumDate={maximumDateForPicker}
            investmentType={investmentType}
            setErrors={setErrors}
            modalOverlay={styles.modalOverlay}
            iosDatePickerContainer={styles.iosDatePickerContainer}
            datePickerHeader={styles.datePickerHeader}
            datePickerButtonText={styles.datePickerButtonText}
            doneButton={styles.doneButton}
            datePickerTitle={styles.datePickerTitle}
          />

          <ResponseModal />

          <MandateAlert
            visible={showMandateAlert}
            onClose={() => navigation.goBack()}
            showCancelButton={true}
            onCreateMandate={() => navigation.navigate('BankMandate')}
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
  selectedPaymentOption: {},
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
  mandateBankInfo: {
    fontSize: widthToDp(3.2),
    color: '#777',
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

  // Date Picker Styles (for StartDatePickerComponent)
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
  datePickerButtonText: {
    fontSize: widthToDp(4),
    color: Config.Colors.primary,
    padding: widthToDp(2),
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

  // Response Modal Styles
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
  failedText: {
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
  failedButton: {
    backgroundColor: Config.Colors.red,
  },
});

export default NFOInvest;
