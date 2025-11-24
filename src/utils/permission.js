import { PermissionsAndroid, Platform } from 'react-native';

export const requestStoragePermission = async () => {
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