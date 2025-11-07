import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, PanResponder, SafeAreaView } from 'react-native';
// import DiversedProduct from '../../../components/DiversedProduct';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { widthToDp, heightToDp } from '../../utils/responsive'; // Adjust path as needed

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
        return "";
      case 'mutualFunds':
        return "";
      case 'stocks':
        return "";
      default:
        return null;
    } 
  };

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
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
});