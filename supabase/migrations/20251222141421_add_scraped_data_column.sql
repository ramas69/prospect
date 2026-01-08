/*
  # Ajout de la colonne pour les données scrapées JSON

  1. Modifications
    - Ajoute `scraped_data` (jsonb) - pour stocker les données complètes du scraping au format JSON
  
  2. Notes
    - Cette colonne permet de sauvegarder toutes les données retournées par N8N
    - Le format JSONB permet des requêtes efficaces sur les données
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraping_sessions' AND column_name = 'scraped_data'
  ) THEN
    ALTER TABLE scraping_sessions ADD COLUMN scraped_data jsonb;
  END IF;
END $$;
