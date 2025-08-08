import React from 'react';
import { View, Text } from 'react-native';
import styles from './JournalStyles';

export default function SocialTab() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#23263a' }}>
      <Text style={{ fontFamily: 'Orbitron-Bold', fontSize: 28, color: '#fff', marginBottom: 12 }}>Coming Soon</Text>
      <Text style={{ fontFamily: 'Orbitron-Regular', fontSize: 16, color: '#9ca3af', textAlign: 'center', maxWidth: 320 }}>
        Social features are on the way! Connect, share, and grow with your friends and guilds in a future update.
      </Text>
    </View>
  );
} 