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
} from 'react-native';
import RNFS from 'react-native-fs';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { getData } from '../../../helpers/localStorage';
import FileViewer from 'react-native-file-viewer';
import SInfoSvg from '../../svgs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Config from '../../../helpers/Config';
import { SafeAreaView } from 'react-native-safe-area-context';

const ReportsScreen = ({ navigation }) => {
  const [loadingItems, setLoadingItems] = React.useState({});
  const [clientCode, setClientCode] = useState('');

  useEffect(() => {
    const fetchClientCode = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('clientCode');
        setClientCode(storedValue || '');
      } catch (error) {
        console.error("Error retrieving clientCode:", error);
      }
    };

    fetchClientCode();
  }, []);

  const reportItems = [
    {
      id: 1,
      name: 'SIP Performance Report',
      endPoint: '/api/v1/reports/sip-performance/pdf',
      fileName: 'SIP_Performance_Report.pdf'
    },
    {
      id: 2,
      name: 'Portfolio Valuation Report',
      endPoint: '/api/v1/reports/portfolio-valuation/pdf',
      fileName: 'Portfolio_Valuation_Report.pdf'
    },
    {
      id: 3,
      name: 'Transaction Statement',
      endPoint: '/api/v1/reports/transaction-statement/pdf',
      fileName: 'Transaction_Statement.pdf'
    },
    {
      id: 4,
      name: 'Unrealized Gains Report',
      endPoint: '/api/v1/reports/unrealized-gains/pdf',
      fileName: 'Unrealized_Gains_Report.pdf'
    },
    {
      id: 5,
      name: 'Capital Gain/Loss Report',
      endPoint: '/api/v1/reports/capital-gain/pdf',
      fileName: 'Capital_Gain_Report.pdf'
    },
  ];

  const downloadFile = async (item) => {
    if (!clientCode) {
      Alert.alert('Error', 'Client information not available');
      return;
    }

    // Set loading state for this item
    setLoadingItems(prev => ({ ...prev, [item.id]: true }));

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      // Prepare download path
      const downloadDir = RNFS.DocumentDirectoryPath;
      const localFile = `${downloadDir}/${item.fileName}`;
      
      // Construct URL with clientCode if needed
      let url = `${Config.baseUrl}${item.endPoint}`;
      // If API expects clientCode as query parameter
      url;

      console.log('Downloading from:', url);

      const downloadOptions = {
        fromUrl: url,
        toFile: localFile,
        headers: {
          Authorization: token,
        },
        background: true,
        discretionary: true,
        progressInterval: 100,
        progressDivider: 10,
      };

      const downloadResult = await RNFS.downloadFile(downloadOptions).promise;

      console.log('Download result:', downloadOptions,downloadResult);

      if (downloadResult.statusCode === 200) {
        // Check if file exists and has content
        const fileExists = await RNFS.exists(localFile);
        if (fileExists) {
          const fileStat = await RNFS.stat(localFile);
          
          if (fileStat.size > 0) {
            Alert.alert(
              'Success',
              `${item.name} downloaded successfully!`,
              [
                {
                  text: 'Open',
                  onPress: () => FileViewer.open(localFile)
                    .catch(e => {
                      console.log('Open file error', e);
                      Alert.alert('Error', 'Cannot open file. Please install a PDF reader.');
                    })
                },
                { text: 'OK', style: 'cancel' }
              ]
            );
          } else {
            throw new Error('Downloaded file is empty');
          }
        } else {
          throw new Error('File not found after download');
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }

    } catch (error) {
      console.error('Download error:', error);
      
      // Handle specific errors
      if (error.message.includes('status: 404')) {
        Alert.alert('Not Found', 'Report is not available at the moment.');
      } else if (error.message.includes('status: 401')) {
        Alert.alert('Session Expired', 'Please login again.');
      } else if (error.message.includes('status: 500')) {
        Alert.alert('Server Error', 'Please try again later.');
      } else if (error.message.includes('No data') || error.message.includes('empty')) {
        Alert.alert('No Data', 'No report data available.');
      } else {
        Alert.alert('Download Failed', 'Unable to download the report. Please try again.');
      }
    } finally {
      // Clear loading state
      setLoadingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleReportPress = async (item) => {
    if (!clientCode) {
      Alert.alert('Error', 'Loading client information...');
      return;
    }

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
          onPress: () => downloadFile(item)
        }
      ]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.sectionTitle}>Mutual Fund Reports</Text>
        {reportItems.map((item) => (
          <TouchableOpacity
            key={item.id}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  androidStatusBar: {
    // height: StatusBar.currentHeight,
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
    marginBottom: heightToDp(0.8),
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