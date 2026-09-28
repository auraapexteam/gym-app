import React from 'react';
import { Alert, Linking, TouchableOpacity } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { PrivacyPolicyLink, openPrivacyPolicy } from '../src/components/PrivacyPolicyLink';

afterEach(() => jest.restoreAllMocks());

test('opens the approved permanent privacy URL', async () => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => { tree = Renderer.create(<PrivacyPolicyLink />); });
  await act(async () => { await tree.root.findByType(TouchableOpacity).props.onPress(); });
  expect(Linking.openURL).toHaveBeenCalledWith('https://auraapex.in/privacy-policy');
  act(() => tree.unmount());
});

test('handles a browser launch failure without crashing', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No browser'));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await openPrivacyPolicy();
  expect(Alert.alert).toHaveBeenCalledWith('Unable to open privacy policy',
    expect.stringContaining('https://auraapex.in/privacy-policy'));
});
