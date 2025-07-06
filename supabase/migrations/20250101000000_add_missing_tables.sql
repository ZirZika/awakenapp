-- Migration: Add missing tables for complete save system
-- This migration adds the tables needed to persist all user data

-- Daily Tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  can_undo BOOLEAN DEFAULT FALSE,
  undo_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Todos table
CREATE TABLE IF NOT EXISTS personal_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  category TEXT NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Quests table
CREATE TABLE IF NOT EXISTS system_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once')) NOT NULL,
  xp_reward INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Epic')) NOT NULL,
  category TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  last_completed TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Generated Quests table
CREATE TABLE IF NOT EXISTS ai_generated_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Epic')) NOT NULL,
  category TEXT NOT NULL,
  reasoning TEXT,
  estimated_duration TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_quests ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage own daily tasks" ON daily_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own personal todos" ON personal_todos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own system quests" ON system_quests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ai generated quests" ON ai_generated_quests
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_completed ON daily_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_personal_todos_user_id ON personal_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_todos_completed ON personal_todos(completed);
CREATE INDEX IF NOT EXISTS idx_personal_todos_due_date ON personal_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_system_quests_user_id ON system_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_system_quests_frequency ON system_quests(frequency);
CREATE INDEX IF NOT EXISTS idx_ai_generated_quests_user_id ON ai_generated_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_quests_expires_at ON ai_generated_quests(expires_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_todos_updated_at BEFORE UPDATE ON personal_todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_quests_updated_at BEFORE UPDATE ON system_quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generated_quests_updated_at BEFORE UPDATE ON ai_generated_quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 