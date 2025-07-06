-- Add updated_at column to profiles table (trigger already exists)
ALTER TABLE profiles 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); 