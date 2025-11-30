// Simple debugging index.ts file
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'

console.log('🚀 Index.ts loaded')

// Check if Buffer is available before importing
if (typeof global.Buffer === 'undefined') {
  try {
    const { Buffer } = require('buffer')
    global.Buffer = Buffer
    console.log('✅ Buffer polyfill loaded successfully')
  } catch (error) {
    console.warn('❌ Failed to load Buffer polyfill:', error)
  }
}

try {
  const { registerRootComponent } = require('expo')
  console.log('✅ Expo registerRootComponent loaded')

  const App = require('./App').default
  console.log('✅ App component loaded')

  registerRootComponent(App)
  console.log('✅ App registered successfully')
} catch (error) {
  console.error('❌ Failed to load and register app:', error)

  // Fallback registration
  try {
    const { AppRegistry } = require('react-native')
    const App = require('./App').default
    AppRegistry.registerComponent('main', () => App)
    console.log('✅ Fallback registration successful')
  } catch (fallbackError) {
    console.error('❌ Fallback registration also failed:', fallbackError)
  }
}
