"use strict";

import React, { useCallback } from 'react';
import Animated, { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useChainCallback, useCollapsibleStyle, useScrollHandlerY, useSharedAnimatedRef, useTabNameContext, useTabsContext, useUpdateScrollViewContentSize } from './hooks';

/**
 * Used as a memo to prevent rerendering too often when the context changes.
 * See: https://github.com/facebook/react/issues/15156#issuecomment-474590693
 */
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
let AnimatedMasonry = null;
const ensureMasonry = () => {
  if (AnimatedMasonry) {
    return;
  }
  try {
    const flashListModule = require('@shopify/flash-list');
    AnimatedMasonry = Animated.createAnimatedComponent(flashListModule.MasonryFlashList);
  } catch {
    console.error('The optional dependency @shopify/flash-list is not installed. Please install it to use the FlashList component.');
  }
};
const MasonryFlashListMemo = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef((props, passRef) => {
  ensureMasonry();
  return AnimatedMasonry ?
  /*#__PURE__*/
  // @ts-expect-error
  _jsx(AnimatedMasonry, {
    ref: passRef,
    ...props
  }) : /*#__PURE__*/_jsx(_Fragment, {});
}));
function MasonryFlashListImpl({
  style,
  onContentSizeChange,
  contentContainerStyle: _contentContainerStyle,
  refreshControl,
  ...rest
}, passRef) {
  const name = useTabNameContext();
  const {
    setRef,
    contentInset
  } = useTabsContext();
  const recyclerRef = useSharedAnimatedRef(null);
  const ref = useSharedAnimatedRef(passRef);
  const {
    scrollHandler,
    enable
  } = useScrollHandlerY(name);
  const hadLoad = useSharedValue(false);
  const onLoad = useCallback(() => {
    hadLoad.value = true;
  }, [hadLoad]);
  useAnimatedReaction(() => {
    return hadLoad.value;
  }, ready => {
    if (ready) {
      enable(true);
    }
  });
  const {
    progressViewOffset,
    contentContainerStyle
  } = useCollapsibleStyle();
  React.useEffect(() => {
    setRef(name, recyclerRef);
  }, [name, recyclerRef, setRef]);
  const scrollContentSizeChange = useUpdateScrollViewContentSize({
    name
  });
  const scrollContentSizeChangeHandlers = useChainCallback(React.useMemo(() => [scrollContentSizeChange, onContentSizeChange], [onContentSizeChange, scrollContentSizeChange]));
  const memoRefreshControl = React.useMemo(() => refreshControl && /*#__PURE__*/React.cloneElement(refreshControl, {
    progressViewOffset,
    ...refreshControl.props
  }), [progressViewOffset, refreshControl]);
  const memoContentInset = React.useMemo(() => ({
    top: contentInset
  }), [contentInset]);
  const memoContentOffset = React.useMemo(() => ({
    x: 0,
    y: -contentInset
  }), [contentInset]);
  const memoContentContainerStyle = React.useMemo(() => ({
    paddingTop: contentContainerStyle.paddingTop,
    ..._contentContainerStyle
  }), [_contentContainerStyle, contentContainerStyle.paddingTop]);
  const refWorkaround = useCallback(value => {
    // https://github.com/Shopify/flash-list/blob/2d31530ed447a314ec5429754c7ce88dad8fd087/src/FlashList.tsx#L829
    // We are not accessing the right element or view of the Flashlist (recyclerlistview). So we need to give
    // this ref the access to it
    // @ts-expect-error
    ;
    recyclerRef(value?.recyclerlistview_unsafe);
    ref(value);
  }, [recyclerRef, ref]);
  return (
    /*#__PURE__*/
    // @ts-expect-error typescript complains about `unknown` in the memo, it should be T
    _jsx(MasonryFlashListMemo, {
      ...rest,
      onLoad: onLoad,
      contentContainerStyle: memoContentContainerStyle,
      ref: refWorkaround,
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
 * Use like a regular MasonryFlashList.
 */
export const MasonryFlashList = /*#__PURE__*/React.forwardRef(MasonryFlashListImpl);
//# sourceMappingURL=MasonryFlashList.js.map