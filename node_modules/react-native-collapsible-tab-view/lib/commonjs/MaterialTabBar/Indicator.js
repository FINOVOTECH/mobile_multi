"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Indicator = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _helpers = require("../helpers");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const Indicator = ({
  indexDecimal,
  itemsLayout,
  style,
  fadeIn = false
}) => {
  const opacity = (0, _reactNativeReanimated.useSharedValue)(fadeIn ? 0 : 1);
  const stylez = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    const firstItemX = itemsLayout[0]?.x ?? 0;
    const transform = [{
      translateX: itemsLayout.length > 1 ? (0, _reactNativeReanimated.interpolate)(indexDecimal.value, itemsLayout.map((_, i) => i),
      // when in RTL mode, the X value should be inverted
      itemsLayout.map(v => _helpers.isRTL ? -1 * v.x : v.x)) : _helpers.isRTL ? -1 * firstItemX : firstItemX
    }];
    const width = itemsLayout.length > 1 ? (0, _reactNativeReanimated.interpolate)(indexDecimal.value, itemsLayout.map((_, i) => i), itemsLayout.map(v => v.width)) : itemsLayout[0]?.width;
    return {
      transform,
      width,
      opacity: (0, _reactNativeReanimated.withTiming)(opacity.value)
    };
  }, [indexDecimal, itemsLayout]);
  _react.default.useEffect(() => {
    if (fadeIn) {
      opacity.value = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeIn]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
    style: [stylez, styles.indicator, style]
  });
};
exports.Indicator = Indicator;
const styles = _reactNative.StyleSheet.create({
  indicator: {
    height: 2,
    backgroundColor: '#2196f3',
    position: 'absolute',
    bottom: 0
  }
});
//# sourceMappingURL=Indicator.js.map