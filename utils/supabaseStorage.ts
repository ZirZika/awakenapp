import { supabase } from '@/lib/supabase';
import { 
  Goal, 
  Task, 
  UserStats, 
  JournalEntry, 
  CoreValue, 
  PersonalAchievement 
} from '@/types/app';

// User Profile Functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const updateUserStats = async (userId: string, stats: Partial<UserStats>) => {
  console.log('updateUserStats called with userId:', userId, 'stats:', stats);
  
  // If we're only passing XP reward, we need to get current stats and add to them
  if (stats.currentXP !== undefined && stats.totalXP === undefined) {
    console.log('⚠️ Only currentXP provided, need to get current stats first');
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_xp, total_xp, level, tasks_completed, goals_completed, streak, title')
      .eq('id', userId)
      .single();
    
    if (profile) {
      const newTotalXP = profile.total_xp + stats.currentXP;
      const newLevel = Math.floor(newTotalXP / 1000) + 1;
      const newTitle = getUserTitle(newLevel);
      const newCurrentXP = newTotalXP % 1000; // XP within current level (0-999)
      const newXPToNextLevel = 1000 - newCurrentXP; // XP needed to next level
      
      stats = {
        ...stats,
        currentXP: newCurrentXP,
        totalXP: newTotalXP,
        level: newLevel,
        title: newTitle,
        xpToNextLevel: newXPToNextLevel,
        tasksCompleted: (profile.tasks_completed || 0) + (stats.tasksCompleted || 1)
      };
      
      console.log('📊 Calculated new stats:', stats);
      console.log('💰 XP Breakdown:', {
        oldTotal: profile.total_xp,
        earned: stats.currentXP,
        newTotal: newTotalXP,
        newCurrent: newCurrentXP,
        newLevel: newLevel,
        xpToNext: newXPToNextLevel
      });
    }
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({
      level: stats.level,
      current_xp: stats.currentXP,
      total_xp: stats.totalXP,
      tasks_completed: stats.tasksCompleted,
      goals_completed: stats.goalsCompleted,
      streak: stats.streak,
      title: stats.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
  
  console.log('✅ updateUserStats successful for userId:', userId);
};

// Helper function to get user title based on level
const getUserTitle = (level: number): string => {
  if (level >= 50) return 'Awakened';
  if (level >= 40) return 'S-Rank Sage';
  if (level >= 30) return 'A-Rank Warrior';
  if (level >= 20) return 'B-Rank Guardian';
  if (level >= 10) return 'C-Rank Hunter';
  if (level >= 5) return 'D-Rank Apprentice';
  return 'E-Rank Novice';
};

// Goals Functions
export const getUserGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return data.map(goal => ({
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    targetDate: goal.target_date,
    isCompleted: goal.is_completed,
    progress: goal.progress,
    createdAt: goal.created_at,
  })) as Goal[];
};

export const createGoal = async (userId: string, goal: Omit<Goal, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      target_date: goal.targetDate,
      is_completed: goal.isCompleted,
      progress: goal.progress,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    throw error;
  }

  return data;
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
  const { error } = await supabase
    .from('goals')
    .update({
      title: updates.title,
      description: updates.description,
      category: updates.category,
      target_date: updates.targetDate,
      is_completed: updates.isCompleted,
      progress: updates.progress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

// Tasks Functions
export const getUserTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data.map(task => ({
    id: task.id,
    goalId: task.goal_id,
    title: task.title,
    description: task.description,
    xpReward: task.xp_reward,
    difficulty: task.difficulty,
    isCompleted: task.is_completed,
    completedAt: task.completed_at,
    questType: task.quest_type,
    category: task.category,
    reasoning: task.reasoning,
    estimatedDuration: task.estimated_duration,
    isUnlocked: task.is_unlocked,
    unlockCondition: task.unlock_condition,
    hasTimer: task.has_timer,
    timerDuration: task.timer_duration,
    isStarted: task.is_started,
    startedAt: task.started_at,
    timeRemaining: task.time_remaining,
    canUndo: task.can_undo,
    undoExpiresAt: task.undo_expires_at,
    createdAt: task.created_at,
  })) as Task[];
};

export const createTask = async (userId: string, task: Omit<Task, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      goal_id: task.goalId,
      title: task.title,
      description: task.description,
      xp_reward: task.xpReward,
      difficulty: task.difficulty,
      is_completed: task.isCompleted,
      completed_at: task.completedAt,
      quest_type: task.questType,
      category: task.category,
      reasoning: task.reasoning,
      estimated_duration: task.estimatedDuration,
      is_unlocked: task.isUnlocked,
      unlock_condition: task.unlockCondition,
      has_timer: task.hasTimer,
      timer_duration: task.timerDuration,
      is_started: task.isStarted,
      started_at: task.startedAt,
      time_remaining: task.timeRemaining,
      can_undo: task.canUndo,
      undo_expires_at: task.undoExpiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return data;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const { error } = await supabase
    .from('tasks')
    .update({
      goal_id: updates.goalId,
      title: updates.title,
      description: updates.description,
      xp_reward: updates.xpReward,
      difficulty: updates.difficulty,
      is_completed: updates.isCompleted,
      completed_at: updates.completedAt,
      quest_type: updates.questType,
      category: updates.category,
      reasoning: updates.reasoning,
      estimated_duration: updates.estimatedDuration,
      is_unlocked: updates.isUnlocked,
      unlock_condition: updates.unlockCondition,
      has_timer: updates.hasTimer,
      timer_duration: updates.timerDuration,
      is_started: updates.isStarted,
      started_at: updates.startedAt,
      time_remaining: updates.timeRemaining,
      can_undo: updates.canUndo,
      undo_expires_at: updates.undoExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Journal Entries Functions
export const getUserJournalEntries = async (userId: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }

  return data.map(entry => ({
    id: entry.id,
    date: entry.date,
    mood: entry.mood,
    title: entry.title,
    content: entry.content,
    achievements: entry.achievements,
    challenges: entry.challenges,
    gratitude: entry.gratitude,
    tomorrowGoals: entry.tomorrow_goals,
    createdAt: entry.created_at,
  })) as JournalEntry[];
};

export const createJournalEntry = async (userId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      date: entry.date,
      mood: entry.mood,
      title: entry.title,
      content: entry.content,
      achievements: entry.achievements,
      challenges: entry.challenges,
      gratitude: entry.gratitude,
      tomorrow_goals: entry.tomorrowGoals,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }

  return data;
};

// Core Values Functions
export const getUserCoreValues = async (userId: string) => {
  const { data, error } = await supabase
    .from('core_values')
    .select('*')
    .eq('user_id', userId)
    .order('importance', { ascending: false });

  if (error) {
    console.error('Error fetching core values:', error);
    return [];
  }

  return data.map(value => ({
    id: value.id,
    title: value.title,
    description: value.description,
    importance: value.importance,
    createdAt: value.created_at,
  })) as CoreValue[];
};

export const createCoreValue = async (userId: string, value: Omit<CoreValue, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('core_values')
    .insert({
      user_id: userId,
      title: value.title,
      description: value.description,
      importance: value.importance,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating core value:', error);
    throw error;
  }

  return data;
};

// Personal Achievements Functions
export const getUserPersonalAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('personal_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching personal achievements:', error);
    return [];
  }

  return data.map(achievement => ({
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    category: achievement.category,
    date: achievement.date,
    significance: achievement.significance,
    createdAt: achievement.created_at,
    source: achievement.source,
  })) as PersonalAchievement[];
};

export const createPersonalAchievement = async (userId: string, achievement: Omit<PersonalAchievement, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('personal_achievements')
    .insert({
      user_id: userId,
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      date: achievement.date,
      significance: achievement.significance,
      source: achievement.source,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating personal achievement:', error);
    throw error;
  }

  return data;
};

// Habits Functions
export const getUserHabits = async (userId: string) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching habits:', error);
    return [];
  }

  return data;
};

export const createHabit = async (userId: string, habit: any) => {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: habit.name,
      streak: habit.streak,
      completed: habit.completed,
      reminder: habit.reminder,
      reminder_enabled: habit.reminderEnabled,
      category: habit.category,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating habit:', error);
    throw error;
  }

  return data;
};

export const updateHabit = async (habitId: string, updates: any) => {
  const { error } = await supabase
    .from('habits')
    .update({
      name: updates.name,
      streak: updates.streak,
      completed: updates.completed,
      reminder: updates.reminder,
      reminder_enabled: updates.reminderEnabled,
      category: updates.category,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId);

  if (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
};

export const deleteHabit = async (habitId: string) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

// Notes Functions
export const getUserNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data;
};

export const createNote = async (userId: string, note: any) => {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  return data;
};

export const updateNote = async (noteId: string, updates: any) => {
  const { error } = await supabase
    .from('notes')
    .update({
      title: updates.title,
      content: updates.content,
      category: updates.category,
      tags: updates.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId: string) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Friends Functions
export const sendFriendRequest = async (senderId: string, receiverUsername: string, message?: string) => {
  // First, find the receiver by username
  const { data: receiver, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', receiverUsername)
    .single();

  if (userError || !receiver) {
    throw new Error('User not found');
  }

  // Check if friendship already exists
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${senderId},friend_id.eq.${receiver.id}),and(user_id.eq.${receiver.id},friend_id.eq.${senderId})`)
    .single();

  if (existingFriendship) {
    throw new Error('Friendship already exists');
  }

  // Create friend request
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiver.id,
      message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }

  return data;
};

export const getFriendRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      sender:profiles!friend_requests_sender_id_fkey(username, profile_picture, level, title)
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }

  return data;
};

export const acceptFriendRequest = async (requestId: string) => {
  // Get the friend request
  const { data: request, error: requestError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    throw new Error('Friend request not found');
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateError) {
    throw updateError;
  }

  // Create friendship
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert({
      user_id: request.sender_id,
      friend_id: request.receiver_id,
      status: 'accepted',
    });

  if (friendshipError) {
    throw friendshipError;
  }
};

export const declineFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'declined' })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
};

export const getUserFriends = async (userId: string) => {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      friend:profiles!friendships_friend_id_fkey(id, username, profile_picture, level, title)
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  return data;
};

// Guild Functions
export const createGuild = async (captainId: string, guildData: any) => {
  const { data, error } = await supabase
    .from('guilds')
    .insert({
      name: guildData.name,
      description: guildData.description,
      icon: guildData.icon,
      captain_id: captainId,
      max_members: guildData.maxMembers,
      rank_names: guildData.rankNames,
      join_requirements: guildData.joinRequirements,
      auto_join: guildData.autoJoin,
      approval_required: guildData.approvalRequired,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating guild:', error);
    throw error;
  }

  // Add captain as member
  await supabase
    .from('guild_members')
    .insert({
      guild_id: data.id,
      user_id: captainId,
      rank: 'Captain',
    });

  return data;
};

export const getUserGuild = async (userId: string) => {
  const { data, error } = await supabase
    .from('guild_members')
    .select(`
      *,
      guild:guilds(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user guild:', error);
    return null;
  }

  return data;
};

export const updateGuild = async (guildId: string, updates: any) => {
  const { error } = await supabase
    .from('guilds')
    .update({
      name: updates.name,
      description: updates.description,
      icon: updates.icon,
      max_members: updates.maxMembers,
      rank_names: updates.rankNames,
      join_requirements: updates.joinRequirements,
      auto_join: updates.autoJoin,
      approval_required: updates.approvalRequired,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guildId);

  if (error) {
    console.error('Error updating guild:', error);
    throw error;
  }
};

// Messages Functions
export const getUserMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(username, profile_picture)
    `)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data;
};

export const markMessageAsRead = async (messageId: string) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export const sendMessage = async (senderId: string, receiverId: string, title: string, content: string, type: 'system' | 'guild' | 'friend') => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      title,
      content,
      type,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data;
};

// ============================================================================
// DAILY TASKS FUNCTIONS
// ============================================================================

export const getUserDailyTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching daily tasks:', error);
    return [];
  }

  return data.map(task => ({
    id: task.id,
    title: task.title,
    xpReward: task.xp_reward,
    completed: task.completed,
    completedAt: task.completed_at,
    canUndo: task.can_undo,
    undoExpiresAt: task.undo_expires_at,
    createdAt: task.created_at,
  }));
};

export const createDailyTask = async (userId: string, task: {
  title: string;
  xpReward: number;
}) => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      user_id: userId,
      title: task.title,
      xp_reward: task.xpReward,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating daily task:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    xpReward: data.xp_reward,
    completed: data.completed,
    completedAt: data.completed_at,
    canUndo: data.can_undo,
    undoExpiresAt: data.undo_expires_at,
    createdAt: data.created_at,
  };
};

export const updateDailyTask = async (taskId: string, updates: {
  completed?: boolean;
  completedAt?: string;
  canUndo?: boolean;
  undoExpiresAt?: string;
}) => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .update({
      completed: updates.completed,
      completed_at: updates.completedAt,
      can_undo: updates.canUndo,
      undo_expires_at: updates.undoExpiresAt,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating daily task:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    xpReward: data.xp_reward,
    completed: data.completed,
    completedAt: data.completed_at,
    canUndo: data.can_undo,
    undoExpiresAt: data.undo_expires_at,
    createdAt: data.created_at,
  };
};

export const deleteDailyTask = async (taskId: string) => {
  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting daily task:', error);
    throw error;
  }
};

// ============================================================================
// PERSONAL TODOS FUNCTIONS
// ============================================================================

export const getUserPersonalTodos = async (userId: string) => {
  const { data, error } = await supabase
    .from('personal_todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching personal todos:', error);
    return [];
  }

  return data.map(todo => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    priority: todo.priority,
    category: todo.category,
    dueDate: todo.due_date,
    completedAt: todo.completed_at,
    createdAt: todo.created_at,
  }));
};

export const createPersonalTodo = async (userId: string, todo: {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
}) => {
  const { data, error } = await supabase
    .from('personal_todos')
    .insert({
      user_id: userId,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      category: todo.category,
      due_date: todo.dueDate,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating personal todo:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    completed: data.completed,
    priority: data.priority,
    category: data.category,
    dueDate: data.due_date,
    completedAt: data.completed_at,
    createdAt: data.created_at,
  };
};

export const updatePersonalTodo = async (todoId: string, updates: {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  completedAt?: string;
}) => {
  const { data, error } = await supabase
    .from('personal_todos')
    .update({
      title: updates.title,
      description: updates.description,
      completed: updates.completed,
      priority: updates.priority,
      category: updates.category,
      due_date: updates.dueDate,
      completed_at: updates.completedAt,
    })
    .eq('id', todoId)
    .select()
    .single();

  if (error) {
    console.error('Error updating personal todo:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    completed: data.completed,
    priority: data.priority,
    category: data.category,
    dueDate: data.due_date,
    completedAt: data.completed_at,
    createdAt: data.created_at,
  };
};

export const deletePersonalTodo = async (todoId: string) => {
  const { error } = await supabase
    .from('personal_todos')
    .delete()
    .eq('id', todoId);

  if (error) {
    console.error('Error deleting personal todo:', error);
    throw error;
  }
};

// ============================================================================
// SYSTEM QUESTS FUNCTIONS
// ============================================================================

export const getUserSystemQuests = async (userId: string) => {
  const { data, error } = await supabase
    .from('system_quests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching system quests:', error);
    return [];
  }

  return data.map(quest => ({
    id: quest.id,
    title: quest.title,
    description: quest.description,
    frequency: quest.frequency,
    xpReward: quest.xp_reward,
    difficulty: quest.difficulty,
    category: quest.category,
    isCompleted: quest.is_completed,
    lastCompleted: quest.last_completed,
    nextDue: quest.next_due,
    createdAt: quest.created_at,
  }));
};

export const createSystemQuest = async (userId: string, quest: {
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once';
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  category: string;
}) => {
  const { data, error } = await supabase
    .from('system_quests')
    .insert({
      user_id: userId,
      title: quest.title,
      description: quest.description,
      frequency: quest.frequency,
      xp_reward: quest.xpReward,
      difficulty: quest.difficulty,
      category: quest.category,
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating system quest:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    frequency: data.frequency,
    xpReward: data.xp_reward,
    difficulty: data.difficulty,
    category: data.category,
    isCompleted: data.is_completed,
    lastCompleted: data.last_completed,
    nextDue: data.next_due,
    createdAt: data.created_at,
  };
};

export const updateSystemQuest = async (questId: string, updates: {
  isCompleted?: boolean;
  lastCompleted?: string;
  nextDue?: string;
}) => {
  const { data, error } = await supabase
    .from('system_quests')
    .update({
      is_completed: updates.isCompleted,
      last_completed: updates.lastCompleted,
      next_due: updates.nextDue,
    })
    .eq('id', questId)
    .select()
    .single();

  if (error) {
    console.error('Error updating system quest:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    frequency: data.frequency,
    xpReward: data.xp_reward,
    difficulty: data.difficulty,
    category: data.category,
    isCompleted: data.is_completed,
    lastCompleted: data.last_completed,
    nextDue: data.next_due,
    createdAt: data.created_at,
  };
};

export const createDefaultSystemQuests = async (userId: string) => {
  console.log('🎯 Creating default system quests for user:', userId);
  
  const defaultQuests = [
    {
      title: 'Daily Journal Entry',
      description: 'Write a journal entry to reflect on your day and track your progress',
      frequency: 'daily' as const,
      xpReward: 50,
      difficulty: 'Easy' as const,
      category: 'Personal',
    },
    {
      title: 'Weekly Goal Setting',
      description: 'Create a new goal to work towards this week',
      frequency: 'weekly' as const,
      xpReward: 100,
      difficulty: 'Medium' as const,
      category: 'Personal',
    },
    {
      title: 'Core Values Reflection',
      description: 'Add or update your core values to guide your decisions',
      frequency: 'monthly' as const,
      xpReward: 150,
      difficulty: 'Medium' as const,
      category: 'Personal',
    },
    {
      title: 'Weekly Achievement',
      description: 'Record a personal achievement or win from this week',
      frequency: 'weekly' as const,
      xpReward: 75,
      difficulty: 'Easy' as const,
      category: 'Personal',
    },
  ];

  try {
    for (const quest of defaultQuests) {
      await createSystemQuest(userId, quest);
      console.log('✅ Created system quest:', quest.title);
    }
    console.log('🎯 All default system quests created successfully');
  } catch (error) {
    console.error('❌ Error creating default system quests:', error);
    // Don't throw error - we don't want to fail signup if system quests fail
  }
};

// ============================================================================
// AI GENERATED QUESTS FUNCTIONS
// ============================================================================

export const getUserAIGeneratedQuests = async (userId: string) => {
  const { data, error } = await supabase
    .from('ai_generated_quests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching AI generated quests:', error);
    return [];
  }

  return data.map(quest => ({
    id: quest.id,
    title: quest.title,
    description: quest.description,
    xpReward: quest.xp_reward,
    difficulty: quest.difficulty,
    category: quest.category,
    reasoning: quest.reasoning,
    estimatedDuration: quest.estimated_duration,
    isCompleted: quest.is_completed,
    completedAt: quest.completed_at,
    expiresAt: quest.expires_at,
    createdAt: quest.created_at,
  }));
};

export const createAIGeneratedQuest = async (userId: string, quest: {
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  category: string;
  reasoning?: string;
  estimatedDuration?: string;
  expiresAt?: string;
}) => {
  const { data, error } = await supabase
    .from('ai_generated_quests')
    .insert({
      user_id: userId,
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xpReward,
      difficulty: quest.difficulty,
      category: quest.category,
      reasoning: quest.reasoning,
      estimated_duration: quest.estimatedDuration,
      expires_at: quest.expiresAt,
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating AI generated quest:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    xpReward: data.xp_reward,
    difficulty: data.difficulty,
    category: data.category,
    reasoning: data.reasoning,
    estimatedDuration: data.estimated_duration,
    isCompleted: data.is_completed,
    completedAt: data.completed_at,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
  };
};

export const updateAIGeneratedQuest = async (questId: string, updates: {
  isCompleted?: boolean;
  completedAt?: string;
}) => {
  const { data, error } = await supabase
    .from('ai_generated_quests')
    .update({
      is_completed: updates.isCompleted,
      completed_at: updates.completedAt,
    })
    .eq('id', questId)
    .select()
    .single();

  if (error) {
    console.error('Error updating AI generated quest:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    xpReward: data.xp_reward,
    difficulty: data.difficulty,
    category: data.category,
    reasoning: data.reasoning,
    estimatedDuration: data.estimated_duration,
    isCompleted: data.is_completed,
    completedAt: data.completed_at,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
  };
};

export const deleteAIGeneratedQuest = async (questId: string) => {
  const { error } = await supabase
    .from('ai_generated_quests')
    .delete()
    .eq('id', questId);

  if (error) {
    console.error('Error deleting AI generated quest:', error);
    throw error;
  }
};

// ============================================================================
// COMPLETED QUESTS FUNCTIONS
// ============================================================================

export const createCompletedQuest = async (userId: string, quest: {
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  category: string;
  questType: 'system' | 'story' | 'ai' | 'daily';
  completedAt: string;
}) => {
  const { data, error } = await supabase
    .from('completed_quests')
    .insert({
      user_id: userId,
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xpReward,
      difficulty: quest.difficulty,
      category: quest.category,
      quest_type: quest.questType,
      completed_at: quest.completedAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating completed quest:', error);
    throw error;
  }

  return data;
};

export const getUserCompletedQuests = async (userId: string) => {
  const { data, error } = await supabase
    .from('completed_quests')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching completed quests:', error);
    return [];
  }

  return data.map(quest => ({
    id: quest.id,
    title: quest.title,
    description: quest.description,
    xpReward: quest.xp_reward,
    difficulty: quest.difficulty,
    category: quest.category,
    questType: quest.quest_type,
    completedAt: quest.completed_at,
    createdAt: quest.created_at,
  }));
};