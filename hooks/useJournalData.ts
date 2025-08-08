import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  getUserGoals,
  getUserJournalEntries,
  getUserCoreValues,
  getUserPersonalAchievements,
  getUserTasks,
  getUserSystemQuests,
} from '../utils/supabaseStorage';
import { Goal, JournalEntry, CoreValue, PersonalAchievement, Task, SystemQuest } from '../types/app';

const useJournalData = (user: any) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [personalAchievements, setPersonalAchievements] = useState<PersonalAchievement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systemQuests, setSystemQuests] = useState<SystemQuest[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [userGoals, userJournalEntries, userCoreValues, userPersonalAchievements, userTasks, userSystemQuests] = await Promise.all([
        getUserGoals(user.id),
        getUserJournalEntries(user.id),
        getUserCoreValues(user.id),
        getUserPersonalAchievements(user.id),
        getUserTasks(user.id),
        getUserSystemQuests(user.id)
      ]);
      setGoals(userGoals);
      setJournalEntries(userJournalEntries);
      setCoreValues(userCoreValues);
      setPersonalAchievements(userPersonalAchievements);
      setTasks(userTasks);
      setSystemQuests(userSystemQuests);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

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

  return {
    goals,
    setGoals,
    journalEntries,
    setJournalEntries,
    coreValues,
    setCoreValues,
    personalAchievements,
    setPersonalAchievements,
    tasks,
    setTasks,
    systemQuests,
    setSystemQuests,
    unreadMessages,
    loadData,
  };
};

export default useJournalData; 