// src/contexts/PlayerContext.js
import React, { createContext, useRef, useState } from 'react';

export const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [activeSound, setActiveSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);

  const stopPlayback = async () => {
    console.log('stopPlayback called - stopping audio'); // Debug
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        }
        soundRef.current = null;
        setActiveSound(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('stopPlayback error:', error);
    }
  };

  const value = {
    activeSound,
    setActiveSound: (sound) => {
      soundRef.current = sound;
      setActiveSound(sound);
    },
    isPlaying,
    setIsPlaying,
    stopPlayback, // ← La fonction est bien exposée ici
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}