import React from 'react';
import { Smile, Meh, Frown, Sparkles, BookOpen, Trophy, Target, Heart } from 'lucide-react-native';
import { Goal, Task, JournalEntry, SystemQuest } from '../types/app';
import { generateTasksForGoal } from './gameLogic';
import { createTask, updateSystemQuest, createCompletedQuest, updateUserStats } from './supabaseStorage';

export function getMoodIcon(mood: JournalEntry['mood']): React.ReactNode {
  switch (mood) {
    case 'excellent': return <Smile size={20} color="#10B981" />;
    case 'good': return <Smile size={20} color="#3B82F6" />;
    case 'neutral': return <Meh size={20} color="#6B7280" />;
    case 'challenging': return <Frown size={20} color="#F59E0B" />;
    case 'difficult': return <Frown size={20} color="#EF4444" />;
    default: return <Meh size={20} color="#6B7280" />;
  }
}

export function getSignificanceColor(significance: string): string {
  switch (significance) {
    case 'minor': return '#6B7280';
    case 'major': return '#3B82F6';
    case 'legendary': return '#F59E0B';
    default: return '#6B7280';
  }
}

export function getTabIcon(tab: string, isActive: boolean): React.ReactNode {
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
}

export function getTimeRemaining(task: Task): string | null {
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
}

export async function generateStoryQuestsForExistingGoals(user: any, userGoals: Goal[], userTasks: Task[]) {
  if (!user) return;
  try {
    for (const goal of userGoals) {
      const existingStoryQuests = userTasks.filter(task => 
        task.questType === 'goal-based' && task.goalId === goal.id
      );
      if (existingStoryQuests.length === 0) {
        const storyQuests = generateTasksForGoal(goal.title, goal.description);
        for (const quest of storyQuests) {
          await createTask(user.id, {
            ...quest,
            goalId: goal.id,
            isCompleted: false
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error generating story quests for existing goals:', error);
  }
}

export async function checkDailyJournalCompletion(user: any, userJournalEntries: JournalEntry[], userSystemQuests: SystemQuest[]) {
  if (!user) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntry = userJournalEntries.find(entry => entry.date === today);
    if (todaysEntry) {
      const dailyJournalQuest = userSystemQuests.find(q => 
        q.title === 'Daily Journal Entry' && !q.isCompleted
      );
      if (dailyJournalQuest) {
        await updateSystemQuest(dailyJournalQuest.id, {
          isCompleted: true,
          lastCompleted: new Date().toISOString(),
          nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        await createCompletedQuest(user.id, {
          title: dailyJournalQuest.title,
          description: dailyJournalQuest.description,
          xpReward: dailyJournalQuest.xpReward,
          difficulty: dailyJournalQuest.difficulty,
          category: dailyJournalQuest.category,
          questType: 'system',
          completedAt: new Date().toISOString(),
        });
        const statsUpdate = {
          currentXP: dailyJournalQuest.xpReward,
          tasksCompleted: 1
        };
        await updateUserStats(user.id, statsUpdate);
      }
    }
  } catch (error) {
    console.error('❌ Error checking daily journal completion:', error);
  }
} 