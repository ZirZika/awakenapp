export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          bio: string | null;
          location: string | null;
          profile_picture: string | null;
          aura_color: 'red' | 'green' | 'blue';
          class: 'warrior' | 'mage' | 'assassin' | 'vagabond' | 'hunter';
          focus_area: 'business' | 'fitness' | 'intelligence';
          focus_goal: string | null;
          level: number;
          current_xp: number;
          total_xp: number;
          tasks_completed: number;
          goals_completed: number;
          streak: number;
          title: string;
          role: 'user' | 'developer' | 'admin';
          developer_permissions: Record<string, any> | null;
          admin_permissions: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          bio?: string | null;
          location?: string | null;
          profile_picture?: string | null;
          aura_color?: 'red' | 'green' | 'blue';
          class?: 'warrior' | 'mage' | 'assassin' | 'vagabond' | 'hunter';
          focus_area?: 'business' | 'fitness' | 'intelligence';
          focus_goal?: string | null;
          level?: number;
          current_xp?: number;
          total_xp?: number;
          tasks_completed?: number;
          goals_completed?: number;
          streak?: number;
          title?: string;
          role?: 'user' | 'developer' | 'admin';
          developer_permissions?: Record<string, any> | null;
          admin_permissions?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          bio?: string | null;
          location?: string | null;
          profile_picture?: string | null;
          aura_color?: 'red' | 'green' | 'blue';
          class?: 'warrior' | 'mage' | 'assassin' | 'vagabond' | 'hunter';
          focus_area?: 'business' | 'fitness' | 'intelligence';
          focus_goal?: string | null;
          level?: number;
          current_xp?: number;
          total_xp?: number;
          tasks_completed?: number;
          goals_completed?: number;
          streak?: number;
          title?: string;
          role?: 'user' | 'developer' | 'admin';
          developer_permissions?: Record<string, any> | null;
          admin_permissions?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          target_date: string | null;
          is_completed: boolean;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          target_date?: string | null;
          is_completed?: boolean;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: string;
          target_date?: string | null;
          is_completed?: boolean;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          title: string;
          description: string;
          xp_reward: number;
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
          is_completed: boolean;
          completed_at: string | null;
          quest_type: 'ai-generated' | 'system' | 'goal-based';
          category: string;
          reasoning: string | null;
          estimated_duration: string | null;
          is_unlocked: boolean;
          unlock_condition: string | null;
          has_timer: boolean;
          timer_duration: number | null;
          is_started: boolean;
          started_at: string | null;
          time_remaining: number | null;
          can_undo: boolean;
          undo_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id?: string | null;
          title: string;
          description: string;
          xp_reward: number;
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
          is_completed?: boolean;
          completed_at?: string | null;
          quest_type: 'ai-generated' | 'system' | 'goal-based';
          category: string;
          reasoning?: string | null;
          estimated_duration?: string | null;
          is_unlocked?: boolean;
          unlock_condition?: string | null;
          has_timer?: boolean;
          timer_duration?: number | null;
          is_started?: boolean;
          started_at?: string | null;
          time_remaining?: number | null;
          can_undo?: boolean;
          undo_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_id?: string | null;
          title?: string;
          description?: string;
          xp_reward?: number;
          difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Epic';
          is_completed?: boolean;
          completed_at?: string | null;
          quest_type?: 'ai-generated' | 'system' | 'goal-based';
          category?: string;
          reasoning?: string | null;
          estimated_duration?: string | null;
          is_unlocked?: boolean;
          unlock_condition?: string | null;
          has_timer?: boolean;
          timer_duration?: number | null;
          is_started?: boolean;
          started_at?: string | null;
          time_remaining?: number | null;
          can_undo?: boolean;
          undo_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
          title: string;
          content: string;
          achievements: string[];
          challenges: string[];
          gratitude: string[];
          tomorrow_goals: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
          title: string;
          content: string;
          achievements?: string[];
          challenges?: string[];
          gratitude?: string[];
          tomorrow_goals?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mood?: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
          title?: string;
          content?: string;
          achievements?: string[];
          challenges?: string[];
          gratitude?: string[];
          tomorrow_goals?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      core_values: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          importance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          importance: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          importance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      personal_achievements: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          date: string;
          significance: 'minor' | 'major' | 'legendary';
          source: 'journal' | 'manual';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          date: string;
          significance: 'minor' | 'major' | 'legendary';
          source?: 'journal' | 'manual';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: string;
          date?: string;
          significance?: 'minor' | 'major' | 'legendary';
          source?: 'journal' | 'manual';
          created_at?: string;
          updated_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          streak: number;
          completed: boolean;
          reminder: string;
          reminder_enabled: boolean;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          streak?: number;
          completed?: boolean;
          reminder: string;
          reminder_enabled?: boolean;
          category: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          streak?: number;
          completed?: boolean;
          reminder?: string;
          reminder_enabled?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      guilds: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          level: number;
          total_xp: number;
          max_members: number;
          captain_id: string;
          rank_names: Record<string, string>;
          join_requirements: {
            power_level?: number;
            hunter_level?: number;
            player_level?: number;
          };
          auto_join: boolean;
          approval_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          level?: number;
          total_xp?: number;
          max_members?: number;
          captain_id: string;
          rank_names?: Record<string, string>;
          join_requirements?: {
            power_level?: number;
            hunter_level?: number;
            player_level?: number;
          };
          auto_join?: boolean;
          approval_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          level?: number;
          total_xp?: number;
          max_members?: number;
          captain_id?: string;
          rank_names?: Record<string, string>;
          join_requirements?: {
            power_level?: number;
            hunter_level?: number;
            player_level?: number;
          };
          auto_join?: boolean;
          approval_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      guild_members: {
        Row: {
          id: string;
          guild_id: string;
          user_id: string;
          rank: string;
          joined_at: string;
          contribution_xp: number;
        };
        Insert: {
          id?: string;
          guild_id: string;
          user_id: string;
          rank: string;
          joined_at?: string;
          contribution_xp?: number;
        };
        Update: {
          id?: string;
          guild_id?: string;
          user_id?: string;
          rank?: string;
          joined_at?: string;
          contribution_xp?: number;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          title: string;
          content: string;
          type: 'system' | 'guild' | 'friend';
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          title: string;
          content: string;
          type: 'system' | 'guild' | 'friend';
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          title?: string;
          content?: string;
          type?: 'system' | 'guild' | 'friend';
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      quest_board: {
        Row: {
          id: string;
          title: string;
          description: string;
          full_description: string;
          xp_reward: number;
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
          category: string;
          requirements: string | null;
          time_limit: number | null;
          max_accepts: number | null;
          current_accepts: number;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          full_description: string;
          xp_reward: number;
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
          category: string;
          requirements?: string | null;
          time_limit?: number | null;
          max_accepts?: number | null;
          current_accepts?: number;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          full_description?: string;
          xp_reward?: number;
          difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Epic';
          category?: string;
          requirements?: string | null;
          time_limit?: number | null;
          max_accepts?: number | null;
          current_accepts?: number;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      quest_board_accepts: {
        Row: {
          id: string;
          quest_id: string;
          user_id: string;
          status: 'accepted' | 'completed' | 'abandoned';
          accepted_at: string;
          completed_at: string | null;
          abandoned_at: string | null;
        };
        Insert: {
          id?: string;
          quest_id: string;
          user_id: string;
          status?: 'accepted' | 'completed' | 'abandoned';
          accepted_at?: string;
          completed_at?: string | null;
          abandoned_at?: string | null;
        };
        Update: {
          id?: string;
          quest_id?: string;
          user_id?: string;
          status?: 'accepted' | 'completed' | 'abandoned';
          accepted_at?: string;
          completed_at?: string | null;
          abandoned_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}