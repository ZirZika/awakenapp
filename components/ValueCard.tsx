import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import styles from '../app/(tabs)/JournalStyles';
import { CoreValue } from '@/types/app';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface ValueCardProps {
  value: CoreValue;
  onDelete?: (id: string) => void;
}

const ValueCard: React.FC<ValueCardProps> = ({ value, onDelete }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.valueCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.valueTitle}>{value.title}</Text>
        {onDelete && (
          <TouchableOpacity
            style={{ marginLeft: 'auto', padding: 4 }}
            onPress={() => {
              Alert.alert(
                t('Delete Value'),
                t('Are you sure you want to delete this value?'),
                [
                  { text: t('Cancel'), style: 'cancel' },
                  { text: t('Delete'), style: 'destructive', onPress: () => onDelete(value.id) },
                ]
              );
            }}
            accessibilityLabel={t('Delete Value')}
            testID={`delete-value-${value.id}`}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.valueDescription}>{t(value.description)}</Text>
      <Text style={styles.valueImportance}>{t('Importance')}: {value.importance}</Text>
    </View>
  );
};

export default ValueCard; 