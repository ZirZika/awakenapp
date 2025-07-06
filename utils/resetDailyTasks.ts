import { supabase } from '@/lib/supabase';

export const resetDailyTasks = async (userId: string) => {
  try {
    // Get all daily tasks for the user
    const { data: tasks, error: fetchError } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching daily tasks:', fetchError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No daily tasks found to reset');
      return;
    }

    // Reset all tasks to incomplete
    const { error: updateError } = await supabase
      .from('daily_tasks')
      .update({
        completed: false,
        completed_at: null,
        can_undo: false,
        undo_expires_at: null,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error resetting daily tasks:', updateError);
    } else {
      console.log(`Successfully reset ${tasks.length} daily tasks to incomplete`);
    }
  } catch (error) {
    console.error('Error in resetDailyTasks:', error);
  }
}; 