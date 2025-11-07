import React from 'react';
import { View, StyleSheet, Image,Text } from 'react-native';
import * as Icons from '../../../helpers/Icons';
import * as Config from "../../../helpers/Config"
import { heightToDp, widthToDp } from '../../../helpers/Responsive';

export default function SplashScreen() {
    // console.log("Splash Screen called"); 
  return (
    <View style={styles.container}>
      <Image
        source={Icons.splash_screen} 
        style={{ width: widthToDp(60), height: heightToDp(60) }}
        resizeMode="contain" 
      />
      {/* <Text>Welcome to Profile!</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:Config.Colors.white
  },
});
