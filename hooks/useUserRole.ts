import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { UserProfile } from '@/types/app';

export function useUserRole() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: 'user' | 'developer' | 'admin') => {
    return userProfile?.role === role;
  };

  const hasDeveloperPermission = (permission: string) => {
    if (!userProfile) return false;
    
    return (
      userProfile.role === 'developer' || 
      userProfile.role === 'admin' ||
      userProfile.developer_permissions?.[permission] === true ||
      userProfile.admin_permissions?.[permission] === true
    );
  };

  const hasAdminPermission = (permission: string) => {
    if (!userProfile) return false;
    
    return (
      userProfile.role === 'admin' &&
      userProfile.admin_permissions?.[permission] === true
    );
  };

  const isDeveloper = () => {
    return userProfile?.role === 'developer' || userProfile?.role === 'admin';
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin';
  };

  const updateUserRole = async (newRole: 'user' | 'developer' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh the profile
      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  const updateDeveloperPermissions = async (permissions: Record<string, boolean>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ developer_permissions: permissions })
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh the profile
      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error('Error updating developer permissions:', error);
      return false;
    }
  };

  const updateAdminPermissions = async (permissions: Record<string, boolean>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_permissions: permissions })
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh the profile
      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      return false;
    }
  };

  return {
    userProfile,
    loading,
    hasRole,
    hasDeveloperPermission,
    hasAdminPermission,
    isDeveloper,
    isAdmin,
    updateUserRole,
    updateDeveloperPermissions,
    updateAdminPermissions,
    refreshProfile: fetchUserProfile,
  };
} 