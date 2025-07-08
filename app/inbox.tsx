import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Mail, Users, Shield, Settings as SettingsIcon, Crown, MessageCircle, Clock, Check, Trash2 } from 'lucide-react-native';
import GlowingButton from '@/components/GlowingButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type MessageType = 'system' | 'guild' | 'friend';
type MessageCategory = 'all' | 'friend' | 'guild' | 'system';

interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  sender?: string;
  senderAvatar?: string;
}

export default function InboxScreen({ onUpdateUnread }: { onUpdateUnread?: () => void } = {}) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MessageCategory>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      setLoading(true);
      // Fetch profile to check welcome_message_sent
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, welcome_message_sent')
        .eq('id', user.id)
        .single();
      const welcomeSent = !!profile?.welcome_message_sent;
      if (!welcomeSent) {
        // Call the RPC function to insert the welcome message and set the flag atomically
        await supabase.rpc('insert_welcome_message_once', {
          uid: user.id,
          created_at: profile?.created_at || new Date().toISOString(),
        });
      }
      // Restore all four hardcoded update messages, newest to oldest
      const updatesMessages: Message[] = [
        {
          id: 'updates-003',
          type: 'system',
          title: '🧠 Personalized AI & Goal System Overhaul! (2025/07/08)',
          content: `Hey Awakened!\n\nToday's update brings a new era of personalization and progress to your journey:\n\n🤖 **AI Quest Generation Revamp:**\n• Quests are now deeply personalized—AI reads your goals, journals, and tomorrow's plans to generate unique, actionable quests just for you\n• No more generic tasks—every quest is tied to your real goals and life context\n• Quests now estimate how many steps to complete your goal, so your progress bar moves with every win\n\n📈 **Goal Progress & Tracking:**\n• Quests are now linked to specific goals\n• Progress bars update as you complete related quests\n• Completed goals remain visible for your legacy\n\n🗓️ **Cross-Platform Experience:**\n• Date and category pickers work beautifully on web, Android, and iOS\n• New goal categories with epic emojis\n\n✨ **UI/UX Upgrades:**\n• Smoother, more intuitive forms\n• Cleaner dropdowns and selectors\n• More motivating feedback and messages\n\nThis is the most intelligent and immersive Awaken experience yet. Dive in, complete your quests, and watch your progress soar!\n\n- The Awaken Team`,
          timestamp: new Date('2025-07-08').toISOString(),
          isRead: false,
          sender: 'System',
        },
        {
          id: 'class-update-001',
          type: 'system',
          title: '⚔️ Class System Update - Choose Your New Path! (2025/07/06)',
          content: `Greetings, Awakened! \n\nWe've updated the class system with more epic and fitting classes for your journey:\n\n⚔️ **New Classes Available:**\n\n🔥 **Berserker (Red)** - Unstoppable fury and raw power\n• Perfect for those who charge headfirst into challenges\n• Red aura represents passion and determination\n\n🕷️ **Shinobi (Purple)** - Shadow mastery and stealth\n• Ideal for strategic thinkers and silent achievers\n• Purple aura represents mystery and intelligence\n\n🌿 **Sage (Green)** - Ancient wisdom and knowledge\n• Perfect for those who seek growth and learning\n• Green aura represents balance and growth\n\n👑 **Vagabond (Blue)** - Adaptable wanderer and survivor\n• Ideal for those who adapt to any situation\n• Blue aura represents calm and focus\n\n**Action Required:** Please visit your profile settings to choose your new class. Your current class will be automatically converted to the closest match, but you can change it anytime!\n\nChoose wisely, for your class will influence your journey and the quests you receive! 🎯\n\n- The Awaken Team`,
          timestamp: new Date('2025-07-06').toISOString(),
          isRead: false,
          sender: 'System',
        },
        {
          id: 'updates-002',
          type: 'system',
          title: '🚀 Major Quest System Overhaul! (2025/07/06)',
          content: `Greetings, Awakened! \n\nWe've just completed a massive overhaul of the quest and XP system:\n\n🎯 **Quest System Improvements:**\n• Fixed XP calculation and display\n• Added real-time UI updates\n• Implemented completed quests tracking\n• Enhanced system quest completion\n\n⚡ **XP & Leveling Fixes:**\n• Proper XP progress display (e.g., 650/1000)\n• Real-time stats updates across all screens\n• Fixed quest completion rewards\n• Enhanced level calculation\n\n🔧 **Technical Improvements:**\n• Added comprehensive logging system\n• Fixed quest persistence across sessions\n• Improved error handling\n• Better database integration\n\n🎮 **User Experience:**\n• No more page reloads needed for updates\n• Immediate quest completion feedback\n• Better quest tracking and history\n• Enhanced debugging capabilities\n\nThe quest system is now fully functional and ready for your epic journey! Complete quests, earn XP, and level up like never before! 💪\n\n- The Awaken Team`,
          timestamp: new Date('2025-07-06').toISOString(),
          isRead: false,
          sender: 'System',
        },
        {
          id: 'updates-001',
          type: 'system',
          title: '🎉 App Updates Available! (2025/07/04)',
          content: `Hey Awakened! We've got some exciting new features for you:\n\n🔥 **New Features:**\n• Enhanced Daily Quest System\n• Improved XP Tracking\n• Better Error Handling\n• Navigation Improvements\n\n⚡ **Performance Updates:**\n• Faster loading times\n• Smoother animations\n• Better stability\n\n🎯 **What's Next:**\n• Guild system coming soon\n• Friend challenges\n• Advanced analytics\n\nKeep up the great work on your journey to becoming a Monarch and the main character of your story! 💪\n\n- The Awaken Team`,
          timestamp: new Date('2025-07-04').toISOString(),
          isRead: false,
          sender: 'System',
        },
      ];
      // Fetch database messages as before
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('timestamp', { ascending: false });
      let allMessages: Message[] = [...updatesMessages];
      if (dbMessages) allMessages = [...allMessages, ...dbMessages];
      setMessages(allMessages);
      setLoading(false);
      if (onUpdateUnread) onUpdateUnread();
    };
    fetchMessages();
  }, [user]);

  // NOTE: All system update messages should now be seeded in the database with receiver_id = null, and copied to each user inbox on signup/login.

  const filteredMessages = activeCategory === 'all' 
    ? messages 
    : messages.filter(msg => msg.type === activeCategory);

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  const handleMessagePress = (message: Message) => {
    setSelectedMessage(message);
    setModalVisible(true);
    // Mark as read in DB
    if (!message.isRead) {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isRead: true } : msg
      ));
      supabase.from('messages').update({ is_read: true }).eq('id', message.id);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setModalVisible(false);
    setSelectedMessage(null);
    await supabase.from('messages').delete().eq('id', messageId);
    if (onUpdateUnread) onUpdateUnread();
  };

  const markAllAsRead = () => {
    setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    const ids = messages.filter(msg => !msg.isRead).map(msg => msg.id);
    if (ids.length > 0) {
      supabase.from('messages').update({ is_read: true }).in('id', ids);
    }
    if (onUpdateUnread) onUpdateUnread();
  };

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'system': return <SettingsIcon size={16} color="#6366f1" />;
      case 'guild': return <Shield size={16} color="#8b5cf6" />;
      case 'friend': return <Users size={16} color="#10b981" />;
    }
  };

  const getMessageTypeColor = (type: MessageType) => {
    switch (type) {
      case 'system': return '#6366f1';
      case 'guild': return '#8b5cf6';
      case 'friend': return '#10b981';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderCategoryButton = (category: MessageCategory, icon: React.ReactNode, title: string, count?: number) => (
    <TouchableOpacity
      style={[styles.categoryButton, activeCategory === category && styles.activeCategoryButton]}
      onPress={() => setActiveCategory(category)}
      testID={`inbox-category-${category}`}
    >
      {icon}
      <Text style={[styles.categoryButtonText, activeCategory === category && styles.activeCategoryButtonText]}>
        {title}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#000000', '#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Mail size={24} color="#6366f1" />
            <Text style={styles.headerTitle}>Inbox</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={markAllAsRead}
                testID="inbox-mark-all-read-button"
              >
                <Check size={16} color="#10b981" />
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.replace('/(tabs)')}
              testID="inbox-close-button"
            >
              <X size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView}
            contentContainerStyle={styles.categoryContainer}
          >
            {renderCategoryButton('all', <Mail size={18} color={activeCategory === 'all' ? '#00ffff' : '#6b7280'} />, 'All', unreadCount)}
            {renderCategoryButton('friend', <Users size={18} color={activeCategory === 'friend' ? '#00ffff' : '#6b7280'} />, 'Friends', messages.filter(m => m.type === 'friend' && !m.isRead).length)}
            {renderCategoryButton('guild', <Shield size={18} color={activeCategory === 'guild' ? '#00ffff' : '#6b7280'} />, 'Guild', messages.filter(m => m.type === 'guild' && !m.isRead).length)}
            {renderCategoryButton('system', <SettingsIcon size={18} color={activeCategory === 'system' ? '#00ffff' : '#6b7280'} />, 'System', messages.filter(m => m.type === 'system' && !m.isRead).length)}
          </ScrollView>
        </View>

        {/* Messages List */}
        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Mail size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No Messages</Text>
              <Text style={styles.emptySubtitle}>
                {activeCategory === 'all' 
                  ? 'Your inbox is empty. Messages will appear here.'
                  : `No ${activeCategory} messages found.`
                }
              </Text>
            </View>
          ) : (
            filteredMessages.map(message => (
              <TouchableOpacity
                key={message.id}
                style={[styles.messageCard, !message.isRead && styles.unreadMessage]}
                onPress={() => handleMessagePress(message)}
                testID={`inbox-message-${message.id}`}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.messageTypeContainer}>
                    {getMessageIcon(message.type)}
                    <View style={[styles.messageTypeDot, { backgroundColor: getMessageTypeColor(message.type) }]} />
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={[styles.messageTitle, !message.isRead && styles.unreadText]}>
                      {message.title}
                    </Text>
                    {message.sender && (
                      <Text style={styles.messageSender}>From: {message.sender}</Text>
                    )}
                  </View>
                  <View style={styles.messageTime}>
                    <Text style={styles.messageTimestamp}>{formatTimestamp(message.timestamp)}</Text>
                    {!message.isRead && <View style={styles.unreadDot} />}
                  </View>
                </View>
                
                <Text style={styles.messagePreview} numberOfLines={2}>
                  {message.content}
                </Text>
              </TouchableOpacity>
            ))
          )}
          
          {/* Bottom spacing for tab bar */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    {getMessageIcon(selectedMessage.type)}
                    <Text style={styles.modalTitle}>{selectedMessage.title}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                    testID="inbox-modal-close-button"
                  >
                    <X size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                {selectedMessage.sender && (
                  <Text style={styles.modalSender}>From: {selectedMessage.sender}</Text>
                )}
                
                <Text style={styles.modalTimestamp}>{formatTimestamp(selectedMessage.timestamp)}</Text>
                
                <ScrollView style={styles.modalContentScroll}>
                  <Text style={styles.modalContentText}>{selectedMessage.content}</Text>
                </ScrollView>
                
                <View style={styles.modalActions}>
                  <GlowingButton
                    title="Delete"
                    onPress={() => handleDeleteMessage(selectedMessage.id)}
                    variant="secondary"
                    style={styles.modalButton}
                    testID="inbox-modal-delete-button"
                  />
                  <GlowingButton
                    title="Close"
                    onPress={() => setModalVisible(false)}
                    variant="primary"
                    style={styles.modalButton}
                    testID="inbox-modal-close-button-primary"
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 10,
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  markAllText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#10b981',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryScrollView: {
    marginHorizontal: -20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    gap: 6,
  },
  activeCategoryButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryButtonText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  activeCategoryButtonText: {
    color: '#ffffff',
  },
  categoryBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  unreadMessage: {
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageTypeContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  messageTypeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  messageInfo: {
    flex: 1,
  },
  messageTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  unreadText: {
    color: '#00ffff',
  },
  messageSender: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#9ca3af',
  },
  messageTime: {
    alignItems: 'flex-end',
  },
  messageTimestamp: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#6b7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginTop: 4,
  },
  messagePreview: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 100,
  },
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
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSender: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  modalTimestamp: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 16,
  },
  modalContentScroll: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalContentText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});