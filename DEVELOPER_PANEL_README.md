# 🛠️ Developer Panel System

A comprehensive role-based testing and debugging system for the LevelUpLife app.

## 🎯 Overview

The Developer Panel provides developers and admins with powerful tools to test features, debug issues, and manage account states without affecting production data.

## 🚀 Quick Setup

### 1. Run Database Migration
First, run the role migration in your Supabase SQL Editor:

```sql
-- Run the migration file: supabase/migrations/20250630000000_add_user_roles.sql
```

### 2. Set Up Developer Account
Update your account to have developer permissions:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET 
  role = 'developer',
  developer_permissions = '{
    "reset_account": true,
    "add_xp": true,
    "set_level": true,
    "set_streak": true,
    "reset_timers": true,
    "generate_test_data": true,
    "clear_data": true,
    "view_sensitive_data": true,
    "debug_mode": true,
    "component_ids": true
  }'::jsonb
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### 3. Access Developer Panel
1. Log into your app
2. Go to Settings
3. You'll see a new "Developer Tools" section
4. Tap "Developer Panel"

## 🎮 Features

### Account Management
- **Reset to Beginner**: Clear all progress and start fresh
- **Generate Test Data**: Create sample goals, tasks, and journal entries
- **Clear All Data**: Delete all user data (irreversible)

### XP & Level Management
- **Add XP**: Instantly add experience points
- **Set Level**: Jump to any level (1-100)
- **Set Streak**: Modify daily streak count

### Timer Management
- **Reset All Timers**: Stop and reset all active timers
- **Set Timer Duration**: Change timer durations for all timed tasks

### Component Debugging
- **Show Component IDs**: Display component identifiers throughout the app
- **Component Registry**: View all registered components

### Data & Debug
- **View Sensitive Data**: Show user IDs, emails, and role information
- **Debug Mode**: Enable additional logging and debugging features
- **Database Connection Test**: Verify database connectivity

### Admin Tools (Admin Role Only)
- **View All Users**: Access user management (future feature)
- **System Statistics**: View app analytics (future feature)
- **Database Backup**: Backup functionality (future feature)

## 🔐 Role System

### User Roles
- **user**: Regular app user (default)
- **developer**: Access to developer tools and testing features
- **admin**: Full system access including admin tools

### Permissions
Each role has specific permissions stored as JSON:

```json
{
  "reset_account": true,
  "add_xp": true,
  "set_level": true,
  "set_streak": true,
  "reset_timers": true,
  "generate_test_data": true,
  "clear_data": true,
  "view_sensitive_data": true,
  "debug_mode": true,
  "component_ids": true
}
```

## 🧩 Component ID System

### Adding Component IDs to Your Components

Wrap your components with the `ComponentIdDisplay`:

```tsx
import ComponentIdDisplay from '@/components/ComponentIdDisplay';

export default function MyComponent() {
  return (
    <View style={styles.container}>
      {/* Your component content */}
      
      <ComponentIdDisplay
        componentId="my-component"
        componentName="My Component"
        position="bottom-right"
      />
    </View>
  );
}
```

### Component ID Positions
- `top-left`: Top left corner
- `top-right`: Top right corner
- `bottom-left`: Bottom left corner
- `bottom-right`: Bottom right corner (default)

## 🛠️ Development Workflow

### Testing New User Experience
1. Use "Reset to Beginner" to start fresh
2. Test onboarding flow
3. Verify initial state

### Testing XP System
1. Use "Add XP" to test level progression
2. Use "Set Level" to test high-level features
3. Use "Set Streak" to test streak-based features

### Testing Timers
1. Create timed tasks
2. Use "Reset All Timers" to test timer states
3. Use "Set Timer Duration" to test different durations

### Debugging Issues
1. Enable "Show Component IDs" to identify components
2. Use "View Sensitive Data" to check user state
3. Enable "Debug Mode" for additional logging

## 🔧 Technical Implementation

### Files Created/Modified
- `supabase/migrations/20250630000000_add_user_roles.sql` - Database migration
- `components/DeveloperPanel.tsx` - Main developer panel component
- `components/ComponentIdDisplay.tsx` - Component ID display system
- `hooks/useUserRole.ts` - Role management hook
- `types/database.ts` - Updated with role types
- `types/app.ts` - Added UserProfile interface
- `app/settings.tsx` - Added developer panel integration
- `app/(auth)/signup.tsx` - Updated with role field

### Key Hooks
```tsx
import { useUserRole } from '@/hooks/useUserRole';

const { 
  userProfile, 
  isDeveloper, 
  isAdmin, 
  hasDeveloperPermission,
  hasAdminPermission 
} = useUserRole();
```

### Role Checking
```tsx
// Check if user is developer
if (isDeveloper()) {
  // Show developer features
}

// Check specific permissions
if (hasDeveloperPermission('reset_account')) {
  // Show reset account button
}
```

## 🚨 Security Considerations

- Developer panel is only visible to users with developer/admin roles
- All actions are logged for audit purposes
- Sensitive data is only shown when explicitly enabled
- Database operations use proper RLS policies

## 🐛 Troubleshooting

### Developer Panel Not Showing
1. Check if you have the correct role: `SELECT role FROM profiles WHERE id = 'your-user-id'`
2. Verify permissions: `SELECT developer_permissions FROM profiles WHERE id = 'your-user-id'`
3. Ensure the migration was run successfully

### Component IDs Not Showing
1. Check if you have the `component_ids` permission
2. Verify the `ComponentIdDisplay` is properly imported and used
3. Check if the component is wrapped correctly

### Database Errors
1. Ensure all migrations have been run
2. Check RLS policies are properly configured
3. Verify user permissions in the database

## 📝 Future Enhancements

- [ ] User management interface for admins
- [ ] System statistics dashboard
- [ ] Automated testing tools
- [ ] Performance monitoring
- [ ] Real-time debugging tools
- [ ] API testing interface
- [ ] Database schema viewer
- [ ] Log viewer and analyzer

## 🤝 Contributing

When adding new developer tools:

1. Add the permission to the database migration
2. Update the `DeveloperPanel` component
3. Add proper error handling and logging
4. Test thoroughly before committing
5. Update this README with new features

---

**Note**: This system is for development and testing purposes only. Never deploy with developer accounts in production. 