import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { getDashboardData } from '../api/budget';
import { getRecentNudges } from '../api/nudges';
import { UrgentBanner } from '../components/home/UrgentBanner';
import { CalmBanner } from '../components/home/CalmBanner';
import { BalanceDisplay } from '../components/home/BalanceDisplay';
import { IncomeMiniChart } from '../components/home/IncomeMiniChart';
import { GoalsRow } from '../components/home/GoalsRow';
import { RecentNudges } from '../components/home/RecentNudges';
import { HealthIndicator } from '../components/home/HealthIndicator';
import { EmptyDashboard } from '../components/home/EmptyDashboard';
import { AppLayout } from '../components/shared/AppLayout';

export default function HomeScreen() {
  const [data, setData] = useState<any>(null);
  const [nudges, setNudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashData, nudgesData] = await Promise.all([
          getDashboardData(),
          getRecentNudges()
        ]);
        setData(dashData);
        setNudges(nudgesData);
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
      <AppLayout title="गृह / Home" hideHeader>
        <View className="flex-1 bg-surface justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  // Branch 3: Empty State (New user / no transaction history)
  if (data?.hasHistory === false) {
    return (
      <AppLayout title="गृह / Home">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-surface-bright">
          <EmptyDashboard />
        </ScrollView>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="गृह / Home">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 32 }} className="bg-surface">
        
        {/* Conditional Top Banner based on low_balance_flag */}
        {data?.low_balance_flag && data?.urgentAlert ? (
          <UrgentBanner 
            title={data.urgentAlert.title}
            message={data.urgentAlert.message}
            actionText={data.urgentAlert.action}
            secondaryActionText={data.urgentAlert.secondaryAction}
            onAction={() => console.log('Action pressed')}
            onSecondaryAction={() => console.log('Secondary action pressed')}
          />
        ) : data?.calmMessage ? (
          <CalmBanner message={data.calmMessage} />
        ) : null}
        
        <View className="flex-col md:flex-row gap-8 w-full">
          {/* Left Column */}
          <View className="flex-1 flex-col gap-8">
            <View className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-[0px_4px_20px_rgba(26,26,26,0.05)] border border-outline-variant/30 transition-all hover:shadow-[0px_8px_30px_rgba(26,26,26,0.08)] hover:border-primary-container/20 group">
              <BalanceDisplay balance={data?.balance || 0} />
              <IncomeMiniChart data={data?.incomeForecast || []} />
            </View>
            
            <GoalsRow goals={data?.goals || []} />
          </View>
          
          {/* Right Column (Sidebar equivalent for large screens) */}
          <View className="w-full md:w-[320px] lg:w-[350px] flex-col gap-8">
            <RecentNudges nudges={nudges} />
            {data?.health && (
              <HealthIndicator 
                type={data.health.type} 
                status={data.health.status} 
                message={data.health.message} 
              />
            )}
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
