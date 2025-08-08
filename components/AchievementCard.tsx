import React from 'react';
import { View, Text } from 'react-native';
import { BookOpen, Award } from 'lucide-react-native';
import styles from '../app/(tabs)/JournalStyles';
import { PersonalAchievement } from '@/types/app';

interface AchievementCardProps {
  achievement: PersonalAchievement & { source?: 'journal' | 'manual' };
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => (
  <View style={styles.achievementCard}>
    <View style={styles.achievementHeader}>
      <Text style={styles.achievementTitle}>{achievement.title}</Text>
      <View style={styles.achievementBadge}>
        {achievement.source === 'journal' ? (
          <BookOpen size={12} color="#3B82F6" />
        ) : (
          <Award size={12} color="#F59E0B" />
        )}
        <Text style={styles.achievementBadgeText}>
          {achievement.source === 'journal' ? 'Journal' : 'Manual'}
        </Text>
      </View>
    </View>
    <Text style={styles.achievementDescription}>{achievement.description}</Text>
    <View style={styles.achievementFooter}>
      <Text style={styles.achievementCategory}>{achievement.category}</Text>
      <Text style={styles.achievementDate}>{achievement.date}</Text>
    </View>
  </View>
);

export default AchievementCard; 