const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules and mock for cookies
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  buffer: require.resolve('buffer'),
  '@react-native-cookies/cookies': path.resolve(__dirname, 'mock-cookies.js'),
};

// Add Node.js polyfills to the resolver
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer'),
  crypto: require.resolve('react-native-get-random-values'),
  stream: require.resolve('readable-stream'),
  url: require.resolve('react-native-url-polyfill'),
  '@react-native-cookies/cookies': path.resolve(__dirname, 'mock-cookies.js'),
};

module.exports = config;