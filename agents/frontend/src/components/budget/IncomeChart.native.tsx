import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

export interface IncomeChartProps {
  data: { label: string; value: number; isProj?: boolean }[];
}

export default function IncomeChartNative({ data }: IncomeChartProps) {
  // Format data for Victory Native XL CartesianChart
  const formattedData = data.map((d, i) => {
    let yHist = null;
    let yProj = null;
    
    if (!d.isProj) {
      yHist = d.value;
    } else {
      yProj = d.value;
      // Connect history line to the first projection point
      if (i > 0 && !data[i-1].isProj) {
        yHist = d.value;
      }
    }
    
    // Connect projection line to the last history point
    if (!d.isProj && i < data.length - 1 && data[i+1].isProj) {
      yProj = d.value;
    }
    
    return { label: d.label, yHist, yProj, isProj: d.isProj };
  });

  return (
    <View style={styles.container}>
      <CartesianChart
        data={formattedData}
        xKey="label"
        yKeys={["yHist", "yProj"]}
        padding={{ top: 20, bottom: 40, left: 10, right: 20 }}
      >
        {({ points }) => (
          <>
            <Line points={points.yHist} color="#A61C2E" strokeWidth={3} />
            <Line points={points.yProj} color="#E63946" strokeWidth={3} />
            
            {points.yHist.map((p, i) => (
              typeof p.x === 'number' && typeof p.y === 'number' ? (
                <Circle key={`h-${i}`} cx={p.x} cy={p.y} r={5} color="#A61C2E" />
              ) : null
            ))}
            {points.yProj.map((p, i) => (
              typeof p.x === 'number' && typeof p.y === 'number' ? (
                <Circle key={`p-${i}`} cx={p.x} cy={p.y} r={5} color="#E63946" />
              ) : null
            ))}
          </>
        )}
      </CartesianChart>
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
    overflow: 'hidden',
    padding: 10
  }
});

