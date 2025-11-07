import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  BackHandler,
} from "react-native";
import { widthToDp, heightToDp } from "../../../helpers/Responsive"; // Adjust path as needed
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import EntypoIcon from "react-native-vector-icons/Entypo";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import SInfoSvg from "../../svgs";
import * as Config from "../../../helpers/Config"

const InsidePortfolio = ({navigation}) => {
  const Data = useSelector((state) => state.marketWatch.portfolio);
  console.log("Data", Data);
  
  useEffect(() => {
     const backAction = () => {
       // BackHandler.exitApp(); 
       navigation.goBack();
       return true;
     };
 
     const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
 
     return () => backHandler.remove();
   }, []);

  return (
    <SafeAreaView style={styles.container}>
        {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SInfoSvg.BackButton/>
          {/* <Icon name="arrow-back" size={widthToDp(6)} color="black" /> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Data.schemeName}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
          <Text style={styles.activeTabText}>Overview</Text>
      </View>

      {/* Active Tab Indicator */}
      <View style={styles.tabIndicatorContainer}>
        <View style={styles.activeTabIndicator} />
        {/* <View style={styles.inactiveTabIndicator} /> */}
      </View>

      <View style={styles.portfolioCard}>
        <View style={styles.portfolioRow}>
          <View style={styles.labelPill}>
            <Text style={styles.labelText}>Current</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.absoluteLabel}>Absolute</Text>
            <SInfoSvg.RightArrow/>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.currentAmount}>₹ {Data?.currentMktValue}</Text>
          <View style={styles.gainPercentContainer}>
            {Data?.gainLossPercentage > 0 ? (
              <SInfoSvg.UpGreenArrow width={30} height={30}/>)
                :
                <SInfoSvg.DownRedArrow width={30} height={30}/>
              }
            <Text
              style={{
                ...styles.gainPercent,
                color: Data.gainLossPercentage > 0 ? Config.Colors.green : Config.Colors.red,
              }}
            >
              {Data?.gainLossPercentage}%
            </Text>
          </View>
        </View>

        <View style={[styles.portfolioRow, styles.marginTop]}>
          <View style={styles.labelPill}>
            <Text style={styles.labelText}>Invested</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.gainLossLabel}>Unrealised Gain/Loss</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.investedAmount}>₹ {Data?.costValue}</Text>
          <Text style={styles.gainAmount}>₹ {Data?.gainLoss}</Text>
        </View>
        <View style={styles.allocationBarContainer}>
          <LinearGradient
            colors={["#F8C471", "#F8C471", "#D7BDE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.allocationBar}
          />
        </View>

        {/* Allocation Legend */}
        {/* <View style={styles.allocationLegend}>
            <View style={styles.legendItem}>
              <View style={styles.equityDot} />
              <Text style={styles.legendPercentage}>91.7%</Text>
              <Text style={styles.legendLabel}>Equity</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.debtDot} />
              <Text style={styles.legendPercentage}>8.3%</Text>
              <Text style={styles.legendLabel}>Debt</Text>
            </View>
          </View> */}
      </View>

      {/* Folio Number */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Folio</Text>
        <View style={styles.folioContainer}>
          <Text style={styles.detailValue}>{Data?.folio}</Text>
          <SInfoSvg.ContentCopy width={widthToDp(5)}/>
        </View>
      </View>

      {/* Units */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Units</Text>
        <Text style={styles.detailValue}>{Data?.availableUnits}</Text>
      </View>

      {/* Bottom Indicator */}
      <View style={styles.bottomIndicator} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
   androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: "black",
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: widthToDp(4),
    paddingTop: heightToDp(2),
    paddingBottom: heightToDp(2.5),
  },
  backButton: {
    marginRight: widthToDp(4),
  },
  headerTitle: {
    fontSize: widthToDp(5),
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent:"center",
    paddingHorizontal: widthToDp(4),
    paddingVertical:heightToDp(1),
  },
  activeTab: {
    paddingVertical: heightToDp(1.2),
    marginRight: widthToDp(6),
  },
  inactiveTab: {
    paddingVertical: heightToDp(1.2),
    marginRight: widthToDp(6),
  },
  activeTabText: {
    fontSize: widthToDp(5),
    fontWeight: "600",
    color: "#000000",
  },
  inactiveTabText: {
    fontSize: widthToDp(4),
    color: "#999999",
  },
  tabIndicatorContainer: {
    flexDirection: "row",
    height: heightToDp(0.4),
    backgroundColor: "#F0F0F0",
  },
  activeTabIndicator: {
    flex: 1,
    backgroundColor: Config.Colors.primary,
  },
  inactiveTabIndicator: {
    flex: 0.5,
    backgroundColor: "transparent",
  },
  summaryCard: {
    backgroundColor: "#F8F8FE",
    marginHorizontal: widthToDp(4),
    marginTop: heightToDp(2.5),
    padding: widthToDp(4),
    borderRadius: widthToDp(3),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightToDp(2.5),
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelPill: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: widthToDp(3.5),
    paddingVertical: heightToDp(0.6),
    borderRadius: widthToDp(3.5),
  },
  pillText: {
    fontSize: widthToDp(3.5),
    color: "#666666",
  },
  valueText: {
    fontSize: widthToDp(5.5),
    fontWeight: "bold",
    color: "#000000",
  },
  returnContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  annualizedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: heightToDp(1),
  },
  annualizedText: {
    fontSize: widthToDp(3.5),
    color: "#666666",
    marginRight: widthToDp(1.5),
  },
  iconContainer: {
    backgroundColor: "#EFEFEF",
    borderRadius: widthToDp(1),
    padding: widthToDp(1),
  },
  percentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentGain: {
    fontSize: widthToDp(4.5),
    fontWeight: "bold",
    color: "#2ECC71",
  },
  gainContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  gainLabel: {
    fontSize: widthToDp(3.5),
    color: "#666666",
    marginBottom: heightToDp(1),
  },
  gainValue: {
    fontSize: widthToDp(4.5),
    fontWeight: "bold",
    color: "#000000",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: widthToDp(4),
    marginTop: heightToDp(3),
  },
  detailLabel: {
    fontSize: widthToDp(4),
    color: "#999999",
  },
  detailValue: {
    fontSize: widthToDp(4),
    fontWeight: "500",
    color: "#000000",
    marginRight:widthToDp(1)
  },
  folioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyIcon: {
    marginLeft: widthToDp(2),
  },
  bottomIndicator: {
    // position: "absolute",
    // bottom: heightToDp(2.5),
    alignSelf: "center",
    width: widthToDp(30),
    height: heightToDp(0.5),
    backgroundColor: "#E0E0E0",
    borderRadius: heightToDp(0.25),
    marginVertical:heightToDp(2)
  },
  portfolioCard: {
    backgroundColor: "#F8F8FF",
    margin: widthToDp(5),
    padding: widthToDp(5),
    borderRadius: widthToDp(3.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  portfolioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelText: {
    color: "#888",
    fontSize: widthToDp(3.5),
  },
  absoluteLabel: {
    fontSize: widthToDp(3.5),
    color: "#888",
  },
  chevron: {
    marginLeft: widthToDp(1.25),
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: heightToDp(1.2),
  },
  currentAmount: {
    fontSize: widthToDp(6),
    fontWeight: "bold",
  },
  gainPercentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  gainPercent: {
    color: "#2ecc71",
    fontSize: widthToDp(4),
    marginLeft: widthToDp(1.25),
    fontWeight: "bold",
  },
  marginTop: {
    marginTop: heightToDp(1.8),
  },
  gainLossLabel: {
    fontSize: widthToDp(3.5),
    color: "#888",
  },
  investedAmount: {
    fontSize: widthToDp(4.5),
    color: "#444",
  },
  gainAmount: {
    fontSize: widthToDp(4.5),
    color: "#444",
  },
  allocationBarContainer: {
    marginTop: heightToDp(3),
    marginBottom: heightToDp(1.2),
  },
  allocationBar: {
    height: heightToDp(1.2),
    borderRadius: widthToDp(1.25),
  },
  allocationLegend: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
});

export default InsidePortfolio;