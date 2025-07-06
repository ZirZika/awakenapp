import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Plus, CircleCheck as CheckCircle2, Circle, CreditCard as Edit3, Trash2, Search, Filter, Calendar, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlowingButton from '@/components/GlowingButton';

interface PersonalTodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export default function TodosScreen() {
  const [todos, setTodos] = useState<PersonalTodo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<PersonalTodo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'today' | 'overdue'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<PersonalTodo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<PersonalTodo | null>(null);

  // Form states
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTodoCategory, setNewTodoCategory] = useState('Personal');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');

  const categories = ['All', 'Personal', 'Work', 'Health', 'Shopping', 'Learning', 'Projects'];
  const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    filterTodos();
  }, [todos, searchQuery, selectedFilter, selectedCategory]);

  const loadTodos = async () => {
    try {
      const savedTodos = await AsyncStorage.getItem('personalTodos');
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
      } else {
        // Initialize with some sample todos
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const sampleTodos: PersonalTodo[] = [
          {
            id: '1',
            title: 'Review project proposal',
            description: 'Go through the Q4 project proposal and provide feedback',
            completed: false,
            priority: 'high',
            category: 'Work',
            dueDate: today.toISOString().split('T')[0], // Today
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Call mom',
            description: 'Weekly check-in call with mom',
            completed: true,
            priority: 'medium',
            category: 'Personal',
            dueDate: today.toISOString().split('T')[0], // Today
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            completedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Plan weekend activities',
            description: 'Research and plan fun activities for the weekend',
            completed: false,
            priority: 'low',
            category: 'Personal',
            dueDate: nextWeek.toISOString().split('T')[0], // Next week
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '4',
            title: 'Buy groceries',
            description: 'Get ingredients for dinner this week',
            completed: false,
            priority: 'medium',
            category: 'Shopping',
            dueDate: tomorrow.toISOString().split('T')[0], // Tomorrow
            createdAt: new Date().toISOString(),
          },
        ];
        setTodos(sampleTodos);
        await AsyncStorage.setItem('personalTodos', JSON.stringify(sampleTodos));
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const saveTodos = async (updatedTodos: PersonalTodo[]) => {
    try {
      await AsyncStorage.setItem('personalTodos', JSON.stringify(updatedTodos));
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isOverdue = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString < today;
  };

  const filterTodos = () => {
    let filtered = todos;

    // Filter by completion status and date
    if (selectedFilter === 'pending') {
      filtered = filtered.filter(todo => !todo.completed);
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(todo => todo.completed);
    } else if (selectedFilter === 'today') {
      filtered = filtered.filter(todo => !todo.completed && todo.dueDate && isToday(todo.dueDate));
    } else if (selectedFilter === 'overdue') {
      filtered = filtered.filter(todo => !todo.completed && todo.dueDate && isOverdue(todo.dueDate));
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(todo => todo.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort by priority and creation date
    filtered.sort((a, b) => {
      // Completed items go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Overdue items go to top (for non-completed)
      if (!a.completed && !b.completed) {
        const aOverdue = a.dueDate && isOverdue(a.dueDate);
        const bOverdue = b.dueDate && isOverdue(b.dueDate);
        if (aOverdue !== bOverdue) {
          return aOverdue ? -1 : 1;
        }
        
        // Today's items go next
        const aToday = a.dueDate && isToday(a.dueDate);
        const bToday = b.dueDate && isToday(b.dueDate);
        if (aToday !== bToday) {
          return aToday ? -1 : 1;
        }
      }
      
      // Sort by priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      // Sort by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      
      // Sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredTodos(filtered);
  };

  const addTodo = async () => {
    if (newTodoTitle.trim()) {
      const newTodo: PersonalTodo = {
        id: Date.now().toString(),
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim() || undefined,
        completed: false,
        priority: newTodoPriority,
        category: newTodoCategory,
        dueDate: newTodoDueDate || undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedTodos = [...todos, newTodo];
      await saveTodos(updatedTodos);
      
      // Reset form
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoPriority('medium');
      setNewTodoCategory('Personal');
      setNewTodoDueDate('');
      setShowAddModal(false);
    }
  };

  const editTodo = async () => {
    if (editingTodo && newTodoTitle.trim()) {
      const updatedTodos = todos.map(todo =>
        todo.id === editingTodo.id
          ? {
              ...todo,
              title: newTodoTitle.trim(),
              description: newTodoDescription.trim() || undefined,
              priority: newTodoPriority,
              category: newTodoCategory,
              dueDate: newTodoDueDate || undefined,
            }
          : todo
      );

      await saveTodos(updatedTodos);
      
      // Reset form
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoPriority('medium');
      setNewTodoCategory('Personal');
      setNewTodoDueDate('');
      setEditingTodo(null);
      setShowEditModal(false);
    }
  };

  const toggleTodo = async (todoId: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === todoId
        ? {
            ...todo,
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date().toISOString() : undefined,
          }
        : todo
    );

    await saveTodos(updatedTodos);
  };

  const startEdit = (todo: PersonalTodo) => {
    setEditingTodo(todo);
    setNewTodoTitle(todo.title);
    setNewTodoDescription(todo.description || '');
    setNewTodoPriority(todo.priority);
    setNewTodoCategory(todo.category);
    setNewTodoDueDate(todo.dueDate || '');
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (todoToDelete) {
      const updatedTodos = todos.filter(todo => todo.id !== todoToDelete.id);
      await saveTodos(updatedTodos);
      setTodoToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
    }
  };

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    if (dateStr < todayStr) return 'Overdue';
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const getDueDateColor = (dateString: string) => {
    if (isOverdue(dateString)) return '#ef4444';
    if (isToday(dateString)) return '#f59e0b';
    return '#9ca3af';
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.filter(todo => !todo.completed).length;
  const todayCount = todos.filter(todo => !todo.completed && todo.dueDate && isToday(todo.dueDate)).length;
  const overdueCount = todos.filter(todo => !todo.completed && todo.dueDate && isOverdue(todo.dueDate)).length;

  // Quick date presets
  const getDatePreset = (preset: 'today' | 'tomorrow' | 'next-week') => {
    const today = new Date();
    switch (preset) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case 'next-week':
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    }
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              testID="todos-back-button"
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>All To-Dos</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            testID="todos-add-button"
          >
            <Plus size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{todayCount}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{overdueCount}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search to-dos..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="todos-search-input"
            />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScrollView}
            contentContainerStyle={styles.filtersContent}
          >
            {/* Status Filters */}
            {(['all', 'pending', 'today', 'overdue', 'completed'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.activeFilterChip
                ]}
                onPress={() => setSelectedFilter(filter)}
                testID={`todos-filter-${filter}`}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.activeFilterChipText
                ]}>
                  {filter === 'today' ? 'Due Today' : 
                   filter === 'overdue' ? 'Overdue' :
                   filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Category Filters */}
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.activeCategoryChip
                ]}
                onPress={() => setSelectedCategory(category)}
                testID={`todos-category-${category.toLowerCase()}`}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.activeCategoryChipText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Todos List */}
        <ScrollView style={styles.todosList} showsVerticalScrollIndicator={false}>
          {filteredTodos.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle2 size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No To-Dos Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedFilter !== 'all' || selectedCategory !== 'All'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first to-do to get started!'
                }
              </Text>
            </View>
          ) : (
            filteredTodos.map(todo => (
              <View key={todo.id} style={styles.todoCard}>
                <TouchableOpacity
                  style={[styles.todoContent, todo.completed && styles.completedTodoContent]}
                  onPress={() => toggleTodo(todo.id)}
                  activeOpacity={0.8}
                  testID={`todos-toggle-${todo.id}`}
                >
                  <View style={styles.todoLeft}>
                    {todo.completed ? (
                      <CheckCircle2 size={24} color="#10b981" />
                    ) : (
                      <Circle size={24} color="#6b7280" />
                    )}
                    <View style={styles.todoInfo}>
                      <Text style={[styles.todoTitle, todo.completed && styles.completedTodoTitle]}>
                        {todo.title}
                      </Text>
                      {todo.description && (
                        <Text style={[styles.todoDescription, todo.completed && styles.completedTodoDescription]}>
                          {todo.description}
                        </Text>
                      )}
                      <View style={styles.todoMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(todo.priority)}20` }]}>
                          <Text style={[styles.priorityText, { color: getPriorityColor(todo.priority) }]}>
                            {getPriorityLabel(todo.priority)}
                          </Text>
                        </View>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{todo.category}</Text>
                        </View>
                        {todo.dueDate && (
                          <View style={styles.dueDateBadge}>
                            <Calendar size={10} color={getDueDateColor(todo.dueDate)} />
                            <Text style={[styles.dueDateText, { color: getDueDateColor(todo.dueDate) }]}>
                              {formatDueDate(todo.dueDate)}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.dateText}>
                          {todo.completed && todo.completedAt 
                            ? `Completed ${formatDate(todo.completedAt)}`
                            : `Created ${formatDate(todo.createdAt)}`
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.todoActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEdit(todo)}
                    testID={`todos-edit-${todo.id}`}
                  >
                    <Edit3 size={16} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setTodoToDelete(todo);
                      setShowDeleteConfirm(true);
                    }}
                    testID={`todos-delete-${todo.id}`}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          
          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Add/Edit Todo Modal */}
        <Modal
          visible={showAddModal || showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingTodo(null);
            setNewTodoTitle('');
            setNewTodoDescription('');
            setNewTodoPriority('medium');
            setNewTodoCategory('Personal');
            setNewTodoDueDate('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showEditModal ? 'Edit To-Do' : 'Add New To-Do'}
                </Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingTodo(null);
                    setNewTodoTitle('');
                    setNewTodoDescription('');
                    setNewTodoPriority('medium');
                    setNewTodoCategory('Personal');
                    setNewTodoDueDate('');
                  }}
                  testID="todos-modal-close-button"
                >
                  <X size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="What do you need to do?"
                    placeholderTextColor="#6b7280"
                    value={newTodoTitle}
                    onChangeText={setNewTodoTitle}
                    autoFocus={true}
                    testID="todos-modal-title-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Add more details..."
                    placeholderTextColor="#6b7280"
                    value={newTodoDescription}
                    onChangeText={setNewTodoDescription}
                    multiline={true}
                    numberOfLines={3}
                    testID="todos-modal-description-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Due Date</Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6b7280"
                      value={newTodoDueDate}
                      onChangeText={setNewTodoDueDate}
                      testID="todos-modal-due-date-input"
                    />
                    <View style={styles.datePresets}>
                      <TouchableOpacity
                        style={styles.datePresetButton}
                        onPress={() => setNewTodoDueDate(getDatePreset('today'))}
                        testID="todos-modal-date-preset-today"
                      >
                        <Text style={styles.datePresetText}>Today</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.datePresetButton}
                        onPress={() => setNewTodoDueDate(getDatePreset('tomorrow'))}
                        testID="todos-modal-date-preset-tomorrow"
                      >
                        <Text style={styles.datePresetText}>Tomorrow</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.datePresetButton}
                        onPress={() => setNewTodoDueDate(getDatePreset('next-week'))}
                        testID="todos-modal-date-preset-next-week"
                      >
                        <Text style={styles.datePresetText}>Next Week</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Priority</Text>
                  <View style={styles.prioritySelector}>
                    {priorities.map(priority => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          newTodoPriority === priority && styles.selectedPriorityOption,
                          { borderColor: getPriorityColor(priority) }
                        ]}
                        onPress={() => setNewTodoPriority(priority)}
                        testID={`todos-modal-priority-${priority}`}
                      >
                        <Text style={[
                          styles.priorityOptionText,
                          newTodoPriority === priority && { color: getPriorityColor(priority) }
                        ]}>
                          {getPriorityLabel(priority)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categorySelector}>
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryOption,
                          newTodoCategory === category && styles.selectedCategoryOption
                        ]}
                        onPress={() => setNewTodoCategory(category)}
                        testID={`todos-modal-category-${category.toLowerCase()}`}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          newTodoCategory === category && styles.selectedCategoryOptionText
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.modalActions}>
                <GlowingButton
                  title="Cancel"
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingTodo(null);
                    setNewTodoTitle('');
                    setNewTodoDescription('');
                    setNewTodoPriority('medium');
                    setNewTodoCategory('Personal');
                    setNewTodoDueDate('');
                  }}
                  variant="secondary"
                  style={styles.modalButton}
                  testID="todos-modal-cancel-button"
                />
                <GlowingButton
                  title={showEditModal ? 'Save Changes' : 'Add To-Do'}
                  onPress={showEditModal ? editTodo : addTodo}
                  variant="primary"
                  style={styles.modalButton}
                  disabled={!newTodoTitle.trim()}
                  testID="todos-modal-save-button"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Delete To-Do</Text>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete "{todoToDelete?.title}"? This action cannot be undone.
              </Text>
              <View style={styles.deleteModalActions}>
                <TouchableOpacity 
                  style={styles.deleteModalButtonCancel}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setTodoToDelete(null);
                  }}
                  testID="todos-delete-modal-cancel-button"
                >
                  <Text style={styles.deleteModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteModalButtonDelete}
                  onPress={confirmDelete}
                  testID="todos-delete-modal-confirm-button"
                >
                  <Text style={styles.deleteModalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statNumber: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersScrollView: {
    marginHorizontal: -20,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  activeFilterChip: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  activeCategoryChip: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  activeCategoryChipText: {
    color: '#ffffff',
  },
  todosList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  todoCard: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  todoContent: {
    flex: 1,
    padding: 16,
  },
  completedTodoContent: {
    opacity: 0.7,
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  todoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  todoTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  completedTodoTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  todoDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 8,
  },
  completedTodoDescription: {
    color: '#9ca3af',
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dueDateText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    fontWeight: '600',
  },
  dateText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#6b7280',
  },
  todoActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#374151',
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
    fontSize: 20,
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  dateInputContainer: {
    gap: 12,
  },
  dateInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  datePresets: {
    flexDirection: 'row',
    gap: 8,
  },
  datePresetButton: {
    flex: 1,
    backgroundColor: '#4b5563',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  datePresetText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 2,
    alignItems: 'center',
  },
  selectedPriorityOption: {
    backgroundColor: 'transparent',
  },
  priorityOptionText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  selectedCategoryOption: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryOptionText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedCategoryOptionText: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  // Delete modal styles
  deleteModalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  deleteModalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButtonCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  deleteModalButtonDelete: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteModalButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});