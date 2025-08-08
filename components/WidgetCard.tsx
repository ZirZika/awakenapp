import React from 'react';
import { View, ViewStyle } from 'react-native';
import styles from '../app/(tabs)/JournalStyles';

interface WidgetCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const WidgetCard: React.FC<WidgetCardProps> = ({ children, style }) => (
  <View style={[styles.widgetCard, style]}>
    {children}
  </View>
);

export default WidgetCard; 