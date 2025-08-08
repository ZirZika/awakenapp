import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import GlowingButton from './GlowingButton';
import GoalCard from './GoalCard';
import styles from '../app/(tabs)/JournalStyles';
import { Goal } from '@/types/app';
import type { ModalType } from '../app/(tabs)/journal';
import SectionHeader from './SectionHeader';
import EmptyState from './EmptyState';
import { Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface GoalsTabProps {
  goals: Goal[];
  openModal: (type: ModalType) => void;
  deleteGoal: (id: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ goals, openModal, deleteGoal, loadData }) => {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader
        icon={<Target size={20} color="#3B82F6" />}
        title={t('Goals')}
        action={<GlowingButton title={t('New Goal')} onPress={() => openModal('goal')} />}
      />
      {goals.length > 0 ? (
        goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onDelete={async (id) => { await deleteGoal(id); await loadData(); }} />
        ))
      ) : (
        <EmptyState
          icon={<Target size={48} color="#374151" />}
          title={t('No goals set yet')}
          description={t('Start setting goals to track your progress!')}
        />
      )}
    </ScrollView>
  );
};

export default GoalsTab; 