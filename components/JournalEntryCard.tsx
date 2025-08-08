import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Smile, Meh, Frown, Flame, Brain, Trash2 } from 'lucide-react-native';
import styles from '../app/(tabs)/JournalStyles';
import { JournalEntry } from '@/types/app';
import { useTranslation } from 'react-i18next';

function getMoodIcon(mood: JournalEntry['mood']) {
  switch (mood) {
    case 'excellent': return <Smile size={20} color="#facc15" />;
    case 'good': return <Smile size={20} color="#10b981" />;
    case 'neutral': return <Meh size={20} color="#a3a3a3" />;
    case 'challenging': return <Flame size={20} color="#f59e42" />;
    case 'difficult': return <Frown size={20} color="#60a5fa" />;
    default: return <Meh size={20} color="#a3a3a3" />;
  }
}

const JournalEntryCard = ({ entry, onDelete }: { entry: JournalEntry, onDelete?: (id: string) => void }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.journalCard}>
      <View style={styles.journalHeader}>
        <Text style={styles.journalDate}>{entry.date}</Text>
        {onDelete ? (
          <TouchableOpacity
            style={{ marginLeft: 8, padding: 4 }}
            onPress={() => {
              Alert.alert(
                t('Delete Journal Entry'),
                t('Are you sure you want to delete this journal entry?'),
                [
                  { text: t('Cancel'), style: 'cancel' },
                  { text: t('Delete'), style: 'destructive', onPress: () => onDelete(entry.id) },
                ]
              );
            }}
            accessibilityLabel={t('Delete Journal Entry')}
            testID={`delete-journal-entry-${entry.id}`}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : getMoodIcon(entry.mood)}
      </View>
      <Text style={styles.journalTitle}>{entry.title}</Text>
      <Text style={styles.journalContent}>{entry.content}</Text>
      {entry.achievements.length > 0 && (
        <View style={styles.journalSection}>
          <Text style={styles.journalSectionTitle}>🏆 {t('Achievements')}</Text>
          {entry.achievements.map((achievement, index) => (
            <Text key={index} style={styles.journalListItem}>• {achievement}</Text>
          ))}
        </View>
      )}
      {entry.challenges.length > 0 && (
        <View style={styles.journalSection}>
          <Text style={styles.journalSectionTitle}>⚔️ {t('Challenges')}</Text>
          {entry.challenges.map((challenge, index) => (
            <Text key={index} style={styles.journalListItem}>• {challenge}</Text>
          ))}
        </View>
      )}
      {entry.gratitude.length > 0 && (
        <View style={styles.journalSection}>
          <Text style={styles.journalSectionTitle}>🙏 {t('Gratitude')}</Text>
          {entry.gratitude.map((item, index) => (
            <Text key={index} style={styles.journalListItem}>• {item}</Text>
          ))}
        </View>
      )}
      {entry.tomorrowGoals.length > 0 && (
        <View style={styles.journalSection}>
          <Text style={styles.journalSectionTitle}>🎯 {t("Tomorrow's Goals")}</Text>
          {entry.tomorrowGoals.map((goal, index) => (
            <Text key={index} style={styles.journalListItem}>• {goal}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default JournalEntryCard; 