import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  Platform,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { useNavigation } from '@react-navigation/native';
import * as Config from '../../../helpers/Config';
import SInfoSvg from '../../svgs';
import { setBiometricEnabled, setBiometricPin } from '../../../store/slices/loginSlice';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';

// Profile data array with proper icons
const Profile_Data = [
  {
    id: 10,
    name: 'Account',
    icon: SInfoSvg.Account,
    route: 'Account',
    color: '#4CAF50',
  },
  {
    id: 1,
    name: 'Bank Details & Mandates',
    icon: SInfoSvg.BankMandate,
    route: 'MandateHistory',
    color: '#2196F3',
  },
  {
    id: 2,
    name: 'Transaction History',
    icon: SInfoSvg.Transaction,
    route: 'Transaction',
    color: '#FF9800',
  },
  {
    id: 7,
    name: 'Tools & Calculator',
    icon: SInfoSvg.Calc,
    route: 'ToolsAndCalc',
    color: '#9C27B0',
  },
  {
    id: 0,
    name: 'Reports',
    icon: SInfoSvg.Report,
    route: 'ReportScreen',
    color: '#607D8B',
  },
  {
    id: 0,
    name: 'Change Password',
    icon: SInfoSvg.PassKey,
    route: 'ChangePassword',
    color: '#795548',
  },
  {
    id: 8,
    name: 'Biometric Settings',
    icon: SInfoSvg.BiometricIcon,
    route: 'Biometric',
    color: '#00BCD4',
  },
];

export default function Setting({ navigation }) {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.login.loginData);
  const router = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    return () => backHandler.remove();
  }, []);

  const getInitials = name => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    const firstInitial = words[0]?.charAt(0) ?? '';
    const lastInitial =
      words.length > 1 ? words[words.length - 1]?.charAt(0) ?? '' : '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const initials = getInitials(
    `${userData?.user?.primaryHolderFirstName} ${userData?.user?.primaryHolderLastName}`,
  );

  const Logout = async () => {
    dispatch(setBiometricPin(''));
    dispatch(setBiometricEnabled(false));
    await AsyncStorage.clear();
    navigation.navigate('Home');
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
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account preferences</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const ProfileItem = ({ item, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.spring(itemAnim, {
        toValue: 1,
        delay: index * 100,
        tension: 20,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.profileItem,
          {
            opacity: itemAnim,
            transform: [
              {
                translateY: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.profileItemContent}
          onPress={() => router.navigate(item.route)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
            <item.icon style={[styles.icon, { color: item.color }]} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <SInfoSvg.RightArrow />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
        {/* User Profile Section */}
        <Animated.View 
          style={[
            styles.userSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImage}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>
                  {`${userData?.user?.primaryHolderFirstName} ${userData?.user?.primaryHolderLastName}` ||
                    'User Name'}
                </Text>
                <Text style={styles.userEmail}>
                  {userData?.user?.email || 'user@example.com'}
                </Text>
                <Text style={styles.userClientCode}>
                  Client Code: {userData?.user?.clientCode || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Profile Options Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.profileList}>
            {Profile_Data.map((item, index) => (
              <ProfileItem key={item.id} item={item} index={index} />
            ))}
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View 
          style={[
            styles.logoutSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={Logout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF5252']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // User Section
  userSection: {
    marginBottom: heightToDp(3),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    padding: widthToDp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: widthToDp(16),
    height: widthToDp(16),
    borderRadius: widthToDp(8),
    backgroundColor: Config.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthToDp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  initialsText: {
    fontSize: widthToDp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: heightToDp(0.5),
  },
  userEmail: {
    fontSize: widthToDp(3.8),
    color: '#666',
    marginBottom: heightToDp(0.3),
  },
  userClientCode: {
    fontSize: widthToDp(3.2),
    color: '#888',
  },

  // Profile Options Section
  section: {
    marginBottom: heightToDp(3),
  },
  sectionTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: '700',
    color: '#333',
    marginBottom: heightToDp(2),
    paddingHorizontal: widthToDp(1),
  },
  profileList: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  profileItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightToDp(2),
    paddingHorizontal: widthToDp(4),
  },
  iconContainer: {
    width: widthToDp(12),
    height: widthToDp(12),
    borderRadius: widthToDp(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthToDp(3),
  },
  icon: {
    width: widthToDp(6),
    height: widthToDp(6),
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#333',
  },
  arrowContainer: {
    padding: widthToDp(1),
  },

  // Logout Section
  logoutSection: {
    marginBottom: heightToDp(2),
  },
  logoutButton: {
    borderRadius: widthToDp(3),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutGradient: {
    paddingVertical: heightToDp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: widthToDp(4),
    fontWeight: '600',
  },

  bottomPadding: {
    height: heightToDp(2),
  },
});