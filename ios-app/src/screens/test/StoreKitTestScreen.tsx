import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { storeKitTestSuite, TestResult } from '../../services/storekit-test';
import { theme } from '../../styles/theme';

const StoreKitTestScreen = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const results = await storeKitTestSuite.runAllTests();
      setTestResults(results);
      setLastRunTime(new Date());
      
      const passedTests = results.filter(r => r.success).length;
      const totalTests = results.length;
      
      Alert.alert(
        'Test Results',
        `${passedTests}/${totalTests} tests passed`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Test Error',
        error instanceof Error ? error.message : 'Unknown error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async (testName: string) => {
    setIsRunning(true);
    
    try {
      let result: TestResult;
      
      switch (testName) {
        case 'mockPurchase':
          result = await storeKitTestSuite.testMockPurchaseFlow();
          break;
        default:
          result = {
            testName: 'Unknown Test',
            success: false,
            message: 'Test not found'
          };
      }
      
      Alert.alert(
        result.success ? 'Test Passed ✅' : 'Test Failed ❌',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Test Error',
        error instanceof Error ? error.message : 'Unknown error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => success ? '✅' : '❌';
  const getStatusColor = (success: boolean) => success ? '#10B981' : '#EF4444';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 StoreKit Test Suite</Text>
        <Text style={styles.subtitle}>
          Test the subscription flow configuration
        </Text>
        {lastRunTime && (
          <Text style={styles.lastRun}>
            Last run: {lastRunTime.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>🔍 Run All Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => runSingleTest('mockPurchase')}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            💳 Test Mock Purchase
          </Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {testResults.filter(r => r.success).length} / {testResults.length} tests passed
            </Text>
            <View style={styles.summaryBar}>
              <View 
                style={[
                  styles.summaryBarFill,
                  { width: `${(testResults.filter(r => r.success).length / testResults.length) * 100}%` }
                ]}
              />
            </View>
          </View>

          {testResults.map((result, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testIcon}>
                  {getStatusIcon(result.success)}
                </Text>
                <Text style={styles.testName}>{result.testName}</Text>
              </View>
              
              <Text style={[
                styles.testMessage,
                { color: getStatusColor(result.success) }
              ]}>
                {result.message}
              </Text>
              
              {result.error && (
                <Text style={styles.testError}>
                  Error: {result.error}
                </Text>
              )}
              
              {result.data && (
                <View style={styles.testData}>
                  <Text style={styles.testDataTitle}>Data:</Text>
                  <Text style={styles.testDataContent}>
                    {JSON.stringify(result.data, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>📋 Testing Instructions</Text>
        
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Before Running Tests:</Text>
          <Text style={styles.instructionText}>
            1. Ensure you're logged into the app{'\n'}
            2. For simulator: Tests will use mock data{'\n'}
            3. For device: Use sandbox Apple ID{'\n'}
            4. Check that environment variables are configured
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Test Coverage:</Text>
          <Text style={styles.instructionText}>
            • StoreKit initialization{'\n'}
            • Product retrieval from App Store{'\n'}
            • Environment detection (sandbox/production){'\n'}
            • Supabase authentication{'\n'}
            • Receipt validation endpoint{'\n'}
            • Database connectivity
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Troubleshooting:</Text>
          <Text style={styles.instructionText}>
            • If products fail to load: Check App Store Connect configuration{'\n'}
            • If auth fails: Re-login to the app{'\n'}
            • If endpoint fails: Check network connection{'\n'}
            • If database fails: Check Supabase RLS policies
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  lastRun: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  controlsSection: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'white',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  resultsSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  summaryBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  testCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  testIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  testName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  testMessage: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  testError: {
    fontSize: theme.typography.fontSize.sm,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  testData: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.sm,
  },
  testDataTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  testDataContent: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
  },
  instructionsSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    marginTop: theme.spacing.lg,
  },
  instructionCard: {
    backgroundColor: '#F0F9FF',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  instructionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

export default StoreKitTestScreen;