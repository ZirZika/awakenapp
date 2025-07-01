import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  style?: any;
  onComplete?: () => void;
}

export default function TypewriterText({ 
  text, 
  speed = 100, 
  style, 
  onComplete 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Split the text at the period to handle the two lines
  const splitText = text.split('. ');
  const firstLine = splitText[0]; // "System active"
  const secondLine = splitText[1]; // "Awaiting directive"

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      // Text is complete, call onComplete callback
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Cursor blinking effect - only show when typing is complete
  useEffect(() => {
    if (isComplete) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 530);

      return () => clearInterval(cursorInterval);
    }
  }, [isComplete]);

  // Determine what to display
  const getDisplayContent = () => {
    const totalDisplayed = displayedText.length;
    const firstLineLength = firstLine.length;
    const separatorLength = 2; // ". " length
    
    if (totalDisplayed <= firstLineLength) {
      // Still typing first line
      return {
        line1: displayedText,
        line2: '',
        showSecondLine: false
      };
    } else if (totalDisplayed <= firstLineLength + separatorLength) {
      // Finished first line, showing separator
      return {
        line1: firstLine,
        line2: '',
        showSecondLine: true
      };
    } else {
      // Typing second line
      const secondLineProgress = totalDisplayed - firstLineLength - separatorLength;
      return {
        line1: firstLine,
        line2: secondLine.substring(0, secondLineProgress),
        showSecondLine: true
      };
    }
  };

  const { line1, line2, showSecondLine } = getDisplayContent();
  const shouldShowCursor = isComplete && showCursor;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.systemActive, style]}>
        {line1}
      </Text>
      {showSecondLine && (
        <Text style={[styles.text, style]}>
          {line2}
          <Text style={[styles.cursor, style, { opacity: shouldShowCursor ? 1 : 0 }]}>
            .
          </Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Orbitron-Regular',
    textAlign: 'center',
  },
  systemActive: {
    color: '#10b981', // Green color for "System active"
  },
  cursor: {
    fontFamily: 'Orbitron-Regular',
    // Use opacity instead of conditional rendering to prevent layout shifts
  },
});