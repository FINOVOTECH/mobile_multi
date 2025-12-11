import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useSelector } from 'react-redux';
import SInfoSvg from '../../presentation/svgs';
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import CustomSlider from '../CustomSlider';
import { apiPostService } from '../../helpers/services';
import { getData } from '../../helpers/localStorage';
import Rbutton from '../Rbutton';

const { height: screenHeight } = Dimensions.get('window');

const SipInterface = ({ navigation }) => {
  const Data = useSelector(state => state.marketWatch.sipInterface);
  console.log('SIP INTERFACE', Data);

  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // 🔴 SINGLE MODAL STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'customize' | 'pause' | 'cancel' | 'redemption' | 'stepup' | 'switch'
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  const steps = [3, 6, 9, 12];
  const [pauseDuration, setPauseDuration] = useState(steps[0]);
  const [selectedCancelOption, setSelectedCancelOption] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [otherReason, setOtherReason] = useState('');
  const [loader, setLoading] = useState(false);

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const [redemptionForm, setRedemptionForm] = useState({
    clientCode: '',
    schemeCode: '',
    folioNo: '',
    allUnitsFlag: 'N',
    redemptionAmount: '',
    redemptionUnits: '',
  });

  const [stepUpForm, setStepUpForm] = useState({
    duration: 'YEARLY',
    sipInstallmentAmount: '',
    incrementType: 'percentage', // 'percentage' or 'amount'
    nextSipIncrementPercentage: '',
    nextSipIncrementByAmount: '',
  });

  const [switchForm, setSwitchForm] = useState({
    fromSchemeCd: '',
    toSchemeCd: '',
    switchAmount: '',
    allUnitsFlag: 'N', // "Y" = All Units, "N" = Partial
    buySellType: 'FRESH', // "FRESH" or "ADDITIONAL"
    folioNo: '', // Required only for physical clients
    remarks: 'Client initiated switch order',
  });

  const cancelOptions = [
    'Non availability of Funds',
    'Scheme not performing',
    'Service issue',
    'Load Revised',
    'Wish to invest in other schemes',
    'Change in Fund Manager',
    'Goal Achieved',
    'Not comfortable with market volatility',
    'Will be restarting SIP after few months',
    'Modifications in bank/mandate/date etc',
    'I have decided to invest elsewhere',
    'This is not the right time to invest',
    'Others (pls specify the reason)',
  ];

  useEffect(() => {
    console.log('ALLTTED UNITS', Data?.allotmentData?.allottedUnit);
    if (Data?.allotmentData) {
      setRedemptionForm(prev => ({
        ...prev,
        clientCode: '',
        schemeCode: Data?.allotmentData?.schemeCode || '',
        folioNo: Data?.allotmentData?.folioNo || '',
        allUnitsFlag: 'N',
        redemptionAmount: '',
        redemptionUnits: Data?.allotmentData?.allottedUnit || '',
      }));

      setSwitchForm(prev => ({
        ...prev,
        fromSchemeCd: Data?.allotmentData?.schemeCode || '',
        folioNo: Data?.allotmentData?.folioNo || '',
      }));
    }
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (modalVisible) {
          handleCloseModal();
          return true;
        }
        navigation.goBack();
        return true;
      },
    );
    return () => backHandler.remove();
  }, [navigation, modalVisible]);

  const showResponseMessage = (title, message, isSuccess = true) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', style: isSuccess ? 'default' : 'cancel' }],
      { cancelable: false },
    );
  };

  const animateModal = (animValue, toValue, callback = null) => {
    Animated.spring(animValue, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(callback);
  };

  // 🔵 Open / close base modal

  const openModal = type => {
    setActiveModal(type);
    setModalVisible(true);
    // reset position for smooth animation
    slideAnim.setValue(screenHeight);
    setTimeout(() => {
      animateModal(slideAnim, 0);
    }, Platform.OS === 'ios' ? 50 : 0);
  };

  const openCustomizeModal = () => {
    openModal('customize');
  };

  const handleCloseModal = () => {
    // e.g., during OTP we don't want to close
    if (activeModal === 'redemption' && showOtpInput) return;
    animateModal(slideAnim, screenHeight, () => {
      setModalVisible(false);
      setActiveModal(null);
      setShowOtpInput(false);
      setOtp('');
    });
  };

  // =================== API HANDLERS ===================

  const handlePauseSIP = async () => {
    if (!Data?.allotmentData?.SIPRegnNo) {
      showResponseMessage('Error', 'SIP Registration Number not found', false);
      return;
    }

    setLoading(true);
    console.log('VALUES', Data?.allotmentData?.SIPRegnNo);
    console.log('PAUSE RES', {
      sipRegistrationNumber: Data?.allotmentData?.SIPRegnNo,
      pauseInstNumber: String(pauseDuration),
    });
    try {
      const response = await apiPostService('/api/v1/pause/sip/entry', {
        sipRegistrationNumber: Data?.allotmentData?.SIPRegnNo,
        pauseInstNumber: String(pauseDuration),
      });
      const isSuccess = response?.status === 200 || response?.status === 201;

      if (isSuccess) {
        showResponseMessage(
          'Success',
          response?.data?.message ||
            `SIP paused successfully for ${pauseDuration} month${
              pauseDuration > 1 ? 's' : ''
            }`,
        );
        handleCloseModal();
      } else {
        showResponseMessage(
          'Error',
          response?.data?.message || 'Failed to pause SIP. Please try again.',
          false,
        );
      }
    } catch (error) {
      console.error('Failed to pause SIP:', error);
      showResponseMessage(
        'Error',
        error?.response?.data?.message ||
          'Network error. Please check your connection and try again.',
        false,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSIP = async () => {
    const cancelReasonText =
      selectedCancelOption === 'Others (pls specify the reason)'
        ? otherReason.trim()
        : selectedCancelOption;

    if (!cancelReasonText) {
      showResponseMessage(
        'Error',
        'Please select a cancellation reason',
        false,
      );
      return;
    }

    if (!Data?.allotmentData?.SIPRegnNo) {
      showResponseMessage('Error', 'SIP Registration Number not found', false);
      return;
    }
    setLoading(true);
    try {
      const clientCode = await getData('clientCode');
      const cancelReasonIndex = cancelOptions.findIndex(
        option => option === selectedCancelOption,
      );
      console.log('CANCEL RES', {
        xsipRegistrationID: Data?.allotmentData?.SIPRegnNo,
        remarks: '',
        ceaseBseCode: String(cancelReasonIndex + 1).padStart(2, '0'),
      });

      const response = await apiPostService(
        '/api/v1/cancellation/sip/entry',
        {
          xsipRegistrationID: Data?.allotmentData?.SIPRegnNo,
          remarks: '',
          ceaseBseCode: String(cancelReasonIndex + 1).padStart(2, '0'),
        },
        {
          headers: { clientCode },
        },
      );

      const isSuccess = response?.status === 200 || response?.status === 201;

      if (isSuccess) {
        showResponseMessage(
          'Success',
          response?.data?.message || 'SIP cancelled successfully',
        );
        handleCloseModal();
      } else {
        showResponseMessage(
          'Error',
          response?.data?.message || 'Failed to cancel SIP. Please try again.',
          false,
        );
      }
    } catch (error) {
      console.error('Failed to cancel SIP:', error);
      showResponseMessage(
        'Error',
        error?.response?.data?.message ||
          'Network error. Please check your connection and try again.',
        false,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSIP = async () => {
    if (
      !switchForm.fromSchemeCd ||
      !switchForm.toSchemeCd ||
      !switchForm.switchAmount
    ) {
      showResponseMessage('Error', 'Please fill all required fields', false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fromSchemeCd: Data?.allotmentData?.schemeCode || '',
        toSchemeCd: switchForm.toSchemeCd,
        switchAmount: switchForm.switchAmount,
        allUnitsFlag: switchForm.allUnitsFlag,
        buySellType: switchForm.buySellType,
        folioNo: switchForm.folioNo,
        remarks: switchForm.remarks || 'Client initiated switch order',
      };
      console.log('🛰️ Switch SIP Payload:', payload);

      const response = await apiPostService(
        '/api/v1/mutualfund/switch-order',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response?.status === 200 || response?.status === 201) {
        showResponseMessage(
          'Success',
          'Switch SIP request submitted successfully.',
        );
        handleCloseModal();
      } else {
        showResponseMessage(
          'Error',
          response?.data?.message || 'Failed to submit Switch SIP request.',
          false,
        );
      }
    } catch (error) {
      console.error('Switch SIP API error:', error);
      showResponseMessage(
        'Error',
        error?.response?.data?.message ||
          'Network error. Please check your connection and try again.',
        false,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRedemptionSubmit = async () => {
    if (!redemptionForm.redemptionUnits) {
      showResponseMessage('Error', 'Please enter redemption units', false);
      return;
    }

    setLoading(true);
    try {
      const clientCode = await getData('clientCode');

      const payload = {
        clientCode: clientCode,
        schemeCode: Data?.allotmentData?.schemeCode,
        folioNo: Data?.allotmentData?.folioNo,
        allUnitsFlag: 'N',
        redemptionAmount: '',
        redemptionUnits: redemptionForm.redemptionUnits,
      };

      console.log('🛰️ Redemption Payload:', payload);

      const response = await apiPostService(
        '/api/v1/redemption/entry',
        payload,
        {
          headers: { clientCode },
        },
      );

      const isSuccess = response?.status === 200 || response?.status === 201;

      if (isSuccess) {
        showResponseMessage(
          'Success',
          response?.data?.message ||
            `Redemption of ${payload.redemptionUnits} units submitted successfully!`,
        );
        handleCloseModal();
        setRedemptionForm(prev => ({
          ...prev,
          redemptionUnits: '',
        }));
      } else {
        showResponseMessage(
          'Error',
          response?.data?.message || 'Failed to submit redemption request.',
          false,
        );
      }
    } catch (error) {
      console.error('❌ Redemption Error:', error);
      showResponseMessage(
        'Error',
        error?.response?.data?.message ||
          'Network error. Please check your connection and try again.',
        false,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStepUpSIP = async () => {
    if (!Data?.allotmentData?.schemeCode) {
      showResponseMessage('Error', 'Scheme Code not found', false);
      return;
    }

    if (!stepUpForm.sipInstallmentAmount) {
      showResponseMessage(
        'Error',
        'Please enter current SIP installment amount',
        false,
      );
      return;
    }

    if (
      stepUpForm.incrementType === 'percentage' &&
      !stepUpForm.nextSipIncrementPercentage
    ) {
      showResponseMessage('Error', 'Please enter increment percentage', false);
      return;
    }

    if (
      stepUpForm.incrementType === 'amount' &&
      !stepUpForm.nextSipIncrementByAmount
    ) {
      showResponseMessage('Error', 'Please enter increment amount', false);
      return;
    }

    setLoading(true);
    console.log('STEP UP VALUES', {
      schemaCode: Data?.allotmentData?.schemeCode,
      sipOrderId: Data?.allotmentData?.SIPRegnNo || '12345',
      duration: stepUpForm.duration,
      sipInstallmentAmount: stepUpForm.sipInstallmentAmount,
    });

    try {
      const clientCode = await getData('clientCode');
      const requestBody = {
        schemaCode: Data?.allotmentData?.schemeCode,
        sipOrderId: Data?.allotmentData?.orderNo || '12345',
        duration: stepUpForm.duration,
        sipInstallmentAmount: stepUpForm.sipInstallmentAmount,
      };

      if (stepUpForm.incrementType === 'percentage') {
        requestBody.nextSipIncrementPercentage =
          stepUpForm.nextSipIncrementPercentage;
      } else {
        requestBody.nextSipIncrementByAmount =
          stepUpForm.nextSipIncrementByAmount;
      }

      const response = await apiPostService(
        '/api/v1/stepup/sip/entry',
        requestBody,
        {
          headers: { clientCode },
        },
      );

      const isSuccess = response?.status === 200 || response?.status === 201;

      if (isSuccess) {
        showResponseMessage(
          'Success',
          response?.data?.message || 'SIP Step-up activated successfully',
        );
        handleCloseModal();
      } else {
        showResponseMessage(
          'Error',
          response?.data?.message ||
            'Failed to activate SIP Step-up. Please try again.',
          false,
        );
      }
    } catch (error) {
      console.error('Failed to activate SIP Step-up:', error);
      showResponseMessage(
        'Error',
        error?.response?.data?.message ||
          'Network error. Please check your connection and try again.',
        false,
      );
    } finally {
      setLoading(false);
    }
  };

  const updateRedemptionForm = (field, value) => {
    setRedemptionForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateStepUpForm = (field, value) => {
    setStepUpForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSwitchForm = (field, value) =>
    setSwitchForm(prev => ({ ...prev, [field]: value }));

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = amount => {
    if (!amount) return '₹0';
    const numAmount = parseFloat(amount);
    return numAmount >= 1000
      ? `₹${(numAmount / 1000).toFixed(1)}K`
      : `₹${numAmount.toFixed(0)}`;
  };

  const getOrdinalSuffix = num => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = num % 100;
    return (
      suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]
    );
  };

  const styles = getStyles(isDarkTheme);

  const renderInstalment = ({ item, index }) => (
    <View style={styles.instalmentItem}>
      <View style={styles.instalmentLeft}>
        <View style={styles.instalmentHeader}>
          <Text style={styles.instalmentNumber}>
            {`${index + 1}${getOrdinalSuffix(index + 1)} SIP Instalment`}
          </Text>
          <Text style={styles.statusText}>SUCCESS</Text>
        </View>

        <View style={styles.instalmentDetails}>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Order Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Allotted NAV</Text>
            <Text style={styles.detailValue}>
              ₹{parseFloat(item.allottedNav || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.instalmentDetails}>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Order No</Text>
            <Text style={styles.detailValue}>{item.orderNo || 'N/A'}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Units Allotted</Text>
            <Text style={styles.detailValue}>
              {parseFloat(item.allottedUnit || 0).toFixed(4)}
            </Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Settlement</Text>
            <Text style={styles.detailValue}>{item.settType || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCancelOption = ({ item, index }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setSelectedCancelOption(item);
        setShowDropdown(false);
      }}>
      <Text style={styles.dropdownItemText}>
        {`${String(index + 1).padStart(2, '0')} ${item}`}
      </Text>
    </TouchableOpacity>
  );

  // ========== CUSTOMIZE OPTION CONDITIONAL LOGIC ==========
  const sipStatus = Data?.sip?.status;
  const allottedUnits = parseFloat(Data?.allotmentData?.allottedUnit || 0);

  let customizeOptions = [];

  if (sipStatus === 'cancelled' && allottedUnits > 0) {
    // Case 1 → SIP Cancelled + has units → Only Redemption
    customizeOptions = [
      {
        key: 'redemption',
        icon: '💰',
        title: 'SIP Redemption',
        description: 'Redeem units from your SIP investment',
        color: '#2196F3',
      },
    ];
  } else if (sipStatus === 'cancelled' && allottedUnits <= 0) {
    // Case 2 → SIP Cancelled + 0 units → Show info
    customizeOptions = 'NO_UNITS';
  } else {
    // Case 3 → SIP Active → Show all options normally
    customizeOptions = [
      {
        key: 'pause',
        icon: '⏸️',
        title: 'Pause SIP',
        description: 'Temporarily pause your SIP for 1–10 months',
        color: '#FFA500',
      },
      {
        key: 'cancel',
        icon: '❌',
        title: 'Cancel SIP',
        description: 'Permanently cancel your SIP investment',
        color: '#FF4444',
      },
      {
        key: 'stepup',
        icon: '📈',
        title: 'Step-up SIP',
        description: 'Increase your SIP amount periodically',
        color: '#4CAF50',
      },
      {
        key: 'redemption',
        icon: '💰',
        title: 'SIP Redemption',
        description: 'Redeem units from your SIP investment',
        color: '#2196F3',
      },
      {
        key: 'switch',
        icon: '🔄',
        title: 'Switch SIP',
        description: 'Switch your SIP to another scheme',
        color: '#9C27B0',
      },
    ];
  }

  const renderModalWrapper = (visible, animValue, onClose, title, children) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}>
          <View style={{ flex: 1 }} />

          <TouchableOpacity activeOpacity={1}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: animValue }],
                },
              ]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>{title}</Text>
                  <View style={styles.modalTitleUnderline} />
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <View style={styles.closeButtonCircle}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView
                style={styles.modalContentWrapper}
                contentContainerStyle={{ paddingBottom: heightToDp(2) }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}>
                {children}
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  const getModalTitle = () => {
    switch (activeModal) {
      case 'customize':
        return 'Customize Your SIP';
      case 'pause':
        return 'Pause Investment';
      case 'cancel':
        return 'Cancel SIP';
      case 'redemption':
        return 'SIP Redemption';
      case 'stepup':
        return 'SIP Step-Up';
      case 'switch':
        return 'Switch SIP';
      default:
        return '';
    }
  };

  const getModalBody = () => {
    if (!activeModal) return null;

    if (activeModal === 'customize') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.customizeSubtitle}>
            Choose an option to manage your SIP investment
          </Text>

          {customizeOptions === 'NO_UNITS' ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
                You don’t have units to redeem.
              </Text>
            </View>
          ) : (
            customizeOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.customizeOption,
                  { borderLeftColor: option.color },
                ]}
                onPress={() => setActiveModal(option.key)}>
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: `${option.color}20` },
                    ]}>
                    <Text
                      style={[styles.optionIconText, { color: option.color }]}>
                      {option.icon}
                    </Text>
                  </View>

                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>

                  <View style={styles.optionArrowContainer}>
                    <Text style={styles.optionArrow}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      );
    }

    if (activeModal === 'pause') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.pauseLabel}>
            Select pause duration ({pauseDuration} month
            {pauseDuration > 1 ? 's' : ''})
          </Text>
          <View style={styles.sliderContainer}>
            <CustomSlider
              value={steps.indexOf(pauseDuration)}
              minimumValue={0}
              maximumValue={steps.length - 1}
              step={1}
              onValueChange={index => setPauseDuration(steps[index])}
              style={styles.slider}
              thumbStyle={styles.thumbStyle}
              trackStyle={styles.trackStyle}
              minimumTrackTintColor="#1768BF"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor={Config.Colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>0</Text>
              <Text style={styles.sliderLabelText}>12</Text>
            </View>
          </View>
          <Rbutton
            title="Submit"
            loader={loader}
            onPress={handlePauseSIP}
          />
        </View>
      );
    }

    if (activeModal === 'cancel') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.cancelLabel}>
            Please select a reason for cancellation
          </Text>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}>
            <Text style={styles.dropdownButtonText}>
              {selectedCancelOption || 'Select reason...'}
            </Text>
            <Text style={styles.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={cancelOptions}
                renderItem={renderCancelOption}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          )}

          {selectedCancelOption === 'Others (pls specify the reason)' && (
            <View style={styles.reasonInputContainer}>
              <Text style={styles.reasonInputLabel}>
                Please specify your reason:
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Enter your reason here..."
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={otherReason}
                onChangeText={setOtherReason}
                maxLength={184}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.charCount}>
                {otherReason.length}/184 characters
              </Text>
            </View>
          )}

          <Rbutton
            title="Cancel SIP"
            loader={loader}
            onPress={handleCancelSIP}
            disabled={
              loader ||
              !selectedCancelOption ||
              (selectedCancelOption === 'Others (pls specify the reason)' &&
                !otherReason.trim())
            }
          />
        </View>
      );
    }

    if (activeModal === 'redemption') {
      return (
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.redemptionLabel}>
              Redeem units from your SIP investment
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Scheme Code</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
                value={Data?.allotmentData?.schemeCode || 'N/A'}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Folio Number</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
                value={Data?.allotmentData?.folioNo || 'N/A'}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Redemption Units * (alloted Units:{' '}
                {Data?.allotmentData?.allottedUnit || 0})
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter units to redeem (e.g., 2.5)"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={String(redemptionForm.redemptionUnits)}
                keyboardType="numeric"
                onChangeText={value => {
                  const maxUnits = parseFloat(
                    Data?.allotmentData?.allottedUnit || 0,
                  );

                  if (value === '') {
                    setRedemptionForm(prev => ({
                      ...prev,
                      redemptionUnits: '',
                    }));
                    return;
                  }

                  const regex = /^[0-9]*\.?[0-9]*$/;
                  if (!regex.test(value)) {
                    return;
                  }

                  if (value.endsWith('.')) {
                    setRedemptionForm(prev => ({
                      ...prev,
                      redemptionUnits: value,
                    }));
                    return;
                  }

                  let num = parseFloat(value);
                  if (isNaN(num)) num = '';
                  if (num < 0) num = 0;
                  if (num > maxUnits) num = maxUnits;

                  setRedemptionForm(prev => ({
                    ...prev,
                    redemptionUnits: num.toString(),
                  }));
                }}
              />
            </View>

            <Rbutton
              title="Submit Redemption"
              loader={loader}
              onPress={handleRedemptionSubmit}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
              disabled={loader || !redemptionForm.redemptionUnits}
            />
          </ScrollView>
        </View>
      );
    }

    if (activeModal === 'stepup') {
      return (
        <View style={styles.modalContent}>
          <ScrollView
            style={styles.stepUpScrollView}
            contentContainerStyle={{ paddingBottom: heightToDp(3) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.stepUpLabel}>
              Configure your SIP step-up plan
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Current SIP Installment Amount *
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter current SIP amount (e.g., 2000)"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={stepUpForm.sipInstallmentAmount}
                onChangeText={value =>
                  updateStepUpForm('sipInstallmentAmount', value)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Step-up Duration *</Text>
              <View style={styles.durationContainer}>
                {['HALFYEARLY', 'YEARLY'].map(duration => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      stepUpForm.duration === duration &&
                        styles.durationButtonActive,
                    ]}
                    onPress={() => updateStepUpForm('duration', duration)}>
                    <Text
                      style={[
                        styles.durationButtonText,
                        stepUpForm.duration === duration &&
                          styles.durationButtonTextActive,
                      ]}>
                      {duration === 'HALFYEARLY' ? 'Half Yearly' : 'Yearly'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Increment Type *</Text>
              <View style={styles.incrementTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.incrementTypeButton,
                    stepUpForm.incrementType === 'percentage' &&
                      styles.incrementTypeButtonActive,
                  ]}
                  onPress={() =>
                    updateStepUpForm('incrementType', 'percentage')
                  }>
                  <Text
                    style={[
                      styles.incrementTypeButtonText,
                      stepUpForm.incrementType === 'percentage' &&
                        styles.incrementTypeButtonTextActive,
                    ]}>
                    By Percentage (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.incrementTypeButton,
                    stepUpForm.incrementType === 'amount' &&
                      styles.incrementTypeButtonActive,
                  ]}
                  onPress={() => updateStepUpForm('incrementType', 'amount')}>
                  <Text
                    style={[
                      styles.incrementTypeButtonText,
                      stepUpForm.incrementType === 'amount' &&
                        styles.incrementTypeButtonTextActive,
                    ]}>
                    By Amount (₹)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {stepUpForm.incrementType === 'percentage' ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Increment Percentage *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter percentage (e.g., 13)"
                  placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                  value={stepUpForm.nextSipIncrementPercentage}
                  onChangeText={value =>
                    updateStepUpForm('nextSipIncrementPercentage', value)
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Your SIP amount will increase by{' '}
                  {stepUpForm.nextSipIncrementPercentage || '0'}% every{' '}
                  {stepUpForm.duration.toLowerCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Increment Amount *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter amount (e.g., 500)"
                  placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                  value={stepUpForm.nextSipIncrementByAmount}
                  onChangeText={value =>
                    updateStepUpForm('nextSipIncrementByAmount', value)
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Your SIP amount will increase by ₹
                  {stepUpForm.nextSipIncrementByAmount || '0'} every{' '}
                  {stepUpForm.duration.toLowerCase()}
                </Text>
              </View>
            )}

            {/* <View style={styles.stepUpSummary}>
              <Text style={styles.summaryTitle}>Step-Up Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Amount:</Text>
                <Text style={styles.summaryValue}>
                  ₹{stepUpForm.sipInstallmentAmount || '0'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>
                  {stepUpForm.duration === 'HALFYEARLY'
                    ? 'Half Yearly'
                    : 'Yearly'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Increment:</Text>
                <Text style={styles.summaryValue}>
                  {stepUpForm.incrementType === 'percentage'
                    ? `${stepUpForm.nextSipIncrementPercentage || '0'}%`
                    : `₹${stepUpForm.nextSipIncrementByAmount || '0'}`}
                </Text>
              </View>
              {stepUpForm.sipInstallmentAmount &&
                (stepUpForm.nextSipIncrementPercentage ||
                  stepUpForm.nextSipIncrementByAmount) && (
                  <View style={[styles.summaryRow, styles.highlightRow]}>
                    <Text style={styles.summaryLabel}>Next Amount:</Text>
                    <Text
                      style={[styles.summaryValue, styles.highlightValue]}>
                      ₹
                      {stepUpForm.incrementType === 'percentage'
                        ? Math.round(
                            parseFloat(
                              stepUpForm.sipInstallmentAmount || 0,
                            ) *
                              (1 +
                                parseFloat(
                                  stepUpForm.nextSipIncrementPercentage || 0,
                                ) /
                                  100),
                          )
                        : parseFloat(stepUpForm.sipInstallmentAmount || 0) +
                          parseFloat(
                            stepUpForm.nextSipIncrementByAmount || 0,
                          )}
                    </Text>
                  </View>
                )}
            </View> */}

            <Rbutton
              title="Activate Step-Up"
              loader={loader}
              onPress={handleStepUpSIP}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
              disabled={
                loader ||
                !stepUpForm.sipInstallmentAmount ||
                (stepUpForm.incrementType === 'percentage' &&
                  !stepUpForm.nextSipIncrementPercentage) ||
                (stepUpForm.incrementType === 'amount' &&
                  !stepUpForm.nextSipIncrementByAmount)
              }
            />
          </ScrollView>
        </View>
      );
    }

    if (activeModal === 'switch') {
      return (
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.stepUpLabel}>
              Switch your SIP investment from one scheme to another
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>From Scheme Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 0202-DP"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={switchForm.fromSchemeCd}
                onChangeText={value => updateSwitchForm('fromSchemeCd', value)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>To Scheme Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., B301G"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={switchForm.toSchemeCd}
                onChangeText={value => updateSwitchForm('toSchemeCd', value)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Switch Amount (₹)*</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 100"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={switchForm.switchAmount}
                onChangeText={value => updateSwitchForm('switchAmount', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Switch All Units?</Text>
              <View style={styles.durationContainer}>
                {['Y', 'N'].map(flag => (
                  <TouchableOpacity
                    key={flag}
                    style={[
                      styles.durationButton,
                      switchForm.allUnitsFlag === flag &&
                        styles.durationButtonActive,
                    ]}
                    onPress={() => updateSwitchForm('allUnitsFlag', flag)}>
                    <Text
                      style={[
                        styles.durationButtonText,
                        switchForm.allUnitsFlag === flag &&
                          styles.durationButtonTextActive,
                      ]}>
                      {flag === 'Y' ? 'Yes (All Units)' : 'No (Partial)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Buy/Sell Type *</Text>
              <View style={styles.durationContainer}>
                {['FRESH', 'ADDITIONAL'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.durationButton,
                      switchForm.buySellType === type &&
                        styles.durationButtonActive,
                    ]}
                    onPress={() => updateSwitchForm('buySellType', type)}>
                    <Text
                      style={[
                        styles.durationButtonText,
                        switchForm.buySellType === type &&
                          styles.durationButtonTextActive,
                      ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Folio Number (if applicable)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter folio number (only for Physical clients)"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={switchForm.folioNo}
                onChangeText={value => updateSwitchForm('folioNo', value)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Remarks</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { height: heightToDp(10), textAlignVertical: 'top' },
                ]}
                placeholder="Add remarks (optional)"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={switchForm.remarks}
                onChangeText={value => updateSwitchForm('remarks', value)}
                multiline
              />
            </View>

            <Rbutton
              title="Submit Switch Request"
              loader={loader}
              onPress={handleSwitchSIP}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
              disabled={
                loader ||
                !switchForm.fromSchemeCd ||
                !switchForm.toSchemeCd ||
                !switchForm.switchAmount
              }
            />
          </ScrollView>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <SInfoSvg.BackButton />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.fundHeader}>
          <View style={styles.fundIconWrapper}>
            <View style={styles.fundIcon}>
              <Image
                source={{
                  uri: 'https://cdn5.vectorstock.com/i/1000x1000/44/19/mutual-fund-vector-7404419.jpg',
                }}
                style={{ width: 40, height: 40, borderRadius: 25 }}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.fundDetails}>
            <Text style={styles.fundName}>
              {Data?.allotmentData?.schemeName || 'Scheme Name Not Available'}
            </Text>
            <Text style={styles.monthlyText}>
              {Data?.allotmentData?.schemeCode || 'Scheme Code Not Available'}
            </Text>
            <Text
              style={{
                backgroundColor:
                  Data?.sip?.status === 'cancelled' ? '#FEE2E2' : '#D1FAE5',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                fontSize: 14,
                color:
                  Data?.sip?.status === 'active'
                    ? '#065F46'
                    : Data?.sip?.status === 'cancelled'
                    ? '#991B1B'
                    : '#333',
                overflow: 'hidden',
                alignSelf: 'flex-end',
              }}>
              {Data?.sip?.status === 'active'
                ? 'Active'
                : Data?.sip?.status === 'cancelled'
                ? 'Cancelled'
                : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.sipSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SIP Invested Value</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(Data?.allotmentData?.currentValue || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current NAV</Text>
            <Text style={styles.summaryValue}>
              ₹ {Data?.allotmentData?.currentNav || 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Units</Text>
            <Text style={styles.summaryValue}>
              {Data?.allotmentData?.allottedUnit || 'N/A'}
            </Text>
          </View>

          {showMoreDetails && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Folio Number</Text>
                <Text style={styles.summaryValue}>
                  {Data?.allotmentData?.folioNo || 'N/A'}
                </Text>
              </View>
              {Data?.allotmentData?.schemeName?.includes('ETF') && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Current Market Price</Text>
                  <Text style={styles.summaryValue}>
                    ₹{Data?.allotmentData?.currentValue || 'N/A'}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>NAV Date</Text>
                <Text style={styles.summaryValue}>
                  {Data?.allotmentData?.currentNav}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Registration Number</Text>
                <Text style={styles.summaryValue}>
                  {Data?.allotmentData?.SIPRegnNo || 'N/A'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Registration Date</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(Data?.allotmentData?.wbr2Details?.date) || 'N/A'}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => setShowMoreDetails(!showMoreDetails)}>
            <Text style={styles.viewMoreText}>
              {showMoreDetails ? 'View Less' : 'View More'}
            </Text>
            <SInfoSvg.UpChevron
              width={widthToDp(4)}
              height={heightToDp(3)}
              style={{
                transform: [{ rotate: showMoreDetails ? '180deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Rbutton title={'Customize SIP'} onPress={openCustomizeModal} />
      </View>

      {renderModalWrapper(
        modalVisible,
        slideAnim,
        handleCloseModal,
        getModalTitle(),
        getModalBody(),
      )}
    </SafeAreaView>
  );
};

const getStyles = isDarkTheme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? '#1a1a1a' : Config.Colors.cyan_blue,
    },
    androidStatusBar: {
      height: StatusBar.currentHeight,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: widthToDp(4),
    },
    backButton: {},
    backIcon: {
      fontSize: widthToDp(7),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '300',
    },
    themeToggle: {
      padding: widthToDp(2),
    },
    themeToggleText: {
      fontSize: widthToDp(6),
    },
    scrollView: {
      flex: 1,
    },
    fundHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: widthToDp(2),
      paddingVertical: heightToDp(2),
    },
    fundIconWrapper: {
      marginRight: widthToDp(4),
    },
    fundIcon: {
      width: widthToDp(12),
      height: widthToDp(12),
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fundIconText: {
      color: '#ffffff',
      fontSize: widthToDp(6),
      fontWeight: 'bold',
    },
    fundDetails: {
      flex: 1,
    },
    fundName: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      lineHeight: widthToDp(5),
    },
    monthlyText: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#888888' : '#666666',
      marginTop: heightToDp(0.5),
    },
    sipSummary: {
      paddingHorizontal: widthToDp(4),
      paddingVertical: heightToDp(1),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: heightToDp(1),
    },
    summaryLabel: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#cccccc' : '#333333',
    },
    summaryValue: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '500',
    },
    viewMoreButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewMoreText: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#888888' : '#666666',
      marginRight: widthToDp(1),
    },
    viewMoreIcon: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#888888' : '#666666',
    },
    instalmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: widthToDp(4),
      paddingVertical: heightToDp(1),
      borderTopWidth: 1,
      borderTopColor: isDarkTheme ? '#333333' : '#e0e0e0',
      marginTop: heightToDp(2),
    },
    instalmentTitle: {
      fontSize: widthToDp(4.5),
      color: isDarkTheme ? '#cccccc' : '#333333',
      fontWeight: '500',
    },
    sipId: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#888888' : '#666666',
    },
    instalmentsList: {
      paddingHorizontal: widthToDp(4),
    },
    instalmentItem: {
      paddingVertical: heightToDp(1),
      borderBottomWidth: 1,
      borderBottomColor: isDarkTheme ? '#333333' : '#e0e0e0',
      width: '100%',
    },
    instalmentContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    instalmentLeft: {},
    instalmentNumber: {
      fontSize: widthToDp(4.5),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '600',
      marginBottom: heightToDp(1.5),
    },
    instalmentDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: heightToDp(1),
      width: '100%',
    },
    detailColumn: {},
    modalContentWrapper: {
      paddingHorizontal: widthToDp(4),
      paddingBottom: heightToDp(10),
    },
    closeButtonCircle: {
      width: widthToDp(8),
      height: widthToDp(8),
      borderRadius: widthToDp(4),
      backgroundColor: isDarkTheme ? '#3A3A3A' : '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modalTitleUnderline: {
      width: widthToDp(12),
      height: 3,
      backgroundColor: Config.Colors.primary,
      borderRadius: 2,
      marginTop: heightToDp(0.5),
    },
    detailLabel: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#888888' : '#666666',
      marginBottom: heightToDp(0.5),
    },
    detailValue: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '500',
      textAlign: 'center',
    },
    statusText: {
      color: '#4caf50',
      fontSize: widthToDp(3),
      fontWeight: '600',
    },
    noDataText: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#888888' : '#666666',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    bottomSpacing: {
      height: heightToDp(10),
    },
    buttonContainer: {
      paddingHorizontal: widthToDp(4),
      paddingVertical: heightToDp(3),
      backgroundColor: isDarkTheme ? '#1a1a1a' : Config.Colors.cyan_blue,
    },
    reorderButton: {
      backgroundColor: Config.Colors.primary,
      paddingVertical: heightToDp(2),
      borderRadius: widthToDp(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    reorderButtonText: {
      color: '#ffffff',
      fontSize: widthToDp(4.5),
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDarkTheme ? '#2A2A2A' : '#FFFFFF',
      borderTopLeftRadius: widthToDp(8),
      borderTopRightRadius: widthToDp(8),
      paddingBottom:
        Platform.OS === 'ios' ? heightToDp(6) : heightToDp(3),
      maxHeight: screenHeight * 0.85,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: widthToDp(5),
      paddingVertical: heightToDp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkTheme ? '#3A3A3A' : '#F0F0F0',
    },
    modalTitle: {
      fontSize: widthToDp(4.8),
      fontWeight: '700',
      color: isDarkTheme ? '#FFFFFF' : '#1A1A1A',
      textAlign: 'left',
    },
    closeButton: {
      padding: widthToDp(1),
    },
    closeButtonText: {
      fontSize: widthToDp(5),
      color: isDarkTheme ? '#CCCCCC' : '#666666',
      fontWeight: '300',
      lineHeight: widthToDp(5),
    },
    modalTitleContainer: {
      flex: 1,
    },
    customizeSubtitle: {
      fontSize: widthToDp(3.8),
      color: isDarkTheme ? '#AAAAAA' : '#666666',
      textAlign: 'center',
      marginBottom: heightToDp(3),
      lineHeight: widthToDp(5),
      paddingHorizontal: widthToDp(2),
    },
    customizeOption: {
      marginBottom: heightToDp(1.5),
      borderRadius: widthToDp(3),
      backgroundColor: isDarkTheme ? '#363636' : '#FFFFFF',
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDarkTheme ? 0.1 : 0.05,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: heightToDp(2),
      paddingHorizontal: widthToDp(3),
    },
    optionArrowContainer: {
      paddingLeft: widthToDp(2),
    },
    optionIcon: {
      width: widthToDp(10),
      height: widthToDp(10),
      borderRadius: widthToDp(5),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: widthToDp(4),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    optionIconText: {
      fontSize: widthToDp(4.5),
      fontWeight: '600',
    },
    optionTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    optionTitle: {
      fontSize: widthToDp(4.2),
      fontWeight: '600',
      color: isDarkTheme ? '#FFFFFF' : '#1A1A1A',
      marginBottom: heightToDp(0.5),
    },
    optionDescription: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#BBBBBB' : '#666666',
      lineHeight: widthToDp(4.5),
    },
    modalContent: {
      paddingBottom: heightToDp(1),
      flexGrow: 1,
    },
    optionArrow: {
      fontSize: widthToDp(6),
      color: isDarkTheme ? '#666666' : '#CCCCCC',
      fontWeight: '300',
    },
    pauseLabel: {
      fontSize: widthToDp(4.5),
      fontWeight: '500',
      color: isDarkTheme ? '#ffffff' : '#000000',
      textAlign: 'center',
    },
    sliderContainer: {
      marginVertical: heightToDp(1),
    },
    slider: {
      width: '100%',
      height: heightToDp(5),
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: heightToDp(1),
      paddingHorizontal: widthToDp(2),
    },
    sliderLabelText: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#cccccc' : '#666666',
    },
    cancelLabel: {
      fontSize: widthToDp(4),
      fontWeight: '500',
      color: isDarkTheme ? '#ffffff' : '#000000',
      textAlign: 'start',
      marginBottom: heightToDp(2),
    },
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      paddingHorizontal: widthToDp(3),
      paddingVertical: heightToDp(1.5),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      marginBottom: heightToDp(1),
    },
    dropdownButtonText: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#ffffff' : '#000000',
      flex: 1,
    },
    dropdownIcon: {
      fontSize: widthToDp(3),
      color: isDarkTheme ? '#cccccc' : '#666666',
    },
    dropdownContainer: {
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      marginBottom: heightToDp(2),
      maxHeight: heightToDp(30),
    },
    dropdownItem: {
      paddingHorizontal: widthToDp(3),
      paddingVertical: heightToDp(1.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkTheme ? '#444444' : '#f0f0f0',
    },
    dropdownItemText: {
      fontSize: widthToDp(3.8),
      color: isDarkTheme ? '#ffffff' : '#000000',
    },
    reasonInputContainer: {
      marginBottom: heightToDp(2),
    },
    reasonInputLabel: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(1),
      fontWeight: '500',
    },
    reasonInput: {
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      paddingHorizontal: widthToDp(3),
      paddingVertical: heightToDp(1.5),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: widthToDp(4),
      minHeight: heightToDp(10),
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: widthToDp(3),
      color: isDarkTheme ? '#888888' : '#666666',
      textAlign: 'right',
      marginTop: heightToDp(0.5),
    },
    submitButtonDisabled: {
      backgroundColor: isDarkTheme ? '#555555' : '#cccccc',
    },
    selectedValueText: {
      fontSize: widthToDp(4.5),
      fontWeight: '500',
      color: isDarkTheme ? '#ffffff' : '#000000',
      textAlign: 'center',
    },
    submitButton: {
      backgroundColor: Config.Colors.primary,
      paddingVertical: heightToDp(1.5),
      borderRadius: widthToDp(8),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: heightToDp(2),
    },
    submitButtonText: {
      color: 'black',
      fontSize: widthToDp(4.5),
      fontWeight: '600',
    },
    customSliderContainer: {
      height: heightToDp(5),
      justifyContent: 'center',
    },
    customSliderTrack: {
      height: 4,
      backgroundColor: '#d3d3d3',
      borderRadius: 2,
      position: 'relative',
      width: 280,
    },
    customSliderMinimumTrack: {
      height: 4,
      borderRadius: 2,
      position: 'absolute',
      left: 0,
      top: 0,
    },
    customSliderThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      position: 'absolute',
      top: -10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    thumbStyle: {
      backgroundColor: Config.Colors.primary,
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
      elevation: 5,
    },
    trackStyle: {
      height: 8,
      borderRadius: 4,
    },
    stepUpScrollView: {
      flexGrow: 1,
      paddingBottom: heightToDp(1),
    },
    stepUpLabel: {
      fontSize: widthToDp(4.5),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      textAlign: 'center',
      marginBottom: heightToDp(3),
    },
    durationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: widthToDp(3),
    },
    durationButton: {
      flex: 1,
      paddingVertical: heightToDp(1.5),
      paddingHorizontal: widthToDp(2),
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      alignItems: 'center',
    },
    durationButtonActive: {
      backgroundColor: Config.Colors.primary,
      borderColor: Config.Colors.primary,
    },
    durationButtonText: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '500',
    },
    durationButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    incrementTypeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: widthToDp(3),
    },
    incrementTypeButton: {
      flex: 1,
      paddingVertical: heightToDp(1.5),
      paddingHorizontal: widthToDp(2),
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      alignItems: 'center',
    },
    incrementTypeButtonActive: {
      backgroundColor: Config.Colors.primary,
      borderColor: Config.Colors.primary,
    },
    incrementTypeButtonText: {
      fontSize: widthToDp(3.3),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '500',
      textAlign: 'center',
    },
    incrementTypeButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    helperText: {
      fontSize: widthToDp(3.2),
      color: isDarkTheme ? '#888888' : '#666666',
      fontStyle: 'italic',
      marginTop: heightToDp(0.8),
      lineHeight: widthToDp(4.5),
    },
    stepUpSummary: {
      backgroundColor: isDarkTheme ? '#333333' : '#f0f8ff',
      borderRadius: widthToDp(3),
      padding: widthToDp(3),
      marginBottom: heightToDp(2),
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#e3f2fd',
      borderLeftWidth: 4,
      borderLeftColor: '#4caf50',
    },
    highlightRow: {
      backgroundColor: isDarkTheme ? '#2d4a32' : '#e8f5e8',
      marginHorizontal: -widthToDp(3),
      paddingHorizontal: widthToDp(3),
      borderRadius: widthToDp(1),
      marginTop: heightToDp(1),
    },
    highlightValue: {
      color: '#4caf50',
      fontSize: widthToDp(4.2),
      fontWeight: '700',
    },
    redemptionLabel: {
      fontSize: widthToDp(4.5),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      textAlign: 'center',
      marginBottom: heightToDp(3),
    },
    formGroup: {
      marginBottom: heightToDp(2.5),
    },
    formLabel: {
      fontSize: widthToDp(4),
      fontWeight: '500',
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(1),
    },
    formInput: {
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      paddingHorizontal: widthToDp(3),
      paddingVertical: heightToDp(1.5),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: widthToDp(4),
      minHeight: heightToDp(6),
    },
  });

export default SipInterface;
