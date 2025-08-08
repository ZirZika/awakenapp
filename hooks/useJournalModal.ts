import { useState } from 'react';
import type { ModalType } from '../app/(tabs)/journal';
import { JournalEntry, Goal, CoreValue, PersonalAchievement } from '../types/app';

export function useJournalModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  // Form states
  const [newGoal, setNewGoal] = useState<Pick<Goal, 'title' | 'description' | 'category' | 'targetDate'>>({
    title: '',
    description: '',
    category: '',
    targetDate: '',
  });
  const [newJournalEntry, setNewJournalEntry] = useState<Omit<JournalEntry, 'id' | 'date' | 'createdAt'>>({
    title: '',
    content: '',
    mood: 'neutral',
    achievements: [],
    challenges: [],
    gratitude: [],
    tomorrowGoals: [],
  });
  const [newValue, setNewValue] = useState<Pick<CoreValue, 'title' | 'description' | 'importance'>>({
    title: '',
    description: '',
    importance: 5,
  });
  const [newAchievement, setNewAchievement] = useState<Omit<PersonalAchievement, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    significance: 'minor',
  });

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setNewGoal({ title: '', description: '', category: '', targetDate: '' });
    setNewJournalEntry({ title: '', content: '', mood: 'neutral', achievements: [], challenges: [], gratitude: [], tomorrowGoals: [] });
    setNewValue({ title: '', description: '', importance: 5 });
    setNewAchievement({ title: '', description: '', category: '', date: new Date().toISOString().split('T')[0], significance: 'minor' });
  };

  return {
    modalVisible,
    modalType,
    openModal,
    closeModal,
    newGoal,
    setNewGoal,
    newJournalEntry,
    setNewJournalEntry,
    newValue,
    setNewValue,
    newAchievement,
    setNewAchievement,
  };
} 