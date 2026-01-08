/*
  # Hall Prospects - Complete Database Schema

  ## New Tables
  
  ### 1. `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `total_scraping_count` (integer) - Total number of scraping sessions
  - `total_leads_generated` (integer) - Total leads across all sessions
  - `current_streak` (integer) - Consecutive days with scraping
  - `longest_streak` (integer) - Best streak record
  - `last_scraping_date` (date) - Last activity date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. `scraping_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `google_maps_url` (text) - Original Google Maps link
  - `sector` (text) - Business sector
  - `location` (text) - Geographic location extracted from URL
  - `limit_results` (integer) - Requested number of results
  - `actual_results` (integer) - Actual leads found
  - `emails_found` (integer) - Number of emails discovered
  - `email_notification` (text) - Email for notification
  - `status` (text) - pending, in_progress, completed, failed
  - `progress_percentage` (integer) - 0-100
  - `current_step` (text) - Current processing step
  - `sheet_name` (text) - Google Sheet name
  - `sheet_url` (text) - Google Sheet URL
  - `new_file` (boolean) - Created new file or used existing
  - `file_name` (text) - File name if new
  - `duration_seconds` (integer) - Processing time
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 3. `scraping_results`
  - `id` (uuid, primary key)
  - `session_id` (uuid, references scraping_sessions)
  - `business_name` (text)
  - `address` (text)
  - `phone` (text)
  - `email` (text)
  - `website` (text)
  - `rating` (decimal)
  - `reviews_count` (integer)
  - `category` (text)
  - `created_at` (timestamptz)
  
  ### 4. `templates`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text) - Template name
  - `sector` (text)
  - `location` (text)
  - `limit_results` (integer)
  - `is_favorite` (boolean)
  - `use_count` (integer) - How many times used
  - `last_used_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 5. `badges`
  - `id` (uuid, primary key)
  - `name` (text) - Badge name
  - `description` (text)
  - `icon` (text) - Icon identifier
  - `category` (text) - milestone, achievement, special
  - `requirement_type` (text) - total_leads, scraping_count, streak, etc.
  - `requirement_value` (integer)
  - `created_at` (timestamptz)
  
  ### 6. `user_badges`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `badge_id` (uuid, references badges)
  - `earned_at` (timestamptz)
  
  ### 7. `analytics_daily`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `date` (date)
  - `scraping_count` (integer)
  - `leads_generated` (integer)
  - `emails_found` (integer)
  - `avg_duration_seconds` (integer)
  - `created_at` (timestamptz)
  
  ### 8. `user_settings`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `theme` (text) - light, dark, system
  - `notifications_enabled` (boolean)
  - `email_reports` (boolean) - Weekly email reports
  - `default_limit` (integer)
  - `show_tutorial` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  total_scraping_count integer DEFAULT 0,
  total_leads_generated integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_scraping_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create scraping_sessions table
CREATE TABLE IF NOT EXISTS scraping_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  google_maps_url text NOT NULL,
  sector text NOT NULL,
  location text,
  limit_results integer NOT NULL,
  actual_results integer DEFAULT 0,
  emails_found integer DEFAULT 0,
  email_notification text,
  status text DEFAULT 'pending',
  progress_percentage integer DEFAULT 0,
  current_step text,
  sheet_name text,
  sheet_url text,
  new_file boolean DEFAULT false,
  file_name text,
  duration_seconds integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON scraping_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON scraping_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON scraping_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create scraping_results table
CREATE TABLE IF NOT EXISTS scraping_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scraping_sessions(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  rating decimal,
  reviews_count integer,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scraping_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON scraping_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scraping_sessions
      WHERE scraping_sessions.id = scraping_results.session_id
      AND scraping_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own results"
  ON scraping_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scraping_sessions
      WHERE scraping_sessions.id = scraping_results.session_id
      AND scraping_sessions.user_id = auth.uid()
    )
  );

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sector text NOT NULL,
  location text,
  limit_results integer NOT NULL,
  is_favorite boolean DEFAULT false,
  use_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create analytics_daily table
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  scraping_count integer DEFAULT 0,
  leads_generated integer DEFAULT 0,
  emails_found integer DEFAULT 0,
  avg_duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_daily FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON analytics_daily FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON analytics_daily FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT 'light',
  notifications_enabled boolean DEFAULT true,
  email_reports boolean DEFAULT true,
  default_limit integer DEFAULT 10,
  show_tutorial boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert initial badges
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('Premier Pas', 'Complétez votre premier scraping', 'Rocket', 'milestone', 'scraping_count', 1),
  ('Prospecteur', '10 scraping complétés', 'Target', 'milestone', 'scraping_count', 10),
  ('Expert', '50 scraping complétés', 'Award', 'milestone', 'scraping_count', 50),
  ('Maître', '100 scraping complétés', 'Crown', 'milestone', 'scraping_count', 100),
  ('Collectionneur', '100 leads générés', 'Users', 'achievement', 'total_leads', 100),
  ('Chasseur', '500 leads générés', 'Users', 'achievement', 'total_leads', 500),
  ('Légende', '1000 leads générés', 'Trophy', 'achievement', 'total_leads', 1000),
  ('Régularité', '7 jours consécutifs', 'Flame', 'streak', 'streak', 7),
  ('Détermination', '30 jours consécutifs', 'Zap', 'streak', 'streak', 30),
  ('Email Hunter', '100 emails trouvés', 'Mail', 'achievement', 'emails_found', 100)
ON CONFLICT DO NOTHING;