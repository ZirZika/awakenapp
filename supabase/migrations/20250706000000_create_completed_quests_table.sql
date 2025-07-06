-- Migration: Create completed_quests table
-- This table tracks all completed quests across all types (system, story, AI, daily)

CREATE TABLE IF NOT EXISTS completed_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Epic')) NOT NULL,
  category TEXT NOT NULL,
  quest_type TEXT CHECK (quest_type IN ('system', 'story', 'ai', 'daily')) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_completed_quests_user_id ON completed_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_quests_completed_at ON completed_quests(completed_at);
CREATE INDEX IF NOT EXISTS idx_completed_quests_quest_type ON completed_quests(quest_type);

-- Add RLS policies
ALTER TABLE completed_quests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own completed quests
CREATE POLICY "Users can view own completed quests" ON completed_quests
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own completed quests
CREATE POLICY "Users can insert own completed quests" ON completed_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own completed quests
CREATE POLICY "Users can update own completed quests" ON completed_quests
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own completed quests
CREATE POLICY "Users can delete own completed quests" ON completed_quests
  FOR DELETE USING (auth.uid() = user_id); 