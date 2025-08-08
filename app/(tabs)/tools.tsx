import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wrench, Settings, Target, Brain, Clock, Heart, Mail, TrendingUp, CheckCircle, Timer, BookOpen } from 'lucide-react-native';
import { router } from 'expo-router';
import GlowingButton from '@/components/GlowingButton';
import ToolModal from '@/components/ToolModal';
import HabitTracker from '@/components/HabitTracker';
import Notes from '@/components/Notes';
import PomodoroTimer from '@/components/PomodoroTimer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import HeaderActions from '@/components/HeaderActions';

export default function ToolsScreen() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    {
      id: '1',
      title: 'Habit Tracker',
      description: 'Build powerful daily habits with streak tracking and progress visualization. Turn small actions into life-changing results.',
      icon: <Target size={24} color="#10b981" />,
      category: 'Foundation',
      status: 'Active',
      features: ['Streak tracking', 'Habit chains', 'Progress analytics', 'Reminders'],
      color: '#10b981'
    },
    {
      id: '2',
      title: 'Time Management',
      description: 'Pomodoro timer, task prioritization, and productivity analytics to maximize your focus and get more done.',
      icon: <Clock size={24} color="#6366f1" />,
      category: 'Productivity',
      status: 'Active',
      features: ['Pomodoro timer', 'Task prioritization', 'Focus analytics', 'Time blocking'],
      color: '#6366f1'
    },
    {
      id: '3',
      title: 'Daily Notes',
      description: 'Capture your thoughts, ideas, and daily reflections in a clean, organized format with search and categorization.',
      icon: <BookOpen size={24} color="#f59e0b" />,
      category: 'Productivity',
      status: 'Active',
      features: ['Daily notes', 'Search & filter', 'Categories', 'Rich text'],
      color: '#f59e0b'
    }
  ];

  const categories = ['All', 'Foundation', 'Productivity'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTools = selectedCategory === 'All' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

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

  const handleToolPress = (tool: typeof tools[0]) => {
    setSelectedTool(tool.id);
  };

  const closeModal = () => {
    setSelectedTool(null);
  };

  const getToolContent = (toolId: string) => {
    switch(toolId) {
      case '1':
        return <HabitTracker />;
      case '2':
        return <PomodoroTimer />;
      case '3':
        return <Notes />;
      default:
        return null;
    }
  };

  const getToolModalProps = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return null;
    
    return {
      title: tool.title,
      icon: tool.icon,
    };
  };

  const renderToolCard = (tool: typeof tools[0]) => (
    <TouchableOpacity 
      key={tool.id} 
      style={styles.toolCard}
      onPress={() => handleToolPress(tool)}
      activeOpacity={0.8}
      testID={`goals-tool-card-${tool.id}`}
    >
      <View style={styles.toolHeader}>
        <View style={[styles.toolIconContainer, { backgroundColor: tool.color + '20' }]}>
          {tool.icon}
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolTitle}>{tool.title}</Text>
          <Text style={styles.toolCategory}>{tool.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: tool.status === 'Active' ? '#10b98120' : '#374151' }]}>
          <Text style={[styles.statusText, { color: tool.status === 'Active' ? '#10b981' : '#9ca3af' }]}>
            {tool.status}
          </Text>
        </View>
      </View>
      
      <Text style={styles.toolDescription}>{tool.description}</Text>
      
      <View style={styles.featuresContainer}>
        {tool.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle size={12} color={tool.color} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.toolFooter}>
        <GlowingButton
          title="Open Tool"
          onPress={() => handleToolPress(tool)}
          variant="primary"
          style={styles.toolButton}
          testID={`goals-tool-button-${tool.id}`}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Wrench size={24} color="#6366f1" />
            <Text style={styles.headerTitle}>Tools</Text>
          </View>
          <View style={styles.headerRight}>
            <HeaderActions unreadMessages={unreadMessages} />
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Your Personal Development Arsenal</Text>
            <Text style={styles.introDescription}>
              Three powerful tools designed to accelerate your growth journey. Build habits, master your time, and capture your thoughts for maximum productivity.
            </Text>
          </View>

          {/* Category Filter */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Categories</Text>
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
                    styles.categoryButton,
                    selectedCategory === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  testID={`goals-category-${category.toLowerCase()}`}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.activeCategoryButtonText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tools Grid */}
          <View style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>Available Tools</Text>
            
            {filteredTools.length === 0 ? (
              <View style={styles.emptyState}>
                <Wrench size={64} color="#374151" />
                <Text style={styles.emptyTitle}>No Tools Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try selecting a different category or check back later for new tools!
                </Text>
              </View>
            ) : (
              <View style={styles.toolsGrid}>
                {filteredTools.map(renderToolCard)}
              </View>
            )}
          </View>

          {/* Coming Soon Banner */}
          <View style={styles.comingSoonBanner}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#6366f1']}
              style={styles.bannerGradient}
            >
              <Text style={styles.bannerTitle}>🚀 More Tools Coming Soon!</Text>
              <Text style={styles.bannerDescription}>
                We're constantly building new tools to help you level up. Stay tuned for exciting updates!
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
      {selectedTool && (
        <ToolModal
          visible={!!selectedTool}
          onClose={closeModal}
          title={getToolModalProps(selectedTool)?.title || ''}
          icon={getToolModalProps(selectedTool)?.icon}
        >
          {getToolContent(selectedTool)}
        </ToolModal>
      )}
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
  headerTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inboxButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  inboxBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  inboxBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    marginBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  introTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  introDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 16,
  },
  categoryScrollView: {
    marginHorizontal: -20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  activeCategoryButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  activeCategoryButtonText: {
    color: '#ffffff',
  },
  toolsSection: {
    marginBottom: 32,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  toolCategory: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
  },
  toolDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 16,
  },
  toolFooter: {
    alignItems: 'flex-end',
  },
  toolButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  comingSoonBanner: {
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: 20,
    alignItems: 'center',
  },
  bannerTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 4,
  },
});