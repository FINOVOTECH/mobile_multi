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
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Svg, {
  Path,
  Circle,
  Line,
  LinearGradient,
  Stop,
  Defs,
  Rect,
} from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

// Memoized utility functions outside component to prevent recreating
const formatIndianRupee = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(0)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(0)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)} K`;
  return `₹${value.toFixed(0)}`;
};

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      const third = parseInt(parts[2]);
      
      if (third > 1000) {
        return first > 12 
          ? new Date(third, second - 1, first)
          : new Date(third, second - 1, first);
      }
    }
  }
  
  return new Date(dateStr);
};

// Memoized components for better performance
const TimeRangeButton = memo(({ range, active, onPress }) => (
  <TouchableOpacity
    style={[
      styles.timeButton, 
      active && { ...styles.timeButtonActive, backgroundColor: '#1768BF' }
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.timeButtonText, 
      active && styles.timeButtonTextActive
    ]}>
      {range}
    </Text>
  </TouchableOpacity>
));

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

const XAxisLabels = memo(({ chartCalculations, actualChartHeight, bottomPadding }) => {
  if (!chartCalculations) return null;
  
  const { points, chartWidth, leftPadding, rightPadding } = chartCalculations;
  
  // Show only a few labels to avoid clutter
  const labelCount = Math.min(5, points.length);
  const step = Math.floor(points.length / (labelCount - 1));
  
  return (
    <>
      {points.map((point, index) => {
        if (index % step !== 0 && index !== points.length - 1) return null;
        
        return (
          <Text
            key={`x-label-${index}`}
            style={[
              styles.xAxisLabel,
              {
                position: 'absolute',
                left: point.x - 25,
                top: actualChartHeight - bottomPadding + 5,
              }
            ]}
          >
            {new Date(point.data.date).getFullYear()}
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
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={0.8}
          strokeDasharray="3,3"
        />
      ))}
    </>
  );
});

const ChartPath = memo(({ chartType, pathData, areaPath, shadowPath }) => {
  return (
    <>
      {/* Dropping shadow path */}
      <Path
        d={shadowPath}
        fill="url(#shadowGradient)"
        stroke="none"
      />
      
      {/* Main chart path */}
      <Path
        d={chartType === 'area' ? areaPath : pathData}
        fill={chartType === 'area' ? "url(#navGradient)" : "none"}
        stroke="#ffffff"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
});

const SelectedPointIndicator = memo(({ selectedPoint, tooltipVisible, topPadding, actualChartHeight, bottomPadding }) => {
  if (!selectedPoint || !tooltipVisible) return null;
  
  return (
    <>
      <Circle
        cx={selectedPoint.x}
        cy={selectedPoint.y}
        r={6}
        fill="#ffffff"
        stroke="#2B8DF6"
        strokeWidth={2}
      />
      <Circle
        cx={selectedPoint.x}
        cy={selectedPoint.y}
        r={10}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.5}
        opacity={0.6}
      />
      <Line
        x1={selectedPoint.x}
        y1={topPadding}
        x2={selectedPoint.x}
        y2={actualChartHeight - bottomPadding}
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.6}
      />
    </>
  );
});

const ChartTooltip = memo(({ tooltipVisible, selectedPoint, chartWidth, tooltipOpacity }) => {
  if (!tooltipVisible || !selectedPoint) return null;
  
  return (
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
        <Text style={[styles.tooltipNAV, { color: '#ffffff' }]}>
          {formatIndianRupee(selectedPoint.data.nav)}
        </Text>
      </View>
      <View style={[
        styles.tooltipPointer,
        {
          left: Math.max(50, Math.min(70, selectedPoint.x - (Math.max(10, Math.min(selectedPoint.x - 70, chartWidth - 150))))),
        }
      ]} />
    </Animated.View>
  );
});

const OptimizedSVGChart = memo(({ 
  chartCalculations, 
  actualChartHeight, 
  chartType, 
  selectedPoint, 
  tooltipVisible, 
  topPadding, 
  bottomPadding, 
  leftPadding, 
  rightPadding 
}) => {
  if (!chartCalculations) return null;

  const { chartWidth, pathData, areaPath, shadowPath } = chartCalculations;

  return (
    <Svg width={chartWidth} height={actualChartHeight}>
      <Defs>
        {/* Main area gradient */}
        <LinearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
          <Stop offset="70%" stopColor="#ffffff" stopOpacity={0.15} />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        
        {/* Dropping shadow gradient - white to transparent */}
        <LinearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
          <Stop offset="50%" stopColor="#ffffff" stopOpacity={0.15} />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      
      {/* <GridLines
        chartCalculations={chartCalculations}
        actualChartHeight={actualChartHeight}
        topPadding={topPadding}
        bottomPadding={bottomPadding}
        chartWidth={chartWidth}
        leftPadding={leftPadding}
        rightPadding={rightPadding}
      /> */}
      
      <ChartPath
        chartType={chartType}
        pathData={pathData}
        areaPath={areaPath}
        shadowPath={shadowPath}
      />
      
      <SelectedPointIndicator
        selectedPoint={selectedPoint}
        tooltipVisible={tooltipVisible}
        topPadding={topPadding}
        actualChartHeight={actualChartHeight}
        bottomPadding={bottomPadding}
      />
    </Svg>
  );
});

const ChartLoading = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#ffffff" />
    <Text style={styles.loadingText}>Processing chart data...</Text>
  </View>
));

const HistoricalNavChart = memo(({
  data = [],
  title = "Historical NAV Performance",
  subtitle = "Track net asset value over time",
  currency = "₹",
  initialChartType = 'line',
  initialTimeRange = '1M',
  primaryColor = '#ffffff',
  backgroundColor = 'transparent',
  onDataPointSelect = null,
  chartHeight: customHeight = 300,
  timeRanges = ['1M', '3M', '6M', '1Y', '5Y', 'ALL'],
}) => {
  const [chartType, setChartType] = useState(initialChartType);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const gestureState = useRef({
    isDragging: false,
    lastUpdateTime: 0,
    selectedIndex: -1
  });

  const actualChartHeight = customHeight;
  
  // Optimized data processing with async simulation for large datasets
  const processedData = useMemo(() => {
    if (!data.length) {
      setIsDataReady(true);
      return [];
    }
    
    setIsDataReady(false);
    
    const result = data.map(item => {
      const parsedDate = parseDate(item.date);
      return {
        date: parsedDate.toISOString().split('T')[0],
        nav: parseFloat(item.nav) || 0,
        formattedDate: parsedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        originalDate: item.date
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setTimeout(() => setIsDataReady(true), 50);
    
    return result;
  }, [data]);

  const filteredData = useMemo(() => {
    if (!processedData.length) return [];
    
    const endDate = new Date();
    let startDate;

    const timeRangeMap = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '5Y': 5 * 365,
    };

    const days = timeRangeMap[timeRange];
    if (days) {
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      return processedData.filter(item => new Date(item.date) >= startDate);
    }

    return processedData;
  }, [processedData, timeRange]);
  
  const chartCalculations = useMemo(() => {
    if (!filteredData.length || !isDataReady) return null;
    
    const chartWidth = screenWidth;
    const leftPadding = 10;
    const rightPadding = 10;
    const topPadding = 20;
    const bottomPadding = 30; // Increased for date labels
    const graphWidth = chartWidth - leftPadding - rightPadding;
    const graphHeight = actualChartHeight - topPadding - bottomPadding;
    
    let minNAV = Infinity;
    let maxNAV = -Infinity;
    
    for (let i = 0; i < filteredData.length; i++) {
      const nav = filteredData[i].nav;
      if (nav < minNAV) minNAV = nav;
      if (nav > maxNAV) maxNAV = nav;
    }
    
    const navRange = maxNAV - minNAV || 1;
    const dataLength = filteredData.length;
    
    const points = new Array(dataLength);
    const xPositions = new Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
      const item = filteredData[i];
      const x = leftPadding + (i / (dataLength - 1)) * graphWidth;
      const y = topPadding + ((maxNAV - item.nav) / navRange) * graphHeight;
      
      points[i] = { x, y, data: item, index: i };
      xPositions[i] = x;
    }

    // Generate smooth curved path
    let pathData = '';
    if (points.length > 0) {
      pathData = `M${points[0].x},${points[0].y}`;
      
      for (let i = 1; i < points.length - 1; i++) {
        const x1 = points[i].x;
        const y1 = points[i].y;
        const x2 = (points[i].x + points[i + 1].x) / 2;
        const y2 = (points[i].y + points[i + 1].y) / 2;
        
        pathData += ` C${x1},${y1} ${x1},${y1} ${x2},${y2}`;
      }
      
      // Add the last point
      if (points.length > 1) {
        const lastPoint = points[points.length - 1];
        pathData += ` L${lastPoint.x},${lastPoint.y}`;
      }
    }

    const areaPath = chartType === 'area' && points.length > 0 
      ? `${pathData} L${points[points.length - 1].x},${actualChartHeight - bottomPadding} L${points[0].x},${actualChartHeight - bottomPadding} Z`
      : pathData;

    // Create shadow path - extends from line to bottom
    const shadowPath = points.length > 0 
      ? `${pathData} L${points[points.length - 1].x},${actualChartHeight - bottomPadding} L${points[0].x},${actualChartHeight - bottomPadding} Z`
      : '';

    return {
      chartWidth,
      leftPadding,
      rightPadding,
      topPadding,
      bottomPadding,
      graphWidth,
      graphHeight,
      minNAV,
      maxNAV,
      navRange,
      points,
      xPositions,
      pathData,
      areaPath,
      shadowPath
    };
  }, [filteredData, actualChartHeight, chartType, isDataReady]);

  // Ultra-optimized point finding using binary search
  const findClosestDataPoint = useCallback((gestureX) => {
    if (!chartCalculations?.xPositions.length) return null;
    
    const { xPositions, points } = chartCalculations;
    const len = xPositions.length;
    
    // Handle edge cases
    if (gestureX <= xPositions[0]) return points[0];
    if (gestureX >= xPositions[len - 1]) return points[len - 1];
    
    // Binary search
    let left = 0;
    let right = len - 1;
    
    while (right - left > 1) {
      const mid = Math.floor((left + right) / 2);
      if (xPositions[mid] <= gestureX) {
        left = mid;
      } else {
        right = mid;
      }
    }
    
    // Return closer point
    const leftDist = Math.abs(xPositions[left] - gestureX);
    const rightDist = Math.abs(xPositions[right] - gestureX);
    
    return leftDist <= rightDist ? points[left] : points[right];
  }, [chartCalculations]);

  // Throttled gesture handler
  const onGestureEvent = useCallback((event) => {
    const now = Date.now();
    const { x } = event.nativeEvent;
    
    // Throttle to 60fps
    if (now - gestureState.current.lastUpdateTime < 16) return;
    
    gestureState.current.lastUpdateTime = now;
    
    const closestPoint = findClosestDataPoint(x);
    if (!closestPoint || closestPoint.index === gestureState.current.selectedIndex) return;
    
    gestureState.current.selectedIndex = closestPoint.index;
    setSelectedPoint(closestPoint);
    
    onDataPointSelect?.(closestPoint.data, closestPoint.index);
  }, [findClosestDataPoint, onDataPointSelect]);

  const onHandlerStateChange = useCallback((event) => {
    const { state, x } = event.nativeEvent;
    
    switch (state) {
      case State.BEGAN:
        gestureState.current.isDragging = true;
        const point = findClosestDataPoint(x);
        if (point) {
          gestureState.current.selectedIndex = point.index;
          setSelectedPoint(point);
          setTooltipVisible(true);
          
          Animated.timing(tooltipOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
          
          onDataPointSelect?.(point.data, point.index);
        }
        break;
        
      case State.END:
      case State.CANCELLED:
      case State.FAILED:
        gestureState.current.isDragging = false;
        gestureState.current.selectedIndex = -1;
        
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
        break;
    }
  }, [findClosestDataPoint, onDataPointSelect, tooltipOpacity]);

  // Show loading state while data is being processed
  if (!isDataReady) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ChartLoading />
      </View>
    );
  }

  if (!chartCalculations) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  const { chartWidth, leftPadding, rightPadding, topPadding, bottomPadding } = chartCalculations;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.chartContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          minDist={0}
          activeOffsetX={[-2, 2]}
          activeOffsetY={[-50, 50]}
          shouldCancelWhenOutside={false}
          enableTrackpadTwoFingerGesture={false}
          maxPointers={1}
        >
          <View style={[styles.chartTouchArea, { height: actualChartHeight }]}>
            {/* <XAxisLabels 
              chartCalculations={chartCalculations}
              actualChartHeight={actualChartHeight}
              bottomPadding={bottomPadding}
            /> */}
            
            <OptimizedSVGChart
              chartCalculations={chartCalculations}
              actualChartHeight={actualChartHeight}
              chartType={chartType}
              selectedPoint={selectedPoint}
              tooltipVisible={tooltipVisible}
              topPadding={topPadding}
              bottomPadding={bottomPadding}
              leftPadding={leftPadding}
              rightPadding={rightPadding}
            />
          </View>
        </PanGestureHandler>

        <ChartTooltip
          tooltipVisible={tooltipVisible}
          selectedPoint={selectedPoint}
          chartWidth={chartWidth}
          tooltipOpacity={tooltipOpacity}
        />
      </View>
      
      <View style={styles.timeRangeButtons}>
        {timeRanges.map((range) => (
          <TimeRangeButton
            key={range}
            range={range}
            active={timeRange === range}
            onPress={() => setTimeRange(range)}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  chartContainer: {
    position: 'relative',
    width: '100%',
  },
  chartTouchArea: {
    width: '100%',
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(43, 141, 246, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  tooltipPointer: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: 'rgba(43, 141, 246, 0.9)',
    transform: [{ rotate: '45deg' }],
  },
  timeRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeButtonActive: {
    backgroundColor: '#ffffff',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeButtonTextActive: {
    color: '#2B8DF6',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
    backgroundColor: 'rgba(43, 141, 246, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
    backgroundColor: 'rgba(43, 141, 246, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    width: 50,
    textAlign: 'center',
  },
});

export default HistoricalNavChart;