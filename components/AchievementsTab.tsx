import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import AchievementCard from './AchievementCard';
import styles from '../app/(tabs)/JournalStyles';
import { JournalEntry, PersonalAchievement } from '../types/app';
import SectionHeader from './SectionHeader';
import EmptyState from './EmptyState';
import { Trophy } from 'lucide-react-native';

interface AchievementsTabProps {
  journalEntries: JournalEntry[];
  personalAchievements: PersonalAchievement[];
}

const AchievementsTab: React.FC<AchievementsTabProps> = ({ journalEntries, personalAchievements }) => {
  // Generate achievements from journal entries
  const generatedAchievements = journalEntries.flatMap(entry => 
    entry.achievements.map((achievement, index) => ({
      id: `${entry.id}-achievement-${index}`,
      title: achievement,
      description: `Achievement from ${entry.date}: ${achievement}`,
      category: 'Personal',
      date: entry.date,
      significance: 'minor' as PersonalAchievement['significance'],
      createdAt: entry.createdAt,
      source: 'journal' as const
    }))
  );

  // Combine generated achievements with manually created ones
  const allAchievements = [
    ...personalAchievements.map(a => ({ ...a, source: a.source ?? 'manual' as const })),
    ...generatedAchievements
  ];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader
        icon={<Trophy size={20} color="#f59e0b" />}
        title="Personal Achievements"
        description={<View style={styles.achievementStats}><Text style={styles.achievementStatsText}>{allAchievements.length} Total Achievements</Text></View>}
      />
      <Text style={styles.sectionDescription}>
        Your achievements are automatically generated from your journal entries and personal wins
      </Text>
      {allAchievements.length > 0 ? (
        allAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))
      ) : (
        <EmptyState
          icon={<Trophy size={48} color="#374151" />}
          title="No achievements yet"
          description="Create journal entries to automatically generate achievements from your wins!"
        />
      )}
    </ScrollView>
  );
};

export default AchievementsTab; 