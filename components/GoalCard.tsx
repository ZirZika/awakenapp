import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import styles from '../app/(tabs)/JournalStyles';
import { Goal } from '@/types/app';

interface GoalCardProps {
  goal: Goal;
  onDelete?: (id: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete }) => (
  <View style={styles.goalCard}>
    <View style={styles.goalHeader}>
      <Text style={styles.goalTitle}>{goal.title}</Text>
      <View style={[styles.goalStatus, goal.isCompleted && styles.goalCompleted]}>
        <Text style={styles.goalStatusText}>
          {goal.isCompleted ? 'Completed' : 'In Progress'}
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(goal.id)} style={{ marginLeft: 8 }} accessibilityLabel={`Delete Goal: ${goal.title}`}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
    <Text style={styles.goalDescription}>{goal.description}</Text>
    <View style={styles.goalProgress}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{goal.progress}%</Text>
    </View>
    <View style={styles.goalFooter}>
      <Text style={styles.goalCategory}>{goal.category}</Text>
      {goal.targetDate && <Text style={styles.goalDate}>Due: {goal.targetDate}</Text>}
    </View>
  </View>
);

export default GoalCard; 