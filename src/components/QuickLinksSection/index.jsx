import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive';
import * as Config from '../../helpers/Config';
import * as Icons from '../../helpers/Icons';
import { useNavigation } from '@react-navigation/native';

const QuickLinksSection = ({ onViewAll }) => {
  const navigate = useNavigation();
  const quickLinksData = [
    {
      id: '1',
      title: 'Tools &\nCalculators',
      icon: require('../../assets/images/ToolCalc.png'),
      route: 'ToolsAndCalc',
    },
    {
      id: '2',
      title: 'NFO',
      icon: require('../../assets/images/serviceRequest.png'),
      route: 'NFO',
    },
    {
      id: '3',
      title: 'Transaction\nHistory',
      icon: require('../../assets/images/transaction.png'),
      route: 'Transaction',
    },
    {
      id: '4',
      title: 'Manage\nAccount',
      icon: require('../../assets/images/manageAcc.png'),
      route: 'Settings',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Centered Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image
            source={Icons.quick_link}
            style={styles.linkIcon}
            resizeMode="contain"
          />
          <Text style={styles.sectionTitle}>Quick Links</Text>
        </View>
      </View>

      {/* Centered Grid using Flexbox */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {quickLinksData.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickLinkItem}
              onPress={() => navigate.navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={item.icon}
                  style={styles.iconImage}
                />
              </View>
              <Text style={styles.quickLinkTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default QuickLinksSection;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Config.Colors.cyan_blue,
    borderRadius: widthToDp(3),
    marginHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
  },
  header: {
    alignItems: 'start',
    marginBottom: heightToDp(3),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'start',
  },
  linkIcon: {
    width: widthToDp(6),
    height: widthToDp(6),
    marginRight: widthToDp(2),
    tintColor: Config.Colors.primary,
  },
  sectionTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: '700',
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    color: '#2C3E50',
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: widthToDp(2),
  },
  quickLinkItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: widthToDp(1),
  },
  iconContainer: {
    width: widthToDp(14),
    height: widthToDp(14),
    borderRadius: widthToDp(7),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: heightToDp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconImage: {
    width: widthToDp(7),
    height: widthToDp(7),
    resizeMode: 'contain',
  },
  quickLinkTitle: {
    fontSize: widthToDp(3.2),
    fontFamily: Config.fontFamilys.Poppins_Medium,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: widthToDp(4.2),
  },
});