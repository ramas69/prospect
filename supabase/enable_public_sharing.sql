-- ==============================================================================
-- ENABLE GLOBAL SHARING SCRIPT
-- Purpose: Allow ALL authenticated users to see EVERYONE'S scraping data.
-- but ONLY allow modification of their own data.
-- ==============================================================================

-- 1. Enable RLS (Security baseline)
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop "Strict" Policies if they exist (Read AND Write)
-- Sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON scraping_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON scraping_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON scraping_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON scraping_sessions;

-- Results
DROP POLICY IF EXISTS "Users can view own results" ON scraping_results;
DROP POLICY IF EXISTS "Users can insert own results" ON scraping_results;
DROP POLICY IF EXISTS "Users can update own results" ON scraping_results;

-- Templates
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 3. Create "Shared" Read Policies

-- SESSIONS: Everyone can see everything
DROP POLICY IF EXISTS "Anyone can view sessions" ON scraping_sessions;
CREATE POLICY "Anyone can view sessions"
  ON scraping_sessions FOR SELECT
  TO authenticated
  USING (true);

-- RESULTS: Everyone can see everything
DROP POLICY IF EXISTS "Anyone can view results" ON scraping_results;
CREATE POLICY "Anyone can view results"
  ON scraping_results FOR SELECT
  TO authenticated
  USING (true);

-- TEMPLATES: Shared Library
DROP POLICY IF EXISTS "Anyone can view templates" ON templates;
CREATE POLICY "Anyone can view templates"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

-- PROFILES: Community view
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);


-- 4. Maintain Global Write Access (Community Mode)

-- Sessions: Anyone can create/edit sessions
DROP POLICY IF EXISTS "Anyone can insert sessions" ON scraping_sessions;
CREATE POLICY "Anyone can insert sessions"
  ON scraping_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update sessions" ON scraping_sessions;
CREATE POLICY "Anyone can update sessions"
  ON scraping_sessions FOR UPDATE
  USING (true);

-- Results: Anyone can create/edit results
DROP POLICY IF EXISTS "Anyone can insert results" ON scraping_results;
CREATE POLICY "Anyone can insert results"
  ON scraping_results FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update results" ON scraping_results;
CREATE POLICY "Anyone can update results"
  ON scraping_results FOR UPDATE
  USING (true);

-- Templates: Anyone can create/edit templates (Shared Library)
DROP POLICY IF EXISTS "Anyone can insert templates" ON templates;
CREATE POLICY "Anyone can insert templates"
  ON templates FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update templates" ON templates;
CREATE POLICY "Anyone can update templates"
  ON templates FOR UPDATE
  USING (true);

-- Users can only edit THEIR OWN profile (Keep this strict)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==============================================================================
-- END OF SCRIPT
-- Run this in your Supabase SQL Editor to enable Community Mode
-- ==============================================================================
