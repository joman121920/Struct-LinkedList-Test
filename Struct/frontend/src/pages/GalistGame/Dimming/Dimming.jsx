import { useState, useEffect, useRef, useCallback } from 'react';

// Energy system constants
const MAX_ENERGY = 50;
const MIN_ENERGY = 0;
const DIMMING_START_ENERGY = 40; // Start dimming when energy drops to 40
const ENERGY_DECAY_RATE = 0.5;
const PEEK_ENERGY_GAIN = 25; // Gain 25 energy when using PEEK
const ENERGY_UPDATE_INTERVAL = 300; // Update energy every 300ms (faster decay)
const LOW_ENERGY_THRESHOLD = 20; // Play warning sound when energy reaches this level

// Custom hook for dimming functionality
export const useDimming = () => {
  // Energy-based brightness system for PEEK game mechanic
  const [energy, setEnergy] = useState(MAX_ENERGY); // Start with max energy
  const [screenOpacity, setScreenOpacity] = useState(1); // 1 = fully bright, 0 = completely dark
  const [startDimming, setStartDimming] = useState(false); // Control when energy system and dimming begins

  // Refs
  const energyTimerRef = useRef(null);
  const lowEnergySoundPlayedRef = useRef(false); // Track if low energy sound has been played
  const alarmAudioRef = useRef(null); // Track alarm audio to stop it when needed

  // Energy-based brightness management system
  const updateBrightnessFromEnergy = useCallback(() => {
    // Don't start dimming until the exercise has actually started
    if (!startDimming) {
      setScreenOpacity(1);
      return;
    }

    if (energy >= DIMMING_START_ENERGY) {
      // Full brightness when energy is above 40
      setScreenOpacity(1);
    } else {
      // Gradual dimming from energy 40 to 0
      const energyRange = DIMMING_START_ENERGY - MIN_ENERGY; // 40
      const currentEnergyInRange = energy - MIN_ENERGY; // How much energy above minimum
      const brightnessRatio = currentEnergyInRange / energyRange; // 0 to 1 scale
      const opacity = Math.max(0.05, brightnessRatio); // Never go completely black
      setScreenOpacity(opacity);
    }
  }, [energy, startDimming]); // Depend on both energy and startDimming

  // Energy decay system
  const startEnergyDecay = useCallback(() => {
    // Clear existing timer
    if (energyTimerRef.current) {
      clearInterval(energyTimerRef.current);
    }

    // Start energy decay timer
    energyTimerRef.current = setInterval(() => {
      setEnergy(prevEnergy => {
        const newEnergy = Math.max(MIN_ENERGY, prevEnergy - ENERGY_DECAY_RATE);
        
        // Play warning sound when energy drops to low threshold (only once)
        if (newEnergy <= LOW_ENERGY_THRESHOLD && !lowEnergySoundPlayedRef.current) {
          lowEnergySoundPlayedRef.current = true;
          try {
            const audio = new window.Audio('/sounds/alarm.mp3');
            audio.loop = true; // Loop the alarm while energy is low
            audio.volume = 0.4;
            alarmAudioRef.current = audio; // Store reference to stop later
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {/* Ignore play errors */});
            }
          } catch {
            // Ignore audio errors
          }
        }
        
        // Stop alarm when energy goes above threshold
        if (newEnergy > LOW_ENERGY_THRESHOLD && alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current.currentTime = 0;
          alarmAudioRef.current = null;
          lowEnergySoundPlayedRef.current = false;
        }
        
        return newEnergy;
      });
    }, ENERGY_UPDATE_INTERVAL);
  }, []); // No dependencies needed since constants are stable

  // Pause energy decay system
  const pauseEnergyDecay = useCallback(() => {
    if (energyTimerRef.current) {
      clearInterval(energyTimerRef.current);
      energyTimerRef.current = null;
    }
    // Stop alarm when pausing
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }
    lowEnergySoundPlayedRef.current = false;
  }, []);

  // Reset energy to maximum and restart decay
  const resetEnergySystem = useCallback(() => {
    setEnergy(MAX_ENERGY);
    setScreenOpacity(1);
    lowEnergySoundPlayedRef.current = false;
    // Stop any existing alarm
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }
    // Restart energy decay
    startEnergyDecay();
  }, [startEnergyDecay]); // Only depend on startEnergyDecay since MAX_ENERGY is stable

  // PEEK energy boost function
  const boostEnergyWithPeek = useCallback(() => {
    setEnergy(prevEnergy => {
      const newEnergy = Math.min(MAX_ENERGY, prevEnergy + PEEK_ENERGY_GAIN);
      // Stop alarm and reset flag if energy is restored above threshold
      if (newEnergy > LOW_ENERGY_THRESHOLD) {
        if (alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current.currentTime = 0;
          alarmAudioRef.current = null;
        }
        lowEnergySoundPlayedRef.current = false;
      }
      return newEnergy;
    });
  }, []); // No dependencies needed since constants are stable

  // Update screen brightness whenever energy changes
  useEffect(() => {
    updateBrightnessFromEnergy();
  }, [energy, updateBrightnessFromEnergy]);

  // Initialize energy system when dimming starts
  useEffect(() => {
    // Only start energy system when dimming has been enabled (not affected by instruction popup)
    if (!startDimming) return;
    
    startEnergyDecay();
    
    return () => {
      if (energyTimerRef.current) {
        clearInterval(energyTimerRef.current);
      }
      // Stop alarm on cleanup
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current = null;
      }
    };
  }, [startEnergyDecay, startDimming]); // Depend on startDimming

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (energyTimerRef.current) {
        clearInterval(energyTimerRef.current);
      }
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current = null;
      }
    };
  }, []);

  // Return all the necessary state and functions
  return {
    // State
    energy,
    screenOpacity,
    startDimming,
    
    // Controls
    setStartDimming,
    
    // Functions
    boostEnergyWithPeek,
    pauseEnergyDecay,
    resetEnergySystem,
    startEnergyDecay,
    
    // For external control
    setEnergy,
    setScreenOpacity
  };
};

export default useDimming;
