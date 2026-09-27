import { supabase } from './supabase';

/** Accept sessions only from our login callback, never unrelated deep links. */
export async function completeOAuthCallback(value: string | null) {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'auraapex:' || url.hostname !== 'login-callback' ||
      url.username || url.password || url.port || (url.pathname && url.pathname !== '/')) {
    return null;
  }
  const params = new URLSearchParams(url.hash ? url.hash.slice(1) : url.search.slice(1));
  if (params.has('error') || params.has('error_code')) {
    throw new Error('Sign-in was cancelled or could not be completed. Please try again.');
  }
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');
  if (!code && !(accessToken && refreshToken)) return null;

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });
  if (result.error || !result.data.session) {
    throw new Error('Sign-in could not be completed. Please try again.');
  }
  return result.data.session;
}
