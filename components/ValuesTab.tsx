import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import GlowingButton from './GlowingButton';
import ValueCard from './ValueCard';
import styles from '../app/(tabs)/JournalStyles';
import { CoreValue } from '../types/app';
import type { ModalType } from '../app/(tabs)/journal';
import SectionHeader from './SectionHeader';
import EmptyState from './EmptyState';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface ValuesTabProps {
  coreValues: CoreValue[];
  openModal: (type: ModalType) => void;
  onDelete?: (id: string) => void;
}

const ValuesTab: React.FC<ValuesTabProps> = ({ coreValues, openModal, onDelete }) => {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader
        icon={<Heart size={20} color="#ef4444" />}
        title={t('Core Values')}
        action={<GlowingButton title={t('New Value')} onPress={() => openModal('value')} />}
      />
      {coreValues.length > 0 ? (
        coreValues.map(value => (
          <ValueCard key={value.id} value={value} onDelete={onDelete} />
        ))
      ) : (
        <EmptyState
          icon={<Heart size={48} color="#374151" />}
          title={t('No core values defined yet')}
          description={t("Define what's important to you!")}
        />
      )}
    </ScrollView>
  );
};

export default ValuesTab; 