import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Config from '../../helpers/Config';
import * as Icons from '../../helpers/Icons';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SInfoSvg from '../../presentation/svgs';
import bgvector from '../../assets/Icons/vector.png';

const CommonHeader = ({
  onProfilePress,
  onSearchPress,
  userName = '',
  showBackButton = false,
  onBackPress,
  greetText =false
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning, ${userName}`;
    if (hour < 17) return `Good Afternoon, ${userName}`;
    return `Good Evening, ${userName}`;
  };

  return (
    <View style={styles.container}>
      {showBackButton ? (
        <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
          {/* <Ionicons
            name="arrow-back"
            size={widthToDp(5)}
            color={Config.Colors.textColor.textColor_1}
          /> */}
          <SInfoSvg.BackButton  width={20} height={20}  />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onProfilePress} style={styles.iconButton}>
          <Image
            source={Icons.logo}
            style={{
              width: widthToDp(12),
              height: heightToDp(5),
              borderRadius: 25,
              overflow: 'hidden',
              borderWidth: 0.5,
              borderColor: Config.Colors.gray,
            }}
          />
        </TouchableOpacity>
      )}

     {greetText && <View style={styles.greetingContainer}>
        <Text style={styles.greetingText} numberOfLines={1}>
          {getGreeting()}
        </Text>
      </View>}
      {/* Right Section - Search */}

      <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
          <SInfoSvg.BellIcon width={24} height={25} />
        </TouchableOpacity>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(1),
    backgroundColor:  "#8F5AC0",
    // borderWidth:1,
    // borderColor:Config.Colors.black
  },
  iconButton: {
    width: widthToDp(10),
    height: widthToDp(10),
    justifyContent: 'center',
    alignItems: 'start',
  },
  greetingContainer: {
    flex: 1,
    marginHorizontal: widthToDp(2),
  },
  greetingText: {
    color: Config.Colors.textColor.textColor_7,
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontWeight:600,
    fontSize: widthToDp(4),
    textAlign: 'center',
  },
});

export default React.memo(CommonHeader);
