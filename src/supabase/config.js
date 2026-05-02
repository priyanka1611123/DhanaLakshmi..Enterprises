// ─────────────────────────────────────────────────────────────
//  DL Enterprises – Supabase Configuration
//
//  STEP 1: Go to https://supabase.com → your project
//  STEP 2: Settings → API
//  STEP 3: Copy "Project URL" and "anon public" key
//  STEP 4: Paste them below
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL      || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
