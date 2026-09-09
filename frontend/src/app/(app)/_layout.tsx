import React, { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayoutGuard() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/onboarding');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#a61c2e" />
      </View>
    );
  }

  // If not logged in, we shouldn't render the app content, but the redirect will happen above.
  if (!session) {
    return null;
  }

  return <Slot />;
}
