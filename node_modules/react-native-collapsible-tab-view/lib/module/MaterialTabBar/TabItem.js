"use strict";

import React, { useMemo } from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { jsx as _jsx } from "react/jsx-runtime";
export const TABBAR_HEIGHT = 48;
const DEFAULT_COLOR = 'rgba(0, 0, 0, 1)';

/**
 * Any additional props are passed to the pressable component.
 */
export const MaterialTabItem = props => {
  const {
    name,
    index,
    onPress,
    onLayout,
    scrollEnabled,
    indexDecimal,
    label,
    style,
    labelStyle,
    activeColor = DEFAULT_COLOR,
    inactiveColor = DEFAULT_COLOR,
    inactiveOpacity = 0.7,
    pressColor = '#DDDDDD',
    pressOpacity = Platform.OS === 'ios' ? 0.2 : 1,
    ...rest
  } = props;
  const stylez = useAnimatedStyle(() => {
    return {
      opacity: interpolate(indexDecimal.value, [index - 1, index, index + 1], [inactiveOpacity, 1, inactiveOpacity], Extrapolation.CLAMP),
      color: Math.abs(index - indexDecimal.value) < 0.5 ? activeColor : inactiveColor
    };
  });
  const renderedLabel = useMemo(() => {
    if (typeof label === 'string') {
      return /*#__PURE__*/_jsx(Animated.Text, {
        style: [styles.label, stylez, labelStyle],
        children: label
      });
    }
    return label(props);
  }, [label, labelStyle, props, stylez]);
  return /*#__PURE__*/_jsx(Pressable, {
    onLayout: onLayout,
    style: ({
      pressed
    }) => [{
      opacity: pressed ? pressOpacity : 1
    }, !scrollEnabled && styles.grow, styles.item, style],
    onPress: () => onPress(name),
    android_ripple: {
      borderless: true,
      color: pressColor
    },
    ...rest,
    children: renderedLabel
  });
};
const styles = StyleSheet.create({
  grow: {
    flex: 1
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: TABBAR_HEIGHT
  },
  label: {
    margin: 4
  }
});
//# sourceMappingURL=TabItem.js.map