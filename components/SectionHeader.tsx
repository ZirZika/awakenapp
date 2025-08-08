import React from 'react';
import { View, Text } from 'react-native';
import styles from '../app/(tabs)/JournalStyles';
import { useTranslation } from 'react-i18next';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, action }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeaderImproved}>
      <View style={styles.sectionTitleContainer}>
        {icon}
        <Text style={styles.sectionTitle}>{t(title)}</Text>
      </View>
      {action && (
        <View style={{ marginLeft: 16 }}>
          {action}
        </View>
      )}
    </View>
  );
};

export default SectionHeader; 