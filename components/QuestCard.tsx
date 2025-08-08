import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, Target, Settings } from 'lucide-react-native';
import styles from '../app/(tabs)/JournalStyles';
import { Task } from '@/types/app';

interface QuestCardProps {
  task: Task;
  onComplete?: (id: string) => void;
  getTimeRemaining?: (task: Task) => string | null;
}

const QuestCard: React.FC<QuestCardProps> = ({ task, onComplete, getTimeRemaining }) => (
  <View style={styles.questItem}>
    <View style={styles.questHeader}>
      <Text style={styles.questTitle}>{task.title}</Text>
      <View style={styles.questBadge}>
        {task.questType === 'ai-generated' ? (
          <Sparkles size={12} color="#8B5CF6" />
        ) : task.questType === 'goal-based' ? (
          <Target size={12} color="#8B5CF6" />
        ) : (
          <Settings size={12} color="#8B5CF6" />
        )}
        <Text style={styles.questBadgeText}>
          {task.questType === 'ai-generated' ? 'AI' : task.questType === 'goal-based' ? 'Goal' : 'System'}
        </Text>
      </View>
    </View>
    <Text style={styles.questDescription}>{task.description}</Text>
    {task.reasoning && (
      <Text style={styles.questReasoning}>💡 {task.reasoning}</Text>
    )}
    <View style={styles.questFooter}>
      <Text style={styles.questDifficulty}>{task.difficulty}</Text>
      <Text style={styles.questXP}>+{task.xpReward} XP</Text>
      {task.estimatedDuration && (
        <Text style={styles.questDuration}>⏱ {task.estimatedDuration}</Text>
      )}
      {getTimeRemaining && (
        <Text style={styles.questTimer}>{getTimeRemaining(task)}</Text>
      )}
    </View>
    {onComplete && (
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={() => onComplete(task.id)}
      >
        <Text style={styles.completeButtonText}>Complete Quest</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default QuestCard; 