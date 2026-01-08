-- Add status and notes to scraping_results for CRM functionality
ALTER TABLE scraping_results 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'to_contact',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS last_action_at timestamptz DEFAULT now();

-- Update RLS policies to allow updating status and notes
CREATE POLICY "Users can update own results"
  ON scraping_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scraping_sessions
      WHERE scraping_sessions.id = scraping_results.session_id
      AND scraping_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scraping_sessions
      WHERE scraping_sessions.id = scraping_results.session_id
      AND scraping_sessions.user_id = auth.uid()
    )
  );

