import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  glowColor?: string;
  backgroundColor?: string;
}

export default function ProgressBar({ 
  progress, 
  height = 8, 
  glowColor = '#00ffff',
  backgroundColor = '#1f2937'
}: ProgressBarProps) {
  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View style={[styles.progressWrapper, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]}>
        <LinearGradient
          colors={[glowColor, `${glowColor}aa`, glowColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progress, { 
            height,
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 6,
            elevation: 5,
          }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  progressWrapper: {
    height: '100%',
  },
  progress: {
    borderRadius: 4,
  },
});