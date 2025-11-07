import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { getData } from '../../../helpers/localStorage';

const BackArrowIcon = () => (
  <View style={styles.backArrow}>
    <Text style={styles.backArrowText}>‹</Text>
  </View>
);

const HoldingsReportScreen = () => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleBackPress = () => {
    console.log('Back pressed');
    // Add navigation logic here
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_DOCUMENTS,
          ]);
          return Object.values(granted).every(p => p === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'App needs access to your storage to download the report.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleGenerateNewReport = async () => {
    try {
      const clientCode = await getData('token')
      setIsGenerating(true);

      const response = await axios.get('https://onekyc.finovo.tech:8015/api/v1/pdf/xirr-Report', {
        responseType: 'arraybuffer', 
        headers: {
          Accept: 'application/pdf',
          clientCode:clientCode
        },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const base64Data = Buffer.from(response.data).toString('base64');

      const fileName = `HoldingsReport_${Date.now()}.pdf`;
      const filePath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, base64Data, 'base64');

      Alert.alert('Download Complete', `PDF saved to:\n${filePath}`);
      console.log('PDF saved to:', filePath);

      try {
        await FileViewer.open(filePath);
      } catch (err) {
        console.warn('File open error:', err);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Download Failed', 'An error occurred while downloading the PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Holdings Report</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerateNewReport}
          activeOpacity={0.8}
          disabled={isGenerating}
        >
          <Text style={styles.generateButtonText}>
            {isGenerating ? 'Generating Report...' : 'Generate New Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: widthToDp(2),
    marginRight: widthToDp(2),
  },
  backArrow: {
    width: widthToDp(6),
    height: widthToDp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowText: {
    fontSize: widthToDp(6),
    color: '#666666',
    fontWeight: '300',
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
  generateButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: heightToDp(2),
    paddingHorizontal: widthToDp(6),
    borderRadius: widthToDp(6),
    marginTop: heightToDp(3),
    marginBottom: heightToDp(3),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: widthToDp(4),
    fontWeight: '600',
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonPrimary: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  modalButtonSecondary: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HoldingsReportScreen;
