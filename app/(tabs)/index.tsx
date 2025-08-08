import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Modal, TextInput, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Clock, Plus, CircleCheck as CheckCircle2, Circle, Zap, Target, Flame, Trophy, Sword, Crown, Mail, Sparkles, Trash2, RotateCcw } from 'lucide-react-native';
import { router, useRouter, usePathname } from 'expo-router';
import { Task, UserStats, CompletedQuest } from '@/types/app';

import { getUserDailyTasks, createDailyTask, updateDailyTask, updateUserStats, getUserTasks, getUserCompletedQuests } from '@/utils/supabaseStorage';
import { cleanupDuplicateDailyTasks } from '@/utils/cleanupDuplicates';
import { resetDailyTasks } from '@/utils/resetDailyTasks';
import ProgressBar from '@/components/ProgressBar';
import GlowingButton from '@/components/GlowingButton';
import { scale, scaleFont } from '../../utils/config';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import HeaderActions from '@/components/HeaderActions';

// Add DailyTask type
interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  xpReward: number;
  completedAt?: string;
  canUndo?: boolean;
  undoExpiresAt?: string;
}

export default function HubScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    currentXP: 0,
    totalXP: 0,
    xpToNextLevel: 1000,
    tasksCompleted: 0,
    goalsCompleted: 0,
    streak: 0,
    title: 'E-Rank Awakened',
  });

  const [timeLeft, setTimeLeft] = useState('23:45:12');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [personalTodos, setPersonalTodos] = useState([
    { id: '1', title: 'Review project proposal', completed: false },
    { id: '2', title: 'Call mom', completed: false },
    { id: '3', title: 'Plan weekend activities', completed: false },
  ]);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [showAllTodosModal, setShowAllTodosModal] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [undoTimers, setUndoTimers] = useState<{ [key: string]: string }>({});
  const [loadingDailyTasks, setLoadingDailyTasks] = useState(false);
  const dailyTasksLoadedRef = useRef(false);
  const [completedQuests, setCompletedQuests] = useState<CompletedQuest[]>([]);

  useEffect(() => {
    loadData();
    loadDailyTasks();
    loadCompletedQuests();
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);

  // Listen for user stats updates from other components
  useEffect(() => {
    const handleUserStatsUpdate = () => {
      console.log('🔄 User stats update event received, refreshing...');
      loadData();
      loadCompletedQuests();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userStatsUpdated', handleUserStatsUpdate);
      return () => window.removeEventListener('userStatsUpdated', handleUserStatsUpdate);
    }
  }, []);

  // Timer for undo countdown
  useEffect(() => {
    const undoTimer = setInterval(() => {
      setUndoTimers(prevTimers => {
        const newTimers = { ...prevTimers };
        Object.keys(newTimers).forEach(taskId => {
          const task = dailyTasks.find(t => t.id === taskId);
          if (task && task.canUndo && task.undoExpiresAt) {
            const now = Date.now();
            const expiresAt = new Date(task.undoExpiresAt).getTime();
            const timeLeft = Math.max(0, expiresAt - now);
            
            if (timeLeft > 0) {
              const minutes = Math.floor(timeLeft / (1000 * 60));
              const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
              newTimers[taskId] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
              // Time expired, remove undo capability
              delete newTimers[taskId];
              setDailyTasks(prev => prev.map(t => 
                t.id === taskId 
                  ? { ...t, canUndo: false, undoExpiresAt: undefined }
                  : t
              ));
            }
          } else {
            // Task no longer has undo capability, remove timer
            delete newTimers[taskId];
          }
        });
        return newTimers;
      });
    }, 1000);
    return () => clearInterval(undoTimer);
  }, [dailyTasks]);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('type', 'system')
          .eq('is_read', false);
        if (!error && typeof count === 'number') {
          setUnreadMessages(count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setUnreadMessages(0);
      }
    };
    fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          console.log('Fetched profile data:', data);
          setProfile(data);
          const stats = {
            level: data.level,
            currentXP: data.current_xp,
            totalXP: data.total_xp,
            xpToNextLevel: (data.level * 1000) - (data.total_xp % 1000),
            tasksCompleted: data.tasks_completed,
            goalsCompleted: data.goals_completed,
            streak: data.streak,
            title: data.title,
          };
          console.log('Setting initial userStats:', stats);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  const loadData = () => {
    // This function is removed as per the instructions
  };

  const loadCompletedQuests = async () => {
    if (!user) return;
    try {
      console.log('🔄 Loading completed quests for hub...');
      const completed = await getUserCompletedQuests(user.id);
      const recentCompleted = completed.slice(0, 5); // Show last 5 completed
      console.log('✅ Loaded completed quests:', completed.length);
      console.log('📋 Completed quests:', completed.map(t => ({ title: t.title, questType: t.questType })));
      setCompletedQuests(recentCompleted);
    } catch (error) {
      console.error('❌ Error loading completed quests:', error);
    }
  };

  const loadDailyTasks = async () => {
    if (!user || loadingDailyTasks || dailyTasksLoadedRef.current) return;
    setLoadingDailyTasks(true);
    dailyTasksLoadedRef.current = true;
    try {
      // First, clean up any duplicates
      await cleanupDuplicateDailyTasks(user.id);
      
      const tasks = await getUserDailyTasks(user.id);
      if (tasks.length === 0) {
        // Create default daily tasks if none exist
        const defaultTasks = [
          { title: 'Drink 8 glasses of water', xpReward: 25 },
          { title: 'Get 15 minutes of sunlight', xpReward: 30 },
          { title: 'Write a journal entry', xpReward: 50 },
          { title: 'Practice gratitude', xpReward: 35 },
        ];
        
        for (const task of defaultTasks) {
          await createDailyTask(user.id, task);
        }
        
        // Reload tasks after creating defaults
        const newTasks = await getUserDailyTasks(user.id);
        setDailyTasks(newTasks);
      } else {
        setDailyTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading daily tasks:', error);
      dailyTasksLoadedRef.current = false; // Reset on error
    } finally {
      setLoadingDailyTasks(false);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    // This function is removed as per the instructions
  };

  const togglePersonalTodo = (todoId: string) => {
    setPersonalTodos(prev => prev.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deletePersonalTodo = (todoId: string) => {
    setPersonalTodos(prev => prev.filter(todo => todo.id !== todoId));
  };

  const handleAddTodo = () => {
    if (newTodoText.trim() === '') return;
    setPersonalTodos(prev => [
      ...prev,
      { id: Date.now().toString(), title: newTodoText.trim(), completed: false },
    ]);
    setNewTodoText('');
    setShowAddTodoModal(false);
  };

  const getUserTitle = (level: number): string => {
    if (level >= 50) return 'Awakened';
    if (level >= 40) return 'S-Rank Sage';
    if (level >= 30) return 'A-Rank Warrior';
    if (level >= 20) return 'B-Rank Guardian';
    if (level >= 10) return 'C-Rank Hunter';
    if (level >= 5) return 'D-Rank Apprentice';
    return 'E-Rank Novice';
  };

  const getTitleColor = (title: string): string => {
    if (title.includes('Awakened')) return '#8b5cf6';
    if (title.includes('S-Rank')) return '#f59e0b';
    if (title.includes('A-Rank')) return '#ef4444';
    if (title.includes('B-Rank')) return '#3b82f6';
    if (title.includes('C-Rank')) return '#10b981';
    if (title.includes('D-Rank')) return '#6366f1';
    return '#6b7280';
  };

  const getRankBadgeColor = (title: string): string => {
    if (title.includes('Shadow Monarch')) return '#8b5cf6';
    if (title.includes('S-Rank')) return '#f59e0b';
    if (title.includes('A-Rank')) return '#ef4444';
    if (title.includes('B-Rank')) return '#3b82f6';
    if (title.includes('C-Rank')) return '#10b981';
    if (title.includes('D-Rank')) return '#6366f1';
    return '#6b7280';
  };

  const getRankLetter = (title: string): string => {
    if (title.includes('Shadow Monarch')) return 'SM';
    if (title.includes('S-Rank')) return 'S';
    if (title.includes('A-Rank')) return 'A';
    if (title.includes('B-Rank')) return 'B';
    if (title.includes('C-Rank')) return 'C';
    if (title.includes('D-Rank')) return 'D';
    return 'E';
  };

  const completedDailyTasks = dailyTasks.filter(task => task.completed).length;
  const totalDailyTasks = dailyTasks.length;
  const completedPersonalTodos = dailyTasks.length;

  const toggleDailyTask = async (taskId: string) => {
    if (!user) return;
    
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (!task.completed) {
        // Completing the task
        const undoExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await updateDailyTask(taskId, {
          completed: true,
          completedAt: new Date().toISOString(),
          canUndo: true,
          undoExpiresAt: undoExpiresAt.toISOString(),
        });

        // Update local state
        setDailyTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, completed: true, completedAt: new Date().toISOString(), canUndo: true, undoExpiresAt: undoExpiresAt.toISOString() }
            : t
        ));

        // Update user stats
        const newStats = { ...userStats };
        newStats.currentXP += task.xpReward;
        newStats.totalXP += task.xpReward;
        newStats.tasksCompleted += 1;
        
        // Level up logic
        const newLevel = Math.floor(newStats.totalXP / 1000) + 1;
        if (newLevel > newStats.level) {
          newStats.level = newLevel;
          newStats.title = getUserTitle(newStats.level);
        }
        newStats.xpToNextLevel = (newStats.level * 1000) - (newStats.totalXP % 1000);
        
        console.log('Updating stats:', newStats);
        setUserStats(newStats);
        await updateUserStats(user.id, newStats);
        
        // Also update the profile state to keep it in sync
        setProfile((prev: any) => prev ? {
          ...prev,
          level: newStats.level,
          current_xp: newStats.currentXP,
          total_xp: newStats.totalXP,
          tasks_completed: newStats.tasksCompleted,
          goals_completed: newStats.goalsCompleted,
          streak: newStats.streak,
          title: newStats.title,
        } : prev);
        
        // Start undo timer
        setUndoTimers(prevTimers => ({ ...prevTimers, [taskId]: '5:00' }));
        
      } else if (task.canUndo) {
        // Undoing the task
        await updateDailyTask(taskId, {
          completed: false,
          completedAt: undefined,
          canUndo: false,
          undoExpiresAt: undefined,
        });

        // Update local state
        setDailyTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, completed: false, completedAt: undefined, canUndo: false, undoExpiresAt: undefined }
            : t
        ));

        // Update user stats
        const newStats = { ...userStats };
        newStats.currentXP -= task.xpReward;
        newStats.totalXP -= task.xpReward;
        newStats.tasksCompleted -= 1;
        
        // Level down logic
        const newLevel = Math.floor(newStats.totalXP / 1000) + 1;
        if (newLevel < newStats.level) {
          newStats.level = newLevel;
          newStats.title = getUserTitle(newStats.level);
        }
        newStats.xpToNextLevel = (newStats.level * 1000) - (newStats.totalXP % 1000);
        
        console.log('Undoing stats:', newStats);
        setUserStats(newStats);
        await updateUserStats(user.id, newStats);
        
        // Also update the profile state to keep it in sync
        setProfile((prev: any) => prev ? {
          ...prev,
          level: newStats.level,
          current_xp: newStats.currentXP,
          total_xp: newStats.totalXP,
          tasks_completed: newStats.tasksCompleted,
          goals_completed: newStats.goalsCompleted,
          streak: newStats.streak,
          title: newStats.title,
        } : prev);
        
        // Remove undo timer
        setUndoTimers(prevTimers => {
          const newTimers = { ...prevTimers };
          delete newTimers[taskId];
          return newTimers;
        });
      }
    } catch (error) {
      console.error('Error toggling daily task:', error);
    }
  };

  const undoDailyTask = async (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && task.completed && task.canUndo) {
      const now = new Date();
      const undoExpiresAt = new Date(task.undoExpiresAt || 0);
      if (now < undoExpiresAt) {
        await toggleDailyTask(taskId);
        // Optionally show a toast/alert
      }
    }
  };

  const isUndoTimeRunningOut = (taskId: string) => {
    const timer = undoTimers[taskId];
    if (!timer) return false;
    const [minutes, seconds] = timer.split(':').map(Number);
    return minutes === 0 && seconds < 30;
  };

  const getUndoButtonStyle = (taskId: string) => {
    const baseStyle = { borderWidth: 1, borderColor: '#f59e0b', borderRadius: 6, flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 };
    if (isUndoTimeRunningOut(taskId)) {
      return { ...baseStyle, borderColor: '#ef4444', backgroundColor: '#ef444420' };
    }
    return baseStyle;
  };

  const getUndoTimerTextStyle = (taskId: string) => {
    const baseStyle = { color: '#f59e0b', fontSize: 12, marginLeft: 4 };
    if (isUndoTimeRunningOut(taskId)) {
      return { ...baseStyle, color: '#ef4444' };
    }
    return baseStyle;
  };

  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth < 1024 && screenWidth >= 600;
  const isMobile = screenWidth < 600;
  const isDesktop = screenWidth >= 1024;

  // Responsive widget grid layout
  const gridStyle = [
    styles.widgetGrid,
    isTablet && styles.widgetGridTablet,
    isMobile && styles.widgetGridMobile,
  ];
  const columnStyle = [
    styles.widgetColumn,
    isTablet && styles.widgetColumnTablet,
    isMobile && styles.widgetColumnMobile,
  ];

  // Desktop grid layout: 2 columns below profile card
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#000000', '#0a0a1a', '#1a1a2e']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Crown size={24} color="#00ffff" />
              <Text style={styles.headerTitle}>The Hub</Text>
            </View>
            <View style={styles.headerRight}>
              <HeaderActions unreadMessages={unreadMessages} />
            </View>
          </View>

          {/* Hunter Profile Card - stays at top */}
          <View style={styles.profileSection}>
            <LinearGradient
              colors={['#1a1a2e', '#2d3748', '#1a1a2e']}
              style={styles.profileCard}
            >
              <View style={styles.cardContent}>
                {/* Left Side - Info */}
                <View style={styles.leftSection}>
                  <Text style={styles.username}>{profile?.username}</Text>
                  <Text style={styles.hunterCode}>ID: HNT-2024-001</Text>
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Level:</Text>
                      <Text style={styles.infoValue}>{userStats.level}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>XP:</Text>
                      <Text style={styles.infoValue}>
                        {userStats.currentXP} / {userStats.level * 1000}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Power:</Text>
                      <View style={styles.powerContainer}>
                        <Zap size={12} color="#fbbf24" />
                        <Text style={styles.powerValue}>{userStats.totalXP.toLocaleString()}</Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Class:</Text>
                      <Text style={styles.infoValue}>Awakened</Text>
                    </View>
                  </View>
                </View>

                {/* Right Side - Anime Avatar */}
                <View style={styles.rightSection}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['#00ffff', '#0066cc', '#003366']}
                      style={styles.avatarBorder}
                    >
                      <View style={styles.avatarFrame}>
                        <Image
                          source={{ uri: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=280&fit=crop' }}
                          style={styles.avatarImage}
                        />
                        {/* Glowing effect overlay */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0, 255, 255, 0.1)', 'transparent']}
                          style={styles.avatarGlow}
                        />
                      </View>
                    </LinearGradient>
                    
                    {/* Rank indicator on avatar */}
                    <View style={[styles.avatarRankBadge, { backgroundColor: getRankBadgeColor(userStats.title) }]}>
                      <Text style={styles.avatarRankText}>{getRankLetter(userStats.title)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Widgets Container */}
          <View style={[
            styles.widgetsContainer,
            isDesktop && styles.widgetsContainerDesktop,
            isTablet && styles.widgetsContainerTablet
          ]}>
            {/* Daily Quest Widget */}
            <View style={[
              styles.widgetCard,
              isDesktop && styles.dailyQuestWidgetDesktop
            ]}>
              <LinearGradient
                colors={['#1f2937', '#374151']}
                style={styles.questCardGradient}
              >
                <View style={styles.questContent}>
                  <Text style={styles.questTitle}>Master Your Day</Text>
                  <Text style={styles.questDescription}>
                    Complete all daily tasks to unlock bonus XP and maintain your streak
                  </Text>
                  <View style={styles.questProgress}>
                    <Text style={styles.questProgressText}>
                      Progress: {completedDailyTasks}/{totalDailyTasks}
                    </Text>
                    <ProgressBar 
                      progress={totalDailyTasks === 0 ? 0 : completedDailyTasks / totalDailyTasks} 
                      height={6}
                      glowColor="#10b981"
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Daily Tasks Widget */}
            <View style={[
              styles.widgetCard,
              isDesktop && styles.dailyTasksWidgetDesktop
            ]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Tasks</Text>
                <View style={styles.taskProgress}>
                  <Text style={styles.taskProgressText}>
                    {completedDailyTasks}/{totalDailyTasks}
                  </Text>
                </View>
              </View>
              <View style={styles.tasksContainer}>
                {dailyTasks.map(task => (
                  <View key={task.id} style={[styles.taskItem, task.completed && styles.completedTask]}> 
                    <TouchableOpacity
                      style={styles.taskLeft}
                      onPress={() => toggleDailyTask(task.id)}
                    >
                      {task.completed ? (
                        <CheckCircle2 size={20} color="#10b981" />
                      ) : (
                        <Circle size={20} color="#6b7280" />
                      )}
                      <Text style={[styles.taskText, task.completed && styles.completedTaskText]}>
                        {task.title}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.xpBadge}>
                        <Zap size={12} color="#fbbf24" />
                        <Text style={styles.xpBadgeText}>{task.xpReward}</Text>
                      </View>
                      {task.completed && task.canUndo && (
                        <TouchableOpacity
                          style={getUndoButtonStyle(task.id)}
                          onPress={() => undoDailyTask(task.id)}
                        >
                          <RotateCcw 
                            size={14} 
                            color={isUndoTimeRunningOut(task.id) ? '#ef4444' : '#f59e0b'} 
                          />
                          <Text style={getUndoTimerTextStyle(task.id)}>
                            {undoTimers[task.id] || '5:00'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Personal To-Dos Widget */}
            <View style={[
              styles.widgetCard,
              isDesktop && styles.personalTodosWidgetDesktop
            ]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>To Do</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {personalTodos.length > 5 && (
                    <TouchableOpacity onPress={() => setShowAllTodosModal(true)} style={{ marginRight: 12 }}>
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => setShowAddTodoModal(true)}
                    testID="add-todo-button"
                  >
                    <Plus size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.todosContainer}>
                {personalTodos.map(todo => (
                  <View
                    key={todo.id}
                    style={[styles.todoItem, todo.completed && styles.completedTodo, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      onPress={() => togglePersonalTodo(todo.id)}
                    >
                      {todo.completed ? (
                        <CheckCircle2 size={20} color="#00ffff" />
                      ) : (
                        <Circle size={20} color="#6b7280" />
                      )}
                      <Text style={[styles.todoText, todo.completed && styles.completedTodoText]}>
                        {todo.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePersonalTodo(todo.id)} style={{ padding: 8 }}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Current Stats Widget - Desktop positioning */}
            <View style={[
              styles.widgetCard,
              isDesktop && styles.currentStatsWidgetDesktop,
              isMobile && { display: 'none' }
            ]}>
              <Text style={styles.sectionTitle}>Current Stats</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Target size={24} color="#10b981" />
                  <Text style={styles.statValue}>{userStats.tasksCompleted}</Text>
                  <Text style={styles.statLabel}>Quests Completed</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Flame size={24} color="#f59e0b" />
                  <Text style={styles.statValue}>{userStats.streak}</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Zap size={24} color="#8b5cf6" />
                  <Text style={styles.statValue}>2.5x</Text>
                  <Text style={styles.statLabel}>XP Multiplier</Text>
                </View>
              </View>
            </View>

            {/* Recent Completed Quests Widget - Desktop positioning */}
            <View style={[
              styles.widgetCard,
              isDesktop && styles.recentQuestsWidgetDesktop,
              isMobile && { display: 'none' }
            ]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Completed Quests</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/journal')}
                  testID="view-all-quests-button"
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              {completedQuests.length > 0 ? (
                <View style={styles.questsContainer}>
                  {completedQuests.map(quest => (
                    <View key={quest.id} style={styles.completedQuestItem}>
                      <Text style={styles.completedQuestTitle}>{quest.title}</Text>
                      <View style={styles.questReward}>
                        <Zap size={14} color="#FBBF24" />
                        <Text style={styles.questXP}>+{quest.xpReward}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyQuestsContainer}>
                  <Text style={styles.emptyQuestsText}>
                    No completed quests yet. Complete quests in the War Journal to see them here!
                  </Text>
                  <TouchableOpacity 
                    style={styles.goToJournalButton}
                    onPress={() => router.push('/journal')}
                  >
                    <Text style={styles.goToJournalButtonText}>Go to War Journal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Timer Widget - Desktop only */}
            {isDesktop && (
              <View style={[styles.widgetCard, styles.timerWidgetDesktop]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Quick Timer</Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/tools')}
                    testID="open-tools-button"
                  >
                    <Text style={styles.viewAllText}>Open Tools</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timerPreview}>
                  <Clock size={32} color="#6366f1" />
                  <Text style={styles.timerPreviewText}>25:00</Text>
                  <TouchableOpacity 
                    style={styles.quickTimerButton}
                    onPress={() => router.push('/tools')}
                  >
                    <Text style={styles.quickTimerButtonText}>Start Pomodoro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Legacy tablet/mobile widgets - keep for backward compatibility */}
            {isTablet && !isDesktop && (
              <>
                {/* Current Stats Widget - Tablet */}
                <View style={styles.widgetCard}>
                  <Text style={styles.sectionTitle}>Current Stats</Text>
                  
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Target size={24} color="#10b981" />
                      <Text style={styles.statValue}>{userStats.tasksCompleted}</Text>
                      <Text style={styles.statLabel}>Quests Completed</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Flame size={24} color="#f59e0b" />
                      <Text style={styles.statValue}>{userStats.streak}</Text>
                      <Text style={styles.statLabel}>Current Streak</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Zap size={24} color="#8b5cf6" />
                      <Text style={styles.statValue}>2.5x</Text>
                      <Text style={styles.statLabel}>XP Multiplier</Text>
                    </View>
                  </View>
                </View>

                {/* Recent Completed Quests Widget - Tablet */}
                <View style={styles.widgetCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Completed Quests</Text>
                    <TouchableOpacity 
                      onPress={() => router.push('/journal')}
                      testID="view-all-quests-button"
                    >
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {completedQuests.length > 0 ? (
                    <View style={styles.questsContainer}>
                      {completedQuests.map(quest => (
                        <View key={quest.id} style={styles.completedQuestItem}>
                          <Text style={styles.completedQuestTitle}>{quest.title}</Text>
                          <View style={styles.questReward}>
                            <Zap size={14} color="#FBBF24" />
                            <Text style={styles.questXP}>+{quest.xpReward}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyQuestsContainer}>
                      <Text style={styles.emptyQuestsText}>
                        No completed quests yet. Complete quests in the War Journal to see them here!
                      </Text>
                      <TouchableOpacity 
                        style={styles.goToJournalButton}
                        onPress={() => router.push('/journal')}
                      >
                        <Text style={styles.goToJournalButtonText}>Go to War Journal</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Modals and overlays remain unchanged */}
        </SafeAreaView>
      </LinearGradient>
      <Modal
        visible={showAddTodoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddTodoModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#1f2937', padding: 24, borderRadius: 12, width: '80%' }}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>Add New To-Do</Text>
            <TextInput
              value={newTodoText}
              onChangeText={setNewTodoText}
              placeholder="Enter to-do..."
              placeholderTextColor="#9ca3af"
              style={{ backgroundColor: '#111827', color: '#fff', borderRadius: 8, padding: 10, marginBottom: 16 }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowAddTodoModal(false)} style={{ padding: 8 }}>
                <Text style={{ color: '#9ca3af', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddTodo} style={{ padding: 8 }}>
                <Text style={{ color: '#00ffff', fontSize: 16 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showAllTodosModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAllTodosModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#1f2937', padding: 24, borderRadius: 12, width: '90%', maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Orbitron-Bold' }}>All To-Dos</Text>
              <TouchableOpacity onPress={() => setShowAllTodosModal(false)} style={{ padding: 8 }}>
                <Text style={{ color: '#00ffff', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {personalTodos.map(todo => (
                <View
                  key={todo.id}
                  style={[styles.todoItem, todo.completed && styles.completedTodo, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => togglePersonalTodo(todo.id)}
                  >
                    {todo.completed ? (
                      <CheckCircle2 size={20} color="#00ffff" />
                    ) : (
                      <Circle size={20} color="#6b7280" />
                    )}
                    <Text style={[styles.todoText, todo.completed && styles.completedTodoText]}>
                      {todo.title}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deletePersonalTodo(todo.id)} style={{ padding: 8 }}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inboxButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  inboxBadge: {
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
  inboxBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
    paddingRight: 16,
  },
  username: {
    fontFamily: 'Orbitron-Black',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 2,
  },
  hunterCode: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    minWidth: 45,
  },
  infoValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  powerValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#fbbf24',
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    width: 90,
    height: 120,
    borderRadius: 12,
    padding: 3,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9,
  },
  avatarRankBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarRankText: {
    fontFamily: 'Orbitron-Black',
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: scale(20),
    marginBottom: scale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: scaleFont(20),
    color: '#ffffff',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  timerText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
  },
  dailyQuestCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  questCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
  },
  questContent: {
    width: '100%',
  },
  questTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  questDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  questProgress: {
    width: '100%',
  },
  questProgressText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  tasksContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  completedTask: {
    backgroundColor: '#10b98120',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  completedTaskText: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xpBadgeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#fbbf24',
    marginLeft: 2,
  },
  addButton: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  todosContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  completedTodo: {
    backgroundColor: '#00ffff20',
  },
  todoText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  completedTodoText: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statsScrollView: {
    marginHorizontal: -20,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: 'row',
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: scaleFont(20),
    color: '#ffffff',
    marginTop: scale(8),
    marginBottom: scale(4),
  },
  statLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: scaleFont(9),
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: scale(12),
  },
  questsContainer: {
    // Add appropriate styles for the quests container
  },
  bottomSpacing: {
    height: 100,
  },
  viewAllText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  completedQuestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  completedQuestTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  questReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questXP: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#fbbf24',
    marginLeft: 4,
  },
  emptyQuestsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyQuestsText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  goToJournalButton: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  goToJournalButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#ffffff',
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: 32,
    marginHorizontal: 20,
    marginTop: 8,
  },
  widgetGridTablet: { 
    flexDirection: 'column', 
    gap: 20,
    marginHorizontal: 20,
  },
  widgetGridMobile: { 
    flexDirection: 'column', 
    gap: 16, 
    marginHorizontal: 16,
    marginTop: 8,
  },
  widgetColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: 32,
  },
  widgetColumnTablet: { 
    width: '100%', 
    gap: 20,
  },
  widgetColumnMobile: { 
    width: '100%', 
    gap: 16,
  },
  widgetCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#00ffff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  taskProgress: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskProgressText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#10b981',
  },
  widgetsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  widgetsContainerDesktop: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: 'auto auto auto',
    gridGap: 24,
    gridTemplateAreas: `
      "daily-quest daily-tasks personal-todos"
      "current-stats recent-quests timer"
      ". . ."
    `,
    paddingHorizontal: 40,
  },
  widgetsContainerTablet: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: 20,
    paddingHorizontal: 30,
  },
  // Desktop widget positioning
  dailyQuestWidgetDesktop: {
    gridArea: 'daily-quest',
  },
  dailyTasksWidgetDesktop: {
    gridArea: 'daily-tasks',
  },
  personalTodosWidgetDesktop: {
    gridArea: 'personal-todos',
  },
  currentStatsWidgetDesktop: {
    gridArea: 'current-stats',
  },
  recentQuestsWidgetDesktop: {
    gridArea: 'recent-quests',
  },
  timerWidgetDesktop: {
    gridArea: 'timer',
  },
  // Timer widget styles
  timerPreview: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  timerPreviewText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#6366f1',
  },
  quickTimerButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickTimerButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
});