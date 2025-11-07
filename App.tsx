import { StyleSheet, View, Text ,ActivityIndicator} from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import RootNavigator, { navigationRef } from './src/navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import SplashScreen from './src/presentation/screens/splash';
import { Provider } from "react-redux"
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "./src/store/store"
import { clearAll } from './src/helpers/localStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HandAnimation from './src/components/handAnimation';

function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAppIsReady(true);
      clearAll();
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);
  useEffect(() => {
    logPersistedData()
  }, [])
  const logPersistedData = async () => {
    try {
      const persistedState = await AsyncStorage.getItem('persist:root');
      // console.log('Persisted State:', JSON.parse(persistedState));
    } catch (error) {
      console.error('Error:', error);
    }
  };
  if (!appIsReady) return <SplashScreen />;
  const LoadingView = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <HandAnimation />
      <Text>Loading...</Text>
    </View>
  );



  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={<LoadingView />} persistor={persistor}>
          <GestureHandlerRootView>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </GestureHandlerRootView>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
