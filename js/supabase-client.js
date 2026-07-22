import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://lqtijgsljrlunakxqmfz.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Xn7aTwN-dLd6ggMrOh7rLQ_AZB1wtqC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);