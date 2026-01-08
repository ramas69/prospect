-- Add scraping defaults to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS default_sheet_url text,
ADD COLUMN IF NOT EXISTS notification_email text;

