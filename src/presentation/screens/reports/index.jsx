import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid
} from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Buffer } from 'buffer';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { getData } from '../../../helpers/localStorage';
import FileViewer from 'react-native-file-viewer';
import SInfoSvg from '../../svgs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Config from '../../../helpers/Config';

const ReportsScreen = ({ navigation }) => {
  const [loadingItems, setLoadingItems] = React.useState({});
  const [clientCode, setClientCode] = useState('');

  useEffect(() => {
    const fetchClientCode = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('clientCode');
        const clientCode = storedValue;
        setClientCode(clientCode);
      } catch (error) {
        console.error("Error retrieving clientCode:", error);
      }
    };

    fetchClientCode();
  }, []);

  const reportItems = [
    {
      id: 1,
      name: 'Capital Gain/Loss Report',
      endPoint: `/api/v1/mf/capital-gain/${clientCode}/pdf?fy=2025-2026`,
      fileName: 'Capital_Gain_Report.pdf'
    },
    {
      id: 2,
      name: 'Transaction Report',
      endPoint: `/api/v1/reports/transaction-statement/${clientCode}/pdf`,
      fileName: 'Transaction_Report.pdf'
    },
  ];

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      console.log('Android Version:', Platform.Version);
      
      // For Android 13+ (API Level 33+)
      if (Platform.Version >= 33) {
        console.log('Requesting Android 13+ permissions');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]);
        
        console.log('Permission results:', granted);
        
        // For downloads, we don't necessarily need all media permissions
        // We can proceed if at least one is granted or use alternative directory
        const hasAnyPermission = Object.values(granted).some(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
        
        return hasAnyPermission;
      }
      // For Android 6.0 to 12 (API 23 to 32)
      else if (Platform.Version >= 23) {
        console.log('Requesting legacy storage permission');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to download reports',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        console.log('Storage permission result:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      // For Android below 6.0, permissions are granted at install time
      else {
        console.log('Android < 6.0, permissions granted at install');
        return true;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }
  // For iOS, return true as they handle file downloads differently
  console.log('iOS platform, no storage permission needed');
  return true;
};

const downloadFile = async (url, fileName) => {
  try {
    console.log('Starting download process...');
    
    // Request storage permission
    const hasPermission = await requestStoragePermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Storage permission is required to download reports. The app will try to download to app storage instead.',
        [{ text: 'Continue', onPress: () => proceedWithDownload(url, fileName) }]
      );
      return;
    }

    await proceedWithDownload(url, fileName);
    
  } catch (error) {
    console.error('Download setup error:', error);
    Alert.alert('Error', 'Failed to setup download. Please try again.');
  }
};

const proceedWithDownload = async (url, fileName) => {
  try {
    const token = await getData(Config.store_key_login_details);
    if (!token) {
      Alert.alert('Error', 'Please login again');
      return;
    }

    // Try different directories with fallbacks
    let downloadDir;
    
    if (Platform.OS === 'ios') {
      downloadDir = RNFS.LibraryDirectoryPath;
    } else {
      // Try Download directory first, then fallback to Document directory
      try {
        downloadDir = RNFS.DownloadDirectoryPath;
        // Test if we can access Download directory
        await RNFS.exists(downloadDir);
      } catch (error) {
        console.log('Download directory not accessible, using Documents');
        downloadDir = RNFS.DocumentDirectoryPath;
      }
    }

    const localFile = `${downloadDir}/${fileName}`;
    console.log('Downloading to:', localFile);

    const downloadOptions = {
      fromUrl: `${Config.baseUrl}${url}`,
      toFile: localFile,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/pdf',
      },
      background: true,
      discretionary: true,
    };

    const downloadResult = await RNFS.downloadFile(downloadOptions).promise;
    console.log('Download result:', downloadResult);

    if (downloadResult.statusCode === 200) {
      Alert.alert(
        'Success',
        `Report downloaded successfully!`,
        [
          {
            text: 'Open',
            onPress: () => {
              FileViewer.open(localFile, {
                showOpenWithDialog: true,
                showAppsSuggestions: true,
              }).catch(openError => {
                console.log('File open error:', openError);
                Alert.alert('Error', 'No app available to open PDF files');
              });
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } else {
      throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
    }
  } catch (error) {
    console.error('Download error:', error);
    
    if (error.message?.includes('Permission denied') || error.message?.includes('ENOENT')) {
      Alert.alert(
        'Storage Access Issue',
        'Cannot access storage. Please check app permissions in settings or try again.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Download Failed', 'Unable to download the report. Please try again.');
    }
  }
};

  const fetchReport = async (item) => {
    if (!clientCode) {
      Alert.alert('Error', 'Client code not found');
      return;
    }

    // Set loading state for this item
    setLoadingItems(prev => ({ ...prev, [item.id]: true }));

    try {
      const token = await getData(Config.store_key_login_details);
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      // First, check if the API returns valid data
      const checkResponse = await axios({
        method: 'GET',
        url: `${Config.baseUrl}${item.endPoint}`,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      // Check if the response indicates no data
      if (checkResponse.data && checkResponse.data.status === 'FAILED') {
        if (checkResponse.data.message === 'No transactions found for capital gain report') {
          Alert.alert(
            'No Data Available',
            'No capital gain transactions found for the selected financial year.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // If we get here, proceed with download
      await downloadFile(item.endPoint, item.fileName);

    } catch (error) {
      console.error('API Error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.status === 'FAILED') {
        const errorMessage = error.response.data.message;
        
        if (errorMessage === 'No transactions found for capital gain report') {
          Alert.alert(
            'No Transactions Found',
            'There are no capital gain transactions available for the selected financial year.',
            [{ text: 'OK' }]
          );
          return;
        } else {
          Alert.alert('Report Unavailable', errorMessage || 'Report is not available at the moment.');
        }
      } 
      else if (error.response?.status === 404) {
        Alert.alert('Not Found', 'Report not available for the selected period');
      } 
      else if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
      } 
      else if (error.response?.status === 400) {
        // Handle bad request - might be no data
        if (error.response.data?.message?.includes('No transactions')) {
          Alert.alert(
            'No Data',
            'No transactions found for generating the report.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Invalid request for report generation');
        }
      }
      else {
        Alert.alert('Error', 'Failed to fetch report. Please try again.');
      }
    } finally {
      // Clear loading state
      setLoadingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Alternative approach - check API response before download
  const checkReportAvailability = async (item) => {
    if (!clientCode) {
      Alert.alert('Error', 'Client information not available');
      return;
    }

    setLoadingItems(prev => ({ ...prev, [item.id]: true }));

    try {
      const token = await getData(Config.store_key_login_details);
      
      const response = await fetch(`${Config.baseUrl}${item.endPoint}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (responseData.status === 'FAILED') {
        if (responseData.message === 'No transactions found for capital gain report') {
          Alert.alert(
            'No Capital Gain Data',
            'You don\'t have any capital gain transactions for Financial Year 2025-2026.',
            [
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
          return;
        }
      }

      // If no error, proceed with download
      await downloadFile(item.endPoint, item.fileName);

    } catch (error) {
      console.error('Check availability error:', error);
      
      // If it's a capital gain specific error
      if (error.message?.includes('No transactions') || 
          error.response?.data?.message?.includes('No transactions')) {
        Alert.alert(
          'No Transactions',
          'No capital gain transactions found for the selected period.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Unable to check report availability');
      }
    } finally {
      setLoadingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleReportPress = async (item) => {
    // Check if client code is available
    if (!clientCode) {
      Alert.alert('Error', 'Client information not available');
      return;
    }

    // For capital gain report, check availability first
    if (item.id === 1) {
      await checkReportAvailability(item);
    } else {
      // For other reports, proceed directly
      Alert.alert(
        'Download Report',
        `Do you want to download ${item.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Download',
            onPress: () => fetchReport(item)
          }
        ]
      );
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Mutual Funds</Text>
        {reportItems.map((item) => (
          <TouchableOpacity
            key={item.id+1}
            style={styles.reportItem}
            onPress={() => handleReportPress(item)}
            activeOpacity={0.5}
            disabled={loadingItems[item.id] || !clientCode}
          >
            <Text style={[
              styles.reportItemText,
              { opacity: !clientCode ? 0.5 : 1 }
            ]}>
              {item.name}
            </Text>
            {loadingItems[item.id] ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <View style={styles.arrowIcon}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {!clientCode && (
          <Text style={styles.warningText}>
            Loading client information...
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: widthToDp(2),
    marginRight: widthToDp(2),
  },
  headerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#333333',
    marginLeft: widthToDp(1),
  },
  content: {
    flex: 1,
    paddingHorizontal: widthToDp(4),
  },
  sectionTitle: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333333',
    marginTop: heightToDp(3),
    marginBottom: heightToDp(2),
    paddingHorizontal: widthToDp(1),
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2.2),
    marginBottom: heightToDp(0.5),
    borderRadius: widthToDp(2),
    borderWidth: 1,
    borderColor: '#f1f3f4',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
  },
  reportItemText: {
    fontSize: widthToDp(3.8),
    color: '#444444',
    fontWeight: '400',
    flex: 1,
  },
  arrowIcon: {
    width: widthToDp(6),
    height: widthToDp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: widthToDp(5),
    color: '#999999',
    fontWeight: '300',
  },
  warningText: {
    fontSize: widthToDp(3.5),
    color: '#666',
    textAlign: 'center',
    marginTop: heightToDp(2),
    fontStyle: 'italic',
  },
});

export default ReportsScreen;