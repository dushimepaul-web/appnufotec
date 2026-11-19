// src/contexts/PlayerContext.js
import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';

export const PlayerStateContext = createContext(null);
export const PlayerActionsContext = createContext(null);

export function PlayerProvider({ children }) {
  const [activeSound, setActiveSoundState] = useState(null);
  const [isPlaying, setIsPlayingState] = useState(false);
  const soundRef = useRef(null);

  const setActiveSound = useCallback((sound) => {
    soundRef.current = sound;
    setActiveSoundState(sound);
  }, []);

  const setIsPlaying = useCallback((value) => {
    setIsPlayingState(value);
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      const player = soundRef.current;
      if (player) {
        player.pause();
        soundRef.current = null;
        setActiveSoundState(null);
        setIsPlayingState(false);
      }
    } catch (error) {
      console.error('stopPlayback error:', error);
    }
  }, []);

  const clearSound = useCallback((player) => {
    if (soundRef.current === player) {
      soundRef.current = null;
      setActiveSoundState(null);
      setIsPlayingState(false);
    }
  }, []);

  const stateValue = useMemo(
    () => ({ activeSound, isPlaying }),
    [activeSound, isPlaying]
  );

  const actionsValue = useMemo(
    () => ({ setActiveSound, setIsPlaying, stopPlayback, clearSound }),
    [setActiveSound, setIsPlaying, stopPlayback, clearSound]
  );

  return (
    <PlayerActionsContext.Provider value={actionsValue}>
      <PlayerStateContext.Provider value={stateValue}>
        {children}
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}
