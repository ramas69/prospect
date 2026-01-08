-- Add email verification fields to scraping_results
ALTER TABLE scraping_results 
ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS email_last_verified_at timestamptz;

-- Status options: 'unverified', 'valid', 'risky', 'invalid', 'verifying'

