import { Tabs } from 'expo-router';
import { Crown, BookOpen, Users, Wrench } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: '#6366f1',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#00ffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontFamily: 'Orbitron-Regular',
          fontSize: 10,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'The Hub',
          tabBarIcon: ({ size, color }) => (
            <Crown size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'War Journal',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Social',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Tools',
          tabBarIcon: ({ size, color }) => (
            <Wrench size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}