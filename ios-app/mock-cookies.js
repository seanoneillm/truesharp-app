/**
 * Mock implementation of @react-native-cookies/cookies for Expo Go
 * This is needed because the native module doesn't work in Expo Go
 */

const mockCookies = {
  getFromResponse: () => Promise.resolve({}),
  get: () => Promise.resolve({}),
  set: () => Promise.resolve(true),
  clearAll: () => Promise.resolve(true),
  flush: () => Promise.resolve(true),
  clearByName: () => Promise.resolve(true),
  getAll: () => Promise.resolve({}),
}

export default mockCookies
