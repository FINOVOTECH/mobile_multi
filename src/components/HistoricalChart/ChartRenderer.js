import React, { 
  useState, 
  useRef, 
  useMemo, 
  useCallback, 
  memo,
  useEffect
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Svg, {
  Path,
  Circle,
  Line,
  LinearGradient,
  Stop,
  Defs,
} from 'react-native-svg';
import { formatIndianRupee } from '../../utils/chartUtils';

const { width: screenWidth } = Dimensions.get('window');

// Memoized components for better performance
const YAxisLabels = memo(({ chartCalculations, actualChartHeight, topPadding, bottomPadding }) => {
  if (!chartCalculations) return null;
  
  const { maxNAV, navRange } = chartCalculations;
  
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const value = maxNAV - (i * navRange) / 4;
        return (
          <Text
            key={`y-label-${i}`}
            style={[
              styles.yAxisLabel,
              {
                position: 'absolute',
                left: 5,
                top: topPadding + (i * (actualChartHeight - topPadding - bottomPadding)) / 4 - 8,
              }
            ]}
          >
            {formatIndianRupee(value)}
          </Text>
        );
      })}
    </>
  );
});

const GridLines = memo(({ chartCalculations, actualChartHeight, topPadding, bottomPadding, chartWidth, leftPadding, rightPadding }) => {
  if (!chartCalculations) return null;
  
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <Line
          key={`grid-${i}`}
          x1={leftPadding}
          y1={topPadding + (i * (actualChartHeight - topPadding - bottomPadding)) / 4}
          x2={chartWidth - rightPadding}
          y2={topPadding + (i * (actualChartHeight - topPadding - bottomPadding)) / 4}
          stroke="#E5E7EB"
          strokeWidth={0.8}
          strokeDasharray="3,3"
        />
      ))}
    </>
  );
});

const ChartRenderer = memo(({
  data,
  chartType = 'line',
  chartHeight = 300,
  primaryColor = '#3B82F6',
  onDataPointSelect
}) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const gestureState = useRef({
    isDragging: false,
    lastUpdateTime: 0,
    selectedIndex: -1
  });

  // Optimized chart calculations with requestAnimationFrame-like behavior
  const chartCalculations = useMemo(() => {
    if (!data.length) return null;
    
    const chartWidth = screenWidth;
    const leftPadding = 50;
    const rightPadding = 10;
    const topPadding = 20;
    const bottomPadding = 20;
    const graphWidth = chartWidth - leftPadding - rightPadding;
    const graphHeight = chartHeight - topPadding - bottomPadding;
    
    // Use more efficient min/max calculation
    const navValues = data.map(item => item.nav);
    const minNAV = Math.min(...navValues);
    const maxNAV = Math.max(...navValues);
    const navRange = maxNAV - minNAV || 1;
    
    // Pre-calculate all points for better performance
    const points = data.map((item, i) => {
      const x = leftPadding + (i / (data.length - 1)) * graphWidth;
      const y = topPadding + ((maxNAV - item.nav) / navRange) * graphHeight;
      return { x, y, data: item, index: i };
    });

    // Optimize path generation
    const pathData = points.reduce((path, point, i) => {
      return i === 0 ? `M${point.x},${point.y}` : `${path} L${point.x},${point.y}`;
    }, '');

    const areaPath = chartType === 'area' && points.length > 0 
      ? `${pathData} L${points[points.length - 1].x},${chartHeight - bottomPadding} L${points[0].x},${chartHeight - bottomPadding} Z`
      : pathData;

    return {
      chartWidth,
      leftPadding,
      rightPadding,
      topPadding,
      bottomPadding,
      minNAV,
      maxNAV,
      navRange,
      points,
      xPositions: points.map(p => p.x),
      pathData,
      areaPath
    };
  }, [data, chartHeight, chartType]);

  // Ultra-optimized point finding with binary search
  const findClosestDataPoint = useCallback((gestureX) => {
    if (!chartCalculations?.xPositions.length) return null;
    
    const { xPositions, points } = chartCalculations;
    
    // Binary search for better performance with large datasets
    let left = 0;
    let right = xPositions.length - 1;
    
    while (right - left > 1) {
      const mid = Math.floor((left + right) / 2);
      if (xPositions[mid] <= gestureX) {
        left = mid;
      } else {
        right = mid;
      }
    }
    
    const leftDist = Math.abs(xPositions[left] - gestureX);
    const rightDist = Math.abs(xPositions[right] - gestureX);
    
    return leftDist <= rightDist ? points[left] : points[right];
  }, [chartCalculations]);

  // Throttled gesture handlers
  const onGestureEvent = useCallback((event) => {
    const now = Date.now();
    if (now - gestureState.current.lastUpdateTime < 16) return; // 60fps throttle
    
    gestureState.current.lastUpdateTime = now;
    const { x } = event.nativeEvent;
    
    const closestPoint = findClosestDataPoint(x);
    if (!closestPoint || closestPoint.index === gestureState.current.selectedIndex) return;
    
    gestureState.current.selectedIndex = closestPoint.index;
    setSelectedPoint(closestPoint);
    onDataPointSelect?.(closestPoint.data, closestPoint.index);
  }, [findClosestDataPoint, onDataPointSelect]);

  const onHandlerStateChange = useCallback((event) => {
    const { state, x } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      const point = findClosestDataPoint(x);
      if (point) {
        setSelectedPoint(point);
        setTooltipVisible(true);
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    } else if (state === State.END || state === State.CANCELLED) {
      setTimeout(() => {
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setTooltipVisible(false);
          setSelectedPoint(null);
        });
      }, 600);
    }
  }, [findClosestDataPoint, tooltipOpacity]);

  if (!chartCalculations) return null;

  const { chartWidth, leftPadding, rightPadding, topPadding, bottomPadding, pathData, areaPath } = chartCalculations;

  return (
    <View style={styles.chartContainer}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minDist={0}
        maxPointers={1}
      >
        <View style={[styles.chartTouchArea, { height: chartHeight }]}>
          <YAxisLabels 
            chartCalculations={chartCalculations}
            actualChartHeight={chartHeight}
            topPadding={topPadding}
            bottomPadding={bottomPadding}
          />
          
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            
            <GridLines
              chartCalculations={chartCalculations}
              actualChartHeight={chartHeight}
              topPadding={topPadding}
              bottomPadding={bottomPadding}
              chartWidth={chartWidth}
              leftPadding={leftPadding}
              rightPadding={rightPadding}
            />
            
            <Path
              d={chartType === 'area' ? areaPath : pathData}
              fill={chartType === 'area' ? "url(#navGradient)" : "none"}
              stroke={primaryColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {selectedPoint && tooltipVisible && (
              <>
                <Circle
                  cx={selectedPoint.x}
                  cy={selectedPoint.y}
                  r={6}
                  fill={primaryColor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <Line
                  x1={selectedPoint.x}
                  y1={topPadding}
                  x2={selectedPoint.x}
                  y2={chartHeight - bottomPadding}
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  opacity={0.6}
                />
              </>
            )}
          </Svg>
        </View>
      </PanGestureHandler>

      {tooltipVisible && selectedPoint && (
        <Animated.View
          style={[
            styles.tooltip,
            {
              left: Math.max(10, Math.min(selectedPoint.x - 70, chartWidth - 150)),
              top: Math.max(10, selectedPoint.y - 80),
              opacity: tooltipOpacity,
            },
          ]}
        >
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipDate}>{selectedPoint.data.formattedDate}</Text>
            <Text style={[styles.tooltipNAV, { color: primaryColor }]}>
              {formatIndianRupee(selectedPoint.data.nav)}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  chartContainer: {
    position: 'relative',
    width: '100%',
  },
  chartTouchArea: {
    width: '100%',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
    zIndex: 1000,
  },
  tooltipContent: {
    alignItems: 'center',
  },
  tooltipDate: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  tooltipNAV: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
  },
});

export default ChartRenderer;