// Sound utility functions for game effects

// Global settings
let soundEffectsEnabled = true;
let musicEnabled = true;

export const setSoundSettings = (soundFx, music) => {
  soundEffectsEnabled = soundFx;
  musicEnabled = music;
};

// Preloaded audio instances to avoid delays
const audioInstances = {
  linkSound: null,
  linkSound2: null, // Hit sound effect for circle collisions
  errorSound: null, // Error sound for wrong hits
  bombCollectible: null,
  clockCollectible: null,
  alarmSound: null,
  firstClick: null,
  swapSound: null,
  claimSound: null,
  hoverSound: null,
  selectSound: null,
  compeBgSong: null,
  menuBg: null,
  gameStartSound: null,
  tutorialBg: null,
  linkingBg: null,
  nodeCreationBg: null,
  insertionBg: null,
  dequeueSound: null,
  adtBg: null,
  keyboardSound: null
};

// Initialize and preload all audio
const initializeAudio = () => {
  try {
    // Preload link sound
    audioInstances.linkSound = new Audio('/sounds/link_sound.wav');
    audioInstances.linkSound.preload = 'auto';
    audioInstances.linkSound.volume = 0.5;
    
    // Preload hit sound (link_sound2)
    audioInstances.linkSound2 = new Audio('/sounds/link_sound.wav');
    audioInstances.linkSound2.preload = 'auto';
    audioInstances.linkSound2.volume = 0.6;
    
    // Preload error sound
    audioInstances.errorSound = new Audio('/sounds/error.mp3');
    audioInstances.errorSound.preload = 'auto';
    audioInstances.errorSound.volume = 0.7;
    
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
    
    // Preload competitive background music
    audioInstances.compeBgSong = new Audio('/sounds/compe_bgSong.mp3');
    audioInstances.compeBgSong.preload = 'auto';
    audioInstances.compeBgSong.volume = 0.1; // Very low volume for background music
    audioInstances.compeBgSong.loop = true; // Loop the background music
    
    // Preload menu background music
    audioInstances.menuBg = new Audio('/sounds/menu_bgm.mp3');
    audioInstances.menuBg.preload = 'auto';
    audioInstances.menuBg.volume = 0.15; // Slightly higher volume for menu music
    audioInstances.menuBg.loop = true; // Loop the menu music
    
    // Preload game start sound
    audioInstances.gameStartSound = new Audio('/sounds/game_start_sound.mp3');
    audioInstances.gameStartSound.preload = 'auto';
    audioInstances.gameStartSound.volume = 0.6;
    
    // Preload tutorial background music
    audioInstances.tutorialBg = new Audio('/sounds/tutorial_bgm.mp3');
    audioInstances.tutorialBg.preload = 'auto';
    audioInstances.tutorialBg.volume = 0.4; // Slightly lower than menu music
    audioInstances.tutorialBg.loop = true; // Loop the tutorial music
    
    // Preload linking background music
    audioInstances.linkingBg = new Audio('/sounds/linking_bgm.mp3');
    audioInstances.linkingBg.preload = 'auto';
    audioInstances.linkingBg.volume = 0.14; // Moderate volume for linking music
    audioInstances.linkingBg.loop = true; // Loop the linking music
    
    // Preload node creation background music
    audioInstances.nodeCreationBg = new Audio('/sounds/creation_bgm.mp3');
    audioInstances.nodeCreationBg.preload = 'auto';
    audioInstances.nodeCreationBg.volume = 0.14; // Lower volume for node creation music
    audioInstances.nodeCreationBg.loop = true; // Loop the node creation music
    
  // Preload insertion background music
  audioInstances.insertionBg = new Audio('/sounds/insertion_bgm.mp3');
  audioInstances.insertionBg.preload = 'auto';
  audioInstances.insertionBg.volume = 0.14; // Lower volume for insertion music
  audioInstances.insertionBg.loop = true; // Loop the insertion music
  
  // Preload dequeue sound effect
  audioInstances.dequeueSound = new Audio('/sounds/dequeue_soundfx.mp3');
  audioInstances.dequeueSound.preload = 'auto';
  audioInstances.dequeueSound.volume = 0.6; // Moderate volume for dequeue sound
  
  // Preload ADT background music
  audioInstances.adtBg = new Audio('/sounds/adt_bgm.mp3');
  audioInstances.adtBg.preload = 'auto';
  audioInstances.adtBg.volume = 0.14; // Lower volume for ADT background music
  audioInstances.adtBg.loop = true; // Loop the ADT music
  
  // Preload keyboard sound for typewriter effects
  audioInstances.keyboardSound = new Audio('/sounds/keyboard.mp3');
  audioInstances.keyboardSound.preload = 'auto';
  audioInstances.keyboardSound.volume = 0.3; // Low volume for subtle typing effect    // Force load the audio files
    Object.values(audioInstances).forEach(audio => {
      if (audio) {
        audio.load();
      }
    });
    
  } catch (error) {
    console.warn('Error initializing audio:', error);
  }
};

// Initialize audio immediately
initializeAudio();

// Create and play link sound effect
export const playLinkSound = () => {
  if (!soundEffectsEnabled) return;
  
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

// Create and play hit sound effect when bullet hits a circle
export const playHitSound = () => {
  if (!soundEffectsEnabled) return;
  
  try {
    if (!audioInstances.linkSound2) {
      audioInstances.linkSound2 = new Audio('/sounds/link_sound2.wav');
      audioInstances.linkSound2.volume = 0.6;
    }
    
    const audio = audioInstances.linkSound2.cloneNode();
    audio.volume = 0.6;
    
    audio.play().catch(error => {
      console.warn('Could not play hit sound:', error);
    });
  } catch (error) {
    console.warn('Error creating hit sound:', error);
  }
};

// Create and play error sound effect when hitting wrong circle
export const playErrorSound = () => {
  if (!soundEffectsEnabled) return;
  
  try {
    if (!audioInstances.errorSound) {
      audioInstances.errorSound = new Audio('/sounds/error.mp3');
      audioInstances.errorSound.volume = 0.7;
    }
    
    const audio = audioInstances.errorSound.cloneNode();
    audio.volume = 0.7;
    
    audio.play().catch(error => {
      console.warn('Could not play error sound:', error);
    });
  } catch (error) {
    console.warn('Error creating error sound:', error);
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
    
    audio.play().then(() => {
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
    
    audio.play().then(() => {
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
    
    audioInstances.alarmSound.play().then(() => {
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
    
    audio.play().then(() => {
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
    
    audio.play().then(() => {
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
    
    audio.play().then(() => {
    }).catch(error => {
      console.warn('Could not play claim sound:', error);
    });
  } catch (error) {
    console.warn('Error creating claim sound:', error);
  }
};

// Create and play hover sound for UI interactions
export const playHoverSound = () => {
  if (!soundEffectsEnabled) return;
  
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
    
    audio.play().then(() => {
    }).catch(error => {
      console.warn('Could not play select sound:', error);
    });
  } catch (error) {
    console.warn('Error creating select sound:', error);
  }
};

// Create and play dequeue sound effect
export const playDequeueSound = () => {
  if (!soundEffectsEnabled) return;
  
  try {
    if (!audioInstances.dequeueSound) {
      audioInstances.dequeueSound = new Audio('/sounds/dequeue_soundfx.mp3');
      audioInstances.dequeueSound.volume = 0.6;
    }
    
    const audio = audioInstances.dequeueSound.cloneNode();
    audio.volume = 0.6;
    
    audio.play().then(() => {
    }).catch(error => {
      console.warn('Could not play dequeue sound:', error);
    });
  } catch (error) {
    console.warn('Error creating dequeue sound:', error);
  }
};

// Create and play keyboard sound for typewriter effects
export const playKeyboardSound = () => {
  if (!soundEffectsEnabled) return;
  
  try {
    if (!audioInstances.keyboardSound) {
      audioInstances.keyboardSound = new Audio('/sounds/keyboard.mp3');
      audioInstances.keyboardSound.volume = 0.3;
    }
    
    const audio = audioInstances.keyboardSound.cloneNode();
    audio.volume = 0.3;
    
    audio.play().catch(error => {
      console.warn('Could not play keyboard sound:', error);
    });
  } catch (error) {
    console.warn('Error creating keyboard sound:', error);
  }
};

// Start playing competitive background music (looped)
export const playCompeBgSong = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.compeBgSong) {
      audioInstances.compeBgSong = new Audio('/sounds/compe_bgSong.mp3');
      audioInstances.compeBgSong.volume = 0.1;
      audioInstances.compeBgSong.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.compeBgSong.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.compeBgSong.volume = 0.1; // Explicitly set low volume
    audioInstances.compeBgSong.currentTime = 0;
    audioInstances.compeBgSong.loop = true;
    
    audioInstances.compeBgSong.play().then(() => {
    }).catch(error => {
      console.warn('Could not play competitive background music:', error);
    });
  } catch (error) {
    console.warn('Error starting competitive background music:', error);
  }
};

// Stop competitive background music
export const stopCompeBgSong = () => {
  try {
    if (audioInstances.compeBgSong) {
      audioInstances.compeBgSong.pause();
      audioInstances.compeBgSong.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping competitive background music:', error);
  }
};

// Restart competitive background music (for retry functionality)
export const restartCompeBgSong = () => {
  if (!musicEnabled) return;
  
  try {
    stopCompeBgSong(); // Stop current music
    setTimeout(() => {
      playCompeBgSong(); // Restart after brief pause
    }, 100);
  } catch (error) {
    console.warn('Error restarting competitive background music:', error);
  }
};

// Start playing menu background music (looped)
export const playMenuBgMusic = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.menuBg) {
      audioInstances.menuBg = new Audio('/sounds/menu_bgm.mp3');
      audioInstances.menuBg.volume = 0.15;
      audioInstances.menuBg.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.menuBg.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.menuBg.volume = 0.15;
    audioInstances.menuBg.currentTime = 0;
    audioInstances.menuBg.loop = true;
    
    audioInstances.menuBg.play().then(() => {
    }).catch(error => {
      console.warn('Could not play menu background music:', error);
    });
  } catch (error) {
    console.warn('Error starting menu background music:', error);
  }
};

// Stop menu background music
export const stopMenuBgMusic = () => {
  try {
    if (audioInstances.menuBg) {
      audioInstances.menuBg.pause();
      audioInstances.menuBg.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping menu background music:', error);
  }
};

// Play game start sound effect
export const playGameStartSound = () => {
  if (!soundEffectsEnabled) return;
  
  try {
    if (!audioInstances.gameStartSound) {
      audioInstances.gameStartSound = new Audio('/sounds/game_start_sound.mp3');
      audioInstances.gameStartSound.volume = 0.6;
    }
    
    const audio = audioInstances.gameStartSound.cloneNode();
    audio.volume = 0.6;
    
    audio.play().then(() => {
    }).catch(error => {
      console.warn('Could not play game start sound:', error);
    });
  } catch (error) {
    console.warn('Error creating game start sound:', error);
  }
};

// Start playing tutorial background music (looped)
export const playTutorialBgMusic = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.tutorialBg) {
      audioInstances.tutorialBg = new Audio('/sounds/tutorial_bgm.mp3');
      audioInstances.tutorialBg.volume = 0.4;
      audioInstances.tutorialBg.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.tutorialBg.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.tutorialBg.volume = 0.4;
    audioInstances.tutorialBg.currentTime = 0;
    audioInstances.tutorialBg.loop = true;

    audioInstances.tutorialBg.play().then(() => {
    }).catch(error => {
      console.warn('Could not play tutorial background music:', error);
    });
  } catch (error) {
    console.warn('Error starting tutorial background music:', error);
  }
};

// Stop tutorial background music
export const stopTutorialBgMusic = () => {
  try {
    if (audioInstances.tutorialBg) {
      audioInstances.tutorialBg.pause();
      audioInstances.tutorialBg.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping tutorial background music:', error);
  }
};

// Start playing node creation background music (looped)
export const playNodeCreationBgMusic = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.nodeCreationBg) {
      audioInstances.nodeCreationBg = new Audio('/sounds/creation_bgm.mp3');
      audioInstances.nodeCreationBg.volume = 0.14;
      audioInstances.nodeCreationBg.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.nodeCreationBg.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.nodeCreationBg.volume = 0.14;
    audioInstances.nodeCreationBg.currentTime = 0;
    audioInstances.nodeCreationBg.loop = true;

    audioInstances.nodeCreationBg.play().then(() => {
    }).catch(error => {
      console.warn('Could not play node creation background music:', error);
    });
  } catch (error) {
    console.warn('Error starting node creation background music:', error);
  }
};

// Stop node creation background music
export const stopNodeCreationBgMusic = () => {
  try {
    if (audioInstances.nodeCreationBg) {
      audioInstances.nodeCreationBg.pause();
      audioInstances.nodeCreationBg.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping node creation background music:', error);
  }
};

// Start playing linking background music (looped)
export const playLinkingBgMusic = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.linkingBg) {
      audioInstances.linkingBg = new Audio('/sounds/linking_bgm.mp3');
      audioInstances.linkingBg.volume = 0.14;
      audioInstances.linkingBg.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.linkingBg.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.linkingBg.volume = 0.14;
    audioInstances.linkingBg.currentTime = 0;
    audioInstances.linkingBg.loop = true;

    audioInstances.linkingBg.play().then(() => {
    }).catch(error => {
      console.warn('Could not play linking background music:', error);
    });
  } catch (error) {
    console.warn('Error starting linking background music:', error);
  }
};

// Stop linking background music
export const stopLinkingBgMusic = () => {
  try {
    if (audioInstances.linkingBg) {
      audioInstances.linkingBg.pause();
      audioInstances.linkingBg.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping linking background music:', error);
  }
};

// Start playing insertion background music (looped)
export const playInsertionBgMusic = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.insertionBg) {
      audioInstances.insertionBg = new Audio('/sounds/insertion_bgm.mp3');
      audioInstances.insertionBg.volume = 0.14;
      audioInstances.insertionBg.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.insertionBg.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.insertionBg.volume = 0.14;
    audioInstances.insertionBg.currentTime = 0;
    audioInstances.insertionBg.loop = true;

    audioInstances.insertionBg.play().then(() => {
    }).catch(error => {
      console.warn('Could not play insertion background music:', error);
    });
  } catch (error) {
    console.warn('Error starting insertion background music:', error);
  }
};

// Stop insertion background music
export const stopInsertionBgMusic = () => {
  try {
    if (audioInstances.insertionBg) {
      audioInstances.insertionBg.pause();
      audioInstances.insertionBg.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping insertion background music:', error);
  }
};

// Start playing ADT background music (looped)
export const playAdtBgMusic = () => {
  if (!musicEnabled) return;
  
  try {
    if (!audioInstances.adtBg) {
      audioInstances.adtBg = new Audio('/sounds/adt_bgm.mp3');
      audioInstances.adtBg.volume = 0.14;
      audioInstances.adtBg.loop = true;
    }
    
    // Check if music is already playing to prevent double playback
    if (!audioInstances.adtBg.paused) {
      return;
    }
    
    // Ensure volume is set correctly and reset to start
    audioInstances.adtBg.volume = 0.14;
    audioInstances.adtBg.currentTime = 0;
    audioInstances.adtBg.loop = true;

    audioInstances.adtBg.play().then(() => {
    }).catch(error => {
      console.warn('Could not play ADT background music:', error);
    });
  } catch (error) {
    console.warn('Error starting ADT background music:', error);
  }
};

// Stop ADT background music
export const stopAdtBgMusic = () => {
  try {
    if (audioInstances.adtBg) {
      audioInstances.adtBg.pause();
      audioInstances.adtBg.currentTime = 0;
    }
  } catch (error) {
    console.warn('Error stopping ADT background music:', error);
  }
};

// Activate audio context with user interaction
export const activateAudioContext = () => {
  try {
    // Create a silent audio context to activate browser audio
    const silentAudio = new Audio();
    silentAudio.volume = 0;
    silentAudio.play().then(() => {
      
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
    this.preloadSound('compeBgSong', '/sounds/compe_bgSong.mp3');
    this.preloadSound('menuBg', '/sounds/menu_bgm.mp3');
    this.preloadSound('gameStartSound', '/sounds/game_start_sound.mp3');
    this.preloadSound('tutorialBg', '/sounds/tutorial_bgm.mp3');
    this.preloadSound('nodeCreationBg', '/sounds/node_creation_bgm.mp3');
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
  playHitSound,
  playErrorSound,
  playBombCollectibleSound, 
  playClockCollectibleSound, 
  playAlarmSound,
  stopAlarmSound,
  playFirstClickSound,
  playSwapSound,
  playClaimSound,
  playHoverSound,
  playSelectSound,
  playDequeueSound,
  playKeyboardSound,
  playCompeBgSong,
  stopCompeBgSong,
  restartCompeBgSong,
  playMenuBgMusic,
  stopMenuBgMusic,
  playGameStartSound,
  playTutorialBgMusic,
  stopTutorialBgMusic,
  activateAudioContext,
  setSoundSettings,
  playNodeCreationBgMusic,
  stopNodeCreationBgMusic,
  playLinkingBgMusic,
  stopLinkingBgMusic,
  playInsertionBgMusic,
  stopInsertionBgMusic,
  playAdtBgMusic,
  stopAdtBgMusic,
  preloadLinkSound,
  SoundManager 
};