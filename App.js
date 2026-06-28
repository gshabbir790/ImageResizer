/**
 * App.js — Production Entry Point
 * Features:
 *  - Double-tap-to-exit via BackHandler + ToastAndroid (Android only)
 *  - GestureHandlerRootView wrapper
 *  - Expo Font loading with SplashScreen guard
 *  - Platform.select Urdu font fallback (JameelNooriNastaleeq → serif/GeezaPro)
 */

import React, { useEffect, useRef } from 'react';
import {
  BackHandler,
  ToastAndroid,
  Platform,
  StatusBar,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import HomeScreen from './src/screens/HomeScreen';

// Keep the splash visible until fonts are ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  // ── Double-tap-to-exit refs ──────────────────────────────────────────────
  const backPressCount = useRef(0);
  const backPressTimer = useRef(null);

  // ── Font loading ─────────────────────────────────────────────────────────
  // Uncomment the JameelNooriNastaleeq line once the .ttf is placed in
  // assets/fonts/ and the font file is present in your project.
  const [fontsLoaded, fontError] = useFonts({
    // 'JameelNooriNastaleeq': require('./assets/fonts/JameelNooriNastaleeq.ttf'),
  });

  // Hide splash once fonts resolve (loaded or errored — don't block forever)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // ── Double-tap-to-exit (Android) ─────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (backPressCount.current === 0) {
        // First press — show toast and start 2-second window
        backPressCount.current = 1;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        backPressTimer.current = setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);
        return true; // consume event, prevent default (don't close app)
      }

      // Second press within 2 s — exit
      clearTimeout(backPressTimer.current);
      BackHandler.exitApp();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => {
      subscription.remove();
      if (backPressTimer.current) clearTimeout(backPressTimer.current);
    };
  }, []);

  // Don't render until fonts are settled
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar
        backgroundColor="#006064"
        barStyle="light-content"
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        <HomeScreen />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f9',
  },
});
