import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet, Text } from "react-native";

const ChartLoader = () => {
   const bars = [40, 70, 55, 90, 60, 80];
  const animatedValsRef = useRef(bars.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    animatedValsRef.forEach((animVal, i) => {
      const loopAnim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(animVal, {
              toValue: 1,
              duration: 800,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(animVal, {
              toValue: 0.3,
              duration: 800,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const startDelay = i * 150;
      const timeout = setTimeout(() => loopAnim.start(), startDelay);
      return () => {
        clearTimeout(timeout);
        loopAnim.stop();
      };
    });

    return () => {
      animatedValsRef.forEach((animVal) => {
        animVal.stopAnimation?.();
      });
    };
  }, [animatedValsRef]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {bars.map((h, i) => {
          const scaleStyle = {
            transform: [{ scaleY: animatedValsRef[i] }],
            opacity: animatedValsRef[i].interpolate({
              inputRange: [0.3, 1],
              outputRange: [0.4, 1],
            }),
          };

          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                { height: h, marginLeft: i === 0 ? 0 : 10 },
                scaleStyle,
              ]}
            />
          );
        })}
      </View>

      <Text style={styles.label}>Loading Chart</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flexDirection: "row", 
    alignItems: "flex-end", 
    justifyContent: "center",
    height: 120,
    paddingHorizontal: 8,
  },
  bar: {
    width: 14,
    backgroundColor: "#2B8DF6",
    borderRadius: 4,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: "#ffffff",
  },
});

export default ChartLoader;
