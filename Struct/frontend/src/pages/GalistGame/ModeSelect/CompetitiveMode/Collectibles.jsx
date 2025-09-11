import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './Competitive.module.css';

const Collectibles = ({ onCollect, isGameActive, gameOver }) => {
  const [collectibles, setCollectibles] = useState([]);

  // Generate random position avoiding UI elements
  const generateRandomPosition = useCallback(() => {
    const margin = 100; // Avoid edges and UI elements
    const x = margin + Math.random() * (window.innerWidth - 2 * margin);
    const y = margin + Math.random() * (window.innerHeight - 2 * margin);
    return { x, y };
  }, []);

  // Spawn collectibles randomly with independent spawn rates
  useEffect(() => {
    if (!isGameActive || gameOver) return;

    // Separate spawn functions for timer and bomb
    const spawnTimer = () => {
      setCollectibles(prev => {
        // Check if there's space and if we don't already have too many timers
        const timerCount = prev.filter(c => c.type === 'timer').length;
        if (prev.length >= 6 || timerCount >= 4) return prev; // Max 6 total, max 4 timers

        const newTimer = {
          id: Date.now() + Math.random(),
          type: 'timer',
          ...generateRandomPosition(),
          velocityX: (Math.random() - 0.5) * 2, // Random floating speed
          velocityY: (Math.random() - 0.5) * 2,
          lifespan: 10000, // 8 seconds
          createdAt: Date.now(),
        };

        return [...prev, newTimer];
      });
    };

    const spawnBomb = () => {
      setCollectibles(prev => {
        // Check if there's space and if we don't already have too many bombs
        const bombCount = prev.filter(c => c.type === 'bomb').length;
        if (prev.length >= 6 || bombCount >= 4) return prev; // Max 6 total, max 4 bombs

        const newBomb = {
          id: Date.now() + Math.random() + 0.1, // Slightly different ID to avoid conflicts
          type: 'bomb',
          ...generateRandomPosition(),
          velocityX: (Math.random() - 0.5) * 2, // Random floating speed
          velocityY: (Math.random() - 0.5) * 2,
          lifespan: 25000, // 15 seconds
          createdAt: Date.now(),
        };

        return [...prev, newBomb];
      });
    };

    // Independent spawn intervals for timer and bomb
    const timerSpawnInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance to spawn timer
        spawnTimer();
      }
    }, 7000); // Check every 7 seconds for timer

    const bombSpawnInterval = setInterval(() => {
      if (Math.random() < 0.85) { // 85% chance to spawn bomb
        spawnBomb();
      }
    }, 7000); // Check every 7 seconds for bomb

    return () => {
      clearInterval(timerSpawnInterval);
      clearInterval(bombSpawnInterval);
    };
  }, [isGameActive, gameOver, generateRandomPosition]);

  // Animation loop for floating movement and cleanup
  useEffect(() => {
    if (!isGameActive || gameOver) return;

    const animationLoop = () => {
      setCollectibles(prev => 
        prev
          .map(collectible => {
            const now = Date.now();
            const age = now - collectible.createdAt;
            
            // Remove expired collectibles
            if (age > collectible.lifespan) {
              return null;
            }

            // Update position with floating movement
            let newX = collectible.x + collectible.velocityX;
            let newY = collectible.y + collectible.velocityY;
            let newVelocityX = collectible.velocityX;
            let newVelocityY = collectible.velocityY;

            // Controls collision detection (matching CollisionDetection.js logic)
            const controlsHeight = 90;
            const controlsWidth = 1320;
            const controlsLeft = window.innerWidth * 0.45 - controlsWidth / 2;
            const controlsRight = controlsLeft + controlsWidth;
            const controlsTop = window.innerHeight - 5 - controlsHeight;
            const controlsBottom = window.innerHeight - 10;
            const collectibleRadius = 25;

            // Check if collectible would hit the controls area
            if (newX + collectibleRadius >= controlsLeft && 
                newX - collectibleRadius <= controlsRight && 
                newY + collectibleRadius >= controlsTop && 
                newY - collectibleRadius <= controlsBottom) {
              
              // Calculate distances to each edge (like in CollisionDetection.js)
              const distanceToLeft = Math.abs((newX + collectibleRadius) - controlsLeft);
              const distanceToRight = Math.abs((newX - collectibleRadius) - controlsRight);
              const distanceToTop = Math.abs((newY + collectibleRadius) - controlsTop);
              const distanceToBottom = Math.abs((newY - collectibleRadius) - controlsBottom);
              
              const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
              
              // Bounce off the closest edge with proper positioning
              if (minDistance === distanceToLeft && newVelocityX > 0) {
                newVelocityX = -Math.abs(newVelocityX);
                newX = controlsLeft - collectibleRadius;
              } else if (minDistance === distanceToRight && newVelocityX < 0) {
                newVelocityX = Math.abs(newVelocityX);
                newX = controlsRight + collectibleRadius;
              } else if (minDistance === distanceToTop && newVelocityY > 0) {
                newVelocityY = -Math.abs(newVelocityY);
                newY = controlsTop - collectibleRadius;
              } else if (minDistance === distanceToBottom && newVelocityY < 0) {
                newVelocityY = Math.abs(newVelocityY);
                newY = controlsBottom + collectibleRadius;
              }
            }

            // Bounce off screen edges
            const margin = 50;
            if (newX <= margin || newX >= window.innerWidth - margin) {
              newVelocityX = -newVelocityX;
              newX = Math.max(margin, Math.min(window.innerWidth - margin, newX));
            }
            if (newY <= margin || newY >= window.innerHeight - margin) {
              newVelocityY = -newVelocityY;
              newY = Math.max(margin, Math.min(window.innerHeight - margin, newY));
            }

            return {
              ...collectible,
              x: newX,
              y: newY,
              velocityX: newVelocityX,
              velocityY: newVelocityY,
            };
          })
          .filter(Boolean) // Remove null entries
      );
    };

    const animationId = setInterval(animationLoop, 20); // 20 FPS for smooth movement

    return () => clearInterval(animationId);
  }, [isGameActive, gameOver]);

  // Handle single-click for both timer and bomb collectibles
  const handleClick = (collectibleId) => {
    const collectible = collectibles.find(c => c.id === collectibleId);
    if (!collectible) return;

    setCollectibles(prev => prev.filter(c => c.id !== collectibleId));

    if (collectible.type === 'timer') {
      onCollect(30); // Add 30 seconds
      // Play collection sound
      try {
        const audio = new window.Audio('/sounds/clock.wav');
        audio.currentTime = 0;
        audio.play().catch(() => {/* Ignore play errors */});
      } catch {
        // Ignore audio errors
      }
    } else if (collectible.type === 'bomb') {
      onCollect(-45); // Decrease 45 seconds
      // Play bomb sound
      try {
        const audio = new window.Audio('/sounds/click_bomb.mp3');
        audio.currentTime = 0;
        audio.play().catch(() => {/* Ignore play errors */});
      } catch {
        // Ignore audio errors
      }
    }
  };

  if (!isGameActive || gameOver) return null;

  return (
    <>
      {collectibles.map(collectible => {
        const age = Date.now() - collectible.createdAt;
        const opacity = Math.max(0.3, 1 - (age / collectible.lifespan));
        
        const isTimer = collectible.type === 'timer';
        
        return (
          <div
            key={collectible.id}
            className={isTimer ? styles.timerCollectible : styles.bombCollectible}
            style={{
              left: `${collectible.x - 25}px`,
              top: `${collectible.y + 28}px`,
              opacity,
            }}
            onClick={() => handleClick(collectible.id)}
            title={isTimer ? "Click to collect +30 seconds!" : "Click to trigger bomb -45 seconds!"}
          >
            <div className={styles.timerIcon}>
              {isTimer ? '⏰' : '💣'}
            </div>
            <div className={styles.timerBonus}>
              {isTimer ? '+30s' : '-45s'}
            </div>
          </div>
        );
      })}
    </>
  );
};

Collectibles.propTypes = {
  onCollect: PropTypes.func.isRequired,
  isGameActive: PropTypes.bool.isRequired,
  gameOver: PropTypes.bool.isRequired,
};

export default Collectibles;