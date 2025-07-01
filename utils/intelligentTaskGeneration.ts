import { JournalEntry, Goal, Task, CoreValue, PersonalAchievement } from '@/types/app';
import { getDifficultyXP } from './gameLogic';

interface UserContext {
  journalEntries: JournalEntry[];
  goals: Goal[];
  coreValues: CoreValue[];
  personalAchievements: PersonalAchievement[];
  completedTasks: Task[];
}

interface TaskPattern {
  category: string;
  keywords: string[];
  taskTemplates: {
    title: string;
    description: string;
    difficulty: Task['difficulty'];
  }[];
}

// Define task patterns based on common personal development themes
const TASK_PATTERNS: TaskPattern[] = [
  {
    category: 'Health & Fitness',
    keywords: ['health', 'fitness', 'exercise', 'workout', 'gym', 'run', 'diet', 'nutrition', 'sleep', 'energy'],
    taskTemplates: [
      {
        title: 'Morning Energy Ritual',
        description: 'Create and follow a 15-minute morning routine to boost energy levels',
        difficulty: 'Easy'
      },
      {
        title: 'Nutrition Tracking Challenge',
        description: 'Track your meals for 3 days and identify improvement opportunities',
        difficulty: 'Medium'
      },
      {
        title: 'Fitness Milestone Push',
        description: 'Set and achieve a specific fitness goal this week',
        difficulty: 'Hard'
      },
      {
        title: 'Complete Health Transformation',
        description: 'Design and implement a comprehensive 30-day health improvement plan',
        difficulty: 'Epic'
      }
    ]
  },
  {
    category: 'Career & Professional',
    keywords: ['work', 'career', 'job', 'professional', 'skill', 'learning', 'promotion', 'networking', 'leadership'],
    taskTemplates: [
      {
        title: 'Skill Assessment',
        description: 'Identify and list 3 key skills needed for your next career level',
        difficulty: 'Easy'
      },
      {
        title: 'Professional Network Expansion',
        description: 'Connect with 5 new professionals in your field this week',
        difficulty: 'Medium'
      },
      {
        title: 'Leadership Challenge',
        description: 'Take initiative on a challenging project or mentor someone',
        difficulty: 'Hard'
      },
      {
        title: 'Career Breakthrough Quest',
        description: 'Execute a strategic plan to achieve your next major career milestone',
        difficulty: 'Epic'
      }
    ]
  },
  {
    category: 'Personal Growth',
    keywords: ['growth', 'mindset', 'confidence', 'habits', 'discipline', 'focus', 'meditation', 'self-improvement'],
    taskTemplates: [
      {
        title: 'Daily Reflection Practice',
        description: 'Spend 10 minutes each day reflecting on your progress and mindset',
        difficulty: 'Easy'
      },
      {
        title: 'Habit Formation Challenge',
        description: 'Establish one new positive habit and maintain it for 7 days',
        difficulty: 'Medium'
      },
      {
        title: 'Comfort Zone Expansion',
        description: 'Do something that challenges your comfort zone significantly',
        difficulty: 'Hard'
      },
      {
        title: 'Personal Transformation Quest',
        description: 'Undergo a major personal development challenge over 30 days',
        difficulty: 'Epic'
      }
    ]
  },
  {
    category: 'Relationships',
    keywords: ['relationship', 'family', 'friends', 'social', 'communication', 'love', 'connection', 'support'],
    taskTemplates: [
      {
        title: 'Connection Strengthening',
        description: 'Reach out to someone important and have a meaningful conversation',
        difficulty: 'Easy'
      },
      {
        title: 'Relationship Investment',
        description: 'Plan and execute a special gesture for someone you care about',
        difficulty: 'Medium'
      },
      {
        title: 'Difficult Conversation',
        description: 'Address a challenging relationship issue with courage and compassion',
        difficulty: 'Hard'
      },
      {
        title: 'Relationship Mastery Quest',
        description: 'Transform a key relationship through consistent effort and growth',
        difficulty: 'Epic'
      }
    ]
  },
  {
    category: 'Creativity & Learning',
    keywords: ['creative', 'art', 'music', 'writing', 'learning', 'study', 'knowledge', 'skill', 'practice'],
    taskTemplates: [
      {
        title: 'Creative Expression',
        description: 'Spend 30 minutes on a creative activity that brings you joy',
        difficulty: 'Easy'
      },
      {
        title: 'Learning Sprint',
        description: 'Dedicate focused time to learning something new for your goals',
        difficulty: 'Medium'
      },
      {
        title: 'Skill Mastery Challenge',
        description: 'Achieve a significant milestone in a skill you\'re developing',
        difficulty: 'Hard'
      },
      {
        title: 'Creative Mastery Quest',
        description: 'Complete a major creative project that showcases your growth',
        difficulty: 'Epic'
      }
    ]
  }
];

// Analyze user's journal entries to understand their focus areas
function analyzeUserFocus(context: UserContext): string[] {
  const allText = [
    ...context.journalEntries.map(entry => `${entry.title} ${entry.content} ${entry.achievements.join(' ')} ${entry.challenges.join(' ')}`),
    ...context.goals.map(goal => `${goal.title} ${goal.description} ${goal.category}`),
    ...context.coreValues.map(value => `${value.title} ${value.description}`),
    ...context.personalAchievements.map(achievement => `${achievement.title} ${achievement.description} ${achievement.category}`)
  ].join(' ').toLowerCase();

  const focusAreas: { [key: string]: number } = {};
  
  TASK_PATTERNS.forEach(pattern => {
    let score = 0;
    pattern.keywords.forEach(keyword => {
      const matches = (allText.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });
    if (score > 0) {
      focusAreas[pattern.category] = score;
    }
  });

  // Return categories sorted by relevance
  return Object.entries(focusAreas)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category);
}

// Analyze user's recent mood and challenges
function analyzeMoodAndChallenges(context: UserContext): {
  recentMood: string;
  commonChallenges: string[];
  strengths: string[];
} {
  const recentEntries = context.journalEntries.slice(0, 5);
  
  // Analyze mood trends
  const moodCounts = recentEntries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const recentMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

  // Extract common challenges
  const allChallenges = recentEntries.flatMap(entry => entry.challenges);
  const challengeWords = allChallenges.join(' ').toLowerCase().split(/\s+/);
  const challengeCounts = challengeWords.reduce((acc, word) => {
    if (word.length > 3) {
      acc[word] = (acc[word] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const commonChallenges = Object.entries(challengeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  // Extract strengths from achievements
  const allAchievements = [
    ...recentEntries.flatMap(entry => entry.achievements),
    ...context.personalAchievements.slice(0, 10).map(a => a.title)
  ];
  const strengthWords = allAchievements.join(' ').toLowerCase().split(/\s+/);
  const strengthCounts = strengthWords.reduce((acc, word) => {
    if (word.length > 3) {
      acc[word] = (acc[word] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const strengths = Object.entries(strengthCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  return { recentMood, commonChallenges, strengths };
}

// Generate difficulty progression based on user's recent performance
function calculateOptimalDifficulty(context: UserContext): Task['difficulty'] {
  const recentTasks = context.completedTasks.slice(0, 10);
  
  if (recentTasks.length === 0) return 'Easy';
  
  const difficultyScores = {
    'Easy': 1,
    'Medium': 2,
    'Hard': 3,
    'Epic': 4
  };
  
  const avgDifficulty = recentTasks.reduce((sum, task) => 
    sum + difficultyScores[task.difficulty], 0) / recentTasks.length;
  
  const recentMood = analyzeMoodAndChallenges(context).recentMood;
  
  // Adjust difficulty based on mood and performance
  let targetDifficulty = avgDifficulty;
  
  if (recentMood === 'excellent' || recentMood === 'good') {
    targetDifficulty += 0.5; // Push harder when feeling good
  } else if (recentMood === 'challenging' || recentMood === 'difficult') {
    targetDifficulty -= 0.3; // Ease up when struggling
  }
  
  // Map back to difficulty levels
  if (targetDifficulty <= 1.3) return 'Easy';
  if (targetDifficulty <= 2.3) return 'Medium';
  if (targetDifficulty <= 3.3) return 'Hard';
  return 'Epic';
}

// Generate personalized task based on context
function generatePersonalizedTask(
  context: UserContext,
  category: string,
  difficulty: Task['difficulty']
): Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'> {
  const pattern = TASK_PATTERNS.find(p => p.category === category);
  if (!pattern) {
    // Fallback to general task
    return {
      title: 'Personal Growth Challenge',
      description: 'Take on a challenge that aligns with your current goals and pushes you forward',
      difficulty,
      xpReward: getDifficultyXP(difficulty),
      questType: 'goal-based',
      category: 'Personal',
      isUnlocked: true,
    };
  }

  const template = pattern.taskTemplates.find(t => t.difficulty === difficulty) ||
                  pattern.taskTemplates[0];
  
  const analysis = analyzeMoodAndChallenges(context);
  
  // Personalize the task description based on user context
  let personalizedDescription = template.description;
  
  // Add context-specific elements
  if (analysis.commonChallenges.length > 0) {
    personalizedDescription += ` Focus on addressing challenges related to: ${analysis.commonChallenges.join(', ')}.`;
  }
  
  if (analysis.strengths.length > 0) {
    personalizedDescription += ` Leverage your strengths in: ${analysis.strengths.join(', ')}.`;
  }

  return {
    title: template.title,
    description: personalizedDescription,
    difficulty,
    xpReward: getDifficultyXP(difficulty),
    questType: 'goal-based',
    category,
    isUnlocked: true,
  };
}

// Main function to generate intelligent tasks
export function generateIntelligentTasks(context: UserContext, count: number = 3): Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] {
  const focusAreas = analyzeUserFocus(context);
  const optimalDifficulty = calculateOptimalDifficulty(context);
  
  const tasks: Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] = [];
  
  // Generate tasks across different focus areas
  for (let i = 0; i < count; i++) {
    const categoryIndex = i % Math.max(focusAreas.length, 1);
    const category = focusAreas[categoryIndex] || 'Personal Growth';
    
    // Vary difficulty slightly
    let taskDifficulty = optimalDifficulty;
    if (i === 0 && optimalDifficulty !== 'Easy') {
      // Make first task slightly easier
      const difficulties: Task['difficulty'][] = ['Easy', 'Medium', 'Hard', 'Epic'];
      const currentIndex = difficulties.indexOf(optimalDifficulty);
      taskDifficulty = difficulties[Math.max(0, currentIndex - 1)];
    } else if (i === count - 1 && optimalDifficulty !== 'Epic') {
      // Make last task slightly harder
      const difficulties: Task['difficulty'][] = ['Easy', 'Medium', 'Hard', 'Epic'];
      const currentIndex = difficulties.indexOf(optimalDifficulty);
      taskDifficulty = difficulties[Math.min(difficulties.length - 1, currentIndex + 1)];
    }
    
    const task = generatePersonalizedTask(context, category, taskDifficulty);
    tasks.push(task);
  }
  
  return tasks;
}

// Generate tasks specifically for a goal using intelligent analysis
export function generateIntelligentTasksForGoal(
  goal: Goal,
  context: UserContext
): Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] {
  // Analyze the goal to determine relevant category
  const goalText = `${goal.title} ${goal.description} ${goal.category}`.toLowerCase();
  
  let relevantCategory = 'Personal Growth';
  let maxScore = 0;
  
  TASK_PATTERNS.forEach(pattern => {
    let score = 0;
    pattern.keywords.forEach(keyword => {
      if (goalText.includes(keyword)) {
        score += 1;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      relevantCategory = pattern.category;
    }
  });
  
  const optimalDifficulty = calculateOptimalDifficulty(context);
  const difficulties: Task['difficulty'][] = ['Easy', 'Medium', 'Hard', 'Epic'];
  
  // Generate 3-5 tasks with progressive difficulty
  const tasks: Omit<Task, 'id' | 'goalId' | 'createdAt' | 'isCompleted'>[] = [];
  
  for (let i = 0; i < 4; i++) {
    const difficultyIndex = Math.min(difficulties.length - 1, 
      Math.max(0, difficulties.indexOf(optimalDifficulty) - 1 + i));
    const taskDifficulty = difficulties[difficultyIndex];
    
    const task = generatePersonalizedTask(context, relevantCategory, taskDifficulty);
    
    // Customize task title and description for the specific goal
    task.title = `${goal.title}: ${task.title}`;
    task.description = `Working towards "${goal.title}" - ${task.description}`;
    
    tasks.push(task);
  }
  
  return tasks;
}