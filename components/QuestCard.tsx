import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Sparkles, Target, Settings } from 'lucide-react-native';
import styles from '../app/(tabs)/JournalStyles';
import { Task } from '@/types/app';
import GlowingButton from './GlowingButton';
import { X, Zap, Clock, Award } from 'lucide-react-native';

interface QuestCardProps {
  task: Task;
  onComplete?: (id: string) => void;
  getTimeRemaining?: (task: Task) => string | null;
}

const QuestCard: React.FC<QuestCardProps> = ({ task, onComplete, getTimeRemaining }) => {
  const [showDetailModal, setShowDetailModal] = React.useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      case 'Epic': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getQuestTypeColor = (questType: string) => {
    switch (questType) {
      case 'ai-generated': return '#8b5cf6';
      case 'goal-based': return '#3b82f6';
      case 'system': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.questItem}
        onPress={() => setShowDetailModal(true)}
        activeOpacity={0.8}
      >
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
        <Text style={styles.questDescription} numberOfLines={2}>
          {task.description}
        </Text>
        {task.reasoning && (
          <Text style={styles.questReasoning} numberOfLines={1}>💡 {task.reasoning}</Text>
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
        <View style={styles.questPreviewFooter}>
          <Text style={styles.questPreviewText}>Tap to view full quest details</Text>
        </View>
      </TouchableOpacity>

      {/* Quest Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.questModalOverlay}>
          <View style={styles.questModalContent}>
            {/* Modal Header */}
            <View style={styles.questModalHeader}>
              <View style={styles.questModalTitleContainer}>
                {task.questType === 'ai-generated' ? (
                  <Sparkles size={24} color={getQuestTypeColor(task.questType)} />
                ) : task.questType === 'goal-based' ? (
                  <Target size={24} color={getQuestTypeColor(task.questType)} />
                ) : (
                  <Settings size={24} color={getQuestTypeColor(task.questType)} />
                )}
                <Text style={styles.questModalTitle}>{task.title}</Text>
              </View>
              <TouchableOpacity 
                style={styles.questModalCloseButton}
                onPress={() => setShowDetailModal(false)}
              >
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Quest Type Badge */}
            <View style={[styles.questTypeBadge, { backgroundColor: `${getQuestTypeColor(task.questType)}20` }]}>
              <Text style={[styles.questTypeBadgeText, { color: getQuestTypeColor(task.questType) }]}>
                {task.questType === 'ai-generated' ? 'Quest Board Quest' : 
                 task.questType === 'goal-based' ? 'Story Quest' : 'System Quest'}
              </Text>
            </View>

            <ScrollView style={styles.questModalBody} showsVerticalScrollIndicator={false}>
              {/* Quest Description */}
              <View style={styles.questDetailSection}>
                <Text style={styles.questDetailSectionTitle}>Quest Description</Text>
                <Text style={styles.questDetailDescription}>{task.description}</Text>
              </View>

              {/* Quest Reasoning (for AI quests) */}
              {task.reasoning && (
                <View style={styles.questDetailSection}>
                  <Text style={styles.questDetailSectionTitle}>Why This Quest?</Text>
                  <Text style={styles.questDetailReasoning}>{task.reasoning}</Text>
                </View>
              )}

              {/* Quest Rewards */}
              <View style={styles.questDetailSection}>
                <Text style={styles.questDetailSectionTitle}>Rewards</Text>
                <View style={styles.questRewardsContainer}>
                  <View style={styles.questRewardItem}>
                    <Zap size={20} color="#fbbf24" />
                    <Text style={styles.questRewardText}>{task.xpReward} XP</Text>
                  </View>
                  <View style={[styles.questDifficultyBadge, { borderColor: getDifficultyColor(task.difficulty) }]}>
                    <Award size={16} color={getDifficultyColor(task.difficulty)} />
                    <Text style={[styles.questDifficultyBadgeText, { color: getDifficultyColor(task.difficulty) }]}>
                      {task.difficulty} Difficulty
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quest Details */}
              <View style={styles.questDetailSection}>
                <Text style={styles.questDetailSectionTitle}>Quest Details</Text>
                <View style={styles.questDetailsGrid}>
                  <View style={styles.questDetailItem}>
                    <Text style={styles.questDetailLabel}>Category:</Text>
                    <Text style={styles.questDetailValue}>{task.category}</Text>
                  </View>
                  {task.estimatedDuration && (
                    <View style={styles.questDetailItem}>
                      <Text style={styles.questDetailLabel}>Duration:</Text>
                      <Text style={styles.questDetailValue}>{task.estimatedDuration}</Text>
                    </View>
                  )}
                  {getTimeRemaining && getTimeRemaining(task) && (
                    <View style={styles.questDetailItem}>
                      <Text style={styles.questDetailLabel}>Time Remaining:</Text>
                      <Text style={[styles.questDetailValue, { color: '#ef4444' }]}>
                        {getTimeRemaining(task)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.questModalActions}>
              <GlowingButton
                title="Close"
                onPress={() => setShowDetailModal(false)}
                variant="secondary"
                style={styles.questModalButton}
              />
              {onComplete && (
                <GlowingButton
                  title="Accept Quest"
                  onPress={() => {
                    onComplete(task.id);
                    setShowDetailModal(false);
                  }}
                  variant="primary"
                  style={styles.questModalButton}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default QuestCard;