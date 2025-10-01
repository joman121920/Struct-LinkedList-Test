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

const Collectibles = ({ onCollect, isGameActive, gameOver, collectibles, setCollectibles, collisions, setCollisions }) => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

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

    // Spawn one immediate collectible so player sees them quickly
    try {
      // Try to spawn a timer first for helpfulness
      spawnTimer();
    } catch {
      // ignore
    }

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
        onCollect(-45); // Decrease 45 seconds (restored original value)
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

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      // Correct answer - give bonus time and remove collectible
      setCollectibles(prev => prev.filter(c => c.id !== currentQuestion.collectibleId));
      onCollect(30); // 30 seconds for correct quiz answer
    }
    
    // Show feedback for 3 seconds, then close modal
    setTimeout(() => {
      setShowQuizModal(false);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }, 3000);
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