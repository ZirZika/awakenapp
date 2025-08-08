import React from 'react';
import { View, Text } from 'react-native';
import styles from '../app/(tabs)/JournalStyles';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, children }) => {
  const { t } = useTranslation();
  // Only translate if the string is a known translation key
  const isTranslatable = (str: string) => /^[A-Za-z0-9 .,'"!?&()\-]+$/.test(str);
  return (
    <View style={styles.emptyQuestState}>
      {icon}
      <Text style={styles.emptyQuestTitle}>{isTranslatable(title) ? t(title) : title}</Text>
      <Text style={styles.emptyQuestText}>{isTranslatable(description) ? t(description) : description}</Text>
      {children && <View style={{ marginTop: 16 }}>{children}</View>}
    </View>
  );
};

export default EmptyState; 