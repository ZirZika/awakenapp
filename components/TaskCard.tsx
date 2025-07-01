import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleCheck as CheckCircle, Circle, Zap, RotateCcw, Play, Timer, Clock } from 'lucide-react-native';
import { Task } from '@/types/app';
import { getDifficultyColor } from '@/utils/gameLogic';
import GlowingButton from './GlowingButton';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onUndo?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
}

export default function TaskCard({ task, onComplete, onUndo, onStart }: TaskCardProps) {
  const difficultyColor = getDifficultyColor(task.difficulty);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canComplete = () => {
    if (task.hasTimer && !task.isCompleted) {
      return task.isStarted && (!task.timeRemaining || task.timeRemaining <= 0);
    }
    return !task.isCompleted;
  };

  const getTimerStatus = () => {
    if (!task.hasTimer) return null;
    
    if (!task.isStarted) {
      return `${task.timerDuration}min timer - Click Start to begin`;
    }
    
    if (task.timeRemaining && task.timeRemaining > 0) {
      return `Time remaining: ${formatTime(task.timeRemaining)}`;
    }
    
    return 'Timer complete - Ready to finish!';
  };

  return (
    <View style={[styles.card, task.isCompleted && styles.completedCard]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => canComplete() && onComplete(task.id)}
            style={[styles.checkButton, !canComplete() && styles.disabledCheckButton]}
            disabled={!canComplete()}
          >
            {task.isCompleted ? (
              <CheckCircle size={24} color="#00ffff" />
            ) : (
              <Circle size={24} color={canComplete() ? "#6b7280" : "#374151"} />
            )}
          </TouchableOpacity>
          <Text style={[styles.title, task.isCompleted && styles.completedText]}>
            {task.title}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { borderColor: difficultyColor }]}>
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {task.difficulty}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.description, task.isCompleted && styles.completedText]}>
        {task.description}
      </Text>

      {/* Timer Section */}
      {task.hasTimer && (
        <View style={styles.timerSection}>
          <View style={styles.timerInfo}>
            <Timer size={16} color="#f59e0b" />
            <Text style={styles.timerText}>{getTimerStatus()}</Text>
          </View>
          
          {!task.isCompleted && !task.isStarted && onStart && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => onStart(task.id)}
            >
              <Play size={16} color="#f59e0b" />
              <Text style={styles.startButtonText}>Start Timer</Text>
            </TouchableOpacity>
          )}
          
          {task.isStarted && task.timeRemaining && task.timeRemaining > 0 && (
            <View style={styles.timerDisplay}>
              <Clock size={20} color="#f59e0b" />
              <Text style={styles.timerDisplayText}>{formatTime(task.timeRemaining)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Estimated Duration */}
      {task.estimatedDuration && (
        <View style={styles.durationInfo}>
          <Clock size={14} color="#9ca3af" />
          <Text style={styles.durationText}>Estimated: {task.estimatedDuration}</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <View style={styles.xpContainer}>
          <Zap size={16} color="#fbbf24" />
          <Text style={styles.xpText}>{task.xpReward} XP</Text>
        </View>
        
        <View style={styles.actionButtons}>
          {/* Undo Button */}
          {task.isCompleted && task.canUndo && onUndo && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={() => onUndo(task.id)}
            >
              <RotateCcw size={16} color="#f59e0b" />
              <Text style={styles.undoButtonText}>Undo</Text>
            </TouchableOpacity>
          )}
          
          {/* Complete Button */}
          {!task.isCompleted && canComplete() && (
            <GlowingButton
              title="Complete"
              onPress={() => onComplete(task.id)}
              variant="primary"
              style={styles.completeButton}
            />
          )}
          
          {/* Timer Complete Button */}
          {!task.isCompleted && task.hasTimer && task.isStarted && (!task.timeRemaining || task.timeRemaining <= 0) && (
            <GlowingButton
              title="Finish Quest"
              onPress={() => onComplete(task.id)}
              variant="epic"
              style={styles.completeButton}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  completedCard: {
    opacity: 0.7,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  checkButton: {
    marginRight: 12,
  },
  disabledCheckButton: {
    opacity: 0.5,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  completedText: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  difficultyText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 16,
  },
  timerSection: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 8,
    flex: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignSelf: 'flex-start',
  },
  startButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b20',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timerDisplayText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#f59e0b',
    marginLeft: 8,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#fbbf24',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  undoButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
  },
  completeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
});