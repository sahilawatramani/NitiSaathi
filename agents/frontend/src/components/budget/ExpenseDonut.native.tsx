import React from 'react';
import { View, Text } from 'react-native';
import { PolarChart, Pie } from 'victory-native';

type DonutChartData = {
  value: number;
  color: string;
  label: string;
};

export function ExpenseDonutNative({ total, categories }: any) {
  const chartData: DonutChartData[] = categories.map((c: any) => {
    let color = '#e5e2e1'; // bg-surface-variant
    if (c.color === 'bg-primary') color = '#82001b';
    else if (c.color === 'bg-secondary') color = '#b7102a';
    else if (c.color === 'bg-tertiary') color = '#004923';
    else if (c.color === 'bg-outline') color = '#8d706f';
    else if (c.color === 'bg-outline-variant') color = '#e1bebd';
    return {
      value: c.percentage,
      color,
      label: c.name
    };
  });

  return (
    <View style={{ width: 192, height: 192, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <PolarChart
        data={chartData}
        colorKey={"color"}
        valueKey={"value"}
        labelKey={"label"}
      >
        <Pie.Chart innerRadius={"70%"} />
      </PolarChart>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#6B6560' }}>Total</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1c1b1b' }}>₹{total}</Text>
      </View>
    </View>
  );
}

export default ExpenseDonutNative;

