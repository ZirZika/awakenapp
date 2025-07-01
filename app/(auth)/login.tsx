import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Crown, Mail, Lock, Eye, EyeOff, Zap, CircleAlert as AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import GlowingButton from '@/components/GlowingButton';
import TypewriterText from '@/components/TypewriterText';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Starting login process...');
      
      // First, check if the database is properly set up
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

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('Login error:', authError);
        
        // Provide more specific error messages
        if (authError.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please check your credentials and try again.');
          
          // Suggest creating an account if user doesn't exist
          Alert.alert(
            'Login Failed',
            'Invalid email or password. If you don\'t have an account yet, please sign up first.',
            [
              { text: 'Sign Up', onPress: () => router.push('/(auth)/signup') },
              { text: 'Try Again', style: 'cancel' }
            ]
          );
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before logging in.');
        } else if (authError.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a moment and try again.');
        } else {
          setError(authError.message);
        }
      } else {
        console.log('Login successful!');
        setError('');
        // Navigation will be handled by the auth state change in _layout.tsx
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Login error:', error);
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
                <Text style={styles.title}>Awaken</Text>
                <TypewriterText 
                  text="System active. Awaiting directive"
                  speed={80}
                  style={styles.subtitle}
                />
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <AlertCircle size={20} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Login Form */}
              <View style={styles.form}>
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

                <GlowingButton
                  title={loading ? "Logging in..." : "Login"}
                  onPress={handleLogin}
                  variant="primary"
                  style={styles.loginButton}
                  disabled={loading}
                />

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Features Preview */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Zap size={16} color="#00ffff" />
                  <Text style={styles.featureText}>Track your progress</Text>
                </View>
                <View style={styles.featureItem}>
                  <Crown size={16} color="#00ffff" />
                  <Text style={styles.featureText}>Join guilds & make friends</Text>
                </View>
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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    fontSize: 32,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    minHeight: 24, // Ensure consistent height during typing
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
    marginBottom: 20,
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
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#6366f1',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  signUpLink: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#00ffff',
  },
  featuresContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
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