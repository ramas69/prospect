/*
  # Ajout des colonnes pour les données Google Sheet

  1. Modifications
    - Ajoute `sheet_file_name` (text) - pour stocker le nom du fichier Google Sheet
    - Ajoute `sheet_data_base64` (text) - pour stocker les données du Google Sheet en format base64
  
  2. Notes
    - Ces colonnes permettent de sauvegarder le nom du fichier et les données complètes du scraping
    - Le format base64 permet de stocker les données de manière sécurisée et compacte
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraping_sessions' AND column_name = 'sheet_file_name'
  ) THEN
    ALTER TABLE scraping_sessions ADD COLUMN sheet_file_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraping_sessions' AND column_name = 'sheet_data_base64'
  ) THEN
    ALTER TABLE scraping_sessions ADD COLUMN sheet_data_base64 text;
  END IF;
END $$;
