import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2 } from 'lucide-react-native';

export default function RecentlyDeletedScreen() {
  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Trash2 size={24} color="#ef4444" />
          <Text style={styles.headerTitle}>Recently Deleted</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.comingSoon}>Recently Deleted - Coming Soon</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 