import { createSecureAuthStorage } from '../src/api/secureAuthStorage';
import * as Keychain from 'react-native-keychain';

function fixture(key = 'sb-staging-auth-token') {
  const plaintext = new Map<string, string>(); const secure = new Map<string, { password: string }>();
  const events: string[] = [];
  const legacy = {
    getItem: jest.fn(async (name: string) => plaintext.get(name) ?? null),
    removeItem: jest.fn(async (name: string) => { events.push(`remove:${name}`); plaintext.delete(name); }),
  };
  const keychain = {
    getGenericPassword: jest.fn(async ({ service }: { service: string }) => secure.get(service) ?? false as const),
    setGenericPassword: jest.fn(async (_username: string, password: string, options: any) => {
      events.push(`secure:${options.service}`); secure.set(options.service, { password }); return { service: options.service };
    }),
    resetGenericPassword: jest.fn(async ({ service }: { service: string }) => { secure.delete(service); return true; }),
  };
  return { key, plaintext, secure, legacy, keychain, events, storage: createSecureAuthStorage(key, keychain, legacy) };
}

test('first restore migrates all project auth entries securely before deleting plaintext and preserves preferences', async () => {
  const f = fixture();
  const entries = [f.key, `${f.key}-code-verifier`, `${f.key}-user`];
  entries.forEach(key => f.plaintext.set(key, `synthetic:${key}`));
  f.plaintext.set('user-theme', 'dark');
  expect(await f.storage.getItem(f.key)).toBe(`synthetic:${f.key}`);
  for (const key of entries) {
    expect(f.secure.get(`in.auraapex.auth.${key}`)?.password).toBe(`synthetic:${key}`);
    expect(f.plaintext.has(key)).toBe(false);
    expect(f.events.indexOf(`secure:in.auraapex.auth.${key}`)).toBeLessThan(f.events.indexOf(`remove:${key}`));
  }
  expect(f.plaintext.get('user-theme')).toBe('dark');
  expect(f.keychain.setGenericPassword).toHaveBeenCalledWith('supabase-session', expect.any(String), {
    service: expect.any(String), accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await f.storage.getItem(f.key);
  expect(f.keychain.setGenericPassword).toHaveBeenCalledTimes(3);
});

test('new sessions never use plaintext storage, and project keys cannot read another project', async () => {
  const f = fixture();
  await f.storage.setItem(f.key, 'synthetic-rotated-session');
  expect(f.plaintext.size).toBe(0);
  expect(await f.storage.getItem(f.key)).toBe('synthetic-rotated-session');
  expect(() => f.storage.getItem('sb-production-auth-token')).toThrow('Unexpected');
});

test('failed keychain migration retains legacy credentials for retry and propagates the error', async () => {
  const f = fixture(); f.plaintext.set(f.key, 'synthetic-session');
  f.keychain.setGenericPassword.mockRejectedValueOnce(new Error('Locked'));
  await expect(f.storage.getItem(f.key)).rejects.toThrow('Locked');
  expect(f.plaintext.has(f.key)).toBe(true);
  expect(await f.storage.getItem(f.key)).toBe('synthetic-session');
});

test('failed plaintext removal never reports a successful secure migration', async () => {
  const f = fixture(); f.plaintext.set(f.key, 'synthetic-session');
  f.legacy.removeItem.mockRejectedValueOnce(new Error('Legacy storage unavailable'));
  await expect(f.storage.getItem(f.key)).rejects.toThrow('Legacy storage unavailable');
  expect(f.secure.get(`in.auraapex.auth.${f.key}`)?.password).toBe('synthetic-session');
  expect(await f.storage.getItem(f.key)).toBe('synthetic-session');
  expect(f.plaintext.has(f.key)).toBe(false);
});

test('logout attempts both stores when one reset fails and reports incomplete cleanup', async () => {
  const f = fixture(); await f.storage.setItem(f.key, 'synthetic-session');
  f.plaintext.set(f.key, 'legacy');
  f.keychain.resetGenericPassword.mockRejectedValueOnce(new Error('Reset unavailable'));
  await expect(f.storage.removeItem(f.key)).rejects.toThrow('fully cleared');
  expect(f.plaintext.has(f.key)).toBe(false);
  await f.storage.removeItem(f.key);
  expect(f.secure.has(`in.auraapex.auth.${f.key}`)).toBe(false);
});

test('serialized token rotation followed by logout leaves no saved credentials', async () => {
  const f = fixture();
  await Promise.all([f.storage.setItem(f.key, 'first'), f.storage.setItem(f.key, 'rotated'), f.storage.removeItem(f.key)]);
  expect(await f.storage.getItem(f.key)).toBeNull();
});
