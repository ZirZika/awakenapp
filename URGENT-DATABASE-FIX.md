# 🚨 URGENT: Fix Profile Insert Policy

## The Problem
You're getting this error when signing up:
```
new row violates row-level security policy for table "profiles"
```

This means your Supabase database is missing the policy that allows users to create their own profiles.

## The Solution - DO THIS NOW:

### Step 1: Go to Supabase Dashboard
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `qxulobxfsjulqhonffyg`
3. Click "SQL Editor" in the left sidebar

### Step 2: Run This SQL Code
Copy and paste this EXACT SQL code into the SQL Editor:

```sql
-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Step 3: Execute
1. Click the "Run" button
2. You should see "Success. No rows returned"

### Step 4: Test
1. Go back to your app
2. Try signing up again
3. It should work now!

## What This Does
This policy allows authenticated users to insert a new row in the `profiles` table, but ONLY if the `id` matches their own `auth.uid()`. This is exactly what happens during signup - the user creates their own profile record.

## If You Still Get Errors
If you still get database errors after this, you may need to run the full database setup. Check the `supabase/migrations/setup-instructions.md` file for complete setup instructions.