// Critical polyfills must be imported first
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'

// Polyfill Buffer for React Native
import { Buffer } from 'buffer'
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}

// Import Expo registration
import { registerRootComponent } from 'expo'

// Import the main App component
import App from './App'

// Import minimal test
// import './index.minimal.tsx'  // Uncomment to test minimal

// Register the root component
registerRootComponent(App)
