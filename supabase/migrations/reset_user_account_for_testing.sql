-- Reset specific user account for testing
-- Replace '126fb60e-02b6-408d-a3b2-f3f71b388c1a' with your user ID

-- Reset user profile stats
UPDATE profiles 
SET 
  level = 1,
  current_xp = 0,
  total_xp = 0,
  tasks_completed = 0,
  goals_completed = 0,
  streak = 0,
  title = 'E-Rank Awakened',
  updated_at = NOW()
WHERE id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

-- Reset system quests to incomplete
UPDATE system_quests 
SET 
  is_completed = false,
  last_completed = null,
  next_due = CASE 
    WHEN title = 'Daily Journal Entry' THEN CURRENT_DATE
    WHEN title = 'Weekly Goal Setting' THEN CURRENT_DATE + INTERVAL '7 days'
    WHEN title = 'Core Values Reflection' THEN CURRENT_DATE + INTERVAL '30 days'
    WHEN title = 'Weekly Achievement' THEN CURRENT_DATE + INTERVAL '7 days'
    ELSE next_due
  END,
  updated_at = NOW()
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

-- Reset daily tasks to incomplete
UPDATE daily_tasks 
SET 
  completed = false,
  completed_at = null,
  can_undo = false,
  undo_expires_at = null,
  updated_at = NOW()
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

-- Reset all tasks to incomplete
UPDATE tasks 
SET 
  is_completed = false,
  completed_at = null,
  updated_at = NOW()
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

-- Delete AI generated quests (they expire anyway)
DELETE FROM ai_generated_quests 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

-- Show reset results
SELECT 
  'Profile Reset' as reset_type,
  level,
  current_xp,
  total_xp,
  tasks_completed,
  goals_completed,
  streak,
  title
FROM profiles 
WHERE id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

SELECT 
  'System Quests Reset' as reset_type,
  title,
  is_completed,
  next_due
FROM system_quests 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

SELECT 
  'Daily Tasks Reset' as reset_type,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks
FROM daily_tasks 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a';

SELECT 
  'Tasks Reset' as reset_type,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_tasks
FROM tasks 
WHERE user_id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a'; 