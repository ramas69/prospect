-- Add company enrichment fields from API recherche-entreprises.api.gouv.fr
ALTER TABLE scraping_results
ADD COLUMN IF NOT EXISTS siren text,
ADD COLUMN IF NOT EXISTS siret text,
ADD COLUMN IF NOT EXISTS employee_range text,
ADD COLUMN IF NOT EXISTS revenue bigint,
ADD COLUMN IF NOT EXISTS revenue_year text,
ADD COLUMN IF NOT EXISTS net_income bigint,
ADD COLUMN IF NOT EXISTS company_category text,
ADD COLUMN IF NOT EXISTS naf_code text,
ADD COLUMN IF NOT EXISTS directors jsonb,
ADD COLUMN IF NOT EXISTS enriched_at timestamptz;
