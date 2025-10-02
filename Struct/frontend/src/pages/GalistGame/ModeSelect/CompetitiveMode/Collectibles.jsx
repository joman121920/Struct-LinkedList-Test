import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './Collectibles.module.css';

// Quiz questions for timer collectibles
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "In a singly linked list, what does the head pointer represent?",
    options: [
      "A. The last node in the list",
      "B. The first node in the list",
      "C. A temporary node for traversal",
      "D. The total number of nodes"
    ],
    correctAnswer: 1 // B
  },
  {
    id: 2,
    question: "What is the time complexity of inserting a node at the beginning of a singly linked list?",
    options: [
      "A. O(n)",
      "B. O(log n)",
      "C. O(1)",
      "D. O(n²)"
    ],
    correctAnswer: 2 // C
  },
  {
    id: 3,
    question: "In a linked list node, what does the 'next' pointer contain?",
    options: [
      "A. The data of the next node",
      "B. The address of the next node",
      "C. The index of the next node",
      "D. The size of the next node"
    ],
    correctAnswer: 1 // B
  },
  {
    id: 4,
    question: "What value should the 'next' pointer of the last node in a linked list contain?",
    options: [
      "A. 0",
      "B. -1",
      "C. NULL",
      "D. The address of the first node"
    ],
    correctAnswer: 2 // C
  },
  {
    id: 5,
    question: "What is the main advantage of a linked list over an array?",
    options: [
      "A. Faster access to elements",
      "B. Dynamic size allocation",
      "C. Less memory usage",
      "D. Better cache performance"
    ],
    correctAnswer: 1 // B
  },
  {
    id: 6,
    question: "To delete a node from the middle of a singly linked list, you need:",
    options: [
      "A. Only the node to be deleted",
      "B. The node after the one to be deleted",
      "C. The node before the one to be deleted",
      "D. Both previous and next nodes"
    ],
    correctAnswer: 2 // C
  },
  {
    id: 7,
    question: "What is the time complexity of searching for an element in a singly linked list?",
    options: [
      "A. O(1)",
      "B. O(log n)",
      "C. O(n)",
      "D. O(n²)"
    ],
    correctAnswer: 2 // C
  },
  {
    id: 8,
    question: "In a circular linked list, the last node points to:",
    options: [
      "A. NULL",
      "B. The first node",
      "C. The second node",
      "D. Itself"
    ],
    correctAnswer: 1 // B
  },
  {
    id: 9,
    question: "What happens when you try to access a node after the tail in a singly linked list?",
    options: [
      "A. Returns the head node",
      "B. Returns NULL or causes an error",
      "C. Creates a new node",
      "D. Returns the previous node"
    ],
    correctAnswer: 1 // B
  },
  {
    id: 10,
    question: "Which operation is most efficient at the beginning of a singly linked list?",
    options: [
      "A. Deletion",
      "B. Insertion",
      "C. Both insertion and deletion",
      "D. Neither insertion nor deletion"
    ],
    correctAnswer: 2 // C
  }
];

// ===== COLLECTIBLE SPAWN PATTERN CONFIGURATION =====
// 
// 🎮 HOW TO CUSTOMIZE COLLECTIBLE PATTERNS:
//
// 1. QUANTITY CONTROL:
//    - MAX_TOTAL_COLLECTIBLES: Total items on screen (lower = less chaos)
//    - MAX_TIMERS/MAX_BOMBS: Individual limits for each type
//
// 2. TIMING CONTROL:
//    - INITIAL_SPAWN_DELAY: How long to wait before first collectible appears
//    - SPAWN_INTERVAL: How often to check for spawning new collectibles
//
// 3. SPAWN PROBABILITY:
//    - TIMER_SPAWN_CHANCE: 0.0-1.0 (0 = never, 1 = always when conditions met)
//    - BOMB_SPAWN_CHANCE: 0.0-1.0 (higher = more bombs = more challenging)
//
// 4. DIFFICULTY TUNING:
//    - TIMER_LIFESPAN: How long timers stay (longer = easier to collect)
//    - BOMB_LIFESPAN: How long bombs stay (shorter = less dangerous)
//    - MIN/MAX_SPEED: Movement speed range (slower = easier to avoid)
//
// 🎯 EXAMPLE DIFFICULTY PRESETS:
// Easy: MAX_TOTAL: 2, TIMER_CHANCE: 0.5, BOMB_CHANCE: 0.3, SPEEDS: 0.2-0.8
// Hard: MAX_TOTAL: 6, TIMER_CHANCE: 0.2, BOMB_CHANCE: 0.8, SPEEDS: 1.0-2.5
//
const SPAWN_CONFIG = {
  // Maximum collectibles on screen at once
  MAX_TOTAL_COLLECTIBLES: 7,
  MAX_TIMERS: 2,
  MAX_BOMBS: 5,
  
  // Spawn timing (in milliseconds)
  INITIAL_SPAWN_DELAY: 0,    // Wait 1 second before first spawn
  SPAWN_INTERVAL: Math.floor(Math.random() * 7000) + 3000,        // Check for spawning every 3-10 seconds
  
  // Spawn probabilities (0.0 to 1.0)
  TIMER_SPAWN_CHANCE: 0.3,      // 30% chance to spawn timer
  BOMB_SPAWN_CHANCE: 0.7,       // 70% chance to spawn bomb

  // Lifespan (how long they stay on screen)
  TIMER_LIFESPAN: 15000,        // 15 seconds
  BOMB_LIFESPAN: 25000,         // 25 seconds
  
  // Movement speed
  MIN_SPEED: 0.8,
  MAX_SPEED: 2.0,
};

const Collectibles = ({ onCollect, isGameActive, gameOver, collectibles, setCollectibles, collisions, setCollisions }) => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100); 

  // Generate random position avoiding UI elements
  const generateRandomPosition = useCallback(() => {
    const margin = 100; // Avoid edges and UI elements
    const x = margin + Math.random() * (window.innerWidth - 2 * margin);
    const y = margin + Math.random() * (window.innerHeight - 2 * margin);
    return { x, y };
  }, []);

  // Spawn collectibles with controlled pattern
  useEffect(() => {
    if (!isGameActive || gameOver) return;

    // Single spawn function that handles both types
    const spawnCollectible = () => {
      setCollectibles(prev => {
        const timerCount = prev.filter(c => c.type === 'timer').length;
        const bombCount = prev.filter(c => c.type === 'bomb').length;
        
        // Check limits
        if (prev.length >= SPAWN_CONFIG.MAX_TOTAL_COLLECTIBLES) {
          console.log('Max collectibles reached, skipping spawn');
          return prev;
        }

        // Determine what to spawn based on current counts and probabilities
        let shouldSpawnTimer = false;
        let shouldSpawnBomb = false;

        if (timerCount < SPAWN_CONFIG.MAX_TIMERS && Math.random() < SPAWN_CONFIG.TIMER_SPAWN_CHANCE) {
          shouldSpawnTimer = true;
        }
        
        if (bombCount < SPAWN_CONFIG.MAX_BOMBS && Math.random() < SPAWN_CONFIG.BOMB_SPAWN_CHANCE) {
          shouldSpawnBomb = true;
        }

        // If both want to spawn, randomly pick one to prevent overcrowding
        if (shouldSpawnTimer && shouldSpawnBomb) {
          if (Math.random() < 0.5) {
            shouldSpawnBomb = false;
          } else {
            shouldSpawnTimer = false;
          }
        }

        const newCollectibles = [];

        // Spawn timer if decided
        if (shouldSpawnTimer) {
          const speed = SPAWN_CONFIG.MIN_SPEED + Math.random() * (SPAWN_CONFIG.MAX_SPEED - SPAWN_CONFIG.MIN_SPEED);
          newCollectibles.push({
            id: `timer_${Date.now()}_${Math.random()}`,
            type: 'timer',
            ...generateRandomPosition(),
            velocityX: (Math.random() - 0.5) * speed * 2,
            velocityY: (Math.random() - 0.5) * speed * 2,
            lifespan: SPAWN_CONFIG.TIMER_LIFESPAN,
            createdAt: Date.now(),
          });
          console.log('Spawned timer collectible');
        }

        // Spawn bomb if decided
        if (shouldSpawnBomb) {
          const speed = SPAWN_CONFIG.MIN_SPEED + Math.random() * (SPAWN_CONFIG.MAX_SPEED - SPAWN_CONFIG.MIN_SPEED);
          newCollectibles.push({
            id: `bomb_${Date.now()}_${Math.random()}`,
            type: 'bomb',
            ...generateRandomPosition(),
            velocityX: (Math.random() - 0.5) * speed * 2,
            velocityY: (Math.random() - 0.5) * speed * 2,
            lifespan: SPAWN_CONFIG.BOMB_LIFESPAN,
            createdAt: Date.now(),
          });
          console.log('Spawned bomb collectible');
        }

        return [...prev, ...newCollectibles];
      });
    };

    // Wait for initial delay, then start spawning
    const initialTimeout = setTimeout(() => {
      spawnCollectible(); // First spawn after delay
      
      // Then set up regular interval
      const spawnInterval = setInterval(spawnCollectible, SPAWN_CONFIG.SPAWN_INTERVAL);
      
      // Store interval reference for cleanup
      return () => clearInterval(spawnInterval);
    }, SPAWN_CONFIG.INITIAL_SPAWN_DELAY);

    return () => {
      clearTimeout(initialTimeout);
    };
  }, [isGameActive, gameOver, generateRandomPosition, setCollectibles]);

  // Handle collisions from parent component
  useEffect(() => {
    if (!collisions || collisions.length === 0) return;

    console.log('Processing collisions:', collisions); // Debug log
    
    // Process each unique collectible collision only once
    const processedCollectibles = new Set();
    
    collisions.forEach(collision => {
      // Skip if we already processed this collectible in this batch
      if (processedCollectibles.has(collision.collectibleId)) return;
      
      const collectible = collectibles.find(c => c.id === collision.collectibleId);
      if (!collectible) return;

      processedCollectibles.add(collision.collectibleId);

      if (collision.collectibleType === 'timer') {
        console.log('Timer collision detected!', collision); // Debug log
        
        // Close any existing modal first
        setShowQuizModal(false);
        setCurrentQuestion(null);
        
        // Small delay to ensure state cleanup, then open new modal
        setTimeout(() => {
          const randomQuestion = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
          console.log('Opening quiz modal with question:', randomQuestion); // Debug log
          setCurrentQuestion({ ...randomQuestion, collectibleId: collision.collectibleId });
          setShowQuizModal(true);
        }, 100);
        
        // Remove the collectible
        setCollectibles(prev => prev.filter(c => c.id !== collision.collectibleId));
      } else if (collision.collectibleType === 'bomb') {
        console.log('Bomb collision detected!', collision); // Debug log
        // Bombs give immediate penalty and remove collectible
        setCollectibles(prev => prev.filter(c => c.id !== collision.collectibleId));
        onCollect(-20); // Decrease 20 seconds (restored original value)
      }
    });

    // Clear processed collisions after a short delay to ensure proper processing
    setTimeout(() => {
      setCollisions([]);
    }, 50);
  }, [collisions, collectibles, setCollectibles, setCollisions, onCollect]);

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
  }, [isGameActive, gameOver, setCollectibles]);

  // Remove click handling since we now use collision detection

  // Handle quiz answer selection
  const handleQuizAnswer = (answerIndex) => {
    if (!currentQuestion || showFeedback) return; // Prevent multiple clicks during feedback

    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
    setProgressWidth(100); // Reset progress bar to full

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      // Correct answer - give bonus time and remove collectible
      setCollectibles(prev => prev.filter(c => c.id !== currentQuestion.collectibleId));
      onCollect(30); // 30 seconds for correct quiz answer
    }
    
    // Start progress bar countdown animation with immediate start
    const duration = 3000; // 3 seconds
    
    const animate = (startTime) => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const remaining = 1 - progress;
      const newWidth = remaining * 100;
      
      console.log('Progress update:', { elapsed, progress, remaining, newWidth }); // Debug log
      setProgressWidth(newWidth);
      
      if (progress < 1) {
        requestAnimationFrame(() => animate(startTime));
      } else {
        // Close modal when countdown completes
        setTimeout(() => {
          setShowQuizModal(false);
          setCurrentQuestion(null);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setProgressWidth(100);
        }, 100); // Small delay to ensure final frame is rendered
      }
    };
    
    // Start animation immediately
    const startTime = Date.now();
    animate(startTime);
  };

  // Close quiz modal
  const closeQuizModal = () => {
    if (showFeedback) return; // Prevent closing during feedback display
    setShowQuizModal(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
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
              zIndex: 2500,
            }}
            title={isTimer ? "Hit with bullet to open quiz for +30 seconds!" : "Hit with bullet to trigger bomb -15 seconds!"}
          >
            <div className={styles.timerIcon}>
              {isTimer ? '⏰' : '💣'}
            </div>
            <div className={styles.timerBonus}>
              {isTimer ? '+30s' : '-15s'}
            </div>
          </div>
        );
      })}
      
      {/* Quiz Modal */}
      {showQuizModal && currentQuestion && (
        <div className={styles.quizOverlay} onClick={closeQuizModal}>
          <div className={styles.quizModal} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.quizQuestion}>
              {currentQuestion.question}
            </div>
            
            {/* Feedback text - only show during feedback */}
            {showFeedback && (
              <div className={styles.feedbackText}>
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <span className={styles.correctText}>✓ Correct!</span>
                ) : (
                  <span className={styles.incorrectText}>✗ Incorrect</span>
                )}
              </div>
            )}
            
            <div className={styles.quizOptions}>
              {currentQuestion.options.map((option, index) => {
                let optionClass = styles.quizOption;
                let optionStyle = {};
                
                if (showFeedback) {
                  if (index === currentQuestion.correctAnswer) {
                    // Correct answer - always green
                    optionStyle = {
                      backgroundColor: 'rgba(0, 255, 0, 0.3)',
                      borderColor: '#00ff00'
                    };
                  } else if (index === selectedAnswer) {
                    // Selected wrong answer - red
                    optionStyle = {
                      backgroundColor: 'rgba(255, 0, 0, 0.3)',
                      borderColor: '#ff0000'
                    };
                  }
                }
                
                return (
                  <button
                    key={index}
                    className={optionClass}
                    style={optionStyle}
                    onClick={() => handleQuizAnswer(index)}
                    disabled={showFeedback}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            
            {/* Progress bar - only show during feedback */}
            {showFeedback && (
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBar}
                  style={{
                    width: `${progressWidth}%`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

Collectibles.propTypes = {
  onCollect: PropTypes.func.isRequired,
  isGameActive: PropTypes.bool.isRequired,
  gameOver: PropTypes.bool.isRequired,
  collectibles: PropTypes.array.isRequired,
  setCollectibles: PropTypes.func.isRequired,
  collisions: PropTypes.array.isRequired,
  setCollisions: PropTypes.func.isRequired,
};

export default Collectibles;