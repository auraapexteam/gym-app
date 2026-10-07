import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

type Credentials = { password: string } | false;
interface KeychainStorage {
  getGenericPassword: (options: { service: string }) => Promise<Credentials>;
  setGenericPassword: (username: string, password: string, options: { service: string; accessible: Keychain.ACCESSIBLE }) => Promise<unknown>;
  resetGenericPassword: (options: { service: string }) => Promise<boolean>;
}
interface LegacyStorage {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
}

/** Project-scoped SDK auth entries only. Ordinary app preferences stay in AsyncStorage. */
export function createSecureAuthStorage(authKey: string, keychain: KeychainStorage = Keychain, legacy: LegacyStorage = AsyncStorage) {
  const allowed = new Set([authKey, `${authKey}-code-verifier`, `${authKey}-user`]);
  let pending: Promise<unknown> = Promise.resolve();
  let migrated = false;
  const options = (key: string) => {
    if (!allowed.has(key)) throw new Error('Unexpected authentication storage key.');
    return { service: `in.auraapex.auth.${key}` };
  };
  const serial = <T>(key: string, work: () => Promise<T>): Promise<T> => {
    options(key);
    const next = pending.catch(() => {}).then(work);
    pending = next.catch(() => {});
    return next;
  };
  const write = async (key: string, value: string) => {
    const stored = await keychain.setGenericPassword('supabase-session', value, {
      ...options(key), accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (!stored) throw new Error('Secure credential storage did not confirm the write.');
    // Write first, then erase legacy plaintext. A failed migration never pretends
    // to succeed or silently falls back to a new plaintext session.
    await legacy.removeItem(key);
  };
  const migrateLegacyEntries = async () => {
    if (migrated) return;
    for (const key of allowed) {
      const stored = await keychain.getGenericPassword(options(key));
      if (stored) await legacy.removeItem(key);
      else {
        const old = await legacy.getItem(key);
        if (old != null) await write(key, old);
      }
    }
    migrated = true;
  };
  return {
    getItem: (key: string): Promise<string | null> => serial(key, async () => {
      await migrateLegacyEntries();
      const stored = await keychain.getGenericPassword(options(key));
      if (stored) { await legacy.removeItem(key); return stored.password; }
      return null;
    }),
    setItem: (key: string, value: string): Promise<void> => serial(key, async () => {
      await migrateLegacyEntries();
      await write(key, value);
    }),
    removeItem: (key: string): Promise<void> => serial(key, async () => {
      let wasStored: boolean | undefined;
      try { wasStored = !!(await keychain.getGenericPassword(options(key))); } catch { /* reset can still succeed */ }
      const results = await Promise.allSettled([keychain.resetGenericPassword(options(key)), legacy.removeItem(key)]);
      if (results.some(result => result.status === 'rejected') ||
        (results[0].status === 'fulfilled' && !results[0].value && wasStored !== false)) {
        throw new Error('Saved credentials could not be fully cleared.');
      }
    }),
  };
}
