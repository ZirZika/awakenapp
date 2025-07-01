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