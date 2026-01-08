-- 1. Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add team_id to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE scraping_sessions ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE scraping_results ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- 3. Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for teams
CREATE POLICY "Users can see their team" 
ON teams FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.team_id = teams.id)
);

CREATE POLICY "Owners can update their team" 
ON teams FOR UPDATE 
USING (auth.uid() = owner_id);

-- 5. Update RLS for other tables to support team sharing
-- Scraping Sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON scraping_sessions;
CREATE POLICY "Users can view team sessions" 
ON scraping_sessions FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (team_id IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.team_id = scraping_sessions.team_id))
);

-- Scraping Results
DROP POLICY IF EXISTS "Users can view own results" ON scraping_results;
CREATE POLICY "Users can view team results" 
ON scraping_results FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM scraping_sessions
    WHERE scraping_sessions.id = scraping_results.session_id
    AND (
      scraping_sessions.user_id = auth.uid() OR 
      (scraping_sessions.team_id IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.team_id = scraping_sessions.team_id))
    )
  )
);

-- Update trigger for updated_at on teams
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

