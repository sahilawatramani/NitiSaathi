/**
 * Auth Stack Navigator — Welcome → Comfort Level → Details → Consent → Login/Register
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import ComfortLevelScreen from '../screens/auth/ComfortLevelScreen';
import DetailsScreen from '../screens/auth/DetailsScreen';
import ConsentScreen from '../screens/auth/ConsentScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  ComfortLevel: { language: 'hi' | 'en' | 'mr' };
  Details: { language: 'hi' | 'en' | 'mr'; comfortLevel: string };
  Consent: { profile: Record<string, unknown> };
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="ComfortLevel" component={ComfortLevelScreen} />
    <Stack.Screen name="Details" component={DetailsScreen} />
    <Stack.Screen name="Consent" component={ConsentScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
