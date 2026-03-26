import { useEffect, useState } from "react";
import { ActivityIndicator, Image, LogBox, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import HandAnimation from "./src/components/handAnimation";
import { store, persistor } from "./src/store/store";
import { checkAppVersion } from "./src/utils/versionCheck";
import { bootstrapTenantBranding } from "./src/helpers/tenantBrandingRuntime";
import * as Config from "./src/helpers/Config";

function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [navigationModule, setNavigationModule] = useState<any>(null);

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs(true);
    }
  }, []);

  useEffect(() => {
    const prepare = async () => {
      // Load cached branding first (instant, no network)
      await bootstrapTenantBranding({ skipNetwork: true }).catch(() => null);

      const module = Config.useHybridApp
        ? require("./src/navigation/hybrid")
        : require("./src/navigation");
      setNavigationModule(module);
      setAppIsReady(true);

      // Network refresh immediately in background (no delay)
      bootstrapTenantBranding().catch(() => null);
    };

    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    // ✅ Delay version check until UI is mounted
    const timeout = setTimeout(
      () => {
        checkAppVersion();
      },
      Config.useHybridApp ? 1200 : 500
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [appIsReady]);

  const RootNavigator = navigationModule?.default;
  const navigationRef = navigationModule?.navigationRef;

  const appName =
    String(Config?.RuntimeTenant?.appName || Config?.RuntimeTenant?.brokerName || "")
      .trim() || "Mutual Fund Desk";
  const logoUri = String(Config?.RuntimeTenant?.logoUrl || "").trim();

  if (!appIsReady || !RootNavigator || !navigationRef) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {logoUri ? (
          <Image
            source={{ uri: logoUri }}
            resizeMode="contain"
            style={{ width: 76, height: 76, borderRadius: 14, marginBottom: 14 }}
          />
        ) : null}
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 }}>
          {appName}
        </Text>
        <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
          Initializing secure session...
        </Text>
        <ActivityIndicator size="small" color={Config.Colors.primary} />
      </View>
    );
  }

  const LoadingView = () => <HandAnimation />;

  const appShell = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        {Config.useHybridApp ? (
          appShell
        ) : (
          <PersistGate loading={<LoadingView />} persistor={persistor}>
            {appShell}
          </PersistGate>
        )}
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
