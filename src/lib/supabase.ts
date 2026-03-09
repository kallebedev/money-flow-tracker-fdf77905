import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://povsckeusphycesxkcvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdnNja2V1c3BoeWNlc3hrY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzM2NTgsImV4cCI6MjA4ODE0OTY1OH0.eI8chR6vh9BVK6i_Dk1OrvQfm8PN82X2L8ScZy3rUQg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
