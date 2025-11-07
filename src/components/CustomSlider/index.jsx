// import React, { Component } from 'react';
// import {
//   Animated,
//   Image,
//   StyleSheet,
//   PanResponder,
//   View,
//   Easing,
//   I18nManager,
// } from 'react-native';
// import PropTypes from 'prop-types';

// const TRACK_SIZE = 4;
// const THUMB_SIZE = 20;

// function Rect(x, y, width, height) {
//   this.x = x;
//   this.y = y;
//   this.width = width;
//   this.height = height;
// }

// Rect.prototype.containsPoint = function(x, y) {
//   return (
//     x >= this.x &&
//     y >= this.y &&
//     x <= this.x + this.width &&
//     y <= this.y + this.height
//   );
// };

// const DEFAULT_ANIMATION_CONFIGS = {
//   spring: {
//     friction: 7,
//     tension: 100,
//   },
//   timing: {
//     duration: 150,
//     easing: Easing.inOut(Easing.ease),
//     delay: 0,
//   },
// };

// export default class CustomSlider extends Component {
//   static propTypes = {
//     value: PropTypes.number,
//     disabled: PropTypes.bool,
//     minimumValue: PropTypes.number,
//     maximumValue: PropTypes.number,
//     step: PropTypes.number,
//     minimumTrackTintColor: PropTypes.string,
//     maximumTrackTintColor: PropTypes.string,
//     thumbTintColor: PropTypes.string,
//     thumbTouchSize: PropTypes.shape({
//       width: PropTypes.number,
//       height: PropTypes.number,
//     }),
//     onValueChange: PropTypes.func,
//     onSlidingStart: PropTypes.func,
//     onSlidingComplete: PropTypes.func,
//     style: PropTypes.object,
//     trackStyle: PropTypes.object,
//     thumbStyle: PropTypes.object,
//     thumbImage: PropTypes.any,
//     debugTouchArea: PropTypes.bool,
//     animateTransitions: PropTypes.bool,
//     animationType: PropTypes.oneOf(['spring', 'timing']),
//     animationConfig: PropTypes.object,
//   };

//   static defaultProps = {
//     value: 0,
//     minimumValue: 0,
//     maximumValue: 1,
//     step: 0,
//     minimumTrackTintColor: '#3f3f3f',
//     maximumTrackTintColor: '#b3b3b3',
//     thumbTintColor: '#343434',
//     thumbTouchSize: { width: 40, height: 40 },
//     debugTouchArea: false,
//     animationType: 'timing',
//   };

//   constructor(props) {
//     super(props);
//     this.state = {
//       containerSize: { width: 0, height: 0 },
//       trackSize: { width: 0, height: 0 },
//       thumbSize: { width: 0, height: 0 },
//       allMeasured: false,
//       value: new Animated.Value(this.props.value),
//     };

//     // Create PanResponder in constructor to ensure it's available when render is called
//     this._panResponder = PanResponder.create({
//       onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
//       onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
//       onPanResponderGrant: this._handlePanResponderGrant,
//       onPanResponderMove: this._handlePanResponderMove,
//       onPanResponderRelease: this._handlePanResponderEnd,
//       onPanResponderTerminationRequest: this._handlePanResponderRequestEnd,
//       onPanResponderTerminate: this._handlePanResponderEnd,
//     });
//   }

//   componentDidUpdate(prevProps) {
//     const newValue = this.props.value;
//     if (prevProps.value !== newValue) {
//       if (this.props.animateTransitions) {
//         this._setCurrentValueAnimated(newValue);
//       } else {
//         this._setCurrentValue(newValue);
//       }
//     }
//   }

//   render() {
//     const {
//       minimumValue,
//       maximumValue,
//       minimumTrackTintColor,
//       maximumTrackTintColor,
//       thumbTintColor,
//       thumbImage,
//       style,
//       trackStyle,
//       thumbStyle,
//       debugTouchArea,
//       ...other
//     } = this.props;
    
//     const {
//       value,
//       containerSize,
//       trackSize,
//       thumbSize,
//       allMeasured,
//     } = this.state;

//     const thumbLeft = value.interpolate({
//       inputRange: [minimumValue, maximumValue],
//       outputRange: I18nManager.isRTL
//         ? [0, -(containerSize.width - thumbSize.width)]
//         : [0, containerSize.width - thumbSize.width],
//     });

//     const minimumTrackWidth = value.interpolate({
//       inputRange: [minimumValue, maximumValue],
//       outputRange: [0, containerSize.width - thumbSize.width],
//     });

//     const valueVisibleStyle = {};
//     if (!allMeasured) {
//       valueVisibleStyle.opacity = 0;
//     }

//     const minimumTrackStyle = {
//       position: 'absolute',
//       width: Animated.add(minimumTrackWidth, thumbSize.width / 2),
//       backgroundColor: minimumTrackTintColor,
//       ...valueVisibleStyle,
//     };

//     const touchOverflowStyle = this._getTouchOverflowStyle();

//     return (
//       <View
//         {...other}
//         style={[styles.container, style]}
//         onLayout={this._measureContainer}
//       >
//         <View
//           style={[
//             { backgroundColor: maximumTrackTintColor },
//             styles.track,
//             trackStyle,
//           ]}
//           onLayout={this._measureTrack}
//         />
//         <Animated.View
//           style={[styles.track, trackStyle, minimumTrackStyle]}
//         />
//         <Animated.View
//           onLayout={this._measureThumb}
//           style={[
//             { backgroundColor: thumbTintColor },
//             styles.thumb,
//             thumbStyle,
//             {
//               transform: [{ translateX: thumbLeft }, { translateY: 0 }],
//               ...valueVisibleStyle,
//             },
//           ]}
//         >
//           {this._renderThumbImage()}
//         </Animated.View>
//         <View
//           style={[styles.touchArea, touchOverflowStyle]}
//           {...(this._panResponder ? this._panResponder.panHandlers : {})}
//         >
//           {debugTouchArea === true &&
//             this._renderDebugThumbTouchRect(minimumTrackWidth)}
//         </View>
//       </View>
//     );
//   }

//   _handleStartShouldSetPanResponder = (e) => {
//     return this._thumbHitTest(e);
//   };

//   _handleMoveShouldSetPanResponder = () => {
//     return false;
//   };

//   _handlePanResponderGrant = () => {
//     this._previousLeft = this._getThumbLeft(this._getCurrentValue());
//     this._fireChangeEvent('onSlidingStart');
//   };

//   _handlePanResponderMove = (e, gestureState) => {
//     if (this.props.disabled) {
//       return;
//     }
//     this._setCurrentValue(this._getValue(gestureState));
//     this._fireChangeEvent('onValueChange');
//   };

//   _handlePanResponderRequestEnd = () => {
//     return false;
//   };

//   _handlePanResponderEnd = (e, gestureState) => {
//     if (this.props.disabled) {
//       return;
//     }
//     this._setCurrentValue(this._getValue(gestureState));
//     this._fireChangeEvent('onSlidingComplete');
//   };

//   _measureContainer = (x) => {
//     this._handleMeasure('containerSize', x);
//   };

//   _measureTrack = (x) => {
//     this._handleMeasure('trackSize', x);
//   };

//   _measureThumb = (x) => {
//     this._handleMeasure('thumbSize', x);
//   };

//   _handleMeasure = (name, x) => {
//     const { width, height } = x.nativeEvent.layout;
//     const size = { width, height };

//     const storeName = `_${name}`;
//     const currentSize = this[storeName];
//     if (
//       currentSize &&
//       width === currentSize.width &&
//       height === currentSize.height
//     ) {
//       return;
//     }
//     this[storeName] = size;

//     if (this._containerSize && this._trackSize && this._thumbSize) {
//       this.setState({
//         containerSize: this._containerSize,
//         trackSize: this._trackSize,
//         thumbSize: this._thumbSize,
//         allMeasured: true,
//       });
//     }
//   };

//   _getRatio = (value) =>
//     (value - this.props.minimumValue) /
//     (this.props.maximumValue - this.props.minimumValue);

//   _getThumbLeft = (value) => {
//     const nonRtlRatio = this._getRatio(value);
//     const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;
//     return (
//       ratio * (this.state.containerSize.width - this.state.thumbSize.width)
//     );
//   };

//   _getValue = (gestureState) => {
//     const length = this.state.containerSize.width - this.state.thumbSize.width;
//     const thumbLeft = this._previousLeft + gestureState.dx;

//     const nonRtlRatio = thumbLeft / length;
//     const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;

//     if (this.props.step) {
//       return Math.max(
//         this.props.minimumValue,
//         Math.min(
//           this.props.maximumValue,
//           this.props.minimumValue +
//             Math.round(
//               ratio *
//                 (this.props.maximumValue - this.props.minimumValue) /
//                 this.props.step,
//             ) *
//               this.props.step,
//         ),
//       );
//     }
//     return Math.max(
//       this.props.minimumValue,
//       Math.min(
//         this.props.maximumValue,
//         ratio * (this.props.maximumValue - this.props.minimumValue) +
//           this.props.minimumValue,
//       ),
//     );
//   };

//   _getCurrentValue = () => this.state.value.__getValue();

//   _setCurrentValue = (value) => {
//     this.state.value.setValue(value);
//   };

//   _setCurrentValueAnimated = (value) => {
//     const animationType = this.props.animationType;
//     const animationConfig = Object.assign(
//       {},
//       DEFAULT_ANIMATION_CONFIGS[animationType],
//       this.props.animationConfig,
//       {
//         toValue: value,
//       },
//     );

//     Animated[animationType](this.state.value, animationConfig).start();
//   };

//   _fireChangeEvent = (event) => {
//     if (this.props[event]) {
//       this.props[event](this._getCurrentValue());
//     }
//   };

//   _getTouchOverflowSize = () => {
//     const state = this.state;
//     const props = this.props;

//     const size = {};
//     if (state.allMeasured === true) {
//       size.width = Math.max(
//         0,
//         props.thumbTouchSize.width - state.thumbSize.width,
//       );
//       size.height = Math.max(
//         0,
//         props.thumbTouchSize.height - state.containerSize.height,
//       );
//     }

//     return size;
//   };

//   _getTouchOverflowStyle = () => {
//     const { width, height } = this._getTouchOverflowSize();

//     const touchOverflowStyle = {};
//     if (width !== undefined && height !== undefined) {
//       const verticalMargin = -height / 2;
//       touchOverflowStyle.marginTop = verticalMargin;
//       touchOverflowStyle.marginBottom = verticalMargin;

//       const horizontalMargin = -width / 2;
//       touchOverflowStyle.marginLeft = horizontalMargin;
//       touchOverflowStyle.marginRight = horizontalMargin;
//     }

//     if (this.props.debugTouchArea === true) {
//       touchOverflowStyle.backgroundColor = 'orange';
//       touchOverflowStyle.opacity = 0.5;
//     }

//     return touchOverflowStyle;
//   };

//   _thumbHitTest = (e) => {
//     const nativeEvent = e.nativeEvent;
//     const thumbTouchRect = this._getThumbTouchRect();
//     return thumbTouchRect.containsPoint(
//       nativeEvent.locationX,
//       nativeEvent.locationY,
//     );
//   };

//   _getThumbTouchRect = () => {
//     const state = this.state;
//     const props = this.props;
//     const touchOverflowSize = this._getTouchOverflowSize();

//     return new Rect(
//       touchOverflowSize.width / 2 +
//         this._getThumbLeft(this._getCurrentValue()) +
//         (state.thumbSize.width - props.thumbTouchSize.width) / 2,
//       touchOverflowSize.height / 2 +
//         (state.containerSize.height - props.thumbTouchSize.height) / 2,
//       props.thumbTouchSize.width,
//       props.thumbTouchSize.height,
//     );
//   };

//   _renderDebugThumbTouchRect = (thumbLeft) => {
//     const thumbTouchRect = this._getThumbTouchRect();
//     const positionStyle = {
//       left: thumbLeft,
//       top: thumbTouchRect.y,
//       width: thumbTouchRect.width,
//       height: thumbTouchRect.height,
//     };

//     return (
//       <Animated.View
//         style={[styles.debugThumbTouchArea, positionStyle]}
//         pointerEvents="none"
//       />
//     );
//   };

//   _renderThumbImage = () => {
//     const { thumbImage } = this.props;
//     if (!thumbImage) return null;
//     return <Image source={thumbImage} />;
//   };
// }

// const styles = StyleSheet.create({
//   container: {
//     height: 40,
//     justifyContent: 'center',
//   },
//   track: {
//     height: TRACK_SIZE,
//     borderRadius: TRACK_SIZE / 2,
//   },
//   thumb: {
//     position: 'absolute',
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//     borderRadius: THUMB_SIZE / 2,
//   },
//   touchArea: {
//     position: 'absolute',
//     backgroundColor: 'transparent',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   debugThumbTouchArea: {
//     position: 'absolute',
//     backgroundColor: 'green',
//     opacity: 0.5,
//   },
// });

import React, { Component } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  PanResponder,
  View,
  Easing,
  I18nManager,
} from 'react-native';
import PropTypes from 'prop-types';

const TRACK_SIZE = 4;
const THUMB_SIZE = 20;

function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.containsPoint = function(x, y) {
  return (
    x >= this.x &&
    y >= this.y &&
    x <= this.x + this.width &&
    y <= this.y + this.height
  );
};

const DEFAULT_ANIMATION_CONFIGS = {
  spring: {
    friction: 7,
    tension: 100,
  },
  timing: {
    duration: 150,
    easing: Easing.inOut(Easing.ease),
    delay: 0,
  },
};

export default class CustomSlider extends Component {
  static propTypes = {
    value: PropTypes.number,
    disabled: PropTypes.bool,
    minimumValue: PropTypes.number,
    maximumValue: PropTypes.number,
    step: PropTypes.number,
    minimumTrackTintColor: PropTypes.string,
    maximumTrackTintColor: PropTypes.string,
    thumbTintColor: PropTypes.string,
    thumbTouchSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
    onValueChange: PropTypes.func,
    onSlidingStart: PropTypes.func,
    onSlidingComplete: PropTypes.func,
    style: PropTypes.object,
    trackStyle: PropTypes.object,
    thumbStyle: PropTypes.object,
    thumbImage: PropTypes.any,
    debugTouchArea: PropTypes.bool,
    animateTransitions: PropTypes.bool,
    animationType: PropTypes.oneOf(['spring', 'timing']),
    animationConfig: PropTypes.object,
    allowTouchTrack: PropTypes.bool, // New prop to enable/disable track touch
  };

  static defaultProps = {
    value: 0,
    minimumValue: 0,
    maximumValue: 1,
    step: 0,
    minimumTrackTintColor: '#3f3f3f',
    maximumTrackTintColor: '#b3b3b3',
    thumbTintColor: '#343434',
    thumbTouchSize: { width: 40, height: 40 },
    debugTouchArea: false,
    animationType: 'timing',
    allowTouchTrack: true, // Enable track touch by default
  };

  constructor(props) {
    super(props);
    this.state = {
      containerSize: { width: 0, height: 0 },
      trackSize: { width: 0, height: 0 },
      thumbSize: { width: 0, height: 0 },
      allMeasured: false,
      value: new Animated.Value(this.props.value),
    };

    // Create PanResponder in constructor to ensure it's available when render is called
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: this._handlePanResponderRequestEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  }

  componentDidUpdate(prevProps) {
    const newValue = this.props.value;
    if (prevProps.value !== newValue) {
      if (this.props.animateTransitions) {
        this._setCurrentValueAnimated(newValue);
      } else {
        this._setCurrentValue(newValue);
      }
    }
  }

  render() {
    const {
      minimumValue,
      maximumValue,
      minimumTrackTintColor,
      maximumTrackTintColor,
      thumbTintColor,
      thumbImage,
      style,
      trackStyle,
      thumbStyle,
      debugTouchArea,
      ...other
    } = this.props;
    
    const {
      value,
      containerSize,
      trackSize,
      thumbSize,
      allMeasured,
    } = this.state;

    const thumbLeft = value.interpolate({
      inputRange: [minimumValue, maximumValue],
      outputRange: I18nManager.isRTL
        ? [0, -(containerSize.width - thumbSize.width)]
        : [0, containerSize.width - thumbSize.width],
    });

    const minimumTrackWidth = value.interpolate({
      inputRange: [minimumValue, maximumValue],
      outputRange: [0, containerSize.width - thumbSize.width],
    });

    const valueVisibleStyle = {};
    if (!allMeasured) {
      valueVisibleStyle.opacity = 0;
    }

    const minimumTrackStyle = {
      position: 'absolute',
      width: Animated.add(minimumTrackWidth, thumbSize.width / 2),
      backgroundColor: minimumTrackTintColor,
      ...valueVisibleStyle,
    };

    const touchOverflowStyle = this._getTouchOverflowStyle();

    return (
      <View
        {...other}
        style={[styles.container, style]}
        onLayout={this._measureContainer}
      >
        <View
          style={[
            { backgroundColor: maximumTrackTintColor },
            styles.track,
            trackStyle,
          ]}
          onLayout={this._measureTrack}
        />
        <Animated.View
          style={[styles.track, trackStyle, minimumTrackStyle]}
        />
        <Animated.View
          onLayout={this._measureThumb}
          style={[
            { backgroundColor: thumbTintColor },
            styles.thumb,
            thumbStyle,
            {
              transform: [{ translateX: thumbLeft }, { translateY: 0 }],
              ...valueVisibleStyle,
            },
          ]}
        >
          {this._renderThumbImage()}
        </Animated.View>
        <View
          style={[styles.touchArea, touchOverflowStyle]}
          {...(this._panResponder ? this._panResponder.panHandlers : {})}
        >
          {debugTouchArea === true &&
            this._renderDebugThumbTouchRect(minimumTrackWidth)}
        </View>
      </View>
    );
  }

  _handleStartShouldSetPanResponder = (e) => {
    // If allowTouchTrack is enabled, accept touches anywhere on the slider
    if (this.props.allowTouchTrack) {
      return this._trackHitTest(e);
    }
    // Otherwise, only accept touches on the thumb
    return this._thumbHitTest(e);
  };

  _handleMoveShouldSetPanResponder = () => {
    return false;
  };

  _handlePanResponderGrant = (e) => {
    if (this.props.allowTouchTrack && !this._thumbHitTest(e)) {
      // If touch started on track (not thumb), immediately move thumb to touch position
      const newValue = this._getValueFromTouchPosition(e);
      this._setCurrentValue(newValue);
      this._previousLeft = this._getThumbLeft(newValue);
      this._fireChangeEvent('onValueChange');
    } else {
      // Normal thumb touch behavior
      this._previousLeft = this._getThumbLeft(this._getCurrentValue());
    }
    this._fireChangeEvent('onSlidingStart');
  };

  _handlePanResponderMove = (e, gestureState) => {
    if (this.props.disabled) {
      return;
    }
    this._setCurrentValue(this._getValue(gestureState));
    this._fireChangeEvent('onValueChange');
  };

  _handlePanResponderRequestEnd = () => {
    return false;
  };

  _handlePanResponderEnd = (e, gestureState) => {
    if (this.props.disabled) {
      return;
    }
    this._setCurrentValue(this._getValue(gestureState));
    this._fireChangeEvent('onSlidingComplete');
  };

  _measureContainer = (x) => {
    this._handleMeasure('containerSize', x);
  };

  _measureTrack = (x) => {
    this._handleMeasure('trackSize', x);
  };

  _measureThumb = (x) => {
    this._handleMeasure('thumbSize', x);
  };

  _handleMeasure = (name, x) => {
    const { width, height } = x.nativeEvent.layout;
    const size = { width, height };

    const storeName = `_${name}`;
    const currentSize = this[storeName];
    if (
      currentSize &&
      width === currentSize.width &&
      height === currentSize.height
    ) {
      return;
    }
    this[storeName] = size;

    if (this._containerSize && this._trackSize && this._thumbSize) {
      this.setState({
        containerSize: this._containerSize,
        trackSize: this._trackSize,
        thumbSize: this._thumbSize,
        allMeasured: true,
      });
    }
  };

  _getRatio = (value) =>
    (value - this.props.minimumValue) /
    (this.props.maximumValue - this.props.minimumValue);

  _getThumbLeft = (value) => {
    const nonRtlRatio = this._getRatio(value);
    const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;
    return (
      ratio * (this.state.containerSize.width - this.state.thumbSize.width)
    );
  };

  _getValue = (gestureState) => {
    const length = this.state.containerSize.width - this.state.thumbSize.width;
    const thumbLeft = this._previousLeft + gestureState.dx;

    const nonRtlRatio = thumbLeft / length;
    const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;

    if (this.props.step) {
      return Math.max(
        this.props.minimumValue,
        Math.min(
          this.props.maximumValue,
          this.props.minimumValue +
            Math.round(
              ratio *
                (this.props.maximumValue - this.props.minimumValue) /
                this.props.step,
            ) *
              this.props.step,
        ),
      );
    }
    return Math.max(
      this.props.minimumValue,
      Math.min(
        this.props.maximumValue,
        ratio * (this.props.maximumValue - this.props.minimumValue) +
          this.props.minimumValue,
      ),
    );
  };

  // New method to get value from direct touch position on track
  _getValueFromTouchPosition = (e) => {
    const { locationX } = e.nativeEvent;
    const length = this.state.containerSize.width - this.state.thumbSize.width;
    
    // Calculate the touch position relative to the thumb center
    const touchPosition = locationX - this.state.thumbSize.width / 2;
    const nonRtlRatio = Math.max(0, Math.min(1, touchPosition / length));
    const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;

    if (this.props.step) {
      return Math.max(
        this.props.minimumValue,
        Math.min(
          this.props.maximumValue,
          this.props.minimumValue +
            Math.round(
              ratio *
                (this.props.maximumValue - this.props.minimumValue) /
                this.props.step,
            ) *
              this.props.step,
        ),
      );
    }
    return Math.max(
      this.props.minimumValue,
      Math.min(
        this.props.maximumValue,
        ratio * (this.props.maximumValue - this.props.minimumValue) +
          this.props.minimumValue,
      ),
    );
  };

  _getCurrentValue = () => this.state.value.__getValue();

  _setCurrentValue = (value) => {
    this.state.value.setValue(value);
  };

  _setCurrentValueAnimated = (value) => {
    const animationType = this.props.animationType;
    const animationConfig = Object.assign(
      {},
      DEFAULT_ANIMATION_CONFIGS[animationType],
      this.props.animationConfig,
      {
        toValue: value,
      },
    );

    Animated[animationType](this.state.value, animationConfig).start();
  };

  _fireChangeEvent = (event) => {
    if (this.props[event]) {
      this.props[event](this._getCurrentValue());
    }
  };

  _getTouchOverflowSize = () => {
    const state = this.state;
    const props = this.props;

    const size = {};
    if (state.allMeasured === true) {
      size.width = Math.max(
        0,
        props.thumbTouchSize.width - state.thumbSize.width,
      );
      size.height = Math.max(
        0,
        props.thumbTouchSize.height - state.containerSize.height,
      );
    }

    return size;
  };

  _getTouchOverflowStyle = () => {
    const { width, height } = this._getTouchOverflowSize();

    const touchOverflowStyle = {};
    if (width !== undefined && height !== undefined) {
      const verticalMargin = -height / 2;
      touchOverflowStyle.marginTop = verticalMargin;
      touchOverflowStyle.marginBottom = verticalMargin;

      const horizontalMargin = -width / 2;
      touchOverflowStyle.marginLeft = horizontalMargin;
      touchOverflowStyle.marginRight = horizontalMargin;
    }

    if (this.props.debugTouchArea === true) {
      touchOverflowStyle.backgroundColor = 'orange';
      touchOverflowStyle.opacity = 0.5;
    }

    return touchOverflowStyle;
  };

  _thumbHitTest = (e) => {
    const nativeEvent = e.nativeEvent;
    const thumbTouchRect = this._getThumbTouchRect();
    return thumbTouchRect.containsPoint(
      nativeEvent.locationX,
      nativeEvent.locationY,
    );
  };

  // New method to test if touch is anywhere on the track area
  _trackHitTest = (e) => {
    const nativeEvent = e.nativeEvent;
    const { containerSize } = this.state;
    
    // Check if touch is within the container bounds
    return (
      nativeEvent.locationX >= 0 &&
      nativeEvent.locationX <= containerSize.width &&
      nativeEvent.locationY >= 0 &&
      nativeEvent.locationY <= containerSize.height
    );
  };

  _getThumbTouchRect = () => {
    const state = this.state;
    const props = this.props;
    const touchOverflowSize = this._getTouchOverflowSize();

    return new Rect(
      touchOverflowSize.width / 2 +
        this._getThumbLeft(this._getCurrentValue()) +
        (state.thumbSize.width - props.thumbTouchSize.width) / 2,
      touchOverflowSize.height / 2 +
        (state.containerSize.height - props.thumbTouchSize.height) / 2,
      props.thumbTouchSize.width,
      props.thumbTouchSize.height,
    );
  };

  _renderDebugThumbTouchRect = (thumbLeft) => {
    const thumbTouchRect = this._getThumbTouchRect();
    const positionStyle = {
      left: thumbLeft,
      top: thumbTouchRect.y,
      width: thumbTouchRect.width,
      height: thumbTouchRect.height,
    };

    return (
      <Animated.View
        style={[styles.debugThumbTouchArea, positionStyle]}
        pointerEvents="none"
      />
    );
  };

  _renderThumbImage = () => {
    const { thumbImage } = this.props;
    if (!thumbImage) return null;
    return <Image source={thumbImage} />;
  };
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_SIZE,
    borderRadius: TRACK_SIZE / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  debugThumbTouchArea: {
    position: 'absolute',
    backgroundColor: 'green',
    opacity: 0.5,
  },
});