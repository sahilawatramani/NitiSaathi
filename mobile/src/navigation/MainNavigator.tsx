/**
 * Main Tab Navigator — Bottom tabs for the main app experience.
 * Tabs: Home, Budget, Saathi (Chat), Schemes, More
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Platform } from 'react-native';
import { Colors, Typography } from '../theme';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import CausalChainScreen from '../screens/main/CausalChainScreen';
import AssistantScreen from '../screens/main/AssistantScreen';
import SchemesListScreen from '../screens/main/SchemesListScreen';
import SchemeDetailScreen from '../screens/main/SchemeDetailScreen';
import FraudCheckScreen from '../screens/main/FraudCheckScreen';
import FraudResultScreen from '../screens/main/FraudResultScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import AddTransactionScreen from '../screens/main/AddTransactionScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MoreHomeScreen from '../screens/main/MoreHomeScreen';
import NudgesScreen from '../screens/main/NudgesScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

import SeedDataScreen from '../screens/main/SeedDataScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  BudgetTab: undefined;
  SaathiTab: undefined;
  SchemesTab: undefined;
  MoreTab: undefined;
};

export type BudgetStackParamList = {
  BudgetMain: undefined;
  CausalChain: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
};

export type SchemesStackParamList = {
  SchemesList: undefined;
  SchemeDetail: { schemeId: string; schemeName: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  FraudCheck: undefined;
  FraudResult: { analysis: Record<string, unknown> };
  Nudges: undefined;
  Reports: undefined;
  Settings: undefined;
  Profile: undefined;
  SeedData: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const BudgetStack = createNativeStackNavigator<BudgetStackParamList>();
const SchemesStack = createNativeStackNavigator<SchemesStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const BudgetNavigator = () => (
  <BudgetStack.Navigator screenOptions={{ headerShown: false }}>
    <BudgetStack.Screen name="BudgetMain" component={BudgetScreen} />
    <BudgetStack.Screen name="CausalChain" component={CausalChainScreen} />
    <BudgetStack.Screen name="Transactions" component={TransactionsScreen} />
    <BudgetStack.Screen name="AddTransaction" component={AddTransactionScreen} />
  </BudgetStack.Navigator>
);

const SchemesNavigator = () => (
  <SchemesStack.Navigator screenOptions={{ headerShown: false }}>
    <SchemesStack.Screen name="SchemesList" component={SchemesListScreen} />
    <SchemesStack.Screen name="SchemeDetail" component={SchemeDetailScreen} />
  </SchemesStack.Navigator>
);

// Placeholder More home screen
const MoreNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreHome" component={MoreHomeScreen} />
    <MoreStack.Screen name="FraudCheck" component={FraudCheckScreen} />
    <MoreStack.Screen name="FraudResult" component={FraudResultScreen} />
    <MoreStack.Screen name="Nudges" component={NudgesScreen} />
    <MoreStack.Screen name="Reports" component={ReportsScreen} />
    <MoreStack.Screen name="Settings" component={SettingsScreen} />
    <MoreStack.Screen name="Profile" component={ProfileScreen} />
    <MoreStack.Screen name="SeedData" component={SeedDataScreen} />
  </MoreStack.Navigator>
);

// Tab bar icon component
const TabIcon = ({
  symbol,
  label,
  focused,
}: {
  symbol: string;
  label: string;
  focused: boolean;
}) => (
  <View style={{ alignItems: 'center', paddingTop: 4 }}>
    <Text
      style={{
        fontSize: 22,
        color: focused ? Colors.primaryContainer : Colors.textWarmGray,
        fontFamily: 'Material-Symbols-Outlined',
      }}
    >
      {symbol}
    </Text>
    <Text
      style={{
        ...Typography.labelSm,
        color: focused ? Colors.primaryContainer : Colors.textWarmGray,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  </View>
);

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.outlineVariant,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon symbol="home" label="गृह" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="BudgetTab"
      component={BudgetNavigator}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon symbol="payments" label="बजट" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="SaathiTab"
      component={AssistantScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon symbol="forum" label="साथी" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="SchemesTab"
      component={SchemesNavigator}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon symbol="description" label="योजनाएं" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="MoreTab"
      component={MoreNavigator}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon symbol="menu" label="और" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default MainNavigator;
