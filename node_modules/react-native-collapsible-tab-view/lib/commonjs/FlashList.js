"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FlashList = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _hooks = require("./hooks");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Used as a memo to prevent rerendering too often when the context changes.
 * See: https://github.com/facebook/react/issues/15156#issuecomment-474590693
 */

let AnimatedFlashList = null;
const ensureFlastList = () => {
  if (AnimatedFlashList) {
    return;
  }
  try {
    const flashListModule = require('@shopify/flash-list');
    AnimatedFlashList = _reactNativeReanimated.default.createAnimatedComponent(flashListModule.FlashList);
  } catch {
    console.error('The optional dependency @shopify/flash-list is not installed. Please install it to use the FlashList component.');
  }
};
const FlashListMemo = /*#__PURE__*/_react.default.memo(/*#__PURE__*/_react.default.forwardRef((props, passRef) => {
  ensureFlastList();
  return AnimatedFlashList ? /*#__PURE__*/(0, _jsxRuntime.jsx)(AnimatedFlashList, {
    ref: passRef,
    ...props
  }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {});
}));
function FlashListImpl({
  style,
  onContentSizeChange,
  refreshControl,
  contentContainerStyle: _contentContainerStyle,
  ...rest
}, passRef) {
  const name = (0, _hooks.useTabNameContext)();
  const {
    setRef,
    contentInset
  } = (0, _hooks.useTabsContext)();
  const ref = (0, _hooks.useSharedAnimatedRef)(passRef);
  const recyclerRef = (0, _hooks.useSharedAnimatedRef)(null);
  const {
    scrollHandler,
    enable
  } = (0, _hooks.useScrollHandlerY)(name);
  const hadLoad = (0, _reactNativeReanimated.useSharedValue)(false);
  const onLoad = (0, _react.useCallback)(() => {
    hadLoad.value = true;
  }, [hadLoad]);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    return hadLoad.value;
  }, ready => {
    if (ready) {
      enable(true);
    }
  });
  const {
    progressViewOffset,
    contentContainerStyle
  } = (0, _hooks.useCollapsibleStyle)();
  _react.default.useEffect(() => {
    setRef(name, recyclerRef);
  }, [name, recyclerRef, setRef]);
  const scrollContentSizeChange = (0, _hooks.useUpdateScrollViewContentSize)({
    name
  });
  const scrollContentSizeChangeHandlers = (0, _hooks.useChainCallback)(_react.default.useMemo(() => [scrollContentSizeChange, onContentSizeChange], [onContentSizeChange, scrollContentSizeChange]));
  const memoRefreshControl = _react.default.useMemo(() => refreshControl && /*#__PURE__*/_react.default.cloneElement(refreshControl, {
    progressViewOffset,
    ...refreshControl.props
  }), [progressViewOffset, refreshControl]);
  const memoContentInset = _react.default.useMemo(() => ({
    top: contentInset
  }), [contentInset]);
  const memoContentOffset = _react.default.useMemo(() => ({
    x: 0,
    y: -contentInset
  }), [contentInset]);
  const memoContentContainerStyle = _react.default.useMemo(() => ({
    paddingTop: contentContainerStyle.paddingTop,
    ..._contentContainerStyle
  }), [_contentContainerStyle, contentContainerStyle.paddingTop]);
  const refWorkaround = (0, _react.useCallback)(value => {
    // https://github.com/Shopify/flash-list/blob/2d31530ed447a314ec5429754c7ce88dad8fd087/src/FlashList.tsx#L829
    // We are not accessing the right element or view of the Flashlist (recyclerlistview). So we need to give
    // this ref the access to it
    // eslint-ignore
    ;
    recyclerRef(value?.recyclerlistview_unsafe);
    ref(value);
  }, [recyclerRef, ref]);
  return (
    /*#__PURE__*/
    // @ts-expect-error typescript complains about `unknown` in the memo, it should be T
    (0, _jsxRuntime.jsx)(FlashListMemo, {
      ...rest,
      onLoad: onLoad,
      ref: refWorkaround,
      contentContainerStyle: memoContentContainerStyle,
      bouncesZoom: false,
      onScroll: scrollHandler,
      scrollEventThrottle: 16,
      contentInset: memoContentInset,
      contentOffset: memoContentOffset,
      refreshControl: memoRefreshControl,
      progressViewOffset: progressViewOffset,
      automaticallyAdjustContentInsets: false,
      onContentSizeChange: scrollContentSizeChangeHandlers
    })
  );
}

/**
 * Use like a regular FlashList.
 */
const FlashList = exports.FlashList = /*#__PURE__*/_react.default.forwardRef(FlashListImpl);
//# sourceMappingURL=FlashList.js.map