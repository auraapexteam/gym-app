import React from 'react';
import { Alert, Linking, Platform, Switch, Text } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { PrivacySettingsScreen } from '../src/screens/PrivacySettingsScreen';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { LoginScreen } from '../src/screens/LoginScreen';
import { SignupScreen } from '../src/screens/SignupScreen';

jest.mock('../src/api/client', () => ({ apiClient: { post: jest.fn() } }));
jest.mock('../src/api/supabase', () => ({ supabase: { auth: { signInWithOAuth: jest.fn() } } }));

jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: require('../src/theme/colors').darkColors, isDark: true }),
}));
jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: () => ({ user: null, userProfile: null, subscription: null }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let tree: Renderer.ReactTestRenderer;
beforeEach(() => jest.spyOn(Alert, 'alert').mockImplementation(() => {}));
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.restoreAllMocks();
});

function press(label: string) {
  let node: Renderer.ReactTestInstance | null = tree.root.findAllByType(Text)
    .find((item) => item.props.children === label) || null;
  while (node && !node.props.onPress) node = node.parent;
  if (!node) throw new Error(`Missing action: ${label}`);
  const onPress = node.props.onPress;
  act(() => onPress());
}

test('does not offer privacy switches that cannot enforce consent', async () => {
  await act(async () => { tree = Renderer.create(<PrivacySettingsScreen />); });
  expect(tree.root.findAllByType(Switch)).toHaveLength(0);
});

test('Terms opens the permanent terms page instead of a placeholder', async () => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await act(async () => { tree = Renderer.create(<PrivacySettingsScreen />); });
  const action = tree.root.findAll((node) => node.props.accessibilityLabel === 'Terms of service'
    && typeof node.props.onPress === 'function')[0];
  await act(async () => { await action.props.onPress(); });
  expect(Linking.openURL).toHaveBeenCalledWith('https://www.auraapex.in/terms-of-service');
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('account summary does not claim to generate an export', async () => {
  await act(async () => { tree = Renderer.create(<PrivacySettingsScreen />); });
  press('View account summary');
  press('Close summary');
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('deletion requires explicit confirmation', async () => {
  await act(async () => { tree = Renderer.create(<PrivacySettingsScreen />); });
  press('Request account deletion');
  expect(Alert.alert).toHaveBeenCalledWith(
    'Request permanent account deletion?', expect.stringContaining('cannot be undone'),
    expect.arrayContaining([expect.objectContaining({ text: 'Cancel', style: 'cancel' })]),
    expect.any(Object)
  );
});

test('unimplemented notification and translation preferences are not advertised', async () => {
  await act(async () => { tree = Renderer.create(<SettingsScreen navigation={{ navigate: jest.fn() }} />); });
  const labels = tree.root.findAllByType(Text).map((node) => node.props.children);
  expect(labels).not.toContain('Notifications');
  expect(labels).not.toContain('Language preference');
  expect(labels).toContain('Privacy & account deletion');
});

describe.each([LoginScreen, SignupScreen])('%p login options', (Screen) => {
  test.each(['ios', 'android'] as const)('preserves Google and email login (%s)', async (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    await act(async () => {
      tree = Renderer.create(<Screen route={{}} navigation={{ navigate: jest.fn() }} />);
    });
    const labels = tree.root.findAllByType(Text).map((node) => node.props.children);
    expect(labels).toContain('Sign in with Google');
    expect(labels).toContain('Or continue with');
    expect(labels.includes('Sign in with Apple')).toBe(os === 'ios');
    expect(tree.root.findAll((node) => node.props.placeholder === 'Email address').length).toBeGreaterThan(0);
  });
});
