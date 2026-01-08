import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  total_scraping_count: number;
  total_leads_generated: number;
  current_streak: number;
  longest_streak: number;
  last_scraping_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ScrapingSession = {
  id: string;
  user_id: string;
  google_maps_url: string;
  sector: string;
  location: string | null;
  limit_results: number;
  actual_results: number;
  emails_found: number;
  email_notification: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  current_step: string | null;
  sheet_name: string | null;
  sheet_url: string | null;
  new_file: boolean;
  file_name: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Template = {
  id: string;
  user_id: string;
  name: string;
  sector: string;
  location: string | null;
  limit_results: number;
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
};

export type AnalyticsDaily = {
  id: string;
  user_id: string;
  date: string;
  scraping_count: number;
  leads_generated: number;
  emails_found: number;
  avg_duration_seconds: number;
  created_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  email_reports: boolean;
  default_limit: number;
  show_tutorial: boolean;
  default_sheet_url: string | null;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
};
