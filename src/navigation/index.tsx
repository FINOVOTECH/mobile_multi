import React, { useEffect, useState, useRef } from 'react';
import {
  NavigationContainer,
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Keyboard,
  Platform,
  Dimensions,
  View,
  BackHandler,
  Alert,
  Vibration,
  Text,
  Animated,
  StyleSheet,
  Image,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { HapticFeedbackTypes, trigger } from 'react-native-haptic-feedback';

import Home from '../presentation/screens/home';
import Profile from '../presentation/screens/profile';
import SIP from '../presentation/screens/sip';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createRouter } from './router';
import { ScreenName } from '../constant/screenName';
import { StackParamList } from './types';
import SipScheme from '../presentation/screens/sipScheme';
import Tracker from '../presentation/screens/tracker';
import Products from '../components/DiversedProduct';
import Setting from '../presentation/screens/settings';
import MarketWatch from '../presentation/screens/marketWatch';
import * as Config from '../helpers/Config';
import SInfoSvg from '../presentation/svgs';
import { heightToDp } from '../helpers/Responsive';
import Account from '../components/Account';
import MandateHistory from '../presentation/screens/mandateHIstory';
import BankMandate from '../presentation/screens/bankMandate';
import Invest from '../presentation/Invest';
import Transaction from '../presentation/screens/transaction';
import SIPCalculator from '../presentation/screens/SIPCalc';
import ToolsAndCalc from '../presentation/screens/toolAndCalc';
import CostOfDelayCalculator from '../presentation/calculator/costOfDelaycalc';
import InvestmentPortfolio from '../components/InvesmentPortfolio';
import InvestmentList from '../presentation/screens/InvestmentList';
import MandateResponse from '../presentation/screens/bankMandate/mandateResponse';
import RegiLogin from '../presentation/registation/login';
import Registration from '../presentation/registation';
import KycRegi from '../presentation/kycFlow';
import PaymentComponent from '../components/paymentModal';
import PaymentModal from '../components/paymentModal';
import { useNavigationState } from '@react-navigation/native';
import PanVerify from '../presentation/screens/tracker/panverify';
import Portfolio from '../presentation/screens/tracker/Portfolio';
import InsidePortfolio from '../presentation/screens/tracker/InsiderTracker';
import SipInterface from '../components/SipInterface';
import SIPPortfolio from '../presentation/screens/Dashboard';
import ReportsScreen from '../presentation/screens/reports';
import HoldingsReportScreen from '../presentation/screens/reports/holdingStatement';
import * as Icons from "../helpers/Icons"
import Biometric from '../components/Biometric';
import BiometricLogin from '../presentation/screens/BiometricLogin';
import ChangePassword from '../components/changePassword';
import SipInterface2 from '../components/SipInterface/SipInterface2';
import NFO from '../presentation/screens/NFO';
const Stack = createNativeStackNavigator<StackParamList>();
const Tab = createBottomTabNavigator();

export const navigationRef = createNavigationContainerRef();
export const Router = createRouter(navigationRef);

const widthToDp = percentage => {
  const { width } = Dimensions.get('window');
  return (width * percentage) / 100;
};

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const triggerHapticFeedback = () => {
  try {
    if (Platform.OS === 'ios') {
      trigger(HapticFeedbackTypes.selection, hapticOptions);
    } else {
      trigger(HapticFeedbackTypes.impactLight, hapticOptions);
      if (Platform.Version >= 21) {
        Vibration.vibrate(50);
      }
    }
  } catch (error) {
    console.log('Haptic feedback not available:', error);
    Vibration.vibrate(50);
  }
};

// Custom Exit Notification Component
const ExitNotification = ({ visible, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide after 2 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        {
          opacity: fadeAnim,
          // transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.notificationCard}>
        <View style={styles.iconContainer}>
          {/* <View style={styles.gradientIcon}>
            <Text style={styles.iconText}>G</Text>
          </View> */}
          <Image
            source={Icons.logo}
            style={{ width: 32, height: 32, borderRadius: 25 }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.notificationText}>Press back again to exit Jyoti MF</Text>
      </View>
    </Animated.View>
  );
};

function BottomTabNavigator() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showExitNotification, setShowExitNotification] = useState(false);
  const [backPressCount, setBackPressCount] = useState(0);
  const backPressTimer = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const currentIndex = navigationRef.getCurrentRoute()?.name;

        if (currentIndex === ScreenName.SipScheme || currentIndex === ScreenName.Track) {
          Router.navigate(ScreenName.Profile);
          return true;
        }

        if (currentIndex === ScreenName.Profile) {
          if (backPressCount === 0) {
            // First back press - show notification
            setBackPressCount(1);
            setShowExitNotification(true);

            // Reset counter after 2 seconds
            backPressTimer.current = setTimeout(() => {
              setBackPressCount(0);
            }, 2000);

            return true;
          } else {
            // Second back press - exit app
            if (backPressTimer.current) {
              clearTimeout(backPressTimer.current);
            }
            BackHandler.exitApp();
            return true;
          }
        }

        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
        if (backPressTimer.current) {
          clearTimeout(backPressTimer.current);
        }
      };
    }, [backPressCount])
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: Config.Colors.white,
          tabBarInactiveTintColor: Config.Colors.white,
          headerShown: false,
          tabBarBackground: () => (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              }}
            />
          ),
          tabBarStyle: {
            height: widthToDp(18),
            backgroundColor: '#2B8DF6',
            position: 'absolute',
            shadowOffset: {
              width: 6,
              height: 14,
            },
            shadowOpacity: 0.25,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: widthToDp(3),
            fontFamily: Config.fontFamilys.Poppins_SemiBold,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 9,
          },
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            let iconComponent;

            const iconContainerStyle = {
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 4,
              paddingTop: 8,
              borderTopWidth: focused ? 3 : 0, 
              borderTopColor: focused ? Config.Colors.white : 'transparent', 
              borderRadius: 2, 
              width: widthToDp(12), 
              height: widthToDp(12),
            };

            if (route.name === ScreenName.Profile) {
              iconComponent = focused ? (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomActiveHome
                    color={Config.Colors.white}
                    width={widthToDp(6)}
                  />
                </View>
              ) : (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomInactiveHome
                    color={Config.Colors.gray}
                    width={widthToDp(6)}
                  />
                </View>
              );
            } else if (route.name === ScreenName.SipScheme) {
              iconComponent = focused ? (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomActiveInvest
                    color={Config.Colors.white}
                    width={widthToDp(6)}
                  />
                </View>
              ) : (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomInactiveInvest
                    color={Config.Colors.gray}
                    width={widthToDp(6)}
                  />
                </View>
              );
            } else if (route.name === ScreenName.Track) {
              iconComponent = focused ? (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomActiveTracker
                    color={Config.Colors.white}
                    width={widthToDp(6)}
                  />
                </View>
              ) : (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomInactiveTracker
                    color={Config.Colors.gray}
                    width={widthToDp(6)}
                  />
                </View>
              );
            } else if (route.name === ScreenName.DashBoard) {
              iconComponent = focused ? (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomActiveDashborad
                    color={Config.Colors.white}
                    width={widthToDp(6)}
                  />
                </View>
              ) : (
                <View style={iconContainerStyle}>
                  <SInfoSvg.BottomInactiveDashborad
                    color={Config.Colors.gray}
                    width={widthToDp(6)}
                  />
                </View>
              );
            }

            return iconComponent;
          },
        })}
        initialRouteName={ScreenName.Profile}
        screenListeners={{
          tabPress: (e) => {
            triggerHapticFeedback();
          },
        }}
      >
        <Tab.Screen
          name={ScreenName.Profile}
          component={Profile}
          options={{
            tabBarLabel: 'Home',
            unmountOnBlur: true,
          }}
        />
        <Tab.Screen
          name={ScreenName.SipScheme}
          component={SipScheme}
          options={{
            tabBarLabel: 'Invest',
            unmountOnBlur: true,
          }}
        />
        <Tab.Screen
          name={ScreenName.DashBoard}
          component={InvestmentList}
          options={{
            tabBarLabel: 'Dashboard',
            unmountOnBlur: true,
          }}
        />
        <Tab.Screen
          name={ScreenName.Track}
          component={Tracker}
          options={{
            tabBarLabel: 'Tracker',
            unmountOnBlur: true,
          }}
        />
      </Tab.Navigator>

      <ExitNotification
        visible={showExitNotification}
        onHide={() => setShowExitNotification(false)}
      />
    </>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >

      <Stack.Screen name={ScreenName.Home} component={Home} />
      <Stack.Screen name={ScreenName.Registration} component={Registration} />
      <Stack.Screen
        name={ScreenName.PaymentComponent}
        component={PaymentModal}
      />
      <Stack.Screen name={ScreenName.KycRegi} component={KycRegi} />
      <Stack.Screen name={ScreenName.Settings} component={Setting} />
      <Stack.Screen name={ScreenName.Account} component={Account} />
      <Stack.Screen
        name={ScreenName.MandateHistory}
        component={MandateHistory}
      />
      <Stack.Screen name={ScreenName.MarketWatch} component={MarketWatch} />
      <Stack.Screen name={ScreenName.BankMandate} component={BankMandate} />
      <Stack.Screen name={ScreenName.Invest} component={Invest} />
      <Stack.Screen name={ScreenName.Transaction} component={Transaction} />
      <Stack.Screen name={ScreenName.SipCalculator} component={SIPCalculator} />
      <Stack.Screen name={ScreenName.ToolsAndCalc} component={ToolsAndCalc} />
      <Stack.Screen name={ScreenName.PanVerify} component={PanVerify} />
      <Stack.Screen name={ScreenName.Portfolio} component={Portfolio} />
      <Stack.Screen name={ScreenName.InsidePortfolio} component={InsidePortfolio} />
      <Stack.Screen name={ScreenName.SipInterface} component={SipInterface} />
      <Stack.Screen name={ScreenName.ReportScreen} component={ReportsScreen} />
      <Stack.Screen name={ScreenName.HoldingStatement} component={HoldingsReportScreen} />
      <Stack.Screen name={ScreenName.BiometricLogin} component={BiometricLogin} />
      <Stack.Screen name={ScreenName.Biometric} component={Biometric} />
      <Stack.Screen name={ScreenName.ChangePassword} component={ChangePassword} />
      <Stack.Screen
        name={ScreenName.InvestmentPortfolio}
        component={InvestmentPortfolio}
      />
      <Stack.Screen
        name={ScreenName.InvestmentList}
        component={InvestmentList}
      />
      <Stack.Screen
        name={ScreenName.MandateProcess}
        component={MandateResponse}
      />
      <Stack.Screen
        name={ScreenName.Profile}
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.NFO}
        component={NFO}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 1000,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  gradientIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D4AA',
    background: 'linear-gradient(135deg, #00D4AA 0%, #0099CC 100%)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    fontFamily: 'System',
  },
});