import { SUPABASE_URL as envUrl, SUPABASE_ANON_KEY as envKey, API_BASE_URL as envApi } from '@env';

export const SUPABASE_URL = envUrl || 'https://jodthhltepjoepeaoano.supabase.co';
export const SUPABASE_ANON_KEY = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZHRoaGx0ZXBqb2VwZWFvYW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTA3MzQsImV4cCI6MjA5OTU4NjczNH0.7jMsMnaA4p7iUtqtBg1UZWCrjN3hX5Y_Of16JYge8U8';
export const API_BASE_URL = envApi || 'https://gym-app-xtru.onrender.com/api/v1';
