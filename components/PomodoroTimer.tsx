import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Clock, Play, Pause, RotateCcw, Settings, Target, Timer, Coffee, CheckCircle, TrendingUp, Zap, Brain, Crown } from 'lucide-react-native';
import GlowingButton from './GlowingButton';

interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // every X pomodoros
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

interface PomodoroMode {
  id: string;
  name: string;
  workDuration: number;
  breakDuration: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  bestFor: string;
  isCustom?: boolean;
}

interface Session {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak' | 'custom';
  duration: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'work' | 'shortBreak' | 'longBreak' | 'custom'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [customTimerActive, setCustomTimerActive] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const settingsRef = useRef<View>(null);
  
  const pomodoroModes: PomodoroMode[] = [
    {
      id: 'classic',
      name: 'Classic Pomodoro',
      workDuration: 25,
      breakDuration: 5,
      description: 'The original Pomodoro technique',
      icon: <Target size={24} color="#ef4444" />,
      color: '#ef4444',
      bestFor: 'General tasks, starting out'
    },
    {
      id: '52-17',
      name: '52/17 Method',
      workDuration: 52,
      breakDuration: 17,
      description: 'Extended focus with longer breaks',
      icon: <Brain size={24} color="#10b981" />,
      color: '#10b981',
      bestFor: 'Deep work, creative tasks'
    },
    {
      id: '90-20',
      name: '90/20 Method',
      workDuration: 90,
      breakDuration: 20,
      description: 'Ultra-deep focus sessions',
      icon: <Crown size={24} color="#6366f1" />,
      color: '#6366f1',
      bestFor: 'Strategic, high-focus sprints'
    },
    {
      id: 'custom',
      name: 'Custom Timer',
      workDuration: 0,
      breakDuration: 0,
      description: 'Set your own work and break durations',
      icon: <Settings size={24} color="#f59e0b" />,
      color: '#f59e0b',
      bestFor: 'Personalized timing needs',
      isCustom: true
    }
  ];

  const currentMode = pomodoroModes.find(mode => mode.id === selectedMode) || pomodoroModes[0];
  
  // Helper function to format time for input (MM:SS)
  const formatTimeForInput = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to parse time input to seconds
  const parseTimeInput = (input: string) => {
    const parts = input.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  // Helper function to handle time input changes
  const handleTimeInputChange = (input: string, setInput: (value: string) => void, setSetting: (value: number) => void) => {
    let formatted = input.replace(/[^0-9]/g, '');
    
    if (formatted.length > 4) {
      formatted = formatted.substring(0, 4);
    }
    
    if (formatted.length >= 2) {
      const minutes = formatted.substring(0, 2);
      const seconds = formatted.substring(2);
      formatted = `${minutes}:${seconds}`;
    }
    
    setInput(formatted);
    
    if (formatted.length === 5 && formatted.includes(':')) {
      const totalSeconds = parseTimeInput(formatted);
      setSetting(totalSeconds);
    }
  };

  // Helper function to handle time input focus
  const handleTimeInputFocus = (setInput: (value: string) => void) => {
    setInput('');
  };

  // Helper function to handle time input blur
  const handleTimeInputBlur = (input: string, setInput: (value: string) => void, defaultValue: number) => {
    if (!input || input === ':') {
      setInput(formatTimeForInput(defaultValue));
    }
  };
  
  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: currentMode.workDuration,
    shortBreakDuration: currentMode.breakDuration,
    longBreakDuration: currentMode.breakDuration * 2,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
  });

  // Time input states for settings
  const [workTimeInput, setWorkTimeInput] = useState(formatTimeForInput(currentMode.workDuration * 60));
  const [shortBreakTimeInput, setShortBreakTimeInput] = useState(formatTimeForInput(currentMode.breakDuration * 60));
  const [longBreakTimeInput, setLongBreakTimeInput] = useState(formatTimeForInput(currentMode.breakDuration * 2 * 60));
  const [longBreakIntervalInput, setLongBreakIntervalInput] = useState(settings.longBreakInterval.toString());

  // Update settings when mode changes
  useEffect(() => {
    const mode = pomodoroModes.find(m => m.id === selectedMode);
    if (mode) {
      setSettings(prev => ({
        ...prev,
        workDuration: mode.workDuration,
        shortBreakDuration: mode.breakDuration,
        longBreakDuration: mode.breakDuration * 2,
      }));
      setTimeLeft(mode.workDuration * 60);
      setCurrentPhase('work');
      setIsRunning(false);
      setCurrentSession(null);
      
      // Update time input states
      setWorkTimeInput(formatTimeForInput(mode.workDuration * 60));
      setShortBreakTimeInput(formatTimeForInput(mode.breakDuration * 60));
      setLongBreakTimeInput(formatTimeForInput(mode.breakDuration * 2 * 60));
      setLongBreakIntervalInput(settings.longBreakInterval.toString());
    }
  }, [selectedMode]);

  // Initialize timer with current settings
  useEffect(() => {
    setTimeLeft(settings.workDuration * 60);
  }, [settings.workDuration]);

  // Timer countdown logic - Ultra simple approach
  useEffect(() => {
    if (!isRunning) return;
    
    console.log('Timer started, timeLeft:', timeLeft);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        console.log('Timer tick, prev:', prev);
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]); // Only depend on isRunning

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Mark current session as completed
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        completed: true,
        endTime: new Date()
      };
      setSessions(prev => [...prev, updatedSession]);
    }

    if (currentPhase === 'work') {
      setPomodoroCount(prev => prev + 1);
      
      // Determine next phase
      const shouldTakeLongBreak = (pomodoroCount + 1) % settings.longBreakInterval === 0;
      const nextPhase = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
      
      Alert.alert(
        'Pomodoro Complete! 🎉',
        `Great work! Time for a ${nextPhase === 'longBreak' ? 'long' : 'short'} break.`,
        [
          { text: 'Skip Break', onPress: () => startWorkPhase() },
          { 
            text: 'Take Break', 
            onPress: () => {
              setCurrentPhase(nextPhase);
              setTimeLeft((nextPhase === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration) * 60);
              if (settings.autoStartBreaks) {
                startTimer();
              }
            }
          }
        ]
      );
    } else if (currentPhase === 'custom') {
      // Custom timer completed
      Alert.alert(
        'Custom Timer Complete! 🎉',
        'Your custom timer has finished!',
        [
          { text: 'Done', onPress: () => {
            setCustomTimerActive(false);
            setCurrentPhase('work');
            setTimeLeft(settings.workDuration * 60);
          }},
          { 
            text: 'Start New Custom Timer', 
            onPress: () => {
              setShowSettings(true);
              setCustomTimerActive(false);
            }
          }
        ]
      );
    } else {
      // Break completed
      Alert.alert(
        'Break Complete! ☕',
        'Ready to get back to work?',
        [
          { text: 'Not Yet', onPress: () => {} },
          { 
            text: 'Start Working', 
            onPress: () => {
              startWorkPhase();
              if (settings.autoStartPomodoros) {
                startTimer();
              }
            }
          }
        ]
      );
    }
  };

  const startWorkPhase = () => {
    setCurrentPhase('work');
    setTimeLeft(settings.workDuration * 60);
    const newSession: Session = {
      id: Date.now().toString(),
      type: 'work',
      duration: settings.workDuration * 60,
      completed: false,
      startTime: new Date()
    };
    setCurrentSession(newSession);
  };

  const startTimer = () => {
    if (!currentSession && currentPhase === 'work') {
      startWorkPhase();
    } else if (!currentSession && currentPhase === 'custom') {
      // For custom timer, create session if none exists
      const customDuration = parseTimeInput(workTimeInput);
      const newSession: Session = {
        id: Date.now().toString(),
        type: 'custom',
        duration: customDuration,
        completed: false,
        startTime: new Date(),
      };
      setCurrentSession(newSession);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    console.log('RESET BUTTON PRESSED!');
    
    try {
      console.log('Current phase:', currentPhase);
      console.log('Current timeLeft:', timeLeft);
      console.log('Settings:', settings);
      
      // Stop the timer first
      setIsRunning(false);
      console.log('Timer stopped');
      
      // Calculate the new time based on current phase
      let newTime: number;
      
      if (currentPhase === 'custom') {
        console.log('Custom phase detected');
        newTime = parseTimeInput(workTimeInput);
        console.log('Custom time input:', workTimeInput);
        console.log('Parsed custom time:', newTime);
      } else if (currentPhase === 'work') {
        console.log('Work phase detected');
        newTime = settings.workDuration * 60;
        console.log('Work duration from settings:', settings.workDuration);
      } else if (currentPhase === 'longBreak') {
        console.log('Long break phase detected');
        newTime = settings.longBreakDuration * 60;
        console.log('Long break duration from settings:', settings.longBreakDuration);
      } else {
        console.log('Short break phase detected');
        newTime = settings.shortBreakDuration * 60;
        console.log('Short break duration from settings:', settings.shortBreakDuration);
      }
      
      console.log('New time calculated:', newTime);
      console.log('Setting timeLeft to:', newTime);
      
      // Reset the timer
      setTimeLeft(newTime);
      
      console.log('Reset complete!');
    } catch (error) {
      console.error('Error in resetTimer:', error);
    }
  };

  const startCustomTimer = () => {
    const customDuration = parseTimeInput(workTimeInput);
    if (customDuration > 0) {
      setSelectedMode('custom');
      setCustomTimerActive(true);
      setCurrentPhase('custom');
      setTimeLeft(customDuration);
      setIsRunning(false);
      setCurrentSession(null);
      setShowSettings(false);
      
      Alert.alert(
        'Custom Timer Started!',
        `Your ${formatTime(customDuration)} custom timer is ready. Tap Start to begin!`
      );
    } else {
      Alert.alert('Invalid Duration', 'Please enter a valid time duration (e.g., 25:00).');
    }
  };

  const handleCustomModeSelection = () => {
    setSelectedMode('custom');
    setShowModeSelection(false);
    setShowSettings(true);
    setCustomTimerActive(false);
  };

  const skipToBreak = () => {
    if (currentPhase === 'work') {
      // Stop the timer first
      setIsRunning(false);
      
      const shouldTakeLongBreak = (pomodoroCount + 1) % settings.longBreakInterval === 0;
      const nextPhase = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
      setCurrentPhase(nextPhase);
      setTimeLeft((nextPhase === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration) * 60);
      setCurrentSession(null);
    }
  };

  const skipToWork = () => {
    if (currentPhase !== 'work') {
      // Stop the timer first
      setIsRunning(false);
      
      setCurrentPhase('work');
      setTimeLeft(settings.workDuration * 60);
      setCurrentSession(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'work': return currentMode.color;
      case 'shortBreak': return '#10b981';
      case 'longBreak': return '#6366f1';
      case 'custom': return '#f59e0b';
      default: return currentMode.color;
    }
  };

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'work': return currentMode.icon;
      case 'shortBreak': return <Coffee size={24} color="#10b981" />;
      case 'longBreak': return <Timer size={24} color="#6366f1" />;
      case 'custom': return <Settings size={24} color="#f59e0b" />;
      default: return currentMode.icon;
    }
  };

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      case 'custom': return 'Custom Timer';
      default: return 'Focus Time';
    }
  };

  const getProgressPercentage = () => {
    const totalTime = currentPhase === 'work' ? settings.workDuration * 60 :
                     currentPhase === 'longBreak' ? settings.longBreakDuration * 60 :
                     currentPhase === 'custom' ? parseTimeInput(workTimeInput) :
                     settings.shortBreakDuration * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const todaySessions = sessions.filter(session => {
    const today = new Date();
    const sessionDate = new Date(session.startTime);
    return sessionDate.toDateString() === today.toDateString();
  });

  const completedToday = todaySessions.filter(s => s.completed).length;
  const totalFocusTime = todaySessions
    .filter(s => s.type === 'work' && s.completed)
    .reduce((total, session) => total + session.duration, 0);

  const renderModeSelection = () => (
    <View style={styles.modeSelectionContainer}>
      <Text style={styles.modeSelectionTitle}>Choose Your Focus Mode</Text>
      <Text style={styles.modeSelectionSubtitle}>Select the timing that works best for your current task</Text>
      
      <View style={styles.modesContainer}>
        {pomodoroModes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeCard,
              selectedMode === mode.id && { borderColor: mode.color, backgroundColor: `${mode.color}10` }
            ]}
            onPress={() => {
              if (mode.isCustom) {
                handleCustomModeSelection();
              } else {
                setSelectedMode(mode.id);
                setShowModeSelection(false);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.modeHeader}>
              <View style={[styles.modeIconContainer, { backgroundColor: `${mode.color}20` }]}>
                {mode.icon}
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeTiming}>
                  {mode.isCustom ? 'Set your own duration' : `${mode.workDuration}min / ${mode.breakDuration}min`}
                </Text>
              </View>
              {selectedMode === mode.id && (
                <View style={[styles.selectedBadge, { backgroundColor: mode.color }]}>
                  <CheckCircle size={16} color="#ffffff" />
                </View>
              )}
            </View>
            
            <Text style={styles.modeDescription}>{mode.description}</Text>
            
            <View style={styles.bestForContainer}>
              <Text style={styles.bestForLabel}>Best for:</Text>
              <Text style={[styles.bestForText, { color: mode.color }]}>{mode.bestFor}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Helper function to scroll to settings
  const scrollToSettings = () => {
    // Set custom mode and show settings
    setSelectedMode('custom');
    setCustomTimerActive(false);
    setShowSettings(true);
    setTimeout(() => {
      settingsRef.current?.measureLayout(
        scrollViewRef.current?.getInnerViewNode() || {},
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => {}
      );
    }, 100);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} ref={scrollViewRef}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={24} color="#6366f1" />
          <Text style={styles.headerTitle}>Pomodoro Timer</Text>
        </View>
        <TouchableOpacity 
          style={styles.customTimerButton}
          onPress={scrollToSettings}
          activeOpacity={0.8}
        >
          <Settings size={16} color="#6366f1" />
          <Text style={styles.customTimerText}>Custom Timer</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Selection */}
      {showModeSelection && renderModeSelection()}

      {/* Current Mode Display */}
      <View style={styles.currentModeContainer}>
        <View style={styles.currentModeHeader}>
          {currentMode.icon}
          <Text style={styles.currentModeName}>{currentMode.name}</Text>
        </View>
        <Text style={styles.currentModeTiming}>
          {selectedMode === 'custom' && customTimerActive 
            ? `${formatTime(parseTimeInput(workTimeInput))} custom timer`
            : `${currentMode.workDuration}min work / ${currentMode.breakDuration}min break`
          }
        </Text>
        
        {/* Change Mode Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.changeModeButton,
              showModeSelection && { backgroundColor: '#6366f140', borderColor: '#6366f1' }
            ]}
            onPress={() => setShowModeSelection(!showModeSelection)}
            activeOpacity={0.8}
          >
            <Zap size={16} color="#6366f1" />
            <Text style={styles.changeModeText}>
              {showModeSelection ? 'Cancel' : 'Change Focus Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.statNumber}>{completedToday}</Text>
          <Text style={styles.statLabel}>Today's Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{Math.floor(totalFocusTime / 60)}</Text>
          <Text style={styles.statLabel}>Focus Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <Target size={24} color="#ef4444" />
          <Text style={styles.statNumber}>{pomodoroCount}</Text>
          <Text style={styles.statLabel}>Total Pomodoros</Text>
        </View>
      </View>

      {/* Timer Display */}
      <View style={styles.timerSection}>
        <View style={styles.phaseIndicator}>
          {getPhaseIcon()}
          <Text style={styles.phaseTitle}>{getPhaseTitle()}</Text>
        </View>
        
        <View style={styles.timerDisplay}>
          <Text style={[styles.timerText, { color: getPhaseColor() }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getPhaseColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage())}% Complete
          </Text>
        </View>

        {/* Timer Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.mainControls}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.controlButton, styles.playButton, { backgroundColor: getPhaseColor() }]}
                onPress={startTimer}
              >
                <Play size={24} color="#ffffff" />
                <Text style={styles.controlButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={pauseTimer}
              >
                <Pause size={24} color="#ffffff" />
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={() => {
                console.log('RESET BUTTON CLICKED!');
                resetTimer();
              }}
            >
              <RotateCcw size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.skipControls}>
            {currentPhase === 'work' && (
              <GlowingButton
                title="Skip to Break"
                onPress={skipToBreak}
                variant="secondary"
                style={styles.skipButton}
              />
            )}
            {currentPhase !== 'work' && (
              <GlowingButton
                title="Skip to Work"
                onPress={skipToWork}
                variant="primary"
                style={styles.skipButton}
              />
            )}
          </View>
        </View>
      </View>

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel} ref={settingsRef}>
          <Text style={styles.settingsTitle}>Timer Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Work Duration (MM:SS)</Text>
            <TextInput
              style={styles.settingInput}
              value={workTimeInput}
              onChangeText={(text) => handleTimeInputChange(text, setWorkTimeInput, (value) => setSettings(prev => ({ ...prev, workDuration: value / 60 })))}
              onFocus={() => handleTimeInputFocus(setWorkTimeInput)}
              onBlur={(e) => handleTimeInputBlur(e.nativeEvent.text, setWorkTimeInput, currentMode.workDuration * 60)}
              keyboardType="numeric"
              placeholder={formatTimeForInput(currentMode.workDuration * 60)}
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Short Break (MM:SS)</Text>
            <TextInput
              style={styles.settingInput}
              value={shortBreakTimeInput}
              onChangeText={(text) => handleTimeInputChange(text, setShortBreakTimeInput, (value) => setSettings(prev => ({ ...prev, shortBreakDuration: value / 60 })))}
              onFocus={() => handleTimeInputFocus(setShortBreakTimeInput)}
              onBlur={(e) => handleTimeInputBlur(e.nativeEvent.text, setShortBreakTimeInput, currentMode.breakDuration * 60)}
              keyboardType="numeric"
              placeholder={formatTimeForInput(currentMode.breakDuration * 60)}
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Long Break (MM:SS)</Text>
            <TextInput
              style={styles.settingInput}
              value={longBreakTimeInput}
              onChangeText={(text) => handleTimeInputChange(text, setLongBreakTimeInput, (value) => setSettings(prev => ({ ...prev, longBreakDuration: value / 60 })))}
              onFocus={() => handleTimeInputFocus(setLongBreakTimeInput)}
              onBlur={(e) => handleTimeInputBlur(e.nativeEvent.text, setLongBreakTimeInput, currentMode.breakDuration * 2 * 60)}
              keyboardType="numeric"
              placeholder={formatTimeForInput(currentMode.breakDuration * 2 * 60)}
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Long Break Interval (Pomodoros)</Text>
            <TextInput
              style={styles.settingInput}
              value={longBreakIntervalInput}
              onChangeText={(text) => {
                const value = parseInt(text) || 4;
                // Ensure the value is between 1 and 10
                const clampedValue = Math.max(1, Math.min(10, value));
                setSettings(prev => ({ ...prev, longBreakInterval: clampedValue }));
                setLongBreakIntervalInput(clampedValue.toString());
              }}
              onFocus={() => setLongBreakIntervalInput('')}
              onBlur={(e) => {
                if (!e.nativeEvent.text || e.nativeEvent.text === '') {
                  setLongBreakIntervalInput(settings.longBreakInterval.toString());
                }
              }}
              keyboardType="numeric"
              placeholder="4"
              placeholderTextColor="#6b7280"
              maxLength={2}
            />
          </View>

          {/* Custom Timer Start Button */}
          {selectedMode === 'custom' && (
            <View style={styles.customTimerSection}>
              <Text style={styles.customTimerLabel}>Custom Timer</Text>
              <Text style={styles.customTimerDescription}>
                Set your work duration above and start your custom timer
              </Text>
              <GlowingButton
                title="Start Custom Timer"
                onPress={startCustomTimer}
                variant="primary"
                style={styles.startCustomTimerButton}
              />
            </View>
          )}
        </View>
      )}

      {/* Quick Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Productivity Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • Use the 25-minute work sessions to maintain focus
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • Take short breaks to prevent mental fatigue
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • Long breaks help you recharge for the next session
          </Text>
        </View>
      </View>
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
  customTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6366f120',
    borderWidth: 1,
    borderColor: '#6366f1',
    gap: 6,
  },
  customTimerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6366f1',
  },
  modeSelectionContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modeSelectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 8,
  },
  modeSelectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  modesContainer: {
    gap: 16,
  },
  modeCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  modeTiming: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 12,
  },
  bestForContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestForLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  bestForText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  currentModeContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  currentModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentModeName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 12,
  },
  currentModeTiming: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 36,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  changeModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6366f120',
    borderWidth: 1,
    borderColor: '#6366f1',
    gap: 6,
  },
  changeModeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6366f1',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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
    fontSize: 20,
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  timerSection: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  phaseTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 48,
    color: '#ef4444',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  controlsContainer: {
    gap: 16,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  playButton: {
    backgroundColor: '#ef4444',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
  },
  controlButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#ffffff',
  },
  skipControls: {
    alignItems: 'center',
  },
  skipButton: {
    minWidth: 120,
  },
  settingsPanel: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  settingsTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },
  settingInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#ffffff',
    width: 100,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  tipsSection: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tipsTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  customTimerSection: {
    marginBottom: 20,
  },
  customTimerLabel: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  customTimerDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  startCustomTimerButton: {
    minWidth: 120,
  },
}); 