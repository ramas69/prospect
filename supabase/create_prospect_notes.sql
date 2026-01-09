-- Create prospect_notes table
CREATE TABLE IF NOT EXISTS prospect_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES scraping_results(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prospect_notes ENABLE ROW LEVEL SECURITY;

-- Policies (Community Mode: Everyone can view/add, but user_id tracks the author)

DROP POLICY IF EXISTS "Anyone can view notes" ON prospect_notes;
CREATE POLICY "Anyone can view notes"
  ON prospect_notes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert notes" ON prospect_notes;
CREATE POLICY "Anyone can insert notes"
  ON prospect_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON prospect_notes;
CREATE POLICY "Users can delete own notes"
  ON prospect_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure profiles are visible to everyone so we can see who wrote the note
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
