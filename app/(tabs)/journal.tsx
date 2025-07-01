import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, Modal, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Settings, Target, Award, Heart, Calendar, Smile, Meh, Frown, Star, Trophy, Flame, Brain, Swords, Mail, Sparkles, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { Goal, JournalEntry, CoreValue, PersonalAchievement, Task, SystemQuest } from '@/types/app';
import { 
  getGoals, 
  addGoalWithIntelligentTasks, 
  addTask, 
  getJournalEntries, 
  addJournalEntry, 
  getCoreValues, 
  addCoreValue,
  getPersonalAchievements,
  addPersonalAchievement,
  generateIntelligentTasksFromContext,
  getTasks,
  completeTask,
  getSystemQuests,
  initializeSystemQuests,
  generateAIQuestsFromContext,
  getSuggestedGoals
} from '@/utils/storage';
import { generateTasksForGoal } from '@/utils/gameLogic';
import GlowingButton from '@/components/GlowingButton';
import TaskCard from '@/components/TaskCard';

type TabType = 'quests' | 'journal' | 'achievements' | 'goals' | 'values';
type ModalType = 'journal' | 'goal' | 'achievement' | 'value' | null;

export default function WarJournalScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  
  // Data states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [personalAchievements, setPersonalAchievements] = useState<PersonalAchievement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systemQuests, setSystemQuests] = useState<SystemQuest[]>([]);

  // Mock unread message count
  const [unreadMessages] = useState(3);

  // Form states
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    targetDate: '',
  });

  const [newJournalEntry, setNewJournalEntry] = useState({
    title: '',
    content: '',
    mood: 'neutral' as JournalEntry['mood'],
    achievements: '',
    challenges: '',
    gratitude: '',
    tomorrowGoals: '',
  });

  const [newValue, setNewValue] = useState({
    title: '',
    description: '',
    importance: 5,
  });

  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    significance: 'minor' as PersonalAchievement['significance'],
  });

  useEffect(() => {
    loadData();
    // Initialize system quests if not already done
    if (systemQuests.length === 0) {
      initializeSystemQuests();
      setSystemQuests(getSystemQuests());
    }
  }, []);

  const loadData = () => {
    // Clean up expired AI quests from storage
    const allTasks = getTasks();
    const now = new Date();
    const validTasks = allTasks.filter(task => {
      if (task.questType === 'ai-generated') {
        const createdAt = new Date(task.createdAt);
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24 || task.isCompleted; // Keep if <24h old or completed
      }
      return true;
    });
    // Overwrite storage with only valid tasks
    if (validTasks.length !== allTasks.length) {
      // Replace tasks in storage (in-memory for now)
      require('@/utils/storage').tasks = validTasks;
    }
    setGoals(getGoals());
    setJournalEntries(getJournalEntries());
    setCoreValues(getCoreValues());
    setPersonalAchievements(getPersonalAchievements());
    setTasks(getTasks());
    setSystemQuests(getSystemQuests());
  };

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    // Reset forms
    setNewGoal({ title: '', description: '', category: '', targetDate: '' });
    setNewJournalEntry({ title: '', content: '', mood: 'neutral', achievements: '', challenges: '', gratitude: '', tomorrowGoals: '' });
    setNewValue({ title: '', description: '', importance: 5 });
    setNewAchievement({ title: '', description: '', category: '', date: new Date().toISOString().split('T')[0], significance: 'minor' });
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    loadData();
  };

  const handleGenerateAIQuests = async () => {
    setIsGeneratingQuests(true);
    try {
      await generateAIQuestsFromContext();
      loadData();
      Alert.alert('AI Quests Generated! 🤖', 'New personalized quests have been created based on your journal entries and goals.');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate AI quests. Please try again.');
    } finally {
      setIsGeneratingQuests(false);
    }
  };

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category || 'Personal',
      targetDate: newGoal.targetDate,
      isCompleted: false,
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    // Use intelligent task generation
    addGoalWithIntelligentTasks(goal);

    // Auto-complete the 'monthly-goal' system quest and award XP
    const systemQuests = require('@/utils/storage').getSystemQuests();
    const userStats = require('@/utils/storage').getUserStats();
    const monthlyGoalQuest = systemQuests.find((q: import('@/types/app').SystemQuest) => q.id === 'monthly-goal' && !q.isCompleted);
    if (monthlyGoalQuest) {
      monthlyGoalQuest.isCompleted = true;
      userStats.currentXP += monthlyGoalQuest.xpReward;
      userStats.totalXP += monthlyGoalQuest.xpReward;
      userStats.tasksCompleted += 1;
      // Level up logic
      const newLevel = Math.floor(userStats.totalXP / 1000) + 1;
      if (newLevel > userStats.level) {
        userStats.level = newLevel;
        userStats.title = 'Level ' + newLevel;
      }
      userStats.xpToNextLevel = (userStats.level * 1000) - (userStats.totalXP % 1000);
      Alert.alert('Quest Complete!', `You earned +${monthlyGoalQuest.xpReward} XP for setting a monthly goal!`);
    }

    closeModal();
    loadData();
    
    // Show success message
    Alert.alert(
      'Goal Created! 🎯', 
      'Your goal has been added and intelligent tasks have been generated based on your journal entries and progress patterns.',
      [{ text: 'View Tasks', onPress: () => setActiveTab('quests') }]
    );
  };

  const handleCreateJournalEntry = async () => {
    if (!newJournalEntry.title.trim() || !newJournalEntry.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: newJournalEntry.title,
      content: newJournalEntry.content,
      mood: newJournalEntry.mood,
      achievements: newJournalEntry.achievements.split('\n').filter(a => a.trim()),
      challenges: newJournalEntry.challenges.split('\n').filter(c => c.trim()),
      gratitude: newJournalEntry.gratitude.split('\n').filter(g => g.trim()),
      tomorrowGoals: newJournalEntry.tomorrowGoals.split('\n').filter(t => t.trim()),
      createdAt: new Date().toISOString(),
    };

    await addJournalEntry(entry);

    // Auto-complete the 'daily-journal' system quest and award XP
    const systemQuests = require('@/utils/storage').getSystemQuests();
    const userStats = require('@/utils/storage').getUserStats();
    const dailyQuest = systemQuests.find((q: import('@/types/app').SystemQuest) => q.id === 'daily-journal' && !q.isCompleted);
    if (dailyQuest) {
      dailyQuest.isCompleted = true;
      userStats.currentXP += dailyQuest.xpReward;
      userStats.totalXP += dailyQuest.xpReward;
      userStats.tasksCompleted += 1;
      // Level up logic
      const newLevel = Math.floor(userStats.totalXP / 1000) + 1;
      if (newLevel > userStats.level) {
        userStats.level = newLevel;
        userStats.title = 'Level ' + newLevel;
      }
      userStats.xpToNextLevel = (userStats.level * 1000) - (userStats.totalXP % 1000);
      Alert.alert('Quest Complete!', `You earned +${dailyQuest.xpReward} XP for completing your daily journal!`);
    }

    closeModal();
    loadData();
    // Show success message about intelligent task generation
    Alert.alert(
      'Journal Entry Added! 📝', 
      'Your entry has been recorded and new personalized AI quests have been generated based on your reflections.',
      [{ text: 'Check Quests', onPress: () => setActiveTab('quests') }]
    );
  };

  const handleCreateValue = async () => {
    if (!newValue.title.trim()) {
      Alert.alert('Error', 'Please enter a value title');
      return;
    }

    const value: CoreValue = {
      id: Date.now().toString(),
      title: newValue.title,
      description: newValue.description,
      importance: newValue.importance,
      createdAt: new Date().toISOString(),
    };

    await addCoreValue(value);

    // Auto-complete the 'core-values' system quest and award XP
    const systemQuests = require('@/utils/storage').getSystemQuests();
    const userStats = require('@/utils/storage').getUserStats();
    const coreValuesQuest = systemQuests.find((q: import('@/types/app').SystemQuest) => q.id === 'core-values' && !q.isCompleted);
    if (coreValuesQuest) {
      coreValuesQuest.isCompleted = true;
      userStats.currentXP += coreValuesQuest.xpReward;
      userStats.totalXP += coreValuesQuest.xpReward;
      userStats.tasksCompleted += 1;
      // Level up logic
      const newLevel = Math.floor(userStats.totalXP / 1000) + 1;
      if (newLevel > userStats.level) {
        userStats.level = newLevel;
        userStats.title = 'Level ' + newLevel;
      }
      userStats.xpToNextLevel = (userStats.level * 1000) - (userStats.totalXP % 1000);
      Alert.alert('Quest Complete!', `You earned +${coreValuesQuest.xpReward} XP for updating your core values!`);
    }

    closeModal();
    loadData();
  };

  const handleCreateAchievement = async () => {
    if (!newAchievement.title.trim()) {
      Alert.alert('Error', 'Please enter an achievement title');
      return;
    }

    const achievement: PersonalAchievement = {
      id: Date.now().toString(),
      title: newAchievement.title,
      description: newAchievement.description,
      category: newAchievement.category || 'Personal',
      date: newAchievement.date,
      significance: newAchievement.significance,
      createdAt: new Date().toISOString(),
    };

    await addPersonalAchievement(achievement);

    // Auto-complete the 'weekly-win' system quest and award XP
    const systemQuests = require('@/utils/storage').getSystemQuests();
    const userStats = require('@/utils/storage').getUserStats();
    const weeklyWinQuest = systemQuests.find((q: import('@/types/app').SystemQuest) => q.id === 'weekly-win' && !q.isCompleted);
    if (weeklyWinQuest) {
      weeklyWinQuest.isCompleted = true;
      userStats.currentXP += weeklyWinQuest.xpReward;
      userStats.totalXP += weeklyWinQuest.xpReward;
      userStats.tasksCompleted += 1;
      // Level up logic
      const newLevel = Math.floor(userStats.totalXP / 1000) + 1;
      if (newLevel > userStats.level) {
        userStats.level = newLevel;
        userStats.title = 'Level ' + newLevel;
      }
      userStats.xpToNextLevel = (userStats.level * 1000) - (userStats.totalXP % 1000);
      Alert.alert('Quest Complete!', `You earned +${weeklyWinQuest.xpReward} XP for recording a weekly win!`);
    }

    closeModal();
    loadData();
  };

  const getMoodIcon = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'excellent': return <Smile size={20} color="#10B981" />;
      case 'good': return <Smile size={20} color="#3B82F6" />;
      case 'neutral': return <Meh size={20} color="#6B7280" />;
      case 'challenging': return <Frown size={20} color="#F59E0B" />;
      case 'difficult': return <Frown size={20} color="#EF4444" />;
      default: return <Meh size={20} color="#6B7280" />;
    }
  };

  const getSignificanceColor = (significance: PersonalAchievement['significance']) => {
    switch (significance) {
      case 'minor': return '#6B7280';
      case 'major': return '#3B82F6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Add getTabIcon function for tab icons
  const getTabIcon = (tab: TabType, isActive: boolean) => {
    const color = isActive ? '#6366f1' : '#9ca3af';
    const size = 20;
    switch (tab) {
      case 'quests':
        return <Sparkles size={size} color={color} />;
      case 'journal':
        return <BookOpen size={size} color={color} />;
      case 'achievements':
        return <Trophy size={size} color={color} />;
      case 'goals':
        return <Target size={size} color={color} />;
      case 'values':
        return <Heart size={size} color={color} />;
      default:
        return null;
    }
  };

  // Update renderTabButton to use getTabIcon
  const renderTabButton = (tab: TabType, title: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      {getTabIcon(tab, activeTab === tab)}
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderQuestsTab = () => {
    // Only show AI quests created within the last 24 hours
    const now = new Date();
    const aiQuests = tasks.filter(task => task.questType === 'ai-generated' && !task.isCompleted && ((now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60) < 24));
    const systemQuestsList = systemQuests.filter(quest => !quest.isCompleted);
    const goalBasedQuests = tasks.filter(task => task.questType === 'goal-based' && !task.isCompleted);
    const completedQuests = tasks.filter(task => task.isCompleted);

    // Helper to get time remaining for AI quests
    const getTimeRemaining = (task: Task) => {
      if (task.questType === 'ai-generated') {
        const createdAt = new Date(task.createdAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const hoursRemaining = Math.max(0, 24 - hoursDiff);
        if (hoursRemaining < 1) {
          const minutesRemaining = Math.max(0, (24 * 60) - ((now.getTime() - createdAt.getTime()) / (1000 * 60)));
          return `${Math.floor(minutesRemaining)}m remaining`;
        }
        return `${Math.floor(hoursRemaining)}h remaining`;
      }
      return null;
    };

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* System Quests Section */}
        <View style={styles.questSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Settings size={24} color="#10B981" />
              <Text style={styles.sectionTitle}>System Quests</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Daily and regular quests to help you maintain good habits and track progress
          </Text>
          {systemQuestsList.length > 0 ? (
            systemQuestsList.map(quest => (
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
                  {quest.id === 'daily-journal' && 'Complete this by writing a journal entry.'}
                  {quest.id === 'weekly-win' && 'Complete this by recording a weekly win.'}
                  {quest.id === 'monthly-goal' && 'Complete this by setting a monthly goal.'}
                  {quest.id === 'core-values' && 'Complete this by updating your core values.'}
                  {!['daily-journal','weekly-win','monthly-goal','core-values'].includes(quest.id) && 'Complete this by using the app features.'}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyQuestState}>
              <Settings size={48} color="#374151" />
              <Text style={styles.emptyQuestTitle}>No System Quests Available</Text>
              <Text style={styles.emptyQuestText}>
                System quests help you build essential habits. Check back regularly for new challenges.
            </Text>
            </View>
          )}
        </View>

        {/* Goal-Based Quests Section */}
        {goalBasedQuests.length > 0 ? (
        <View style={styles.questSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
                <Target size={24} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Goal-Based Quests</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
              Quests generated to help you achieve your specific goals
          </Text>
            {goalBasedQuests.map(task => (
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
                >
                  <Text style={styles.completeButtonText}>Complete Quest</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyQuestState}>
            <Target size={48} color="#374151" />
            <Text style={styles.emptyQuestTitle}>No Story Quests Available</Text>
            <Text style={styles.emptyQuestText}>
              Create goals to unlock personalized story quests that guide your journey.
            </Text>
            <GlowingButton
              title="Create Goal"
              onPress={() => openModal('goal')}
              style={{ marginTop: 16 }}
            />
        </View>
        )}

        {/* AI Quests Section (Bonus Quests) */}
          <View style={styles.questSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
              <Sparkles size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Bonus Quests</Text>
              </View>
            </View>
            <Text style={styles.sectionDescription}>
            Personalized bonus quests generated by AI based on your journal entries and goals. Available for 24 hours only!
          </Text>
          {aiQuests.length > 0 ? (
            aiQuests.map(task => (
              <View key={task.id} style={styles.questCard}>
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle}>{task.title}</Text>
                  <View style={styles.questBadge}>
                    <Sparkles size={12} color="#8B5CF6" />
                    <Text style={styles.questBadgeText}>AI</Text>
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
                  {/* Timer for AI quest expiry */}
                  <Text style={styles.questTimer}>{getTimeRemaining(task)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => handleCompleteTask(task.id)}
                >
                  <Text style={styles.completeButtonText}>Complete Quest</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyQuestState}>
              <Sparkles size={48} color="#374151" />
              <Text style={styles.emptyQuestTitle}>No AI Quests Available</Text>
              <Text style={styles.emptyQuestText}>
                Complete your current quests and add journal entries to unlock personalized AI-generated bonus quests!
              </Text>
              <GlowingButton
                title={isGeneratingQuests ? 'Generating...' : 'Generate New Quests'}
                onPress={handleGenerateAIQuests}
                disabled={isGeneratingQuests}
                style={{ marginTop: 16 }}
              />
          </View>
        )}
        </View>

        {/* Completed Quests Section */}
        {completedQuests.length > 0 && (
          <View style={styles.questSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Trophy size={24} color="#9CA3AF" />
                <Text style={[styles.sectionTitle, styles.completedSectionTitle]}>Completed Quests</Text>
              </View>
            </View>
            <Text style={[styles.sectionDescription, styles.completedSectionDescription]}>
              Your completed quests and achievements
            </Text>
            
            {completedQuests.map(task => (
              <View key={task.id} style={[styles.questCard, styles.completedQuestCard]}>
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
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderJournalTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Journal Entries</Text>
        <GlowingButton
          title="New Entry"
          onPress={() => openModal('journal')}
        />
      </View>
      
      {journalEntries.length > 0 ? (
        journalEntries.map(entry => (
          <View key={entry.id} style={styles.journalCard}>
            <View style={styles.journalHeader}>
              <Text style={styles.journalDate}>{entry.date}</Text>
              {getMoodIcon(entry.mood)}
            </View>
            <Text style={styles.journalTitle}>{entry.title}</Text>
            <Text style={styles.journalContent}>{entry.content}</Text>
            
            {entry.achievements.length > 0 && (
              <View style={styles.journalSection}>
                <Text style={styles.journalSectionTitle}>🏆 Achievements</Text>
                {entry.achievements.map((achievement, index) => (
                  <Text key={index} style={styles.journalListItem}>• {achievement}</Text>
                ))}
              </View>
            )}
            
            {entry.challenges.length > 0 && (
              <View style={styles.journalSection}>
                <Text style={styles.journalSectionTitle}>⚔️ Challenges</Text>
                {entry.challenges.map((challenge, index) => (
                  <Text key={index} style={styles.journalListItem}>• {challenge}</Text>
                ))}
              </View>
            )}
            
            {entry.gratitude.length > 0 && (
              <View style={styles.journalSection}>
                <Text style={styles.journalSectionTitle}>🙏 Gratitude</Text>
                {entry.gratitude.map((item, index) => (
                  <Text key={index} style={styles.journalListItem}>• {item}</Text>
                ))}
              </View>
            )}
            
            {entry.tomorrowGoals.length > 0 && (
              <View style={styles.journalSection}>
                <Text style={styles.journalSectionTitle}>🎯 Tomorrow's Goals</Text>
                {entry.tomorrowGoals.map((goal, index) => (
                  <Text key={index} style={styles.journalListItem}>• {goal}</Text>
                ))}
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.emptyStateText}>
          No journal entries yet. Start your journey by creating your first entry!
        </Text>
      )}
    </ScrollView>
  );

  const renderAchievementsTab = () => {
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
        source: 'journal'
      }))
    );

    // Combine generated achievements with manually created ones
    const allAchievements = [...personalAchievements, ...generatedAchievements];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Achievements</Text>
          <View style={styles.achievementStats}>
            <Text style={styles.achievementStatsText}>
              {allAchievements.length} Total Achievements
            </Text>
          </View>
        </View>
        
        <Text style={styles.sectionDescription}>
          Your achievements are automatically generated from your journal entries and personal wins
        </Text>
        
        {allAchievements.length > 0 ? (
          allAchievements.map(achievement => (
            <View key={achievement.id} style={styles.achievementCard}>
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
          ))
        ) : (
          <Text style={styles.emptyStateText}>
            No achievements yet. Create journal entries to automatically generate achievements from your wins!
          </Text>
        )}
      </ScrollView>
    );
  };

  const renderGoalsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <GlowingButton
          title="New Goal"
          onPress={() => openModal('goal')}
        />
      </View>
      
      {goals.length > 0 ? (
        goals.map(goal => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={[styles.goalStatus, goal.isCompleted && styles.goalCompleted]}>
                <Text style={styles.goalStatusText}>
                  {goal.isCompleted ? 'Completed' : 'In Progress'}
                </Text>
              </View>
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
        ))
      ) : (
        <Text style={styles.emptyStateText}>
          No goals set yet. Start setting goals to track your progress!
        </Text>
      )}
    </ScrollView>
  );

  const renderValuesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Core Values</Text>
        <GlowingButton
          title="New Value"
          onPress={() => openModal('value')}
        />
      </View>
      
      {coreValues.length > 0 ? (
        coreValues.map(value => (
          <View key={value.id} style={styles.valueCard}>
            <View style={styles.valueHeader}>
              <Text style={styles.valueTitle}>{value.title}</Text>
              <View style={styles.importanceBadge}>
                <Text style={styles.importanceText}>Importance: {value.importance}/10</Text>
              </View>
            </View>
            <Text style={styles.valueDescription}>{value.description}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyStateText}>
          No core values defined yet. Define what's important to you!
        </Text>
      )}
    </ScrollView>
  );

  const renderModal = () => {
    if (!modalType) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'journal' && 'New Journal Entry'}
                {modalType === 'goal' && 'New Goal'}
                {modalType === 'achievement' && 'New Achievement'}
                {modalType === 'value' && 'New Core Value'}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalType === 'journal' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Entry Title"
                    placeholderTextColor="#9CA3AF"
                    value={newJournalEntry.title}
                    onChangeText={(text) => setNewJournalEntry({...newJournalEntry, title: text})}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What happened today? How are you feeling?"
                    placeholderTextColor="#9CA3AF"
                    value={newJournalEntry.content}
                    onChangeText={(text) => setNewJournalEntry({...newJournalEntry, content: text})}
                    multiline
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Achievements (one per line)"
                    placeholderTextColor="#9CA3AF"
                    value={newJournalEntry.achievements}
                    onChangeText={(text) => setNewJournalEntry({...newJournalEntry, achievements: text})}
                    multiline
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Challenges (one per line)"
                    placeholderTextColor="#9CA3AF"
                    value={newJournalEntry.challenges}
                    onChangeText={(text) => setNewJournalEntry({...newJournalEntry, challenges: text})}
                    multiline
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Gratitude (one per line)"
                    placeholderTextColor="#9CA3AF"
                    value={newJournalEntry.gratitude}
                    onChangeText={(text) => setNewJournalEntry({...newJournalEntry, gratitude: text})}
                    multiline
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tomorrow's Goals (one per line)"
                    placeholderTextColor="#9CA3AF"
                    value={newJournalEntry.tomorrowGoals}
                    onChangeText={(text) => setNewJournalEntry({...newJournalEntry, tomorrowGoals: text})}
                    multiline
                  />
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateJournalEntry}>
                    <Text style={styles.createButtonText}>Create Entry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {modalType === 'goal' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Goal Title"
                    placeholderTextColor="#9CA3AF"
                    value={newGoal.title}
                    onChangeText={(text) => setNewGoal({...newGoal, title: text})}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Goal Description"
                    placeholderTextColor="#9CA3AF"
                    value={newGoal.description}
                    onChangeText={(text) => setNewGoal({...newGoal, description: text})}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Category (e.g., Personal, Career, Health)"
                    placeholderTextColor="#9CA3AF"
                    value={newGoal.category}
                    onChangeText={(text) => setNewGoal({...newGoal, category: text})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Target Date (YYYY-MM-DD)"
                    placeholderTextColor="#9CA3AF"
                    value={newGoal.targetDate}
                    onChangeText={(text) => setNewGoal({...newGoal, targetDate: text})}
                  />
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
                    <Text style={styles.createButtonText}>Create Goal</Text>
                  </TouchableOpacity>
                </View>
              )}

              {modalType === 'achievement' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Achievement Title"
                    placeholderTextColor="#9CA3AF"
                    value={newAchievement.title}
                    onChangeText={(text) => setNewAchievement({...newAchievement, title: text})}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Achievement Description"
                    placeholderTextColor="#9CA3AF"
                    value={newAchievement.description}
                    onChangeText={(text) => setNewAchievement({...newAchievement, description: text})}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Category"
                    placeholderTextColor="#9CA3AF"
                    value={newAchievement.category}
                    onChangeText={(text) => setNewAchievement({...newAchievement, category: text})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Date (YYYY-MM-DD)"
                    placeholderTextColor="#9CA3AF"
                    value={newAchievement.date}
                    onChangeText={(text) => setNewAchievement({...newAchievement, date: text})}
                  />
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateAchievement}>
                    <Text style={styles.createButtonText}>Create Achievement</Text>
                  </TouchableOpacity>
                </View>
              )}

              {modalType === 'value' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Value Title"
                    placeholderTextColor="#9CA3AF"
                    value={newValue.title}
                    onChangeText={(text) => setNewValue({...newValue, title: text})}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Value Description"
                    placeholderTextColor="#9CA3AF"
                    value={newValue.description}
                    onChangeText={(text) => setNewValue({...newValue, description: text})}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Importance (1-10)"
                    placeholderTextColor="#9CA3AF"
                    value={newValue.importance.toString()}
                    onChangeText={(text) => setNewValue({...newValue, importance: parseInt(text) || 5})}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateValue}>
                    <Text style={styles.createButtonText}>Create Value</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>War Journal</Text>
            <Text style={styles.subtitle}>Track your journey to greatness</Text>
          </View>
          <TouchableOpacity 
            style={styles.inboxButton}
            onPress={() => router.push('/inbox')}
          >
            <Mail size={24} color="#FFF" />
            {unreadMessages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {renderTabButton('quests', 'Quests')}
          {renderTabButton('journal', 'Journal')}
          {renderTabButton('achievements', 'Wins')}
          {renderTabButton('goals', 'Goals')}
          {renderTabButton('values', 'Values')}
        </View>

        {activeTab === 'quests' && renderQuestsTab()}
        {activeTab === 'journal' && renderJournalTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'values' && renderValuesTab()}

        {renderModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
  },
  subtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
  inboxButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Orbitron-Bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  activeTabButton: {
    backgroundColor: '#6366f1',
  },
  tabButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 8,
  },
  sectionDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  generateButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
  },
  questSection: {
    marginBottom: 24,
  },
  questCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  questBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questBadgeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#ffffff',
    marginLeft: 2,
  },
  questDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  questReasoning: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questDifficulty: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  questXP: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#fbbf24',
  },
  questDuration: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  questFrequency: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  completeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  completeButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  journalCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  journalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  journalContent: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  journalSection: {
    marginBottom: 8,
  },
  journalSectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#fbbf24',
    marginBottom: 4,
  },
  journalListItem: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 8,
    marginBottom: 2,
  },
  achievementCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  achievementBadgeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#ffffff',
    marginLeft: 2,
  },
  achievementDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementCategory: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  achievementDate: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  goalCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  goalStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  goalCompleted: {
    backgroundColor: '#10B981',
  },
  goalStatusText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#ffffff',
  },
  goalDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    backgroundColor: '#374151',
    borderRadius: 4,
    height: 8,
    flex: 1,
    marginRight: 8,
  },
  progressFill: {
    backgroundColor: '#6366f1',
    borderRadius: 4,
    height: '100%',
  },
  progressText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCategory: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  goalDate: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  valueCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  importanceBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importanceText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#fbbf24',
  },
  valueDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  emptyStateText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  closeButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  modalBody: {
    maxHeight: 400,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  completedSectionTitle: {
    color: '#9CA3AF',
  },
  completedSectionDescription: {
    color: '#9CA3AF',
  },
  completedQuestCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  completedQuestTitle: {
    color: '#ffffff',
  },
  completedQuestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedQuestBadgeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#ffffff',
    marginLeft: 2,
  },
  completedQuestDescription: {
    color: '#ffffff',
  },
  completedQuestReasoning: {
    color: '#ffffff',
  },
  completedQuestDifficulty: {
    color: '#ffffff',
  },
  completedQuestXP: {
    color: '#ffffff',
  },
  completedQuestDuration: {
    color: '#ffffff',
  },
  completedBadge: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  achievementStats: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  achievementStatsText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#ffffff',
  },
  systemQuestInstruction: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  questTimer: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#8B5CF6',
    marginLeft: 8,
  },
  emptyQuestState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232336',
  },
  emptyQuestTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyQuestText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
});