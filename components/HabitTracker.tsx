import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Button } from 'react-native';
import { Target, Plus, Flame, Bell, Clock, CheckCircle, Calendar, TrendingUp, Settings, BellOff, Trash2 } from 'lucide-react-native';
import GlowingButton from './GlowingButton';
import { getUserHabits, createHabit, updateHabit, deleteHabit } from '@/utils/supabaseStorage';
import { useAuth } from '@/hooks/useAuth';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  reminder: string;
  reminderEnabled: boolean;
  category: string;
  createdAt: Date;
}

interface ReminderSettings {
  enabled: boolean;
  time: string;
  days: string[];
  smartTiming: boolean;
}

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('09:00');
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    time: '09:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    smartTiming: true,
  });

  const categories = ['Personal', 'Health', 'Learning', 'Work', 'Relationships'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load habits from database on component mount
  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;
    try {
      const userHabits = await getUserHabits(user.id);
      setHabits(userHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  // Sample habit templates
  const habitTemplates = [
    { name: 'Morning Exercise', category: 'Health', icon: '🏃‍♂️', suggestedTime: '07:00' },
    { name: 'Read 30 Minutes', category: 'Learning', icon: '📚', suggestedTime: '20:00' },
    { name: 'Drink 8 Glasses of Water', category: 'Health', icon: '💧', suggestedTime: '09:00' },
    { name: 'Practice Gratitude', category: 'Personal', icon: '🙏', suggestedTime: '18:00' },
    { name: 'Call a Friend', category: 'Relationships', icon: '📞', suggestedTime: '19:00' },
    { name: 'Learn Something New', category: 'Learning', icon: '🧠', suggestedTime: '15:00' },
  ];

  // Time input handling functions
  const formatTimeInput = (text: string) => {
    // Remove any non-numeric characters except colon
    const cleaned = text.replace(/[^0-9:]/g, '');
    
    // If no colon and length > 2, add colon after 2nd digit
    if (!cleaned.includes(':') && cleaned.length > 2) {
      return cleaned.slice(0, 2) + ':' + cleaned.slice(2);
    }
    
    return cleaned;
  };

  const validateTime = (text: string) => {
    if (!text.includes(':')) return true; // Allow partial input
    
    const [hours, minutes] = text.split(':');
    
    // Validate hours (00-23)
    if (hours && (parseInt(hours) < 0 || parseInt(hours) > 23)) {
      return false;
    }
    
    // Validate minutes (00-59)
    if (minutes && (parseInt(minutes) < 0 || parseInt(minutes) > 59)) {
      return false;
    }
    
    return true;
  };

  const handleTimeChange = (text: string, setter: (value: string) => void) => {
    const formatted = formatTimeInput(text);
    
    // Only update if valid and within length limit
    if (formatted.length <= 5 && validateTime(formatted)) {
      setter(formatted);
    }
  };

  const handleTimeFocus = (setter: (value: string) => void) => {
    setter('');
  };

  const handleCreateHabit = async () => {
    if (!user || !newHabitName.trim()) return;
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      streak: 0,
      completed: false,
      reminder: newHabitTime,
      reminderEnabled: reminderSettings.enabled,
      category: selectedCategory,
      createdAt: new Date(),
    };
    
    try {
      // Add to database
      await createHabit(user.id, newHabit);
      
      // Reload from database to avoid duplicates
      await loadHabits();
      
      setNewHabitName('');
      setNewHabitTime('09:00');
      setShowAddHabit(false);
      
      if (reminderSettings.enabled) {
        scheduleReminder(newHabit);
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    try {
      // Find the habit to toggle
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      
      // Update in database
      await updateHabit(habitId, { completed: !habit.completed });
      
      // Reload from database to ensure consistency
      await loadHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  };

  const createFromTemplate = (template: typeof habitTemplates[0]) => {
    // Pre-fill the form with template data instead of creating habit directly
    setNewHabitName(template.name);
    setNewHabitTime(template.suggestedTime);
    setSelectedCategory(template.category);
    setShowAddHabit(true);
    
    Alert.alert(
      'Template Selected!', 
      `${template.name} has been added to the form. Customize it and tap "Add Habit" to create your habit.`
    );
  };

  const toggleReminder = (habitId: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newEnabled = !habit.reminderEnabled;
        if (newEnabled) {
          scheduleReminder(habit);
        } else {
          cancelReminder(habit);
        }
        return { ...habit, reminderEnabled: newEnabled };
      }
      return habit;
    }));
  };

  const scheduleReminder = (habit: Habit) => {
    // In a real app, this would use expo-notifications
    console.log(`Scheduling reminder for ${habit.name} at ${habit.reminder}`);
    Alert.alert(
      'Reminder Set!',
      `You'll be reminded to "${habit.name}" at ${habit.reminder} daily.`,
      [{ text: 'OK' }]
    );
  };

  const cancelReminder = (habit: Habit) => {
    console.log(`Cancelling reminder for ${habit.name}`);
  };

  const removeHabit = (habit: Habit) => {
    console.log('Delete button pressed for habit:', habit.name);
    
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting habit:', habit.name);
            try {
              // Remove from database
              await deleteHabit(habit.id);
              // Reload from database
              await loadHabits();
              if (habit.reminderEnabled) {
                cancelReminder(habit);
              }
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeletePress = (habit: Habit) => {
    console.log('DELETE BUTTON PRESSED for:', habit.name);
    setHabitToDelete(habit);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (habitToDelete) {
      console.log('Deleting habit:', habitToDelete.name);
      try {
        // Remove from database
        await deleteHabit(habitToDelete.id);
        // Reload from database
        await loadHabits();
        if (habitToDelete.reminderEnabled) {
          cancelReminder(habitToDelete);
        }
      } catch (error) {
        console.error('Error deleting habit:', error);
        Alert.alert('Error', 'Failed to delete habit. Please try again.');
      }
    }
    setShowDeleteConfirm(false);
    setHabitToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setHabitToDelete(null);
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    return '💪';
  };

  const totalStreak = habits.reduce((sum, habit) => sum + habit.streak, 0);
  const completedToday = habits.filter(habit => habit.completed).length;
  const activeReminders = habits.filter(habit => habit.reminderEnabled).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Flame size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{totalStreak}</Text>
          <Text style={styles.statLabel}>Total Streak</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.statNumber}>{completedToday}</Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
        <View style={styles.statCard}>
          <Bell size={24} color="#6366f1" />
          <Text style={styles.statNumber}>{activeReminders}</Text>
          <Text style={styles.statLabel}>Active Reminders</Text>
        </View>
      </View>

      {/* Smart Reminders Settings */}
      <View style={styles.section}>
        {/* Always visible reminder toggle with integrated settings */}
        <View style={styles.reminderToggleContainer}>
          <View style={styles.reminderToggleInfo}>
            <Text style={styles.reminderToggleTitle}>Smart Reminders</Text>
            <Text style={styles.reminderToggleDescription}>
              {reminderSettings.enabled 
                ? `${activeReminders} active reminders. Tap settings to customize.`
                : 'Get gentle nudges at the perfect time. Enable reminders to stay on track.'
              }
            </Text>
          </View>
          <View style={styles.reminderControls}>
            <Switch
              value={reminderSettings.enabled}
              onValueChange={(value) => {
                setReminderSettings(prev => ({ ...prev, enabled: value }));
                if (value) {
                  setHabits(habits.map(habit => ({ ...habit, reminderEnabled: true })));
                } else {
                  setHabits(habits.map(habit => ({ ...habit, reminderEnabled: false })));
                }
              }}
              trackColor={{ false: '#374151', true: '#f59e0b' }}
              thumbColor={reminderSettings.enabled ? '#ffffff' : '#9ca3af'}
            />
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowReminderSettings(!showReminderSettings)}
              testID="habit-tracker-reminder-settings-button"
            >
              <Settings size={20} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </View>

        {showReminderSettings && (
          <View style={styles.reminderSettings}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Default Time</Text>
                <Text style={styles.settingDescription}>
                  When to send daily reminders
                </Text>
              </View>
              <View style={styles.timeInputContainer}>
                <Clock size={16} color="#f59e0b" />
                <TextInput
                  style={styles.timeInput}
                  value={reminderSettings.time}
                  onChangeText={(text) => handleTimeChange(text, (value) => setReminderSettings(prev => ({ ...prev, time: value })))}
                  placeholder="09:00"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  maxLength={5}
                  onFocus={() => handleTimeFocus((value) => setReminderSettings(prev => ({ ...prev, time: value })))}
                  testID="habit-tracker-reminder-time-input"
                />
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Smart Timing</Text>
                <Text style={styles.settingDescription}>
                  Learn your schedule for optimal reminders
                </Text>
              </View>
              <Switch
                value={reminderSettings.smartTiming}
                onValueChange={(value) => setReminderSettings(prev => ({ ...prev, smartTiming: value }))}
                trackColor={{ false: '#374151', true: '#f59e0b' }}
                thumbColor={reminderSettings.smartTiming ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
        )}
      </View>

      {/* Add Habit Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddHabit(true)}
            testID="habit-tracker-add-habit-button"
          >
            <Plus size={20} color="#10b981" />
          </TouchableOpacity>
        </View>

        {showAddHabit && (
          <View style={styles.addHabitForm}>
            <TextInput
              style={styles.input}
              placeholder="Enter habit name..."
              placeholderTextColor="#6b7280"
              value={newHabitName}
              onChangeText={setNewHabitName}
              testID="habit-tracker-habit-name-input"
            />
            <View style={styles.categorySelector}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  testID={`habit-tracker-category-${category.toLowerCase()}`}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.selectedCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>Habit Time:</Text>
              <View style={styles.timeInputContainer}>
                <Clock size={16} color="#f59e0b" />
                <TextInput
                  style={styles.timeInput}
                  value={newHabitTime}
                  onChangeText={(text) => handleTimeChange(text, setNewHabitTime)}
                  placeholder="09:00"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  maxLength={5}
                  onFocus={() => handleTimeFocus(setNewHabitTime)}
                  testID="habit-tracker-habit-time-input"
                />
              </View>
            </View>
            
            <View style={styles.formButtons}>
              <GlowingButton
                title="Cancel"
                onPress={() => setShowAddHabit(false)}
                variant="secondary"
                style={styles.formButton}
                testID="habit-tracker-cancel-button"
              />
              <GlowingButton
                title="Add Habit"
                onPress={handleCreateHabit}
                variant="primary"
                style={styles.formButton}
                testID="habit-tracker-add-habit-submit-button"
              />
            </View>
          </View>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={48} color="#374151" />
            <Text style={styles.emptyTitle}>No Habits Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start building your first habit or choose from our templates below!
            </Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {habits.map(habit => (
              <View key={habit.id} style={styles.habitCardContainer}>
                <TouchableOpacity
                  style={[styles.habitCard, habit.completed && styles.completedHabitCard]}
                  onPress={() => toggleHabit(habit.id)}
                  activeOpacity={0.8}
                  testID={`habit-tracker-toggle-${habit.id}`}
                >
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, habit.completed && styles.completedHabitName]}>
                      {habit.name}
                    </Text>
                    <Text style={styles.habitCategory}>{habit.category}</Text>
                  </View>
                  <View style={styles.habitActions}>
                    <View style={styles.streakContainer}>
                      <Text style={styles.streakEmoji}>{getStreakEmoji(habit.streak)}</Text>
                      <Text style={styles.streakText}>{habit.streak}</Text>
                    </View>
                    <View style={[styles.checkCircle, habit.completed && styles.checkedCircle]}>
                      {habit.completed && <CheckCircle size={20} color="#10b981" />}
                    </View>
                  </View>
                </TouchableOpacity>
                
                {/* Individual Habit Reminder Toggle */}
                <TouchableOpacity
                  style={[styles.habitReminderToggle, habit.reminderEnabled && styles.habitReminderToggleActive]}
                  onPress={() => toggleReminder(habit.id)}
                  testID={`habit-tracker-reminder-toggle-${habit.id}`}
                >
                  {habit.reminderEnabled ? (
                    <Bell size={16} color="#f59e0b" />
                  ) : (
                    <BellOff size={16} color="#9ca3af" />
                  )}
                </TouchableOpacity>

                {/* Delete Habit Button */}
                <Button
                  title="DELETE"
                  onPress={() => handleDeletePress(habit)}
                  color="#ff0000"
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Habit Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Start Templates</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a template to pre-fill the form above. Customize and tap "Add Habit" to create your habit.
        </Text>
        
        <View style={styles.templatesGrid}>
          {habitTemplates.map((template, index) => (
            <TouchableOpacity
              key={index}
              style={styles.templateCard}
              onPress={() => createFromTemplate(template)}
              activeOpacity={0.8}
            >
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateCategory}>{template.category}</Text>
              <Text style={styles.templateTime}>{template.suggestedTime}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && habitToDelete && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Habit</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{habitToDelete.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={cancelDelete}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonDelete}
                onPress={confirmDelete}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statNumber: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  addHabitForm: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    marginBottom: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  selectedCategoryChip: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedCategoryChipText: {
    color: '#ffffff',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  habitsList: {
    gap: 12,
  },
  habitCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  completedHabitCard: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  completedHabitName: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  habitCategory: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#f59e0b',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCircle: {
    borderColor: '#10b981',
    backgroundColor: '#10b98120',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateCategory: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  templateTime: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  reminderInfo: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 12,
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  reminderDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  reminderSettings: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  timeLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    minWidth: 80,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timeInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ff0000',
    borderWidth: 2,
    borderColor: '#ffffff',
    marginLeft: 8,
    minWidth: 50,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  modalMessage: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonDelete: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ff0000',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  reminderToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  reminderToggleInfo: {
    flex: 1,
  },
  reminderToggleTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  reminderToggleDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  reminderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitReminderToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  habitReminderToggleActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  reminderToggleActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
}); 