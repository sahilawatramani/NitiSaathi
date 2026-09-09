import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getDashboardData } from '../../../api/budget';

import IncomeChart from '../../../components/budget/IncomeChart';
import { SavingsRateCard } from '../../../components/budget/SavingsRateCard';
import { ExpenseBreakdown } from '../../../components/budget/ExpenseBreakdown';
import { BudgetGoals } from '../../../components/budget/BudgetGoals';
import { QuickCategories } from '../../../components/budget/QuickCategories';
import { CausalChainAlert } from '../../../components/budget/CausalChainAlert';
import { AppLayout } from '../../../components/shared/AppLayout';

export default function BudgetScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashData = await getDashboardData();
        setData(dashData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout title="बजट / Budget">
        <View className="flex-1 bg-surface justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  // Handle empty state (though budget shouldn't strictly be empty if they hit this tab,
  // but if they are completely new, we show empty fallback)
  if (data?.hasHistory === false) {
    return (
      <AppLayout title="बजट / Budget">
        <View className="flex-1 bg-surface justify-center items-center p-8">
          <Text className="font-headline-md text-headline-md text-on-surface">No Data</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="बजट / Budget">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} className="bg-surface">
        
        {/* Page Title */}
        <View className="mb-4">
          <Text className="font-headline-lg text-headline-lg text-on-surface mb-2">
            बजट / Budget
          </Text>
          <Text className="font-body-md text-body-md text-text-warm-gray">
            Monitor your income, expenses, and financial goals.
          </Text>
        </View>

        {/* Main Grid */}
        <View className="flex-col lg:flex-row gap-6 w-full">
          
          {/* Left Column */}
          <View className="flex-1 flex-col gap-6">
            
            {/* Income Forecast Card */}
            <View className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="font-headline-sm text-headline-sm text-on-surface">Income Forecast</Text>
                <Pressable className="p-1 active:opacity-50">
                  <MaterialIcons name="more-vert" size={24} color="#82001b" />
                </Pressable>
              </View>
              
              <View className="mb-4">
                <IncomeChart data={data?.incomeForecast || []} />
              </View>
              
              <View className="bg-surface-container p-4 rounded-lg flex-row items-start gap-3">
                <MaterialIcons name="info" size={20} color="#82001b" style={{ marginTop: 2 }} />
                <Text className="font-body-md text-body-md text-on-surface-variant flex-1">
                  {data?.incomeStats?.message}
                </Text>
              </View>
            </View>

            {/* Savings Rate Card */}
            {data?.savingsRate && (
              <SavingsRateCard 
                percentage={data.savingsRate.percentage}
                message={data.savingsRate.message}
                current={data.savingsRate.current}
                target={data.savingsRate.target}
              />
            )}
            
          </View>
          
          {/* Right Column */}
          <View className="w-full lg:w-[320px] flex-col gap-6">
            
            {/* Expense Breakdown */}
            {data?.expenseBreakdown && (
              <ExpenseBreakdown 
                total={data.expenseBreakdown.total}
                categories={data.expenseBreakdown.categories}
              />
            )}
            
            {/* Goals */}
            {data?.budgetGoals && (
              <BudgetGoals goals={data.budgetGoals} />
            )}
            
          </View>
        </View>
        
        {/* Full Width Bottom Row */}
        <View className="w-full space-y-6 mt-4 pb-8">
          <QuickCategories />
          
          {/* Causal Chain Alert */}
          {data?.riskCondition && data?.causalChainData && (
            <CausalChainAlert 
              title={data.causalChainData.title}
              message={data.causalChainData.message}
            />
          )}
        </View>
        
      </ScrollView>
    </AppLayout>
  );
}
