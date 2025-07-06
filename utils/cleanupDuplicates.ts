import { supabase } from '@/lib/supabase';

export const cleanupDuplicateDailyTasks = async (userId: string) => {
  try {
    // Get all daily tasks for the user
    const { data: tasks, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching daily tasks:', error);
      return;
    }

    if (!tasks || tasks.length <= 4) {
      console.log('No duplicates found or not enough tasks to clean');
      return;
    }

    // Group tasks by title
    const taskGroups: { [key: string]: any[] } = {};
    tasks.forEach(task => {
      if (!taskGroups[task.title]) {
        taskGroups[task.title] = [];
      }
      taskGroups[task.title].push(task);
    });

    // Find duplicates and keep only the first one
    const tasksToDelete: string[] = [];
    Object.values(taskGroups).forEach(group => {
      if (group.length > 1) {
        // Keep the first task, delete the rest
        const duplicates = group.slice(1);
        duplicates.forEach(task => {
          tasksToDelete.push(task.id);
        });
      }
    });

    if (tasksToDelete.length > 0) {
      console.log(`Deleting ${tasksToDelete.length} duplicate tasks`);
      const { error: deleteError } = await supabase
        .from('daily_tasks')
        .delete()
        .in('id', tasksToDelete);

      if (deleteError) {
        console.error('Error deleting duplicate tasks:', deleteError);
      } else {
        console.log('Successfully cleaned up duplicate tasks');
      }
    }
  } catch (error) {
    console.error('Error in cleanupDuplicateDailyTasks:', error);
  }
}; 