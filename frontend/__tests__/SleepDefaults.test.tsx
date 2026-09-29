import React from 'react';
import { Alert, Text, TextInput } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { ProgressScreen } from '../src/screens/ProgressScreen';
import { SegmentedTabs } from '../src/components/SegmentedTabs';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { apiClient } from '../src/api/client';

jest.mock('../src/api/client', () => ({ apiClient: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, setTheme: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../src/utils/date', () => ({ todayLocalDateString: () => '2026-09-15' }));

let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
});
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.restoreAllMocks();
});
async function render(sleepLogs: any[] = []) {
  (apiClient.get as jest.Mock).mockImplementation((url: string) => Promise.resolve({
    data: { success: true, data: url === '/progress/month' ? { sleepLogs } : [] },
  }));
  await act(async () => { tree = Renderer.create(<ProgressScreen />); });
}
function quickLog() {
  act(() => tree.root.findByType(SegmentedTabs).props.onTabChange('log'));
}
function input(label: string) {
  return tree.root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label)!;
}
function sleepDisplay() {
  return tree.root.findAllByType(Text).map(node =>
    Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children
  );
}

test('empty sleep displays zero and does not save an invented sleep entry', async () => {
  await render();
  expect(sleepDisplay()).toContain('0h 0m');
  quickLog();
  expect(input('Sleep hours').props.value).toBe('0');
  expect(input('Sleep minutes').props.value).toBe('0');
  expect(input('Sleep hours').props.placeholder).toBe('0');
  expect(input('Sleep minutes').props.placeholder).toBe('0');
  await act(async () => { await tree.root.findByType(PrimaryButton).props.onPress(); });
  expect((apiClient.post as jest.Mock).mock.calls.some(([url]) => url === '/progress/sleep')).toBe(false);
});

test.each([0, 480, 465])('preserves stored sleep duration %i minutes', async duration => {
  await render([{ log_date: '2026-09-15', duration_minutes: duration, quality: 'Good' }]);
  expect(sleepDisplay()).toContain(`${Math.floor(duration / 60)}h ${duration % 60}m`);
  quickLog();
  expect(input('Sleep hours').props.value).toBe(String(Math.floor(duration / 60)));
  expect(input('Sleep minutes').props.value).toBe(String(duration % 60));
});

test('switching to an unlogged day clears the previous sleep values', async () => {
  await render([{ log_date: '2026-09-15', duration_minutes: 465, quality: 'Good' }]);
  // The calendar uses the current month; any day other than 15 is unlogged.
  let day = tree.root.findAllByType(Text).find(node => node.props.children === 1)!;
  while (!day.props.onPress) day = day.parent!;
  act(() => day.props.onPress());
  expect(sleepDisplay()).toContain('0h 0m');
  quickLog();
  expect(input('Sleep hours').props.value).toBe('0');
  expect(input('Sleep minutes').props.value).toBe('0');
});

