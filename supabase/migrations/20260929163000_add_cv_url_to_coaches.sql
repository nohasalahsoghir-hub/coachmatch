-- Migration: Add cv_url to coaches table for coach resumes and certifications
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS cv_url text;
