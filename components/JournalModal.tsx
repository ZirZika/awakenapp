import React, { useState, useRef } from 'react';
import { Modal, View, TouchableOpacity, Text, TextInput, ScrollView, Platform } from 'react-native';
import styles from '../app/(tabs)/JournalStyles';
import { JournalEntry, Goal, CoreValue, PersonalAchievement } from '@/types/app';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

type ModalType = 'journal' | 'goal' | 'achievement' | 'value' | null;

interface JournalModalProps {
  visible: boolean;
  type: ModalType;
  onClose: () => void;
  // Journal Entry
  newJournalEntry: any;
  setNewJournalEntry: (v: any) => void;
  onCreateJournalEntry: () => void;
  // Goal
  newGoal: any;
  setNewGoal: (v: any) => void;
  onCreateGoal: () => void;
  // Value
  newValue: any;
  setNewValue: (v: any) => void;
  onCreateValue: () => void;
  // Achievement
  newAchievement: any;
  setNewAchievement: (v: any) => void;
  onCreateAchievement: () => void;
}

const JournalModal: React.FC<JournalModalProps> = ({
  visible, type, onClose,
  newJournalEntry, setNewJournalEntry, onCreateJournalEntry,
  newGoal, setNewGoal, onCreateGoal,
  newValue, setNewValue, onCreateValue,
  newAchievement, setNewAchievement, onCreateAchievement
}) => {
  const { t } = useTranslation();
  const goalCategories = [
    '🧠 Mind Mastery',
    '⚔️ Body Ascension', 
    '📚 Wisdom Expansion',
    '💰 Business & Wealth',
    '🗺️ World Discovery',
  ];
  const chipScrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const scrollBy = (offset: number) => {
    if (chipScrollRef.current && chipScrollRef.current.scrollTo) {
      const newX = scrollX + offset;
      chipScrollRef.current.scrollTo({ x: newX, animated: true });
      setScrollX(newX);
    }
  };
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>
          {type === 'journal' && (
            <>
              <Text style={styles.modalTitle}>{t('New Journal Entry')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('Title')}
                value={newJournalEntry.title}
                onChangeText={text => setNewJournalEntry({ ...newJournalEntry, title: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Content')}
                value={newJournalEntry.content}
                onChangeText={text => setNewJournalEntry({ ...newJournalEntry, content: text })}
                multiline
              />
              <Text style={styles.modalLabel}>{t('Mood')}</Text>
              {/* Picker component removed as per edit hint */}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Achievements (one per line)')}
                value={Array.isArray(newJournalEntry.achievements) ? newJournalEntry.achievements.join('\n') : newJournalEntry.achievements}
                onChangeText={text => setNewJournalEntry({ ...newJournalEntry, achievements: text.split('\n').filter(a => a.trim()) })}
                multiline
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Challenges (one per line)')}
                value={Array.isArray(newJournalEntry.challenges) ? newJournalEntry.challenges.join('\n') : newJournalEntry.challenges}
                onChangeText={text => setNewJournalEntry({ ...newJournalEntry, challenges: text.split('\n').filter(c => c.trim()) })}
                multiline
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Gratitude (one per line)')}
                value={Array.isArray(newJournalEntry.gratitude) ? newJournalEntry.gratitude.join('\n') : newJournalEntry.gratitude}
                onChangeText={text => setNewJournalEntry({ ...newJournalEntry, gratitude: text.split('\n').filter(g => g.trim()) })}
                multiline
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Tomorrow\'s Goals (one per line)')}
                value={Array.isArray(newJournalEntry.tomorrowGoals) ? newJournalEntry.tomorrowGoals.join('\n') : newJournalEntry.tomorrowGoals}
                onChangeText={text => setNewJournalEntry({ ...newJournalEntry, tomorrowGoals: text.split('\n').filter(t => t.trim()) })}
                multiline
              />
              <TouchableOpacity style={styles.createButton} onPress={onCreateJournalEntry}>
                <Text style={styles.createButtonText}>{t('Create Entry')}</Text>
              </TouchableOpacity>
            </>
          )}
          {type === 'goal' && (
            <>
              <Text style={styles.modalTitle}>{t('New Goal')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('Goal Title')}
                value={newGoal.title}
                onChangeText={text => setNewGoal({ ...newGoal, title: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Goal Description')}
                value={newGoal.description}
                onChangeText={text => setNewGoal({ ...newGoal, description: text })}
                multiline
              />
              <Text style={styles.modalLabel}>{t('Category')}</Text>
              <View style={{ position: 'relative', marginBottom: 10, width: '100%', maxWidth: '100%', alignSelf: 'stretch', height: 48, paddingVertical: 2 }}>
                {/* Left Arrow (web/desktop only) */}
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2, justifyContent: 'center', alignItems: 'center', width: 32, height: 48, backgroundColor: 'rgba(35,38,58,0.7)', borderRadius: 24 }}
                    onPress={() => scrollBy(-100)}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                <ScrollView
                  ref={chipScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 8, alignItems: 'center', height: 44 }}
                  style={{ width: '100%', maxWidth: '100%' }}
                  onScroll={e => setScrollX(e.nativeEvent.contentOffset.x)}
                  scrollEventThrottle={16}
                >
                  {goalCategories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        newGoal.category === category && styles.selectedCategoryChip
                      ]}
                      onPress={() => setNewGoal({ ...newGoal, category: category })}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        newGoal.category === category && styles.selectedCategoryChipText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Right Arrow (web/desktop only) */}
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2, justifyContent: 'center', alignItems: 'center', width: 32, height: 48, backgroundColor: 'rgba(35,38,58,0.7)', borderRadius: 24 }}
                    onPress={() => scrollBy(100)}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                {/* Left gradient fade */}
                <LinearGradient
                  colors={["#23263a", "#23263a00"]}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, height: 48, zIndex: 1 }}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                {/* Right gradient fade */}
                <LinearGradient
                  colors={["#23263a00", "#23263a"]}
                  style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, height: 48, zIndex: 1 }}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              {/* Date Picker for Target Date */}
              <Text style={styles.modalLabel}>{t('Target Date')}</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={{
                    backgroundColor: '#181825',
                    color: '#fff',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                    fontFamily: 'Orbitron-Regular',
                    fontSize: 14,
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                  }}
                  value={newGoal.targetDate || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setNewGoal({ ...newGoal, targetDate: val });
                  }}
                  pattern="\\d{4}-\\d{2}-\\d{2}"
                  min={new Date().toISOString().split('T')[0]}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.input, { justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: newGoal.targetDate ? '#fff' : '#9ca3af', fontFamily: 'Orbitron-Regular', fontSize: 14 }}>
                    {newGoal.targetDate || t('Select date')}
                  </Text>
                </TouchableOpacity>
              )}
              {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={newGoal.targetDate ? new Date(newGoal.targetDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      const dd = String(date.getDate()).padStart(2, '0');
                      setNewGoal({ ...newGoal, targetDate: `${yyyy}-${mm}-${dd}` });
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
              <TouchableOpacity style={styles.createButton} onPress={onCreateGoal}>
                <Text style={styles.createButtonText}>{t('Create Goal')}</Text>
              </TouchableOpacity>
            </>
          )}
          {type === 'value' && (
            <>
              <Text style={styles.modalTitle}>{t('New Core Value')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('Value Title')}
                value={newValue.title}
                onChangeText={text => setNewValue({ ...newValue, title: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Value Description')}
                value={newValue.description}
                onChangeText={text => setNewValue({ ...newValue, description: text })}
                multiline
              />
              <Text style={styles.modalLabel}>{t('Importance')}</Text>
              <View style={{ position: 'relative', marginBottom: 10, width: '100%', maxWidth: '100%', alignSelf: 'stretch', height: 48, paddingVertical: 2 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 8, alignItems: 'center', height: 44, justifyContent: 'center' }}
                  style={{ width: '100%', maxWidth: '100%' }}
                >
                  {[...Array(5)].map((_, i) => {
                    const val = i + 1;
                    return (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.categoryChip,
                          newValue.importance === val && styles.selectedCategoryChip
                        ]}
                        onPress={() => setNewValue({ ...newValue, importance: val })}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          newValue.importance === val && styles.selectedCategoryChipText
                        ]}>
                          {val}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.createButton} onPress={onCreateValue}>
                <Text style={styles.createButtonText}>{t('Create Value')}</Text>
              </TouchableOpacity>
            </>
          )}
          {type === 'achievement' && (
            <>
              <Text style={styles.modalTitle}>{t('New Achievement')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('Achievement Title')}
                value={newAchievement.title}
                onChangeText={text => setNewAchievement({ ...newAchievement, title: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('Achievement Description')}
                value={newAchievement.description}
                onChangeText={text => setNewAchievement({ ...newAchievement, description: text })}
                multiline
              />
              <Text style={styles.modalLabel}>{t('Category')}</Text>
              {/* Picker component removed as per edit hint */}
              <TextInput
                style={styles.input}
                placeholder={t('Date (YYYY-MM-DD)')}
                value={newAchievement.date}
                onChangeText={text => setNewAchievement({ ...newAchievement, date: text })}
              />
              <TouchableOpacity style={styles.createButton} onPress={onCreateAchievement}>
                <Text style={styles.createButtonText}>{t('Create Achievement')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default JournalModal; 