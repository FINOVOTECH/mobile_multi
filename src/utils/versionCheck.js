import { Alert, Linking, Platform } from "react-native";
import VersionCheck from "react-native-version-check";

let alertShown = false;

export const checkAppVersion = async () => {
  try {
    // Prevent duplicate alerts
    if (alertShown) return;

    const updateNeeded = await VersionCheck.needUpdate();

    if (updateNeeded?.isNeeded) {
      alertShown = true;

      Alert.alert(
        "Update Available 🚀",
        "A new version of the app is available. Please update to continue.",
        [
          {
            text: "Update Now",
            onPress: async () => {
              const url = updateNeeded.storeUrl;
              const supported = await Linking.canOpenURL(url);

              if (supported) {
                Linking.openURL(url);
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  } catch (error) {
    // Silent fail – never block user due to version API issue
    console.log("Version check failed:", error);
  }
};
