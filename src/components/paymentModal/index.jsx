import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  BackHandler,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import { baseUrl, store_key_login_details } from '../../helpers/Config';
import { Direct_Plan, UPI_BANKS } from '../../constant/mapperConstants';
import { useNavigation } from '@react-navigation/native';
import { getData } from '../../helpers/localStorage';

const { width, height } = Dimensions.get('window');

const PAYMENT_METHODS = [
  { key: "DIRECT", label: "Direct Banking", desc: "Secure bank transfer", icon: "🏦", gradient: ['#3b82f6', '#1d4ed8'] },
  { key: "UPI", label: "UPI Payment", desc: "Instant UPI transfer", icon: "📱", gradient: ['#10b981', '#059669'] },
];

const PaymentModal = ({ route, onClose, onSuccess, onError }) => {
  const navigation = useNavigation()
  const paymentData = route?.params?.paymentData;
  console.log("paymentDetails", paymentData);
  const orderId = paymentData?.investmentResponse?.resultText?.orderNumber ||paymentData?.investmentResponse?.resultText?.orderId;
  const amount = paymentData?.amount || "";
  const investmentType = paymentData?.investmentType || "";

  const LoginDetails = useSelector(state => state.login.loginData);

  // State variables
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [neftReference, setNeftReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const [currentStep, setCurrentStep] = useState('form');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankPickerData, setBankPickerData] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentCompleteModal, setShowPaymentCompleteModal] = useState(false);

  // Fallback data
  const [fallbackDetails] = useState({
    user: {
      accountDetails: [{
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        bankBranch: ""
      }]
    }
  });

  // Bank details
  const bankDetails = {
    name: (LoginDetails || fallbackDetails)?.user?.accountDetails?.[0]?.bankName,
    accountNumber: (LoginDetails || fallbackDetails)?.user?.accountDetails?.[0]?.accountNumber,
    ifsc: (LoginDetails || fallbackDetails)?.user?.accountDetails?.[0]?.ifscCode,
    branch: (LoginDetails || fallbackDetails)?.user?.accountDetails?.[0]?.bankBranch,
  };

  // Handle back button for Android
  useEffect(() => {
    const backAction = () => {
      handleCancelPayment();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // Handle cancel payment
  const handleCancelPayment = () => {
    setShowCancelModal(true);
  };

  // Navigate to MarketWatch
  const navigateToMarketWatch = () => {
    setShowCancelModal(false);
    if (onClose) onClose();
    // navigation.navigate('MarketWatch');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Profile' }],
    });
  };

  // Open in browser function
  const openInSameTab = async (htmlContent) => {
    try {
      // Show payment complete modal instead of alert
      setShowPaymentCompleteModal(true);
    } catch (error) {
      console.error('Error opening browser:', error);
      setError('Failed to open payment gateway');
    }
  };

  // Main submit function
  const handleSubmit = async () => {
    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    if (paymentMethod === "DIRECT" && !selectedBankId) {
      setError("Please select a bank for Direct payment.");
      return;
    }

    if (paymentMethod === "UPI" && (!upiId.trim() || !selectedBankId)) {
      setError("Please enter UPI ID and select a bank.");
      return;
    }

    if (paymentMethod === "NEFT" && !neftReference.trim()) {
      setError("Please enter NEFT reference number.");
      return;
    }

    setPaymentAttempted(true);
    setCurrentStep('processing');
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = {
      modeofpayment: paymentMethod,
      bankid: selectedBankId,
      accountnumber: (LoginDetails || fallbackDetails)?.user?.accountDetails?.[0]?.accountNumber,
      ifsc: (LoginDetails || fallbackDetails)?.user?.accountDetails?.[0]?.ifscCode,
      ordernumber: orderId,
      totalamount: amount,
      NEFTreference: paymentMethod === "NEFT" ? neftReference : "",
      mandateid: "",
      vpaid: paymentMethod === "UPI" ? upiId : "",
      loopbackURL: "www.google.com",
      allowloopBack: "www.google.com",
    };
    const Token = await getData(store_key_login_details);
    console.log("Payment payload:", payload);
    console.log("Token", Token);
    try {
      const response = await fetch(`${baseUrl}/api/v1/order/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "clientCode": LoginDetails?.user?.clientCode,
          "Authorization": Token,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

   
  const data = await response.json();
  console.log("Payment response:", data);

  setPaymentResponse(data);

  // ✅ Handle new API structure
  if (data?.success) {
    setSuccess(true);
    setCurrentStep('result');
    setShowPaymentModal(true);
    if (onSuccess) onSuccess(data);
  } else {
    setError(data?.message || "Payment failed. Please try again.");
    setCurrentStep('result');
    setShowPaymentModal(true);
    if (onError) onError(data);
  }

} catch (err) {
  console.error("Payment error:", err);
  setError(err.message || "Payment processing failed. Please try again.");
  setCurrentStep('result');
  if (onError) onError(err);
} finally {
  setLoading(false);
}}

  // Reset form function
  const resetForm = () => {
    setPaymentMethod("");
    setUpiId("");
    setNeftReference("");
    setError(null);
    setSuccess(false);
    setShowPaymentModal(false);
    setPaymentResponse(null);
    setPaymentAttempted(false);
    setCurrentStep('form');
    setSelectedBankId("");
    if (onClose) onClose();
  };

  // Close payment modal function
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentResponse(null);
    setCurrentStep('form');
    setPaymentAttempted(false);
  };

  // Submit disabled logic
  const isSubmitDisabled = !paymentMethod ||
    loading ||
    (paymentMethod === "UPI" && (!upiId.trim() || !selectedBankId)) ||
    (paymentMethod === "NEFT" && !neftReference.trim()) ||
    (paymentMethod === "DIRECT" && !selectedBankId);

  // Bank picker functions
  const openBankPicker = (type) => {
    const data = type === 'DIRECT' ? Direct_Plan : UPI_BANKS;
    setBankPickerData(data || []);
    setShowBankPicker(true);
  };

  const selectBank = (bank) => {
    setSelectedBankId(bank.id);
    setModeOfPayment(paymentMethod);
    setShowBankPicker(false);
  };

  const getSelectedBankName = () => {
    const allBanks = [...(Direct_Plan || []), ...(UPI_BANKS || [])];
    const bank = allBanks.find(b => b.id === selectedBankId);
    return bank?.name || (paymentMethod === "UPI" ? "-- Select UPI App --" : "-- Select Your Bank --");
  };

  const CancelPaymentModal = () => (
    <Modal
      visible={showCancelModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cancelModalContainer}>
          <View style={styles.cancelIconContainer}>
            <Text style={styles.cancelIcon}>⚠️</Text>
          </View>
          <Text style={styles.cancelModalTitle}>Cancel Payment?</Text>
          <Text style={styles.cancelModalMessage}>
            {investmentType === "SIP"
              ? "If you cancel now, your SIP will still be activated and future payments will be debited through mandate on the selected dates."
              : "Are you sure you want to cancel this payment? You can complete it later from your orders section."
            }
          </Text>
          <View style={styles.cancelModalButtons}>
            <TouchableOpacity
              onPress={() => setShowCancelModal(false)}
              style={styles.cancelModalSecondaryButton}
            >
              <Text style={styles.cancelModalSecondaryText}>Continue Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={navigateToMarketWatch}
              style={styles.cancelModalPrimaryButton}
            >
              <Text style={styles.cancelModalPrimaryText}>Yes, Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Payment Complete Modal Component
  const PaymentCompleteModal = () => (
    <Modal
      visible={showPaymentCompleteModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPaymentCompleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.paymentCompleteContainer}>
          <View style={styles.paymentCompleteIconContainer}>
            <Text style={styles.paymentCompleteIcon}>💳</Text>
          </View>
          <Text style={styles.paymentCompleteTitle}>Complete Your Payment</Text>
          <Text style={styles.paymentCompleteMessage}>
            You will be redirected to your bank's secure payment gateway. Please complete the payment process and return to the app.
          </Text>
          <View style={styles.paymentCompleteInfo}>
            <View style={styles.paymentInfoRow}>
              <Text style={styles.paymentInfoLabel}>Amount:</Text>
              <Text style={styles.paymentInfoValue}>₹{amount}</Text>
            </View>
            <View style={styles.paymentInfoRow}>
              <Text style={styles.paymentInfoLabel}>Order ID:</Text>
              <Text style={styles.paymentInfoValue}>{orderId}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowPaymentCompleteModal(false);
              navigateToMarketWatch();
            }}
            style={styles.paymentCompleteButton}
          >
            <Text style={styles.paymentCompleteButtonText}>Complete Process</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Bank Picker Modal Component
  const BankPickerModal = () => (
    <Modal
      visible={showBankPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowBankPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bankPickerContainer}>
          <View style={styles.bankPickerHeader}>
            <Text style={styles.bankPickerTitle}>
              {paymentMethod === "UPI" ? "Select UPI App" : "Select Your Bank"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowBankPicker(false)}
              style={styles.headerCloseButton}
            >
              <Text style={styles.headerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
            {bankPickerData.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={styles.bankItem}
                onPress={() => selectBank(bank)}
              >
                <View style={styles.bankItemContent}>
                  <View style={styles.bankItemIcon}>
                    <Text style={styles.bankItemIconText}>🏦</Text>
                  </View>
                  <Text style={styles.bankItemText}>{bank.name}</Text>
                  <Text style={styles.bankItemArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );


const PaymentResponseModal = ({ response, onClose }) => {
  const isSuccess = response?.success === true;
  const messageText = response?.message || "Something went wrong.";

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.responseModalContainer}>
          <View style={styles.responseModalContent}>
            {/* Status Icon */}
            <View style={[
              styles.statusIconContainer,
              { backgroundColor: isSuccess ? '#dcfce7' : '#fef2f2' }
            ]}>
              <Text style={[
                styles.statusIcon,
                { color: isSuccess ? '#16a34a' : '#dc2626' }
              ]}>
                {isSuccess ? '✓' : '✕'}
              </Text>
            </View>

            {/* Status Text */}
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {isSuccess ? "Payment Initiated!" : "Payment Failed"}
              </Text>
              <Text style={styles.statusMessage}>
                {messageText}
              </Text>
            </View>

            {/* Order Summary Card */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID:</Text>
                <Text style={styles.summaryValue}>{orderId}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={[styles.summaryValue, styles.amountHighlight]}>₹{amount}</Text>
              </View>
              {response?.internalRefNo && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Reference:</Text>
                  <Text style={styles.summaryValue}>{response.internalRefNo}</Text>
                </View>
              )}
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                navigateToMarketWatch();
              }}
              style={[
                styles.continueButton,
                { backgroundColor: isSuccess ? '#16a34a' : '#dc2626' }
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


  // Processing Animation Component
  const ProcessingAnimation = () => (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.processingOverlay}>
        <View style={styles.processingContent}>
          <View style={styles.processingIconContainer}>
            <ActivityIndicator size="large" color="#6366f1" style={styles.processingSpinner} />
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text style={styles.processingTitle}>Processing Your Payment</Text>
          <Text style={styles.processingMessage}>
            Please wait while we securely process your transaction...
          </Text>
          <View style={styles.processingDots}>
            <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
            <View style={[styles.dot, { backgroundColor: '#6366f1', opacity: 0.7 }]} />
            <View style={[styles.dot, { backgroundColor: '#6366f1', opacity: 0.4 }]} />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Show processing animation if in processing step
  if (currentStep === 'processing') {
    return <ProcessingAnimation />;
  }

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="slide"
      onRequestClose={handleCancelPayment}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <View style={styles.mainContainer}>
        {/* Enhanced Header with Gradient Effect */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.shieldContainer}>
                  <Text style={styles.shieldIcon}>🛡️</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Secure Payment</Text>
                  <Text style={styles.headerSubtitle}>256-bit SSL encrypted</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleCancelPayment} style={styles.headerCloseButton}>
                <Text style={styles.headerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Status Messages - Only show after payment attempt */}
            {paymentAttempted && (
              <View style={styles.statusMessagesContainer}>
                {success && !showPaymentModal ? (
                  <View style={styles.successAlert}>
                    <View style={styles.successIconSmall}>
                      <Text style={styles.successIconSmallText}>✓</Text>
                    </View>
                    <View style={styles.alertTextContainer}>
                      <Text style={styles.alertTitle}>Payment Initiated Successfully!</Text>
                      <Text style={styles.alertMessage}>Your payment is being processed</Text>
                    </View>
                  </View>
                ) : error ? (
                  <View style={styles.errorAlert}>
                    <View style={styles.errorIconSmall}>
                      <Text style={styles.errorIconSmallText}>✕</Text>
                    </View>
                    <View style={styles.alertTextContainer}>
                      <Text style={styles.alertTitle}>Payment Failed!</Text>
                      <Text style={styles.alertMessage}>{error}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* Enhanced Order Summary */}
            <View style={styles.orderSummarySection}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionIcon}>📋</Text>
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>
              <View style={styles.orderSummaryGrid}>
                <View style={styles.orderSummaryItem}>
                  <Text style={styles.orderSummaryLabel}>Order ID</Text>
                  <Text style={styles.orderSummaryValue}>{orderId}</Text>
                </View>
                <View style={styles.orderSummaryItem}>
                  <Text style={styles.orderSummaryLabel}>Amount to Pay</Text>
                  <Text style={styles.orderSummaryAmount}>₹{amount}</Text>
                </View>
              </View>
              <View style={styles.investmentTypeContainer}>
                <Text style={styles.investmentTypeLabel}>Investment Type:</Text>
                <View style={styles.investmentTypeBadge}>
                  <Text style={styles.investmentTypeText}>{investmentType}</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Payment Method Selection */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionIcon}>💳</Text>
                <Text style={styles.sectionTitle}>Choose Payment Method</Text>
              </View>
              <View style={styles.paymentMethodsContainer}>
                {PAYMENT_METHODS.map(({ key, label, desc, icon, gradient }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setPaymentMethod(key)}
                    disabled={loading}
                    style={[
                      styles.paymentMethodCard,
                      paymentMethod === key && styles.paymentMethodCardSelected,
                      loading && styles.disabled
                    ]}
                  >
                    <View style={styles.paymentMethodContent}>
                      <View style={[
                        styles.paymentMethodIcon,
                        paymentMethod === key && styles.paymentMethodIconSelected
                      ]}>
                        <Text style={styles.paymentMethodIconText}>{icon}</Text>
                      </View>
                      <View style={styles.paymentMethodTextContainer}>
                        <Text style={[
                          styles.paymentMethodLabel,
                          paymentMethod === key && styles.paymentMethodLabelSelected
                        ]}>
                          {label}
                        </Text>
                        <Text style={styles.paymentMethodDesc}>{desc}</Text>
                      </View>
                    </View>
                    {paymentMethod === key && (
                      <View style={styles.selectedCheck}>
                        <Text style={styles.selectedCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Method-specific inputs */}
            {paymentMethod === "DIRECT" && (
              <View style={styles.section}>
                <Text style={styles.inputLabel}>Select Your Bank</Text>
                <TouchableOpacity
                  onPress={() => openBankPicker('DIRECT')}
                  style={styles.bankSelector}
                >
                  <View style={styles.bankSelectorContent}>
                    <Text style={styles.bankSelectorIcon}>🏦</Text>
                    <Text style={[
                      styles.bankSelectorText,
                      selectedBankId && styles.bankSelectorTextSelected
                    ]}>
                      {getSelectedBankName()}
                    </Text>
                  </View>
                  <Text style={styles.bankSelectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            )}

            {paymentMethod === "UPI" && (
              <View style={styles.section}>
                <Text style={styles.inputLabel}>Enter UPI ID</Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi"
                  editable={!loading}
                  style={[styles.textInput, loading && styles.disabled]}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={[styles.inputLabel, { marginTop: heightToDp(3) }]}>Select UPI App</Text>
                <TouchableOpacity
                  onPress={() => openBankPicker('UPI')}
                  style={styles.bankSelector}
                >
                  <View style={styles.bankSelectorContent}>
                    <Text style={styles.bankSelectorIcon}>📱</Text>
                    <Text style={[
                      styles.bankSelectorText,
                      selectedBankId && styles.bankSelectorTextSelected
                    ]}>
                      {getSelectedBankName()}
                    </Text>
                  </View>
                  <Text style={styles.bankSelectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            )}

            {paymentMethod === "NEFT" && (
              <View style={styles.section}>
                <Text style={styles.inputLabel}>NEFT Reference Number</Text>
                <TextInput
                  value={neftReference}
                  onChangeText={setNeftReference}
                  placeholder="Enter NEFT reference number"
                  editable={!loading}
                  style={[styles.textInput, loading && styles.disabled]}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}

            {/* Enhanced Bank Details for NEFT */}
            {paymentMethod === "NEFT" && (
              <View style={styles.bankDetailsCard}>
                <View style={styles.bankDetailsHeader}>
                  <Text style={styles.bankDetailsIcon}>💼</Text>
                  <Text style={styles.bankDetailsTitle}>Bank Details for NEFT Transfer</Text>
                </View>
                <View style={styles.bankDetailsGrid}>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Bank Name</Text>
                    <Text style={styles.bankDetailValue}>{bankDetails.name}</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Account Number</Text>
                    <Text style={styles.bankDetailValue}>{bankDetails.accountNumber}</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>IFSC Code</Text>
                    <Text style={styles.bankDetailValue}>{bankDetails.ifsc}</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Branch</Text>
                    <Text style={styles.bankDetailValue}>{bankDetails.branch}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Enhanced Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                onPress={handleCancelPayment}
                disabled={loading}
                style={[styles.cancelButton, loading && styles.disabled]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
                style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
              >
                {loading ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.submitButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Text style={styles.lockIconSmall}>🔒</Text>
                    <Text style={styles.submitButtonText}>Pay Securely ₹{amount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Enhanced Security Badge */}
            <View style={styles.securityBadge}>
              <Text style={styles.securityIcon}>🔐</Text>
              <Text style={styles.securityText}>
                Your payment is secured with 256-bit SSL encryption
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <CancelPaymentModal />
      <PaymentCompleteModal />
      <BankPickerModal />

      {/* Payment Response Modal */}
      {showPaymentModal && paymentResponse && (
        <PaymentResponseModal
          response={paymentResponse}
          onClose={closePaymentModal}
        />
      )}
    </Modal>
  );
};

export default PaymentModal;

const styles = StyleSheet.create({
  // Main Container
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header Styles
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: heightToDp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  headerGradient: {
    paddingHorizontal: widthToDp(4),
    paddingBottom: heightToDp(2),
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  shieldContainer: {
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: widthToDp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthToDp(3),
  },

  shieldIcon: {
    fontSize: widthToDp(5),
  },

  headerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: heightToDp(0.5),
  },

  headerSubtitle: {
    fontSize: widthToDp(3),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  headerCloseButton: {
    width: widthToDp(8),
    height: widthToDp(8),
    borderRadius: widthToDp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCloseText: {
    color: '#ffffff',
    fontSize: widthToDp(4),
    fontWeight: '600',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  content: {
    padding: widthToDp(4),
    paddingBottom: heightToDp(10),
  },

  // Status Messages
  statusMessagesContainer: {
    marginBottom: heightToDp(3),
  },

  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
    borderWidth: 1,
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
  },

  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
    borderWidth: 1,
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
  },

  successIconSmall: {
    width: widthToDp(8),
    height: widthToDp(8),
    borderRadius: widthToDp(4),
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthToDp(3),
  },

  successIconSmallText: {
    color: '#ffffff',
    fontSize: widthToDp(3.5),
    fontWeight: '600',
  },

  errorIconSmall: {
    width: widthToDp(8),
    height: widthToDp(8),
    borderRadius: widthToDp(4),
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthToDp(3),
  },

  errorIconSmallText: {
    color: '#ffffff',
    fontSize: widthToDp(3.5),
    fontWeight: '600',
  },

  alertTextContainer: {
    flex: 1,
  },

  alertTitle: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#111827',
    marginBottom: heightToDp(0.5),
  },

  alertMessage: {
    fontSize: widthToDp(3),
    color: '#6b7280',
  },

  // Section Styles
  section: {
    marginBottom: heightToDp(3),
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightToDp(2),
  },

  sectionIcon: {
    fontSize: widthToDp(4.5),
    marginRight: widthToDp(2),
  },

  sectionTitle: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#111827',
  },

  // Order Summary
  orderSummarySection: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    padding: widthToDp(4),
    marginBottom: heightToDp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  orderSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(2),
  },

  orderSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  orderSummaryLabel: {
    fontSize: widthToDp(3),
    color: '#6b7280',
    marginBottom: heightToDp(1),
    fontWeight: '500',
  },

  orderSummaryValue: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#111827',
  },

  orderSummaryAmount: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#16a34a',
  },

  investmentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: heightToDp(2),
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },

  investmentTypeLabel: {
    fontSize: widthToDp(3),
    color: '#6b7280',
    marginRight: widthToDp(2),
  },

  investmentTypeBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: widthToDp(3),
    paddingVertical: heightToDp(0.5),
    borderRadius: widthToDp(2),
  },

  investmentTypeText: {
    fontSize: widthToDp(3),
    fontWeight: '600',
    color: '#4f46e5',
  },

  // Payment Methods
  paymentMethodsContainer: {
    gap: heightToDp(2),
  },

  paymentMethodCard: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    padding: widthToDp(4),
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  paymentMethodCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#f8faff',
  },

  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  paymentMethodIcon: {
    width: widthToDp(12),
    height: widthToDp(12),
    borderRadius: widthToDp(6),
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthToDp(3),
  },

  paymentMethodIconSelected: {
    backgroundColor: '#e0e7ff',
  },

  paymentMethodIconText: {
    fontSize: widthToDp(5),
  },

  paymentMethodTextContainer: {
    flex: 1,
  },

  paymentMethodLabel: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#111827',
    marginBottom: heightToDp(0.5),
  },

  paymentMethodLabelSelected: {
    color: '#4f46e5',
  },

  paymentMethodDesc: {
    fontSize: widthToDp(3),
    color: '#6b7280',
  },

  selectedCheck: {
    width: widthToDp(6),
    height: widthToDp(6),
    borderRadius: widthToDp(3),
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCheckText: {
    color: '#ffffff',
    fontSize: widthToDp(3),
    fontWeight: '600',
  },

  // Input Styles
  inputLabel: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#374151',
    marginBottom: heightToDp(1),
  },

  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: widthToDp(3),
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    fontSize: widthToDp(3.5),
    color: '#111827',
  },

  // Bank Selector
  bankSelector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: widthToDp(3),
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bankSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  bankSelectorIcon: {
    fontSize: widthToDp(4),
    marginRight: widthToDp(3),
  },

  bankSelectorText: {
    fontSize: widthToDp(3.5),
    color: '#9ca3af',
  },

  bankSelectorTextSelected: {
    color: '#111827',
    fontWeight: '500',
  },

  bankSelectorArrow: {
    fontSize: widthToDp(3),
    color: '#6b7280',
  },

  // Bank Details Card
  bankDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    padding: widthToDp(4),
    marginBottom: heightToDp(3),
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  bankDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightToDp(2),
  },

  bankDetailsIcon: {
    fontSize: widthToDp(4),
    marginRight: widthToDp(2),
  },

  bankDetailsTitle: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#111827',
  },

  bankDetailsGrid: {
    gap: heightToDp(1.5),
  },

  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: heightToDp(0.5),
  },

  bankDetailLabel: {
    fontSize: widthToDp(3),
    color: '#6b7280',
    fontWeight: '500',
  },

  bankDetailValue: {
    fontSize: widthToDp(3),
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: widthToDp(2),
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: widthToDp(3),
    marginTop: heightToDp(4),
    marginBottom: heightToDp(3),
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#6b7280',
  },

  submitButton: {
    flex: 2,
    backgroundColor: '#4f46e5',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  submitButtonText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#ffffff',
  },

  lockIconSmall: {
    fontSize: widthToDp(3.5),
    marginRight: widthToDp(2),
  },

  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthToDp(2),
  },

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(1.5),
    paddingHorizontal: widthToDp(4),
  },

  securityIcon: {
    fontSize: widthToDp(3.5),
    marginRight: widthToDp(2),
  },

  securityText: {
    fontSize: widthToDp(3),
    color: '#16a34a',
    fontWeight: '500',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: widthToDp(4),
  },

  // Cancel Modal
  cancelModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    padding: widthToDp(6),
    width: '100%',
    maxWidth: widthToDp(85),
    alignItems: 'center',
  },

  cancelIconContainer: {
    width: widthToDp(16),
    height: widthToDp(16),
    borderRadius: widthToDp(8),
    backgroundColor: '#fef3cd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightToDp(2),
  },

  cancelIcon: {
    fontSize: widthToDp(8),
  },

  cancelModalTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },

  cancelModalMessage: {
    fontSize: widthToDp(3.5),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: widthToDp(5),
    marginBottom: heightToDp(3),
  },

  cancelModalButtons: {
    flexDirection: 'row',
    gap: widthToDp(3),
    width: '100%',
  },

  cancelModalSecondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2),
    alignItems: 'center',
  },

  cancelModalSecondaryText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#374151',
  },

  cancelModalPrimaryButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2),
    alignItems: 'center',
  },

  cancelModalPrimaryText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#ffffff',
  },

  // Payment Complete Modal
  paymentCompleteContainer: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    padding: widthToDp(6),
    width: '100%',
    maxWidth: widthToDp(85),
    alignItems: 'center',
  },

  paymentCompleteIconContainer: {
    width: widthToDp(16),
    height: widthToDp(16),
    borderRadius: widthToDp(8),
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightToDp(2),
  },

  paymentCompleteIcon: {
    fontSize: widthToDp(8),
  },

  paymentCompleteTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },

  paymentCompleteMessage: {
    fontSize: widthToDp(3.5),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: widthToDp(5),
    marginBottom: heightToDp(3),
  },

  paymentCompleteInfo: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginBottom: heightToDp(3),
  },

  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightToDp(1),
  },

  paymentInfoLabel: {
    fontSize: widthToDp(3),
    color: '#6b7280',
    fontWeight: '500',
  },

  paymentInfoValue: {
    fontSize: widthToDp(3),
    color: '#111827',
    fontWeight: '600',
  },

  paymentCompleteButton: {
    backgroundColor: '#4f46e5',
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2.5),
    paddingHorizontal: widthToDp(8),
    alignItems: 'center',
  },

  paymentCompleteButtonText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#ffffff',
  },

  // Bank Picker Modal
  bankPickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    width: '100%',
    maxWidth: widthToDp(90),
    maxHeight: heightToDp(70),
  },

  bankPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: widthToDp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  bankPickerTitle: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#111827',
  },

  bankList: {
    maxHeight: heightToDp(50),
  },

  bankItem: {
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  bankItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bankItemIcon: {
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: widthToDp(5),
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthToDp(3),
  },

  bankItemIconText: {
    fontSize: widthToDp(4),
  },

  bankItemText: {
    flex: 1,
    fontSize: widthToDp(3.5),
    color: '#111827',
    fontWeight: '500',
  },

  bankItemArrow: {
    fontSize: widthToDp(4),
    color: '#6b7280',
  },

  // Payment Response Modal
  responseModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    width: '100%',
    maxWidth: widthToDp(90),
    maxHeight: heightToDp(80),
  },

  responseModalContent: {
    padding: widthToDp(6),
    alignItems: 'center',
  },

  statusIconContainer: {
    width: widthToDp(20),
    height: widthToDp(20),
    borderRadius: widthToDp(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightToDp(3),
  },

  statusIcon: {
    fontSize: widthToDp(10),
    fontWeight: '700',
  },

  statusTextContainer: {
    alignItems: 'center',
    marginBottom: heightToDp(3),
  },

  statusTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },

  statusMessage: {
    fontSize: widthToDp(3.5),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: widthToDp(5),
  },

  orderSummaryCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    marginBottom: heightToDp(3),
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightToDp(1.5),
  },

  summaryLabel: {
    fontSize: widthToDp(3),
    color: '#6b7280',
    fontWeight: '500',
  },

  summaryValue: {
    fontSize: widthToDp(3),
    color: '#111827',
    fontWeight: '600',
  },

  amountHighlight: {
    fontSize: widthToDp(3.5),
    color: '#16a34a',
    fontWeight: '700',
  },

  continueButton: {
    borderRadius: widthToDp(3),
    paddingVertical: heightToDp(2.5),
    paddingHorizontal: widthToDp(8),
    alignItems: 'center',
    minWidth: widthToDp(40),
  },

  continueButtonText: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    color: '#ffffff',
  },

  // Processing Animation
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  processingContent: {
    backgroundColor: '#ffffff',
    borderRadius: widthToDp(4),
    padding: widthToDp(8),
    alignItems: 'center',
    width: widthToDp(80),
  },

  processingIconContainer: {
    position: 'relative',
    marginBottom: heightToDp(3),
  },

  processingSpinner: {
    transform: [{ scale: 1.5 }],
  },

  lockIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -widthToDp(2) }, { translateY: -widthToDp(2) }],
    fontSize: widthToDp(4),
  },

  processingTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },

  processingMessage: {
    fontSize: widthToDp(3.5),
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: heightToDp(3),
  },

  processingDots: {
    flexDirection: 'row',
    gap: widthToDp(2),
  },

  dot: {
    width: widthToDp(2),
    height: widthToDp(2),
    borderRadius: widthToDp(1),
  },

  // Common States
  disabled: {
    opacity: 0.6,
  },
});
