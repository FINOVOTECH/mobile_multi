import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import RootNavigator, { navigationRef } from "./src/navigation";
import SplashScreen from "./src/presentation/screens/splash";
import HandAnimation from "./src/components/handAnimation";
import { store, persistor } from "./src/store/store";
import { clearAll } from "./src/helpers/localStorage";
import { checkAppVersion } from "./src/utils/versionCheck";

function App() {
  const [appIsReady, setAppIsReady] = useState(false);

 useEffect(() => {
    const prepare = async () => {
      setAppIsReady(true);
    };

    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    // ✅ Delay version check until UI is mounted
    const timeout = setTimeout(() => {
      checkAppVersion();
    }, 500);

    return () => clearTimeout(timeout);
  }, [appIsReady]);
  if (!appIsReady) return <SplashScreen />;

  const LoadingView = () => (
    <HandAnimation />
  );

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={<LoadingView />} persistor={persistor}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </GestureHandlerRootView>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
