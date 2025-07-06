-- Create default system quests for all users
INSERT INTO system_quests (user_id, title, description, frequency, xp_reward, difficulty, category, is_completed, last_completed, next_due)
SELECT 
    p.id as user_id,
    'Daily Journal Entry' as title,
    'Write a journal entry to reflect on your day and track your progress' as description,
    'daily' as frequency,
    50 as xp_reward,
    'Easy' as difficulty,
    'Personal' as category,
    false as is_completed,
    null as last_completed,
    CURRENT_DATE as next_due
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM system_quests sq 
    WHERE sq.user_id = p.id AND sq.title = 'Daily Journal Entry'
);

INSERT INTO system_quests (user_id, title, description, frequency, xp_reward, difficulty, category, is_completed, last_completed, next_due)
SELECT 
    p.id as user_id,
    'Weekly Goal Setting' as title,
    'Create a new goal to work towards this week' as description,
    'weekly' as frequency,
    100 as xp_reward,
    'Medium' as difficulty,
    'Personal' as category,
    false as is_completed,
    null as last_completed,
    CURRENT_DATE + INTERVAL '7 days' as next_due
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM system_quests sq 
    WHERE sq.user_id = p.id AND sq.title = 'Weekly Goal Setting'
);

INSERT INTO system_quests (user_id, title, description, frequency, xp_reward, difficulty, category, is_completed, last_completed, next_due)
SELECT 
    p.id as user_id,
    'Core Values Reflection' as title,
    'Add or update your core values to guide your decisions' as description,
    'monthly' as frequency,
    150 as xp_reward,
    'Medium' as difficulty,
    'Personal' as category,
    false as is_completed,
    null as last_completed,
    CURRENT_DATE + INTERVAL '30 days' as next_due
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM system_quests sq 
    WHERE sq.user_id = p.id AND sq.title = 'Core Values Reflection'
);

INSERT INTO system_quests (user_id, title, description, frequency, xp_reward, difficulty, category, is_completed, last_completed, next_due)
SELECT 
    p.id as user_id,
    'Weekly Achievement' as title,
    'Record a personal achievement or win from this week' as description,
    'weekly' as frequency,
    75 as xp_reward,
    'Easy' as difficulty,
    'Personal' as category,
    false as is_completed,
    null as last_completed,
    CURRENT_DATE + INTERVAL '7 days' as next_due
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM system_quests sq 
    WHERE sq.user_id = p.id AND sq.title = 'Weekly Achievement'
); 