import { Task, UserStats } from '@/types/app';

export const calculateLevel = (totalXP: number): number => {
  return Math.floor(totalXP / 1000) + 1;
};

export const calculateXPToNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  const nextLevelXP = currentLevel * 1000;
  return nextLevelXP - (currentXP % 1000);
};

export const getDifficultyColor = (difficulty: Task['difficulty']): string => {
  switch (difficulty) {
    case 'Easy': return '#10b981';
    case 'Medium': return '#f59e0b';
    case 'Hard': return '#ef4444';
    case 'Epic': return '#8b5cf6';
    default: return '#6b7280';
  }
};

export const getDifficultyXP = (difficulty: Task['difficulty']): number => {
  switch (difficulty) {
    case 'Easy': return 50;
    case 'Medium': return 100;
    case 'Hard': return 200;
    case 'Epic': return 500;
    default: return 50;
  }
};

export const generateTasksForGoal = (goalTitle: string, goalDescription: string): Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] => {
  console.log('🎯 Generating tasks for goal:', goalTitle);
  console.log('📝 Goal description:', goalDescription);
  
  // Analyze goal content to create specific tasks
  const goalLower = goalTitle.toLowerCase();
  const descLower = goalDescription.toLowerCase();
  
  let specificTasks: Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] = [];
  
  // Cooking-related goals
  if (goalLower.includes('cook') || goalLower.includes('recipe') || goalLower.includes('dish') || descLower.includes('cook')) {
    specificTasks = [
      {
        title: 'Cook a New Recipe Today',
        description: `Prepare a new recipe for breakfast, lunch, or dinner. Choose something you've never made before.`,
        difficulty: 'Medium' as const,
        xpReward: getDifficultyXP('Medium'),
        questType: 'goal-based',
        category: 'Cooking',
        isUnlocked: true,
        progressValue: 1, // Each recipe = 1% progress toward 100 dishes
      },
      {
        title: 'Plan Tomorrow\'s New Dish',
        description: `Research and select a new recipe to try tomorrow. Save the recipe and gather ingredients.`,
        difficulty: 'Easy' as const,
        xpReward: getDifficultyXP('Easy'),
        questType: 'goal-based',
        category: 'Cooking',
        isUnlocked: true,
        progressValue: 0.5, // Planning = 0.5% progress
      },
      {
        title: 'Master a Cooking Technique',
        description: `Learn and practice a new cooking technique (sautéing, braising, grilling, etc.) with today's meal.`,
        difficulty: 'Hard' as const,
        xpReward: getDifficultyXP('Hard'),
        questType: 'goal-based',
        category: 'Cooking',
        isUnlocked: true,
        progressValue: 2, // Learning technique = 2% progress
      },
    ];
  }
  // Fitness-related goals
  else if (goalLower.includes('workout') || goalLower.includes('exercise') || goalLower.includes('fitness') || goalLower.includes('gym') || goalLower.includes('running')) {
    specificTasks = [
      {
        title: 'Complete Today\'s Workout',
        description: `Execute a focused workout session to progress toward your fitness goal: ${goalTitle}`,
        difficulty: 'Medium' as const,
        xpReward: getDifficultyXP('Medium'),
        questType: 'goal-based',
        category: 'Fitness',
        isUnlocked: true,
        progressValue: 1, // Each workout = 1% progress
      },
      {
        title: 'Plan Tomorrow\'s Training',
        description: `Design your next workout session with specific exercises and intensity levels.`,
        difficulty: 'Easy' as const,
        xpReward: getDifficultyXP('Easy'),
        questType: 'goal-based',
        category: 'Fitness',
        isUnlocked: true,
        progressValue: 0.5, // Planning = 0.5% progress
      },
      {
        title: 'Push Your Performance',
        description: `Complete a challenging workout that tests your current limits and builds strength.`,
        difficulty: 'Hard' as const,
        xpReward: getDifficultyXP('Hard'),
        questType: 'goal-based',
        category: 'Fitness',
        isUnlocked: true,
        progressValue: 2, // Intense workout = 2% progress
      },
    ];
  }
  // Learning/Study goals
  else if (goalLower.includes('learn') || goalLower.includes('study') || goalLower.includes('read') || goalLower.includes('course')) {
    specificTasks = [
      {
        title: 'Complete Today\'s Study Session',
        description: `Dedicate focused time to learning and make progress on: ${goalTitle}`,
        difficulty: 'Medium' as const,
        xpReward: getDifficultyXP('Medium'),
        questType: 'goal-based',
        category: 'Learning',
        isUnlocked: true,
        progressValue: 1, // Each study session = 1% progress
      },
      {
        title: 'Plan Tomorrow\'s Learning',
        description: `Organize your study materials and set specific learning objectives for tomorrow.`,
        difficulty: 'Easy' as const,
        xpReward: getDifficultyXP('Easy'),
        questType: 'goal-based',
        category: 'Learning',
        isUnlocked: true,
        progressValue: 0.5, // Planning = 0.5% progress
      },
      {
        title: 'Apply Your Knowledge',
        description: `Put what you've learned into practice with a real-world application or project.`,
        difficulty: 'Hard' as const,
        xpReward: getDifficultyXP('Hard'),
        questType: 'goal-based',
        category: 'Learning',
        isUnlocked: true,
        progressValue: 2, // Application = 2% progress
      },
    ];
  }
  // Default tasks for other goals
  else {
    specificTasks = [
      {
        title: 'Take Action Today',
        description: `Complete a concrete action step toward: ${goalTitle}`,
        difficulty: 'Medium' as const,
        xpReward: getDifficultyXP('Medium'),
        questType: 'goal-based',
        category: 'Personal',
        isUnlocked: true,
        progressValue: 1, // Each action = 1% progress
      },
      {
        title: 'Plan Tomorrow\'s Progress',
        description: `Create a specific plan for what you'll do tomorrow to advance: ${goalTitle}`,
        difficulty: 'Easy' as const,
        xpReward: getDifficultyXP('Easy'),
        questType: 'goal-based',
        category: 'Personal',
        isUnlocked: true,
        progressValue: 0.5, // Planning = 0.5% progress
      },
      {
        title: 'Overcome a Challenge',
        description: `Identify and overcome a specific obstacle related to: ${goalTitle}`,
        difficulty: 'Hard' as const,
        xpReward: getDifficultyXP('Hard'),
        questType: 'goal-based',
        category: 'Personal',
        isUnlocked: true,
        progressValue: 2, // Overcoming challenge = 2% progress
      },
    ];
  }
  
  console.log('✅ Generated', specificTasks.length, 'specific tasks for goal');
  return specificTasks;
};

export const getUserTitle = (level: number): string => {
  if (level >= 50) return 'Shadow Monarch';
  if (level >= 40) return 'S-Rank Hunter';
  if (level >= 30) return 'A-Rank Hunter';
  if (level >= 20) return 'B-Rank Hunter';
  if (level >= 10) return 'C-Rank Hunter';
  if (level >= 5) return 'D-Rank Hunter';
  return 'E-Rank Hunter';
};