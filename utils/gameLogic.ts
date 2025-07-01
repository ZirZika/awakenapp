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
  // This is a simplified task generation system
  // In a real app, you might use AI or more sophisticated logic
  const baseTasks: Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] = [
    {
      title: 'Research and Planning',
      description: `Create a detailed plan for achieving: ${goalTitle}`,
      difficulty: 'Easy' as const,
      xpReward: getDifficultyXP('Easy'),
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    },
    {
      title: 'First Action Step',
      description: `Take the first concrete action towards: ${goalTitle}`,
      difficulty: 'Medium' as const,
      xpReward: getDifficultyXP('Medium'),
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    },
    {
      title: 'Weekly Progress Check',
      description: `Review and assess progress on: ${goalTitle}`,
      difficulty: 'Easy' as const,
      xpReward: getDifficultyXP('Easy'),
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    },
    {
      title: 'Overcome First Challenge',
      description: `Identify and overcome a challenge related to: ${goalTitle}`,
      difficulty: 'Hard' as const,
      xpReward: getDifficultyXP('Hard'),
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    },
    {
      title: 'Master Key Skill',
      description: `Develop a crucial skill needed for: ${goalTitle}`,
      difficulty: 'Epic' as const,
      xpReward: getDifficultyXP('Epic'),
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    },
  ];

  return baseTasks;
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