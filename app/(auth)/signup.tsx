import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Crown, Mail, Lock, Eye, EyeOff, User, Zap, Target, Sword, Star, Shield, CircleAlert as AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import GlowingButton from '@/components/GlowingButton';
import { SafeAreaView } from 'react-native-safe-area-context';

type ClassType = 'warrior' | 'mage' | 'assassin' | 'vagabond' | 'hunter';
type FocusArea = 'business' | 'fitness' | 'intelligence';
type AuraColor = 'red' | 'green' | 'blue';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Character customization
  const [selectedClass, setSelectedClass] = useState<ClassType>('hunter');
  const [selectedFocusArea, setSelectedFocusArea] = useState<FocusArea>('intelligence');
  const [selectedAuraColor, setSelectedAuraColor] = useState<AuraColor>('blue');

  const classes = [
    { id: 'warrior', name: 'Warrior', icon: <Sword size={20} color="#ef4444" />, color: '#ef4444', description: 'Strength and courage' },
    { id: 'mage', name: 'Mage', icon: <Star size={20} color="#8b5cf6" />, color: '#8b5cf6', description: 'Wisdom and magic' },
    { id: 'assassin', name: 'Assassin', icon: <Zap size={20} color="#10b981" />, color: '#10b981', description: 'Speed and precision' },
    { id: 'vagabond', name: 'Vagabond', icon: <Crown size={20} color="#f59e0b" />, color: '#f59e0b', description: 'Charisma and adaptability' },
    { id: 'hunter', name: 'Hunter', icon: <Target size={20} color="#6366f1" />, color: '#6366f1', description: 'Tracking and survival' },
  ];

  const focusAreas = [
    { id: 'business', name: 'Business', icon: <Crown size={16} color="#f59e0b" />, description: 'Entrepreneurship & leadership' },
    { id: 'fitness', name: 'Fitness', icon: <Shield size={16} color="#ef4444" />, description: 'Health & physical strength' },
    { id: 'intelligence', name: 'Intelligence', icon: <Star size={16} color="#8b5cf6" />, description: 'Learning & mental growth' },
  ];

  const auraColors = [
    { id: 'red', name: 'Red', color: '#ef4444', description: 'Passionate & determined' },
    { id: 'green', name: 'Green', color: '#10b981', description: 'Balanced & growing' },
    { id: 'blue', name: 'Blue', color: '#3b82f6', description: 'Calm & focused' },
  ];

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !username) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Starting sign up process...');
      
      // First, check if the profiles table exists by trying to query it
      try {
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (testError && testError.message.includes('relation "public.profiles" does not exist')) {
          setError('Database setup required. Please run the migration files first.');
          Alert.alert(
            'Database Setup Required',
            'The database tables need to be created first. Please run the migration file in your Supabase dashboard.',
            [
              { text: 'Go to Test Screen', onPress: () => router.push('/test-connection') },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking database:', error);
        setError('Unable to connect to database. Please check your connection.');
        setLoading(false);
        return;
      }

      // Check if username is already taken
      const { data: existingUser, error: usernameError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle();

      if (usernameError && !usernameError.message.includes('relation "public.profiles" does not exist')) {
        console.error('Error checking username:', usernameError);
        setError('Unable to verify username availability. Please try again.');
        setLoading(false);
        return;
      }

      if (existingUser) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      console.log('Username available, proceeding with sign up...');

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Provide more specific error messages
        if (authError.message.includes('User already registered')) {
          setError('An account with this email already exists. Please try logging in instead.');
          Alert.alert(
            'Account Exists',
            'An account with this email already exists. Would you like to log in instead?',
            [
              { text: 'Login', onPress: () => router.push('/(auth)/login') },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } else if (authError.message.includes('Password should be at least')) {
          setError('Password is too weak. Please use a stronger password.');
        } else if (authError.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      console.log('Auth successful, creating profile...');

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username.trim(),
            bio: '',
            location: '',
            profile_picture: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=280&fit=crop',
            aura_color: selectedAuraColor,
            class: selectedClass,
            focus_area: selectedFocusArea,
            focus_goal: '',
            level: 1,
            current_xp: 0,
            total_xp: 0,
            tasks_completed: 0,
            goals_completed: 0,
            streak: 0,
            title: 'E-Rank Hunter',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          if (profileError.message.includes('new row violates row-level security policy')) {
            setError('Database permissions not set up correctly. Please check the migration files.');
            Alert.alert(
              'Database Setup Issue',
              'The database permissions are not configured correctly. Please ensure all migration files have been run in your Supabase dashboard.',
              [
                { text: 'Go to Test Screen', onPress: () => router.push('/test-connection') },
                { text: 'OK', style: 'cancel' }
              ]
            );
          } else {
            setError(`Failed to create profile: ${profileError.message}`);
          }
          setLoading(false);
          return;
        }

        console.log('Profile created successfully!');

        Alert.alert(
          'Success!',
          'Account created successfully! You can now log in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['#00ffff', '#0066cc', '#003366']}
                    style={styles.logoGradient}
                  >
                    <Crown size={40} color="#ffffff" />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>Join Awaken</Text>
                <Text style={styles.subtitle}>Begin your journey to greatness</Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <AlertCircle size={20} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Sign Up Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <User size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#6b7280"
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (error) setError(''); // Clear error when user starts typing
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError(''); // Clear error when user starts typing
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (error) setError(''); // Clear error when user starts typing
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9ca3af" />
                      ) : (
                        <Eye size={20} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#6b7280"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (error) setError(''); // Clear error when user starts typing
                      }}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#9ca3af" />
                      ) : (
                        <Eye size={20} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Character Customization */}
              <View style={styles.customizationSection}>
                <Text style={styles.customizationTitle}>Choose Your Path</Text>
                
                {/* Class Selection */}
                <View style={styles.customizationGroup}>
                  <Text style={styles.customizationLabel}>Class</Text>
                  <View style={styles.classGrid}>
                    {classes.map((classItem) => (
                      <TouchableOpacity
                        key={classItem.id}
                        style={[
                          styles.classOption,
                          selectedClass === classItem.id && styles.selectedClassOption,
                          { borderColor: classItem.color }
                        ]}
                        onPress={() => setSelectedClass(classItem.id as ClassType)}
                      >
                        {classItem.icon}
                        <Text style={[
                          styles.classOptionText,
                          selectedClass === classItem.id && { color: classItem.color }
                        ]}>
                          {classItem.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Focus Area Selection */}
                <View style={styles.customizationGroup}>
                  <Text style={styles.customizationLabel}>Focus Area</Text>
                  <View style={styles.focusGrid}>
                    {focusAreas.map((focus) => (
                      <TouchableOpacity
                        key={focus.id}
                        style={[
                          styles.focusOption,
                          selectedFocusArea === focus.id && styles.selectedFocusOption
                        ]}
                        onPress={() => setSelectedFocusArea(focus.id as FocusArea)}
                      >
                        {focus.icon}
                        <Text style={[
                          styles.focusOptionText,
                          selectedFocusArea === focus.id && styles.selectedFocusOptionText
                        ]}>
                          {focus.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Aura Color Selection */}
                <View style={styles.customizationGroup}>
                  <Text style={styles.customizationLabel}>Aura Color</Text>
                  <View style={styles.auraGrid}>
                    {auraColors.map((aura) => (
                      <TouchableOpacity
                        key={aura.id}
                        style={[
                          styles.auraOption,
                          { backgroundColor: aura.color },
                          selectedAuraColor === aura.id && styles.selectedAuraOption
                        ]}
                        onPress={() => setSelectedAuraColor(aura.id as AuraColor)}
                      >
                        <Text style={styles.auraOptionText}>
                          {aura.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <GlowingButton
                title={loading ? "Creating Account..." : "Create Account"}
                onPress={handleSignUp}
                variant="primary"
                style={styles.signUpButton}
                disabled={loading}
              />

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>

              {/* Test Connection Button */}
              <TouchableOpacity 
                style={styles.testConnectionButton}
                onPress={() => router.push('/test-connection')}
              >
                <Text style={styles.testConnectionText}>Test Database Connection</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444420',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    color: '#ffffff',
  },
  eyeButton: {
    padding: 4,
  },
  customizationSection: {
    marginBottom: 32,
  },
  customizationTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  customizationGroup: {
    marginBottom: 24,
  },
  customizationLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 12,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 2,
    gap: 6,
    minWidth: '45%',
  },
  selectedClassOption: {
    backgroundColor: 'transparent',
  },
  classOptionText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  focusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  focusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    gap: 6,
  },
  selectedFocusOption: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  focusOptionText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedFocusOptionText: {
    color: '#ffffff',
  },
  auraGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  auraOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAuraOption: {
    borderColor: '#ffffff',
  },
  auraOptionText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  signUpButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  loginLink: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#00ffff',
  },
  testConnectionButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  testConnectionText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#6366f1',
  },
});