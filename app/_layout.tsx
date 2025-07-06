import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black
} from '@expo-google-fonts/orbitron';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { Image, View, StyleSheet, TouchableOpacity, Linking, Text } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    'Orbitron-Regular': Orbitron_400Regular,
    'Orbitron-Bold': Orbitron_700Bold,
    'Orbitron-Black': Orbitron_900Black,
  });

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error('Error in session setup:', error);
      setIsLoading(false);
    });

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove hasInitialRedirect from dependencies

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="inbox" options={{ headerShown: false }} />
        <Stack.Screen name="todos" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="#000000" />
      

      
      {/* Made with Bolt logo overlay */}
      <View style={styles.boltLogoContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Linking.openURL('https://bolt.new/');
          }}
          accessibilityLabel="Made with Bolt"
        >
          <Image
            source={require('@/assets/images/logotext_poweredby_360w.png')}
            style={styles.boltLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  boltLogoContainer: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  boltLogo: {
    width: 120,
    height: 24,
    opacity: 0.5,
    backgroundColor: 'rgba(24,24,27,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
  },

});