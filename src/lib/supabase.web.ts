import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import ws from 'ws';

import { Database } from '@/types/database';

// expo-secure-store has no web implementation, and this app ships a web
// build (`_layout.web.tsx`, app.json's web.output: static) — fall back to
// AsyncStorage there.
const secureStoreAdapter: SupportedStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Expo Router's web build server-renders the initial pass, and
// AsyncStorage's web implementation touches `window`, which doesn't exist
// during SSR — fall back to a no-op adapter there (nothing to persist
// server-side anyway; the client re-hydrates from the browser afterward).
const noopStorage: SupportedStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const isServer = typeof window === 'undefined';
const storage = isServer ? noopStorage : Platform.OS === 'web' ? AsyncStorage : secureStoreAdapter;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Node (used for this app's web SSR pass) has no global WebSocket on the
  // version this project targets; Realtime needs one supplied explicitly
  // server-side. The browser client always has a native WebSocket.
  realtime: isServer ? { transport: ws as unknown as typeof WebSocket } : undefined,
});

// Supabase's token auto-refresh needs to be paused while the app is
// backgrounded, otherwise it keeps firing and drains the battery.
if (!isServer) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
