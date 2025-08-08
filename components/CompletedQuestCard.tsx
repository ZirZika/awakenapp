import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, Target, Settings } from 'lucide-react-native';
import styles from '../app/(tabs)/JournalStyles';
import { Task } from '@/types/app';

interface CompletedQuestCardProps {
  task: Task;
}

const CompletedQuestCard: React.FC<CompletedQuestCardProps> = ({ task }) => (
  <View style={[styles.questItem, styles.completedQuestItem]}>
    <View style={styles.questHeader}>
      <Text style={[styles.questTitle, styles.completedQuestTitle]}>{task.title}</Text>
      <View style={[styles.questBadge, styles.completedQuestBadge]}>
        {task.questType === 'ai-generated' ? (
          <Sparkles size={12} color="#9CA3AF" />
        ) : task.questType === 'goal-based' ? (
          <Target size={12} color="#9CA3AF" />
        ) : (
          <Settings size={12} color="#9CA3AF" />
        )}
        <Text style={[styles.questBadgeText, styles.completedQuestBadgeText]}>
          {task.questType === 'ai-generated' ? 'AI' : task.questType === 'goal-based' ? 'Goal' : 'System'}
        </Text>
      </View>
    </View>
    <Text style={[styles.questDescription, styles.completedQuestDescription]}>{task.description}</Text>
    {task.reasoning && (
      <Text style={[styles.questReasoning, styles.completedQuestReasoning]}>💡 {task.reasoning}</Text>
    )}
    <View style={styles.questFooter}>
      <Text style={[styles.questDifficulty, styles.completedQuestDifficulty]}>{task.difficulty}</Text>
      <Text style={[styles.questXP, styles.completedQuestXP]}>+{task.xpReward} XP</Text>
      {task.estimatedDuration && (
        <Text style={[styles.questDuration, styles.completedQuestDuration]}>⏱ {task.estimatedDuration}</Text>
      )}
    </View>
    <View style={styles.completedBadge}>
      <Text style={styles.completedBadgeText}>✓ Completed</Text>
    </View>
  </View>
);

export default CompletedQuestCard; 