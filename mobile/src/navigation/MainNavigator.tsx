/**
 * Main Tab Navigator — Bottom tabs for the main app experience.
 * Dynamic single-language labels matching active language:
 * 1. Home (गृह / Home / गृह), 2. Budget (बजट / Budget / बजेट), 3. Assistant (साथी / Assistant / साथी), 4. Schemes (योजनाएं / Schemes / योजना), 5. Fraud (जांच / Fraud Check / तपासणी)
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Platform } from 'react-native';
import { useTranslation } from '../i18n';
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
import NudgesScreen from '../screens/main/NudgesScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import SeedDataScreen from '../screens/main/SeedDataScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  BudgetTab: undefined;
  SaathiTab: undefined;
  SchemesTab: undefined;
  FraudTab: undefined;
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

export type MainRootStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
  Nudges: undefined;
  Profile: undefined;
  Reports: undefined;
  SeedData: undefined;
  SchemeDetail: { schemeId: string; schemeName: string };
  FraudResult: { analysis: Record<string, unknown> };
  CausalChain: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<MainRootStackParamList>();

// Tab bar icon component
const TabIcon = ({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
    <Text
      style={{
        fontSize: 18,
        color: focused ? Colors.primaryContainer : Colors.textWarmGray,
      }}
    >
      {icon}
    </Text>
    <Text
      style={{
        ...Typography.labelSm,
        fontSize: 11,
        color: focused ? Colors.primaryContainer : Colors.textWarmGray,
        fontWeight: focused ? '700' : '500',
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  </View>
);

const MainTabsNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.outlineVariant + '40',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label={t.nav.home} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" label={t.nav.budget} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SaathiTab"
        component={AssistantScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💬" label={t.nav.assistant} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SchemesTab"
        component={SchemesListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label={t.nav.schemes} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="FraudTab"
        component={FraudCheckScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🛡️" label={t.nav.fraud} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabsNavigator} />
    <RootStack.Screen name="Settings" component={SettingsScreen} />
    <RootStack.Screen name="Nudges" component={NudgesScreen} />
    <RootStack.Screen name="Profile" component={ProfileScreen} />
    <RootStack.Screen name="Reports" component={ReportsScreen} />
    <RootStack.Screen name="SeedData" component={SeedDataScreen} />
    <RootStack.Screen name="SchemeDetail" component={SchemeDetailScreen} />
    <RootStack.Screen name="FraudResult" component={FraudResultScreen} />
    <RootStack.Screen name="CausalChain" component={CausalChainScreen} />
    <RootStack.Screen name="Transactions" component={TransactionsScreen} />
    <RootStack.Screen name="AddTransaction" component={AddTransactionScreen} />
  </RootStack.Navigator>
);

export default MainNavigator;
