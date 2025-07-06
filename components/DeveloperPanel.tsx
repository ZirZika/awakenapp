import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Code,
  Zap,
  User,
  Crown,
  Settings,
  RefreshCw,
  Plus,
  Minus,
  Clock,
  Target,
  Award,
  Database,
  Bug,
  Eye,
  EyeOff,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Shield,
  Key,
  Users,
  Activity,
  Calendar,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import GlowingButton from './GlowingButton';

interface DeveloperPanelProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
}

interface ComponentInfo {
  id: string;
  name: string;
  type: string;
  props?: Record<string, any>;
}

export default function DeveloperPanel({ visible, onClose, userProfile }: DeveloperPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showComponentIds, setShowComponentIds] = useState(false);
  const [componentIds, setComponentIds] = useState<ComponentInfo[]>([]);
  const [xpAmount, setXpAmount] = useState('100');
  const [levelAmount, setLevelAmount] = useState('1');
  const [streakAmount, setStreakAmount] = useState('1');
  const [timerMinutes, setTimerMinutes] = useState('25');
  const [debugMode, setDebugMode] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const tabs = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'xp', name: 'XP/Level', icon: Award },
    { id: 'timers', name: 'Timers', icon: Clock },
    { id: 'components', name: 'Components', icon: Code },
    { id: 'data', name: 'Data', icon: Database },
    { id: 'debug', name: 'Debug', icon: Bug },
    { id: 'admin', name: 'Admin', icon: Crown },
  ];

  useEffect(() => {
    if (visible && userProfile?.role === 'developer') {
      // Collect component IDs from the app
      collectComponentIds();
    }
  }, [visible, userProfile]);

  const collectComponentIds = () => {
    // This would be populated by components registering themselves
    const ids: ComponentInfo[] = [
      { id: 'player-card', name: 'Player Card', type: 'component' },
      { id: 'quest-list', name: 'Quest List', type: 'component' },
      { id: 'progress-bar', name: 'Progress Bar', type: 'component' },
      { id: 'timer-display', name: 'Timer Display', type: 'component' },
      { id: 'xp-counter', name: 'XP Counter', type: 'component' },
      { id: 'goal-card', name: 'Goal Card', type: 'component' },
      { id: 'journal-entry', name: 'Journal Entry', type: 'component' },
    ];
    setComponentIds(ids);
  };

  const resetAccountToBeginner = async () => {
    Alert.alert(
      'Reset Account',
      'This will reset your account to beginner status. All progress will be lost. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  level: 1,
                  current_xp: 0,
                  total_xp: 0,
                  tasks_completed: 0,
                  goals_completed: 0,
                  streak: 0,
                  title: 'E-Rank Awakened',
                })
                .eq('id', user?.id);

              if (error) throw error;

              // Clear all user data
              await supabase.from('goals').delete().eq('user_id', user?.id);
              await supabase.from('tasks').delete().eq('user_id', user?.id);
              await supabase.from('journal_entries').delete().eq('user_id', user?.id);
              await supabase.from('core_values').delete().eq('user_id', user?.id);
              await supabase.from('personal_achievements').delete().eq('user_id', user?.id);
              await supabase.from('habits').delete().eq('user_id', user?.id);
              await supabase.from('notes').delete().eq('user_id', user?.id);

              Alert.alert('Success', 'Account reset to beginner status!');
            } catch (error) {
              console.error('Error resetting account:', error);
              Alert.alert('Error', 'Failed to reset account');
            }
          },
        },
      ]
    );
  };

  const addXP = async () => {
    try {
      const xp = parseInt(xpAmount);
      if (isNaN(xp) || xp <= 0) {
        Alert.alert('Invalid XP', 'Please enter a valid positive number');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          current_xp: userProfile.current_xp + xp,
          total_xp: userProfile.total_xp + xp,
        })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', `Added ${xp} XP!`);
    } catch (error) {
      console.error('Error adding XP:', error);
      Alert.alert('Error', 'Failed to add XP');
    }
  };

  const setLevel = async () => {
    try {
      const level = parseInt(levelAmount);
      if (isNaN(level) || level < 1 || level > 100) {
        Alert.alert('Invalid Level', 'Please enter a level between 1 and 100');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ level })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', `Level set to ${level}!`);
    } catch (error) {
      console.error('Error setting level:', error);
      Alert.alert('Error', 'Failed to set level');
    }
  };

  const setStreak = async () => {
    try {
      const streak = parseInt(streakAmount);
      if (isNaN(streak) || streak < 0) {
        Alert.alert('Invalid Streak', 'Please enter a valid positive number');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ streak })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', `Streak set to ${streak}!`);
    } catch (error) {
      console.error('Error setting streak:', error);
      Alert.alert('Error', 'Failed to set streak');
    }
  };

  const resetTimers = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_started: false,
          started_at: null,
          time_remaining: null,
        })
        .eq('user_id', user?.id)
        .eq('has_timer', true);

      if (error) throw error;

      Alert.alert('Success', 'All timers reset!');
    } catch (error) {
      console.error('Error resetting timers:', error);
      Alert.alert('Error', 'Failed to reset timers');
    }
  };

  const setTimerDuration = async () => {
    try {
      const minutes = parseInt(timerMinutes);
      if (isNaN(minutes) || minutes <= 0) {
        Alert.alert('Invalid Duration', 'Please enter a valid positive number');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          timer_duration: minutes * 60, // Convert to seconds
        })
        .eq('user_id', user?.id)
        .eq('has_timer', true);

      if (error) throw error;

      Alert.alert('Success', `Timer duration set to ${minutes} minutes!`);
    } catch (error) {
      console.error('Error setting timer duration:', error);
      Alert.alert('Error', 'Failed to set timer duration');
    }
  };

  const generateTestData = async () => {
    try {
      // Generate test goals
      const testGoals = [
        {
          title: 'Test Goal 1',
          description: 'This is a test goal for development',
          category: 'test',
          user_id: user?.id,
        },
        {
          title: 'Test Goal 2',
          description: 'Another test goal',
          category: 'test',
          user_id: user?.id,
        },
      ];

      const { error: goalsError } = await supabase
        .from('goals')
        .insert(testGoals);

      if (goalsError) throw goalsError;

      // Generate test tasks
      const testTasks = [
        {
          title: 'Test Task 1',
          description: 'This is a test task',
          xp_reward: 50,
          difficulty: 'Easy',
          quest_type: 'system',
          category: 'test',
          user_id: user?.id,
        },
        {
          title: 'Test Task 2',
          description: 'Another test task',
          xp_reward: 100,
          difficulty: 'Medium',
          quest_type: 'system',
          category: 'test',
          user_id: user?.id,
        },
      ];

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(testTasks);

      if (tasksError) throw tasksError;

      Alert.alert('Success', 'Test data generated!');
    } catch (error) {
      console.error('Error generating test data:', error);
      Alert.alert('Error', 'Failed to generate test data');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL your data. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('goals').delete().eq('user_id', user?.id);
              await supabase.from('tasks').delete().eq('user_id', user?.id);
              await supabase.from('journal_entries').delete().eq('user_id', user?.id);
              await supabase.from('core_values').delete().eq('user_id', user?.id);
              await supabase.from('personal_achievements').delete().eq('user_id', user?.id);
              await supabase.from('habits').delete().eq('user_id', user?.id);
              await supabase.from('notes').delete().eq('user_id', user?.id);

              Alert.alert('Success', 'All data cleared!');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const renderAccountTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Account Management</Text>
      
      <GlowingButton
        title="Reset to Beginner"
        onPress={resetAccountToBeginner}
        icon={RotateCcw}
        style={styles.dangerButton}
      />

      <GlowingButton
        title="Generate Test Data"
        onPress={generateTestData}
        icon={Plus}
        style={styles.button}
      />

      <GlowingButton
        title="Clear All Data"
        onPress={clearAllData}
        icon={Trash2}
        style={styles.dangerButton}
      />

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Current Account Info:</Text>
        <Text style={styles.infoText}>Role: {userProfile?.role || 'user'}</Text>
        <Text style={styles.infoText}>Level: {userProfile?.level || 1}</Text>
        <Text style={styles.infoText}>XP: {userProfile?.current_xp || 0}</Text>
        <Text style={styles.infoText}>Streak: {userProfile?.streak || 0}</Text>
        <Text style={styles.infoText}>Tasks Completed: {userProfile?.tasks_completed || 0}</Text>
        <Text style={styles.infoText}>Goals Completed: {userProfile?.goals_completed || 0}</Text>
      </View>
    </View>
  );

  const renderXPTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>XP & Level Management</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Add XP:</Text>
        <TextInput
          style={styles.input}
          value={xpAmount}
          onChangeText={setXpAmount}
          keyboardType="numeric"
          placeholder="100"
        />
        <GlowingButton
          title="Add XP"
          onPress={addXP}
          icon={Plus}
          style={styles.button}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Set Level:</Text>
        <TextInput
          style={styles.input}
          value={levelAmount}
          onChangeText={setLevelAmount}
          keyboardType="numeric"
          placeholder="1"
        />
        <GlowingButton
          title="Set Level"
          onPress={setLevel}
          icon={Target}
          style={styles.button}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Set Streak:</Text>
        <TextInput
          style={styles.input}
          value={streakAmount}
          onChangeText={setStreakAmount}
          keyboardType="numeric"
          placeholder="1"
        />
        <GlowingButton
          title="Set Streak"
          onPress={setStreak}
          icon={TrendingUp}
          style={styles.button}
        />
      </View>
    </View>
  );

  const renderTimersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Timer Management</Text>
      
      <GlowingButton
        title="Reset All Timers"
        onPress={resetTimers}
        icon={RotateCcw}
        style={styles.button}
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Set Timer Duration (minutes):</Text>
        <TextInput
          style={styles.input}
          value={timerMinutes}
          onChangeText={setTimerMinutes}
          keyboardType="numeric"
          placeholder="25"
        />
        <GlowingButton
          title="Set Duration"
          onPress={setTimerDuration}
          icon={Clock}
          style={styles.button}
        />
      </View>
    </View>
  );

  const renderComponentsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Component Debugging</Text>
      
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Show Component IDs</Text>
        <Switch
          value={showComponentIds}
          onValueChange={setShowComponentIds}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showComponentIds ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      <View style={styles.componentList}>
        <Text style={styles.componentTitle}>Registered Components:</Text>
        {componentIds.map((component) => (
          <View key={component.id} style={styles.componentItem}>
            <Text style={styles.componentName}>{component.name}</Text>
            <Text style={styles.componentId}>ID: {component.id}</Text>
            <Text style={styles.componentType}>Type: {component.type}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDataTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Data Management</Text>
      
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Show Sensitive Data</Text>
        <Switch
          value={showSensitiveData}
          onValueChange={setShowSensitiveData}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showSensitiveData ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {showSensitiveData && (
        <View style={styles.sensitiveData}>
          <Text style={styles.dataTitle}>User ID:</Text>
          <Text style={styles.dataValue}>{user?.id}</Text>
          
          <Text style={styles.dataTitle}>Email:</Text>
          <Text style={styles.dataValue}>{user?.email}</Text>
          
          <Text style={styles.dataTitle}>Profile ID:</Text>
          <Text style={styles.dataValue}>{userProfile?.id}</Text>
          
          <Text style={styles.dataTitle}>Role:</Text>
          <Text style={styles.dataValue}>{userProfile?.role}</Text>
        </View>
      )}
    </View>
  );

  const renderDebugTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Debug Tools</Text>
      
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Debug Mode</Text>
        <Switch
          value={debugMode}
          onValueChange={setDebugMode}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={debugMode ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      <GlowingButton
        title="Test Database Connection"
        onPress={async () => {
          try {
            const { data, error } = await supabase.from('profiles').select('id').limit(1);
            if (error) throw error;
            Alert.alert('Success', 'Database connection working!');
          } catch (error) {
            console.error('Database test error:', error);
            Alert.alert('Error', 'Database connection failed');
          }
        }}
        icon={Database}
        style={styles.button}
      />

      <GlowingButton
        title="Clear Console Logs"
        onPress={() => {
          console.clear();
          Alert.alert('Success', 'Console logs cleared!');
        }}
        icon={Trash2}
        style={styles.button}
      />
    </View>
  );

  const renderAdminTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Admin Tools</Text>
      
      {userProfile?.role === 'admin' ? (
        <>
          <GlowingButton
            title="View All Users"
            onPress={() => {
              Alert.alert('Admin Feature', 'View all users functionality would go here');
            }}
            icon={Users}
            style={styles.button}
          />

          <GlowingButton
            title="System Statistics"
            onPress={() => {
              Alert.alert('Admin Feature', 'System statistics would go here');
            }}
            icon={BarChart3}
            style={styles.button}
          />

          <GlowingButton
            title="Database Backup"
            onPress={() => {
              Alert.alert('Admin Feature', 'Database backup functionality would go here');
            }}
            icon={Shield}
            style={styles.button}
          />
        </>
      ) : (
        <Text style={styles.noAccessText}>
          Admin access required. Current role: {userProfile?.role}
        </Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountTab();
      case 'xp':
        return renderXPTab();
      case 'timers':
        return renderTimersTab();
      case 'components':
        return renderComponentsTab();
      case 'data':
        return renderDataTab();
      case 'debug':
        return renderDebugTab();
      case 'admin':
        return renderAdminTab();
      default:
        return renderAccountTab();
    }
  };

  if (!userProfile || !['developer', 'admin'].includes(userProfile.role)) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Code size={24} color="#fff" />
              <Text style={styles.headerTitle}>Developer Panel</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Crown size={16} color="#ffd700" />
            <Text style={styles.roleText}>{userProfile.role.toUpperCase()}</Text>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} color={activeTab === tab.id ? '#fff' : '#888'} />
                  <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderTabContent()}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  closeButton: {
    padding: 5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  roleText: {
    color: '#ffd700',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: '#888',
    marginLeft: 5,
    fontSize: 12,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    marginBottom: 15,
  },
  dangerButton: {
    marginBottom: 15,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 16,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  componentList: {
    marginTop: 20,
  },
  componentTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  componentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  componentName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  componentId: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
  },
  componentType: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  sensitiveData: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  dataTitle: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  dataValue: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  noAccessText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
}); 