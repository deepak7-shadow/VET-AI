import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mlmilvhgicvxjarfgpyj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_OR3xjLxyJY9CqIszOuzojQ_WAhMJ7-O';

export const supabase = createClient(supabaseUrl, supabaseKey);
