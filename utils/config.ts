// Environment configuration for OpenRouter API
// In a production app, you'd want to use Expo Constants or a secure storage solution
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on iPhone 12 scale
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const scale = (size: number) => {
  if (Platform.OS === 'web') return size; // No scaling on web
  const scaled = SCREEN_WIDTH / guidelineBaseWidth * size;
  return Math.max(Math.min(scaled, size * 1.5), size * 0.7); // Cap scaling
};

export const verticalScale = (size: number) => {
  if (Platform.OS === 'web') return size;
  const scaled = SCREEN_HEIGHT / guidelineBaseHeight * size;
  return Math.max(Math.min(scaled, size * 1.5), size * 0.7);
};

export const moderateScale = (size: number, factor = 0.5) => {
  if (Platform.OS === 'web') return size;
  const scaled = size + (scale(size) - size) * factor;
  return Math.max(Math.min(scaled, size * 1.5), size * 0.7);
};

export const scaleFont = (size: number) => {
  if (Platform.OS === 'web') return size;
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const config = {
  openRouter: {
    apiKey: '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',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-r1-0528:free'
  }
}; 