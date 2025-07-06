import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { ArrowLeft, Database, CheckCircle, XCircle } from 'lucide-react-native';

export default function TestConnectionScreen() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [testResults, setTestResults] = useState<{
    connection: boolean;
    tables: boolean;
    auth: boolean;
  }>({
    connection: false,
    tables: false,
    auth: false,
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      const results = { connection: false, tables: false, auth: false };

      // Test 1: Basic connection
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (!error) {
          results.connection = true;
        }
      } catch (error) {
        console.log('Connection test failed:', error);
      }

      // Test 2: Check if tables exist
      try {
        const { data: profilesData } = await supabase.from('profiles').select('id').limit(1);
        const { data: goalsData } = await supabase.from('goals').select('id').limit(1);
        const { data: tasksData } = await supabase.from('tasks').select('id').limit(1);
        
        if (profilesData !== null && goalsData !== null && tasksData !== null) {
          results.tables = true;
        }
      } catch (error) {
        console.log('Tables test failed:', error);
      }

      // Test 3: Auth functionality
      try {
        const { data: { session } } = await supabase.auth.getSession();
        results.auth = true; // Auth is working if we can call getSession without error
      } catch (error) {
        console.log('Auth test failed:', error);
      }

      setTestResults(results);

      if (results.connection && results.tables && results.auth) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage('Some tests failed. Check the results below.');
      }

    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle size={20} color="#10b981" />
    ) : (
      <XCircle size={20} color="#ef4444" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? '#10b981' : '#ef4444';
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          testID="test-connection-back-button"
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supabase Connection Test</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Database size={48} color="#6366f1" />
          <Text style={styles.statusTitle}>
            {connectionStatus === 'testing' ? 'Testing Connection...' :
             connectionStatus === 'success' ? 'Connection Successful!' :
             'Connection Issues Detected'}
          </Text>
          
          {connectionStatus === 'error' && errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </View>

        <View style={styles.testsContainer}>
          <Text style={styles.testsTitle}>Test Results</Text>
          
          <View style={styles.testItem}>
            {getStatusIcon(testResults.connection)}
            <View style={styles.testInfo}>
              <Text style={styles.testName}>Database Connection</Text>
              <Text style={[styles.testStatus, { color: getStatusColor(testResults.connection) }]}>
                {testResults.connection ? 'Connected' : 'Failed'}
              </Text>
            </View>
          </View>

          <View style={styles.testItem}>
            {getStatusIcon(testResults.tables)}
            <View style={styles.testInfo}>
              <Text style={styles.testName}>Database Tables</Text>
              <Text style={[styles.testStatus, { color: getStatusColor(testResults.tables) }]}>
                {testResults.tables ? 'Tables Found' : 'Tables Missing'}
              </Text>
            </View>
          </View>

          <View style={styles.testItem}>
            {getStatusIcon(testResults.auth)}
            <View style={styles.testInfo}>
              <Text style={styles.testName}>Authentication</Text>
              <Text style={[styles.testStatus, { color: getStatusColor(testResults.auth) }]}>
                {testResults.auth ? 'Working' : 'Error'}
              </Text>
            </View>
          </View>
        </View>

        {!testResults.tables && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>⚠️ Database Setup Required</Text>
            <Text style={styles.instructionsText}>
              It looks like your database tables haven't been created yet. Please:
            </Text>
            <Text style={styles.instructionStep}>
              1. Go to your Supabase dashboard
            </Text>
            <Text style={styles.instructionStep}>
              2. Navigate to SQL Editor
            </Text>
            <Text style={styles.instructionStep}>
              3. Copy and run the migration file: supabase/migrations/20250629131402_odd_feather.sql
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.retestButton}
          onPress={testConnection}
          testID="test-connection-retest-button"
        >
          <Text style={styles.retestButtonText}>Test Again</Text>
        </TouchableOpacity>

        {connectionStatus === 'success' && (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.replace('/(auth)/login')}
            testID="test-connection-continue-button"
          >
            <Text style={styles.continueButtonText}>Continue to App</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statusTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
  },
  testsContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  testsTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  testInfo: {
    marginLeft: 12,
    flex: 1,
  },
  testName: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  testStatus: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  instructionsCard: {
    backgroundColor: '#f59e0b20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  instructionsTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#f59e0b',
    marginBottom: 8,
  },
  instructionsText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 20,
  },
  instructionStep: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
    paddingLeft: 8,
  },
  retestButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  retestButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});