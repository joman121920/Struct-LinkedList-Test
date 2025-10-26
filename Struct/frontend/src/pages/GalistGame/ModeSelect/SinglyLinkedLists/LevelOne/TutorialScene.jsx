import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./NodeCreation.module.css";
import tutorialStyles from "./TutorialScene.module.css";
import { playTutorialBgMusic, stopTutorialBgMusic, playFirstClickSound, playNodeCreationBgMusic, playHitSound, playKeyboardSound } from "../../../Sounds.jsx";

// Tutorial Scene Component
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // State for tutorial floating circles (4 random values)
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [squareNode, setSquareNode] = useState({ value: "", address: "" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  // const [fadeIn, setFadeIn] = useState(false);
  const tutorialCirclesRef = useRef([]);
  const playedSoundsRef = useRef(new Set()); // Track which circles have already played sound
  
  // Typewriter effect states
  const [typedText, setTypedText] = useState("");
  const [, setIsTyping] = useState(false);
  
  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Start tutorial background music when component mounts
  useEffect(() => {
    playTutorialBgMusic();
    
    // Stop tutorial music when component unmounts
    return () => {
      stopTutorialBgMusic();
    };
  }, []);

  // Handle fade-in animation for scene4
  // useEffect(() => {
  //   if (scene === 'scene4') {
  //     setFadeIn(false);
  //     const timer = setTimeout(() => {
  //       setFadeIn(true);
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [scene]);

  // Generate 4 random tutorial circles
  useEffect(() => {
    if (scene === 'scene2') {
      const randomValues = [];
      while (randomValues.length < 4) {
        const val = Math.floor(Math.random() * 100) + 1;
        if (!randomValues.includes(val)) {
          randomValues.push(val);
        }
      }
      
      const circles = randomValues.map((value, index) => ({
        id: Date.now() + index,
        content: value.toString(),
        type: 'value',
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      }));
      
      setTutorialCircles(circles);
      // Clear played sounds for new scene
      playedSoundsRef.current.clear();
    } else if (scene === 'scene3') {
      // Generate 4 random address circles for scene 3
      const addressLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
      const randomAddresses = [];
      while (randomAddresses.length < 4) {
        const letter = addressLetters[Math.floor(Math.random() * addressLetters.length)];
        const number = Math.floor(Math.random() * 9) + 1;
        const address = `${letter}b${number}`;
        if (!randomAddresses.includes(address)) {
          randomAddresses.push(address);
        }
      }
      
      const circles = randomAddresses.map((address, index) => ({
        id: Date.now() + index,
        content: address,
        type: 'address',
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      }));
      
      setTutorialCircles(circles);
      // Reset bullets for new scene
      setTutorialBullets([]);
      // Clear played sounds for new scene
      playedSoundsRef.current.clear();
    }
  }, [scene]);

  // Typewriter effect for instruction text
  useEffect(() => {
    const texts = {
      'scene2': "Shoot any value to add in your node",
      'scene3': "Shoot any address to add in your node"
    };
    
    const currentText = texts[scene];
    if (!currentText) {
      setTypedText("");
      return;
    }
    
    setIsTyping(true);
    setTypedText("");
    
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < currentText.length) {
        setTypedText(currentText.slice(0, currentIndex + 1));
        playKeyboardSound(); // Play keyboard sound for each character
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 80); // Speed of typing (80ms per character)
    
    return () => clearInterval(typeInterval);
  }, [scene]);

  // Animate tutorial circles
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3') return;
    
    const animateInterval = setInterval(() => {
      setTutorialCircles(prev => prev.map(circle => {
        let newX = circle.x + circle.vx;
        let newY = circle.y + circle.vy;
        let newVx = circle.vx;
        let newVy = circle.vy;

        // Bounce off walls
        if (newX <= 60 || newX >= window.innerWidth - 120) {
          newVx = -newVx;
          newX = Math.max(60, Math.min(window.innerWidth - 120, newX));
        }
        if (newY <= 100 || newY >= window.innerHeight - 200) {
          newVy = -newVy;
          newY = Math.max(100, Math.min(window.innerHeight - 200, newY));
        }

        return { ...circle, x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 16);

    return () => clearInterval(animateInterval);
  }, [scene]);

  // Handle right-click shooting in tutorial
  const handleTutorialRightClick = useCallback((e) => {
    if (scene !== 'scene2' && scene !== 'scene3') return;
    
    e.preventDefault();
    
    // Calculate launch position from cannon tip
    const cannonTipX = window.innerWidth + 40 - 35;
    const cannonTipY = window.innerHeight - 1;
    
    // Calculate tip position based on cannon angle
    const tipDistance = 55;
    const angleRad = (cannonAngle) * (Math.PI / 180);
    const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
    const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;
    
    // Calculate launch velocity based on cannon direction
    const launchSpeed = 8;
    const velocityX = Math.sin(angleRad) * launchSpeed;
    const velocityY = -Math.cos(angleRad) * launchSpeed;
    
    // Create new bullet
    const newBullet = {
      id: Date.now(),
      x: tipX - 15,
      y: tipY - 15,
      velocityX: velocityX,
      velocityY: velocityY,
      isBullet: true,
      isLaunched: true,
    };
    
    setTutorialBullets(prev => [...prev, newBullet]);
  }, [scene, cannonAngle]);

  // Bullet animation and collision detection for tutorial
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3') return;
    
    const animateFrame = () => {
      setTutorialBullets(prevBullets => {
        const updatedBullets = [];
        
        prevBullets.forEach(bullet => {
          // Update bullet position
          const newX = bullet.x + bullet.velocityX;
          const newY = bullet.y + bullet.velocityY;
          
          // Screen boundary collision detection - bullets bounce off edges
          let bounceVelocityX = bullet.velocityX;
          let bounceVelocityY = bullet.velocityY;
          let finalX = newX;
          let finalY = newY;
          
          // Check horizontal boundaries
          if (newX <= 15 || newX >= window.innerWidth - 15) {
            bounceVelocityX = -bounceVelocityX;
            finalX = newX <= 15 ? 15 : window.innerWidth - 15;
          }
          
          // Check vertical boundaries
          if (newY <= 15 || newY >= window.innerHeight - 15) {
            bounceVelocityY = -bounceVelocityY;
            finalY = newY <= 15 ? 15 : window.innerHeight - 15;
          }
          
          const updatedBullet = {
            ...bullet,
            x: finalX,
            y: finalY,
            velocityX: bounceVelocityX,
            velocityY: bounceVelocityY
          };

          // Check for collisions with tutorial circles
          let bulletHitSomething = false;
          
          const currentTutorialCircles = tutorialCirclesRef.current;
          for (let i = 0; i < currentTutorialCircles.length; i++) {
            const circle = currentTutorialCircles[i];

            const bulletRadius = 15;
            const circleRadius = 30;
            const combinedRadius = bulletRadius + circleRadius;
            
            const dx = updatedBullet.x - circle.x;
            const dy = updatedBullet.y - circle.y;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);

            const collisionThreshold = combinedRadius * 0.9;
            
            if (centerDistance < collisionThreshold) {
              bulletHitSomething = true;

              // Play hit sound effect only once per circle
              if (!playedSoundsRef.current.has(circle.id)) {
                playHitSound();
                playedSoundsRef.current.add(circle.id);
              }

              // Add value or address to square node based on scene
              if (scene === 'scene2' && circle.type === 'value') {
                setSquareNode(prev => ({ ...prev, value: circle.content }));
              } else if (scene === 'scene3' && circle.type === 'address') {
                setSquareNode(prev => ({ ...prev, address: circle.content }));
              }
              
              // Remove hit circle
              setTutorialCircles(prevCircles =>
                prevCircles.filter(c => c.id !== circle.id)
              );

              // Notify parent component
              onValueShoot?.(circle.content);
              break;
            }
          }

          // Only keep bullet if it didn't hit anything
          if (!bulletHitSomething) {
            updatedBullets.push(updatedBullet);
          }
        });
        
        return updatedBullets;
      });
    };

    const intervalId = setInterval(animateFrame, 8);
    return () => clearInterval(intervalId);
  }, [scene, onValueShoot]);

  // Mouse movement for cannon rotation
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3') return;
    
    const handleMouseMove = (e) => {
      const cannonBaseX = window.innerWidth + 40 - 35;
      const cannonBaseY = window.innerHeight - 1;
      
      const deltaX = e.clientX - cannonBaseX;
      const deltaY = e.clientY - cannonBaseY;
      
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      setCannonAngle(angle);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("contextmenu", handleTutorialRightClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("contextmenu", handleTutorialRightClick);
    };
  }, [scene, handleTutorialRightClick]);

  // Handle start game button click - stop tutorial music and play game start sound
  const handleStartGame = useCallback(() => {
    stopTutorialBgMusic();
    playFirstClickSound();
    playNodeCreationBgMusic();
    onContinue();
  }, [onContinue]);

  if (scene === 'scene1') {
    return (
      <div className={styles.app}>
        <video
          className={styles.videoBackground2}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial Popup for Scene 1 */}
        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Node Creation!</h2>
              <p>In a linked list, a node is like a container and each node has two parts which is the value and the address of the node</p>
              <p><strong>Let&apos;s build one!</strong></p>
              <button 
                onClick={() => { 
                  playTutorialBgMusic(); 
                  playFirstClickSound(); 
                  onContinue(); 
                }}
                className={tutorialStyles.tutorialButton}
              >
                Let&apos;s Go!
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Square Node (bottom-center) */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === 'scene2') {
    return (
      <div className={styles.app}>
        <video
          className={styles.videoBackground2}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>{typedText}</h3>
        </div>

        {/* Cannon */}
        <div 
          className={styles.rightSquare} 
          style={{ 
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center"
          }} 
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: '12px', color: '#fff' }}>
              •
            </span>
          </div>
        </div>

        {/* Tutorial Floating Circles */}
        {tutorialCircles.map(circle => (
          <div
            key={circle.id}
            className={`${styles.floatingCircle} ${styles.valueCircle}`}
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
            }}
          >
            {circle.content}
          </div>
        ))}

        {/* Tutorial Bullets */}
        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: '30px',
              height: '30px',
              backgroundColor: '#ff00bbff',
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          />
        ))}

        {/* Interactive Square Node (bottom-center) */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={`${styles.squareNodeField} ${!squareNode.value ? styles.empty : ''}`}>
                {squareNode.value || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>

        {/* Continue button appears after shooting a value */}
        {squareNode.value && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Good job!</h2>
                <div className={styles.expectedOutputSquare} style={{ marginBottom: '20px' }}>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.value}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Address</div>
                    <div className={`${styles.squareNodeField} ${styles.empty}`}>
                      -
                    </div>
                  </div>
                </div>
                <p>You&apos;ve added a value to your node. Now let&apos;s add an address to your node.</p>
                <button 
                  onClick={() => { onContinue(); playFirstClickSound(); }}
                  className={tutorialStyles.tutorialButton}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (scene === 'scene3') {
    return (
      <div className={styles.app}>
        <video
          className={styles.videoBackground2}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>{typedText}</h3>
        </div>

        {/* Cannon */}
        <div 
          className={styles.rightSquare} 
          style={{ 
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center"
          }} 
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: '12px', color: '#fff' }}>
              •
            </span>
          </div>
        </div>

        {/* Tutorial Floating Circles (Addresses) */}
        {tutorialCircles.map(circle => (
          <div
            key={circle.id}
            className={`${styles.floatingCircle} ${styles.addressCircle}`}
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
            }}
          >
            {circle.content}
          </div>
        ))}

        {/* Tutorial Bullets */}
        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: '30px',
              height: '30px',
              backgroundColor: '#ff00bbff',
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          />
        ))}

        {/* Interactive Square Node (bottom-center) */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={styles.squareNodeField}>
                {squareNode.value || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={`${styles.squareNodeField} ${!squareNode.address ? styles.empty : ''}`}>
                {squareNode.address || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Continue button appears after shooting an address */}
        {squareNode.address && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Perfect!</h2>
                <div className={styles.expectedOutputSquare} style={{ marginBottom: '30px' }}>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.value}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Address</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.address}
                    </div>
                  </div>
                </div>
                <p>You created your first node with both data and address. Remember a node always needs both data and address.</p>
                <p><strong>Let&apos;s head to the game.</strong></p>
                <button 
                  onClick={() => { onContinue(); playFirstClickSound(); }}
                  className={tutorialStyles.tutorialButton}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (scene === 'scene4') {
    return (
      <div 
        className={styles.app} 
        // style={{
        //   opacity: fadeIn ? 1 : 0,
        //   transition: 'opacity 1.2s ease-in-out',
        //   transform: fadeIn ? 'scale(1)' : 'scale(0.95)',
        // }}
            >
        <video
          className={styles.videoBackground2}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Game Instructions Popup */}
        <div className={tutorialStyles.gameInstructionsOverlay}>
          <div className={tutorialStyles.gameInstructionsPopup}>
            <div className={tutorialStyles.gameInstructionsContent}>
              <div className={tutorialStyles.gameInstructionsHeader}>
                <h2>Game Instruction</h2>
              </div>
              
              <div className={tutorialStyles.gameInstructionsBody}>
                <ul>
                  <li><strong>Objective:</strong> Create nodes by shooting values and addresses into the square node</li>
                  <li><strong>Controls:</strong> Use your mouse to aim the cannon and right-click to shoot bullets</li>
                  <li><strong>Levels:</strong> Complete 3 challenging levels</li>
                  <li><strong>Scoring:</strong> Earn points for each successful node creation</li>
                  <li><strong>Strategy:</strong> Plan your shots carefully - bullets bounce off walls!</li>
                </ul>
              </div>
              
              <div className={tutorialStyles.gameInstructionsFooter}>
                <button 
                  onClick={handleStartGame}
                  className={tutorialStyles.tutorialButton}
                  
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Square Node (bottom-center) - Show completed node from tutorial */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={styles.squareNodeField}>
                {squareNode.value || "42"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={styles.squareNodeField}>
                {squareNode.address || "ab3"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

TutorialScene.propTypes = {
  scene: PropTypes.string.isRequired,
  onContinue: PropTypes.func.isRequired,
  onValueShoot: PropTypes.func,
};

export default TutorialScene;