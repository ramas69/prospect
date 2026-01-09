-- ==============================================================================
-- DEDUPLICATE RESULTS SCRIPT (CORRIGÉ)
-- Purpose: Remove duplicate scraping results caused by the double-import bug.
-- Keeps the oldest record for each (session_id, business_name).
-- ==============================================================================

DELETE FROM scraping_results
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY session_id, business_name 
             ORDER BY created_at ASC
           ) as r_num
    FROM scraping_results
  ) t
  WHERE t.r_num > 1
);

-- Explanation:
-- 1. Inner query finds duplicates by grouping session_id + business_name
-- 2. ROW_NUMBER tags the first one as 1, duplicates as 2, 3, etc.
-- 3. Outer DELETE removes any row with r_num > 1 (keeping the original)
