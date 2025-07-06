import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Settings, Crown, Zap, Trophy, Target, Calendar, Plus, Search, UserPlus, MessageCircle, Heart, Share, Award, Flame, Star, Shield, Sword, ChevronDown, Check, Mail } from 'lucide-react-native';
import { UserStats } from '@/types/app';

import ProgressBar from '@/components/ProgressBar';
import GlowingButton from '@/components/GlowingButton';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type TabType = 'feed' | 'friends' | 'guilds' | 'leaderboard';
type LeaderboardType = 'global' | 'friends' | 'guild';

interface Friend {
  id: string;
  username: string;
  level: number;
  powerLevel: number;
  title: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface GuildRank {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface GuildMember {
  id: string;
  username: string;
  level: number;
  powerLevel: number;
  title: string;
  avatar: string;
  isOnline: boolean;
  guildRank: GuildRank;
  joinedAt: string;
}

interface Guild {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  level: number;
  emblem: string;
  isJoined: boolean;
  isLeader?: boolean;
  isViceCaptain?: boolean;
  members?: GuildMember[];
  customRanks?: GuildRank[];
  requirements?: {
    minLevel: number;
    minPowerLevel: number;
  };
  guildPower?: number;
  globalRanking?: number;
}

interface FeedItem {
  id: string;
  type: 'achievement' | 'level_up' | 'quest_complete' | 'guild_join';
  user: {
    username: string;
    avatar: string;
    title: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  xpGained?: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  powerLevel: number;
  level: number;
  title: string;
  avatar: string;
  isCurrentUser?: boolean;
}

export default function SocialScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('guilds');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('global');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add_friend' | 'join_guild' | 'create_guild' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankDropdownVisible, setRankDropdownVisible] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [userStats, setUserStats] = useState<UserStats>({
    level: 25,
    currentXP: 0,
    totalXP: 25000,
    xpToNextLevel: 1000,
    tasksCompleted: 0,
    goalsCompleted: 0,
    streak: 0,
    title: 'A-Rank Warrior',
  });

  // Default guild ranks
  const defaultGuildRanks: GuildRank[] = [
    {
      id: 'member',
      name: 'Member',
      color: '#6b7280',
      permissions: ['view_guild', 'chat']
    },
    {
      id: 'elite',
      name: 'Elite',
      color: '#10b981',
      permissions: ['view_guild', 'chat', 'invite_members']
    },
    {
      id: 'vice_captain',
      name: 'Vice Captain',
      color: '#f59e0b',
      permissions: ['view_guild', 'chat', 'invite_members', 'manage_members', 'moderate']
    },
    {
      id: 'captain',
      name: 'Captain',
      color: '#ef4444',
      permissions: ['all']
    }
  ];

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '1',
      username: 'DragonSlayer99',
      level: 15,
      powerLevel: 15420,
      title: 'B-Rank Guardian',
      avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      isOnline: true,
    },
    {
      id: '2',
      username: 'MysticMage',
      level: 12,
      powerLevel: 12800,
      title: 'C-Rank Hunter',
      avatar: 'https://images.pexels.com/photos/8090138/pexels-photo-8090138.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      isOnline: false,
      lastSeen: '2 hours ago',
    },
    {
      id: '3',
      username: 'ShadowNinja',
      level: 18,
      powerLevel: 18950,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8090140/pexels-photo-8090140.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      isOnline: true,
    },
  ]);

  const [guilds, setGuilds] = useState<Guild[]>([
    {
      id: '1',
      name: 'Shadow Monarchs',
      description: 'Elite guild for the strongest Awakened. We conquer the impossible.',
      memberCount: 45,
      maxMembers: 50,
      level: 25,
      emblem: '👑',
      isJoined: false,
      guildPower: 1250000,
      globalRanking: 1,
      requirements: {
        minLevel: 20,
        minPowerLevel: 20000,
      },
    },
    {
      id: '2',
      name: 'Rising Phoenix',
      description: 'A guild for ambitious hunters ready to rise from the ashes.',
      memberCount: 32,
      maxMembers: 40,
      level: 18,
      emblem: '🔥',
      isJoined: true,
      isLeader: true,
      guildPower: 512000,
      globalRanking: 7,
      customRanks: [
        ...defaultGuildRanks,
        {
          id: 'phoenix_guard',
          name: 'Phoenix Guard',
          color: '#8b5cf6',
          permissions: ['view_guild', 'chat', 'invite_members', 'special_missions']
        }
      ],
      members: [
        {
          id: '1',
          username: 'ShadowWalker',
          level: 25,
          powerLevel: 25000,
          title: 'A-Rank Warrior',
          avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
          isOnline: true,
          guildRank: defaultGuildRanks[3], // Captain
          joinedAt: '2024-01-15'
        },
        {
          id: '2',
          username: 'DragonSlayer99',
          level: 15,
          powerLevel: 15420,
          title: 'B-Rank Guardian',
          avatar: 'https://images.pexels.com/photos/8090138/pexels-photo-8090138.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
          isOnline: true,
          guildRank: defaultGuildRanks[2], // Vice Captain
          joinedAt: '2024-01-20'
        },
        {
          id: '3',
          username: 'MysticMage',
          level: 12,
          powerLevel: 12800,
          title: 'C-Rank Hunter',
          avatar: 'https://images.pexels.com/photos/8090140/pexels-photo-8090140.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
          isOnline: false,
          guildRank: defaultGuildRanks[1], // Elite
          joinedAt: '2024-02-01'
        },
        {
          id: '4',
          username: 'ShadowNinja',
          level: 18,
          powerLevel: 18950,
          title: 'A-Rank Warrior',
          avatar: 'https://images.pexels.com/photos/8090142/pexels-photo-8090142.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
          isOnline: true,
          guildRank: defaultGuildRanks[0], // Member
          joinedAt: '2024-02-10'
        }
      ]
    },
    {
      id: '3',
      name: 'Crystal Guardians',
      description: 'Protectors of the realm, united in strength and honor.',
      memberCount: 28,
      maxMembers: 35,
      level: 15,
      emblem: '💎',
      isJoined: false,
      guildPower: 420000,
      globalRanking: 12,
      requirements: {
        minLevel: 10,
        minPowerLevel: 8000,
      },
    },
  ]);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: '1',
      type: 'level_up',
      user: {
        username: 'DragonSlayer99',
        avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
        title: 'B-Rank Guardian',
      },
      content: 'reached Level 15 and gained the title "B-Rank Guardian"!',
      timestamp: '2 hours ago',
      likes: 12,
      isLiked: false,
      xpGained: 1000,
    },
    {
      id: '2',
      type: 'achievement',
      user: {
        username: 'MysticMage',
        avatar: 'https://images.pexels.com/photos/8090138/pexels-photo-8090138.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
        title: 'C-Rank Hunter',
      },
      content: 'completed the "Master of Elements" achievement!',
      timestamp: '4 hours ago',
      likes: 8,
      isLiked: true,
    },
    {
      id: '3',
      type: 'guild_join',
      user: {
        username: 'ShadowNinja',
        avatar: 'https://images.pexels.com/photos/8090140/pexels-photo-8090140.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
        title: 'A-Rank Warrior',
      },
      content: 'joined the guild "Shadow Monarchs"!',
      timestamp: '6 hours ago',
      likes: 15,
      isLiked: false,
    },
    {
      id: '4',
      type: 'quest_complete',
      user: {
        username: 'CrystalMage',
        avatar: 'https://images.pexels.com/photos/8090142/pexels-photo-8090142.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
        title: 'C-Rank Hunter',
      },
      content: 'completed an Epic quest and gained 500 XP!',
      timestamp: '8 hours ago',
      likes: 6,
      isLiked: false,
      xpGained: 500,
    },
  ]);

  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      username: 'ShadowMonarch',
      powerLevel: 45000,
      level: 45,
      title: 'Shadow Monarch',
      avatar: 'https://images.pexels.com/photos/8090144/pexels-photo-8090144.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 2,
      username: 'DragonEmperor',
      powerLevel: 38500,
      level: 38,
      title: 'S-Rank Sage',
      avatar: 'https://images.pexels.com/photos/8090146/pexels-photo-8090146.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 3,
      username: 'PhoenixQueen',
      powerLevel: 32000,
      level: 32,
      title: 'S-Rank Sage',
      avatar: 'https://images.pexels.com/photos/8090148/pexels-photo-8090148.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 4,
      username: 'IceKing',
      powerLevel: 28750,
      level: 28,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8090150/pexels-photo-8090150.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 5,
      username: 'ShadowWalker',
      powerLevel: 25000,
      level: 25,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      isCurrentUser: true,
    },
  ]);

  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      username: 'ShadowWalker',
      powerLevel: 25000,
      level: 25,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      isCurrentUser: true,
    },
    {
      rank: 2,
      username: 'ShadowNinja',
      powerLevel: 18950,
      level: 18,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8090140/pexels-photo-8090140.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 3,
      username: 'DragonSlayer99',
      powerLevel: 15420,
      level: 15,
      title: 'B-Rank Guardian',
      avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 4,
      username: 'MysticMage',
      powerLevel: 12800,
      level: 12,
      title: 'C-Rank Hunter',
      avatar: 'https://images.pexels.com/photos/8090138/pexels-photo-8090138.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
  ]);

  const [guildLeaderboard, setGuildLeaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      username: 'ShadowWalker',
      powerLevel: 25000,
      level: 25,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      isCurrentUser: true,
    },
    {
      rank: 2,
      username: 'ShadowNinja',
      powerLevel: 18950,
      level: 18,
      title: 'A-Rank Warrior',
      avatar: 'https://images.pexels.com/photos/8090142/pexels-photo-8090142.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 3,
      username: 'DragonSlayer99',
      powerLevel: 15420,
      level: 15,
      title: 'B-Rank Guardian',
      avatar: 'https://images.pexels.com/photos/8090138/pexels-photo-8090138.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
    {
      rank: 4,
      username: 'MysticMage',
      powerLevel: 12800,
      level: 12,
      title: 'C-Rank Hunter',
      avatar: 'https://images.pexels.com/photos/8090140/pexels-photo-8090140.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
  ]);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('type', 'system')
        .eq('is_read', false);
      if (!error && typeof count === 'number') {
        setUnreadMessages(count);
      }
    };
    fetchUnreadCount();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setUserStats({
          level: data.level,
          currentXP: data.current_xp,
          totalXP: data.total_xp,
          xpToNextLevel: (data.level * 1000) - (data.total_xp % 1000),
          tasksCompleted: data.tasks_completed,
          goalsCompleted: data.goals_completed,
          streak: data.streak,
          title: data.title,
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const openModal = (type: 'add_friend' | 'join_guild' | 'create_guild') => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setSearchQuery('');
  };

  const handleLikeFeedItem = (itemId: string) => {
    setFeedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
  };

  const handleAddFriend = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    
    Alert.alert('Friend Request Sent!', `Friend request sent to ${searchQuery}`);
    closeModal();
  };

  const handleJoinGuild = (guildId: string) => {
    setGuilds(prev => prev.map(guild => 
      guild.id === guildId 
        ? { ...guild, isJoined: true, memberCount: guild.memberCount + 1 }
        : guild
    ));
    Alert.alert('Guild Joined!', 'Welcome to your new guild!');
  };

  const handleCreateGuild = () => {
    if (userStats.level < 15) {
      Alert.alert('Requirements Not Met', 'You need to be Level 15 or higher to create a guild.');
      return;
    }
    
    if (!userStats.title.includes('B-Rank') && !userStats.title.includes('A-Rank') && !userStats.title.includes('S-Rank')) {
      Alert.alert('Requirements Not Met', 'You need to be B-Rank or higher to create a guild.');
      return;
    }
    
    Alert.alert('Create Guild', 'Guild creation functionality coming soon!');
    closeModal();
  };

  const handleChangeRank = (memberId: string, newRank: GuildRank) => {
    const currentGuild = guilds.find(g => g.isJoined && g.isLeader);
    if (!currentGuild || !currentGuild.members) return;

    // Check if current user has permission to change ranks
    if (!currentGuild.isLeader && !currentGuild.isViceCaptain) {
      Alert.alert('Permission Denied', 'Only Captains and Vice Captains can change member ranks.');
      return;
    }

    // Update the member's rank
    setGuilds(prev => prev.map(guild => {
      if (guild.id === currentGuild.id && guild.members) {
        return {
          ...guild,
          members: guild.members.map(member => 
            member.id === memberId 
              ? { ...member, guildRank: newRank }
              : member
          )
        };
      }
      return guild;
    }));

    setRankDropdownVisible(null);
    Alert.alert('Rank Updated', `Member rank has been changed to ${newRank.name}`);
  };

  const getCurrentLeaderboard = (): LeaderboardEntry[] => {
    switch (leaderboardType) {
      case 'friends': return friendsLeaderboard;
      case 'guild': return guildLeaderboard;
      default: return globalLeaderboard;
    }
  };

  const getTitleColor = (title: string): string => {
    if (title.includes('Shadow Monarch')) return '#8b5cf6';
    if (title.includes('S-Rank')) return '#f59e0b';
    if (title.includes('A-Rank')) return '#ef4444';
    if (title.includes('B-Rank')) return '#3b82f6';
    if (title.includes('C-Rank')) return '#10b981';
    if (title.includes('D-Rank')) return '#6366f1';
    return '#6b7280';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} color="#fbbf24" />;
    if (rank === 2) return <Award size={20} color="#9ca3af" />;
    if (rank === 3) return <Trophy size={20} color="#cd7f32" />;
    return <Text style={styles.rankNumber}>#{rank}</Text>;
  };

  const getFeedIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'level_up': return <Zap size={16} color="#fbbf24" />;
      case 'achievement': return <Trophy size={16} color="#10b981" />;
      case 'quest_complete': return <Target size={16} color="#6366f1" />;
      case 'guild_join': return <Shield size={16} color="#8b5cf6" />;
    }
  };

  const renderTabButton = (tab: TabType, icon: React.ReactNode, title: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
      testID={`profile-tab-${tab}`}
    >
      {icon}
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderLeaderboardTypeButton = (type: LeaderboardType, title: string) => (
    <TouchableOpacity
      style={[styles.leaderboardTypeButton, leaderboardType === type && styles.activeLeaderboardTypeButton]}
      onPress={() => setLeaderboardType(type)}
      testID={`profile-leaderboard-type-${type}`}
    >
      <Text style={[styles.leaderboardTypeText, leaderboardType === type && styles.activeLeaderboardTypeText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderRankDropdown = (member: GuildMember, availableRanks: GuildRank[]) => {
    const currentGuild = guilds.find(g => g.isJoined && g.isLeader);
    if (!currentGuild) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={rankDropdownVisible === member.id}
        onRequestClose={() => setRankDropdownVisible(null)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setRankDropdownVisible(null)}
          testID="profile-rank-dropdown-overlay"
        >
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Change Rank for {member.username}</Text>
            
            {availableRanks.map(rank => (
              <TouchableOpacity
                key={rank.id}
                style={[
                  styles.dropdownItem,
                  member.guildRank.id === rank.id && styles.selectedDropdownItem
                ]}
                onPress={() => handleChangeRank(member.id, rank)}
                testID={`profile-rank-option-${rank.id}`}
              >
                <View style={styles.dropdownItemLeft}>
                  <View style={[styles.rankColorIndicator, { backgroundColor: rank.color }]} />
                  <Text style={styles.dropdownItemText}>{rank.name}</Text>
                </View>
                {member.guildRank.id === rank.id && (
                  <Check size={16} color="#00ffff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderGuildMemberCard = (member: GuildMember, guild: Guild) => {
    const availableRanks = guild.customRanks || defaultGuildRanks;
    const canChangeRank = guild.isLeader || guild.isViceCaptain;

    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.memberAvatarContainer}>
            <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
            <View style={[styles.onlineIndicator, { backgroundColor: member.isOnline ? '#10b981' : '#6b7280' }]} />
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberUsername}>{member.username}</Text>
            <Text style={[styles.memberTitle, { color: getTitleColor(member.title) }]}>{member.title}</Text>
            <View style={styles.memberStats}>
              <Text style={styles.memberLevel}>Level {member.level}</Text>
              <Text style={styles.memberPower}>Power: {member.powerLevel.toLocaleString()}</Text>
            </View>
            <Text style={styles.memberJoinDate}>
              Joined: {new Date(member.joinedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {/* Guild Rank - Bottom Right */}
        <View style={styles.memberRankContainer}>
          <TouchableOpacity
            style={[
              styles.memberRankButton,
              { borderColor: member.guildRank.color },
              !canChangeRank && styles.disabledRankButton
            ]}
            onPress={() => canChangeRank ? setRankDropdownVisible(member.id) : null}
            disabled={!canChangeRank}
            testID={`profile-member-rank-${member.id}`}
          >
            <Text style={[styles.memberRankText, { color: member.guildRank.color }]}>
              {member.guildRank.name}
            </Text>
            {canChangeRank && (
              <ChevronDown size={14} color={member.guildRank.color} />
            )}
          </TouchableOpacity>
        </View>

        {renderRankDropdown(member, availableRanks)}
      </View>
    );
  };

  const renderFeedTab = () => (
    <ScrollView style={styles.tabContent}>
      {feedItems.map(item => (
        <View key={item.id} style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <Image source={{ uri: item.user.avatar }} style={styles.feedAvatar} />
            <View style={styles.feedUserInfo}>
              <Text style={styles.feedUsername}>{item.user.username}</Text>
              <Text style={styles.feedUserTitle}>{item.user.title}</Text>
            </View>
            <View style={styles.feedTypeIcon}>
              {getFeedIcon(item.type)}
            </View>
          </View>
          
          <Text style={styles.feedContent}>
            <Text style={styles.feedUsernameInline}>{item.user.username}</Text> {item.content}
          </Text>
          
          {item.xpGained && (
            <View style={styles.xpGainedContainer}>
              <Zap size={14} color="#fbbf24" />
              <Text style={styles.xpGainedText}>+{item.xpGained} XP</Text>
            </View>
          )}
          
          <View style={styles.feedFooter}>
            <Text style={styles.feedTimestamp}>{item.timestamp}</Text>
            <View style={styles.feedActions}>
              <TouchableOpacity 
                style={styles.feedAction}
                onPress={() => handleLikeFeedItem(item.id)}
                testID={`profile-feed-like-${item.id}`}
              >
                <Heart size={16} color={item.isLiked ? "#ef4444" : "#6b7280"} fill={item.isLiked ? "#ef4444" : "none"} />
                <Text style={[styles.feedActionText, item.isLiked && styles.likedText]}>{item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.feedAction}
                testID={`profile-feed-comment-${item.id}`}
              >
                <MessageCircle size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.feedAction}
                testID={`profile-feed-share-${item.id}`}
              >
                <Share size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderFriendsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <GlowingButton
          title="Add Friend"
          onPress={() => openModal('add_friend')}
          variant="secondary"
          style={styles.tabAddButton}
          testID="profile-add-friend-button"
        />
      </View>

      {friends.map(friend => (
        <View key={friend.id} style={styles.friendCard}>
          <View style={styles.friendInfo}>
            <View style={styles.friendAvatarContainer}>
              <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
              <View style={[styles.onlineIndicator, { backgroundColor: friend.isOnline ? '#10b981' : '#6b7280' }]} />
            </View>
            <View style={styles.friendDetails}>
              <Text style={styles.friendUsername}>{friend.username}</Text>
              <Text style={[styles.friendTitle, { color: getTitleColor(friend.title) }]}>{friend.title}</Text>
              <View style={styles.friendStats}>
                <Text style={styles.friendLevel}>Level {friend.level}</Text>
                <Text style={styles.friendPower}>Power: {friend.powerLevel.toLocaleString()}</Text>
              </View>
              {!friend.isOnline && friend.lastSeen && (
                <Text style={styles.lastSeen}>Last seen {friend.lastSeen}</Text>
              )}
            </View>
          </View>
          <View style={styles.friendActions}>
            <TouchableOpacity 
              style={styles.friendActionButton}
              testID={`profile-friend-message-${friend.id}`}
            >
              <MessageCircle size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderGuildsTab = () => {
    const userGuild = guilds.find(g => g.isJoined);
    const availableGuilds = guilds.filter(g => !g.isJoined);

    return (
      <ScrollView style={styles.tabContent}>
        {!userGuild ? (
          // Not in a guild - show create/join options
          <>
            <View style={styles.guildActionsContainer}>
              <GlowingButton
                title="Create Guild"
                onPress={() => handleCreateGuild()}
                variant="primary"
                style={styles.guildActionButton}
                disabled={userStats.level < 15}
              />
              <GlowingButton
                title="Join Guild"
                onPress={() => openModal('join_guild')}
                variant="secondary"
                style={styles.guildActionButton}
              />
            </View>

            {userStats.level < 15 && (
              <View style={styles.requirementNotice}>
                <Text style={styles.requirementText}>
                  Level 15 and B-Rank required to create a guild
                </Text>
              </View>
            )}

            <View style={styles.guildRankingHeader}>
              <Text style={styles.guildRankingTitle}>Top 25 Guilds</Text>
            </View>

            {availableGuilds.map((guild, index) => (
              <View key={guild.id} style={styles.guildRankingCard}>
                <View style={styles.guildRankingInfo}>
                  <Text style={styles.guildRankingPosition}>#{guild.globalRanking}</Text>
                  <View style={styles.guildEmblemContainer}>
                    <Text style={styles.guildEmblem}>{guild.emblem}</Text>
                  </View>
                  <View style={styles.guildRankingDetails}>
                    <Text style={styles.guildName}>{guild.name}</Text>
                    <Text style={styles.guildLevel}>Level {guild.level}</Text>
                    <Text style={styles.guildMembers}>
                      {guild.memberCount}/{guild.maxMembers} members
                    </Text>
                  </View>
                </View>
                <GlowingButton
                  title="View"
                  onPress={() => handleJoinGuild(guild.id)}
                  variant="secondary"
                  style={styles.viewGuildButton}
                />
              </View>
            ))}
          </>
        ) : (
          // In a guild - show guild management
          <>
            <View style={styles.guildHeader}>
              <View style={styles.guildHeaderInfo}>
                <View style={styles.guildEmblemContainer}>
                  <Text style={styles.guildEmblem}>{userGuild.emblem}</Text>
                </View>
                <View style={styles.guildHeaderDetails}>
                  <Text style={styles.guildHeaderName}>{userGuild.name}</Text>
                  <Text style={styles.guildHeaderLevel}>Guild Level {userGuild.level}</Text>
                  <Text style={styles.guildHeaderMembers}>
                    {userGuild.memberCount}/{userGuild.maxMembers} members
                  </Text>
                </View>
              </View>
              <View style={styles.guildHeaderActions}>
                {userGuild.isLeader && (
                  <GlowingButton
                    title="Edit Guild"
                    onPress={() => Alert.alert('Edit Guild', 'Guild editing functionality coming soon!')}
                    variant="secondary"
                    style={styles.editGuildButton}
                  />
                )}
                <View style={styles.leaderBadge}>
                  <Crown size={16} color="#fbbf24" />
                  <Text style={styles.leaderText}>Leader</Text>
                </View>
              </View>
            </View>

            <Text style={styles.guildDescription}>{userGuild.description}</Text>

            {/* Guild Stats */}
            <View style={styles.guildStatsContainer}>
              <View style={styles.guildStatItem}>
                <View style={styles.guildStatIcon}>
                  <Zap size={16} color="#fbbf24" />
                </View>
                <View style={styles.guildStatInfo}>
                  <Text style={styles.guildStatLabel}>Guild Power</Text>
                  <Text style={styles.guildStatValue}>{userGuild.guildPower?.toLocaleString()}</Text>
                </View>
              </View>
              
              <View style={styles.guildStatItem}>
                <View style={styles.guildStatIcon}>
                  <Trophy size={16} color="#f59e0b" />
                </View>
                <View style={styles.guildStatInfo}>
                  <Text style={styles.guildStatLabel}>Guild Ranking</Text>
                  <Text style={styles.guildStatValue}>#{userGuild.globalRanking}</Text>
                </View>
              </View>
            </View>

            <View style={styles.guildProgress}>
              <ProgressBar 
                progress={userGuild.memberCount / userGuild.maxMembers} 
                height={6}
                glowColor="#10b981"
              />
            </View>

            {/* Guild Members */}
            <View style={styles.membersSection}>
              <Text style={styles.membersSectionTitle}>Guild Members</Text>
              
              {userGuild.members?.map(member => renderGuildMemberCard(member, userGuild))}
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  const renderLeaderboardTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>Power Rankings</Text>
        <Text style={styles.leaderboardSubtitle}>Top hunters by total power level</Text>
      </View>

      {/* Leaderboard Type Selector */}
      <View style={styles.leaderboardTypeSelector}>
        {renderLeaderboardTypeButton('global', 'Global')}
        {renderLeaderboardTypeButton('friends', 'Friends')}
        {renderLeaderboardTypeButton('guild', 'Guild')}
      </View>

      {getCurrentLeaderboard().map(entry => (
        <View key={entry.rank} style={[styles.leaderboardCard, entry.isCurrentUser && styles.currentUserCard]}>
          <View style={styles.leaderboardRank}>
            {getRankIcon(entry.rank)}
          </View>
          
          <Image source={{ uri: entry.avatar }} style={styles.leaderboardAvatar} />
          
          <View style={styles.leaderboardInfo}>
            <Text style={[styles.leaderboardUsername, entry.isCurrentUser && styles.currentUserText]}>
              {entry.username}
            </Text>
            <Text style={[styles.leaderboardUserTitle, { color: getTitleColor(entry.title) }]}>
              {entry.title}
            </Text>
            <Text style={styles.leaderboardLevel}>Level {entry.level}</Text>
          </View>
          
          <View style={styles.leaderboardPower}>
            <Zap size={16} color="#fbbf24" />
            <Text style={styles.powerLevelText}>{entry.powerLevel.toLocaleString()}</Text>
          </View>
        </View>
      ))}
      
      <View style={styles.leaderboardFooter}>
        <Text style={styles.footerText}>Keep grinding to climb the ranks!</Text>
      </View>
    </ScrollView>
  );

  const renderModal = () => {
    if (!modalType) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'add_friend' ? 'Add Friend' : modalType === 'create_guild' ? 'Create Guild' : 'Join Guild'}
            </Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder={modalType === 'add_friend' ? 'Enter username' : modalType === 'create_guild' ? 'Guild name' : 'Search guilds'}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <View style={styles.modalButtons}>
              <GlowingButton
                title="Cancel"
                onPress={closeModal}
                variant="secondary"
                style={styles.modalButton}
              />
              <GlowingButton
                title={modalType === 'add_friend' ? 'Send Request' : modalType === 'create_guild' ? 'Create' : 'Search'}
                onPress={modalType === 'add_friend' ? handleAddFriend : modalType === 'create_guild' ? handleCreateGuild : closeModal}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Users size={24} color="#6366f1" />
            <Text style={styles.headerTitle}>Social</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.inboxButton}
              onPress={() => router.push('/inbox')}
              testID="profile-inbox-button"
            >
              <Mail size={20} color="#6366f1" />
              {unreadMessages > 0 && (
                <View style={styles.inboxBadge}>
                  <Text style={styles.inboxBadgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              testID="profile-settings-button"
            >
              <Settings size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {renderTabButton('feed', <MessageCircle size={18} color={activeTab === 'feed' ? '#00ffff' : '#6b7280'} />, 'Feed')}
          {renderTabButton('friends', <Users size={18} color={activeTab === 'friends' ? '#00ffff' : '#6b7280'} />, 'Friends')}
          {renderTabButton('guilds', <Shield size={18} color={activeTab === 'guilds' ? '#00ffff' : '#6b7280'} />, 'Guilds')}
          {renderTabButton('leaderboard', <Trophy size={18} color={activeTab === 'leaderboard' ? '#00ffff' : '#6b7280'} />, 'Rankings')}
        </View>

        {/* Tab Content */}
        {activeTab === 'feed' && renderFeedTab()}
        {activeTab === 'friends' && renderFriendsTab()}
        {activeTab === 'guilds' && renderGuildsTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}

        {renderModal()}
        <View style={styles.overlay}>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inboxButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  inboxBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  inboxBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 1,
  },
  activeTabButton: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#00ffff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  tabAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  
  // Feed Styles
  feedCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUsername: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  feedUserTitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
  },
  feedTypeIcon: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 8,
  },
  feedContent: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedUsernameInline: {
    fontFamily: 'Orbitron-Bold',
    color: '#00ffff',
  },
  xpGainedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  xpGainedText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#fbbf24',
    marginLeft: 4,
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedTimestamp: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  feedActions: {
    flexDirection: 'row',
    gap: 16,
  },
  feedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedActionText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  likedText: {
    color: '#ef4444',
  },

  // Friends Styles
  friendCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  friendDetails: {
    flex: 1,
  },
  friendUsername: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  friendTitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    marginBottom: 4,
  },
  friendStats: {
    flexDirection: 'row',
    gap: 12,
  },
  friendLevel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  friendPower: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  lastSeen: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  friendActionButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 8,
  },

  // Guilds Styles
  guildActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  guildActionButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  requirementNotice: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  requirementText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
  },
  guildRankingHeader: {
    marginBottom: 16,
  },
  guildRankingTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  guildRankingCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
  },
  guildRankingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guildRankingPosition: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#fbbf24',
    width: 30,
  },
  guildEmblemContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guildEmblem: {
    fontSize: 20,
  },
  guildRankingDetails: {
    flex: 1,
  },
  guildName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  guildLevel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  guildMembers: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  viewGuildButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  guildHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  guildHeaderInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  guildHeaderDetails: {
    flex: 1,
  },
  guildHeaderName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 4,
  },
  guildHeaderLevel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  guildHeaderMembers: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  guildHeaderActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editGuildButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  leaderText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#000000',
  },
  guildDescription: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 16,
  },
  guildStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  guildStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  guildStatIcon: {
    marginRight: 8,
  },
  guildStatInfo: {
    flex: 1,
  },
  guildStatLabel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 2,
  },
  guildStatValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  guildProgress: {
    marginBottom: 24,
  },
  membersSection: {
    marginBottom: 32,
  },
  membersSectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberDetails: {
    flex: 1,
  },
  memberUsername: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  memberTitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    marginBottom: 4,
  },
  memberStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 2,
  },
  memberLevel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  memberPower: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  memberJoinDate: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    color: '#6b7280',
  },
  memberRankContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  memberRankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  disabledRankButton: {
    opacity: 0.7,
  },
  memberRankText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 10,
    fontWeight: '600',
  },

  // Rank Dropdown Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dropdownTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#374151',
  },
  selectedDropdownItem: {
    backgroundColor: '#4b5563',
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dropdownItemText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#ffffff',
  },

  // Leaderboard Styles
  leaderboardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 4,
  },
  leaderboardSubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
  leaderboardTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  leaderboardTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeLeaderboardTypeButton: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  leaderboardTypeText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  activeLeaderboardTypeText: {
    color: '#ffffff',
  },
  leaderboardCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserCard: {
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#9ca3af',
  },
  leaderboardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardUsername: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#00ffff',
  },
  leaderboardUserTitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    marginBottom: 2,
  },
  leaderboardLevel: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  leaderboardPower: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  powerLevelText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#fbbf24',
  },
  leaderboardFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    color: '#ffffff',
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,26,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  comingSoon: {
    fontSize: 28,
    color: '#00ffff',
    fontFamily: 'Orbitron-Bold',
    textAlign: 'center',
    margin: 20,
  },
});