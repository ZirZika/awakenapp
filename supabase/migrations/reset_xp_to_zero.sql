-- Reset XP to 0/1000 for all users (or specific user)
UPDATE profiles 
SET 
    current_xp = 0,
    total_xp = 0,
    level = 1,
    title = 'E-Rank Hunter',
    tasks_completed = 0,
    goals_completed = 0,
    streak = 0
WHERE id = '126fb60e-02b6-408d-a3b2-f3f71b388c1a'; -- Replace with your user ID if needed 