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

// ... existing code ... 