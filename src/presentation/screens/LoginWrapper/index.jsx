import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BiometricLogin from "../BiometricLogin"; // Import your new biometric login
import Home from "../home"; // Your existing login component

const LoginWrapper = () => {
  const [showBiometric, setShowBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricSettings();
  }, []);

  const checkBiometricSettings = async () => {
    try {
      const [biometricEnabled, userPassword] = await Promise.all([
        AsyncStorage.getItem("biometricEnabled"),
        AsyncStorage.getItem("userPassword")
      ]);

      const isBiometricEnabled = biometricEnabled === "true";
      const hasUserPassword = userPassword !== null && userPassword !== "";

      // Show biometric login if both conditions are true
      setShowBiometric(isBiometricEnabled && hasUserPassword);
    } catch (error) {
      console.error("Error checking biometric settings:", error);
      setShowBiometric(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // You can show a loading screen here
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Conditionally render based on biometric settings
  return showBiometric ? 
    <BiometricLogin /> : 
    <Home />;
};

export default LoginWrapper;