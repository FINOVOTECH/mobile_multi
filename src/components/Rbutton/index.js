import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View, 
} from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from "../../helpers/Config"

const Rbutton = ({
  title,
  loading = false,
  onPress,
  style,
  textStyle,
  disabled = false,
}) => {
  const buttonTitle = title || 'CLICK HERE';

  return (
    <View style={[styles.outerContainer, style, (loading || disabled) && styles.outerDisabled]}>
      <TouchableOpacity
        style={[styles.button, (loading || disabled) && styles.disabled]}
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.7}
      >
        {loading ? (
          // Loading spinner color changed to black for visibility on white background
          <ActivityIndicator color="#000000" />
        ) : (
          <>
            <Text style={[styles.buttonText, textStyle]}>{buttonTitle}</Text>
            
            {/* Unicode right arrow (→) as the separator icon */}
            <Text style={styles.icon}>→</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Rbutton;

const styles = StyleSheet.create({
  outerContainer: {
    padding: 2, 
    borderRadius: 8,
    backgroundColor: '#000000', 
    alignSelf: 'stretch', 
    marginVertical: heightToDp(1.5),
  },
  outerDisabled: {
    backgroundColor: '#A0A0A0', 
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: widthToDp(6),
    paddingVertical: heightToDp(2),
    borderRadius: 6, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    backgroundColor: '#F0F0F0', 
  },
  buttonText: {
    color: '#000000', 
    fontSize: widthToDp(4.5), 
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Config.fontFamilys?.Poppins_ExtraBold || 'System', 
  },
  icon: {
    color: '#000000',
    fontSize: widthToDp(6),
    fontWeight: '800',
    marginLeft: widthToDp(3),
  },
});
