"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TABBAR_HEIGHT = exports.MaterialTabItem = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const TABBAR_HEIGHT = exports.TABBAR_HEIGHT = 48;
const DEFAULT_COLOR = 'rgba(0, 0, 0, 1)';

/**
 * Any additional props are passed to the pressable component.
 */
const MaterialTabItem = props => {
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
    pressOpacity = _reactNative.Platform.OS === 'ios' ? 0.2 : 1,
    ...rest
  } = props;
  const stylez = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      opacity: (0, _reactNativeReanimated.interpolate)(indexDecimal.value, [index - 1, index, index + 1], [inactiveOpacity, 1, inactiveOpacity], _reactNativeReanimated.Extrapolation.CLAMP),
      color: Math.abs(index - indexDecimal.value) < 0.5 ? activeColor : inactiveColor
    };
  });
  const renderedLabel = (0, _react.useMemo)(() => {
    if (typeof label === 'string') {
      return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.Text, {
        style: [styles.label, stylez, labelStyle],
        children: label
      });
    }
    return label(props);
  }, [label, labelStyle, props, stylez]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Pressable, {
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
exports.MaterialTabItem = MaterialTabItem;
const styles = _reactNative.StyleSheet.create({
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