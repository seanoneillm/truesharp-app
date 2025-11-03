import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { debugValidateTransaction } from '../services/modern-storekit'
import { logger } from '../utils/logger'

export const DebugStoreKit: React.FC = () => {
  const [transactionId, setTransactionId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDebugValidation = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Error', 'Please enter a transaction ID')
      return
    }

    setIsLoading(true)
    try {
      logger.info('🐛 Starting debug validation from UI', {
        transactionId: transactionId.trim(),
        timestamp: new Date().toISOString()
      })

      await debugValidateTransaction(transactionId.trim())
      
      Alert.alert(
        'Debug Test Complete', 
        'Check the console logs for detailed results. Look for logs with timestamps and step indicators.'
      )
    } catch (error) {
      Alert.alert('Debug Error', `Failed to test validation: ${error}`)
      logger.error('🐛 Debug UI error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug StoreKit Validation</Text>
      <Text style={styles.subtitle}>
        Test server validation with a known transaction ID
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter Transaction ID"
        value={transactionId}
        onChangeText={setTransactionId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleDebugValidation}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Validation'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        1. Make a purchase and note the transaction ID from logs{'\n'}
        2. Enter the transaction ID above{'\n'}
        3. Tap "Test Validation" to debug the server flow{'\n'}
        4. Check console logs for detailed step-by-step results
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
})