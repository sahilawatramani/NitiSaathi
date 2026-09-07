import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryScatter, VictoryAxis } from 'victory-native';

export interface IncomeChartProps {
  data: { label: string; value: number; isProj?: boolean }[];
}

export default function IncomeChartNative({ data }: IncomeChartProps) {
  // Format data for Victory
  const chartData = data.map(d => ({ x: d.label, y: d.value, isProj: d.isProj }));
  const historyData = chartData.filter((d, i) => {
    // Include the first projected point in history to connect the line
    if (!d.isProj) return true;
    if (d.isProj && i > 0 && !chartData[i-1].isProj) return true;
    return false;
  });
  const projData = chartData.filter((d, i) => {
    if (d.isProj) return true;
    if (!d.isProj && i < chartData.length - 1 && chartData[i+1].isProj) return true;
    return false;
  });

  return (
    <View style={styles.container}>
      <VictoryChart 
        theme={VictoryTheme.material} 
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
        height={220}
      >
        <VictoryAxis 
          style={{
            axis: { stroke: 'transparent' },
            grid: { stroke: 'transparent' },
            tickLabels: { fontSize: 12, fill: '#6B6560' }
          }} 
        />
        <VictoryAxis 
          dependentAxis 
          tickFormat={(t) => `₹${t/1000}k`}
          style={{
            axis: { stroke: 'transparent' },
            grid: { stroke: '#e5e2e1', strokeDasharray: '4' },
            tickLabels: { fontSize: 12, fill: '#6B6560' }
          }} 
        />
        
        {/* History Line */}
        <VictoryLine
          data={historyData}
          style={{
            data: { stroke: '#A61C2E', strokeWidth: 3 }
          }}
        />
        
        {/* Projection Line */}
        <VictoryLine
          data={projData}
          style={{
            data: { stroke: '#E63946', strokeWidth: 3, strokeDasharray: '4 4' }
          }}
        />

        {/* Data Points */}
        <VictoryScatter
          data={chartData}
          size={5}
          style={{
            data: {
              fill: ({ datum }) => datum.isProj ? '#E63946' : '#A61C2E',
              stroke: '#ffffff',
              strokeWidth: 2
            }
          }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    backgroundColor: '#F7F5F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e2e1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  }
});
