import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  PanResponder,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { widthToDp, heightToDp } from '../../helpers/Responsive'; // Adjust path as needed
import { baseUrl } from '../../helpers/Config';
import { useDispatch } from 'react-redux';
// import { useRouter } from 'expo-router';
// import { setSelectedItem } from '../../redux/searchSlice';

const FundDetail = ({ fund, handleClick }) => {
  // console.log("funddata", fund);
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => handleClick(fund)} 
      style={styles.fundDetail}
    >
      <View style={styles.fundHeader}>
        <Image 
          resizeMode="contain" 
          style={styles.fundImage} 
          source={{
            uri: fund?.s3Url || "https://cdn5.vectorstock.com/i/1000x1000/44/19/mutual-fund-vector-7404419.jpg"
          }}
        />
        <Text style={[styles.detailText, styles.boldText]}>{fund.amcName}</Text>
      </View>
      <View style={styles.returnsContainer}>
        <View style={styles.returnItem}>
          <Text style={[styles.detailText, styles.boldText]}>{fund?.nav1y || '0.00%'}</Text>
          <Text style={styles.detailText}>1Y Return</Text>
        </View>
        <View style={styles.returnItem}>
          <Text style={[styles.detailText, styles.boldText]}>{fund?.nav3y || '0.00%'}</Text>
          <Text style={styles.detailText}>3Y Return</Text>
        </View>
        <View style={styles.returnItem}>
          <Text style={[styles.detailText, styles.boldText]}>{fund?.nav5y || '0.00%'}</Text>
          <Text style={styles.detailText}>5Y Return</Text>
        </View>
      </View>
      <Text style={[styles.detailText, styles.boldText]}>Type: {fund.schemeType}</Text>
    </TouchableOpacity>
  );
};

const CategoryCard = ({ title, fnUid, handleClick }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [fundDetails, setFundDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (uid) => {
    // console.log("===data==");
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/mfsearch/diversify/portfolio?uid=${uid}`);
      const data = await res.json();
      // console.log("datata", data?.isInDetails);
      setFundDetails(data?.isInDetails || []);
    } catch (error) {
      console.log("Error fetching fund details:", error);
      setFundDetails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = () => {
    setShowDetails(!showDetails);
    if (!showDetails) {
      fetchData(fnUid);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={handleCategoryClick}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.showButton}>{showDetails ? "Hide" : "Show"} Details</Text>
      </TouchableOpacity>
      {showDetails && (
        <View style={styles.detailContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="blue" />
          ) : (
            fundDetails.map((fund, index) => (
              <FundDetail key={index} fund={fund.fundDetails} handleClick={handleClick} />
            ))
          )}
        </View>
      )}
    </View>
  );
};

const DiversedProduct = () => {
  const dispatch = useDispatch();
//   const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fundCategories, setFundCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/mfsearch/diversify/portfolio/all`);
        const data = await res.json();

        if (data?.status === "SUCCESS" && data?.mfStatus?.fundNames) {
          setFundCategories(data.mfStatus.fundNames);
        } else {
          setFundCategories([]);
        }
      } catch (error) {
        console.log("Something went wrong", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClick = (fund) => {
    // dispatch(setSelectedItem(fund));
    router.push("marketWatch");
  };

  return (
    <View style={styles.diversedContainer}>
      {loading ? (
        <ActivityIndicator size="small" color="blue" />
      ) : (
        <FlatList
          data={fundCategories}
          renderItem={({ item }) => (
            <CategoryCard title={item.name} fnUid={item.fnUid} handleClick={handleClick} />
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default function Products() {
  const [activeTab, setActiveTab] = useState('wealthyPortfolio');
  const tabIndex = useRef(0); 
  const tabOrder = ['wealthyPortfolio', 'mutualFunds', 'stocks']; 
  const pan = useRef(new Animated.Value(0)).current; 

  // Detect swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > widthToDp(2.5),
      onPanResponderMove: (_, gestureState) => {
        pan.setValue(gestureState.dx); // Move animation as the user swipes
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -widthToDp(12.5) && tabIndex.current < tabOrder.length - 1) {
          // Swipe left (threshold: -50px becomes -12.5% of screen width)
          tabIndex.current += 1;
        } else if (gestureState.dx > widthToDp(12.5) && tabIndex.current > 0) {
          // Swipe right (threshold: 50px becomes 12.5% of screen width)
          tabIndex.current -= 1;
        }
        setActiveTab(tabOrder[tabIndex.current]); // Update active tab
        Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start(); // Reset position
      },
    })
  ).current;

  const renderContent = () => {
    switch (activeTab) {
      case 'wealthyPortfolio':
        return <DiversedProduct />;
      case 'mutualFunds':
        return <DiversedProduct />;
      case 'stocks':
        return <DiversedProduct />;
      default:
        return null;
    } 
  };

  return (
    <View style={styles.container}>
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'wealthyPortfolio' && styles.activeTab,
          ]}
          onPress={() => {
            tabIndex.current = 0;
            setActiveTab('wealthyPortfolio');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'wealthyPortfolio' && styles.activeTabText,
            ]}
          >
            Diversed Portfolio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'mutualFunds' && styles.activeTab,
          ]}
          onPress={() => {
            tabIndex.current = 1;
            setActiveTab('mutualFunds');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'mutualFunds' && styles.activeTabText,
            ]}
          >
            SIP Portfolio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stocks' && styles.activeTab,
          ]}
          onPress={() => {
            tabIndex.current = 2;
            setActiveTab('stocks');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'stocks' && styles.activeTabText,
            ]}
          >
            Smart Index Portfolio
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Content */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#c9df8a',
    justifyContent: 'space-around',
    paddingVertical: heightToDp(0.6), // Responsive vertical padding
  },
  tab: {
    paddingHorizontal: widthToDp(2.5), // Responsive horizontal padding
    paddingVertical: heightToDp(1.2), // Responsive vertical padding
    borderBottomWidth: heightToDp(0.25), // Responsive border width
    borderBottomColor: 'transparent',
    minWidth: widthToDp(28), // Ensure minimum tab width
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#0473EA',
  },
  tabText: {
    color: "#0473EA",
    fontSize: widthToDp(3.8), // Responsive font size
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: widthToDp(2.5), // Responsive horizontal padding
    paddingVertical: heightToDp(1.2), // Responsive vertical padding
    backgroundColor: 'white',
  },
  // DiversedProduct styles
  diversedContainer: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  listContent: {
    padding: widthToDp(1.25), // Responsive padding
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: widthToDp(2.5), // Responsive border radius
    padding: widthToDp(2.5), // Responsive padding
    marginBottom: heightToDp(1.2), // Responsive margin
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: heightToDp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: widthToDp(1.25),
  },
  categoryHeader: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center"
  },
  title: {
    fontSize: widthToDp(4), // Responsive font size
    color: "#333",
    fontWeight: '600',
  },
  showButton: {
    fontSize: widthToDp(3.5), // Responsive font size
    color: "#007bff",
  },
  detailContainer: {
    marginTop: heightToDp(2), // Responsive margin
    borderRadius: widthToDp(2), // Responsive border radius
    gap: heightToDp(1.2),
  },
  fundDetail: {
    backgroundColor: "#f9f9f9",
    marginBottom: heightToDp(1.2), // Responsive margin
    padding: widthToDp(2.5), // Responsive padding
    borderRadius: widthToDp(2), // Responsive border radius
  },
  fundHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: widthToDp(0.5),
    marginVertical: heightToDp(0.6),
  },
  fundImage: {
    height: widthToDp(10), // Responsive image size
    width: widthToDp(10),
  },
  returnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: heightToDp(0.6),
  },
  returnItem: {
    alignItems: "center"
  },
  detailText: {
    fontSize: widthToDp(3.5), // Responsive font size
    color: "black",
  },
  boldText: {
    fontWeight: "bold"
  },
});