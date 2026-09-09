import React, { useState } from 'react';
import { Pressable } from 'react-native';
import * as Speech from 'expo-speech';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface VoiceButtonProps {
  text: string;
}

export function VoiceButton({ text }: VoiceButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handlePress = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <Pressable onPress={handlePress} className="ml-2 p-1 bg-surface-variant rounded-full">
      <MaterialIcons name={isSpeaking ? "volume-off" : "volume-up"} size={20} color="#4F4639" />
    </Pressable>
  );
}
