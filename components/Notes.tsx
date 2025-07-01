import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { BookOpen, Plus, Search, Tag, Edit3, Trash2, Clock } from 'lucide-react-native';
import GlowingButton from './GlowingButton';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('Personal');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteCategory, setEditNoteCategory] = useState('Personal');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const categories = ['All', 'Personal', 'Work', 'Ideas', 'Reflections', 'Goals'];

  useEffect(() => {
    const sampleNotes: Note[] = [
      {
        id: '1',
        title: 'Morning Reflection',
        content: 'Today I feel energized and ready to tackle my goals. The habit tracker is really helping me stay consistent with my morning routine. I need to focus on completing the most important tasks first.',
        category: 'Reflections',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        tags: ['morning', 'reflection', 'goals']
      },
      {
        id: '2',
        title: 'Project Ideas',
        content: 'I had an idea for a new app feature that could help users track their productivity patterns. It would analyze their most productive hours and suggest optimal work schedules.',
        category: 'Ideas',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
        tags: ['app', 'productivity', 'feature']
      },
      {
        id: '3',
        title: 'Work Meeting Notes',
        content: 'Discussed Q4 goals with the team. Key points: 1) Launch new feature by end of month 2) Increase user engagement by 25% 3) Prepare for investor presentation next week.',
        category: 'Work',
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 259200000),
        tags: ['meeting', 'goals', 'team']
      }
    ];
    setNotes(sampleNotes);
  }, []);

  const addNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        category: newNoteCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };
      setNotes([newNote, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteCategory('Personal');
      setShowAddNote(false);
    }
  };

  const startEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setEditNoteCategory(note.category);
    setShowEditNote(true);
    setSelectedNote(null);
  };

  const editNote = () => {
    if (editingNote && editNoteTitle.trim() && editNoteContent.trim()) {
      const updatedNote: Note = {
        ...editingNote,
        title: editNoteTitle.trim(),
        content: editNoteContent.trim(),
        category: editNoteCategory,
        updatedAt: new Date()
      };
      setNotes(notes.map(note => note.id === editingNote.id ? updatedNote : note));
      setEditingNote(null);
      setEditNoteTitle('');
      setEditNoteContent('');
      setEditNoteCategory('Personal');
      setShowEditNote(false);
    }
  };

  const handleDeletePress = (note: Note) => {
    setNoteToDelete(note);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      setNotes(notes.filter(n => n.id !== noteToDelete.id));
      if (selectedNote?.id === noteToDelete.id) {
        setSelectedNote(null);
      }
    }
    setShowDeleteConfirm(false);
    setNoteToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setNoteToDelete(null);
  };

  const getNotePreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const date = formatDate(note.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(note);
    return groups;
  }, {} as Record<string, Note[]>);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BookOpen size={24} color="#f59e0b" />
          <Text style={styles.headerTitle}>Daily Notes</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddNote(true)}
        >
          <Plus size={20} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categorySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.selectedCategoryChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Note Form */}
      {showAddNote && (
        <View style={styles.addNoteForm}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note title..."
            placeholderTextColor="#6b7280"
            value={newNoteTitle}
            onChangeText={setNewNoteTitle}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Write your note here..."
            placeholderTextColor="#6b7280"
            value={newNoteContent}
            onChangeText={setNewNoteContent}
            multiline
            numberOfLines={6}
          />
          <View style={styles.categorySelector}>
            {categories.filter(cat => cat !== 'All').map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  newNoteCategory === category && styles.selectedCategoryChip
                ]}
                onPress={() => setNewNoteCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  newNoteCategory === category && styles.selectedCategoryChipText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formButtons}>
            <GlowingButton
              title="Cancel"
              onPress={() => {
                setShowAddNote(false);
                setNewNoteTitle('');
                setNewNoteContent('');
                setNewNoteCategory('Personal');
              }}
              variant="secondary"
              style={styles.formButton}
            />
            <GlowingButton
              title="Add Note"
              onPress={addNote}
              variant="primary"
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      {/* Edit Note Form */}
      {showEditNote && editingNote && (
        <View style={styles.addNoteForm}>
          <Text style={styles.formTitle}>Edit Note</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Note title..."
            placeholderTextColor="#6b7280"
            value={editNoteTitle}
            onChangeText={setEditNoteTitle}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Write your note here..."
            placeholderTextColor="#6b7280"
            value={editNoteContent}
            onChangeText={setEditNoteContent}
            multiline
            numberOfLines={6}
          />
          <View style={styles.categorySelector}>
            {categories.filter(cat => cat !== 'All').map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  editNoteCategory === category && styles.selectedCategoryChip
                ]}
                onPress={() => setEditNoteCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  editNoteCategory === category && styles.selectedCategoryChipText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formButtons}>
            <GlowingButton
              title="Cancel"
              onPress={() => {
                setShowEditNote(false);
                setEditingNote(null);
                setEditNoteTitle('');
                setEditNoteContent('');
                setEditNoteCategory('Personal');
              }}
              variant="secondary"
              style={styles.formButton}
            />
            <GlowingButton
              title="Save Changes"
              onPress={editNote}
              variant="primary"
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <BookOpen size={48} color="#374151" />
          <Text style={styles.emptyTitle}>No Notes Yet</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedCategory !== 'All' 
              ? 'No notes match your search criteria.'
              : 'Start capturing your thoughts and ideas!'
            }
          </Text>
        </View>
      ) : (
        <View style={styles.notesList}>
          {Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateNotes.map(note => (
                <View key={note.id} style={styles.noteCardContainer}>
                  <TouchableOpacity
                    style={styles.noteCard}
                    onPress={() => startEditNote(note)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.noteHeader}>
                      <View style={styles.noteInfo}>
                        <Text style={styles.noteTitle}>{note.title}</Text>
                        <View style={styles.noteMeta}>
                          <View style={styles.categoryBadge}>
                            <Tag size={12} color="#f59e0b" />
                            <Text style={styles.categoryText}>{note.category}</Text>
                          </View>
                          <View style={styles.timeInfo}>
                            <Clock size={12} color="#9ca3af" />
                            <Text style={styles.timeText}>{formatDate(note.updatedAt)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.notePreview}>{getNotePreview(note.content)}</Text>
                  </TouchableOpacity>
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startEditNote(note)}
                    >
                      <Edit3 size={16} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeletePress(note)}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedNote.title}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedNote(null)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalMeta}>
              <View style={styles.categoryBadge}>
                <Tag size={12} color="#f59e0b" />
                <Text style={styles.categoryText}>{selectedNote.category}</Text>
              </View>
              <Text style={styles.modalDate}>{formatDate(selectedNote.createdAt)}</Text>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalContentText}>{selectedNote.content}</Text>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && noteToDelete && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Note</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{noteToDelete.title}"? This action cannot be undone.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 12,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryScrollView: {
    marginHorizontal: -20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedCategoryChip: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  categoryChipText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedCategoryChipText: {
    color: '#ffffff',
  },
  addNoteForm: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  titleInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    marginBottom: 12,
  },
  contentInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    marginBottom: 12,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  formTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  notesList: {
    gap: 24,
  },
  dateGroup: {
    gap: 12,
  },
  dateHeader: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#f59e0b',
    marginBottom: 8,
  },
  noteCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  noteCard: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#f59e0b',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  notePreview: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
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
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  closeButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalDate: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  modalBody: {
    padding: 20,
  },
  modalContentText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
  },
  modalMessage: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  modalButtonDelete: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
}); 