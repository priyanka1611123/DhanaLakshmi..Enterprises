import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL 
  || 'https://qvktgmrobmcamgtlcdvx.supabase.co';

const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY 
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a3RnbXJvYm1jYW1ndGxjZHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDMzMzgsImV4cCI6MjA5MzI3OTMzOH0.nlTwrv1GrJ1zPSr24wXTRLx_p-YIyQOsuKe-cC-0gJs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
