import { Alert, Linking, AppState } from "react-native";
import VersionCheck from "react-native-version-check";

let hasCheckedVersion = false;

export const checkAppVersion = async () => {
  try {
    if (hasCheckedVersion) return;
    hasCheckedVersion = true;

    const updateNeeded = await VersionCheck.needUpdate();

    if (updateNeeded?.isNeeded) {
      Alert.alert(
        "Update Available 🚀",
        "A new version of the app is available. Please update to continue.",
        [
          {
            text: "Update Now",
            onPress: async () => {
              await Linking.openURL(updateNeeded.storeUrl);
            },
          },
        ],
        { cancelable: false }
      );
    }
  } catch (e) {
    console.log("Version check failed:", e);
  }
};
