import React, { ReactNode } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { SidebarNav } from './SidebarNav';
import { BottomTabBar } from './BottomTabBar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  backTo?: string;
  hideHeader?: boolean;
}

export function AppLayout({ children, title, backTo, hideHeader = false }: AppLayoutProps) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 768;

  return (
    <View className="flex-1 bg-background flex-row h-full">
      {/* Sidebar for Desktop */}
      {isWideWeb && <SidebarNav />}

      {/* Main Content Area */}
      <View className="flex-1 flex-col h-full bg-surface-container-lowest">
        {!hideHeader && <Header title={title} backTo={backTo} />}
        
        <View className="flex-1 overflow-hidden">
          {children}
        </View>

        {/* Bottom Tab Bar for Mobile */}
        {!isWideWeb && <BottomTabBar />}
      </View>
    </View>
  );
}
