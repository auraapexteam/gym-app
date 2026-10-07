/* eslint-env jest */
/**
 * Jest environment setup — mocks for native modules that have no JS-only
 * implementation in the test environment.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
jest.mock('react-native-keychain', () => {
  const saved = new Map();
  return {
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly' },
    setGenericPassword: jest.fn(async (username, password, { service }) => {
      saved.set(service, { username, password }); return { service };
    }),
    getGenericPassword: jest.fn(async ({ service }) => saved.get(service) || false),
    resetGenericPassword: jest.fn(async ({ service }) => { saved.delete(service); return true; }),
  };
});

// Reanimated v4's bundled mock still imports the native worklets runtime,
// which cannot load under Jest — a minimal manual mock covers what the
// custom tab bar uses.
jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (component) => component,
    },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: () => ({}),
    withSpring: (value) => value,
    withTiming: (value) => value,
    withRepeat: (value) => value,
    interpolate: () => 0,
    interpolateColor: () => 'transparent',
    Extrapolation: { CLAMP: 'clamp' },
  };
});

jest.mock('react-native-camera-kit', () => ({ Camera: () => null }));

jest.mock('react-native-razorpay', () => ({ open: jest.fn() }));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn().mockResolvedValue({ didCancel: true }),
}));
