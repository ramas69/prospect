-- Add raw_data column to scraping_results to store full JSON details
ALTER TABLE scraping_results 
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Update RLS policies to allow access to this new column (implied by existing policies usually, but good to be safe if policies restrict columns)
-- (Existing policies are table-level, so no changes needed usually)

-- Comment on column
COMMENT ON COLUMN scraping_results.raw_data IS 'Stores the original full JSON object from the scraper for detailed view';
