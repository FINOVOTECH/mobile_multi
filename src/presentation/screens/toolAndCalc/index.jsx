import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import SIPCalculator from '../SIPCalc';
import CostOfDelayCalculator from '../../calculator/costOfDelaycalc';
import * as Config from '../../../helpers/Config';
import CommonHeader from '../../../components/CommonHeader';
import { heightToDp, widthToDp } from '../../../helpers/Responsive';
import LumpSumCalculator from '../../calculator/lumpsumCalc';
import EMICalculator from '../../calculator/emiCalc';
import EducationCalculator from '../../calculator/educationCalc';
import MarriageCalculator from '../../calculator/marriageCalc';
import SInfoSvg from '../../svgs';

const ToolsAndCalc = ({ navigation }) => {
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: 'sip', title: 'SIP' },
    { key: 'lumpsum', title: 'Lumpsum' },
    { key: 'emi', title: 'EMI' },
    { key: 'education', title: 'Education' },
    { key: 'marriage', title: 'Marriage' },
    // { key: 'delay', title: 'Cost of Delay' },
  ]);
 useEffect(() => {
        const backAction = () => {
        // BackHandler.exitApp(); 
        navigation.goBack();
          return true; 
        };
      
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      
        return () => backHandler.remove();
      }, []);
  const renderScene = SceneMap({
    sip: SIPCalculator,
    lumpsum: LumpSumCalculator,
    emi: EMICalculator,
    education: EducationCalculator,
    marriage: MarriageCalculator,
    // delay: CostOfDelayCalculator,
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: Config.Colors.white }}
      style={{ backgroundColor: Config.Colors.primary }}
      labelStyle={{ color: 'black', fontWeight: 'bold' }}
      scrollEnabled={true}
      tabStyle={{ width: 'auto', minWidth: 80 }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* <CommonHeader 
        showBackButton={true}
        onBackPress={() => navigation?.goBack()} 
      /> */}
      <View style={{alignItems:"center",paddingVertical:heightToDp(2), flexDirection:"row", justifyContent:"center"}}>
        <SInfoSvg.BackButton style={{position:"absolute", left:10}}/>
        <Text style={{ fontSize: 20, fontWeight: '600',color:"black" }}>
          Tools And Calculator
        </Text>
      </View>
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        style={styles.tabView}
      />
    </SafeAreaView>
  );
};

export default ToolsAndCalc;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: Config.Colors.cyan_blue,
    backgroundColor: "transparent",
    // backgroundColor: "black",
  },
  tabView: {
    // marginTop: 20,
  },
});