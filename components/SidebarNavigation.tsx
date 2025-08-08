import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, Platform, Dimensions } from 'react-native';
import { Home, BookOpen, Users, Wrench, Mail, Settings, Menu, User as UserIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import i18n from '../utils/i18n';

const NAV_ITEMS = [
  { label: 'Hub', icon: Home, route: '/' },
  { label: 'War Journal', icon: BookOpen, route: '/journal' },
  { label: 'Social', icon: Users, route: '/social' },
  { label: 'Tools', icon: Wrench, route: '/tools' },
  { label: 'Inbox', icon: Mail, route: '/inbox' },
  { label: 'Settings', icon: Settings, route: '/settings' },
];

export default function SidebarNavigation() {
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const isMobile = Platform.OS !== 'web';
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const sidebarWidth = collapsed ? 72 : 240;

  // Remove forced Japanese for debugging
  // i18n.changeLanguage('ja');

  // Add language switcher to the bottom of the sidebar (both overlay and normal)
  const LanguageSwitcher = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
      <TouchableOpacity onPress={() => i18n.changeLanguage('en')} style={{ marginHorizontal: 8 }}>
        <Text style={{ color: i18n.language === 'en' ? '#6366f1' : '#fff', fontWeight: 'bold' }}>EN</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => i18n.changeLanguage('ja')} style={{ marginHorizontal: 8 }}>
        <Text style={{ color: i18n.language === 'ja' ? '#6366f1' : '#fff', fontWeight: 'bold' }}>日本語</Text>
      </TouchableOpacity>
    </View>
  );

  // Only show language switcher when sidebar is expanded
  const showLanguageSwitcher = !collapsed;

  if (isMobile && !collapsed) {
    return (
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 1000, pointerEvents: 'box-none' }}>
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' }} onTouchEnd={() => setCollapsed(true)} />
        <Animated.View style={[styles.sidebar, { width: sidebarWidth, position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1001, elevation: 20, pointerEvents: 'auto' }]}>  
          {/* User Profile Branding */}
          <View style={styles.logoContainer}>
            {profile?.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}><UserIcon size={28} color="#18181b" /></View>
            )}
            {!collapsed && <Text style={styles.brandText}>{profile?.username || 'User'}</Text>}
          </View>
          {/* Navigation Items */}
          <View style={styles.navSection}>
            {NAV_ITEMS.map(({ label, icon: Icon, route }) => (
              <TouchableOpacity
                key={label}
                style={styles.navItem}
                onPress={() => { router.push(route as any); setCollapsed(true); }}
                activeOpacity={0.8}
              >
                {Icon ? <Icon size={24} color="#fff" /> : <Text style={{color:'#fff'}}>?</Text>}
                {!collapsed && (
                  <Text style={styles.navLabel}>
                    {(() => {
                      const translated = t(label);
                      if (typeof window !== 'undefined') {
                        // eslint-disable-next-line no-console
                        console.log('Sidebar label:', label, 'Lang:', i18n.language, 'Translation:', translated);
                      }
                      return translated;
                    })()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {showLanguageSwitcher && <LanguageSwitcher />}
          {/* Burger Menu Collapse/Expand Button */}
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setCollapsed((c) => !c)}
            activeOpacity={0.7}
          >
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>  
      {/* User Profile Branding */}
      <View style={styles.logoContainer}>
        {profile?.profile_picture ? (
          <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}><UserIcon size={28} color="#18181b" /></View>
        )}
        {!collapsed && <Text style={styles.brandText}>{profile?.username || 'User'}</Text>}
      </View>
      {/* Navigation Items */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map(({ label, icon: Icon, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.navItem}
            onPress={() => router.push(route as any)}
            activeOpacity={0.8}
          >
            {Icon ? <Icon size={24} color="#fff" /> : <Text style={{color:'#fff'}}>?</Text>}
            {!collapsed && (
              <Text style={styles.navLabel}>
                {(() => {
                  const translated = t(label);
                  if (typeof window !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log('Sidebar label:', label, 'Lang:', i18n.language, 'Translation:', translated);
                  }
                  return translated;
                })()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {showLanguageSwitcher && <LanguageSwitcher />}
      {/* Burger Menu Collapse/Expand Button */}
      <TouchableOpacity
        style={styles.collapseButton}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.7}
      >
        <Menu size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#18181b',
    borderRightWidth: 2,
    borderRightColor: '#27272a',
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, paddingHorizontal: 16, justifyContent: 'flex-start' },
  avatarImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#00ffff', backgroundColor: '#fff' },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ffff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#00ffff',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  logoText: {
    color: '#18181b',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 2,
  },
  brandText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 2, fontFamily: 'Orbitron-Bold' },
  navSection: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 4,
    gap: 16,
    backgroundColor: 'transparent',
  },
  navLabel: { color: '#fff', fontSize: 16, fontWeight: '500', letterSpacing: 1, fontFamily: 'Orbitron-Regular' },
  collapseButton: {
    alignSelf: 'flex-end',
    marginRight: 8,
    marginTop: 12,
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 6,
  },
}); 