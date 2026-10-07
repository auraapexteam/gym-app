import 'react-native-url-polyfill/auto';
import React from 'react';
import { Alert, Linking, Platform, TouchableOpacity } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { AppleSignInButton } from '../src/components/AppleSignInButton';
import { completeOAuthCallback } from '../src/api/oauthCallback';
import { supabase } from '../src/api/supabase';
import { useAuthStore } from '../src/store/useAuthStore';

jest.mock('../src/store/useAuthStore', () => ({ useAuthStore: { getState: () => ({
  beginOAuthSignIn: mockBeginOAuthSignIn, cancelOAuthSignIn: mockCancelOAuthSignIn,
}) } }));
const mockBeginOAuthSignIn = jest.fn(() => 123);
const mockCancelOAuthSignIn = jest.fn();

jest.mock('../src/api/supabase', () => ({ supabase: { auth: {
  signInWithOAuth: jest.fn(), setSession: jest.fn(), exchangeCodeForSession: jest.fn(),
} } }));

let tree: Renderer.ReactTestRenderer | undefined;
beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  if (tree) act(() => tree!.unmount());
  tree = undefined;
  jest.restoreAllMocks();
});

test('starts Apple OAuth through Supabase and opens its HTTPS URL', async () => {
  (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://example.test/auth' }, error: null });
  await act(async () => { tree = Renderer.create(<AppleSignInButton />); });
  await act(async () => { await tree!.root.findByType(TouchableOpacity).props.onPress(); });
  expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'apple', options: {
    redirectTo: 'auraapex://login-callback', skipBrowserRedirect: true,
  } });
  expect(Linking.openURL).toHaveBeenCalledWith('https://example.test/auth');
  expect(useAuthStore.getState().beginOAuthSignIn).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().cancelOAuthSignIn).not.toHaveBeenCalled();
});

test.each([
  { data: { url: null }, error: { message: 'provider disabled' } },
  { data: { url: 'http://example.test/auth' }, error: null },
])('reports unavailable provider/unsafe URL without opening it', async (result) => {
  (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue(result);
  await act(async () => { tree = Renderer.create(<AppleSignInButton />); });
  await act(async () => { await tree!.root.findByType(TouchableOpacity).props.onPress(); });
  expect(Linking.openURL).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Apple Sign-In unavailable', expect.any(String));
  expect(useAuthStore.getState().cancelOAuthSignIn).toHaveBeenCalledWith(123);
});

test.each(['https://login-callback#access_token=a&refresh_token=b', 'auraapex://other#access_token=a&refresh_token=b', 'auraapex://login-callback/other?code=x'])('ignores unrelated callback %s', async (url) => {
  expect(await completeOAuthCallback(url)).toBeNull();
  expect(supabase.auth.setSession).not.toHaveBeenCalled();
  expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
});

test('handles the existing token callback without truncating encoded tokens', async () => {
  const session = { access_token: 'test' };
  (supabase.auth.setSession as jest.Mock).mockResolvedValue({ data: { session }, error: null });
  expect(await completeOAuthCallback('auraapex://login-callback#access_token=a%3Db&refresh_token=c')).toBe(session);
  expect(supabase.auth.setSession).toHaveBeenCalledWith({ access_token: 'a=b', refresh_token: 'c' });
});

test('exchanges a PKCE callback code when provided', async () => {
  const session = { access_token: 'test' };
  (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({ data: { session }, error: null });
  expect(await completeOAuthCallback('auraapex://login-callback?code=test-code')).toBe(session);
});

test('provider cancellation is not reported as successful authentication', async () => {
  await expect(completeOAuthCallback('auraapex://login-callback#error=access_denied')).rejects.toThrow('cancelled');
  expect(supabase.auth.setSession).not.toHaveBeenCalled();
});

test('rejected sessions are not accepted', async () => {
  (supabase.auth.setSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: { message: 'invalid' } });
  await expect(completeOAuthCallback('auraapex://login-callback#access_token=a&refresh_token=b')).rejects.toThrow('could not be completed');
});
