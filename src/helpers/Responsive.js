import {Dimensions, PixelRatio} from 'react-native';
const {width, height} = Dimensions.get('window');

let currentWidth = width;
let currentHeight = height;

const widthToDp = number => {
  let givenWidth = typeof number === 'number' ? number : parseFloat(number);
  return PixelRatio.roundToNearestPixel((currentWidth * givenWidth) / 100);
};

const heightToDp = number => {
  let givenHeight = typeof number === 'number' ? number : parseFloat(number);
  return PixelRatio.roundToNearestPixel((currentHeight * givenHeight) / 100);
};

export {widthToDp, heightToDp};