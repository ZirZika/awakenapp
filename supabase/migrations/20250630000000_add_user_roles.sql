/*
  # Add User Roles and Permissions System

  1. Database Changes
    - Add role field to profiles table with enum values: 'user', 'developer', 'admin'
    - Add developer_permissions field to store specific developer permissions
    - Add admin_permissions field to store specific admin permissions

  2. Security Changes
    - Add policies for role-based access control
    - Developers can access developer tools and debug features
    - Admins have full system access

  This enables role-based testing and development features.
*/

-- Add role enum type
CREATE TYPE user_role AS ENUM ('user', 'developer', 'admin');

-- Add role and permissions fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS developer_permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '{}';

-- Update existing profiles to have 'user' role (if any exist)
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Make role field NOT NULL after setting defaults
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;

-- Add indexes for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add RLS policies for role-based access
-- Developers can read all profiles for debugging
CREATE POLICY "Developers can read all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('developer', 'admin')
    )
  );

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Function to check if user has developer permissions
CREATE OR REPLACE FUNCTION has_developer_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('developer', 'admin')
    AND (
      developer_permissions->permission = 'true'::jsonb 
      OR admin_permissions->permission = 'true'::jsonb
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin permissions
CREATE OR REPLACE FUNCTION has_admin_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'admin'
    AND admin_permissions->permission = 'true'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 