// Supabase client (safe for browser use with RLS)
// NOTE: anon/publishable key is meant to be public. Never use service_role in the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://lqtijgsljrlunakxqmfz.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Xn7aTwN-dLd6ggMrOh7rLQ_AZB1wtqC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

