export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  progress: number;
  createdAt: string;
}

export interface Task {
  id: string;
  goalId?: string; // Optional for AI-generated quests
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  // New fields for enhanced quest system
  questType: 'ai-generated' | 'system' | 'goal-based';
  category: string;
  reasoning?: string; // Why this quest was generated (for AI quests)
  estimatedDuration?: string;
  isUnlocked: boolean;
  unlockCondition?: string;
  // Timer-related fields
  hasTimer?: boolean;
  timerDuration?: number; // in minutes
  isStarted?: boolean;
  startedAt?: string;
  timeRemaining?: number; // in seconds
  canUndo?: boolean;
  undoExpiresAt?: string;
  progressValue?: number; // Progress contribution toward goal completion (percentage)
}

// New interface for system quests
export interface SystemQuest {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once';
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  category: string;
  isCompleted: boolean;
  lastCompleted?: string;
  nextDue?: string;
  createdAt: string;
}

// New interface for quest generation triggers
export interface QuestTrigger {
  id: string;
  type: 'journal-entry' | 'goal-creation' | 'achievement' | 'mood-change';
  condition: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserStats {
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  tasksCompleted: number;
  goalsCompleted: number;
  streak: number;
  title: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
  title: string;
  content: string;
  achievements: string[];
  challenges: string[];
  gratitude: string[];
  tomorrowGoals: string[];
  createdAt: string;
}

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  importance: number; // 1-10
  createdAt: string;
}

export interface PersonalAchievement {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  significance: 'minor' | 'major' | 'legendary';
  createdAt: string;
  source?: 'journal' | 'manual';
}

export interface CompletedQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  category: string;
  questType: 'system' | 'story' | 'ai' | 'daily';
  completedAt: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  location: string | null;
  profile_picture: string | null;
  aura_color: 'red' | 'green' | 'blue';
  class: 'berserker' | 'shinobi' | 'sage' | 'vagabond';
  focus_area: 'business' | 'fitness' | 'intelligence';
  focus_goal: string | null;
  level: number;
  current_xp: number;
  total_xp: number;
  tasks_completed: number;
  goals_completed: number;
  streak: number;
  title: string;
  role: 'user' | 'developer' | 'admin';
  developer_permissions: Record<string, any> | null;
  admin_permissions: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}