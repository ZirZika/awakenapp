-- Fix daily tasks default state for all users
-- This ensures all daily tasks start as incomplete by default

-- First, let's see the current state
SELECT 
  'Current Daily Tasks State' as info,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN completed = false THEN 1 END) as incomplete_tasks
FROM daily_tasks;

-- Show some examples of completed tasks
SELECT 
  'Sample Completed Tasks' as info,
  user_id,
  title,
  completed,
  completed_at,
  created_at
FROM daily_tasks 
WHERE completed = true 
LIMIT 5;

-- Reset ALL daily tasks to incomplete for ALL users
UPDATE daily_tasks 
SET 
  completed = false,
  completed_at = null,
  can_undo = false,
  undo_expires_at = null,
  updated_at = NOW()
WHERE completed = true;

-- Verify the fix
SELECT 
  'After Fix - Daily Tasks State' as info,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN completed = false THEN 1 END) as incomplete_tasks
FROM daily_tasks;

-- Show that all tasks are now incomplete
SELECT 
  'Sample Tasks After Fix' as info,
  user_id,
  title,
  completed,
  completed_at,
  created_at
FROM daily_tasks 
LIMIT 5; 