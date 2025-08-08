import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, Modal, Alert, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Settings, Target, Award, Heart, Calendar, Smile, Meh, Frown, Star, Trophy, Flame, Brain, Swords, Mail, Sparkles, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { Goal, JournalEntry, CoreValue, PersonalAchievement, Task, SystemQuest } from '@/types/app';
import { 
  getUserGoals,
  createGoal,
  updateGoal,
  getUserJournalEntries,
  createJournalEntry,
  getUserCoreValues,
  createCoreValue,
  getUserPersonalAchievements,
  createPersonalAchievement,
  getUserTasks,
  createTask,
  updateTask,
  getUserSystemQuests,
  createSystemQuest,
  updateSystemQuest,
  createCompletedQuest,
  getUserAIGeneratedQuests,
  createAIGeneratedQuest,
  updateAIGeneratedQuest,
  updateUserStats,
  deleteGoal,
  deleteCoreValue
} from '@/utils/supabaseStorage';
import { generateTasksForGoal } from '@/utils/gameLogic';
import GlowingButton from '@/components/GlowingButton';
import TaskCard from '@/components/TaskCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AIService from '@/utils/aiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import styles from './JournalStyles';
import JournalEntryCard from '../../components/JournalEntryCard';
import GoalCard from '../../components/GoalCard';
import AchievementCard from '../../components/AchievementCard';
import QuestCard from '../../components/QuestCard';
import ValueCard from '../../components/ValueCard';
import JournalModal from '../../components/JournalModal';
import TabBar from '../../components/TabBar';
import CompletedQuestCard from '../../components/CompletedQuestCard';
import WidgetCard from '../../components/WidgetCard';
import useJournalData from '../../hooks/useJournalData';
import { getMoodIcon, getSignificanceColor, getTabIcon, getTimeRemaining } from '../../utils/journalHelpers';
import QuestsTab from '../../components/QuestsTab';
import JournalTab from '../../components/JournalTab';
import AchievementsTab from '../../components/AchievementsTab';
import GoalsTab from '../../components/GoalsTab';
import ValuesTab from '../../components/ValuesTab';
import { useJournalModal } from '../../hooks/useJournalModal';
import HeaderActions from '@/components/HeaderActions';
import { useTranslation } from 'react-i18next';

export type TabType = 'quests' | 'journal' | 'achievements' | 'goals' | 'values';
export type ModalType = 'journal' | 'goal' | 'achievement' | 'value' | null;

// Goal categories and descriptions (for future use):
const goalCategories: { value: string; label: string }[] = [
  { value: 'Mind Mastery', label: '🧠 Mind Mastery' }, // Level up your focus, clarity, and perception.
  { value: 'Body Ascension', label: '⚔️ Body Ascension' }, // Push your limits. Sculpt strength, speed, and stamina.
  { value: 'Wisdom Expansion', label: '📚 Wisdom Expansion' }, // Absorb knowledge. Widen your vision.
  { value: 'Business & Wealth', label: '💰 Business & Wealth' }, // Build your finances.
  { value: 'World Discovery', label: '🗺️ World Discovery' }, // Venture out. Seek the unknown. Expand your reality.
];

export default function WarJournalScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Data states
  const {
    goals, setGoals,
    journalEntries, setJournalEntries,
    coreValues, setCoreValues,
    personalAchievements, setPersonalAchievements,
    tasks, setTasks,
    systemQuests, setSystemQuests,
    unreadMessages,
    loadData,
  } = useJournalData(user);

  // Modal and form state (from custom hook)
  const {
    modalVisible,
    modalType,
    openModal,
    closeModal,
    newGoal,
    setNewGoal,
    newJournalEntry,
    setNewJournalEntry,
    newValue,
    setNewValue,
    newAchievement,
    setNewAchievement,
  } = useJournalModal();

  useEffect(() => {
    if (user) {
    loadData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('type', 'system')
        .eq('is_read', false);
      if (!error && typeof count === 'number') {
        // setUnreadMessages(count); // This line was removed as per the edit hint
      }
    };
    fetchUnreadCount();
  }, [user]);

  const generateStoryQuestsForExistingGoals = async (userGoals: Goal[], userTasks: Task[]) => {
    if (!user) return;
    
    try {
      console.log('🎯 Checking for existing goals that need story quests...');
      
      for (const goal of userGoals) {
        // Check if this goal already has story quests
        const existingStoryQuests = userTasks.filter(task => 
          task.questType === 'goal-based' && task.goalId === goal.id
        );
        
        if (existingStoryQuests.length === 0) {
          console.log('📝 Generating story quests for existing goal:', goal.title);
          const storyQuests = generateTasksForGoal(goal.title, goal.description);
          
          // Save story quests to database
          for (const quest of storyQuests) {
            console.log('💾 Saving story quest for existing goal:', quest.title);
            await createTask(user.id, {
              ...quest,
              goalId: goal.id,
              isCompleted: false
            });
          }
          console.log('✅ Generated', storyQuests.length, 'story quests for existing goal:', goal.title);
        } else {
          console.log('✅ Goal already has story quests:', goal.title, '(', existingStoryQuests.length, 'quests)');
        }
      }
    } catch (error) {
      console.error('❌ Error generating story quests for existing goals:', error);
    }
  };

  const checkDailyJournalCompletion = async (userJournalEntries: JournalEntry[], userSystemQuests: SystemQuest[]) => {
    if (!user) return;
    
    try {
      console.log('📝 Checking daily journal completion...');
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Today\'s date:', today);
      
      // Check if there's a journal entry for today
      const todaysEntry = userJournalEntries.find(entry => entry.date === today);
      
      if (todaysEntry) {
        console.log('✅ Found journal entry for today:', todaysEntry.title);
        
        // Check if the daily journal quest is not completed
        const dailyJournalQuest = userSystemQuests.find(q => 
          q.title === 'Daily Journal Entry' && !q.isCompleted
        );
        
        if (dailyJournalQuest) {
          console.log('🎯 Daily Journal Quest found and not completed, auto-completing...');
          
          await updateSystemQuest(dailyJournalQuest.id, {
            isCompleted: true,
            lastCompleted: new Date().toISOString(),
            nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
          });
          
          console.log('✅ System quest updated, now creating completed quest record...');
          
          // Create completed quest record
          await createCompletedQuest(user.id, {
            title: dailyJournalQuest.title,
            description: dailyJournalQuest.description,
            xpReward: dailyJournalQuest.xpReward,
            difficulty: dailyJournalQuest.difficulty,
            category: dailyJournalQuest.category,
            questType: 'system',
            completedAt: new Date().toISOString(),
          });
          
          console.log('✅ Completed quest record created, now updating user stats...');
          
          // Update user stats with XP reward
          const statsUpdate = {
            currentXP: dailyJournalQuest.xpReward,
            tasksCompleted: 1
          };
          console.log('📊 Updating user stats with:', statsUpdate);
          
          await updateUserStats(user.id, statsUpdate);
          
          console.log('✅ User stats updated successfully');
          
          Alert.alert('Quest Auto-Completed! 🎯', `You already completed today's journal entry! +${dailyJournalQuest.xpReward} XP awarded!`);
          
          // Force refresh of user stats in parent components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userStatsUpdated'));
          }
        } else {
          console.log('✅ Daily Journal Quest already completed or not found');
        }
      } else {
        console.log('📝 No journal entry found for today');
      }
    } catch (error) {
      console.error('❌ Error checking daily journal completion:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      console.log('🎯 Completing task:', taskId);
      
      // Find the task to get its details
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('❌ Task not found:', taskId);
        return;
      }
      
      console.log('📋 Task details:', {
        title: task.title,
        xpReward: task.xpReward,
        questType: task.questType,
        goalId: task.goalId,
        progressValue: task.progressValue
      });
      
      // Mark task as completed
      await updateTask(taskId, { isCompleted: true, completedAt: new Date().toISOString() });
      
      // Create completed quest record
      console.log('📝 Creating completed quest record...');
      await createCompletedQuest(user.id, {
        title: task.title,
        description: task.description,
        xpReward: task.xpReward,
        difficulty: task.difficulty,
        category: task.category,
        questType: task.questType === 'goal-based' ? 'story' : task.questType === 'ai-generated' ? 'ai' : 'daily',
        completedAt: new Date().toISOString(),
      });
      
      // Award XP and update user stats
      console.log('💰 Awarding XP:', task.xpReward);
      const statsUpdate = {
        currentXP: task.xpReward,
        tasksCompleted: 1
      };
      console.log('📊 Updating user stats with:', statsUpdate);
      
      await updateUserStats(user.id, statsUpdate);
      
      // Update goal progress if this is a story quest
      if (task.questType === 'goal-based' && task.goalId && task.progressValue) {
        console.log('🎯 Updating goal progress for goal:', task.goalId);
        console.log('📈 Progress value:', task.progressValue);
        
        const goal = goals.find(g => g.id === task.goalId);
        if (goal) {
          const newProgress = Math.min(goal.progress + task.progressValue, 100);
          console.log('📊 Goal progress update:', goal.progress, '->', newProgress);
          
          await updateGoal(task.goalId, { progress: newProgress });
          
          // Check if goal is now completed
          if (newProgress >= 100 && !goal.isCompleted) {
            console.log('🎉 Goal completed!');
            await updateGoal(task.goalId, { isCompleted: true });
            
            // Award bonus XP for goal completion
            const goalCompletionXP = 500;
            console.log('🏆 Awarding goal completion bonus XP:', goalCompletionXP);
            await updateUserStats(user.id, { currentXP: goalCompletionXP });
            
            Alert.alert('Goal Completed! 🎉', `Congratulations! You've completed "${goal.title}"! +${goalCompletionXP} bonus XP!`);
            
            // Force refresh of user stats in parent components
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('userStatsUpdated'));
            }
          }
        }
      }
      
      console.log('✅ Task completed successfully');
      Alert.alert('Quest Complete! 🎯', `You earned +${task.xpReward} XP!`);
      
      // Refresh data to update UI
      await loadData();
      
      // Force refresh of user stats in parent components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      }
    } catch (error) {
      console.error('❌ Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const handleGenerateAIQuests = async () => {
    if (!user) return;
    setIsGeneratingQuests(true);
    try {
      console.log('🤖 Starting AI quest generation...');
      const aiService = AIService;
      
      // Get context for AI generation
      const context = {
        journalEntries,
        goals,
        coreValues,
        completedTasks: tasks.filter(t => t.isCompleted),
        userLevel: 1 // You can get this from userStats
      };
      
      console.log('📊 AI Context:', {
        journalEntries: context.journalEntries.length,
        goals: context.goals.length,
        coreValues: context.coreValues.length,
        completedTasks: context.completedTasks.length,
        userLevel: context.userLevel
      });
      
      console.log('🎯 Active Goals:', context.goals.map(g => ({ title: g.title, progress: g.progress, isCompleted: g.isCompleted })));
      console.log('💎 Core Values:', context.coreValues.map(v => ({ title: v.title, importance: v.importance })));
      
      // Generate AI quests
      console.log('🔄 Calling AI service...');
      const generatedQuests = await aiService.generatePersonalizedQuests(context);
      
      console.log('✅ AI Quests Generated:', generatedQuests.length);
      console.log('📋 Generated Quests:', generatedQuests);
      
      // Save AI quests to database as tasks
      for (const quest of generatedQuests) {
        console.log('💾 Saving quest:', quest.title);
        await createTask(user.id, {
          title: quest.title,
          description: quest.description,
          xpReward: quest.xpReward,
          difficulty: quest.difficulty,
          isCompleted: false,
          questType: 'ai-generated',
          category: quest.category,
          reasoning: quest.reasoning,
          estimatedDuration: quest.estimatedDuration,
          isUnlocked: true
        });
      }
      
      console.log('✅ All quests saved to database');
      
      // Reload data to show new quests
      await loadData();
      
      Alert.alert('AI Quests Generated! 🤖', `Created ${generatedQuests.length} personalized quests based on your journal entries and goals.`);
    } catch (error) {
      console.error('❌ Error generating AI quests:', error);
      Alert.alert('Error', 'Failed to generate AI quests. Please try again.');
    } finally {
      setIsGeneratingQuests(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!user || !newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const goal: Omit<Goal, 'id' | 'createdAt'> = {
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category || 'Personal',
      targetDate: newGoal.targetDate,
      isCompleted: false,
      progress: 0,
    };

        try {
      // Create goal in database
      const createdGoal = await createGoal(user.id, goal);

      // Generate story quests for this goal
      console.log('🎯 Generating story quests for goal:', goal.title);
      const storyQuests = generateTasksForGoal(goal.title, goal.description);
      
      // Save story quests to database
      for (const quest of storyQuests) {
        console.log('💾 Saving story quest:', quest.title);
        await createTask(user.id, {
          ...quest,
          goalId: createdGoal.id, // Link to the created goal
          isCompleted: false
        });
      }
      console.log('✅ Generated', storyQuests.length, 'story quests for goal');

      // Check if this completes the "Weekly Goal Setting" system quest
      const weeklyGoalQuest = systemQuests.find(q => 
        q.title === 'Weekly Goal Setting' && !q.isCompleted
      );
      
      if (weeklyGoalQuest) {
        console.log('🎯 Weekly Goal Quest found:', weeklyGoalQuest);
        
        await updateSystemQuest(weeklyGoalQuest.id, {
          isCompleted: true,
          lastCompleted: new Date().toISOString(),
          nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
        });
        
        console.log('✅ System quest updated, now updating user stats...');
        
        // Update user stats with XP reward
        const statsUpdate = {
          currentXP: weeklyGoalQuest.xpReward,
          tasksCompleted: 1
        };
        console.log('📊 Updating user stats with:', statsUpdate);
        
        await updateUserStats(user.id, statsUpdate);
        
        console.log('✅ User stats updated successfully');
        
        Alert.alert('Quest Complete! 🎯', `You earned +${weeklyGoalQuest.xpReward} XP for setting a weekly goal!`);
      } else {
        console.log('❌ Weekly Goal Quest not found or already completed');
    }

    closeModal();
      await loadData();
      
      // Force refresh of user stats in parent components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      }
    
    // Show success message
    Alert.alert(
      'Goal Created! 🎯', 
        'Your goal has been added successfully.',
      [{ text: 'View Tasks', onPress: () => setActiveTab('quests') }]
    );
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    }
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
      achievements: newJournalEntry.achievements,
      challenges: newJournalEntry.challenges,
      gratitude: newJournalEntry.gratitude,
      tomorrowGoals: newJournalEntry.tomorrowGoals,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      await createJournalEntry(user.id, entry);
      
      // Check if this completes the "Daily Journal Entry" system quest
      const dailyJournalQuest = systemQuests.find(q => 
        q.title === 'Daily Journal Entry' && !q.isCompleted
      );
      
      if (dailyJournalQuest) {
        console.log('📝 Daily Journal Quest found:', dailyJournalQuest);
        
        await updateSystemQuest(dailyJournalQuest.id, {
          isCompleted: true,
          lastCompleted: new Date().toISOString(),
          nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        });
        
        console.log('✅ System quest updated, now creating completed quest record...');
        
        // Create completed quest record
        await createCompletedQuest(user.id, {
          title: dailyJournalQuest.title,
          description: dailyJournalQuest.description,
          xpReward: dailyJournalQuest.xpReward,
          difficulty: dailyJournalQuest.difficulty,
          category: dailyJournalQuest.category,
          questType: 'system',
          completedAt: new Date().toISOString(),
        });
        
        console.log('✅ Completed quest record created, now updating user stats...');
        
        // Update user stats with XP reward
        const statsUpdate = {
          currentXP: dailyJournalQuest.xpReward,
          tasksCompleted: 1
        };
        console.log('📊 Updating user stats with:', statsUpdate);
        
        await updateUserStats(user.id, statsUpdate);
        
        console.log('✅ User stats updated successfully');
        
        Alert.alert('Quest Complete! 🎯', `You earned +${dailyJournalQuest.xpReward} XP for completing your daily journal entry!`);
      } else {
        console.log('❌ Daily Journal Quest not found or already completed');
      }
    }

    closeModal();
    await loadData();
    
    // Force refresh of user stats in parent components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
    }
    // Show success message
    Alert.alert(
      'Journal Entry Added! 📝', 
      'Your entry has been recorded successfully.',
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

    if (user) {
      await createCoreValue(user.id, value);
      
      // Check if this completes the "Core Values Reflection" system quest
      const coreValuesQuest = systemQuests.find(q => 
        q.title === 'Core Values Reflection' && !q.isCompleted
      );
      
    if (coreValuesQuest) {
        console.log('💎 Core Values Quest found:', coreValuesQuest);
        
        await updateSystemQuest(coreValuesQuest.id, {
          isCompleted: true,
          lastCompleted: new Date().toISOString(),
          nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next month
        });
        
        console.log('✅ System quest updated, now creating completed quest record...');
        
        // Create completed quest record
        await createCompletedQuest(user.id, {
          title: coreValuesQuest.title,
          description: coreValuesQuest.description,
          xpReward: coreValuesQuest.xpReward,
          difficulty: coreValuesQuest.difficulty,
          category: coreValuesQuest.category,
          questType: 'system',
          completedAt: new Date().toISOString(),
        });
        
        console.log('✅ Completed quest record created, now updating user stats...');
        
        // Update user stats with XP reward
        const statsUpdate = {
          currentXP: coreValuesQuest.xpReward,
          tasksCompleted: 1
        };
        console.log('📊 Updating user stats with:', statsUpdate);
        
        await updateUserStats(user.id, statsUpdate);
        
        console.log('✅ User stats updated successfully');
        
        Alert.alert('Quest Complete! 🎯', `You earned +${coreValuesQuest.xpReward} XP for updating your core values!`);
      } else {
        console.log('❌ Core Values Quest not found or already completed');
      }
    }

    closeModal();
    await loadData();
    
    // Force refresh of user stats in parent components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
    }
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

    if (user) {
      await createPersonalAchievement(user.id, achievement);
      
      // Check if this completes the "Weekly Achievement" system quest
      const weeklyAchievementQuest = systemQuests.find(q => 
        q.title === 'Weekly Achievement' && !q.isCompleted
      );
      
      if (weeklyAchievementQuest) {
        console.log('🏆 Weekly Achievement Quest found:', weeklyAchievementQuest);
        
        await updateSystemQuest(weeklyAchievementQuest.id, {
          isCompleted: true,
          lastCompleted: new Date().toISOString(),
          nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
        });
        
        console.log('✅ System quest updated, now creating completed quest record...');
        
        // Create completed quest record
        await createCompletedQuest(user.id, {
          title: weeklyAchievementQuest.title,
          description: weeklyAchievementQuest.description,
          xpReward: weeklyAchievementQuest.xpReward,
          difficulty: weeklyAchievementQuest.difficulty,
          category: weeklyAchievementQuest.category,
          questType: 'system',
          completedAt: new Date().toISOString(),
        });
        
        console.log('✅ Completed quest record created, now updating user stats...');
        
        // Update user stats with XP reward
        const statsUpdate = {
          currentXP: weeklyAchievementQuest.xpReward,
          tasksCompleted: 1
        };
        console.log('📊 Updating user stats with:', statsUpdate);
        
        await updateUserStats(user.id, statsUpdate);
        
        console.log('✅ User stats updated successfully');
        
        Alert.alert('Quest Complete! 🎯', `You earned +${weeklyAchievementQuest.xpReward} XP for recording a weekly achievement!`);
      } else {
        console.log('❌ Weekly Achievement Quest not found or already completed');
      }
    }

    closeModal();
    await loadData();
    
    // Force refresh of user stats in parent components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
    }
  };

  const handleDeleteValue = async (id: string) => {
    try {
      await deleteCoreValue(id);
      setCoreValues(prev => prev.filter(v => v.id !== id));
      Alert.alert('Deleted', 'Value deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete value');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('War Journal')}</Text>
            <Text style={styles.subtitle}>{t('Track your journey to greatness')}</Text>
          </View>
          <View style={styles.headerRight}>
            <HeaderActions unreadMessages={unreadMessages} />
          </View>
        </View>

        <TabBar
          tabs={[
            { key: 'quests', title: t('Quests') },
            { key: 'journal', title: t('Journal') },
            { key: 'achievements', title: t('Wins') },
            { key: 'goals', title: t('Goals') },
            { key: 'values', title: t('Values') },
          ]}
          activeTab={activeTab}
          onTabPress={key => setActiveTab(key as TabType)}
        />

        {activeTab === 'quests' && (
          <QuestsTab
            tasks={tasks}
            systemQuests={systemQuests}
            isGeneratingQuests={isGeneratingQuests}
            handleCompleteTask={handleCompleteTask}
            handleGenerateAIQuests={handleGenerateAIQuests}
            openModal={openModal}
            setActiveTab={setActiveTab}
            getTimeRemaining={getTimeRemaining}
          />
        )}
        {activeTab === 'journal' && (
          <JournalTab
            journalEntries={journalEntries}
            openModal={openModal}
          />
        )}
        {activeTab === 'achievements' && (
          <AchievementsTab
            journalEntries={journalEntries}
            personalAchievements={personalAchievements}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsTab
            goals={goals}
            openModal={openModal}
            deleteGoal={id =>
              new Promise<void>((resolve) => {
                Alert.alert(
                  'Delete Goal',
                  'Are you sure you want to delete this goal?',
                  [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
                    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGoal(id); resolve(); } },
                  ]
                );
              })
            }
            loadData={loadData}
          />
        )}
        {activeTab === 'values' && (
          <ValuesTab
            coreValues={coreValues}
            openModal={openModal}
            onDelete={handleDeleteValue}
          />
        )}

        <JournalModal
          visible={modalVisible}
          type={modalType}
          onClose={closeModal}
          newJournalEntry={newJournalEntry}
          setNewJournalEntry={setNewJournalEntry}
          onCreateJournalEntry={handleCreateJournalEntry}
          newGoal={newGoal}
          setNewGoal={setNewGoal}
          onCreateGoal={handleCreateGoal}
          newValue={newValue}
          setNewValue={setNewValue}
          onCreateValue={handleCreateValue}
          newAchievement={newAchievement}
          setNewAchievement={setNewAchievement}
          onCreateAchievement={handleCreateAchievement}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}