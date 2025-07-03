import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Clock, Plus, CircleCheck as CheckCircle2, Circle, Zap, Target, Flame, Trophy, Sword, Crown, Mail, Sparkles, Trash2, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';
import { Task, UserStats } from '@/types/app';
import { getTasks, getUserStats, completeTask } from '@/utils/storage';
import ProgressBar from '@/components/ProgressBar';
import GlowingButton from '@/components/GlowingButton';
import { scale, scaleFont } from '../../utils/config';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import InboxScreen from '../inbox';

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
    title: 'E-Rank Hunter',
  });

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Task[]>([]);
  const [incompleteTasks, setIncompleteTasks] = useState<Task[]>([]);
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
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    { id: '1', title: 'Drink 8 glasses of water', completed: false, xpReward: 25 },
    { id: '2', title: 'Get 15 minutes of sunlight', completed: false, xpReward: 30 },
    { id: '3', title: 'Write a journal entry', completed: false, xpReward: 50 },
    { id: '4', title: 'Practice gratitude', completed: false, xpReward: 35 },
  ]);
  const [undoTimers, setUndoTimers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
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
  }, []);

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

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setProfile(data);
        setUserStats({
          level: data.level,
          currentXP: data.current_xp,
          totalXP: data.total_xp,
          xpToNextLevel: (data.level * 1000) - (data.total_xp % 1000),
          tasksCompleted: data.tasks_completed,
          goalsCompleted: data.goals_completed,
          streak: data.streak,
          title: data.title,
        });
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const loadData = () => {
    const tasks = getTasks();
    setAllTasks(tasks);
    setCompletedQuests(tasks.filter(task => task.isCompleted).slice(0, 5));
    setIncompleteTasks(tasks.filter(task => !task.isCompleted));
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    loadData();
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
    if (level >= 50) return 'Shadow Monarch';
    if (level >= 40) return 'S-Rank Sage';
    if (level >= 30) return 'A-Rank Warrior';
    if (level >= 20) return 'B-Rank Guardian';
    if (level >= 10) return 'C-Rank Hunter';
    if (level >= 5) return 'D-Rank Apprentice';
    return 'E-Rank Novice';
  };

  const getTitleColor = (title: string): string => {
    if (title.includes('Shadow Monarch')) return '#8b5cf6';
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
  const completedPersonalTodos = completedQuests.length;

  const toggleDailyTask = (taskId: string) => {
    setDailyTasks(prev => {
      const updatedTasks = prev.map(task => {
        if (task.id === taskId) {
          if (!task.completed) {
            // Completing the task
            const newStats = { ...userStats };
            newStats.currentXP += task.xpReward;
            newStats.totalXP += task.xpReward;
            // Level up logic
            const newLevel = Math.floor(newStats.totalXP / 1000) + 1;
            if (newLevel > newStats.level) {
              newStats.level = newLevel;
              newStats.title = getUserTitle(newStats.level);
            }
            newStats.xpToNextLevel = (newStats.level * 1000) - (newStats.totalXP % 1000);
            setUserStats(newStats);
            const undoExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
            setUndoTimers(prevTimers => ({ ...prevTimers, [task.id]: '5:00' }));
            return {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
              canUndo: true,
              undoExpiresAt: undoExpiresAt.toISOString(),
            };
          } else if (task.canUndo) {
            // Undoing the task
            const newStats = { ...userStats };
            newStats.currentXP -= task.xpReward;
            newStats.totalXP -= task.xpReward;
            // Level down logic
            const newLevel = Math.floor(newStats.totalXP / 1000) + 1;
            if (newLevel < newStats.level) {
              newStats.level = newLevel;
              newStats.title = getUserTitle(newStats.level);
            }
            newStats.xpToNextLevel = (newStats.level * 1000) - (newStats.totalXP % 1000);
            setUserStats(newStats);
            setUndoTimers(prevTimers => {
              const newTimers = { ...prevTimers };
              delete newTimers[task.id];
              return newTimers;
            });
            return {
              ...task,
              completed: false,
              completedAt: undefined,
              canUndo: false,
              undoExpiresAt: undefined,
            };
          }
        }
        return task;
      });
      return updatedTasks;
    });
  };

  const undoDailyTask = (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && task.completed && task.canUndo) {
      const now = new Date();
      const undoExpiresAt = new Date(task.undoExpiresAt || 0);
      if (now < undoExpiresAt) {
        toggleDailyTask(taskId);
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

  // When stats change, update Supabase
  const updateProfileStats = async (stats: Partial<UserStats>) => {
    if (!user) return;
    await supabase.from('profiles').update({
      level: stats.level,
      current_xp: stats.currentXP,
      total_xp: stats.totalXP,
      tasks_completed: stats.tasksCompleted,
      goals_completed: stats.goalsCompleted,
      streak: stats.streak,
      title: stats.title,
    }).eq('id', user.id);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0a0a1a', '#1a1a2e']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Crown size={24} color="#00ffff" />
              <Text style={styles.headerTitle}>The Hub</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.inboxButton}
                onPress={() => router.push('/inbox')}
              >
                <Mail size={20} color="#6366f1" />
                {unreadMessages > 0 && (
                  <View style={styles.inboxBadge}>
                    <Text style={styles.inboxBadgeText}>{unreadMessages}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => router.push('/settings')}
              >
                <Settings size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hunter Profile Card - Sleek Version */}
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

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Daily Quest */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Quest</Text>
                <View style={styles.timerContainer}>
                  <Clock size={16} color="#f59e0b" />
                  <Text style={styles.timerText}>{timeLeft}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.dailyQuestCard}
                onPress={() => router.push('/journal')}
              >
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
              </TouchableOpacity>
            </View>

            {/* Daily Tasks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Tasks</Text>
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

            {/* Personal To-Dos */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>To Do</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {personalTodos.length > 5 && (
                    <TouchableOpacity onPress={() => setShowAllTodosModal(true)} style={{ marginRight: 12 }}>
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.addButton} onPress={() => setShowAddTodoModal(true)}>
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

            {/* Current Stats Panel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Stats</Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.statsScrollView}
                contentContainerStyle={styles.statsContainer}
              >
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
              </ScrollView>
            </View>

            {/* Recent Completed Quests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Completed Quests</Text>
                <TouchableOpacity onPress={() => router.push('/journal')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              {completedQuests.length > 0 ? (
                <View style={styles.questsContainer}>
                  {completedQuests.map(quest => (
                    <View key={quest.id} style={styles.completedQuestItem}>
                      <View style={styles.questItemLeft}>
                        <View style={styles.questTypeIcon}>
                          {quest.questType === 'ai-generated' ? (
                            <Sparkles size={16} color="#8B5CF6" />
                          ) : quest.questType === 'goal-based' ? (
                            <Target size={16} color="#3B82F6" />
                          ) : (
                            <Settings size={16} color="#10B981" />
                          )}
                        </View>
                        <View style={styles.questInfo}>
                          <Text style={styles.completedQuestTitle}>{quest.title}</Text>
                          <Text style={styles.questType}>
                            {quest.questType === 'ai-generated' ? 'AI Quest' : 
                             quest.questType === 'goal-based' ? 'Goal Quest' : 'System Quest'}
                          </Text>
                        </View>
                      </View>
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

            {/* Bottom spacing for tab bar */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
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
    </View>
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
  statsScrollView: {
    marginHorizontal: -20,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: scale(16),
    width: 120,
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
  questItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questInfo: {
    marginLeft: 12,
  },
  completedQuestTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  questType: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
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
});