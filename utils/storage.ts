import { Goal, Task, UserStats, JournalEntry, CoreValue, PersonalAchievement, SystemQuest, QuestTrigger } from '@/types/app';
import { generateIntelligentTasks, generateIntelligentTasksForGoal } from './intelligentTaskGeneration';
import aiService from './aiService';

// Simple in-memory storage for demo purposes
// In a real app, you'd use AsyncStorage or a database
let goals: Goal[] = [];
let tasks: Task[] = [];
let systemQuests: SystemQuest[] = [];
let journalEntries: JournalEntry[] = [];
let coreValues: CoreValue[] = [];
let personalAchievements: PersonalAchievement[] = [];
let questTriggers: QuestTrigger[] = [];
let userStats: UserStats = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  xpToNextLevel: 1000,
  tasksCompleted: 0,
  goalsCompleted: 0,
  streak: 0,
  title: 'E-Rank Hunter',
};

// Initialize system quests on first load
let systemQuestsInitialized = false;

// Habit Tracker Storage Functions
let habits: any[] = [];

export const getGoals = (): Goal[] => goals;
export const getTasks = (): Task[] => tasks;
export const getSystemQuests = (): SystemQuest[] => systemQuests;
export const getUserStats = (): UserStats => userStats;
export const getJournalEntries = (): JournalEntry[] => journalEntries;
export const getCoreValues = (): CoreValue[] => coreValues;
export const getPersonalAchievements = (): PersonalAchievement[] => personalAchievements;
export const getQuestTriggers = (): QuestTrigger[] => questTriggers;
export const getHabits = (): any[] => habits;

export const addGoal = (goal: Goal): void => {
  goals.push(goal);
};

export const updateGoal = (goalId: string, updates: Partial<Goal>): void => {
  const index = goals.findIndex(g => g.id === goalId);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates };
  }
};

export const addTask = (task: Task): void => {
  tasks.push(task);
};

export const addSystemQuest = (quest: SystemQuest): void => {
  systemQuests.push(quest);
};

export const addJournalEntry = async (entry: JournalEntry): Promise<void> => {
  journalEntries.unshift(entry); // Add to beginning for chronological order
  
  // Generate new AI quests based on the journal entry
  await generateAIQuestsFromJournalEntry(entry);
  
  // Generate new intelligent tasks based on the new journal entry
  generateIntelligentTasksFromContext();
  
  // Generate achievements from journal entry achievements
  if (entry.achievements.length > 0) {
    entry.achievements.forEach((achievement, index) => {
      const generatedAchievement: PersonalAchievement = {
        id: `${entry.id}-achievement-${index}`,
        title: achievement,
        description: `Achievement from ${entry.date}: ${achievement}`,
        category: 'Personal',
        date: entry.date,
        significance: 'minor',
        createdAt: entry.createdAt,
        source: 'journal'
      };
      
      // Add to personal achievements if not already present
      const existingAchievement = personalAchievements.find(a => 
        a.title === achievement && a.source === 'journal'
      );
      
      if (!existingAchievement) {
        personalAchievements.unshift(generatedAchievement);
      }
    });
  }
};

export const addCoreValue = async (value: CoreValue): Promise<void> => {
  coreValues.push(value);
  
  // Generate new AI quests when values are added
  await generateAIQuestsFromContext();
  
  // Generate new tasks when values are added
  generateIntelligentTasksFromContext();
};

export const addPersonalAchievement = async (achievement: PersonalAchievement): Promise<void> => {
  // Add source property for manually created achievements
  const achievementWithSource = {
    ...achievement,
    source: 'manual' as const
  };
  
  personalAchievements.unshift(achievementWithSource);
  
  // Generate new AI quests when achievements are added
  await generateAIQuestsFromContext();
  
  // Generate new tasks when achievements are added
  generateIntelligentTasksFromContext();
};

// Generate AI quests based on journal entry
export const generateAIQuestsFromJournalEntry = async (entry: JournalEntry): Promise<void> => {
  try {
    const context = {
      journalEntries: [entry, ...journalEntries.slice(0, 2)], // Include new entry + 2 recent ones
      goals: goals.filter(g => !g.isCompleted),
      coreValues,
      completedTasks: tasks.filter(t => t.isCompleted),
      userLevel: userStats.level
    };

    const aiQuests = await aiService.generatePersonalizedQuests(context);
    
    // Convert AI quests to Task format
    aiQuests.forEach(quest => {
      const task: Task = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: quest.title,
        description: quest.description,
        xpReward: quest.xpReward,
        difficulty: quest.difficulty,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        questType: 'ai-generated',
        category: quest.category,
        reasoning: quest.reasoning,
        estimatedDuration: quest.estimatedDuration,
        isUnlocked: true, // AI quests are unlocked by default
      };
      
      addTask(task);
    });
  } catch (error) {
    console.error('Error generating AI quests:', error);
  }
};

// Generate AI quests based on current context
export const generateAIQuestsFromContext = async (): Promise<void> => {
  try {
    const context = {
      journalEntries: journalEntries.slice(0, 3), // Last 3 entries
      goals: goals.filter(g => !g.isCompleted),
      coreValues,
      completedTasks: tasks.filter(t => t.isCompleted),
      userLevel: userStats.level
    };

    const aiQuests = await aiService.generatePersonalizedQuests(context);
    
    // Remove old AI-generated quests that aren't completed
    tasks = tasks.filter(task => task.isCompleted || task.questType !== 'ai-generated');
    
    // Convert AI quests to Task format
    aiQuests.forEach(quest => {
      const task: Task = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: quest.title,
        description: quest.description,
        xpReward: quest.xpReward,
        difficulty: quest.difficulty,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        questType: 'ai-generated',
        category: quest.category,
        reasoning: quest.reasoning,
        estimatedDuration: quest.estimatedDuration,
        isUnlocked: true,
      };
      
      addTask(task);
    });
  } catch (error) {
    console.error('Error generating AI quests:', error);
  }
};

// Initialize system quests
export const initializeSystemQuests = (): void => {
  if (systemQuestsInitialized) return;
  
  const dailyQuests: SystemQuest[] = [
    {
      id: 'daily-journal',
      title: 'Daily Journal Entry',
      description: 'Write a journal entry about your day',
      frequency: 'daily',
      xpReward: 50,
      difficulty: 'Easy',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'daily-reflection',
      title: 'Daily Reflection',
      description: 'Take 10 minutes to reflect on your goals and progress',
      frequency: 'daily',
      xpReward: 30,
      difficulty: 'Easy',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const weeklyQuests: SystemQuest[] = [
    {
      id: 'weekly-win',
      title: 'Record a Win',
      description: 'Document an achievement or win from this week',
      frequency: 'weekly',
      xpReward: 100,
      difficulty: 'Medium',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const monthlyQuests: SystemQuest[] = [
    {
      id: 'monthly-goal',
      title: 'Create a New Goal',
      description: 'Set a new goal for the upcoming month',
      frequency: 'monthly',
      xpReward: 150,
      difficulty: 'Medium',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'monthly-review',
      title: 'Monthly Review',
      description: 'Review your progress and achievements from the past month',
      frequency: 'monthly',
      xpReward: 200,
      difficulty: 'Hard',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const quarterlyQuests: SystemQuest[] = [
    {
      id: 'quarterly-assessment',
      title: 'Quarterly Life Assessment',
      description: 'Conduct a comprehensive review of your life areas and set new directions',
      frequency: 'quarterly',
      xpReward: 300,
      difficulty: 'Hard',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const yearlyQuests: SystemQuest[] = [
    {
      id: 'yearly-vision',
      title: 'Annual Vision Setting',
      description: 'Create your vision and major goals for the upcoming year',
      frequency: 'yearly',
      xpReward: 500,
      difficulty: 'Epic',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const coreValuesQuest: SystemQuest[] = [
    {
      id: 'core-values',
      title: 'Define Your Core Values',
      description: 'Identify and document your core values and what matters most to you',
      frequency: 'once',
      xpReward: 200,
      difficulty: 'Medium',
      category: 'Personal',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
  ];

  systemQuests = [...dailyQuests, ...weeklyQuests, ...monthlyQuests, ...quarterlyQuests, ...yearlyQuests, ...coreValuesQuest];
  systemQuestsInitialized = true;
};

// Generate intelligent tasks based on current user context
export const generateIntelligentTasksFromContext = (): void => {
  const context = {
    journalEntries,
    goals,
    coreValues,
    personalAchievements,
    completedTasks: tasks.filter(t => t.isCompleted)
  };
  
  // Only generate new tasks if user has some context (journal entries, goals, etc.)
  if (context.journalEntries.length === 0 && context.goals.length === 0) {
    return;
  }
  
  // Remove old auto-generated tasks that aren't completed
  tasks = tasks.filter(task => task.isCompleted || task.questType !== 'goal-based');
  
  // Generate new intelligent tasks
  const newTasks = generateIntelligentTasks(context, 3);
  
  newTasks.forEach(taskData => {
    addTask({
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      goalId: 'auto-generated', // Special ID for auto-generated tasks
      createdAt: new Date().toISOString(),
      isCompleted: false,
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    });
  });
};

export const completeTask = (taskId: string): void => {
  const task = tasks.find(t => t.id === taskId);
  if (task && !task.isCompleted) {
    task.isCompleted = true;
    task.completedAt = new Date().toISOString();
    
    // Update user stats
    userStats.currentXP += task.xpReward;
    userStats.totalXP += task.xpReward;
    userStats.tasksCompleted += 1;
    
    // Check for level up
    const newLevel = Math.floor(userStats.totalXP / 1000) + 1;
    if (newLevel > userStats.level) {
      userStats.level = newLevel;
      userStats.title = getUserTitle(newLevel);
    }
    
    userStats.xpToNextLevel = (userStats.level * 1000) - (userStats.totalXP % 1000);
    
    // Generate new intelligent tasks after completing a task
    setTimeout(() => {
      generateIntelligentTasksFromContext();
    }, 1000); // Small delay to allow UI to update
  }
};

// Enhanced goal creation with intelligent task generation
export const addGoalWithIntelligentTasks = (goal: Goal): void => {
  addGoal(goal);
  
  const context = {
    journalEntries,
    goals,
    coreValues,
    personalAchievements,
    completedTasks: tasks.filter(t => t.isCompleted)
  };
  
  // Generate intelligent tasks for this specific goal
  const generatedTasks = generateIntelligentTasksForGoal(goal, context);
  generatedTasks.forEach(taskData => {
    addTask({
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      goalId: goal.id,
      createdAt: new Date().toISOString(),
      isCompleted: false,
      questType: 'goal-based',
      category: goal.category,
      isUnlocked: true,
    });
  });
};

// Get suggested goals based on journal entry
export const getSuggestedGoals = async (journalEntry: JournalEntry): Promise<string[]> => {
  try {
    return await aiService.generateSuggestedGoals(journalEntry, coreValues);
  } catch (error) {
    console.error('Error getting suggested goals:', error);
    return [];
  }
};

const getUserTitle = (level: number): string => {
  if (level >= 50) return 'Shadow Monarch';
  if (level >= 40) return 'S-Rank Hunter';
  if (level >= 30) return 'A-Rank Hunter';
  if (level >= 20) return 'B-Rank Hunter';
  if (level >= 10) return 'C-Rank Hunter';
  if (level >= 5) return 'D-Rank Hunter';
  return 'E-Rank Hunter';
};

export const addHabit = (habit: any): void => {
  habits.push(habit);
};

export const updateHabit = (habitId: string, updates: any): void => {
  const index = habits.findIndex(h => h.id === habitId);
  if (index !== -1) {
    habits[index] = { ...habits[index], ...updates };
  }
};

export const deleteHabit = (habitId: string): void => {
  habits = habits.filter(h => h.id !== habitId);
};

export const toggleHabitCompletion = (habitId: string): void => {
  const habit = habits.find(h => h.id === habitId);
  if (habit) {
    habit.completed = !habit.completed;
    if (habit.completed) {
      habit.streak = (habit.streak || 0) + 1;
    }
  }
};

export const cleanupTemplateHabits = (): void => {
  // For demo: remove any habits with a template flag or similar logic
  habits = habits.filter(h => !h.isTemplate);
};