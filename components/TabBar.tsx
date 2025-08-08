import React from 'react';
import { View, TouchableOpacity, Text, Platform, Dimensions } from 'react-native';
import styles from '../app/(tabs)/JournalStyles';
import { getTabIcon } from '../utils/journalHelpers';

interface TabBarProps {
  tabs: Array<{ key: string; title: string }>;
  activeTab: string;
  onTabPress: (key: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabPress }) => {
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';
  const isWide = screenWidth >= 800;
  return (
    <View style={styles.tabContainer}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
          onPress={() => onTabPress(tab.key)}
        >
          {getTabIcon(tab.key, activeTab === tab.key)}
          {isWeb && isWide ? (
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.activeTabButtonText, { marginLeft: 6 }]}>
              {tab.title}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TabBar;