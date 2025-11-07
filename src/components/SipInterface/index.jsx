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
} from 'react-native';
import { useSelector } from 'react-redux';
import SInfoSvg from '../../presentation/svgs';
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import CustomSlider from '../CustomSlider';
import { apiPostService } from '../../helpers/services';
import { getData } from '../../helpers/localStorage';
import Rbutton from '../Rbutton';
import InvestedPorfolio from '../../hooks/investedPortfolio';

const { height: screenHeight } = Dimensions.get('window');

const SipInterface = ({ navigation }) => {
  const Data = useSelector(state => state.marketWatch.sipInterface);
  // console.log('SIP INTERFACE', Data);
  const { investmentData, loading, error, refetch } = InvestedPorfolio();
    // console.log('SIP INTERFACE INSIDE', investmentData);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [customizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
const steps = [3, 6, 9, 12];
const [pauseDuration, setPauseDuration] = useState(steps[0]);
  const [selectedCancelOption, setSelectedCancelOption] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [otherReason, setOtherReason] = useState('');
  const [loader, setLoading] = useState(false);
  const [redemptionModalVisible, setRedemptionModalVisible] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [redemptionSlideAnim] = useState(new Animated.Value(screenHeight));
  const [redemptionForm, setRedemptionForm] = useState({
  clientCode: "",
  schemeCode: "",
  folioNo: "",
  allUnitsFlag: "N",
  redemptionAmount: "",
  redemptionUnits: ""
});
  const [stepUpModalVisible, setStepUpModalVisible] = useState(false);
  const [stepUpSlideAnim] = useState(new Animated.Value(screenHeight));
  const [stepUpForm, setStepUpForm] = useState({
    duration: 'YEARLY',
    sipInstallmentAmount: '',
    incrementType: 'percentage', // 'percentage' or 'amount'
    nextSipIncrementPercentage: '',
    nextSipIncrementByAmount: '',
  });

  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [pauseSlideAnim] = useState(new Animated.Value(screenHeight));
  const [cancelSlideAnim] = useState(new Animated.Value(screenHeight));

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
  const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const [switchSlideAnim] = useState(new Animated.Value(screenHeight));

  const [switchForm, setSwitchForm] = useState({
    fromSchemeCd: '',
    toSchemeCd: '',
    switchAmount: '',
    allUnitsFlag: 'N', // "Y" = All Units, "N" = Partial
    buySellType: 'FRESH', // "FRESH" or "ADDITIONAL"
    folioNo: '', // Required only for physical clients
    remarks: 'Client initiated switch order',
  });
  const [matchedHolding, setMatchedHolding] = useState(null);
  const [matchedData, setMatchedData] = useState(null);

useEffect(() => {
  if (investmentData?.holdings && Data?.ISIN) {
    const found = investmentData.holdings.find(
      (h) => h?.ISIN === Data?.ISIN
    );
    setMatchedHolding(found);
    console.log("MATCHED HOLDIGNG", found)
  }
  if (investmentData?.holdings && Data?.ISIN) {
    const found = investmentData.bseAllotments.find(
      (h) => h?.ISIN === Data?.ISIN
    );
    setMatchedData(found);
    console.log("MATCHED DATA", found)
  }
}, [investmentData, Data]);

useEffect(()=>{
  console.log("MATCHED DATA USEEFFECT", matchedData?.allottedUnit)
  if(matchedData){
    setRedemptionForm((prev)=>({
   ...prev,
  clientCode: "",
  schemeCode: matchedData?.schemeCode || "",
  folioNo: matchedData?.FolioNo || "",
  allUnitsFlag: "N",
  redemptionAmount: "",
  redemptionUnits: matchedData?.allottedUnit 
    }))
  }
},[])

  const openSwitchModal = () => {
    closeCustomizeModal();
    setTimeout(() => {
      setSwitchModalVisible(true);
      animateModal(switchSlideAnim, 0);
    }, 300);
  };
  const closeSwitchModal = () => setSwitchModalVisible(false);

  const updateSwitchForm = (field, value) =>
    setSwitchForm(prev => ({ ...prev, [field]: value }));
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );
    return () => backHandler.remove();
  }, [navigation]);

  const showResponseMessage = (title, message, isSuccess = true) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', style: isSuccess ? 'default' : 'cancel' }],
      { cancelable: false },
    );
  };

  const animateModal = (animValue, toValue, callback = null) => {
    Animated.timing(animValue, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const openCustomizeModal = () => {
    setCustomizeModalVisible(true);
    animateModal(slideAnim, 0);
  };

  const closeCustomizeModal = () => {
    animateModal(slideAnim, screenHeight, () => {
      setCustomizeModalVisible(false);
    });
  };

  const openPauseModal = () => {
    closeCustomizeModal();
    setTimeout(() => {
      setPauseModalVisible(true);
      animateModal(pauseSlideAnim, 0);
    }, 300);
  };

  const closePauseModal = () => {
    animateModal(pauseSlideAnim, screenHeight, () => {
      setPauseModalVisible(false);
    });
  };

  const openCancelModal = () => {
    closeCustomizeModal();
    setTimeout(() => {
      setCancelModalVisible(true);
      animateModal(cancelSlideAnim, 0);
    }, 300);
  };

  const closeCancelModal = () => {
    animateModal(cancelSlideAnim, screenHeight, () => {
      setCancelModalVisible(false);
      setSelectedCancelOption('');
      setOtherReason('');
      setShowDropdown(false);
    });
  };

  const handlePauseSIP = async () => {
    if (!matchedData?.SIPRegnNo) {
      showResponseMessage('Error', 'SIP Registration Number not found', false);
      return;
    }

    setLoading(true);
    console.log("VALUES",matchedData.SIPRegnNo)
    try {
      const response = await apiPostService('/api/v1/order/pause/sip/entry', {
        sipRegistrationNumber: matchedData.SIPRegnNo,
        pauseInstNumber: String(pauseDuration),
      });
console.log("PAUSE RES", response)
      const isSuccess = response?.status === 200 || response?.status === 201;

      if (isSuccess) {
        showResponseMessage(
          'Success',
          response?.data?.message ||
            `SIP paused successfully for ${pauseDuration} month${
              pauseDuration > 1 ? 's' : ''
            }`,
        );
        closePauseModal();
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

    if (!matchedData?.SIPRegnNo) {
      showResponseMessage('Error', 'SIP Registration Number not found', false);
      return;
    }

    setLoading(true);
    try {
      const clientCode = await getData('clientCode');
      const cancelReasonIndex = cancelOptions.findIndex(
        option => option === selectedCancelOption,
      );

      const response = await apiPostService(
        '/api/v1/order/cancellation/sip/entry',
        {
          xsipRegistrationID: matchedData.SIPRegnNo,
          remarks: "",
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
        closeCancelModal();
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

  const openRedemptionModal = () => {
    closeCustomizeModal();
    setTimeout(() => {
      setRedemptionModalVisible(true);
      animateModal(redemptionSlideAnim, 0);
    }, 300);
  };

  const closeRedemptionModal = () => {
    if (showOtpInput) return; // Prevent closing during OTP verification
    animateModal(redemptionSlideAnim, screenHeight, () => {
      setRedemptionModalVisible(false);
      setShowOtpInput(false);
      setOtp('');
     
    });
  };


  const handleSwitchSIP = async () => {
    // ✅ Validate required fields
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
      // ✅ Get clientCode from local storage
      const clientCode = await getData('clientCode');

      // ✅ Prepare payload based on API structure
      const payload = {
        fromSchemeCd: Data.schemeCode,
        toSchemeCd: switchForm.toSchemeCd,
        switchAmount: switchForm.switchAmount,
        allUnitsFlag: switchForm.allUnitsFlag,
        buySellType: switchForm.buySellType,
        folioNo: switchForm.folioNo, // required only for Physical clients
        remarks: switchForm.remarks || 'Client initiated switch order',
      };

      // ✅ Call API using existing service
      const response = await apiPostService(
        '/api/v1/mutualfund/switch-order',
        payload,
        {
          headers: {
            Authorization: authToken, // make sure you have this token available
            clientCode,
            'Content-Type': 'application/json',
          },
        },
      );

      // ✅ Handle success / failure response
      if (response?.status === 200 || response?.status === 201) {
        showResponseMessage(
          'Success',
          'Switch SIP request submitted successfully.',
        );
        closeSwitchModal();
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
// ✅ Redemption API Function
const handleRedemptionSubmit = async () => {
  if (!redemptionForm.redemptionUnits) {
    showResponseMessage('Error', 'Please enter redemption units', false);
    return;
  }

  setLoading(true);
  try {
    const clientCode = await getData('clientCode');

    const payload = {
      clientCode: matchedData?.clientCode ,
      schemeCode: matchedData?.schemeCode,
      folioNo: matchedData?.FolioNo ,
      allUnitsFlag: 'N',
      redemptionAmount: '',
      redemptionUnits: redemptionForm.redemptionUnits,
    };

    console.log('🛰️ Redemption Payload:', payload);

    const response = await apiPostService(
      '/api/v1/order/redemption/entry',
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
      closeRedemptionModal();
      setRedemptionForm({
        redemptionUnits: '',
      });
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

  const openStepUpModal = () => {
    closeCustomizeModal();
    setTimeout(() => {
      setStepUpModalVisible(true);
      animateModal(stepUpSlideAnim, 0);
    }, 300);
  };

  const closeStepUpModal = () => {
    animateModal(stepUpSlideAnim, screenHeight, () => {
      setStepUpModalVisible(false);
      setStepUpForm({
        duration: 'YEARLY',
        sipInstallmentAmount: '',
        incrementType: 'percentage',
        nextSipIncrementPercentage: '',
        nextSipIncrementByAmount: '',
      });
    });
  };

  const updateStepUpForm = (field, value) => {
    setStepUpForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStepUpSIP = async () => {
    if (!matchedData?.schemeCode) {
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
    try {
      const clientCode = await getData('clientCode');
      const requestBody = {
        schemaCode: matchedData?.schemeCode,
        sipOrderId: matchedData?.SIPRegnNo || '12345', // Use actual SIP ID or fallback
        duration: stepUpForm.duration,
        sipInstallmentAmount: stepUpForm.sipInstallmentAmount,
      };

      // Add increment field based on selected type
      if (stepUpForm.incrementType === 'percentage') {
        requestBody.nextSipIncrementPercentage =
          stepUpForm.nextSipIncrementPercentage;
      } else {
        requestBody.nextSipIncrementByAmount =
          stepUpForm.nextSipIncrementByAmount;
      }

      const response = await apiPostService(
        '/api/v1/order/stepup/sip/entry',
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
        closeStepUpModal();
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

  const formatDateForInput = dateStr => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(
        2,
        '0',
      )}`;
    }
    return dateStr;
  };

  const formatDateForAPI = dateStr => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

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
      }}
    >
      <Text style={styles.dropdownItemText}>
        {`${String(index + 1).padStart(2, '0')} ${item}`}
      </Text>
    </TouchableOpacity>
  );

  const renderModal = (visible, animValue, onClose, title, children) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: animValue }] },
          ]}
        >
          {/* Modal Header with Gradient */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.modalTitleUnderline} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonCircle}>
                <Text style={styles.closeButtonText}>×</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContentWrapper}>{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fundHeader}>
          <View style={styles.fundIconWrapper}>
            <View style={styles.fundIcon}>
              <Image
                source={{ uri: Data?.amcLogoUrl }}
                style={{ width: 40, height: 40, borderRadius: 25 }}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.fundDetails}>
            <Text style={styles.fundName}>
              {Data?.schemeName || 'Scheme Name Not Available'}
            </Text>
            <Text style={styles.monthlyText}>
              {matchedData?.schemeCode || 'Scheme Code Not Available'}
            </Text>
          </View>
        </View>

        <View style={styles.sipSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SIP Invested Value</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(matchedHolding?.currentValue || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current NAV</Text>
            <Text style={styles.summaryValue}>
              ₹{matchedHolding?.currentNAV || 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Units</Text>
            <Text style={styles.summaryValue}>{matchedHolding?.displayUnits || 'N/A'}</Text>
          </View>

          {showMoreDetails && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Folio Number</Text>
                <Text style={styles.summaryValue}>
                  {matchedHolding?.folioNo || 'N/A'}
                </Text>
              </View>
              {Data?.schemeName.includes("ETF") && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Current Market Price</Text>
                  <Text style={styles.summaryValue}>
                    ₹{matchedHolding?.currentValue || 'N/A'}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>NAV Date</Text>
                <Text style={styles.summaryValue}>
                  {matchedHolding?.currentNAV}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Registration Number</Text>
                <Text style={styles.summaryValue}>
                  {matchedData?.SIPRegnNo || 'N/A'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Registration Date</Text>
                <Text style={styles.summaryValue}>
                  {matchedData?.SIPRegnDate || 'N/A'}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => setShowMoreDetails(!showMoreDetails)}
          >
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
      {renderModal(
        stepUpModalVisible,
        stepUpSlideAnim,
        closeStepUpModal,
        'SIP Step-Up',
        <View style={styles.modalContent}>
          <ScrollView
            style={styles.stepUpScrollView}
            contentContainerStyle={{ paddingBottom: heightToDp(3) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepUpLabel}>
              Configure your SIP step-up plan
            </Text>

            {/* Current SIP Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Current SIP Installment Amount *
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter current SIP amount (e.g., 2000)"
                placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
                value={matchedHolding?.allotedAmount}
                onChangeText={value =>
                  updateStepUpForm('sipInstallmentAmount', value)
                }
                keyboardType="numeric"
              />
            </View>

            {/* Duration Selection */}
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
                    onPress={() => updateStepUpForm('duration', duration)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        stepUpForm.duration === duration &&
                          styles.durationButtonTextActive,
                      ]}
                    >
                      {duration === 'HALFYEARLY' ? 'Half Yearly' : 'Yearly'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Increment Type Selection */}
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
                  }
                >
                  <Text
                    style={[
                      styles.incrementTypeButtonText,
                      stepUpForm.incrementType === 'percentage' &&
                        styles.incrementTypeButtonTextActive,
                    ]}
                  >
                    By Percentage (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.incrementTypeButton,
                    stepUpForm.incrementType === 'amount' &&
                      styles.incrementTypeButtonActive,
                  ]}
                  onPress={() => updateStepUpForm('incrementType', 'amount')}
                >
                  <Text
                    style={[
                      styles.incrementTypeButtonText,
                      stepUpForm.incrementType === 'amount' &&
                        styles.incrementTypeButtonTextActive,
                    ]}
                  >
                    By Amount (₹)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Increment Value Input */}
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

            {/* Step-Up Summary */}
            <View style={styles.stepUpSummary}>
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
                    <Text style={[styles.summaryValue, styles.highlightValue]}>
                      ₹
                      {stepUpForm.incrementType === 'percentage'
                        ? Math.round(
                            parseFloat(stepUpForm.sipInstallmentAmount || 0) *
                              (1 +
                                parseFloat(
                                  stepUpForm.nextSipIncrementPercentage || 0,
                                ) /
                                  100),
                          )
                        : parseFloat(stepUpForm.sipInstallmentAmount || 0) +
                          parseFloat(stepUpForm.nextSipIncrementByAmount || 0)}
                    </Text>
                  </View>
                )}
            </View>

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
        </View>,
      )}

      {renderModal(
        customizeModalVisible,
        slideAnim,
        closeCustomizeModal,
        'Customize Your SIP',
        <View style={styles.modalContent}>
          <Text style={styles.customizeSubtitle}>
            Choose an option to manage your SIP investment
          </Text>

          {[
            {
              icon: '⏸️',
              title: 'Pause SIP',
              description: 'Temporarily pause your SIP for 1-10 months',
              onPress: openPauseModal,
              color: '#FFA500',
            },
            {
              icon: '❌',
              title: 'Cancel SIP',
              description: 'Permanently cancel your SIP investment',
              onPress: openCancelModal,
              color: '#FF4444',
            },
            {
              icon: '📈',
              title: 'Step-up SIP',
              description: 'Increase your SIP amount periodically',
              onPress: openStepUpModal,
              color: '#4CAF50',
            },
            {
              icon: '💰',
              title: 'SIP Redemption',
              description: 'Redeem units from your SIP investment',
              onPress: openRedemptionModal,
              color: '#2196F3',
            },
            {
              icon: '🔄',
              title: 'Switch SIP',
              description: 'Switch your SIP to another mutual fund scheme',
              onPress: openSwitchModal,
              color: '#9C27B0',
            },
          ].map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.customizeOption,
                { borderLeftColor: option.color },
              ]}
              onPress={option.onPress}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: `${option.color}20` },
                  ]}
                >
                  <Text
                    style={[styles.optionIconText, { color: option.color }]}
                  >
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
          ))}
        </View>,
      )}

      {renderModal(
        pauseModalVisible,
        pauseSlideAnim,
        closePauseModal,
        'Pause Investment',
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
            // style={styles.submitButton} // optional extra styling
            // textStyle={styles.submitButtonText} // optional extra text styling
          />
        </View>,
      )}

      {renderModal(
        cancelModalVisible,
        cancelSlideAnim,
        closeCancelModal,
        'Cancel SIP',
        <View style={styles.modalContent}>
          <Text style={styles.cancelLabel}>
            Please select a reason for cancellation
          </Text>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
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
                maxHeight={heightToDp(30)}
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
            // style={styles.submitButton}
            // textStyle={styles.submitButtonText}
            disabled={
              loader ||
              !selectedCancelOption ||
              (selectedCancelOption === 'Others (pls specify the reason)' &&
                !otherReason.trim())
            }
          />
        </View>,
      )}

     {renderModal(
  redemptionModalVisible,
  redemptionSlideAnim,
  closeRedemptionModal,
  'SIP Redemption',
  <View style={styles.modalContent}>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.redemptionLabel}>
        Redeem units from your SIP investment
      </Text>

      {/* Scheme Code (Read-only) */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Scheme Code</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
          value={matchedData?.schemeCode || 'N/A'}
          editable={false}
        />
      </View>

      {/* Client Code (Read-only) */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Client Code</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
          value={'SM099'}
          editable={false}
        />
      </View>

      {/* Folio Number (Read-only) */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Folio Number</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
          value={matchedHolding?.folioNo || 'N/A'}
          editable={false}
        />
      </View>

      {/* All Units Flag (Read-only) */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>All Units Flag</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
          value={'N'}
          editable={false}
        />
      </View>

      {/* Redemption Amount (Read-only) */}
      {/* <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Redemption Amount</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: '#f0f0f0' }]}
          value={'-'}
          editable={false}
        />
      </View> */}

      {/* Redemption Units (Editable) */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Redemption Units *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter units to redeem (e.g., 2)"
          placeholderTextColor={isDarkTheme ? '#888888' : '#999999'}
          value={redemptionForm.redemptionUnits}
          onChangeText={(value) =>
            setRedemptionForm((prev) => ({
              ...prev,
              redemptionUnits: value,
            }))
          }
          keyboardType="numeric"
        />
      </View>

      {/* Submit Button */}
      <Rbutton
        title="Submit Redemption"
        loader={loader}
        onPress={handleRedemptionSubmit}
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
        disabled={loader || !redemptionForm.redemptionUnits}
      />
    </ScrollView>
  </View>,
)}
      {renderModal(
        switchModalVisible,
        switchSlideAnim,
        closeSwitchModal,
        'Switch SIP',
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={styles.stepUpLabel}>
              Switch your SIP investment from one scheme to another
            </Text>

            {/* From Scheme Code */}
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

            {/* To Scheme Code */}
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

            {/* Switch Amount */}
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

            {/* All Units Flag */}
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
                    onPress={() => updateSwitchForm('allUnitsFlag', flag)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        switchForm.allUnitsFlag === flag &&
                          styles.durationButtonTextActive,
                      ]}
                    >
                      {flag === 'Y' ? 'Yes (All Units)' : 'No (Partial)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Buy/Sell Type */}
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
                    onPress={() => updateSwitchForm('buySellType', type)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        switchForm.buySellType === type &&
                          styles.durationButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Folio Number (optional) */}
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
        </View>,
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
      // backgroundColor: 'black',
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: widthToDp(4),
    },
    backButton: {
      // padding: widthToDp(2),
    },
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
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalOverlayTouchable: {
      flex: 1,
    },
    modalContainer: {
      backgroundColor: isDarkTheme ? '#2A2A2A' : '#FFFFFF',
      borderTopLeftRadius: widthToDp(8),
      borderTopRightRadius: widthToDp(8),
      paddingBottom: Platform.OS === 'ios' ? heightToDp(6) : heightToDp(3),
      maxHeight: screenHeight * 0.85,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
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
    // Customize Modal Styles
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
    // Pause Modal Styles
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
    // Cancel Modal Styles
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
      // marginVertical: heightToDp(2),
    },
    submitButton: {
      backgroundColor: Config.Colors.primary,
      paddingVertical: heightToDp(1.5),
      borderRadius: widthToDp(8),
      alignItems: 'center',
      justifyContent: 'center',
      marginbottom: heightToDp(2),
    },
    submitButtonText: {
      color: 'black',
      fontSize: widthToDp(4.5),
      fontWeight: '600',
    },
    // Custom Slider Styles
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
    // Custom Slider Styles
    stepUpContainer: {
      marginBottom: heightToDp(2),
      padding: widthToDp(3),
      backgroundColor: isDarkTheme ? '#333333' : '#f0f8ff',
      borderRadius: widthToDp(3),
      borderLeftWidth: 4,
      borderLeftColor: '#4caf50',
    },

    stepUpTitle: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(1),
    },

    stepUpDescription: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#cccccc' : '#666666',
      lineHeight: widthToDp(5),
    },

    stepUpAmountContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: heightToDp(1),
      paddingTop: heightToDp(1),
      borderTopWidth: 1,
      borderTopColor: isDarkTheme ? '#444444' : '#e0e0e0',
    },

    stepUpAmountLabel: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#cccccc' : '#666666',
    },

    stepUpAmountValue: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: '#4caf50',
    },

    // SIP Redemption specific styles
    redemptionContainer: {
      marginBottom: heightToDp(2),
      padding: widthToDp(3),
      backgroundColor: isDarkTheme ? '#333333' : '#fff8f0',
      borderRadius: widthToDp(3),
      borderLeftWidth: 4,
      borderLeftColor: '#ff9800',
    },

    redemptionTitle: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(1),
    },

    redemptionDescription: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#cccccc' : '#666666',
      lineHeight: widthToDp(5),
    },

    redemptionDetailsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: heightToDp(1),
      paddingTop: heightToDp(1),
      borderTopWidth: 1,
      borderTopColor: isDarkTheme ? '#444444' : '#e0e0e0',
    },

    redemptionDetailItem: {
      alignItems: 'center',
    },

    redemptionDetailLabel: {
      fontSize: widthToDp(3),
      color: isDarkTheme ? '#888888' : '#999999',
      marginBottom: heightToDp(0.5),
    },

    redemptionDetailValue: {
      fontSize: widthToDp(3.5),
      fontWeight: '600',
      color: '#ff9800',
    },

    // Enhanced option styles for new buttons
    optionIconStepUp: {
      width: widthToDp(8),
      height: widthToDp(8),
      borderRadius: widthToDp(6),
      backgroundColor: '#e8f5e8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: widthToDp(3),
    },

    optionIconRedemption: {
      width: widthToDp(8),
      height: widthToDp(8),
      borderRadius: widthToDp(6),
      backgroundColor: '#fff3e0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: widthToDp(3),
    },

    // Loading states for buttons
    loadingButton: {
      backgroundColor: isDarkTheme ? '#555555' : '#cccccc',
      opacity: 0.7,
    },

    loadingText: {
      color: isDarkTheme ? '#888888' : '#999999',
    },

    // Success/Error message styles
    messageContainer: {
      padding: widthToDp(3),
      borderRadius: widthToDp(2),
      marginBottom: heightToDp(2),
    },

    successMessage: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      borderWidth: 1,
    },

    errorMessage: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      borderWidth: 1,
    },

    messageText: {
      fontSize: widthToDp(3.5),
      textAlign: 'center',
    },

    successText: {
      color: '#155724',
    },

    errorText: {
      color: '#721c24',
    },
    //-------------------------------------------------------
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

    frequencyContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: widthToDp(2),
    },

    frequencyButton: {
      flex: 1,
      paddingVertical: heightToDp(1.5),
      paddingHorizontal: widthToDp(2),
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      alignItems: 'center',
    },

    frequencyButtonActive: {
      backgroundColor: Config.Colors.primary,
      borderColor: Config.Colors.primary,
    },

    frequencyButtonText: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '500',
    },

    frequencyButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },

    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: heightToDp(2.5),
      paddingVertical: heightToDp(1),
    },

    checkbox: {
      width: widthToDp(6),
      height: widthToDp(6),
      borderWidth: 2,
      borderColor: isDarkTheme ? '#666666' : '#cccccc',
      borderRadius: widthToDp(1),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      marginRight: widthToDp(3),
      alignItems: 'center',
      justifyContent: 'center',
    },

    checkboxChecked: {
      backgroundColor: Config.Colors.primary,
      borderColor: Config.Colors.primary,
    },

    checkboxTick: {
      color: '#ffffff',
      fontSize: widthToDp(4),
      fontWeight: 'bold',
    },

    checkboxLabel: {
      fontSize: widthToDp(3.8),
      color: isDarkTheme ? '#ffffff' : '#000000',
      flex: 1,
      lineHeight: widthToDp(5),
    },

    redemptionSummary: {
      backgroundColor: isDarkTheme ? '#333333' : '#f8f9fa',
      borderRadius: widthToDp(3),
      padding: widthToDp(4),
      marginBottom: heightToDp(2.5),
      borderWidth: 1,
      borderColor: isDarkTheme ? '#444444' : '#e9ecef',
    },

    summaryTitle: {
      fontSize: widthToDp(4.5),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(2),
      textAlign: 'center',
    },

    redemptionSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: heightToDp(0.8),
      borderBottomWidth: 1,
      borderBottomColor: isDarkTheme ? '#444444' : '#e9ecef',
    },

    redemptionSummaryLabel: {
      fontSize: widthToDp(3.8),
      color: isDarkTheme ? '#cccccc' : '#666666',
      flex: 1,
    },

    redemptionSummaryValue: {
      fontSize: widthToDp(3.8),
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontWeight: '600',
      textAlign: 'right',
    },

    // Enhanced input focus styles
    formInputFocused: {
      borderColor: Config.Colors.primary,
      borderWidth: 2,
      shadowColor: Config.Colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    // Validation styles
    formInputError: {
      borderColor: '#dc3545',
      borderWidth: 2,
    },

    errorText: {
      color: '#dc3545',
      fontSize: widthToDp(3),
      marginTop: heightToDp(0.5),
      fontStyle: 'italic',
    },

    // Required field indicator
    requiredIndicator: {
      color: '#dc3545',
      fontSize: widthToDp(4),
      fontWeight: 'bold',
    },
    // OTP Verification Styles
    otpTitle: {
      fontSize: widthToDp(5),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      textAlign: 'center',
      marginBottom: heightToDp(1),
    },

    otpSubtitle: {
      fontSize: widthToDp(3.8),
      color: isDarkTheme ? '#cccccc' : '#666666',
      textAlign: 'center',
      marginBottom: heightToDp(3),
      lineHeight: widthToDp(5),
    },

    otpContainer: {
      alignItems: 'center',
      marginBottom: heightToDp(3),
    },

    otpInput: {
      borderWidth: 2,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(3),
      paddingHorizontal: widthToDp(4),
      paddingVertical: heightToDp(2),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: widthToDp(6),
      fontWeight: '600',
      letterSpacing: widthToDp(2),
      textAlign: 'center',
      width: widthToDp(60),
      minHeight: heightToDp(7),
    },

    otpInputFocused: {
      borderColor: Config.Colors.primary,
      borderWidth: 3,
      shadowColor: Config.Colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },

    otpNote: {
      fontSize: widthToDp(3.2),
      color: isDarkTheme ? '#ff9999' : '#dc3545',
      textAlign: 'center',
      marginTop: heightToDp(2),
      fontStyle: 'italic',
      lineHeight: widthToDp(4.5),
    },

    // Enhanced modal styles for OTP mode
    modalContainerOtp: {
      backgroundColor: isDarkTheme ? '#2a2a2a' : '#ffffff',
      borderTopLeftRadius: widthToDp(5),
      borderTopRightRadius: widthToDp(5),
      paddingHorizontal: widthToDp(4),
      paddingBottom: heightToDp(3),
      maxHeight: screenHeight * 0.5, // Smaller height for OTP view
    },

    // Loading indicator for OTP verification
    otpLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    otpLoadingText: {
      marginLeft: widthToDp(2),
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#ffffff' : '#000000',
    },

    // Security notice styles
    securityNotice: {
      backgroundColor: isDarkTheme ? '#1a3a5c' : '#e3f2fd',
      borderRadius: widthToDp(2),
      padding: widthToDp(3),
      marginBottom: heightToDp(2),
      borderLeftWidth: 4,
      borderLeftColor: Config.Colors.primary,
    },

    securityNoticeText: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#bbdefb' : '#1565c0',
      lineHeight: widthToDp(4.8),
    },

    // OTP digits individual styling (if you want to show 4 separate boxes)
    otpDigitsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: widthToDp(8),
      marginBottom: heightToDp(3),
    },

    otpDigitBox: {
      width: widthToDp(12),
      height: widthToDp(12),
      borderWidth: 2,
      borderColor: isDarkTheme ? '#444444' : '#d0d0d0',
      borderRadius: widthToDp(2),
      backgroundColor: isDarkTheme ? '#333333' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },

    otpDigitBoxFilled: {
      borderColor: Config.Colors.primary,
      backgroundColor: isDarkTheme ? '#1a3a5c' : '#e3f2fd',
    },

    otpDigitText: {
      fontSize: widthToDp(5),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
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
    '@media (max-width: 320)': {
      modalContainer: {
        borderTopLeftRadius: widthToDp(6),
        borderTopRightRadius: widthToDp(6),
      },
      optionContent: {
        paddingVertical: heightToDp(1.5),
        paddingHorizontal: widthToDp(2),
      },
      optionIcon: {
        width: widthToDp(8),
        height: widthToDp(8),
        marginRight: widthToDp(3),
      },
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

    // Enhanced form input for step-up
    stepUpFormInput: {
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

    stepUpFormInputFocused: {
      borderColor: '#4caf50',
      borderWidth: 2,
      shadowColor: '#4caf50',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    // Info box styles
    infoBox: {
      backgroundColor: isDarkTheme ? '#1a3a5c' : '#e3f2fd',
      borderRadius: widthToDp(2),
      padding: widthToDp(3),
      marginBottom: heightToDp(2),
      borderLeftWidth: 4,
      borderLeftColor: Config.Colors.primary,
    },

    infoBoxText: {
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#bbdefb' : '#1565c0',
      lineHeight: widthToDp(5),
    },

    infoIcon: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#bbdefb' : '#1565c0',
      marginRight: widthToDp(2),
    },

    // Step-up benefits section
    benefitsContainer: {
      backgroundColor: isDarkTheme ? '#1a2a1a' : '#f0fff0',
      borderRadius: widthToDp(2),
      padding: widthToDp(3),
      marginBottom: heightToDp(2),
      borderLeftWidth: 4,
      borderLeftColor: '#4caf50',
    },

    benefitsTitle: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(1),
    },

    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: heightToDp(0.8),
    },

    benefitBullet: {
      width: widthToDp(1.5),
      height: widthToDp(1.5),
      borderRadius: widthToDp(0.75),
      backgroundColor: '#4caf50',
      marginRight: widthToDp(2),
      marginTop: heightToDp(0.8),
    },

    benefitText: {
      flex: 1,
      fontSize: widthToDp(3.5),
      color: isDarkTheme ? '#cccccc' : '#333333',
      lineHeight: widthToDp(5),
    },
  });

export default SipInterface;