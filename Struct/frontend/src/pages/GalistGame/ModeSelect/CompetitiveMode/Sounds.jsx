// Sound utility functions for game effects

// Preloaded audio instances to avoid delays
const audioInstances = {
  linkSound: null,
  bombCollectible: null,
  clockCollectible: null,
  alarmSound: null,
  firstClick: null,
  swapSound: null,
  claimSound: null,
  hoverSound: null,
  selectSound: null
};

// Initialize and preload all audio
const initializeAudio = () => {
  try {
    // Preload link sound
    audioInstances.linkSound = new Audio('/sounds/link_sound.wav');
    audioInstances.linkSound.preload = 'auto';
    audioInstances.linkSound.volume = 0.5;
    
    // Preload bomb collectible sound
    audioInstances.bombCollectible = new Audio('/sounds/explode.mp3');
    audioInstances.bombCollectible.preload = 'auto';
    audioInstances.bombCollectible.volume = 0.6;
    
    // Preload clock collectible sound
    audioInstances.clockCollectible = new Audio('/sounds/clock.wav');
    audioInstances.clockCollectible.preload = 'auto';
    audioInstances.clockCollectible.volume = 0.5;
    
    // Preload alarm sound
    audioInstances.alarmSound = new Audio('/sounds/alarm.mp3');
    audioInstances.alarmSound.preload = 'auto';
    audioInstances.alarmSound.volume = 0.4;
    audioInstances.alarmSound.loop = true; // Loop the alarm sound
    
    // Preload first click sound
    audioInstances.firstClick = new Audio('/sounds/first_click.mp3');
    audioInstances.firstClick.preload = 'auto';
    audioInstances.firstClick.volume = 0.5;
    
    // Preload swap sound
    audioInstances.swapSound = new Audio('/sounds/swap_sound.mp3');
    audioInstances.swapSound.preload = 'auto';
    audioInstances.swapSound.volume = 0.6;
    
    // Preload claim sound
    audioInstances.claimSound = new Audio('/sounds/claim_sound.wav');
    audioInstances.claimSound.preload = 'auto';
    audioInstances.claimSound.volume = 0.7;
    
    // Preload hover sound
    audioInstances.hoverSound = new Audio('/sounds/hover_sound.mp3');
    audioInstances.hoverSound.preload = 'auto';
    audioInstances.hoverSound.volume = 0.3;
    
    // Preload select sound
    audioInstances.selectSound = new Audio('/sounds/select_sound.wav');
    audioInstances.selectSound.preload = 'auto';
    audioInstances.selectSound.volume = 0.5;
    
    // Force load the audio files
    Object.values(audioInstances).forEach(audio => {
      if (audio) {
        audio.load();
      }
    });
    
    console.log('Audio preloading initialized');
  } catch (error) {
    console.warn('Error initializing audio:', error);
  }
};

// Initialize audio immediately
initializeAudio();

// Create and play link sound effect
export const playLinkSound = () => {
  try {
    if (!audioInstances.linkSound) {
      audioInstances.linkSound = new Audio('/sounds/link_sound.wav');
      audioInstances.linkSound.volume = 0.5;
    }
    
    const audio = audioInstances.linkSound.cloneNode();
    audio.volume = 0.5;
    
    audio.play().catch(error => {
      console.warn('Could not play link sound:', error);
    });
  } catch (error) {
    console.warn('Error creating link sound:', error);
  }
};

// Create and play bomb collectible sound effect
export const playBombCollectibleSound = () => {
  try {
    if (!audioInstances.bombCollectible) {
      audioInstances.bombCollectible = new Audio('/sounds/explode.mp3');
      audioInstances.bombCollectible.volume = 0.6;
    }
    
    const audio = audioInstances.bombCollectible.cloneNode();
    audio.volume = 0.6;
    
    console.log('Playing bomb collectible sound...');
    audio.play().then(() => {
      console.log('Bomb sound played successfully');
    }).catch(error => {
      console.warn('Could not play bomb collectible sound:', error);
    });
  } catch (error) {
    console.warn('Error creating bomb collectible sound:', error);
  }
};

// Create and play clock collectible sound effect
export const playClockCollectibleSound = () => {
  try {
    if (!audioInstances.clockCollectible) {
      audioInstances.clockCollectible = new Audio('/sounds/clock.wav');
      audioInstances.clockCollectible.volume = 0.5;
    }
    
    const audio = audioInstances.clockCollectible.cloneNode();
    audio.volume = 0.5;
    
    console.log('Playing clock collectible sound...');
    audio.play().then(() => {
      console.log('Clock sound played successfully');
    }).catch(error => {
      console.warn('Could not play clock collectible sound:', error);
      // Try alternative approach if cloning fails
      try {
        audioInstances.clockCollectible.currentTime = 0;
        audioInstances.clockCollectible.play();
      } catch (fallbackError) {
        console.warn('Fallback clock sound also failed:', fallbackError);
      }
    });
  } catch (error) {
    console.warn('Error creating clock collectible sound:', error);
  }
};

// Create and play alarm sound for bomb nodes (looping)
export const playAlarmSound = () => {
  try {
    if (!audioInstances.alarmSound) {
      audioInstances.alarmSound = new Audio('/sounds/alarm.mp3');
      audioInstances.alarmSound.volume = 0.4;
      audioInstances.alarmSound.loop = true;
    }
    
    // Don't create a clone for looping audio, use the original instance
    audioInstances.alarmSound.currentTime = 0;
    audioInstances.alarmSound.loop = true;
    
    console.log('Playing alarm sound...');
    audioInstances.alarmSound.play().then(() => {
      console.log('Alarm sound started successfully');
    }).catch(error => {
      console.warn('Could not play alarm sound:', error);
    });
  } catch (error) {
    console.warn('Error creating alarm sound:', error);
  }
};

// Stop the alarm sound
export const stopAlarmSound = () => {
  try {
    if (audioInstances.alarmSound) {
      audioInstances.alarmSound.pause();
      audioInstances.alarmSound.currentTime = 0;
      console.log('Alarm sound stopped');
    }
  } catch (error) {
    console.warn('Error stopping alarm sound:', error);
  }
};

// Create and play first click sound for sort modal
export const playFirstClickSound = () => {
  try {
    if (!audioInstances.firstClick) {
      audioInstances.firstClick = new Audio('/sounds/first_click.mp3');
      audioInstances.firstClick.volume = 0.5;
    }
    
    const audio = audioInstances.firstClick.cloneNode();
    audio.volume = 0.5;
    
    console.log('Playing first click sound...');
    audio.play().then(() => {
      console.log('First click sound played successfully');
    }).catch(error => {
      console.warn('Could not play first click sound:', error);
    });
  } catch (error) {
    console.warn('Error creating first click sound:', error);
  }
};

// Create and play swap sound for sort modal
export const playSwapSound = () => {
  try {
    if (!audioInstances.swapSound) {
      audioInstances.swapSound = new Audio('/sounds/swap_sound.mp3');
      audioInstances.swapSound.volume = 0.6;
    }
    
    const audio = audioInstances.swapSound.cloneNode();
    audio.volume = 0.6;
    
    console.log('Playing swap sound...');
    audio.play().then(() => {
      console.log('Swap sound played successfully');
    }).catch(error => {
      console.warn('Could not play swap sound:', error);
    });
  } catch (error) {
    console.warn('Error creating swap sound:', error);
  }
};

// Create and play claim sound when user claims points
export const playClaimSound = () => {
  try {
    if (!audioInstances.claimSound) {
      audioInstances.claimSound = new Audio('/sounds/claim_sound.wav');
      audioInstances.claimSound.volume = 0.7;
    }
    
    const audio = audioInstances.claimSound.cloneNode();
    audio.volume = 0.7;
    
    console.log('Playing claim sound...');
    audio.play().then(() => {
      console.log('Claim sound played successfully');
    }).catch(error => {
      console.warn('Could not play claim sound:', error);
    });
  } catch (error) {
    console.warn('Error creating claim sound:', error);
  }
};

// Create and play hover sound for UI interactions
export const playHoverSound = () => {
  try {
    if (!audioInstances.hoverSound) {
      audioInstances.hoverSound = new Audio('/sounds/hover_sound.mp3');
      audioInstances.hoverSound.volume = 0.3;
    }
    
    const audio = audioInstances.hoverSound.cloneNode();
    audio.volume = 0.3;
    
    audio.play().catch(error => {
      console.warn('Could not play hover sound:', error);
    });
  } catch (error) {
    console.warn('Error creating hover sound:', error);
  }
};

// Create and play select sound for selections and clicks
export const playSelectSound = () => {
  try {
    if (!audioInstances.selectSound) {
      audioInstances.selectSound = new Audio('/sounds/select_sound.wav');
      audioInstances.selectSound.volume = 0.5;
    }
    
    const audio = audioInstances.selectSound.cloneNode();
    audio.volume = 0.5;
    
    console.log('Playing select sound...');
    audio.play().then(() => {
      console.log('Select sound played successfully');
    }).catch(error => {
      console.warn('Could not play select sound:', error);
    });
  } catch (error) {
    console.warn('Error creating select sound:', error);
  }
};

// Activate audio context with user interaction
export const activateAudioContext = () => {
  try {
    // Create a silent audio context to activate browser audio
    const silentAudio = new Audio();
    silentAudio.volume = 0;
    silentAudio.play().then(() => {
      console.log('Audio context activated successfully');
      
      // Pre-play all sounds at zero volume to prepare them
      Object.values(audioInstances).forEach(audio => {
        if (audio) {
          try {
            const testAudio = audio.cloneNode();
            testAudio.volume = 0;
            testAudio.play().catch(() => {});
          } catch {
            // Silent fail for preparation
          }
        }
      });
    }).catch(() => {
      console.log('Audio context activation deferred until user interaction');
    });
  } catch (error) {
    console.warn('Error activating audio context:', error);
  }
};

// Preload audio for better performance
export const preloadLinkSound = () => {
  try {
    const audio = new Audio('/sounds/link_sound.wav');
    audio.preload = 'auto';
    return audio;
  } catch (error) {
    console.warn('Error preloading link sound:', error);
    return null;
  }
};

// Sound manager class for better control
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    
    // Preload common game sounds
    this.preloadGameSounds();
  }

  preloadGameSounds() {
    this.preloadSound('link', '/sounds/link_sound.wav');
    this.preloadSound('bombCollectible', '/sounds/explode.mp3');
    this.preloadSound('clockCollectible', '/sounds/clock.wav');
    this.preloadSound('alarm', '/sounds/alarm.mp3');
    this.preloadSound('firstClick', '/sounds/first_click.mp3');
    this.preloadSound('swapSound', '/sounds/swap.mp3');
    this.preloadSound('claimSound', '/sounds/claim_sound.wav');
    this.preloadSound('hoverSound', '/sounds/hover_sound.mp3');
    this.preloadSound('selectSound', '/sounds/select_sound.wav');
  }

  preloadSound(name, path) {
    try {
      this.sounds[name] = new Audio(path);
      this.sounds[name].preload = 'auto';
      this.sounds[name].volume = this.volume;
    } catch (error) {
      console.warn(`Error preloading sound ${name}:`, error);
    }
  }

  playSound(name) {
    if (!this.enabled || !this.sounds[name]) return;
    
    try {
      this.sounds[name].currentTime = 0;
      this.sounds[name].play().catch(error => {
        console.warn(`Could not play sound ${name}:`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound ${name}:`, error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(audio => {
      audio.volume = this.volume;
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

export default { 
  playLinkSound, 
  playBombCollectibleSound, 
  playClockCollectibleSound, 
  playAlarmSound,
  stopAlarmSound,
  playFirstClickSound,
  playSwapSound,
  playClaimSound,
  playHoverSound,
  playSelectSound,
  activateAudioContext,
  preloadLinkSound, 
  SoundManager 
};