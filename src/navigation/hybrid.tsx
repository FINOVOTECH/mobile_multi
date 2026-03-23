import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNavigationContainerRef } from "@react-navigation/native";
import HybridWeb from "../presentation/screens/hybridWeb";
import { ScreenName } from "../constant/screenName";
import { StackParamList } from "./types";

const Stack = createNativeStackNavigator<StackParamList>();

export const navigationRef = createNavigationContainerRef<StackParamList>();

export default function HybridRootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ScreenName.HybridWeb}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ScreenName.HybridWeb} component={HybridWeb} />
    </Stack.Navigator>
  );
}
