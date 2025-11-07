// import React from 'react';
// import { View, Text, StyleSheet, Dimensions } from 'react-native';
// import Speedometer from 'react-native-speedometer-chart';

// const riskLevels = [
//   { level: 'LOW', color: '#00C851' },
//   { level: 'LOW TO MODERATE', color: '#7ED321' },
//   { level: 'MODERATE', color: '#F5A623' },
//   { level: 'MODERATELY HIGH', color: '#FF8800' },
//   { level: 'HIGH', color: '#FF4444' },
//   { level: 'VERY HIGH', color: '#D0021B' },
// ];

// // Converts risk label into a value between 0–100 for the gauge
// const getRiskometerValue = (risk) => {
//   if (!risk) return 0;
//   const normalized = risk.trim().toUpperCase();
//   const index = riskLevels.findIndex(item =>
//     item.level.replace(/\n/g, ' ').toUpperCase() === normalized
//   );
//   const value = index === -1 ? 0 : ((index + 1) / riskLevels.length) * 100;
//   return isNaN(value) ? 0 : value;
// };

// // Example usage with static data
// const Riskometer = ({ risk = 'Moderately High' }) => {
//   const size = Dimensions.get('window').width * 0.8;
//   const value = getRiskometerValue(risk);
//   const currentRisk = riskLevels.find(item =>
//     item.level.replace(/\n/g, ' ').toUpperCase() === risk.trim().toUpperCase()
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.heading}>Riskometer</Text>
//       <Speedometer
//         value={value}
//         totalValue={100}
//         size={size}
//         outerColor="#d3d3d3"
//         internalColor={currentRisk?.color || '#ccc'}
//         showText
//         text={currentRisk?.level || 'UNKNOWN'}
//         textStyle={{ color: 'black', fontSize: 18 }}
//         showLabels
//         labelStyle={{ color: 'gray' }}
//         labelFormatter={(number) => `${Math.round(number)}%`}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 40,
//     alignItems: 'center',
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   heading: {
//     fontSize: 24,
//     fontWeight: '600',
//     marginBottom: 20,
//   },
// });

// export default Riskometer;
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Riskometer = () => {
  return (
    <View>
      <Text>Riskometer</Text>
    </View>
  )
}

export default Riskometer;

const styles = StyleSheet.create({})