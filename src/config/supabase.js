import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jrvzylrrqsvmkocdraav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impydnp5bHJycXN2bWtvY2RyYWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODE5NjksImV4cCI6MjA1OTk1Nzk2OX0.D3ibkw4tcbWGnpVsVoGSWRu-Fy5yZ97uvzcvQOAiMvw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);