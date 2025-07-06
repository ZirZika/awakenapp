import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserRole } from '@/hooks/useUserRole';

interface ComponentIdDisplayProps {
  componentId: string;
  componentName: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showAlways?: boolean;
}

export default function ComponentIdDisplay({ 
  componentId, 
  componentName, 
  position = 'bottom-right',
  showAlways = false 
}: ComponentIdDisplayProps) {
  const { isDeveloper, hasDeveloperPermission } = useUserRole();
  
  // Only show if user is developer and has component_ids permission
  if (!showAlways && (!isDeveloper() || !hasDeveloperPermission('component_ids'))) {
    return null;
  }

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 2, left: 2 };
      case 'top-right':
        return { top: 2, right: 2 };
      case 'bottom-left':
        return { bottom: 2, left: 2 };
      case 'bottom-right':
      default:
        return { bottom: 2, right: 2 };
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <Text style={styles.idText}>{componentId}</Text>
      <Text style={styles.nameText}>{componentName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  idText: {
    color: '#ff6b6b',
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  nameText: {
    color: '#ccc',
    fontSize: 6,
    fontFamily: 'monospace',
  },
}); 