import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, Modal, Alert, TouchableOpacity, Platform, Picker } from 'react-native';
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
  updateUserStats
} from '@/utils/supabaseStorage';
import { generateTasksForGoal } from '@/utils/gameLogic';
import GlowingButton from '@/components/GlowingButton';
import TaskCard from '@/components/TaskCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AIService from '@/utils/aiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type TabType = 'quests' | 'journal' | 'achievements' | 'goals' | 'values';
type ModalType = 'journal' | 'goal' | 'achievement' | 'value' | null;

// Goal categories and descriptions (for future use):
const goalCategories: { value: string; label: string }[] = [
  { value: 'Mind Mastery', label: '🔮 Mind Mastery' }, // Level up your focus, clarity, and perception.
  { value: 'Body Ascension', label: '⚔️ Body Ascension' }, // Push your limits. Sculpt strength, speed, and stamina.
  { value: 'Skill Unleashing', label: '🧠 Skill Unleashing' }, // Unlock talents. Hone your craft. Forge your edge.
  { value: 'Wisdom Expansion', label: '📚 Wisdom Expansion' }, // Absorb knowledge. Widen your vision.
  { value: 'Inner Power Awakening', label: '🔥 Inner Power Awakening' }, // Channel energy. Build willpower. Master your spirit.
  { value: 'World Discovery', label: '🗺️ World Discovery' }, // Venture out. Seek the unknown. Expand your reality.
];

export default function WarJournalScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Data states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [personalAchievements, setPersonalAchievements] = useState<PersonalAchievement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systemQuests, setSystemQuests] = useState<SystemQuest[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

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
        setUnreadMessages(count);
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

  const loadData = async () => {
    if (!user) return;
    try {
      console.log('🔄 Loading journal data for user:', user.id);
      
      // Load all data from database
      const [userGoals, userJournalEntries, userCoreValues, userPersonalAchievements, userTasks, userSystemQuests] = await Promise.all([
        getUserGoals(user.id),
        getUserJournalEntries(user.id),
        getUserCoreValues(user.id),
        getUserPersonalAchievements(user.id),
        getUserTasks(user.id),
        getUserSystemQuests(user.id)
      ]);
      
      console.log('📊 Loaded data:', {
        goals: userGoals.length,
        journalEntries: userJournalEntries.length,
        coreValues: userCoreValues.length,
        achievements: userPersonalAchievements.length,
        tasks: userTasks.length,
        systemQuests: userSystemQuests.length
      });
      
      console.log('🎯 System Quests:', userSystemQuests.map(q => ({ title: q.title, isCompleted: q.isCompleted })));
      console.log('📋 Tasks:', userTasks.map(t => ({ title: t.title, isCompleted: t.isCompleted, questType: t.questType })));
      
      // Generate story quests for existing goals that don't have them
      await generateStoryQuestsForExistingGoals(userGoals, userTasks);
      
      // Check if daily journal entry is already completed for today
      await checkDailyJournalCompletion(userJournalEntries, userSystemQuests);
      
      setGoals(userGoals);
      setJournalEntries(userJournalEntries);
      setCoreValues(userCoreValues);
      setPersonalAchievements(userPersonalAchievements);
      setTasks(userTasks);
      setSystemQuests(userSystemQuests);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
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
      achievements: newJournalEntry.achievements.split('\n').filter(a => a.trim()),
      challenges: newJournalEntry.challenges.split('\n').filter(c => c.trim()),
      gratitude: newJournalEntry.gratitude.split('\n').filter(g => g.trim()),
      tomorrowGoals: newJournalEntry.tomorrowGoals.split('\n').filter(t => t.trim()),
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
    const color = isActive ? '#ffffff' : '#9ca3af';
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
      testID={`journal-tab-${tab}`}
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
                  {quest.title === 'Daily Journal Entry' && 'Complete this by writing a journal entry.'}
                  {quest.title === 'Weekly Achievement' && 'Complete this by recording a weekly achievement.'}
                  {quest.title === 'Weekly Goal Setting' && 'Complete this by setting a weekly goal.'}
                  {quest.title === 'Core Values Reflection' && 'Complete this by updating your core values.'}
                  {!['Daily Journal Entry','Weekly Achievement','Weekly Goal Setting','Core Values Reflection'].includes(quest.title) && 'Complete this by using the app features.'}
                </Text>
                {quest.title === 'Daily Journal Entry' && (
                  <TouchableOpacity 
                    style={styles.goButton}
                    onPress={() => setActiveTab('journal')}
                    testID="journal-daily-journal-go-button"
                  >
                    <Text style={styles.goButtonText}>Go</Text>
                  </TouchableOpacity>
                )}
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

        {/* Story Quests Section */}
        <View style={styles.questSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
                <Target size={24} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Story Quests</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
              Quests generated to help you achieve your specific goals and advance your story
          </Text>
          {goalBasedQuests.length > 0 ? (
            goalBasedQuests.map(task => (
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
                  <Text style={styles.completeButtonText}>Complete Quest</Text>
                </TouchableOpacity>
              </View>
            ))
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
                testID="journal-create-goal-button"
            />
        </View>
        )}
        </View>

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
                  testID={`journal-complete-ai-quest-${task.id}`}
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
                testID="journal-generate-ai-quests-button"
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
          testID="journal-new-entry-button"
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
                  <Text style={{ color: '#9CA3AF', marginBottom: 8, marginTop: 8, fontFamily: 'Orbitron-Regular', fontSize: 14 }}>Category</Text>
                  {Platform.OS === 'web' ? (
                    <select
                    value={newGoal.category}
                      onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                      style={{
                        background: '#23263a',
                        color: '#fff',
                        borderRadius: 8,
                        border: '1px solid #374151',
                        padding: '12px 16px',
                        fontFamily: 'Orbitron-Regular',
                        fontSize: 16,
                        width: '100%',
                        outline: 'none',
                        marginBottom: 16,
                        marginTop: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                        display: 'block',
                      }}
                    >
                      <option value="" disabled>Select Category</option>
                      {goalCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  ) : (
                    <View style={{ backgroundColor: '#23263a', borderRadius: 8, borderWidth: 1, borderColor: '#374151', marginBottom: 16 }}>
                      <Picker
                        selectedValue={newGoal.category}
                        onValueChange={itemValue => setNewGoal({ ...newGoal, category: itemValue })}
                        style={{ color: '#fff', fontFamily: 'Orbitron-Regular', fontSize: 16 }}
                        dropdownIconColor="#fff"
                      >
                        <Picker.Item label="Select Category" value="" color="#9CA3AF" />
                        {goalCategories.map(cat => (
                          <Picker.Item key={cat.value} label={cat.label} value={cat.value} color="#fff" />
                        ))}
                      </Picker>
                    </View>
                  )}
                  {Platform.OS === 'web' ? (
                    <>
                      <Text style={{ color: '#9CA3AF', marginBottom: 8, marginTop: 8, fontFamily: 'Orbitron-Regular', fontSize: 14 }}>Target Date</Text>
                      <input
                        type="date"
                    value={newGoal.targetDate}
                        onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                        style={{
                          background: '#23263a',
                          color: '#fff',
                          borderRadius: 8,
                          border: '1px solid #374151',
                          padding: '12px 16px',
                          fontFamily: 'Orbitron-Regular',
                          fontSize: 16,
                          width: '100%',
                          outline: 'none',
                          marginBottom: 16,
                          marginTop: 0,
                          marginLeft: 0,
                          marginRight: 0,
                          margin: 0,
                          boxSizing: 'border-box',
                          display: 'block',
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={{ color: '#9CA3AF', marginBottom: 8, marginTop: 8, fontFamily: 'Orbitron-Regular', fontSize: 14 }}>Target Date</Text>
                      <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center', height: 48 }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={{ color: newGoal.targetDate ? '#fff' : '#9CA3AF', fontFamily: 'Orbitron-Regular', fontSize: 16 }}>
                          {newGoal.targetDate ? newGoal.targetDate : 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={newGoal.targetDate ? new Date(newGoal.targetDate) : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event: DateTimePickerEvent, selectedDate?: Date | undefined) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                              setNewGoal({ ...newGoal, targetDate: selectedDate.toISOString().split('T')[0] });
                            }
                          }}
                        />
                      )}
                    </>
                  )}
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
                  <Text style={{ color: '#9CA3AF', marginBottom: 8, marginTop: 8, fontFamily: 'Orbitron-Regular', fontSize: 14 }}>Importance (1-10)</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    {[...Array(10)].map((_, i) => {
                      const value = i + 1;
                      const selected = newValue.importance === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          style={{
                            backgroundColor: selected ? '#6366f1' : '#23263a',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 8,
                            borderWidth: selected ? 2 : 1,
                            borderColor: selected ? '#00ffff' : '#374151',
                            marginHorizontal: 1,
                          }}
                          onPress={() => setNewValue({ ...newValue, importance: value })}
                        >
                          <Text style={{ color: selected ? '#fff' : '#9CA3AF', fontWeight: selected ? 'bold' : 'normal', fontFamily: 'Orbitron-Regular', fontSize: 14 }}>{value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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
          <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.inboxButton}
            onPress={() => router.push('/inbox')}
              testID="journal-inbox-button"
          >
              <Mail size={20} color="#6366f1" />
            {unreadMessages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              testID="journal-settings-button"
            >
              <Settings size={20} color="#9ca3af" />
          </TouchableOpacity>
          </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
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
  goButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  goButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
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