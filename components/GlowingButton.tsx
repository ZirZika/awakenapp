import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { scale, scaleFont } from '../utils/config';
import { useTranslation } from 'react-i18next';

interface GlowingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'epic';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  testID?: string;
  icon?: React.ReactNode;
}

export default function GlowingButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled = false,
  testID,
  icon
}: GlowingButtonProps) {
  const { t } = useTranslation();
  const buttonStyle = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={buttonTextStyle}>{t(title)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: scale(48),
  },
  primary: {
    backgroundColor: '#1f2937',
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  secondary: {
    backgroundColor: '#374151',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  epic: {
    backgroundColor: '#581c87',
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 8,
  },
  disabled: {
    backgroundColor: '#1f2937',
    borderColor: '#4b5563',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: scaleFont(14),
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryText: {
    color: '#00ffff',
  },
  secondaryText: {
    color: '#6366f1',
  },
  epicText: {
    color: '#8b5cf6',
  },
  disabledText: {
    color: '#6b7280',
  },
});