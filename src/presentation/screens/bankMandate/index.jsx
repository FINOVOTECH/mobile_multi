import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  BackHandler,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LottieView from 'lottie-react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import * as Config from '../../../helpers/Config';
import SInfoSvg from '../../svgs';
import axios from 'axios';
import { getData } from '../../../helpers/localStorage';
import Rbutton from '../../../components/Rbutton';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';

const { width, height } = Dimensions.get('window');

const CustomRadioButton = ({
  selected,
  onPress,
  color = Config.Colors.primary,
}) => (
  <TouchableOpacity onPress={onPress} style={{ padding: 5 }}>
    <View style={[styles.radioButtonOuter]}>
      {selected && (
        <View style={[styles.radioButtonInner, { backgroundColor: color }]} />
      )}
    </View>
  </TouchableOpacity>
);

const BankMandate = ({ navigation }) => {
  const dispatch = useDispatch();
  const UserDetails = useSelector(state => state.login.loginData);
  console.log('userDetails', UserDetails);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [mandateUrl, setMandateUrl] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);

  // Validation function
  const validateInputs = () => {
    if (!selectedBank) {
      setApiError('Please select a bank account');
      return false;
    }

    if (!selectedAmount || selectedAmount === '₹ ' || selectedAmount === '') {
      setApiError('Please select or enter an amount');
      return false;
    }

    return true;
  };

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  // Clean amount function to remove currency symbol and commas
  const cleanAmount = amount => {
    return amount.replace(/[₹,\s]/g, '');
  };

  const generateMandateUrl = async (mandateId, attempt = 1) => {
    setIsGeneratingUrl(true);
    setApiError(null);
    setPollingAttempts(attempt);

    console.log(
      `Mandate URL Generation - Attempt ${attempt}/30 for Mandate ID: ${mandateId}`,
    );

    try {
      const Token = await getData(Config.store_key_login_details);
      console.log('Token', Token);
      const response = await fetch(
        'https://onekyc.finovo.tech:8015/api/client/registration/create/e-nach/mandate-url',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            clientcode: UserDetails?.user?.clientCode,
            Authorization: Token,
          },
          body: JSON.stringify({
            mandateId: mandateId,
          }),
        },
      );

      const data = await response.json();
      console.log(`Mandate URL API Response - Attempt ${attempt}:`, data);

      if (response.ok) {
        if (data?.mandateUrl) {
          console.log(
            '✅ Mandate URL successfully generated:',
            data.mandateUrl,
          );
          setMandateUrl(data.mandateUrl);
          setIsGeneratingUrl(false);
          setShowRetryButton(false);
          return;
        } else {
          console.log('⏳ URL not ready yet, continuing polling...');
          // URL not ready yet, continue polling
          if (attempt < 30) {
            // 30 attempts = 1 minute (2 seconds interval)
            setTimeout(() => {
              generateMandateUrl(mandateId, attempt + 1);
            }, 2000);
          } else {
            console.log('❌ Maximum polling attempts reached (1 minute)');
            setApiError(
              'Timeout: Unable to generate mandate URL. Please try again.',
            );
            setIsGeneratingUrl(false);
            setShowRetryButton(true);
          }
        }
      } else {
        console.log(`❌ API Error - Attempt ${attempt}:`, data.message);
        if (attempt < 30) {
          setTimeout(() => {
            generateMandateUrl(mandateId, attempt + 1);
          }, 2000);
        } else {
          throw new Error(
            data.message ||
              'Failed to generate mandate URL after maximum attempts',
          );
        }
      }
    } catch (error) {
      console.error(`❌ Network/Parse Error - Attempt ${attempt}:`, error);
      if (attempt < 30) {
        setTimeout(() => {
          generateMandateUrl(mandateId, attempt + 1);
        }, 2000);
      } else {
        console.error('❌ Final Error after all attempts:', error);
        setApiError(error.message || 'Failed to generate mandate URL');
        setIsGeneratingUrl(false);
        setShowRetryButton(true);
      }
    }
  };

  const callMandateAPI = async () => {
    console.log('🚀 Starting mandate creation process...');
    setIsLoading(true);
    setApiError(null);
    setMandateUrl(null);
    setShowRetryButton(false);
    setPollingAttempts(0);

    console.log('📋 Request payload headers:', {
      'Content-Type': 'application/json',
      clientcode: UserDetails?.user?.clientCode,
      Authorization: `${UserDetails?.accessToken.replace(/^"(.*)"$/, '$1')}`,
    });

    try {
      const cleanedAmount = cleanAmount(selectedAmount);
      console.log('💰 Cleaned amount:', cleanedAmount);

      // Show 2-second loader
      console.log('⏳ Showing 2-second loader...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await axios.post(
        'https://onekyc.finovo.tech:8015/api/client/registration/mandate/amount',
        {
          accountNumber: selectedBank?.accountNumber || '',
          ifscCode: selectedBank?.ifscCode || '',
          amount: cleanedAmount,
          mandateType: 'N',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            clientcode: UserDetails?.user?.clientCode,
            Authorization: `${UserDetails?.accessToken.replace(
              /^"(.*)"$/,
              '$1',
            )}`,
          },
        },
      );

      const data = response.data;
      console.log('✅ Mandate API Response:', data);

      setApiResponse(data);
      setIsLoading(false);

      if (data?.response?.orderNumber) {
        console.log(
          '🔄 Starting mandate URL polling for order:',
          data.response.orderNumber,
        );
        await generateMandateUrl(data.response.orderNumber);
      } else {
        console.log('❌ No order number received in response');
        setApiError('No order number received from mandate creation');
      }
    } catch (error) {
      console.error('❌ Mandate API Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create mandate';
      setApiError(errorMessage);
      setIsLoading(false);
      setShowRetryButton(true);
    }
  };

  const handleConfirm = () => {
    if (validateInputs()) {
      setIsModalVisible(true);
      callMandateAPI();
    }
  };

  const handleChange = amount => {
    setSelectedAmount(amount);
    setApiError(null);
    setAmountInput(amount);
    console.log('amount', amount);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setIsLoading(false);
    setIsGeneratingUrl(false);
    setApiError(null);
    setApiResponse(null);
    setMandateUrl(null);
    setShowRetryButton(false);
    setPollingAttempts(0);
  };

  const handleRetry = () => {
    console.log('🔄 Retry button pressed');
    setApiError(null);
    setShowRetryButton(false);
    if (apiResponse?.response?.orderNumber) {
      // Retry URL generation
      console.log('🔄 Retrying mandate URL generation...');
      generateMandateUrl(apiResponse.response.orderNumber);
    } else {
      // Retry entire process
      console.log('🔄 Retrying entire mandate creation process...');
      callMandateAPI();
    }
  };

  const handleOpenInAppBrowser = async () => {
    console.log('🔗 Opening mandate URL in InAppBrowser:', mandateUrl);

    if (!mandateUrl) {
      Alert.alert('Error', 'No mandate URL available');
      return;
    }

    try {
      // Check if InAppBrowser is properly imported and available
      if (!InAppBrowser || typeof InAppBrowser.isAvailable !== 'function') {
        console.log(
          '⚠️ InAppBrowser not properly imported, falling back to Linking',
        );
        // Fallback to system browser
        await Linking.openURL(mandateUrl);
        closeModal();
        return;
      }

      // Check if InAppBrowser is available
      const isAvailable = await InAppBrowser.isAvailable();

      if (isAvailable) {
        const result = await InAppBrowser.open(mandateUrl, {
          // iOS Options
          dismissButtonStyle: 'close',
          preferredBarTintColor: Config.Colors.primary,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Options
          showTitle: true,
          toolbarColor: Config.Colors.primary,
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'white',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          // Specify animations
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right',
          },
          headers: {
            'user-agent':
              'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36',
          },
        });

        console.log('InAppBrowser result:', result);

        // Handle the result
        if (result.type === 'success') {
          console.log('✅ InAppBrowser opened successfully');
          closeModal();
        } else if (result.type === 'cancel') {
          console.log('❌ User cancelled the browser');
        } else if (result.type === 'dismiss') {
          console.log('📱 Browser was dismissed');
          closeModal();
        }
      } else {
        console.log('⚠️ InAppBrowser not available, falling back to Linking');
        // Fallback to system browser
        await Linking.openURL(mandateUrl);
      }

      // Close the modal after opening browser
      closeModal();
    } catch (error) {
      console.error('❌ Error opening URL:', error);

      // Try fallback to system browser
      try {
        await Linking.openURL(mandateUrl);
        closeModal();
      } catch (linkingError) {
        console.error('❌ Fallback Linking also failed:', linkingError);
        Alert.alert('Error', 'Could not open the mandate URL');
      }
    }
  };

  const handleOpenUrl = () => {
    handleOpenInAppBrowser();
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
          <SInfoSvg.WhiteBackButton />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Register New Mandate</Text>
          <Text style={styles.headerSubtitle}>Select Bank & Amount</Text>
        </View>
      </View>
    </LinearGradient>
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
        {/* Bank Selection Section */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Select Bank Account</Text>
          <View style={styles.bankListContainer}>
            {UserDetails?.user?.accountDetails?.length > 0 ? (
              UserDetails.user.accountDetails.map(item => (
                <TouchableOpacity
                  key={item._id}
                  style={[
                    styles.bankAccount,
                    selectedBank?._id === item._id &&
                      styles.selectedBankAccount,
                  ]}
                  onPress={() => {
                    setApiError(null);
                    // Simply select the bank - no toggle logic
                    setSelectedBank(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.bankRow}>
                    <View style={styles.bankLogoContainer}>
                      <SInfoSvg.BankMandate />
                    </View>

                    <View style={styles.bankInfoContainer}>
                      <Text style={styles.bankName}>{item.bankName}</Text>
                      <Text style={styles.bankDetails}>
                        {item.accountNumber
                          ? `${item.accountNumber.slice(0, 6)}XXXXXX`
                          : 'Account number not available'}
                      </Text>
                      <Text style={styles.bankDetails}>
                        {item.ifscCode
                          ? `${item.ifscCode.slice(0, 6)}XXXX`
                          : 'IFSC code not available'}
                      </Text>
                    </View>

                    <View style={styles.radioContainer}>
                      <CustomRadioButton
                        selected={selectedBank?._id === item._id}
                        onPress={() => {
                          setApiError(null);
                          // Simply select the bank - no toggle logic
                          setSelectedBank(item);
                        }}
                        color={Config.Colors.primary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noBankContainer}>
                <Text style={styles.noBankText}>No bank accounts found</Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount Selection Section */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Auto Pay Amount</Text>

          <View style={styles.amountInputContainer}>
            <TextInput
              placeholder="₹ Enter amount"
              style={styles.amountInput}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={text => {
                let formattedText = text.startsWith('₹') ? text : `₹ ${text}`;
                setAmountInput(formattedText);
                setApiError(null);
                setSelectedAmount(formattedText);
              }}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.amountOptions}>
            {[
              '₹ 15,000',
              '₹ 50,000',
              '₹ 1,00,000',
              '₹ 1,50,000',
              '₹ 2,00,000',
            ].map((amount, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.amountButton,
                  selectedAmount === amount && styles.selectedAmountButton,
                ]}
                onPress={() => handleChange(amount)}
              >
                <Text
                  style={[
                    styles.amountText,
                    selectedAmount === amount && styles.selectedAmountText,
                  ]}
                >
                  {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {apiError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.bottomButtons}>
        <Rbutton
          title="Confirm & Create Mandate"
          onPress={handleConfirm}
          style={styles.confirmButton}
        />
      </View>

      {/* Modal for API Call */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                {isLoading ? (
                  <View style={styles.modalContent}>
                    <LottieView
                      source={require('../../../assets/gif/loader.json')}
                      autoPlay
                      loop={true}
                      style={styles.lottie}
                    />
                    <Text style={styles.loadingText}>Creating mandate...</Text>
                  </View>
                ) : isGeneratingUrl ? (
                  <View style={styles.modalContent}>
                    <LottieView
                      source={require('../../../assets/gif/loader.json')}
                      autoPlay
                      loop={true}
                      style={styles.lottie}
                    />
                    <Text style={styles.loadingText}>
                      Generating mandate URL...
                    </Text>
                  </View>
                ) : apiError ? (
                  <View style={styles.modalContent}>
                    <Text style={styles.errorTitle}>Error</Text>
                    <Text style={styles.modalErrorText}>{apiError}</Text>
                    <View style={styles.modalButtonContainer}>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetry}
                      >
                        <Text style={styles.retryButtonText}>Retry</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={closeModal}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : mandateUrl ? (
                  <View style={styles.modalContent}>
                    <Text style={styles.successTitle}>Success!</Text>
                    <Text style={styles.successText}>
                      Mandate URL generated successfully
                    </Text>
                    <TouchableOpacity
                      style={styles.urlButton}
                      onPress={handleOpenUrl}
                    >
                      <Text style={styles.urlButtonText}>
                        Open Mandate Form
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeModal}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                ) : apiResponse ? (
                  <View style={styles.modalContent}>
                    <Text style={styles.successTitle}>Mandate Created!</Text>
                    <Text style={styles.successText}>
                      Processing URL generation...
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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

  // Bank List Styles
  bankListContainer: {
    marginTop: heightToDp(1),
  },
  bankAccount: {
    marginBottom: heightToDp(1.5),
    padding: widthToDp(3),
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(2),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedBankAccount: {
    borderWidth: 2,
    borderColor: Config.Colors.primary,
    backgroundColor: '#F8F9FF',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogoContainer: {
    width: widthToDp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfoContainer: {
    flex: 1,
    marginLeft: widthToDp(3),
  },
  bankName: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333',
    marginBottom: heightToDp(0.3),
  },
  bankDetails: {
    fontSize: widthToDp(3.2),
    color: '#666',
    marginBottom: heightToDp(0.2),
  },
  radioContainer: {
    width: widthToDp(7),
    height: heightToDp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noBankContainer: {
    padding: heightToDp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBankText: {
    fontSize: widthToDp(4),
    color: '#666',
    textAlign: 'center',
  },

  // Radio Button Styles
  radioButtonOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Config.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Amount Input Styles
  amountInputContainer: {
    marginBottom: heightToDp(2),
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: widthToDp(4),
    borderRadius: widthToDp(2),
    backgroundColor: '#FAFAFA',
    fontSize: widthToDp(4),
    color: '#333',
  },

  // Amount Options Styles
  amountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthToDp(2),
    marginBottom: heightToDp(1),
  },
  amountButton: {
    borderWidth: 1,
    borderColor: Config.Colors.primary,
    paddingVertical: heightToDp(1.25),
    paddingHorizontal: widthToDp(4),
    borderRadius: widthToDp(3),
    backgroundColor: '#FFFFFF',
  },
  selectedAmountButton: {
    backgroundColor: Config.Colors.primary,
  },
  amountText: {
    color: Config.Colors.primary,
    fontSize: widthToDp(3.5),
    fontWeight: '500',
  },
  selectedAmountText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Error Styles
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: widthToDp(3),
    borderRadius: widthToDp(2),
    marginTop: heightToDp(1),
  },
  errorText: {
    color: Config.Colors.red,
    fontSize: widthToDp(3.5),
    textAlign: 'center',
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
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    // Rbutton component handles its own styling
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(4),
    width: widthToDp(85),
    minHeight: heightToDp(30),
    justifyContent: 'center',
    alignItems: 'center',
    padding: widthToDp(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  lottie: {
    width: widthToDp(50),
    height: widthToDp(50),
    marginBottom: heightToDp(2),
  },
  loadingText: {
    fontSize: widthToDp(4),
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: widthToDp(5),
    color: Config.Colors.red,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },
  modalErrorText: {
    fontSize: widthToDp(3.8),
    color: '#666',
    textAlign: 'center',
    marginBottom: heightToDp(3),
    lineHeight: heightToDp(3),
  },
  successTitle: {
    fontSize: widthToDp(5),
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: heightToDp(1),
  },
  successText: {
    fontSize: widthToDp(3.8),
    color: '#666',
    textAlign: 'center',
    marginBottom: heightToDp(3),
    lineHeight: heightToDp(3),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: widthToDp(3),
  },
  retryButton: {
    flex: 1,
    backgroundColor: Config.Colors.primary,
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: widthToDp(3.8),
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: widthToDp(3.8),
    fontWeight: '600',
  },
  urlButton: {
    backgroundColor: Config.Colors.primary,
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
    alignItems: 'center',
    marginBottom: heightToDp(2),
    width: '100%',
  },
  urlButtonText: {
    color: '#FFFFFF',
    fontSize: widthToDp(3.8),
    fontWeight: '600',
  },
});

export default BankMandate;
