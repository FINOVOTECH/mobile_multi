import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  BackHandler,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { setPortfolio } from '../../../store/slices/marketSlice';
import SInfoSvg from '../../svgs';
import * as Config from "../../../helpers/Config"

const Portfolio = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const Data = useSelector(state => state.marketWatch.mfCentral);
  console.log("portfolio res", Data);

  const InsidePortfolio = (item) => {
    navigation.navigate('InsidePortfolio');
    dispatch(setPortfolio(item));
  };

  useEffect(() => {
    const backAction = () => {
      // BackHandler.exitApp(); 
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);
  const selectedPortfolio = Data?.portfolio?.find(item => parseFloat(item.costValue) > 0) || Data?.portfolio?.[0];
  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            {/* <Icon name="arrow-back" size={widthToDp(6)} color="black" /> */}
            <SInfoSvg.BackButton />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          {/* <View style={{width:"75%"}}> */}
          <View >
            <Text style={styles.userName}>{Data?.investorDetails?.investorName}</Text>
            <Text style={styles.userId}>{Data?.pan}</Text>
            {/* <Text style={styles.syncInfo}>Last Synced on 7 Mar 2025</Text> */}
          </View>

          {/* <View style={{width:"25%"}}>
          <TouchableOpacity style={styles.resyncButton}>
            <Text style={styles.resyncText}>Resync</Text>
          </TouchableOpacity>
        </View> */}
        </View>

        <View style={styles.portfolioCard}>
          <View style={styles.portfolioRow}>
            <View style={styles.labelPill}>
              <Text style={styles.labelText}>Current</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.absoluteLabel}>Absolute</Text>
              <SInfoSvg.RightArrow />
              {/* <Icon name="chevron-forward-outline" size={widthToDp(4.5)} color="#888" style={styles.chevron} /> */}
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.currentAmount}>₹ {selectedPortfolio?.currentMktValue}</Text>
            <View style={styles.gainPercentContainer}>
              {parseFloat(selectedPortfolio?.gainLossPercentage) > 0 ?
                <SInfoSvg.UpGreenArrow width={30} height={30} />
                :
                <SInfoSvg.DownRedArrow width={30} height={30} />
              }
              <Text style={{
                ...styles.gainPercent,
                color: parseFloat(selectedPortfolio?.gainLossPercentage) > 0 ? Config.Colors.green : Config.Colors.red
              }}>
                {selectedPortfolio?.gainLossPercentage}%
              </Text>
            </View>
          </View>

          {/* Invested Row */}
          <View style={[styles.portfolioRow, styles.marginTop]}>
            <View style={styles.labelPill}>
              <Text style={styles.labelText}>Invested</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.gainLossLabel}>Unrealised Gain/Loss</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.investedAmount}>₹ {selectedPortfolio?.costValue}</Text>
            <Text style={styles.gainAmount}>₹ {selectedPortfolio?.gainLoss}</Text>
          </View>

          {/* Portfolio Allocation Bar */}
          <View style={styles.allocationBarContainer}>
            <LinearGradient
              colors={['#F8C471', '#F8C471', '#D7BDE2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.allocationBar}
            />
          </View>
        </View>

        {/* Transactions Button */}
        {/* <TouchableOpacity style={styles.transactionsButton}>
          <SInfoSvg.CameraIcon width={widthToDp(4)}/>
          <Text style={styles.transactionsText}>Transactions</Text>
        </TouchableOpacity> */}

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>External</Text>
          </TouchableOpacity>
        </View>

        {Data.data.flatMap((item, idx) => item.schemes).map((scheme, idx) => (
          <TouchableOpacity onPress={() => InsidePortfolio(scheme)} key={idx} style={styles.fundContainer}>
            <View style={styles.fundDetails}>
              <View>
                <Text style={styles.fundName}>{scheme?.schemeName}</Text>
                <View style={styles.fundInvestedRow}>
                  <Text style={styles.fundInvestedLabel}>Invested</Text>
                  <Text style={styles.fundInvestedAmount}>₹ {scheme.costValue}</Text>
                </View>
              </View>
              <View style={styles.fundPerformance}>
                <View style={styles.lossRow}>
                  {scheme?.gainLoss > 0 ?
                    <SInfoSvg.UpGreenArrow width={widthToDp(3.5)} height={heightToDp(3.5)} />
                    :
                    <SInfoSvg.DownRedArrow width={widthToDp(3.5)} height={heightToDp(3.5)} />
                  }
                  <Text style={{ ...styles.lossAmount, color: scheme?.gainLoss > 0 ? Config.Colors.green : Config.Colors.red }}>-₹ {scheme?.gainLoss}</Text>
                </View>
                <Text style={{
                  ...styles.lossPercent,
                  color: scheme.gainLossPercentage > 0 ? Config.Colors.green : Config.Colors.red
                }}>
                  ({scheme.gainLossPercentage}%)
                </Text>
                <View style={styles.currentRow}>
                  <Text style={styles.currentLabel}>Current</Text>
                  <Text style={styles.currentFundAmount}>₹ {scheme?.currentMktValue}</Text>
                </View>
              </View>
            </View>
            <View style={{ borderWidth: 0.5, borderColor: "gray", marginVertical: heightToDp(0.5) }} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: "black",
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: widthToDp(5),
    paddingVertical: heightToDp(2),
    // marginBottom: heightToDp(1.2),
  },
  userInfo: {
    // borderWidth:1,
    // borderColor:"black",
    paddingHorizontal: widthToDp(5),
    flexDirection: "row"
  },
  userName: {
    fontSize: widthToDp(5),
    fontWeight: 'bold',
  },
  userId: {
    fontSize: widthToDp(3.5),
    color: '#666',
    marginTop: heightToDp(0.25),
  },
  syncInfo: {
    fontSize: widthToDp(3.5),
    color: '#999',
    marginTop: heightToDp(0.25),
  },
  resyncContainer: {
    position: 'absolute',
    right: widthToDp(5),
    top: heightToDp(6),
  },
  resyncButton: {
    backgroundColor: Config.Colors.primary,
    paddingHorizontal: widthToDp(5),
    paddingVertical: heightToDp(1.2),
    borderRadius: widthToDp(5),
  },
  resyncText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: widthToDp(3.5),
  },
  portfolioCard: {
    backgroundColor: '#F8F8FF',
    margin: widthToDp(5),
    padding: widthToDp(5),
    borderRadius: widthToDp(3.75),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  portfolioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelPill: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: widthToDp(3.75),
    paddingVertical: heightToDp(0.6),
    borderRadius: widthToDp(3.75),
  },
  labelText: {
    color: '#888',
    fontSize: widthToDp(3.5),
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  absoluteLabel: {
    fontSize: widthToDp(3.5),
    color: '#888',
  },
  chevron: {
    marginLeft: widthToDp(1.25),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: heightToDp(1.2),
  },
  currentAmount: {
    fontSize: widthToDp(6),
    fontWeight: 'bold',
  },
  gainPercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gainPercent: {
    color: '#2ecc71',
    fontSize: widthToDp(4),
    marginLeft: widthToDp(1.25),
    fontWeight: 'bold',
  },
  marginTop: {
    marginTop: heightToDp(1.8),
  },
  gainLossLabel: {
    fontSize: widthToDp(3.5),
    color: '#888',
  },
  investedAmount: {
    fontSize: widthToDp(4.5),
    color: '#444',
  },
  gainAmount: {
    fontSize: widthToDp(4.5),
    color: '#444',
  },
  allocationBarContainer: {
    marginTop: heightToDp(3),
    marginBottom: heightToDp(1.2),
  },
  allocationBar: {
    height: heightToDp(1.2),
    borderRadius: widthToDp(1.25),
  },
  transactionsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: heightToDp(2.4),
    borderWidth: 1,
    borderColor: "black"
  },
  transactionsText: {
    color: '#E57373',
    marginLeft: widthToDp(1.25),
    fontSize: widthToDp(3.5),
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    marginBottom: heightToDp(1.8),
    borderStyle: "dashed"
  },
  activeTab: {
    flex: 1,
    paddingVertical: heightToDp(1.8),
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: Config.Colors.primary,
    borderStyle: "dashed"
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: heightToDp(1.8),
    alignItems: 'center',
  },
  activeTabText: {
    color: Config.Colors.primary,
    fontWeight: 'bold',
    fontSize: widthToDp(3.5),
  },
  inactiveTabText: {
    color: '#888',
    fontSize: widthToDp(3.5),
  },
  fundContainer: {
    paddingHorizontal: widthToDp(5),
    marginBottom: heightToDp(2.4),
  },
  fundDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fundName: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
    marginBottom: heightToDp(1),
    width: widthToDp(50),
  },
  fundInvestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fundInvestedLabel: {
    color: '#888',
    fontSize: widthToDp(3),
    marginRight: widthToDp(1.25),
  },
  fundInvestedAmount: {
    fontSize: widthToDp(3.5),
  },
  fundPerformance: {
    alignItems: 'flex-end',
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lossAmount: {
    // color: Config.Colors.red,
    fontSize: widthToDp(4),
    fontWeight: 'bold',
  },
  lossPercent: {
    color: '#e74c3c',
    fontSize: widthToDp(3.5),
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: heightToDp(0.6),
  },
  currentLabel: {
    color: '#888',
    fontSize: widthToDp(3),
    marginRight: widthToDp(1.25),
  },
  currentFundAmount: {
    fontSize: widthToDp(3.5),
  },
});

export default Portfolio;