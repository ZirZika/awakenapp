-- Comprehensive fix for daily tasks
-- This ensures daily tasks work correctly for all users

-- 1. First, let's see what we're working with
SELECT 
  'Current State Analysis' as section,
  COUNT(*) as total_daily_tasks,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN completed = false THEN 1 END) as incomplete_tasks,
  COUNT(DISTINCT user_id) as unique_users
FROM daily_tasks;

-- 2. Show the current state for your specific user
SELECT 
  'Your Current Daily Tasks' as section,
  title,
  completed,
  completed_at,
  can_undo,
  undo_expires_at,
  created_at
FROM daily_tasks 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a'
ORDER BY created_at DESC;

-- 3. Reset ALL daily tasks to incomplete for ALL users
UPDATE daily_tasks 
SET 
  completed = false,
  completed_at = null,
  can_undo = false,
  undo_expires_at = null,
  updated_at = NOW()
WHERE completed = true;

-- 4. Verify the reset worked
SELECT 
  'After Reset - All Users' as section,
  COUNT(*) as total_daily_tasks,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN completed = false THEN 1 END) as incomplete_tasks,
  COUNT(DISTINCT user_id) as unique_users
FROM daily_tasks;

-- 5. Verify your specific user's tasks
SELECT 
  'Your Tasks After Reset' as section,
  title,
  completed,
  completed_at,
  can_undo,
  undo_expires_at,
  created_at
FROM daily_tasks 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a'
ORDER BY created_at DESC;

-- 6. Check if there are any system quests that need resetting too
SELECT 
  'System Quests Status' as section,
  title,
  is_completed,
  last_completed,
  next_due
FROM system_quests 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a'
ORDER BY created_at DESC; 