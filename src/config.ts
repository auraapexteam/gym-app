import { Platform } from 'react-native';

export const SUPABASE_URL = 'https://nlhbhvafzpnagxfyhekc.supabase.co';

// Put your Supabase public Anon key here
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// For Android emulator, 10.0.2.2 connects to your computer's localhost.
// For iOS simulator, use localhost.
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
