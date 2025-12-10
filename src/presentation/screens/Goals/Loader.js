// Loader.js
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";

const Loader = () => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loaderCircle, { transform: [{ rotate: spin }] }]} />
      <Text style={styles.text}>Calculating your plan...</Text>
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loaderCircle: {
    width: 50,
    height: 50,
    borderWidth: 5,
    borderColor: "#3B82F6",
    borderRightColor: "transparent",
    borderRadius: 40,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
  },
});
