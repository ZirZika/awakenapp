import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Mail, Settings, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';

interface HeaderActionsProps {
  unreadMessages?: number;
}

export default function HeaderActions({ unreadMessages = 0 }: HeaderActionsProps) {
  return (
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.inboxButton}
        onPress={() => router.push('/inbox')}
        testID="inbox-button"
      >
        <Mail size={20} color="#6366f1" />
        {unreadMessages > 0 && (
          <View style={styles.inboxBadge}>
            <Text style={styles.inboxBadgeText}>{unreadMessages}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/recently-deleted')}
        accessibilityLabel="Recently Deleted"
        testID="recently-deleted-button"
      >
        <Trash2 size={20} color="#9ca3af" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
        testID="settings-button"
      >
        <Settings size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inboxButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  inboxBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  inboxBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
}); 