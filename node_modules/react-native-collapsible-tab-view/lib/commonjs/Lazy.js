"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Lazy = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _ScrollView = require("./ScrollView");
var _hooks = require("./hooks");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Typically used internally, but if you want to mix lazy and regular screens you can wrap the lazy ones with this component.
 */
const Lazy = ({
  children,
  cancelLazyFadeIn,
  startMounted: _startMounted,
  mountDelayMs = 50
}) => {
  const name = (0, _hooks.useTabNameContext)();
  const {
    focusedTab,
    refMap
  } = (0, _hooks.useTabsContext)();

  /**
   * We keep track of whether a layout has been triggered
   */
  const didTriggerLayout = (0, _reactNativeReanimated.useSharedValue)(false);

  /**
   * This is used to control when children are mounted
   */
  const [canMount, setCanMount] = _react.default.useState(false);
  /**
   * Ensure we don't mount after the component has been unmounted
   */
  const isSelfMounted = _react.default.useRef(true);

  /**
   * We start mounted if we are the focused tab, or if props.startMounted is true.
   */
  const shouldStartMounted = typeof _startMounted === 'boolean' ? _startMounted : focusedTab.value === name;
  let initialOpacity = 1;
  if (!cancelLazyFadeIn && !shouldStartMounted) {
    initialOpacity = 0;
  }
  const opacity = (0, _reactNativeReanimated.useSharedValue)(initialOpacity);
  _react.default.useEffect(() => {
    return () => {
      isSelfMounted.current = false;
    };
  }, []);
  const startMountTimer = _react.default.useCallback(focusedTab => {
    // wait the scene to be at least mountDelay ms focused, before mounting
    setTimeout(() => {
      if (focusedTab === name) {
        if (isSelfMounted.current) setCanMount(true);
      }
    }, mountDelayMs);
  }, [mountDelayMs, name]);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    return focusedTab.value === name;
  }, (focused, wasFocused) => {
    if (focused && !wasFocused && !canMount) {
      if (cancelLazyFadeIn) {
        opacity.value = 1;
        (0, _reactNativeReanimated.runOnJS)(setCanMount)(true);
      } else {
        (0, _reactNativeReanimated.runOnJS)(startMountTimer)(focusedTab.value);
      }
    }
  }, [canMount, focusedTab]);
  const scrollTo = (0, _hooks.useScroller)();
  const ref = name ? refMap[name] : null;
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    return didTriggerLayout.value;
  }, (isMounted, wasMounted) => {
    if (isMounted && !wasMounted) {
      if (!cancelLazyFadeIn && opacity.value !== 1) {
        opacity.value = (0, _reactNativeReanimated.withTiming)(1);
      }
    }
  }, [ref, cancelLazyFadeIn, name, didTriggerLayout, scrollTo]);
  const stylez = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      opacity: opacity.value
    };
  }, [opacity]);
  const onLayout = (0, _react.useCallback)(() => {
    didTriggerLayout.value = true;
  }, [didTriggerLayout]);
  return canMount ? cancelLazyFadeIn ? children : /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
    pointerEvents: "box-none",
    style: [styles.container, !cancelLazyFadeIn ? stylez : undefined],
    onLayout: onLayout,
    children: children
  }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_ScrollView.ScrollView, {});
};
exports.Lazy = Lazy;
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=Lazy.js.map