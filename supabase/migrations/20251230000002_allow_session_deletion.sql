-- Allow users to delete their own scraping sessions
-- (which will also delete related results due to CASCADE if configured, 
-- or we handle it via policies/triggers)
CREATE POLICY "Users can delete own sessions" 
ON scraping_sessions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Ensure results are deleted when session is deleted (if not already handled by foreign key CASCADE)
-- In our schema, scraping_results.session_id usually has ON DELETE CASCADE.

