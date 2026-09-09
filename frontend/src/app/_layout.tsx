import '../../global.css';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AnimatedSplashOverlay />
        <Slot />
      </LanguageProvider>
    </AuthProvider>
  );
}

