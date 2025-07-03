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
      // Always fetch and display all system messages for the user
      const { data: systemMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('type', 'system')
        .order('created_at', { ascending: true });
      if (!error && systemMessages) {
        setMessages(systemMessages);
      }
      setLoading(false);
      if (onUpdateUnread) onUpdateUnread();
    };
    fetchMessages();
  }, [user]);

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

  const renderCategoryButton = (category: MessageCategory, icon: React.ReactNode, title: string, count?: number) => (
    <TouchableOpacity
      style={[styles.categoryButton, activeCategory === category && styles.activeCategoryButton]}
      onPress={() => setActiveCategory(category)}
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
              >
                <Check size={16} color="#10b981" />
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
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
                    <Text style={styles.messageTimestamp}>{message.timestamp}</Text>
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
                  >
                    <X size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                {selectedMessage.sender && (
                  <Text style={styles.modalSender}>From: {selectedMessage.sender}</Text>
                )}
                
                <Text style={styles.modalTimestamp}>{selectedMessage.timestamp}</Text>
                
                <ScrollView style={styles.modalContentScroll}>
                  <Text style={styles.modalContentText}>{selectedMessage.content}</Text>
                </ScrollView>
                
                <View style={styles.modalActions}>
                  <GlowingButton
                    title="Delete"
                    onPress={() => handleDeleteMessage(selectedMessage.id)}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <GlowingButton
                    title="Close"
                    onPress={() => setModalVisible(false)}
                    variant="primary"
                    style={styles.modalButton}
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