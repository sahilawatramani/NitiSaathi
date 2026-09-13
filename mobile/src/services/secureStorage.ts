/**
 * secureStorage.ts — Cross-platform secure storage wrapper.
 *
 * On native (iOS/Android): uses expo-secure-store (encrypted keychain).
 * On web: falls back to localStorage (not encrypted, but functional for dev).
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
