import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Config from '../../helpers/Config';
import { widthToDp } from '../../helpers/Responsive';

const Chart = ({ apiData, value, onStartInteracting, onEndInteracting }) => {
  const [interval, setInterval] = useState(value || '1M');
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const webviewRef = useRef();

  const filterDataByInterval = useCallback(
    interval => {
      const daysMap = {
        '1M': 30,
        '6M': 180,
        '1Y': 365,
        '3Y': 1095,
        '5Y': 1825,
      };

      if (interval === 'ALL') {
        return (
          apiData
            ?.map(item => ({
              time: item.time.split('-').reverse().join('-'),
              value: parseFloat(item.value),
            }))
            .sort((a, b) => new Date(a.time) - new Date(b.time)) || []
        );
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysMap[interval]);

      return (
        apiData
          ?.filter(
            item =>
              new Date(item.time.split('-').reverse().join('-')) >= cutoffDate,
          )
          .map(item => ({
            time: item.time.split('-').reverse().join('-'),
            value: parseFloat(item.value),
          }))
          .sort((a, b) => new Date(a.time) - new Date(b.time)) || []
      );
    },
    [apiData],
  );

  const formattedData = useMemo(
    () => filterDataByInterval(interval),
    [filterDataByInterval, interval],
  );

  useEffect(() => {
    if (webViewLoaded && webviewRef.current && formattedData.length > 0) {
      webviewRef.current.postMessage(
        JSON.stringify({
          type: 'updateData',
          data: formattedData,
          interval: interval,
        }),
      );
    }
  }, [formattedData, interval, webViewLoaded]);

  // Update interval when value prop changes
  useEffect(() => {
    if (value && value !== interval) {
      setInterval(value);
    }
  }, [value]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          #chart { width: 100%; height: 100vh; }
          #tooltip {
            position: absolute;
            display: none;
            padding: 4px 8px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
          }
          
          /* Hide any potential watermarks or branding */
          div[style*="position: absolute"][style*="right: 0"][style*="bottom: 0"],
          div[style*="position: absolute"][style*="right: 0px"][style*="bottom: 0px"],
          div[style*="position: absolute"][style*="right:0"][style*="bottom:0"],
          div[style*="position:absolute"][style*="right:0"][style*="bottom:0"],
          .tv-lightweight-charts__watermark,
          .tv-lightweight-charts__attribution,
          a[href*="tradingview"],
          a[href*="TradingView"],
          div[title*="TradingView"],
          div[title*="tradingview"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        </style>
      </head>
      <body>
        <div id="chart"></div>
        <div id="tooltip"></div>
        <script>
          const chart = LightweightCharts.createChart(document.getElementById('chart'), {
            width: window.innerWidth,
            height: window.innerHeight,
            layout: { 
              backgroundColor: '#f6fbff', 
              textColor: '#000',
              attributionLogo: false // Disable attribution logo
            },
            grid: { vertLines: { visible: false }, horzLines: { visible: false } },
            rightPriceScale: { visible: false },
            leftPriceScale: { visible: false },
            timeScale: { 
              visible: false,
              rightOffset: 0,
              barSpacing: 3,
              fixLeftEdge: true,
              fixRightEdge: true,
              lockVisibleTimeRangeOnResize: true,
              rightBarStaysOnScroll: true,
              allowBoldLabels: true,
              borderVisible: false,
              borderColor: '#fff000',
              timeVisible: false,
              secondsVisible: false,
              shiftVisibleRangeOnNewBar: false
            },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            watermark: { 
              visible: false,
              text: '',
              color: 'transparent'
            },
            handleScroll: {
              mouseWheel: false,
              pressedMouseMove: false,
              horzTouchDrag: false,
              vertTouchDrag: false
            },
            handleScale: {
              axisPressedMouseMove: false,
              mouseWheel: false,
              pinch: false,
              axisDoubleClickReset: false,
              wheelWithShift: false
            }
          });

          const series = chart.addAreaSeries({
            topColor: '#f6fbff',
            bottomColor: '#f6fbff',
            lineColor: '#1768BF',
            lineWidth: 2,
          });

          const tooltip = document.getElementById('tooltip');

          function updateChart(data) {
            if (Array.isArray(data) && data.length > 0) {
              series.setData(data);
              chart.timeScale().fitContent();
            }
          }

          // Function to remove any watermarks that might appear
          function removeWatermarks() {
            const watermarkSelectors = [
              'div[style*="position: absolute"][style*="right: 0"][style*="bottom: 0"]',
              'div[style*="position: absolute"][style*="right: 0px"][style*="bottom: 0px"]',
              'div[style*="position: absolute"][style*="right:0"][style*="bottom:0"]',
              'div[style*="position:absolute"][style*="right:0"][style*="bottom:0"]',
              '.tv-lightweight-charts__watermark',
              '.tv-lightweight-charts__attribution',
              'a[href*="tradingview"]',
              'a[href*="TradingView"]',
              'div[title*="TradingView"]',
              'div[title*="tradingview"]'
            ];

            watermarkSelectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(element => {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
                element.style.pointerEvents = 'none';
                element.remove();
              });
            });
          }

          // Remove watermarks periodically
          setInterval(removeWatermarks, 100);

          chart.subscribeCrosshairMove(param => {
            if (!param.point || !param.time) {
              tooltip.style.display = 'none';
              return;
            }

            const price = param.seriesData.get(series)?.value;
            if (price !== undefined) {
              tooltip.innerHTML = \`\${param.time} <br> ${
                value || 'NAV'
              }: \${price.toFixed(2)}\`;
              tooltip.style.left = \`\${param.point.x + 10}px\`;
              tooltip.style.top = \`\${param.point.y - 30}px\`;
              tooltip.style.display = 'block';
            }
          });

          window.addEventListener('message', (event) => {
            try {
              const { type, data } = JSON.parse(event.data);
              if (type === 'updateData') updateChart(data);
            } catch (err) {
              console.error('Error parsing message:', err);
            }
          });

          document.addEventListener('message', (event) => {
            try {
              const { type, data } = JSON.parse(event.data);
              if (type === 'updateData') updateChart(data);
            } catch (err) {
              console.error('Error parsing message:', err);
            }
          });

          window.addEventListener('resize', () => {
            chart.resize(window.innerWidth, window.innerHeight);
            removeWatermarks();
          });

          // Initial watermark removal
          setTimeout(removeWatermarks, 100);
        </script>
      </body>
    </html>
  `;

  const handleIntervalChange = useCallback(selectedInterval => {
    setInterval(selectedInterval);
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        mixedContentMode="always"
        style={styles.webview}
        clearCache={true}
        onError={e => console.warn('WebView error:', e.nativeEvent)}
        onLoadEnd={() => setWebViewLoaded(true)}
        onMessage={event =>
          console.log('WebView Message:', event.nativeEvent.data)
        }
        // Additional props to prevent any external content
        allowsInlineMediaPlayback={false}
        mediaPlaybackRequiresUserAction={true}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        onTouchStart={onStartInteracting}
        onTouchEnd={onEndInteracting}
      />

      <View style={styles.buttonContainer}>
        {['1M', '6M', '1Y', '3Y'].map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.button, interval === item && styles.activeButton]}
            onPress={() => handleIntervalChange(item)}
          >
            <Text
              style={[
                styles.buttonText,
                interval === item && styles.activeButtonText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Config.Colors.cyan_blue },
  webview: { flex: 1, width: '100%' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: widthToDp(3),
    backgroundColor: Config.Colors.cyan_blue,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: Config.Colors.white,
    borderRadius: 5,
  },
  activeButton: { backgroundColor: Config.Colors.primary },
  buttonText: { color: Config.Colors.black, fontSize: 14, letterSpacing: 2 },
  activeButtonText: { color: Config.Colors.white, fontSize: 14 },
});
