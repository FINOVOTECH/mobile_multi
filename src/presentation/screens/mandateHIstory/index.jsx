import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  SafeAreaView,
  StatusBar,
} from 'react-native';
// import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { heightToDp, widthToDp } from '../../../helpers/Responsive';
import { apiGetService } from '../../../helpers/services';
import * as Config from '../../../helpers/Config';
import SInfoSvg from '../../svgs';

const MandateHistory = ({ navigation }) => {
  const Details = useSelector(state => state?.login?.loginData);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  //   const navigation = useNavigation();

   useEffect(() => {
      const backAction = () => {
        BackHandler.exitApp();
        return true;
      };
  
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
  
      return () => backHandler.remove();
    }, []);

  const convertDateToReadable = dateString => {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
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
  useEffect(() => {
    fetchMandateHistory();
  }, []);

  const fetchMandateHistory = async () => {
    try {
      const response = await apiGetService(
        '/api/client/registration/mandate/history',
      );
      console.log('mandate history', response?.data);
      // Extract mandates array from the response
      const mandatesData = response?.data?.mandates || [];
      setData(mandatesData);
    } catch (error) {
      console.error('Error fetching mandate history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = idx => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };
  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.replace('Settings')}
          style={styles.backButton}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Mandates</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          marginVertical: heightToDp(1), // Responsive margin
          paddingBottom:heightToDp(4)
          // borderWidth:1,
          // borderColor:"green"
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.navigate('BankMandate')}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}> Add Mandate</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#6D28D9" />
        ) : data?.length > 0 ? (
          data?.map((item, idx) => (
            <View key={idx} style={styles.bankAccount}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    width: '15%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    style={{ width: 25, height: 25 }}
                    resizeMode="contain"
                    source={require('../../../assets/Icons/bankLogo.png')}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => toggleExpand(idx)}
                  style={{
                    width: !item?.UMRNNo ? '60%' : '80%',
                    alignItems: 'flex-start',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignContent: 'center',
                    }}
                  >
                    <View>
                      <Text style={styles.accountNo}>
                        {item?.accountNumber || 'N/A'}
                      </Text>
                      <Text style={styles.ifscCode}>
                        {item?.ifscCode
                          ? `${item.ifscCode.slice(0, 6)}XXXXXX`
                          : 'N/A'}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 25,
                        height: 25,
                        borderRadius: 50,
                        alignItems: 'center',
                        justifyContent: 'start',
                      }}
                    >
                      {item?.regStatus === 'SUCCESS' ? (
                        <SInfoSvg.Success />
                      ) : (
                        <SInfoSvg.Failed />
                      )}
                    </View>
                  </View>
                  <Text style={styles.regStatus}>
                    Status: {item?.regStatus || 'N/A'}
                  </Text>
                  <Text style={styles.regStatus}>
                    Time: {item?.registrationDate || 'Not Available'}
                  </Text>
                </TouchableOpacity>

                {!item?.UMRNNo?.length > 0 && (
                  <View
                    style={{
                      width: '15%',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SInfoSvg.Retry />
                  </View>
                )}
              </View>
              {expandedIndex === idx && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsText}>
                    Amount: ₹{item?.amount || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Account Type: {item?.accountType || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Mandate Type: {item?.mandateType || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    IFSC Code: {item?.ifscCode || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Mandate ID: {item?.mandateId || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Expiry Date: {item?.mandateExpiryDate || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Internal Reference: {item?.internalReferenceNumber || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Current Status: {item?.currentStatus || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Registration Result: {item?.regResult || 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Created:{' '}
                    {item?.createdAt
                      ? convertDateToReadable(item.createdAt)
                      : 'N/A'}
                  </Text>
                  <Text style={styles.detailsText}>
                    Updated:{' '}
                    {item?.updatedAt
                      ? convertDateToReadable(item.updatedAt)
                      : 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>
              You have not set up any automated payment instruction for your
              SIPs yet
            </Text>
            <Text style={styles.infoDescription}>
              Set up a mandate now to automate your monthly SIP payments. Just
              200 every day is 1.5 crore in 25 years. Equity mutual funds have
              beaten bank deposits historically.
            </Text>
          </View>
        )}
      </ScrollView>
      
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: Config.Colors.cyan_blue,
    backgroundColor: "transparent",
    // backgroundColor: "black",
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightToDp(1), // Responsive margin
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: widthToDp(2.5), // Responsive positioning
  },
  pageTitle: {
    fontSize: widthToDp(4.5), // Responsive font size
    fontWeight: 'bold',
    color: '#333',
    marginTop:heightToDp(2)
  },
  title: {
    fontSize: widthToDp(5),
    fontWeight: 'bold',
    color: 'black',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Config.Colors.primary,
    paddingVertical: heightToDp(1.5),
    paddingHorizontal: widthToDp(5),
    borderRadius: widthToDp(5),
    alignItems: 'center',
    margin: 'auto',
    marginVertical: heightToDp(1),
  },
  addButtonText: {
    color: 'white',
    fontSize: widthToDp(3.5),
    fontWeight: 'bold',
  },
  bankAccount: {
    marginTop: heightToDp(1.25),
    padding: widthToDp(2.5),
    backgroundColor: Config.Colors.white,
    borderRadius: widthToDp(2.5),
    paddingHorizontal: widthToDp(2.5),
    borderRadius: widthToDp(2.5),
    marginHorizontal:widthToDp(2)
    // width: '100%',
  },
  accountNo: {
    fontSize: widthToDp(3.75),
    fontWeight: 'bold',
    letterSpacing: 2,
    color: 'black',
  },
  ifscCode: {
    fontSize: widthToDp(3),
    color: 'black',
  },
  regStatus: {
    fontSize: widthToDp(3),
    color: 'gray',
  },
  detailsContainer: {
    marginTop: heightToDp(1.25),
    padding: widthToDp(2.5),
    backgroundColor: '#f0f0f0',
    borderRadius: widthToDp(1.25),
  },
  detailsText: {
    fontSize: widthToDp(3),
    color: 'black',
    marginBottom: heightToDp(0.6),
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: heightToDp(5),
  },
  infoTitle: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: heightToDp(1.25),
    color: 'black',
  },
  infoDescription: {
    fontSize: widthToDp(3),
    textAlign: 'center',
    color: 'gray',
  },
};

export default MandateHistory;
