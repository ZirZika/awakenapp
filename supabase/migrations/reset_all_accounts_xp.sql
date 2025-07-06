-- Reset XP to 0/1000 for ALL users
UPDATE profiles 
SET 
    current_xp = 0,
    total_xp = 0,
    level = 1,
    title = 'E-Rank Hunter',
    tasks_completed = 0,
    goals_completed = 0,
    streak = 0; 