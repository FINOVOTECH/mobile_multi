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
import { widthToDp, heightToDp } from "../../helpers/Responsive"; 
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import EntypoIcon from "react-native-vector-icons/Entypo";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
  
const InsidePortfolio = ({ navigation }) => {
  const Data = useSelector((state) => state.login.portfolio);
  useEffect(() => {
    const handleBackPress = () => {
      navigation.replace("Portfolio"); 
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={widthToDp(6)} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Data?.schemeName || "Portfolio"}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>Overview</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.inactiveTab}>
          <Text style={styles.inactiveTabText}>Transactions</Text>
        </TouchableOpacity> */}
      </View>

      {/* Active Tab Indicator */}
      <View style={styles.tabIndicatorContainer}>
        <View style={styles.activeTabIndicator} />
        <View style={styles.inactiveTabIndicator} />
      </View>

      <View style={styles.portfolioCard}>
        <View style={styles.portfolioRow}>
          <View style={styles.labelPill}>
            <Text style={styles.labelText}>Current</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.absoluteLabel}>Absolute</Text>
            <Icon
              name="chevron-forward-outline"
              size={widthToDp(4.5)}
              color="#888"
              style={styles.chevron}
            />
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.currentAmount}>₹ {Data?.currentMktValue || "0"}</Text>
          <View style={styles.gainPercentContainer}>
            {(Data?.gainLossPercentage || 0) > 0 ? (
              <Icon name="triangle" size={widthToDp(3.5)} color="#2ecc71" />
            ) : (
              <EntypoIcon name="triangle-down" size={widthToDp(6)} color="red" />
            )}
            <Text
              style={{
                ...styles.gainPercent,
                color: (Data?.gainLossPercentage || 0) > 0 ? "green" : "red",
              }}
            >
              {Data?.gainLossPercentage || 0}%
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
          <Text style={styles.investedAmount}>₹ {Data?.costValue || "0"}</Text>
          <Text style={styles.gainAmount}>₹ {Data?.gainLoss || "0"}</Text>
        </View>

        {/* Portfolio Allocation Bar */}
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
          <Text style={styles.detailValue}>{Data?.folio || "N/A"}</Text>
          <MaterialIcon
            name="content-copy"
            size={widthToDp(5)}
            color="#6200EE"
            style={styles.copyIcon}
          />
        </View>
      </View>

      {/* Units */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Units</Text>
        <Text style={styles.detailValue}>{Data?.availableUnits || "0"}</Text>
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
    paddingHorizontal: widthToDp(4),
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
    fontSize: widthToDp(4),
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
    flex: 0.5,
    backgroundColor: "#6200EE",
  },
  inactiveTabIndicator: {
    flex: 0.5,
    backgroundColor: "transparent",
  },
  portfolioCard: {
    backgroundColor: "#F8F8FF",
    margin: widthToDp(5),
    padding: widthToDp(5),
    borderRadius: widthToDp(4),
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
  labelPill: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(0.6),
    borderRadius: widthToDp(4),
  },
  labelText: {
    color: "#888",
    fontSize: widthToDp(3.5),
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  absoluteLabel: {
    fontSize: widthToDp(3.5),
    color: "#888",
  },
  chevron: {
    marginLeft: widthToDp(1.2),
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
    marginLeft: widthToDp(1.2),
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
    borderRadius: widthToDp(1.2),
  },
  allocationLegend: {
    flexDirection: "row",
    justifyContent: "flex-start",
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
  },
  folioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyIcon: {
    marginLeft: widthToDp(2),
  },
  bottomIndicator: {
    position: "absolute",
    bottom: heightToDp(2.5),
    alignSelf: "center",
    width: widthToDp(30),
    height: heightToDp(0.5),
    backgroundColor: "#E0E0E0",
    borderRadius: heightToDp(0.25),
  },
});

export default InsidePortfolio;