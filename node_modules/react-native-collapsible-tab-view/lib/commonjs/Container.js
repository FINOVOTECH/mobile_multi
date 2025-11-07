"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Container = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativePagerView = _interopRequireDefault(require("react-native-pager-view"));
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _Context = require("./Context");
var _Lazy = require("./Lazy");
var _MaterialTabBar = require("./MaterialTabBar");
var _Tab = require("./Tab");
var _helpers = require("./helpers");
var _hooks = require("./hooks");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const AnimatedPagerView = _reactNativeReanimated.default.createAnimatedComponent(_reactNativePagerView.default);

/**
 * Basic usage looks like this:
 *
 * ```tsx
 * import { Tabs } from 'react-native-collapsible-tab-view'
 *
 * const Example = () => {
 *   return (
 *     <Tabs.Container renderHeader={MyHeader}>
 *       <Tabs.Tab name="A">
 *         <ScreenA />
 *       </Tabs.Tab>
 *       <Tabs.Tab name="B">
 *         <ScreenB />
 *       </Tabs.Tab>
 *     </Tabs.Container>
 *   )
 * }
 * ```
 */
const Container = exports.Container = /*#__PURE__*/_react.default.memo(/*#__PURE__*/_react.default.forwardRef(({
  initialTabName,
  headerHeight: initialHeaderHeight,
  minHeaderHeight = 0,
  tabBarHeight: initialTabBarHeight = _MaterialTabBar.TABBAR_HEIGHT,
  revealHeaderOnScroll = false,
  snapThreshold,
  children,
  renderHeader,
  renderTabBar = props => /*#__PURE__*/(0, _jsxRuntime.jsx)(_MaterialTabBar.MaterialTabBar, {
    ...props
  }),
  headerContainerStyle,
  cancelTranslation,
  containerStyle,
  lazy,
  cancelLazyFadeIn,
  pagerProps,
  onIndexChange,
  onTabChange,
  width: customWidth,
  allowHeaderOverscroll
}, ref) => {
  const containerRef = (0, _hooks.useContainerRef)();
  const [tabProps, tabNamesArray] = (0, _hooks.useTabProps)(children, _Tab.Tab);
  const [refMap, setRef] = (0, _hooks.useAnimatedDynamicRefs)();
  const windowWidth = (0, _reactNative.useWindowDimensions)().width;
  const width = customWidth ?? windowWidth;
  const [containerHeight, getContainerLayoutHeight] = (0, _hooks.useLayoutHeight)();
  const [tabBarHeight, getTabBarHeight] = (0, _hooks.useLayoutHeight)(initialTabBarHeight);
  const [headerHeight, getHeaderHeight] = (0, _hooks.useLayoutHeight)(!renderHeader ? 0 : initialHeaderHeight);
  const initialIndex = _react.default.useMemo(() => initialTabName ? tabNamesArray.findIndex(n => n === initialTabName) : 0, [initialTabName, tabNamesArray]);
  const contentInset = _react.default.useMemo(() => {
    if (allowHeaderOverscroll) return 0;

    // necessary for the refresh control on iOS to be positioned underneath the header
    // this also adjusts the scroll bars to clamp underneath the header area
    return _helpers.IS_IOS ? (headerHeight || 0) + (tabBarHeight || 0) : 0;
  }, [headerHeight, tabBarHeight, allowHeaderOverscroll]);
  const snappingTo = (0, _reactNativeReanimated.useSharedValue)(0);
  const offset = (0, _reactNativeReanimated.useSharedValue)(0);
  const accScrollY = (0, _reactNativeReanimated.useSharedValue)(0);
  const oldAccScrollY = (0, _reactNativeReanimated.useSharedValue)(0);
  const accDiffClamp = (0, _reactNativeReanimated.useSharedValue)(0);
  const scrollYCurrent = (0, _reactNativeReanimated.useSharedValue)(0);
  const scrollY = (0, _reactNativeReanimated.useSharedValue)(Object.fromEntries(tabNamesArray.map(n => [n, 0])));
  const contentHeights = (0, _reactNativeReanimated.useSharedValue)(tabNamesArray.map(() => 0));
  const tabNames = (0, _reactNativeReanimated.useDerivedValue)(() => tabNamesArray, [tabNamesArray]);
  const index = (0, _reactNativeReanimated.useSharedValue)(initialIndex);
  const focusedTab = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return tabNames.value[index.value];
  }, [tabNames]);
  const calculateNextOffset = (0, _reactNativeReanimated.useSharedValue)(initialIndex);
  const headerScrollDistance = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return headerHeight !== undefined ? headerHeight - minHeaderHeight : 0;
  }, [headerHeight, minHeaderHeight]);
  const indexDecimal = (0, _reactNativeReanimated.useSharedValue)(index.value);
  const afterRender = (0, _reactNativeReanimated.useSharedValue)(0);
  _react.default.useEffect(() => {
    afterRender.value = (0, _reactNativeReanimated.withDelay)(_helpers.ONE_FRAME_MS * 5, (0, _reactNativeReanimated.withTiming)(1, {
      duration: 0
    }));
  }, [afterRender, tabNamesArray]);
  const resyncTabScroll = () => {
    'worklet';

    for (const name of tabNamesArray) {
      (0, _helpers.scrollToImpl)(refMap[name], 0, scrollYCurrent.value - contentInset, false);
    }
  };

  // the purpose of this is to scroll to the proper position if dynamic tabs are changing
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    return afterRender.value === 1;
  }, trigger => {
    if (trigger) {
      afterRender.value = 0;
      resyncTabScroll();
    }
  }, [tabNamesArray, refMap, afterRender, contentInset]);

  // derived from scrollX
  // calculate the next offset and index if swiping
  // if scrollX changes from tab press,
  // the same logic must be done, but knowing
  // the next index in advance
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    const nextIndex = Math.round(indexDecimal.value);
    return nextIndex;
  }, nextIndex => {
    if (nextIndex !== null && nextIndex !== index.value) {
      calculateNextOffset.value = nextIndex;
    }
  }, []);
  const propagateTabChange = _react.default.useCallback(change => {
    onTabChange?.(change);
    onIndexChange?.(change.index);
  }, [onIndexChange, onTabChange]);
  const syncCurrentTabScrollPosition = () => {
    'worklet';

    const name = tabNamesArray[index.value];
    (0, _helpers.scrollToImpl)(refMap[name], 0, scrollYCurrent.value - contentInset, false);
  };

  /*
   * We run syncCurrentTabScrollPosition in every frame after the index
   * changes for about 1500ms because the Lists can be late to accept the
   * scrollTo event we send. This fixes the issue of the scroll position
   * jumping when the user changes tab.
   * */
  const toggleSyncScrollFrame = toggle => syncScrollFrame.setActive(toggle);
  const syncScrollFrame = (0, _reactNativeReanimated.useFrameCallback)(({
    timeSinceFirstFrame
  }) => {
    syncCurrentTabScrollPosition();
    if (timeSinceFirstFrame > 1500) {
      (0, _reactNativeReanimated.runOnJS)(toggleSyncScrollFrame)(false);
    }
  }, false);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    return calculateNextOffset.value;
  }, i => {
    if (i !== index.value) {
      offset.value = scrollY.value[tabNames.value[index.value]] - scrollY.value[tabNames.value[i]] + offset.value;
      (0, _reactNativeReanimated.runOnJS)(propagateTabChange)({
        prevIndex: index.value,
        index: i,
        prevTabName: tabNames.value[index.value],
        tabName: tabNames.value[i]
      });
      index.value = i;
      if (typeof scrollY.value[tabNames.value[index.value]] === 'number') {
        scrollYCurrent.value = scrollY.value[tabNames.value[index.value]] || 0;
      }
      (0, _reactNativeReanimated.runOnJS)(toggleSyncScrollFrame)(true);
    }
  }, []);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => headerHeight, (_current, prev) => {
    if (prev === undefined) {
      // sync scroll if we started with undefined header height
      resyncTabScroll();
    }
  });
  const headerTranslateY = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return revealHeaderOnScroll ? -accDiffClamp.value : -Math.min(scrollYCurrent.value, headerScrollDistance.value);
  }, [revealHeaderOnScroll]);
  const stylez = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      transform: [{
        translateY: headerTranslateY.value
      }]
    };
  }, [revealHeaderOnScroll]);
  const onTabPress = _react.default.useCallback(name => {
    const i = tabNames.value.findIndex(n => n === name);
    if (name === focusedTab.value) {
      const ref = refMap[name];
      (0, _reactNativeReanimated.runOnUI)(_helpers.scrollToImpl)(ref, 0, headerScrollDistance.value - contentInset, true);
    } else {
      containerRef.current?.setPage(i);
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [containerRef, refMap, contentInset]);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => tabNamesArray.length, tabLength => {
    if (index.value >= tabLength) {
      (0, _reactNativeReanimated.runOnJS)(onTabPress)(tabNamesArray[tabLength - 1]);
    }
  });
  const pageScrollHandler = (0, _hooks.usePageScrollHandler)({
    onPageScroll: e => {
      'worklet';

      indexDecimal.value = e.position + e.offset;
    }
  });
  _react.default.useImperativeHandle(ref, () => ({
    setIndex: index => {
      const name = tabNames.value[index];
      onTabPress(name);
      return true;
    },
    jumpToTab: name => {
      onTabPress(name);
      return true;
    },
    getFocusedTab: () => {
      return tabNames.value[index.value];
    },
    getCurrentIndex: () => {
      return index.value;
    }
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [onTabPress]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_Context.Context.Provider, {
    value: {
      contentInset,
      tabBarHeight,
      headerHeight,
      refMap,
      tabNames,
      index,
      snapThreshold,
      revealHeaderOnScroll,
      focusedTab,
      accDiffClamp,
      indexDecimal,
      containerHeight,
      minHeaderHeight,
      scrollYCurrent,
      scrollY,
      setRef,
      headerScrollDistance,
      accScrollY,
      oldAccScrollY,
      offset,
      snappingTo,
      contentHeights,
      headerTranslateY,
      width,
      allowHeaderOverscroll
    },
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
      style: [styles.container, {
        width
      }, containerStyle],
      onLayout: getContainerLayoutHeight,
      pointerEvents: "box-none",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
        pointerEvents: "box-none",
        style: [styles.topContainer, headerContainerStyle, !cancelTranslation && stylez],
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [styles.container, styles.headerContainer],
          onLayout: getHeaderHeight,
          pointerEvents: "box-none",
          children: renderHeader && renderHeader({
            containerRef,
            index,
            tabNames: tabNamesArray,
            focusedTab,
            indexDecimal,
            onTabPress,
            tabProps
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [styles.container, styles.tabBarContainer],
          onLayout: getTabBarHeight,
          pointerEvents: "box-none",
          children: renderTabBar && renderTabBar({
            containerRef,
            index,
            tabNames: tabNamesArray,
            focusedTab,
            indexDecimal,
            width,
            onTabPress,
            tabProps
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)(AnimatedPagerView, {
        ref: containerRef,
        onPageScroll: pageScrollHandler,
        initialPage: initialIndex,
        ...pagerProps,
        style: [pagerProps?.style, _reactNative.StyleSheet.absoluteFill],
        children: tabNamesArray.map((tabName, i) => {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
            style: styles.pageContainer,
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_Context.TabNameContext.Provider, {
              value: tabName,
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_Lazy.Lazy, {
                startMounted: lazy ? undefined : true,
                cancelLazyFadeIn: !lazy ? true : !!cancelLazyFadeIn
                // ensure that we remount the tab if its name changes but the index doesn't
                ,
                children: _react.default.Children.toArray(children)[i]
              }, tabName)
            })
          }, i);
        })
      })]
    })
  });
}));
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  },
  pageContainer: {
    height: '100%',
    width: '100%'
  },
  topContainer: {
    position: 'absolute',
    zIndex: 100,
    width: '100%',
    backgroundColor: 'white',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4
  },
  tabBarContainer: {
    zIndex: 1
  },
  headerContainer: {
    zIndex: 2
  }
});
//# sourceMappingURL=Container.js.map