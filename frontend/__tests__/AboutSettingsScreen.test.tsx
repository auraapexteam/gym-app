import React from 'react';
import { Alert, Linking, Share, Text } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { AboutSettingsScreen } from '../src/screens/AboutSettingsScreen';
import { OpenSourceLicensesModal } from '../src/components/OpenSourceLicensesModal';
import notices from '../src/assets/third-party-notices.json';

jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: require('../src/theme/colors').lightColors, isDark: false }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));

let tree: Renderer.ReactTestRenderer;
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.restoreAllMocks();
});

async function press(label: string) {
  const matches = tree.root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');
  if (!matches.length) throw new Error(`Missing action: ${label}`);
  await act(async () => { await matches[0].props.onPress(); });
}

test('About links open real flows and unsupported ratings/build/operator claims are absent', async () => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await act(async () => { tree = Renderer.create(<AboutSettingsScreen />); });
  const labels = tree.root.findAllByType(Text).map((node) => node.props.children);
  expect(labels).not.toContain('Rate on App Store / Play Store');
  expect(labels).not.toContain('Build Number');
  expect(labels).not.toContain('Apex Solutions Ltd');
  expect(labels).not.toContain('© 2026 Aura Gyms');

  await press('Visit Aura Apex website');
  expect(Linking.openURL).toHaveBeenCalledWith('https://www.auraapex.in');
  await press('Share Aura Apex website');
  expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('https://www.auraapex.in') }));
  await press('Open source licenses');
  expect(tree.root.findByType(OpenSourceLicensesModal).props.visible).toBe(true);
  await press('Close licenses');
  expect(tree.root.findByType(OpenSourceLicensesModal).props.visible).toBe(false);
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('license viewer displays full packaged text and returns to the list before closing', async () => {
  const close = jest.fn();
  await act(async () => { tree = Renderer.create(<OpenSourceLicensesModal visible onClose={close} />); });
  const entry = notices.packages.find((item) => item.name === '@react-navigation/bottom-tabs')!;
  expect(entry.files.length).toBeGreaterThan(0);
  await press(`${entry.name} ${entry.version} license`);
  const displayed = tree.root.findAllByType(Text).map((node) => node.props.children);
  expect(displayed).toContain(entry.files[0].text);
  expect(displayed).toContain(entry.files[0].file);
  await press('Back to license list');
  expect(tree.root.findAllByType(Text).some((node) => node.props.children === notices.coverage)).toBe(true);
  await press('Close licenses');
  expect(close).toHaveBeenCalledTimes(1);
});

test('packages missing a bundled license file are identified without invented text', async () => {
  await act(async () => { tree = Renderer.create(<OpenSourceLicensesModal visible onClose={jest.fn()} />); });
  const entry = notices.packages.find((item) => item.name === '@react-native/new-app-screen')!;
  expect(entry.files).toHaveLength(0);
  await press(`${entry.name} ${entry.version} license`);
  expect(tree.root.findAllByType(Text).some((node) => typeof node.props.children === 'string'
    && node.props.children.includes('not the full license text'))).toBe(true);
});
