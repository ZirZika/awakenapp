import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, Alert, Switch, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Settings as SettingsIcon, User, Mail, Lock, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, Eye, EyeOff, Check, CreditCard as Edit3, Camera, Zap, Crown, Brain, Target, Send, Bug, Lightbulb, MessageSquare, TriangleAlert as AlertTriangle, Clock, Code } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import GlowingButton from '@/components/GlowingButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import DeveloperPanel from '@/components/DeveloperPanel';

type ModalType = 'email' | 'password' | 'notifications' | 'profile' | 'focusGoal' | 'privacy' | 'support' | null;
type AuraColor = 'red' | 'green' | 'blue';
type ClassType = 'warrior' | 'mage' | 'assassin' | 'vagabond' | 'hunter';
type FocusArea = 'business' | 'fitness' | 'intelligence';
type SupportCategory = 'bug' | 'suggestion' | 'question' | 'feedback' | 'account' | 'other';

export default function SettingsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [developerPanelVisible, setDeveloperPanelVisible] = useState(false);
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: '',
    currentPassword: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileForm, setProfileForm] = useState({
    username: 'ShadowWalker2024',
    bio: 'E-Rank Awakened on a journey to become the strongest. Currently focusing on daily quests and personal growth.',
    location: 'Seoul, South Korea',
    profilePicture: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=280&fit=crop',
    auraColor: 'blue' as AuraColor,
    class: 'hunter' as ClassType,
    focusArea: 'intelligence' as FocusArea,
    focusGoal: ''
  });

  const [tempFocusArea, setTempFocusArea] = useState<FocusArea | null>(null);
  const [focusGoalForm, setFocusGoalForm] = useState('');

  // Support form state
  const [supportForm, setSupportForm] = useState({
    category: 'question' as SupportCategory,
    subject: '',
    message: '',
    email: ''
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public' as 'public' | 'friends' | 'private',
    showOnlineStatus: true,
    allowFriendRequests: true,
    showLocation: false,
    searchableProfile: true,
    dataCollection: true,
    analyticsTracking: false,
    partnerDataSharing: false,
    activityTracking: true,
    crashReporting: true,
    performanceData: true,
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    questUpdates: true,
    achievements: true,
    dailyReminders: true,
    weeklyProgress: false,
    socialUpdates: true,
    systemUpdates: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  });

  const { user, signOut } = useAuth();
  const { userProfile, isDeveloper, loading } = useUserRole();
  
  // Debug logging
  console.log('🔍 Settings Debug:', {
    user: user?.id,
    userProfile: userProfile?.role,
    isDeveloper: isDeveloper(),
    loading
  });

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalVisible(true);
    // Reset forms
    setEmailForm({ newEmail: '', confirmEmail: '', currentPassword: '' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSupportForm({
      category: 'question',
      subject: '',
      message: '',
      email: user?.email || ''
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setTempFocusArea(null);
    setFocusGoalForm('');
  };

  const handleFocusAreaSelection = (focus: FocusArea) => {
    if (focus !== profileForm.focusArea) {
      setTempFocusArea(focus);
      setFocusGoalForm('');
      setModalType('focusGoal');
      setModalVisible(true);
    }
  };

  const handleFocusGoalSubmit = () => {
    if (!focusGoalForm.trim()) {
      Alert.alert('Goal Required', 'Please enter a specific goal for your chosen focus area.');
      return;
    }

    if (focusGoalForm.length < 10) {
      Alert.alert('Goal Too Short', 'Please provide a more detailed goal (at least 10 characters).');
      return;
    }

    if (tempFocusArea) {
      setProfileForm(prev => ({
        ...prev,
        focusArea: tempFocusArea,
        focusGoal: focusGoalForm
      }));
      
      const focusInfo = getFocusInfo(tempFocusArea);
      Alert.alert(
        'Focus Area Updated! 🎯',
        `Your focus is now set to ${focusInfo.name}. Your goal: "${focusGoalForm}"\n\nThis will help generate personalized quests and track your progress!`,
        [{ text: 'Great!', onPress: () => closeModal() }]
      );
    }
  };

  const handleSupportSubmit = () => {
    // Validate form
    if (!supportForm.subject.trim()) {
      Alert.alert('Subject Required', 'Please enter a subject for your message.');
      return;
    }

    if (!supportForm.message.trim()) {
      Alert.alert('Message Required', 'Please enter your message.');
      return;
    }

    if (supportForm.message.length < 10) {
      Alert.alert('Message Too Short', 'Please provide more details (at least 10 characters).');
      return;
    }

    // Simulate sending support request
    const categoryInfo = getSupportCategoryInfo(supportForm.category);
    Alert.alert(
      'Support Request Sent! 📧',
      `Your ${categoryInfo.name.toLowerCase()} has been sent to our support team. We'll get back to you within 24 hours at ${supportForm.email}.`,
      [
        {
          text: 'OK',
          onPress: () => closeModal()
        }
      ]
    );
  };

  const handleProfilePictureChange = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access camera roll is required to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show action sheet for image selection options
      Alert.alert(
        'Change Profile Picture',
        'Choose how you want to update your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => openCamera(),
          },
          {
            text: 'Photo Library',
            onPress: () => openImagePicker(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const openCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert(
          'Camera Permission Required',
          'Permission to access camera is required to take a new photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileForm(prev => ({
          ...prev,
          profilePicture: result.assets[0].uri
        }));
        
        Alert.alert(
          'Photo Updated!',
          'Your profile picture has been updated. Don\'t forget to save your changes.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileForm(prev => ({
          ...prev,
          profilePicture: result.assets[0].uri
        }));
        
        Alert.alert(
          'Photo Updated!',
          'Your profile picture has been updated. Don\'t forget to save your changes.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleEmailChange = () => {
    // Validate form
    if (!emailForm.newEmail.trim() || !emailForm.confirmEmail.trim() || !emailForm.currentPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      Alert.alert('Error', 'Email addresses do not match');
      return;
    }

    if (!isValidEmail(emailForm.newEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Simulate sending confirmation email
    Alert.alert(
      'Confirmation Email Sent',
      `A confirmation email has been sent to ${user?.email}. Please check your inbox and click the confirmation link to complete the email change.`,
      [
        {
          text: 'OK',
          onPress: () => closeModal()
        }
      ]
    );
  };

  const handlePasswordChange = () => {
    // Validate form
    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Simulate sending confirmation email
    Alert.alert(
      'Confirmation Email Sent',
      `A confirmation email has been sent to ${user?.email}. Please check your inbox and click the confirmation link to complete the password change.`,
      [
        {
          text: 'OK',
          onPress: () => closeModal()
        }
      ]
    );
  };

  const handleProfileSave = async () => {
    // Validate form
    if (!profileForm.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (profileForm.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    // Check for valid username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(profileForm.username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    if (profileForm.bio.length > 500) {
      Alert.alert('Error', 'Bio must be less than 500 characters');
      return;
    }

    try {
      // Save profile data to AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileForm));
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully! Other users can now find you using your unique username.',
        [
          {
            text: 'OK',
            onPress: () => closeModal()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };

  const handlePrivacySave = () => {
    Alert.alert(
      'Privacy Settings Updated',
      'Your privacy preferences have been saved successfully.',
      [
        {
          text: 'OK',
          onPress: () => closeModal()
        }
      ]
    );
  };

  const handleNotificationSave = () => {
    Alert.alert(
      'Settings Saved',
      'Your notification preferences have been updated successfully.',
      [
        {
          text: 'OK',
          onPress: () => closeModal()
        }
      ]
    );
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateNotificationSetting = (key: string, value: boolean | string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePrivacySetting = (key: string, value: boolean | string | number) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getAuraColor = (color: AuraColor) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'green': return '#10b981';
      case 'blue': return '#00ffff';
    }
  };

  const getClassInfo = (classType: ClassType) => {
    switch (classType) {
      case 'warrior': return { name: 'Warrior', icon: '⚔️', description: 'Strength and courage' };
      case 'mage': return { name: 'Mage', icon: '🔮', description: 'Wisdom and magic' };
      case 'assassin': return { name: 'Assassin', icon: '🗡️', description: 'Speed and precision' };
      case 'vagabond': return { name: 'Vagabond', icon: '🎭', description: 'Charisma and adaptability' };
      case 'hunter': return { name: 'Hunter', icon: '🏹', description: 'Tracking and survival' };
    }
  };

  const getFocusInfo = (focus: FocusArea) => {
    switch (focus) {
      case 'business': return { 
        name: 'Business', 
        icon: '💼', 
        description: 'Wealth building',
        goalPlaceholder: 'e.g., Start a side business, increase income by 20%, learn investing...'
      };
      case 'fitness': return { 
        name: 'Fitness', 
        icon: '💪', 
        description: 'Physical strength',
        goalPlaceholder: 'e.g., Lose 10 pounds, run a 5K, build muscle, improve flexibility...'
      };
      case 'intelligence': return { 
        name: 'Intelligence', 
        icon: '🧠', 
        description: 'Learning & growth',
        goalPlaceholder: 'e.g., Learn a new language, read 12 books, master a skill, get certified...'
      };
    }
  };

  const getSupportCategoryInfo = (category: SupportCategory) => {
    switch (category) {
      case 'bug': return { 
        name: 'Bug Report', 
        icon: <Bug size={20} color="#ef4444" />, 
        description: 'Report a technical issue or bug',
        placeholder: 'Please describe the bug you encountered, including steps to reproduce it...'
      };
      case 'suggestion': return { 
        name: 'Feature Suggestion', 
        icon: <Lightbulb size={20} color="#f59e0b" />, 
        description: 'Suggest a new feature or improvement',
        placeholder: 'Tell us about your idea for improving the app...'
      };
      case 'question': return { 
        name: 'General Question', 
        icon: <MessageSquare size={20} color="#6366f1" />, 
        description: 'Ask a question about the app',
        placeholder: 'What would you like to know about LevelUpLife?'
      };
      case 'feedback': return { 
        name: 'General Feedback', 
        icon: <MessageSquare size={20} color="#10b981" />, 
        description: 'Share your thoughts and feedback',
        placeholder: 'We\'d love to hear your thoughts about the app...'
      };
      case 'account': return { 
        name: 'Account Issue', 
        icon: <User size={20} color="#8b5cf6" />, 
        description: 'Issues with your account or profile',
        placeholder: 'Describe the issue you\'re having with your account...'
      };
      case 'other': return { 
        name: 'Other', 
        icon: <AlertTriangle size={20} color="#6b7280" />, 
        description: 'Something else not covered above',
        placeholder: 'Please describe your issue or question...'
      };
    }
  };

  const renderAuraSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorTitle}>Aura Color</Text>
      <Text style={styles.selectorDescription}>Choose the glow color for your profile picture</Text>
      <View style={styles.auraContainer}>
        {(['red', 'green', 'blue'] as AuraColor[]).map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.auraOption,
              { borderColor: getAuraColor(color) },
              profileForm.auraColor === color && styles.selectedAuraOption
            ]}
            onPress={() => setProfileForm(prev => ({ ...prev, auraColor: color }))}
            testID={`settings-aura-${color}`}
          >
            <View style={[styles.auraPreview, { backgroundColor: getAuraColor(color) }]} />
            <Text style={[styles.auraText, { color: getAuraColor(color) }]}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderClassSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorTitle}>Class Selection</Text>
      <Text style={styles.selectorDescription}>Choose your Awakened class</Text>
      <View style={styles.classContainer}>
        {(['warrior', 'mage', 'assassin', 'vagabond', 'hunter'] as ClassType[]).map(classType => {
          const classInfo = getClassInfo(classType);
          return (
            <TouchableOpacity
              key={classType}
              style={[
                styles.classOption,
                profileForm.class === classType && styles.selectedClassOption
              ]}
              onPress={() => setProfileForm(prev => ({ ...prev, class: classType }))}
              testID={`settings-class-${classType}`}
            >
              <Text style={styles.classIcon}>{classInfo.icon}</Text>
              <Text style={[
                styles.className,
                profileForm.class === classType && styles.selectedClassText
              ]}>
                {classInfo.name}
              </Text>
              <Text style={styles.classDescription}>{classInfo.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderFocusSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorTitle}>Primary Focus</Text>
      <Text style={styles.selectorDescription}>What's your main area of growth?</Text>
      <View style={styles.focusContainer}>
        {(['business', 'fitness', 'intelligence'] as FocusArea[]).map(focus => {
          const focusInfo = getFocusInfo(focus);
          return (
            <TouchableOpacity
              key={focus}
              style={[
                styles.focusOption,
                profileForm.focusArea === focus && styles.selectedFocusOption
              ]}
              onPress={() => handleFocusAreaSelection(focus)}
              testID={`settings-focus-${focus}`}
            >
              <View style={styles.focusIconContainer}>
                <Text style={styles.focusIcon}>{focusInfo.icon}</Text>
              </View>
              <View style={styles.focusContent}>
                <Text style={[
                  styles.focusName,
                  profileForm.focusArea === focus && styles.selectedFocusText
                ]}>
                  {focusInfo.name}
                </Text>
                <Text style={styles.focusDescription}>{focusInfo.description}</Text>
                {profileForm.focusArea === focus && profileForm.focusGoal && (
                  <Text style={styles.focusGoalText} numberOfLines={2}>
                    Goal: {profileForm.focusGoal}
                  </Text>
                )}
              </View>
              {profileForm.focusArea === focus && (
                <View style={styles.focusCheckmark}>
                  <Check size={16} color="#00ffff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSupportCategorySelector = () => (
    <View style={styles.supportCategorySection}>
      <Text style={styles.inputLabel}>What can we help you with?</Text>
      <View style={styles.supportCategoryContainer}>
        {(['bug', 'suggestion', 'question', 'feedback', 'account', 'other'] as SupportCategory[]).map(category => {
          const categoryInfo = getSupportCategoryInfo(category);
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.supportCategoryOption,
                supportForm.category === category && styles.selectedSupportCategory
              ]}
              onPress={() => setSupportForm(prev => ({ ...prev, category }))}
              testID={`settings-support-category-${category}`}
            >
              <View style={styles.supportCategoryIcon}>
                {categoryInfo.icon}
              </View>
              <View style={styles.supportCategoryContent}>
                <Text style={[
                  styles.supportCategoryName,
                  supportForm.category === category && styles.selectedSupportCategoryText
                ]}>
                  {categoryInfo.name}
                </Text>
                <Text style={styles.supportCategoryDescription}>
                  {categoryInfo.description}
                </Text>
              </View>
              {supportForm.category === category && (
                <View style={styles.supportCategoryCheckmark}>
                  <Check size={16} color="#00ffff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderFocusGoalModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'focusGoal'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Your Goal</Text>
            <TouchableOpacity 
              onPress={closeModal} 
              style={styles.modalCloseButton}
              testID="settings-modal-close-button"
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {tempFocusArea && (
            <>
              <View style={styles.focusGoalHeader}>
                <View style={styles.focusGoalIconContainer}>
                  <Text style={styles.focusGoalIcon}>{getFocusInfo(tempFocusArea).icon}</Text>
                </View>
                <View style={styles.focusGoalInfo}>
                  <Text style={styles.focusGoalTitle}>{getFocusInfo(tempFocusArea).name}</Text>
                  <Text style={styles.focusGoalSubtitle}>{getFocusInfo(tempFocusArea).description}</Text>
                </View>
              </View>

              <Text style={styles.modalDescription}>
                To help generate personalized quests and track your progress, please share a specific goal you want to achieve in this area.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your {getFocusInfo(tempFocusArea).name} Goal</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={getFocusInfo(tempFocusArea).goalPlaceholder}
                  placeholderTextColor="#9ca3af"
                  value={focusGoalForm}
                  onChangeText={setFocusGoalForm}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.inputHint}>{focusGoalForm.length}/200 characters</Text>
              </View>

              <View style={styles.goalBenefits}>
                <Text style={styles.goalBenefitsTitle}>🎯 This helps us:</Text>
                <Text style={styles.goalBenefitItem}>• Generate personalized daily quests</Text>
                <Text style={styles.goalBenefitItem}>• Track your progress effectively</Text>
                <Text style={styles.goalBenefitItem}>• Suggest relevant challenges</Text>
                <Text style={styles.goalBenefitItem}>• Connect you with like-minded Awakened</Text>
              </View>
            </>
          )}

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
              testID="settings-focus-goal-cancel-button"
            />
            <GlowingButton
              title="Set Focus & Goal"
              onPress={handleFocusGoalSubmit}
              variant="primary"
              style={styles.modalButton}
              testID="settings-focus-goal-submit-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSupportModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'support'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            We're here to help! Let us know what you need assistance with and we'll get back to you as soon as possible.
          </Text>

          <ScrollView style={styles.modalScrollView}>
            {/* Category Selection */}
            {renderSupportCategorySelector()}

            {/* Contact Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#9ca3af"
                value={supportForm.email}
                onChangeText={(text) => setSupportForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>We'll respond to this email address</Text>
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description of your issue"
                placeholderTextColor="#9ca3af"
                value={supportForm.subject}
                onChangeText={(text) => setSupportForm(prev => ({ ...prev, subject: text }))}
                maxLength={100}
              />
              <Text style={styles.inputHint}>{supportForm.subject.length}/100 characters</Text>
            </View>

            {/* Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.supportTextArea]}
                placeholder={getSupportCategoryInfo(supportForm.category).placeholder}
                placeholderTextColor="#9ca3af"
                value={supportForm.message}
                onChangeText={(text) => setSupportForm(prev => ({ ...prev, message: text }))}
                multiline
                numberOfLines={6}
                maxLength={1000}
              />
              <Text style={styles.inputHint}>{supportForm.message.length}/1000 characters</Text>
            </View>

            {/* Response Time Info */}
            <View style={styles.responseTimeInfo}>
              <View style={styles.responseTimeHeader}>
                <Clock size={16} color="#10b981" />
                <Text style={styles.responseTimeTitle}>Response Time</Text>
              </View>
              <Text style={styles.responseTimeText}>
                We typically respond within 24 hours during business days. For urgent issues, please include "URGENT" in your subject line.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
              testID="settings-support-cancel-button"
            />
            <GlowingButton
              title="Send Message"
              onPress={handleSupportSubmit}
              variant="primary"
              style={styles.modalButton}
              testID="settings-support-submit-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSettingsSection = (title: string, items: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingsItem,
              index === items.length - 1 && styles.lastItem
            ]}
            onPress={item.onPress}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                {item.icon}
              </View>
              <View style={styles.settingsItemInfo}>
                <Text style={styles.settingsItemTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingsItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNotificationToggle = (title: string, subtitle: string, value: boolean, onToggle: (value: boolean) => void) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationItemLeft}>
        <Text style={styles.notificationItemTitle}>{title}</Text>
        <Text style={styles.notificationItemSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: '#6366f1' }}
        thumbColor={value ? '#00ffff' : '#9ca3af'}
        ios_backgroundColor="#374151"
      />
    </View>
  );

  const renderPrivacyToggle = (title: string, subtitle: string, value: boolean, onToggle: (value: boolean) => void, isHighRisk?: boolean) => (
    <View style={styles.privacyItem}>
      <View style={styles.privacyItemLeft}>
        <Text style={[styles.privacyItemTitle, isHighRisk && styles.highRiskTitle]}>{title}</Text>
        <Text style={styles.privacyItemSubtitle}>{subtitle}</Text>
        {isHighRisk && (
          <Text style={styles.privacyWarning}>⚠️ High privacy impact</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: isHighRisk ? '#ef4444' : '#6366f1' }}
        thumbColor={value ? (isHighRisk ? '#fca5a5' : '#00ffff') : '#9ca3af'}
        ios_backgroundColor="#374151"
      />
    </View>
  );

  const renderProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'profile'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Update your profile information. Changes will be visible to other users.
          </Text>

          <ScrollView style={styles.modalScrollView}>
            {/* Profile Picture Section - Clickable to change picture */}
            <View style={styles.profilePictureSection}>
              <TouchableOpacity 
                style={styles.profilePictureContainer}
                onPress={handleProfilePictureChange}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[getAuraColor(profileForm.auraColor), `${getAuraColor(profileForm.auraColor)}80`, `${getAuraColor(profileForm.auraColor)}40`]}
                  style={styles.avatarBorder}
                >
                  <View style={styles.avatarFrame}>
                    <Image
                      source={{ uri: profileForm.profilePicture }}
                      style={styles.avatarImage}
                    />
                    {/* Glowing effect overlay */}
                    <LinearGradient
                      colors={['transparent', `${getAuraColor(profileForm.auraColor)}20`, 'transparent']}
                      style={styles.avatarGlow}
                    />
                    {/* Camera overlay for visual feedback */}
                    <View style={styles.cameraOverlay}>
                      <Camera size={20} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
                <View style={styles.changePictureButton}>
                  <Camera size={16} color="#6366f1" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profilePictureText}>Tap to change profile picture</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter unique username"
                placeholderTextColor="#9ca3af"
                value={profileForm.username}
                onChangeText={(text) => setProfileForm({...profileForm, username: text})}
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>Unique username - others can find you with this</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell others about yourself..."
                placeholderTextColor="#9ca3af"
                value={profileForm.bio}
                onChangeText={(text) => setProfileForm({...profileForm, bio: text})}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.inputHint}>{profileForm.bio.length}/500 characters</Text>
            </View>

            {/* Aura Color Selector */}
            {renderAuraSelector()}

            {/* Class Selector */}
            {renderClassSelector()}

            {/* Focus Area Selector */}
            {renderFocusSelector()}

            {/* Location Section - Moved to bottom */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your location"
                placeholderTextColor="#9ca3af"
                value={profileForm.location}
                onChangeText={(text) => setProfileForm({...profileForm, location: text})}
              />
              <Text style={styles.inputHint}>Optional - helps connect with nearby Awakened</Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
            />
            <GlowingButton
              title="Save Changes"
              onPress={handleProfileSave}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'email'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Email Address</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Enter your new email address. A confirmation email will be sent to your current email ({user?.email}) to verify this change.
          </Text>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new email"
                placeholderTextColor="#9ca3af"
                value={emailForm.newEmail}
                onChangeText={(text) => setEmailForm({...emailForm, newEmail: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new email"
                placeholderTextColor="#9ca3af"
                value={emailForm.confirmEmail}
                onChangeText={(text) => setEmailForm({...emailForm, confirmEmail: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  value={emailForm.currentPassword}
                  onChangeText={(text) => setEmailForm({...emailForm, currentPassword: text})}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
            />
            <GlowingButton
              title="Send Confirmation"
              onPress={handleEmailChange}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPasswordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'password'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Enter your new password. A confirmation email will be sent to {user?.email} to verify this change.
          </Text>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Password must be at least 8 characters long</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
            />
            <GlowingButton
              title="Send Confirmation"
              onPress={handlePasswordChange}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderNotificationsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'notifications'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notification Settings</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Customize your notification preferences to stay updated on what matters most to you.
          </Text>

          <ScrollView style={styles.modalScrollView}>
            {/* Master Toggle */}
            <View style={styles.notificationSection}>
              <Text style={styles.notificationSectionTitle}>General</Text>
              {renderNotificationToggle(
                'Push Notifications',
                'Enable all push notifications',
                notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('pushEnabled', value)
              )}
            </View>

            {/* Quest & Progress Notifications */}
            <View style={styles.notificationSection}>
              <Text style={styles.notificationSectionTitle}>Quests & Progress</Text>
              {renderNotificationToggle(
                'Quest Updates',
                'New quests and quest completions',
                notificationSettings.questUpdates && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('questUpdates', value)
              )}
              {renderNotificationToggle(
                'Achievements',
                'Level ups and milestone achievements',
                notificationSettings.achievements && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('achievements', value)
              )}
              {renderNotificationToggle(
                'Daily Reminders',
                'Reminders to complete daily tasks',
                notificationSettings.dailyReminders && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('dailyReminders', value)
              )}
              {renderNotificationToggle(
                'Weekly Progress',
                'Weekly progress summaries',
                notificationSettings.weeklyProgress && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('weeklyProgress', value)
              )}
            </View>

            {/* Social & System */}
            <View style={styles.notificationSection}>
              <Text style={styles.notificationSectionTitle}>Social & System</Text>
              {renderNotificationToggle(
                'Social Updates',
                'Friend requests and guild activities',
                notificationSettings.socialUpdates && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('socialUpdates', value)
              )}
              {renderNotificationToggle(
                'System Updates',
                'App updates and important announcements',
                notificationSettings.systemUpdates && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('systemUpdates', value)
              )}
            </View>

            {/* Quiet Hours */}
            <View style={styles.notificationSection}>
              <Text style={styles.notificationSectionTitle}>Quiet Hours</Text>
              {renderNotificationToggle(
                'Enable Quiet Hours',
                'Pause notifications during specified hours',
                notificationSettings.quietHours && notificationSettings.pushEnabled,
                (value) => updateNotificationSetting('quietHours', value)
              )}
              
              {notificationSettings.quietHours && notificationSettings.pushEnabled && (
                <View style={styles.quietHoursContainer}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={notificationSettings.quietStart}
                      onChangeText={(text) => updateNotificationSetting('quietStart', text)}
                      placeholder="22:00"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={notificationSettings.quietEnd}
                      onChangeText={(text) => updateNotificationSetting('quietEnd', text)}
                      placeholder="08:00"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
            />
            <GlowingButton
              title="Save Settings"
              onPress={handleNotificationSave}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPrivacyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible && modalType === 'privacy'}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Settings</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Control your privacy and data sharing preferences. Settings marked with ⚠️ have high privacy impact.
          </Text>

          <ScrollView style={styles.modalScrollView}>
            {/* Profile Visibility */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Profile Visibility</Text>
              <Text style={styles.privacySectionDescription}>Who can see your profile and activities</Text>
              
              <View style={styles.visibilityContainer}>
                {[
                  { key: 'public', label: 'Public', description: 'Anyone can see your profile', icon: '🌍' },
                  { key: 'friends', label: 'Friends Only', description: 'Only your friends can see your profile', icon: '👥' },
                  { key: 'private', label: 'Private', description: 'Only you can see your profile', icon: '🔒' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.visibilityOption,
                      privacySettings.profileVisibility === option.key && styles.selectedVisibilityOption
                    ]}
                    onPress={() => updatePrivacySetting('profileVisibility', option.key)}
                  >
                    <View style={styles.visibilityIconContainer}>
                      <Text style={styles.visibilityIcon}>{option.icon}</Text>
                    </View>
                    <View style={styles.visibilityContent}>
                      <Text style={[
                        styles.visibilityLabel,
                        privacySettings.profileVisibility === option.key && styles.selectedVisibilityText
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.visibilityDescription}>{option.description}</Text>
                    </View>
                    {privacySettings.profileVisibility === option.key && (
                      <View style={styles.visibilityCheckmark}>
                        <Check size={16} color="#00ffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Social Privacy */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Social Privacy</Text>
              {renderPrivacyToggle(
                'Show Online Status',
                'Let others see when you\'re online',
                privacySettings.showOnlineStatus,
                (value) => updatePrivacySetting('showOnlineStatus', value)
              )}
              {renderPrivacyToggle(
                'Allow Friend Requests',
                'Let other users send you friend requests',
                privacySettings.allowFriendRequests,
                (value) => updatePrivacySetting('allowFriendRequests', value)
              )}
              {renderPrivacyToggle(
                'Show Location',
                'Display your location on your profile',
                privacySettings.showLocation,
                (value) => updatePrivacySetting('showLocation', value)
              )}
              {renderPrivacyToggle(
                'Searchable Profile',
                'Allow others to find you by username',
                privacySettings.searchableProfile,
                (value) => updatePrivacySetting('searchableProfile', value)
              )}
            </View>

            {/* Data & Analytics */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Data & Analytics</Text>
              {renderPrivacyToggle(
                'Data Collection',
                'Allow collection of usage data for app improvement',
                privacySettings.dataCollection,
                (value) => updatePrivacySetting('dataCollection', value),
                true
              )}
              {renderPrivacyToggle(
                'Analytics Tracking',
                'Track app usage for analytics purposes',
                privacySettings.analyticsTracking,
                (value) => updatePrivacySetting('analyticsTracking', value),
                true
              )}
              {renderPrivacyToggle(
                'Partner Data Sharing',
                'Share anonymized data with trusted partners',
                privacySettings.partnerDataSharing,
                (value) => updatePrivacySetting('partnerDataSharing', value),
                true
              )}
              {renderPrivacyToggle(
                'Activity Tracking',
                'Track your in-app activities and progress',
                privacySettings.activityTracking,
                (value) => updatePrivacySetting('activityTracking', value)
              )}
              {renderPrivacyToggle(
                'Crash Reporting',
                'Send crash reports to help improve the app',
                privacySettings.crashReporting,
                (value) => updatePrivacySetting('crashReporting', value)
              )}
              {renderPrivacyToggle(
                'Performance Data Sharing',
                'Share app performance data for optimization',
                privacySettings.performanceData,
                (value) => updatePrivacySetting('performanceData', value)
              )}
            </View>

            {/* Security */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Security</Text>
              {renderPrivacyToggle(
                'Two-Factor Authentication',
                'Add an extra layer of security to your account',
                privacySettings.twoFactorAuth,
                (value) => updatePrivacySetting('twoFactorAuth', value)
              )}
              {renderPrivacyToggle(
                'Login Alerts',
                'Get notified when someone logs into your account',
                privacySettings.loginAlerts,
                (value) => updatePrivacySetting('loginAlerts', value)
              )}
              
              <View style={styles.sessionTimeoutContainer}>
                <Text style={styles.sessionTimeoutLabel}>Session Timeout</Text>
                <Text style={styles.sessionTimeoutDescription}>Automatically log out after inactivity</Text>
                <View style={styles.sessionTimeoutOptions}>
                  {[15, 30, 60, 120].map(minutes => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.sessionTimeoutOption,
                        privacySettings.sessionTimeout === minutes && styles.selectedSessionTimeout
                      ]}
                      onPress={() => updatePrivacySetting('sessionTimeout', minutes)}
                    >
                      <Text style={[
                        styles.sessionTimeoutText,
                        privacySettings.sessionTimeout === minutes && styles.selectedSessionTimeoutText
                      ]}>
                        {minutes}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Data Rights */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Data Rights</Text>
              <Text style={styles.dataRightsDescription}>
                You have the right to access, modify, or delete your personal data. Contact support for assistance with data requests.
              </Text>
              
              <TouchableOpacity style={styles.deleteAccountButton}>
                <AlertTriangle size={20} color="#ef4444" />
                <View style={styles.deleteAccountContent}>
                  <Text style={styles.deleteAccountTitle}>Delete Account</Text>
                  <Text style={styles.deleteAccountDescription}>
                    Permanently delete your account and all associated data
                  </Text>
                </View>
                <ChevronRight size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <GlowingButton
              title="Cancel"
              onPress={closeModal}
              variant="secondary"
              style={styles.modalButton}
            />
            <GlowingButton
              title="Save Settings"
              onPress={handlePrivacySave}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const profileItems = [
    {
      title: 'Edit Profile',
      subtitle: 'Update your profile information',
      icon: <Edit3 size={20} color="#00ffff" />,
      iconBg: '#00ffff20',
      onPress: () => openModal('profile')
    }
  ];

  const accountItems = [
    {
      title: 'Email',
      subtitle: user?.email || '',
      icon: <Mail size={20} color="#6366f1" />,
      iconBg: '#6366f120',
      onPress: () => openModal('email')
    },
    {
      title: 'Password',
      subtitle: '••••••••',
      icon: <Lock size={20} color="#8b5cf6" />,
      iconBg: '#8b5cf620',
      onPress: () => openModal('password')
    }
  ];

  const notificationItems = [
    {
      title: 'Push Notifications',
      subtitle: notificationSettings.pushEnabled ? 'Enabled' : 'Disabled',
      icon: <Bell size={20} color="#10b981" />,
      iconBg: '#10b98120',
      onPress: () => openModal('notifications')
    }
  ];

  const securityItems = [
    {
      title: 'Privacy Settings',
      subtitle: 'Control your data and visibility',
      icon: <Shield size={20} color="#f59e0b" />,
      iconBg: '#f59e0b20',
      onPress: () => openModal('privacy')
    }
  ];

  const supportItems = [
    {
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: <HelpCircle size={20} color="#06b6d4" />,
      iconBg: '#06b6d420',
      onPress: () => openModal('support')
    }
  ];

  const developerItems = [
    {
      title: 'Developer Panel',
      subtitle: 'Testing tools and debug features',
      icon: <Code size={20} color="#ff6b6b" />,
      iconBg: '#ff6b6b20',
      onPress: () => setDeveloperPanelVisible(true)
    }
  ];

  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SettingsIcon size={24} color="#6366f1" />
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Settings Sections */}
          {renderSettingsSection('Profile', profileItems)}
          {renderSettingsSection('Account Information', accountItems)}
          {renderSettingsSection('Notifications', notificationItems)}
          {renderSettingsSection('Security & Privacy', securityItems)}
          {renderSettingsSection('Support', supportItems)}
          {(isDeveloper() || userProfile?.role === 'developer') && renderSettingsSection('Developer Tools', developerItems)}
          {/* No Account Actions section */}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Visually distinct Sign Out button at the bottom */}
        <TouchableOpacity
          style={{
            backgroundColor: '#ef4444',
            padding: 16,
            borderRadius: 12,
            margin: 24,
            marginBottom: 40,
            alignItems: 'center',
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
          }}
          onPress={async () => {
            console.log('Sign Out button pressed');
            try {
              // Clear AsyncStorage first
              console.log('Clearing AsyncStorage...');
              await AsyncStorage.clear();
              console.log('AsyncStorage cleared');
              
              // Sign out from Supabase
              console.log('Calling signOut()...');
              await signOut();
              console.log('signOut() complete');
              
              // Navigate to login screen
              console.log('Navigating to login...');
              router.replace('/(auth)/login');
              
            } catch (e) {
              console.error('Error during signOut:', e);
              // Even if there's an error, try to navigate to login
              router.replace('/(auth)/login');
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign Out</Text>
        </TouchableOpacity>

        {/* Modals */}
        {renderProfileModal()}
        {renderFocusGoalModal()}
        {renderEmailModal()}
        {renderPasswordModal()}
        {renderNotificationsModal()}
        {renderPrivacyModal()}
        {renderSupportModal()}
        
        {/* Developer Panel */}
        <DeveloperPanel
          visible={developerPanelVisible}
          onClose={() => setDeveloperPanelVisible(false)}
          userProfile={userProfile}
        />
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
  headerTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsItemInfo: {
    flex: 1,
  },
  settingsItemTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 24,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
  },
  eyeButton: {
    padding: 12,
  },
  passwordHint: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  // Profile-specific styles - Updated to match Hub avatar with upload functionality
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 42,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 42,
    opacity: 0,
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  profilePictureText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Selector styles
  selectorSection: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  selectorDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  // Aura selector styles
  auraContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  auraOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#374151',
    minWidth: 80,
  },
  selectedAuraOption: {
    backgroundColor: '#4b5563',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  auraPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  auraText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
  },
  // Class selector styles
  classContainer: {
    gap: 8,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  selectedClassOption: {
    backgroundColor: '#4b5563',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  classIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  className: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  selectedClassText: {
    color: '#6366f1',
  },
  classDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#9ca3af',
  },
  // Focus selector styles - Redesigned for cleaner look
  focusContainer: {
    gap: 12,
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    position: 'relative',
  },
  selectedFocusOption: {
    backgroundColor: '#1f2937',
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  focusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  focusIcon: {
    fontSize: 24,
  },
  focusContent: {
    flex: 1,
  },
  focusName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  selectedFocusText: {
    color: '#00ffff',
  },
  focusDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  focusGoalText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#00ffff',
    marginTop: 4,
    fontStyle: 'italic',
  },
  focusCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00ffff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Focus Goal Modal styles
  focusGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  focusGoalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  focusGoalIcon: {
    fontSize: 24,
  },
  focusGoalInfo: {
    flex: 1,
  },
  focusGoalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  focusGoalSubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  goalBenefits: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  goalBenefitsTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  goalBenefitItem: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 4,
  },
  // Support Modal styles
  supportCategorySection: {
    marginBottom: 24,
  },
  supportCategoryContainer: {
    gap: 8,
  },
  supportCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  selectedSupportCategory: {
    backgroundColor: '#1f2937',
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  supportCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supportCategoryContent: {
    flex: 1,
  },
  supportCategoryName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  selectedSupportCategoryText: {
    color: '#00ffff',
  },
  supportCategoryDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#9ca3af',
  },
  supportCategoryCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00ffff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  responseTimeInfo: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  responseTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseTimeTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#10b981',
    marginLeft: 8,
  },
  responseTimeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 16,
  },
  // Notification-specific styles
  notificationSection: {
    marginBottom: 24,
  },
  notificationSectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  notificationItemTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  notificationItemSubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  quietHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 6,
  },
  timeInput: {
    backgroundColor: '#4b5563',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  // Privacy-specific styles
  privacySection: {
    marginBottom: 24,
  },
  privacySectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  privacySectionDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 8,
  },
  privacyItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  privacyItemTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  highRiskTitle: {
    color: '#fca5a5',
  },
  privacyItemSubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  privacyWarning: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#ef4444',
    marginTop: 2,
  },
  // Visibility selector styles
  visibilityContainer: {
    gap: 8,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  selectedVisibilityOption: {
    backgroundColor: '#1f2937',
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  visibilityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  visibilityIcon: {
    fontSize: 20,
  },
  visibilityContent: {
    flex: 1,
  },
  visibilityLabel: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  selectedVisibilityText: {
    color: '#00ffff',
  },
  visibilityDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#9ca3af',
  },
  visibilityCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00ffff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Session timeout styles
  sessionTimeoutContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionTimeoutLabel: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  sessionTimeoutDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  sessionTimeoutOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionTimeoutOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4b5563',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  selectedSessionTimeout: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sessionTimeoutText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
  },
  selectedSessionTimeoutText: {
    color: '#ffffff',
  },
  // Data rights styles
  dataRightsDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 16,
    marginBottom: 16,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteAccountContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  deleteAccountTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 2,
  },
  deleteAccountDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#9ca3af',
  },
});