import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Rbutton from '../Rbutton';

const StartInvestingCard = React.memo(({ onStartInvesting }) => {

  return (
    <View style={styles.card}>
   
      <Text style={styles.description}>
        Start your investment journey today and take the first step toward achieving your financial goals.
      </Text>
      <View style={{alignItems:'center'}}>

      <Rbutton
      title={"Start Investing"}
      onPress={onStartInvesting}
      style={{width: '70%'}}
      />
      </View>
    </View>
  );
});
export default StartInvestingCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: widthToDp(4),
    padding: widthToDp(2),
    marginHorizontal: heightToDp(2),
    shadowRadius: widthToDp(2),
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  iconContainer: {
    marginBottom: heightToDp(3),
  },
  iconGradient: {
    width: widthToDp(20),
    height: widthToDp(20),
    borderRadius: widthToDp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: widthToDp(5.5),
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    color: Config.Colors.textColor.textColor_2,
    marginBottom: heightToDp(2),
    textAlign: 'center',
  },
  description: {
    fontSize: widthToDp(4),
    fontFamily: Config.fontFamilys.Poppins_Regular,
    color: Config.Colors.black,
    textAlign: 'center',
    lineHeight: widthToDp(5.5),
    marginBottom: heightToDp(2),
    paddingHorizontal: widthToDp(2),
  },
  ctaButton: {
    backgroundColor: Config.Colors.secondary,
    borderRadius: widthToDp(8),
    paddingVertical: heightToDp(1.5),
    width: '70%',
    shadowColor: Config.Colors.black,
    shadowOffset: { width: 0, height: heightToDp(0.3) },
    shadowOpacity: 0.2,
    shadowRadius: widthToDp(1),
    elevation: 3,
    // alignItems:"center"
  },
  ctaButtonText: {
    fontSize: widthToDp(4.5),
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    color: Config.Colors.white,
    textAlign: 'center',
  },
});

