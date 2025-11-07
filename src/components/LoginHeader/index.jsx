import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import SInfoSvg from '../../presentation/svgs';
import * as Icons from '../../helpers/Icons';

export const LoginHeader = ({ showBackButton = false, onBackPress, logoSource }) => {
  return (
    <View style={styles.headerSection}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <SInfoSvg.BackButton />
        </TouchableOpacity>
      )}
      <View style={styles.illustrationContainer}>
        <Image
          source={logoSource}
          style={styles.illustrationImage}
          // defaultSource={require('../../../assets/images/login.png')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    flex: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: heightToDp(5),
    position: 'relative',
  },
  illustrationContainer: {
    width: widthToDp(80),
    height: heightToDp(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: widthToDp(110),
    height: heightToDp(40),
    resizeMode: 'contain',
  },
  backButton: {
    position: 'absolute',
    top: heightToDp(2),
    left: widthToDp(5),
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: widthToDp(5),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1,
  },
});