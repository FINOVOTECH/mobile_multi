import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import CommonHeader from '../CommonHeader';
import * as Config from '../../helpers/Config';
import SInfoSvg from '../../presentation/svgs';

const Account = ({ navigation }) => {
  const AccountData = useSelector(state => state.login.loginData);
  const [userData, setUserData] = React.useState(AccountData.user);
  const [expandedSection, setExpandedSection] = useState(null); // Changed to single value
  const [animations, setAnimations] = useState({});

  console.log('User Data:', userData);

  // Initialize animations for each section
  React.useEffect(() => {
    const initialAnimations = {};
    sections.forEach((section, index) => {
      initialAnimations[index] = new Animated.Value(0);
    });
    setAnimations(initialAnimations);
  }, []);
    useEffect(() => {
      const backAction = () => {
        // BackHandler.exitApp();
        navigation.goBack();
        return true;
      };
  
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
  
      return () => backHandler.remove();
    }, []);

  // Helper function to format field names
  const formatFieldName = fieldName => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Helper function to format values
  const formatValue = value => {
    if (value === null || value === undefined || value === '') {
      return 'Not Available';
    }
    return value.toString();
  };

  // Define sections with their respective fields
  const sections = [
    {
      title: 'Personal Information',
      icon: '👤',
      fields: [
        'primaryHolderFirstName',
        'primaryHolderLastName',
        'primaryHolderDOB',
        'gender',
        'primaryHolderPAN',
      ],
    },
    {
      title: 'Contact Information',
      icon: '📞',
      fields: [
        'email',
        'mobileNumber',
        'addressLine1',
        'addressLine2',
        'addressLine3',
        'city',
        'state',
        'country',
        'pincode',
      ],
    },
    {
      title: 'Account Details',
      icon: '🏦',
      fields: [
        'clientCode',
        'memberCode',
        'branch',
        'defaultDP',
        'divPayMode',
      ],
    },
    {
      title: 'Demat Information',
      icon: '📋',
      fields: ['nsdlDPID', 'nsdlCLTID', 'cdslDPID', 'cdslCLTID'],
    },
  ];

  // Toggle accordion section - only one open at a time
  const toggleSection = index => {
    // Check if animation exists before proceeding
    if (!animations[index]) {
      return;
    }

    const isCurrentlyExpanded = expandedSection === index;

    // Close the previously opened section
    if (expandedSection !== null && expandedSection !== index) {
      Animated.timing(animations[expandedSection], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    // Toggle current section
    if (isCurrentlyExpanded) {
      // Close current section
      setExpandedSection(null);
      Animated.timing(animations[index], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Open new section
      setExpandedSection(index);
      Animated.timing(animations[index], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const renderField = (fieldName, value) => (
    <View key={fieldName} style={styles.fieldContainer}>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{formatFieldName(fieldName)}</Text>
        <Text style={styles.fieldValue}>{formatValue(value)}</Text>
      </View>
      <View style={styles.fieldDivider} />
    </View>
  );

  const renderSection = (section, index) => {
    const isExpanded = expandedSection === index;
    const animation = animations[index];

    // Check if animation exists before proceeding
    if (!animation) {
      return null;
    }

    const fieldsWithData = section.fields.filter(
      field => userData && userData[field] !== undefined,
    );

    const contentHeight = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, fieldsWithData.length * heightToDp(7.5)],
    });

    const rotateAnimation = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View key={section.title} style={styles.accordionContainer}>
        <TouchableOpacity
          style={[
            styles.accordionHeader,
            isExpanded && styles.accordionHeaderExpanded,
          ]}
          onPress={() => toggleSection(index)}
          activeOpacity={0.7}
        >
          <View style={styles.accordionHeaderLeft}>
            <View style={styles.accordionHeaderText}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          </View>
          <Animated.View
            style={[
              styles.chevron,
              { transform: [{ rotate: rotateAnimation }] },
            ]}
          >
            {/* <Text style={styles.chevronText}>▼</Text> */}
          <SInfoSvg.DownArrow width={widthToDp(6)} height={heightToDp(3)} />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          style={[styles.accordionContent, { height: contentHeight }]}
        >
          <View style={styles.sectionContent}>
            {fieldsWithData.map(field => renderField(field, userData[field]))}
          </View>
        </Animated.View>
      </View>
    );
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataIcon}>❌</Text>
          <Text style={styles.noDataText}>No user data available</Text>
          <Text style={styles.noDataSubtext}>Please try logging in again</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* <CommonHeader
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      /> */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SInfoSvg.BackButton onPress={()=>navigation.goBack()} style={{position:'absolute', left:10, top:7}}/>
          <Text style={styles.headerTitle}>Account Details</Text>
        </View>

        {sections.map((section, index) => renderSection(section, index))}

        <View style={styles.footer}>
          <Text style={styles.footerIcon}>⚠️</Text>
          <Text style={styles.footerText}>
            For any changes to your account details, please contact customer
            support.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
   backgroundColor: "transparent",
  //  backgroundColor: "black",
  },
  header: {
    paddingBottom: heightToDp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: widthToDp(6),
    // fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: heightToDp(0.5),
  },
  accordionContainer: {
    // backgroundColor: Config.Colors.white,
    borderRadius: widthToDp(3),
    // marginBottom: heightToDp(2),
    marginHorizontal:widthToDp(2),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
    // overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    // backgroundColor: Config.Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  accordionHeaderExpanded: {
    backgroundColor: Config.Colors.cyan_blue,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accordionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: heightToDp(0.2),
  },
  chevron: {
    padding: widthToDp(2),
  },
  chevronText: {
    fontSize: widthToDp(4),
    color: '#4a5568',
  },
  accordionContent: {
    overflow: 'hidden',
    backgroundColor: Config.Colors.cyan_blue,
  },
  sectionContent: {
    paddingHorizontal: widthToDp(4),
    paddingBottom: heightToDp(1),
  },
  fieldContainer: {
    paddingVertical: heightToDp(1),
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: heightToDp(1),
  },
  fieldLabel: {
    fontSize: widthToDp(3.5),
    fontWeight: '500',
    color: '#4a5568',
    flex: 1,
    marginRight: widthToDp(2),
  },
  fieldValue: {
    fontSize: widthToDp(3.5),
    color: '#1a202c',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: heightToDp(1),
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthToDp(8),
  },
  noDataIcon: {
    fontSize: widthToDp(12),
    marginBottom: heightToDp(2),
  },
  noDataText: {
    fontSize: widthToDp(5),
    color: '#4a5568',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: heightToDp(1),
  },
  noDataSubtext: {
    fontSize: widthToDp(3.5),
    color: '#718096',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: widthToDp(4),
    backgroundColor: Config.Colors.cyan_blue,
    marginTop: heightToDp(1),
    alignItems: 'center',
    flexDirection: 'row',
  },
  footerIcon: {
    fontSize: widthToDp(4),
    marginRight: widthToDp(2),
  },
  footerText: {
    fontSize: widthToDp(3.5),
    color: '#742a2a',
    flex: 1,
    fontWeight: '500',
  },
});