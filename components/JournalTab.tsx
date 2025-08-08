import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import GlowingButton from './GlowingButton';
import JournalEntryCard from './JournalEntryCard';
import styles from '../app/(tabs)/JournalStyles';
import { JournalEntry } from '../types/app';
import type { ModalType } from '../app/(tabs)/journal';
import SectionHeader from './SectionHeader';
import EmptyState from './EmptyState';
import { BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface JournalTabProps {
  journalEntries: JournalEntry[];
  openModal: (type: ModalType) => void;
  onDeleteJournalEntry?: (id: string) => void;
}

const JournalTab: React.FC<JournalTabProps> = ({ journalEntries, openModal, onDeleteJournalEntry }) => {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader
        icon={<BookOpen size={20} color="#6366f1" />}
        title={t('Journal Entries')}
        action={<GlowingButton title={t('New Entry')} onPress={() => openModal('journal')} testID="journal-new-entry-button" />}
      />
      {journalEntries.length > 0 ? (
        journalEntries.map(entry => (
          <JournalEntryCard key={entry.id} entry={entry} onDelete={onDeleteJournalEntry} />
        ))
      ) : (
        <EmptyState
          icon={<BookOpen size={48} color="#374151" />}
          title={t('No journal entries yet')}
          description={t('Start your journey by creating your first entry!')}
        />
      )}
    </ScrollView>
  );
};

export default JournalTab; 