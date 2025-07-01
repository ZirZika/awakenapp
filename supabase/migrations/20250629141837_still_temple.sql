/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add policy to allow users to insert their own profile during signup
    - Ensures users can only create a profile with their own auth.uid()

  This fixes the RLS violation error that prevents new user registration.
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);