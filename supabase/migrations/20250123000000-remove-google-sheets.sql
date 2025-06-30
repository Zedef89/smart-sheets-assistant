-- Remove Google Sheets columns from user_settings table
ALTER TABLE public.user_settings 
DROP COLUMN IF EXISTS google_sheet_id,
DROP COLUMN IF EXISTS google_sheet_title;