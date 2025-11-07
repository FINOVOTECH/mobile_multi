import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import CustomSlider from '../CustomSlider';

const SliderUsageExample = () => {
  const [sliderValue, setSliderValue] = useState(0.5);
  const [volume, setVolume] = useState(0.8);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Custom Slider Examples</Text>
        
        {/* Basic Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.label}>Basic Slider</Text>
          <Text style={styles.value}>Value: {sliderValue.toFixed(2)}</Text>
          <CustomSlider
            style={styles.slider}
            value={sliderValue}
            minimumValue={0}
            maximumValue={1}
            onValueChange={setSliderValue}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E5E5E5"
            thumbTintColor="#007AFF"
          />
        </View>

        {/* Volume Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.label}>Volume Control</Text>
          <Text style={styles.value}>Volume: {Math.round(volume * 100)}%</Text>
          <CustomSlider
            style={styles.slider}
            value={volume}
            minimumValue={0}
            maximumValue={1}
            onValueChange={setVolume}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#DDD"
            thumbTintColor="#FF6B35"
            trackStyle={styles.customTrack}
            thumbStyle={styles.customThumb}
          />
        </View>

        {/* Range Slider with Steps */}
        <View style={styles.sliderContainer}>
          <Text style={styles.label}>Range Slider (0-100, step: 5)</Text>
          <Text style={styles.value}>Value: {Math.round(sliderValue * 100)}</Text>
          <CustomSlider
            style={styles.slider}
            value={sliderValue}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            onValueChange={setSliderValue}
            minimumTrackTintColor="#34C759"
            maximumTrackTintColor="#F2F2F7"
            thumbTintColor="#34C759"
            animateTransitions={true}
            animationType="spring"
          />
        </View>

        {/* Custom Styled Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.label}>Custom Styled Slider</Text>
          <CustomSlider
            style={[styles.slider, styles.customSlider]}
            value={0.3}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FF3B30"
            maximumTrackTintColor="#8E8E93"
            thumbTintColor="#FF3B30"
            trackStyle={styles.thickTrack}
            thumbStyle={styles.largeThumb}
            thumbTouchSize={{ width: 50, height: 50 }}
            onValueChange={(value) => console.log('Custom slider value:', value)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 30,
  },
  sliderContainer: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 15,
  },
  slider: {
    height: 40,
  },
  customSlider: {
    height: 60,
  },
  customTrack: {
    height: 6,
    borderRadius: 3,
  },
  customThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  thickTrack: {
    height: 8,
    borderRadius: 4,
  },
  largeThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default SliderUsageExample;