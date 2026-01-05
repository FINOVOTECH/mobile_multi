import { Alert, Linking, Platform } from "react-native";
import VersionCheck from "react-native-version-check";
import DeviceInfo from "react-native-device-info";

let alertShown = false;

export const checkAppVersion = async () => {
  try {
    if (alertShown) return;

    const currentBuild = Number(DeviceInfo.getBuildNumber());

    // 🔥 Get store build number
    const latestBuild = Number(
      await VersionCheck.getLatestBuildNumber({
        packageName: Platform.select({
          android: "com.mfjyoti.mf",
          ios: "com.jyotimf.mf",
        }),
      })
    );

    if (!latestBuild) return;

    if (currentBuild < latestBuild) {
      alertShown = true;

      const storeUrl = await VersionCheck.getStoreUrl();

      Alert.alert(
        "Update Available 🚀",
        "A new version of the app is available. Please update to continue.",
        [
          {
            text: "Update Now",
            onPress: () => Linking.openURL(storeUrl),
          },
        ],
        { cancelable: false }
      );
    }
  } catch (error) {
    // Silent fail (never block app)
    console.log("Version check error:", error);
  }
};
