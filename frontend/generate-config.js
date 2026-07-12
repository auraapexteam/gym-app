const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const configPath = path.join(__dirname, 'src', 'config.ts');

let supabaseUrl = 'https://nlhbhvafzpnagxfyhekc.supabase.co';
let supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
let apiBaseUrl = 'http://localhost:5000';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key === 'SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_ANON_KEY') supabaseAnonKey = value;
      if (key === 'API_BASE_URL') apiBaseUrl = value;
    }
  });
}

const configContent = `import { Platform } from 'react-native';

export const SUPABASE_URL = '${supabaseUrl}';

// Put your Supabase public Anon key here
export const SUPABASE_ANON_KEY = '${supabaseAnonKey}';

// If you are using a physical device with USB debugging, run:
// adb reverse tcp:5000 tcp:5000
// to route localhost:5000 requests from your device to your computer.
export const API_BASE_URL = '${apiBaseUrl}';
`;

fs.writeFileSync(configPath, configContent, 'utf8');
console.log('Successfully generated frontend/src/config.ts from frontend/.env');
