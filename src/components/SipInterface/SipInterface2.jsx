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
} from 'react-native';
import { PixelRatio } from 'react-native';
import { useSelector } from 'react-redux';
import SInfoSvg from '../../presentation/svgs';
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import CustomSlider from '../CustomSlider';
import { apiPostService } from '../../helpers/services';
import { getData } from '../../helpers/localStorage';

const { height: screenHeight } = Dimensions.get('window');

const SipInterface = ({ navigation }) => {
  const Data = useSelector(state => state.marketWatch.sipInterface);
  console.log('SIPINTERFACE', Data);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [customizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(1);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelOption, setSelectedCancelOption] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [otherReason, setOtherReason] = useState('');
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [pauseSlideAnim] = useState(new Animated.Value(screenHeight));
  const [cancelSlideAnim] = useState(new Animated.Value(screenHeight));

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
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

  const toggleViewMore = () => {
    setShowMoreDetails(!showMoreDetails);
  };

  // Customize SIP Modal functions
  const openCustomizeModal = () => {
    setCustomizeModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeCustomizeModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCustomizeModalVisible(false);
    });
  };

  // Pause SIP Modal functions
  const openPauseModal = () => {
    closeCustomizeModal(); // Close customize modal first
    setTimeout(() => {
      setPauseModalVisible(true);
      Animated.timing(pauseSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const closePauseModal = () => {
    Animated.timing(pauseSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPauseModalVisible(false);
    });
  };

  const handleSliderChange = (setValue, value) => {
    setValue(value);
  };

  const handlePauseSIP = async () => {
    try {
      const response = await apiPostService('/api/v1/order/pause/sip/entry', {
        sipRegistrationNumber: Data?.SIPRegnNo,
        pauseInstNumber: pauseDuration,
      });
      console.log('SIP paused successfully:', response);
      if (response?.status === 200 || response?.status === 201) {
        console.log('SIP paused successfully:', response);
        closePauseModal();
      }
    } catch (error) {
      new Error('Failed to pause SIP:', error);
    }
  };

  // Cancel SIP Modal functions
  const openCancelModal = () => {
    closeCustomizeModal(); // Close customize modal first
    setTimeout(() => {
      setCancelModalVisible(true);
      Animated.timing(cancelSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const closeCancelModal = () => {
    Animated.timing(cancelSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCancelModalVisible(false);
      setSelectedCancelOption('');
      setOtherReason('');
      setShowDropdown(false);
    });
  };

  const handleCancelSIP = async () => {
    console.log('Selected Cancel Option:', String(cancelReason + 1).padStart(2, '0'));

    try {
      const clientCode = await getData("clientCode");
      const cancelReasonText = selectedCancelOption === 'Others (pls specify the reason)'
        ? otherReason
        : selectedCancelOption;

      if (!cancelReasonText) {
        alert('Please select a cancellation reason');
        return;
      }
      console.log('Other Reason:', {
        xsipRegistrationID: Data?.SIPRegnNo,
        remarks: cancelReasonText,
        ceaseBseCode: String(cancelReason + 1).padStart(2, '0')
      });
      const response = await apiPostService(
        '/api/v1/order/cancellation/sip/entry',
        {
          xsipRegistrationID: Data?.SIPRegnNo,
          remarks: cancelReasonText,
          ceaseBseCode: String(cancelReason + 1).padStart(2, '0')
        },
        {
          headers: {
            clientCode: clientCode,
          }
        }
      );

      if (response?.status === 200 || response?.status === 201) {
        console.log('SIP cancelled successfully:', response);
        closeCancelModal();
      }
    } catch (error) {
      console.error('Failed to cancel SIP:', error);
      alert('Failed to cancel SIP. Please try again.');
    }
  };

  const handleModifySIP = () => {
    closeCustomizeModal();
    console.log('Navigate to Modify SIP');
  };

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
    'Others (pls specify the reason)'
  ];

  const styles = getStyles(isDarkTheme);

  // Helper function to format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Helper function to format currency
  const formatCurrency = amount => {
    if (!amount) return '₹0';
    const numAmount = parseFloat(amount);
    if (numAmount >= 1000) {
      return `₹${(numAmount / 1000).toFixed(1)}K`;
    }
    return `₹${numAmount.toFixed(0)}`;
  };

  // Calculate step up amount (mock calculation based on pattern)
  const calculateStepUpAmount = () => {
    // This would be based on your business logic
    return '₹250';
  };

  // Calculate monthly SIP value (current or average)
  const getMonthlyAmount = () => {
    return formatCurrency(Data?.investedAmount || 0);
  };

  // Get total invested value
  const getTotalInvestedValue = () => {
    return formatCurrency(Data?.investedAmount || 0);
  };
    const openRedemptionModal = () => {
    closeCustomizeModal();
    setTimeout(() => {
      setRedemptionModalVisible(true);
      Animated.timing(redemptionSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  };
  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={styles.themeToggleText}>
            {isDarkTheme ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Fund Header */}
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
              {Data?.schemeCode || 'Scheme Code Not Available'}
            </Text>
          </View>
        </View>

        {/* SIP Summary */}
        <View style={styles.sipSummary}>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SIP Invested Value</Text>
            <Text style={styles.summaryValue}>{getTotalInvestedValue()}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current NAV</Text>
            <Text style={styles.summaryValue}>
              ₹{Data?.currentNAV || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Units</Text>
            <Text style={styles.summaryValue}>{Data?.totalUnits || 'N/A'}</Text>
          </View>

          {showMoreDetails && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Folio Number</Text>
                <Text style={styles.summaryValue}>
                  {Data?.folioNo || 'N/A'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Market Price</Text>
                <Text style={styles.summaryValue}>
                  ₹{Data?.currentMarketPrice || 'N/A'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>NAV Date</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(Data?.currentNavDate)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Registration Date</Text>
                <Text style={styles.summaryValue}>
                  {Data?.SIPRegnDate || 'N/A'}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={toggleViewMore}
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

        {/* SIP Instalments Header */}
        <View style={styles.instalmentHeader}>
          <Text style={styles.instalmentTitle}>SIP Instalments</Text>
          <Text style={styles.sipId}>SIP ID: {Data?.SIPRegnNo || 'N/A'}</Text>
        </View>

        {/* SIP Instalments List */}
        <View style={styles.instalmentsList}>
          {Data?.installements && Data.installements.length > 0 ? (
            Data.installements.map((item, index) => (
              <View key={index} style={styles.instalmentItem}>
                <View style={styles.instalmentLeft}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", }}>

                    <Text style={styles.instalmentNumber}>
                      {`${index + 1}${index === 0
                          ? 'st'
                          : index === 1
                            ? 'nd'
                            : index === 2
                              ? 'rd'
                              : 'th'
                        } SIP Instalment`}
                    </Text>
                    <Text style={styles.statusText}>SUCCESS</Text>
                  </View>
                  <View style={styles.instalmentDetails}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Order Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(item.orderDate)}
                      </Text>
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
                      <Text style={styles.detailValue}>
                        {item.orderNo || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Units Allotted</Text>
                      <Text style={styles.detailValue}>
                        {parseFloat(item.allottedUnit || 0).toFixed(4)}
                      </Text>
                    </View>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Settlement</Text>
                      <Text style={styles.detailValue}>
                        {item.settType || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.instalmentItem}>
              <Text style={styles.noDataText}>
                No installment data available
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Customize SIP Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.reorderButton} onPress={openCustomizeModal}>
          <Text style={styles.reorderButtonText}>Customize SIP</Text>
        </TouchableOpacity>
      </View>

      {/* Customize SIP Modal */}
      <Modal
        visible={customizeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCustomizeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            onPress={closeCustomizeModal}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize SIP</Text>
              <TouchableOpacity onPress={closeCustomizeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* <Text style={styles.customizeSubtitle}>Choose an option to customize your SIP</Text> */}

              {/* Pause SIP Option */}
              <TouchableOpacity
                style={styles.customizeOption}
                onPress={openPauseModal}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <Text style={styles.optionIconText}>⏸️</Text>
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Pause SIP</Text>
                    <Text style={styles.optionDescription}>Temporarily pause your SIP for 1-10 months</Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </View>
              </TouchableOpacity>

              {/* Cancel SIP Option */}
              <TouchableOpacity
                style={styles.customizeOption}
                onPress={openCancelModal}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <Text style={styles.optionIconText}>❌</Text>
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Cancel SIP</Text>
                    <Text style={styles.optionDescription}>Permanently cancel your SIP investment</Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </View>
              </TouchableOpacity>

              {/* Modify SIP Option */}
              <TouchableOpacity
                style={styles.customizeOption}
                onPress={openRedemptionModal}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <Text style={styles.optionIconText}>💰</Text>
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Redeem SIP</Text>
                    <Text style={styles.optionDescription}>Set up systematic withdrawal plan for your investment</Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Pause SIP Modal */}
      <Modal
        visible={pauseModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closePauseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            onPress={closePauseModal}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: pauseSlideAnim }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pause Investment</Text>
              <TouchableOpacity onPress={closePauseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.pauseLabel}>Select pause duration ({pauseDuration} month{pauseDuration > 1 ? 's' : ''})</Text>

              <View style={styles.sliderContainer}>
                <CustomSlider
                  value={pauseDuration}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  onValueChange={value =>
                    handleSliderChange(
                      setPauseDuration,
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
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>1</Text>
                  <Text style={styles.sliderLabelText}>10</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePauseSIP}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      {/* Cancel SIP Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            onPress={closeCancelModal}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: cancelSlideAnim }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel SIP</Text>
              <TouchableOpacity onPress={closeCancelModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.cancelLabel}>Please select a reason for cancellation</Text>

              {/* Dropdown for cancellation reasons */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedCancelOption || 'Select reason...'}
                </Text>
                <Text style={styles.dropdownIcon}>
                  {showDropdown ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownContainer}>
                  <FlatList
                    data={cancelOptions}
                    keyExtractor={(item, index) => index.toString()}
                    maxHeight={heightToDp(30)}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          console.log('Selected Cancel Option:', index + 1);
                          setSelectedCancelOption(item);
                          setCancelReason(index);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {`${cancelOptions.indexOf(item) + 1 < 10 ? '0' : ''}${cancelOptions.indexOf(item) + 1} ${item}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              {/* Other reason text input */}
              {selectedCancelOption === 'Others (pls specify the reason)' && (
                <View style={styles.reasonInputContainer}>
                  <Text style={styles.reasonInputLabel}>Please specify your reason:</Text>
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

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedCancelOption ||
                    (selectedCancelOption === 'Others (pls specify the reason)' && !otherReason.trim())
                  ) && styles.submitButtonDisabled
                ]}
                onPress={handleCancelSIP}
                disabled={!selectedCancelOption ||
                  (selectedCancelOption === 'Others (pls specify the reason)' && !otherReason.trim())}
              >
                <Text style={styles.submitButtonText}>Cancel SIP</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
      width: "100%",
    },
    instalmentContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    instalmentLeft: {

    },
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
      width: "100%",
    },
    detailColumn: {

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
      textAlign: "center"
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
      backgroundColor: Config.Colors.secondary,
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      borderWidth: 5,
      borderColor: isDarkTheme ? '#444444' : '#000000',
    },
    modalOverlayTouchable: {
      flex: 1,
    },
    modalContainer: {
      backgroundColor: isDarkTheme ? '#2a2a2a' : '#ffffff',
      borderTopLeftRadius: widthToDp(5),
      borderTopRightRadius: widthToDp(5),
      paddingHorizontal: widthToDp(4),
      paddingBottom: heightToDp(3),
      maxHeight: screenHeight * 0.6,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: heightToDp(1),
      paddingHorizontal: widthToDp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkTheme ? '#444444' : '#e0e0e0',
      marginBottom: heightToDp(2),
    },
    modalTitle: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
    },
    closeButton: {
      padding: widthToDp(2),
    },
    closeButtonText: {
      fontSize: widthToDp(4),
      color: isDarkTheme ? '#cccccc' : '#666666',
    },
    modalContent: {
      // paddingTop: heightToDp(1),
    },
    // Customize Modal Styles
    customizeSubtitle: {
      borderWidth: 1,
      fontSize: widthToDp(3),
      color: isDarkTheme ? '#cccccc' : '#666666',
      textAlign: 'center',
      marginBottom: heightToDp(1),
    },
    customizeOption: {
      marginBottom: heightToDp(1),
      borderRadius: widthToDp(3),
      backgroundColor: isDarkTheme ? '#' : '#f8f9fa',
      // borderWidth: 1,
      // borderColor: isDarkTheme ? '#444444' : '#e9ecef',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: widthToDp(2),
    },
    optionIcon: {
      width: widthToDp(8),
      height: widthToDp(8),
      borderRadius: widthToDp(6),
      backgroundColor: isDarkTheme ? '#444444' : '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: widthToDp(3),
    },
    optionIconText: {
      fontSize: widthToDp(3),
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: widthToDp(4),
      fontWeight: '600',
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginBottom: heightToDp(0.5),
    },
    optionDescription: {
      fontSize: widthToDp(3),
      color: isDarkTheme ? '#cccccc' : '#666666',
      lineHeight: widthToDp(4.5),
    },
    optionArrow: {
      fontSize: widthToDp(6),
      color: isDarkTheme ? '#888888' : '#999999',
      fontWeight: 'bold',
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
      backgroundColor: Config.Colors.secondary,
      paddingVertical: heightToDp(1.5),
      borderRadius: widthToDp(8),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: heightToDp(2),
    },
    submitButtonText: {
      color: '#ffffff',
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
  });

export default SipInterface;