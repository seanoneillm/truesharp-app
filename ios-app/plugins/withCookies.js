const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to configure @react-native-cookies/cookies for iOS
 * Package should already be installed via package.json
 */
const withCookies = (config) => {
  // Only configure the package, don't install it during build
  // The package should already be installed via package.json
  console.log('Configuring @react-native-cookies/cookies for iOS...');

  return config;
};

module.exports = withCookies;