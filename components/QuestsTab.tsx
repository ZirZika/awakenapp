import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import SectionHeader from './SectionHeader';
import EmptyState from './EmptyState';
import { Settings, Target, Sparkles, Trophy } from 'lucide-react-native';
import WidgetCard from './WidgetCard';
import QuestCard from './QuestCard';
import CompletedQuestCard from './CompletedQuestCard';
import GlowingButton from './GlowingButton';
import styles from '../app/(tabs)/JournalStyles';
import { Task, SystemQuest } from '../types/app';
import type { ModalType, TabType } from '../app/(tabs)/journal';
import { useTranslation } from 'react-i18next';

interface QuestsTabProps {
  tasks: Task[];
  systemQuests: SystemQuest[];
  isGeneratingQuests: boolean;
  handleCompleteTask: (taskId: string) => void;
  handleGenerateAIQuests: () => void;
  openModal: (type: ModalType) => void;
  setActiveTab: (tab: TabType) => void;
  getTimeRemaining: (task: Task) => string | null;
}

const QuestsTab: React.FC<QuestsTabProps> = ({
  tasks,
  systemQuests,
  isGeneratingQuests,
  handleCompleteTask,
  handleGenerateAIQuests,
  openModal,
  setActiveTab,
  getTimeRemaining,
}) => {
  const { t } = useTranslation();
  const now = new Date();
  const aiQuests = tasks.filter((task: Task) => task.questType === 'ai-generated' && !task.isCompleted && ((now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60) < 24));
  const systemQuestsList = systemQuests.filter((quest: SystemQuest) => !quest.isCompleted);
  const goalBasedQuests = tasks.filter((task: Task) => task.questType === 'goal-based' && !task.isCompleted);
  const completedQuests = tasks.filter((task: Task) => task.isCompleted);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* System Quests Section */}
      <SectionHeader
        icon={<Settings size={20} color="#10B981" />}
        title={t('System Quests')}
      />
      <WidgetCard>
        <Text style={styles.sectionDescription}>
          {t('Daily and regular quests to help you maintain good habits and track progress')}
        </Text>
        {systemQuestsList.length > 0 ? (
          systemQuestsList.map((quest: SystemQuest) => (
            <View key={quest.id} style={styles.questCard}>
              <View style={styles.questHeader}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <View style={styles.questBadge}>
                  <Settings size={12} color="#10B981" />
                  <Text style={styles.questBadgeText}>System</Text>
                </View>
              </View>
              <Text style={styles.questDescription}>{quest.description}</Text>
              <View style={styles.questFooter}>
                <Text style={styles.questDifficulty}>{quest.difficulty}</Text>
                <Text style={styles.questXP}>+{quest.xpReward} XP</Text>
                <Text style={styles.questFrequency}>{quest.frequency}</Text>
              </View>
              <Text style={styles.systemQuestInstruction}>
                {quest.title === 'Daily Journal Entry' && t('Complete this by writing a journal entry.')}
                {quest.title === 'Weekly Achievement' && t('Complete this by recording a weekly achievement.')}
                {quest.title === 'Weekly Goal Setting' && t('Complete this by setting a weekly goal.')}
                {quest.title === 'Core Values Reflection' && t('Complete this by updating your core values.')}
                {!['Daily Journal Entry','Weekly Achievement','Weekly Goal Setting','Core Values Reflection'].includes(quest.title) && t('Complete this by using the app features.')}
              </Text>
              {quest.title === 'Daily Journal Entry' && (
                <TouchableOpacity 
                  style={styles.goButton}
                  onPress={() => setActiveTab('journal')}
                  testID="journal-daily-journal-go-button"
                >
                  <Text style={styles.goButtonText}>{t('Go')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <EmptyState
            icon={<Settings size={48} color="#374151" />}
            title={t('No System Quests Available')}
            description={
              t('System quests help you build essential habits. Check back regularly for new challenges.')
            }
          />
        )}
      </WidgetCard>

      {/* Story Quests Section */}
      <SectionHeader
        icon={<Target size={20} color="#3B82F6" />}
        title={t('Story Quests')}
      />
      <WidgetCard>
        <Text style={styles.sectionDescription}>
          {t('Quests generated to help you achieve your specific goals and advance your story')}
        </Text>
        {goalBasedQuests.length > 0 ? (
          goalBasedQuests.map((task: Task) => (
            <View key={task.id} style={styles.questCard}>
              <View style={styles.questHeader}>
                <Text style={styles.questTitle}>{task.title}</Text>
                <View style={styles.questBadge}>
                  <Target size={12} color="#3B82F6" />
                  <Text style={styles.questBadgeText}>Goal</Text>
                </View>
              </View>
              <Text style={styles.questDescription}>{task.description}</Text>
              <View style={styles.questFooter}>
                <Text style={styles.questDifficulty}>{task.difficulty}</Text>
                <Text style={styles.questXP}>+{task.xpReward} XP</Text>
              </View>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => handleCompleteTask(task.id)}
                testID={`journal-complete-goal-quest-${task.id}`}
              >
                <Text style={styles.completeButtonText}>{t('Complete Quest')}</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <EmptyState
            icon={<Target size={48} color="#374151" />}
            title={t('No Story Quests Available')}
            description={
              t('Create goals to unlock personalized story quests that guide your journey.')
            }
          >
            <GlowingButton
              title={t('Create Goal')}
              onPress={() => openModal('goal')}
              style={{ marginTop: 0 }}
              testID="journal-create-goal-button"
            />
          </EmptyState>
        )}
      </WidgetCard>

      {/* AI Quests Section (Bonus Quests) */}
      <SectionHeader
        icon={<Sparkles size={20} color="#374151" />}
        title={t('Bonus Quests')}
      />
      <WidgetCard>
        <Text style={styles.sectionDescription}>
          {t('Personalized bonus quests generated by AI based on your journal entries and goals. Available for 24 hours only!')}
        </Text>
        {aiQuests.length > 0 ? (
          aiQuests.map((task: Task) => (
            <QuestCard key={task.id} task={task} onComplete={handleCompleteTask} getTimeRemaining={getTimeRemaining} />
          ))
        ) : (
          <EmptyState
            icon={<Sparkles size={48} color="#374151" />}
            title={t('No AI Quests Available')}
            description={
              t('Complete your current quests and add journal entries to unlock personalized AI-generated bonus quests!')
            }
          >
            <GlowingButton
              title={isGeneratingQuests ? t('Generating...') : t('Generate New Quests')}
              onPress={handleGenerateAIQuests}
              disabled={isGeneratingQuests}
              style={{ marginTop: 0 }}
              testID="journal-generate-ai-quests-button"
            />
          </EmptyState>
        )}
      </WidgetCard>

      {/* Completed Quests Section */}
      {completedQuests.length > 0 && (
        <>
          <SectionHeader
            icon={<Trophy size={20} color="#9ca3af" />}
            title={t('Completed Quests')}
          />
          <WidgetCard>
            <Text style={styles.sectionDescription}>
              {t('Your completed quests and achievements')}
            </Text>
            {completedQuests.map((task: Task) => (
              <CompletedQuestCard key={task.id} task={task} />
            ))}
          </WidgetCard>
        </>
      )}
    </ScrollView>
  );
};

export default QuestsTab; 