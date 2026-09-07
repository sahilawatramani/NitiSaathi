import React from 'react';
import { View, Text } from 'react-native';
import { VictoryPie } from 'victory';

export function ExpenseDonutWeb({ total, categories }: any) {
  // Map our tailwind colors to hex for victory
  const colorScale = categories.map((c: any) => {
    if (c.color === 'bg-primary') return '#82001b';
    if (c.color === 'bg-secondary') return '#b7102a';
    if (c.color === 'bg-tertiary') return '#004923';
    if (c.color === 'bg-outline') return '#8d706f';
    if (c.color === 'bg-outline-variant') return '#e1bebd';
    return '#e5e2e1'; // bg-surface-variant
  });

  const chartData = categories.map((c: any) => ({
    x: c.name,
    y: c.percentage
  }));

  return (
    <View style={{ width: 192, height: 192, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <VictoryPie 
        data={chartData}
        colorScale={colorScale}
        innerRadius={70}
        labels={() => null} // Hide labels on pie
        padding={0}
      />
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#6B6560' }}>Total</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1c1b1b' }}>₹{total}</Text>
      </View>
    </View>
  );
}
