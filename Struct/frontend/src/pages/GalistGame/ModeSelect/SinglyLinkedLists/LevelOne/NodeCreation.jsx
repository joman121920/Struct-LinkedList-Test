// --- Add refs to reliably track entry order and sucked circles ---

import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./NodeCreation.module.css";
import { ExerciseManager } from "./NodeCreationExercise";
import { collisionDetection } from "../../../CollisionDetection";
import PortalComponent from "../../../PortalComponent";
import PortalParticles from "../../../Particles.jsx";

// Tutorial Scene Component
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // State for tutorial floating circles (4 random values)
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [squareNode, setSquareNode] = useState({ value: "", address: "" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);
  
  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

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
    }
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

  if (scene === 'scene1') {
    return (
      <div className={styles.app}>
        <video
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial Popup for Scene 1 */}
        <div className={styles.tutorialOverlay}>
          <div className={styles.tutorialPopup}>
            <div className={styles.tutorialContent}>
              <h2>Welcome to Node Creation!</h2>
              <p>In a linked list, a node is like a container and each node has two parts which is the value and the address of the node</p>
              <p><strong>Let&apos;s build one!</strong></p>
              <button 
                onClick={onContinue}
                className={styles.tutorialButton}
              >
                Continue
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
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={styles.tutorialInstructionBar}>
          <h3>Shoot any value to add in your node</h3>
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
              backgroundColor: '#ff6b6b',
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
          <div className={styles.tutorialOverlay}>
            <div className={styles.tutorialPopup}>
              <div className={styles.tutorialContent}>
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
                <h2>Good job!</h2>
                <p>You&apos;ve added a value to your node. Now let&apos;s add an address to your node.</p>
                <button 
                  onClick={onContinue}
                  className={styles.tutorialButton}
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
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={styles.tutorialInstructionBar}>
          <h3>Shoot any address to add in your node</h3>
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
              backgroundColor: '#ff6b6b',
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
          <div className={styles.tutorialOverlay}>
            <div className={styles.tutorialPopup}>
              <div className={styles.tutorialContent}>
                <div className={styles.expectedOutputSquare} style={{ marginBottom: '20px' }}>
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
                <h2>Great!</h2>
                <p>You created your first node. Remember a node always needs both data and address.</p>
                <button 
                  onClick={onContinue}
                  className={styles.tutorialButton}
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

  return null;
}

// Main Game Component (your existing game)
function MainGameComponent() {
  // --- Add refs to reliably track entry order and sucked circles ---
  const entryOrderRef = useRef([]);
  const suckedCirclesRef = useRef([]); // Will store the actual circle objects in order
  // Track which exercise is active
  const [exerciseKey, setExerciseKey] = useState("level_1");
  const [circles, setCircles] = useState([]);
  const [draggedCircle, setDraggedCircle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [connectToAddress, setConnectToAddress] = useState("");
  const [connections, setConnections] = useState([]);
  const animationRef = useRef();
  const mouseHistoryRef = useRef([]);
  const [suckingCircles, setSuckingCircles] = useState([]);
  const [suckedCircles, setSuckedCircles] = useState([]);
  const [currentEntryOrder, setCurrentEntryOrder] = useState([]);
  const [originalSubmission, setOriginalSubmission] = useState(null);

  // Exercise progress indicator logic


  // --- Auto launch removed. No initial circles are launched automatically. ---

  // Use a unique key on the main container to force React to fully reset state on exerciseKey change
  // Portal state management
  const [portalInfo, setPortalInfo] = useState({
    isVisible: false,
    canvasWidth: 45,
  });
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  // Wrap setPortalInfo in useCallback to prevent unnecessary re-renders
  const handlePortalStateChange = useCallback((newPortalInfo) => {
    setPortalInfo(newPortalInfo);
  }, []);

  // Exercise system states
  const exerciseManagerRef = useRef(new ExerciseManager());
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  // Cannon angle state for dynamic cannon rotation
  const [cannonAngle, setCannonAngle] = useState(0);

  // Square node states for the interactive bottom square
  const [squareNode, setSquareNode] = useState({
    value: "",
    address: ""
  });

  // Level completion states
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  // Floating target circles - some with values, some with addresses
  // Floating circles state and ref for performance optimization
  const [floatingCircles, setFloatingCircles] = useState([]);
  const floatingCirclesRef = useRef([]);
  
  // Update ref whenever floating circles change
  useEffect(() => {
    floatingCirclesRef.current = floatingCircles;
  }, [floatingCircles]);

  // Expected output for reference - will be dynamically set based on current level
  const [expectedOutput, setExpectedOutput] = useState({
    value: "10",
    address: "ab7"
  });

  // Generate floating circles on mount and when level changes
  useEffect(() => {
    const generateFloatingCircles = () => {
      if (!currentExercise) return;
      
      // Use the new exercise manager to generate floating circles
      const circleData = exerciseManagerRef.current.generateFloatingCircles(exerciseKey);
      
      // Convert to the format expected by the animation system
      const circles = circleData.map((circleInfo) => {
        const baseSpeed = 0.8;
        const speedVariation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2
        const speed = baseSpeed + speedVariation;
        
        return {
          id: circleInfo.id,
          type: circleInfo.type,
          content: circleInfo.content,
          isCorrect: circleInfo.isCorrect,
          x: Math.random() * (window.innerWidth - 200) + 100,
          y: Math.random() * (window.innerHeight - 300) + 150,
          vx: (Math.random() - 0.4) * speed,
          vy: (Math.random() - 0.4) * speed,
        };
      });
      
      setFloatingCircles(circles);
    };

    generateFloatingCircles();
  }, [currentExercise, exerciseKey]);

  // Animate floating circles with collision detection and real-time position tracking
  useEffect(() => {
    const animateInterval = setInterval(() => {
      setFloatingCircles(prev => {
        const now = performance.now();
        const updatedCircles = prev.map(circle => {
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

          return {
            ...circle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            lastUpdateTime: now, // Track when this circle was last updated for real-time collision detection
          };
        });

        // Add collision detection between floating circles
        for (let i = 0; i < updatedCircles.length; i++) {
          for (let j = i + 1; j < updatedCircles.length; j++) {
            const circle1 = updatedCircles[i];
            const circle2 = updatedCircles[j];
            
            const dx = circle1.x - circle2.x;
            const dy = circle1.y - circle2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = 120; // Minimum distance between circles (60px radius each)
            
            if (distance < minDistance) {
              // Circles are overlapping, separate them
              const overlap = minDistance - distance;
              const separationX = (dx / distance) * overlap * 0.5;
              const separationY = (dy / distance) * overlap * 0.5;
              
              // Move circles apart
              updatedCircles[i].x += separationX;
              updatedCircles[i].y += separationY;
              updatedCircles[j].x -= separationX;
              updatedCircles[j].y -= separationY;
              
              // Reverse velocities to make them bounce apart
              updatedCircles[i].vx = Math.abs(updatedCircles[i].vx) * (dx > 0 ? 1 : -1);
              updatedCircles[i].vy = Math.abs(updatedCircles[i].vy) * (dy > 0 ? 1 : -1);
              updatedCircles[j].vx = Math.abs(updatedCircles[j].vx) * (dx < 0 ? 1 : -1);
              updatedCircles[j].vy = Math.abs(updatedCircles[j].vy) * (dy < 0 ? 1 : -1);
            }
          }
        }

        return updatedCircles;
      });
    }, 16); // ~60fps

    return () => clearInterval(animateInterval);
  }, []);

  // Check for level completion and auto-progression
  useEffect(() => {
    if (squareNode.value && squareNode.address && currentExercise) {
      // Validate the current level completion
      const validation = exerciseManagerRef.current.validateLevel(
        exerciseKey, 
        squareNode.value, 
        squareNode.address
      );
      
      if (validation.isCorrect) {
        
        // Set completion feedback
        setIsLevelCompleted(true);
        setCompletionMessage(`Level ${exerciseKey.split('_')[1]} Complete!`);
        
        // Check if there's a next level
        const nextLevel = exerciseManagerRef.current.getNextLevel(exerciseKey);
        
        if (nextLevel) {
          
          // Add a short delay before advancing to next level for better UX
          setTimeout(() => {
            setIsLevelCompleted(false);
            setCompletionMessage("");
            // Manually load the next exercise without using loadExercise callback
            setCircles([]);
            setConnections([]);
            setSuckingCircles([]);
            setSuckedCircles([]);
            setCurrentEntryOrder([]);
            if (entryOrderRef) entryOrderRef.current = [];
            if (suckedCirclesRef) suckedCirclesRef.current = [];
            setOriginalSubmission(null);
            setShowValidationResult(false);
            setValidationResult(null);
            setSquareNode({ value: "", address: "" });
            setIsLevelCompleted(false);
            setCompletionMessage("");
            
            const exercise = exerciseManagerRef.current.loadExercise(nextLevel);
            setCurrentExercise(exercise);
            setExerciseKey(nextLevel);
            setExpectedOutput({
              value: exercise.expectedOutput.value,
              address: exercise.expectedOutput.address
            });
          }, 1500); // 1.5 second delay to show completion
        } else {
          setCompletionMessage("🏆 All Levels Complete! 🏆");
          // Could add a completion celebration here
        }
      }
    }
  }, [squareNode, currentExercise, exerciseKey]);
  //   const next = { screen: "mode", mode: null };
  //   window.history.pushState(next, "");
  //   // Clear any previous game state so this session is fresh
  //   setCircles([]);
  //   setConnections([]);
  //   setSuckingCircles([]);
  //   setSuckedCircles([]);
  //   setCurrentEntryOrder([]);
  //   setOriginalSubmission(null);
  //   setShowValidationResult(false);
  //   setValidationResult(null);
  //   setIsPortalOpen(false);
  //   setPortalInfo((prev) => ({ ...prev, isVisible: false }));
  //   setAddress("");
  //   setValue("");
  //   setShowDuplicateModal(false);
  //   setShowInsertButton(false);
  //   setShowInsertModal(false);
  //   setShowIndexModal(false);
  //   setInsertIndex("");
  //   setSelectedCircle(null);
  //   setConnectToAddress("");
  //   setShowInstructionPopup(false);
  // }, []);

  // Initialize history state and handle browser back/forward
  useEffect(() => {
    const state = window.history.state;
    if (state && state.screen) {
      // applyNavigationState(state);
    } else {
      const initial = { screen: "menu", mode: null };
      window.history.replaceState(initial, "");
      // applyNavigationState(initial);
    }

    const onPopState = (e) => {
      const st = e.state || { screen: "menu", mode: null };
      // If leaving gameplay via browser navigation, end the current game
      if (st.screen !== "play") {
        setCircles([]);
        setConnections([]);
        setSuckingCircles([]);
        setSuckedCircles([]);
        setCurrentEntryOrder([]);
        setOriginalSubmission(null);
        setShowValidationResult(false);
        setValidationResult(null);
        setIsPortalOpen(false);
        setPortalInfo((prev) => ({ ...prev, isVisible: false }));
        setSelectedCircle(null);
        setConnectToAddress("");
        setShowInstructionPopup(false);
      }
      // applyNavigationState(st);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Function to find all connected circles recursively
  const findConnectedCircles = useCallback(
    (circleId, visited = new Set()) => {
      if (visited.has(circleId)) return [];
      visited.add(circleId);

      const connected = [circleId];
      connections.forEach((connection) => {
        if (connection.from === circleId && !visited.has(connection.to)) {
          connected.push(...findConnectedCircles(connection.to, visited));
        }
        if (connection.to === circleId && !visited.has(connection.from)) {
          connected.push(...findConnectedCircles(connection.from, visited));
        }
      });

      return connected;
    },
    [connections]
  );

  // No head/tail logic needed for node creation level

  const loadExercise = useCallback((key = "level_1") => {
    // Always clear circles/connections and reset launch state before loading new exercise
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    setSuckedCircles([]);
    setCurrentEntryOrder([]);
    // Clear persistent refs to avoid stale data between runs
    if (entryOrderRef) entryOrderRef.current = [];
    if (suckedCirclesRef) suckedCirclesRef.current = [];
    setOriginalSubmission(null);
    setShowValidationResult(false);
    setValidationResult(null);
    // Reset square node when changing levels
    setSquareNode({ value: "", address: "" });
    // Reset completion states
    setIsLevelCompleted(false);
    setCompletionMessage("");
    
    // Now load the new exercise
    const exercise = exerciseManagerRef.current.loadExercise(key);
    setCurrentExercise(exercise);
    setExerciseKey(key);
    
    // Update expected output for the current level
    setExpectedOutput({
      value: exercise.expectedOutput.value,
      address: exercise.expectedOutput.address
    });
  }, []);

  

  // Initialize exercise on component mount
  useEffect(() => {
    if (!currentExercise) {
      loadExercise("level_1");
    }
  }, [currentExercise, loadExercise]);

  // Initialize with basic exercise when instruction popup is closed
  useEffect(() => {
    if (!showInstructionPopup && !currentExercise) {
      loadExercise();
    }
  }, [showInstructionPopup, currentExercise, loadExercise]);

  // (Removed unused getChainOrder for node creation)

  // No chain suction effect for node creation

  // PHYSICS SYSTEM - Simple animation loop adapted for portal
  useEffect(() => {
    let isAnimating = true;

    const gameLoop = () => {
      if (!isAnimating) return;

      setCircles((prevCircles) => {

        const circlesWithSpecialBehavior = prevCircles.map((circle) => {
          // Skip all special behavior for bullets - they have their own animation system
          if (circle.isBullet) {
            return circle;
          }
          
          if (draggedCircle && circle.id === draggedCircle.id) {
            return circle;
          }

          // Sucking effect (GalistGame logic)
          if (suckingCircles.includes(circle.id)) {
            const portalCenterX = 10 + portalInfo.canvasWidth / 2;
            const portalCenterY = window.innerHeight / 2;
            const dx = portalCenterX - circle.x;
            const dy = portalCenterY - circle.y;

            // Portal entrance area
            const portalTop = window.innerHeight / 2 - 50;
            const portalBottom = window.innerHeight / 2 + 50;
            const entranceTop = portalTop + 10;
            const entranceBottom = portalBottom - 10;

            if (
              circle.x >= 10 &&
              circle.x <= 35 &&
              circle.y >= entranceTop &&
              circle.y <= entranceBottom
            ) {
              setTimeout(() => {
                setSuckedCircles((prev) => {
                  let updated = prev;
                  if (!prev.includes(circle.id)) updated = [...prev, circle.id];
                  return updated;
                });
                setCurrentEntryOrder((prev) => {
                  let updated = prev;
                  const addressAlreadyEntered = (
                    suckedCirclesRef.current || []
                  ).some((c) => c.address === circle.address);
                  if (!prev.includes(circle.id) && !addressAlreadyEntered) {
                    updated = [...prev, circle.id];
                    suckedCirclesRef.current = [
                      ...(suckedCirclesRef.current || []),
                      { ...circle },
                    ];
                  }
                  entryOrderRef.current = updated;
                  return updated;
                });
                setSuckingCircles((prev) =>
                  prev.filter((id) => id !== circle.id)
                );

                setTimeout(() => {
                  const expectedCount =
                    currentExercise?.expectedStructure?.length || 0;
                  const suckedIds = entryOrderRef.current;
                  const suckedCirclesForValidation =
                    suckedCirclesRef.current || [];
                  const uniqueCircles = [];
                  const uniqueIds = [];
                  const seenAddresses = new Set();
                  for (let i = 0; i < suckedCirclesForValidation.length; i++) {
                    const c = suckedCirclesForValidation[i];
                    if (c && !seenAddresses.has(c.address)) {
                      uniqueCircles.push({ ...c, value: Number(c.value) });
                      uniqueIds.push(suckedIds[i]);
                      seenAddresses.add(c.address);
                    }
                  }
                  if (uniqueCircles.length === expectedCount) {
                    if (currentExercise) {
                      try {
                        const result =
                          exerciseManagerRef.current.validateSubmission(
                            uniqueCircles,
                            uniqueIds
                          );
                        setValidationResult(result);
                        setShowValidationResult(true);
                      } catch (error) {
                        setValidationResult({
                          isCorrect: false,
                          message: "System Error",
                          details: error.message,
                          score: 0,
                          totalPoints: 100,
                        });
                        setShowValidationResult(true);
                      }
                    }
                    setCircles((prevCircles) =>
                      prevCircles.filter((c) => c.id !== circle.id)
                    );
                  } else {
                    setCircles((prevCircles) =>
                      prevCircles.filter((c) => c.id !== circle.id)
                    );
                  }
                }, 0);
              }, 50);
              return circle;
            }

            // CONSTANT suction speed for all circles (true constant speed, not force)
            const suctionSpeed = 1.0; // Lower for slower suction, higher for faster
            const norm = Math.sqrt(dx * dx + dy * dy) || 1;
            // If already at the portal, don't move
            if (norm < suctionSpeed) {
              return {
                ...circle,
                x: circle.x + dx,
                y: circle.y + dy,
                velocityX: dx,
                velocityY: dy,
              };
            }
            const newVelocityX = (dx / norm) * suctionSpeed;
            const newVelocityY = (dy / norm) * suctionSpeed;
            return {
              ...circle,
              x: circle.x + newVelocityX,
              y: circle.y + newVelocityY,
              velocityX: newVelocityX,
              velocityY: newVelocityY,
            };
          }

          // Removed gentle suction when portal is open. Only circles in suckingCircles are affected.

          // Manual trigger for chain suction
          if (portalInfo.isVisible) {
            const portalRight = 10 + portalInfo.canvasWidth + 20;
            const portalTop = window.innerHeight / 2 - 50;
            const portalBottom = window.innerHeight / 2 + 50;
            const entranceTop = portalTop + 10;
            const entranceBottom = portalBottom - 10;
            const circleRadius = 30;
            const newX = circle.x + (circle.velocityX || 0);
            const newY = circle.y + (circle.velocityY || 0);
            if (
              newX - circleRadius <= portalRight &&
              newX - circleRadius >= portalRight - 20 &&
              newY >= entranceTop &&
              newY <= entranceBottom &&
              !suckingCircles.includes(circle.id)
            ) {
              // No head/tail logic needed for node creation
              return circle;
            }
          }
          return circle;
        });

        // Second pass: Apply collision detection and physics (exclude bullets - they have their own system)
        const allCirclesForCollision = circlesWithSpecialBehavior.filter(circle => !circle.isBullet);
        const draggedCircleData = draggedCircle
          ? allCirclesForCollision.find(
              (circle) => circle.id === draggedCircle.id
            )
          : null;
        const updatedAllCircles =
          allCirclesForCollision.length > 0
            ? collisionDetection.updatePhysics(
                allCirclesForCollision,
                suckingCircles
              )
            : [];
        
        // Keep bullets separate - they're handled by their own animation loop
        const bullets = circlesWithSpecialBehavior.filter(circle => circle.isBullet);
        const finalCollisionCircles = [...updatedAllCircles, ...bullets];
        
        let finalCircles = finalCollisionCircles;
        if (draggedCircleData) {
          finalCircles = finalCollisionCircles.map((circle) => {
            if (circle.id === draggedCircle.id) {
              return {
                ...draggedCircleData,
                velocityX: circle.velocityX,
                velocityY: circle.velocityY,
              };
            }
            return circle;
          });
        }
        return finalCircles;
      });
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    portalInfo,
    suckingCircles,
    draggedCircle,
    // startChainSuction,
    findConnectedCircles,
    connections,
    currentExercise,
    suckedCircles,
    originalSubmission,
    currentEntryOrder,
    circles,
  ]);

  // Handle connection removal when circles are sucked
  useEffect(() => {
    if (suckedCircles.length > 0) {
      const timer = setTimeout(() => {
        setConnections((prevConnections) =>
          prevConnections.filter((connection) => {
            const fromSucked = suckedCircles.includes(connection.from);
            const toSucked = suckedCircles.includes(connection.to);
            return !(fromSucked && toSucked);
          })
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [suckedCircles]);

  // Auto-suction effect when portal opens - prioritize head nodes
  useEffect(() => {
    if (portalInfo.isVisible && circles.length > 0) {
      // For node creation, just suck in all circles (no head/tail logic)
      circles.forEach((node, index) => {
        setTimeout(() => {
          setSuckingCircles((prev) => {
            if (!prev.includes(node.id)) {
              return [...prev, node.id];
            }
            return prev;
          });
        }, index * 200);
      });
    } else if (!portalInfo.isVisible) {
      setSuckingCircles([]);
    }
  }, [portalInfo.isVisible, circles, connections]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e, circle) => {
    // Prevent dragging launched circles
    if (circle.isLaunched) {
      return;
    }
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedCircle(circle);
    setDragOffset({
      x: e.clientX - rect.left - 30,
      y: e.clientY - rect.top - 30,
    });

    mouseHistoryRef.current = [
      {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      },
    ];
  };

  

  const handleConnect = () => {
    if (!selectedCircle || !connectToAddress.trim()) return;

    const targetCircle = circles.find(
      (c) => c.address === connectToAddress.trim()
    );
    if (targetCircle && targetCircle.id !== selectedCircle.id) {
      const newConnection = {
        id: Date.now(),
        from: selectedCircle.id,
        to: targetCircle.id,
      };
      setConnections((prev) => [...prev, newConnection]);
    }

    setSelectedCircle(null);
    setConnectToAddress("");
  };

  const closePopup = () => {
    setSelectedCircle(null);
    setConnectToAddress("");
  };

  const handleDeleteCircle = () => {
    if (!selectedCircle) return;
    const nodeToDelete = selectedCircle.id;
    
    setCircles((prevCircles) =>
      prevCircles.filter((circle) => circle.id !== nodeToDelete)
    );
    setConnections((prevConnections) =>
      prevConnections.filter(
        (conn) => conn.from !== nodeToDelete && conn.to !== nodeToDelete
      )
    );
    closePopup();
  };

  // Cannon circle event handlers - removed double-click editing for testing

  // Global right-click handler for launching circles
  const handleGlobalRightClick = useCallback((e) => {
    e.preventDefault(); // Prevent context menu
    
    // Calculate launch position from cannon tip
    const cannonTipX = window.innerWidth + 40 - 35; // Cannon base X
    const cannonTipY = window.innerHeight - 1; // Cannon base Y
    
    // Calculate tip position based on cannon angle
    const tipDistance = 55; // Distance from base to tip
    const angleRad = (cannonAngle) * (Math.PI / 180);
    const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
    const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;
    
    // Calculate launch velocity based on cannon direction
    const launchSpeed = 8; // Reduced speed for better control and accuracy
    const velocityX = Math.sin(angleRad) * launchSpeed;
    const velocityY = -Math.cos(angleRad) * launchSpeed; // Negative because Y increases downward
    
    // Create new bullet (simple circle without values)
    const newBullet = {
      id: Date.now(),
      x: tipX - 15, // Offset for bullet radius (smaller than regular circles)
      y: tipY - 15,
      isBullet: true, // Flag to indicate this is a bullet
      velocityX: velocityX,
      velocityY: velocityY,
      isLaunched: true,
    };
    
    setCircles(prev => [...prev, newBullet]);
  }, [cannonAngle]);

  // Animation loop for launched circles
  useEffect(() => {
    const animationFrame = () => {
      setCircles(prevCircles => {
        const updatedCircles = [];
        
        prevCircles.forEach(circle => {
          // Skip bullets that are already marked for deletion
          if (circle.isLaunched && (circle.velocityX || circle.velocityY) && !circle.markedForDeletion) {
            // Update position based on velocity (no gravity - straight line movement)
            const newX = circle.x + circle.velocityX;
            const newY = circle.y + circle.velocityY;
            
            // Screen boundary collision detection - bullets bounce off edges
            let bounceVelocityX = circle.velocityX;
            let bounceVelocityY = circle.velocityY;
            let finalX = newX;
            let finalY = newY;
            
            // Check horizontal boundaries (left and right edges)
            if (newX <= 15 || newX >= window.innerWidth - 15) {
              bounceVelocityX = -bounceVelocityX; // Reverse horizontal velocity
              finalX = newX <= 15 ? 15 : window.innerWidth - 15; // Keep within bounds
            }
            
            // Check vertical boundaries (top and bottom edges)
            if (newY <= 15 || newY >= window.innerHeight - 15) {
              bounceVelocityY = -bounceVelocityY; // Reverse vertical velocity
              finalY = newY <= 15 ? 15 : window.innerHeight - 15; // Keep within bounds
            }
            
            const updatedCircle = {
              ...circle,
              x: finalX,
              y: finalY,
              velocityX: bounceVelocityX,
              velocityY: bounceVelocityY
            };

            // Check for collisions with floating circles (balanced precision collision detection)
            let bulletHitSomething = false;
            
            // Get real-time floating circle positions with balanced accuracy
            const currentFloatingCircles = floatingCirclesRef.current;
            for (let i = 0; i < currentFloatingCircles.length; i++) {
              const floatingCircle = currentFloatingCircles[i];

              // Calculate REAL-TIME position of floating circle with sub-frame accuracy
              const now = performance.now();
              const timeSinceLastUpdate = now - (floatingCircle.lastUpdateTime || now);
              const timeStepMs = Math.min(timeSinceLastUpdate, 16); // Cap at 16ms to prevent large jumps
              
              // Calculate current real-time position with velocity interpolation
              const currentCircleX = floatingCircle.x + (floatingCircle.vx * timeStepMs / 16);
              const currentCircleY = floatingCircle.y + (floatingCircle.vy * timeStepMs / 16);

              // Calculate current bullet position (center point)
              const currentBulletX = updatedCircle.x;
              const currentBulletY = updatedCircle.y;

              // BALANCED PRECISION: Use visual radii with more forgiving threshold
              const bulletRadius = 15; // Bullet visual radius (30px diameter / 2)
              const circleRadius = 30; // Floating circle visual radius (60px diameter / 2)
              const combinedRadius = bulletRadius + circleRadius; // Total collision radius (45px)
              
              // Distance between centers
              const dx = currentBulletX - currentCircleX;
              const dy = currentBulletY - currentCircleY;
              const centerDistance = Math.sqrt(dx * dx + dy * dy);

              // FORGIVING COLLISION: Use 90% of combined radius for better hit detection
              const collisionThreshold = combinedRadius * 0.9; // 40.5px - more forgiving than 80%
              
              if (centerDistance < collisionThreshold) {
                // OPTIONAL TRAJECTORY CHECK: Only validate if bullet is moving very fast
                const bulletSpeed = Math.sqrt(updatedCircle.velocityX * updatedCircle.velocityX + updatedCircle.velocityY * updatedCircle.velocityY);
                let isValidHit = true;
                
                // Only check trajectory for fast-moving bullets to prevent edge cases
                if (bulletSpeed > 6) {
                  const bulletPrevX = updatedCircle.x - updatedCircle.velocityX;
                  const bulletPrevY = updatedCircle.y - updatedCircle.velocityY;
                  
                  const prevDistance = Math.sqrt(
                    Math.pow(bulletPrevX - currentCircleX, 2) + Math.pow(bulletPrevY - currentCircleY, 2)
                  );
                  
                  // Allow hit if getting closer OR already very close (handles edge cases)
                  isValidHit = (centerDistance < prevDistance) || (centerDistance < combinedRadius * 0.7);
                }
                
                if (isValidHit) {
                  bulletHitSomething = true;

                  // Transfer floating circle content to square node with smart overriding logic
                  setSquareNode(prev => {
                    const newSquareNode = { ...prev };
                    
                    if (floatingCircle.type === 'value') {
                      // Get the correct value for current level
                      const correctValue = expectedOutput.value;
                      const currentValue = prev.value;
                      const newValue = floatingCircle.content;
                      
                      // Smart overriding logic for values:
                      if (!currentValue) {
                        // Empty slot - always accept new value
                        newSquareNode.value = newValue;
                      } else if (currentValue === correctValue && newValue !== correctValue) {
                        // Have correct value, shooting incorrect - DON'T override
                      } else if (currentValue !== correctValue && newValue === correctValue) {
                        // Have incorrect value, shooting correct - OVERRIDE
                        newSquareNode.value = newValue;
                      } else if (currentValue !== correctValue && newValue !== correctValue) {
                        // Have incorrect value, shooting another incorrect - OVERRIDE
                        newSquareNode.value = newValue;
                      } else {
                        // Have correct value, shooting correct again - don't change
                      }
                      
                    } else if (floatingCircle.type === 'address') {
                      // Get the correct address for current level
                      const correctAddress = expectedOutput.address;
                      const currentAddress = prev.address;
                      const newAddress = floatingCircle.content;
                      
                      // Smart overriding logic for addresses:
                      if (!currentAddress) {
                        // Empty slot - always accept new address
                        newSquareNode.address = newAddress;
                      } else if (currentAddress === correctAddress && newAddress !== correctAddress) {
                        // Have correct address, shooting incorrect - DON'T override
                      } else if (currentAddress !== correctAddress && newAddress === correctAddress) {
                        // Have incorrect address, shooting correct - OVERRIDE
                        newSquareNode.address = newAddress;
                      } else if (currentAddress !== correctAddress && newAddress !== correctAddress) {
                        // Have incorrect address, shooting another incorrect - OVERRIDE
                        newSquareNode.address = newAddress;
                      } else {
                        // Have correct address, shooting correct again - don't change
                      }
                    }
                    
                    return newSquareNode;
                  });

                  // Remove the hit floating circle immediately
                  setFloatingCircles(prevFloating =>
                    prevFloating.filter(fc => fc.id !== floatingCircle.id)
                  );

                  break; // Stop after first hit - maintain 1 bullet = 1 circle rule
                }
              }
            }


            // Only add bullet to updatedCircles if it didn't hit anything (CRITICAL: 1 bullet = 1 circle rule)
            if (!bulletHitSomething) {
              updatedCircles.push(updatedCircle);
            } else {
              // Bullet is NOT added to updatedCircles, so it gets deleted from the game
            }
          } else {
            // Keep non-launched circles as they are
            updatedCircles.push(circle);
          }
        });
        
        return updatedCircles;
      });
    };

    const intervalId = setInterval(animationFrame, 8); // ~120fps for smoother movement
    return () => clearInterval(intervalId);
  }, [expectedOutput.value, expectedOutput.address]); // Include expectedOutput dependencies for smart overriding logic

  useEffect(() => {
    const handleMouseMoveGlobal = (e) => {
      // Always update cannon rotation regardless of dragging state
      // Calculate cannon base position (bottom center of the cannon)
      // CSS: right: -40px, bottom: 1px, width: 70px, height: 110px
      // Transform origin is bottom center, so we calculate from the bottom-center of the cannon
      const cannonBaseX = window.innerWidth + 40 - 35; // Right edge + 40px offset - half width (35px)
      const cannonBaseY = window.innerHeight - 1; // Bottom edge position (bottom: 1px)
      
      // Calculate angle from cannon base to mouse cursor
      const deltaX = e.clientX - cannonBaseX;
      const deltaY = e.clientY - cannonBaseY;
      
      // Calculate angle in degrees (pointing towards mouse)
      // Fix: We ADD 90 degrees instead of subtracting to correct the direction
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      
      // For debugging - let's allow full rotation first to see if it works
      // Then we'll add constraints back
      
      // Update cannon angle
      setCannonAngle(angle);

      // Existing circle dragging logic (only for non-launched circles)
      if (draggedCircle && !draggedCircle.isLaunched) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const findValidPosition = (targetX, targetY, currentX, currentY) => {
          const circleRadius = 30;

          const isValid = (x, y) => {
            const rightSquareSize = 100;
            const rightSquareLeft = window.innerWidth - rightSquareSize;
            const rightSquareRight = window.innerWidth;
            const rightSquareTop = window.innerHeight - rightSquareSize;
            const rightSquareBottom = window.innerHeight;

            if (
              x + circleRadius >= rightSquareLeft &&
              x - circleRadius <= rightSquareRight &&
              y + circleRadius >= rightSquareTop &&
              y - circleRadius <= rightSquareBottom
            ) {
              return false;
            }

            if (
              x - circleRadius < 0 ||
              x + circleRadius > window.innerWidth ||
              y - circleRadius < 0 ||
              y + circleRadius > window.innerHeight
            ) {
              return false;
            }

            const otherCircles = circles.filter(
              (c) => c.id !== draggedCircle.id
            );
            for (let otherCircle of otherCircles) {
              const dx = x - otherCircle.x;
              const dy = y - otherCircle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < circleRadius * 2) {
                return false;
              }
            }

            return true;
          };

          if (isValid(targetX, targetY)) {
            return { x: targetX, y: targetY };
          }

          const deltaX = targetX - currentX;
          const deltaY = targetY - currentY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance === 0) {
            return { x: currentX, y: currentY };
          }

          const dirX = deltaX / distance;
          const dirY = deltaY / distance;

          let validDistance = 0;
          let testDistance = distance;
          let step = distance / 2;

          for (let i = 0; i < 20; i++) {
            const testX = currentX + dirX * testDistance;
            const testY = currentY + dirY * testDistance;

            if (isValid(testX, testY)) {
              validDistance = testDistance;
              testDistance += step;
            } else {
              testDistance -= step;
            }
            step /= 2;

            if (step < 0.1) break;
          }

          return {
            x: currentX + dirX * validDistance,
            y: currentY + dirY * validDistance,
          };
        };

        const validPosition = findValidPosition(
          newX,
          newY,
          draggedCircle.x,
          draggedCircle.y
        );

        const now = Date.now();
        mouseHistoryRef.current.push({
          x: e.clientX,
          y: e.clientY,
          time: now,
        });

        mouseHistoryRef.current = mouseHistoryRef.current.filter(
          (entry) => now - entry.time < 100
        );

        setCircles((prevCircles) =>
          prevCircles.map((circle) =>
            circle.id === draggedCircle.id
              ? {
                  ...circle,
                  x: validPosition.x,
                  y: validPosition.y,
                  velocityX: 0,
                  velocityY: 0,
                }
              : circle
          )
        );
      }
    };

    const handleMouseUpGlobal = () => {
      if (draggedCircle) {
        let velocityX = 0;
        let velocityY = 0;

        if (mouseHistoryRef.current.length >= 2) {
          const recent =
            mouseHistoryRef.current[mouseHistoryRef.current.length - 1];
          const older = mouseHistoryRef.current[0];
          const timeDiff = recent.time - older.time;

          if (timeDiff > 0) {
            velocityX = ((recent.x - older.x) / timeDiff) * 16;
            velocityY = ((recent.y - older.y) / timeDiff) * 16;

            const maxVelocity = 15;
            velocityX = Math.max(
              -maxVelocity,
              Math.min(maxVelocity, velocityX)
            );
            velocityY = Math.max(
              -maxVelocity,
              Math.min(maxVelocity, velocityY)
            );
          }
        }

        setCircles((prevCircles) =>
          prevCircles.map((circle) =>
            circle.id === draggedCircle.id
              ? { ...circle, velocityX, velocityY }
              : circle
          )
        );
      }

      setDraggedCircle(null);
      setDragOffset({ x: 0, y: 0 });
      mouseHistoryRef.current = [];
    };

    document.addEventListener("mousemove", handleMouseMoveGlobal);
    document.addEventListener("mouseup", handleMouseUpGlobal);
    document.addEventListener("contextmenu", handleGlobalRightClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveGlobal);
      document.removeEventListener("mouseup", handleMouseUpGlobal);
      document.removeEventListener("contextmenu", handleGlobalRightClick);
    };
  }, [draggedCircle, dragOffset, findConnectedCircles, circles, handleGlobalRightClick]);

  return (
    <div className={styles.app}>
      <video
        className={styles.videoBackground}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        // onError={(e) => console.error("Video error:", e)}
        // onLoadedData={() => console.log("Video loaded successfully")}
      >
        <source src="./video/node_creation_bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      

      

      {/* Expected results bar */}
      {currentExercise && (
        <div className={styles.expectedBarWrapper}>
          <table className={styles.expectedBarTable}>
            <tbody>
              <tr className={styles.expectedBarRow}>
                <td className={styles.expectedBarCell}>
                  <div className={styles.expectedOutputSquare}>
                    <div className={styles.squareSection}>
                      <div className={styles.sectionLabel}>Value</div>
                      <div className={styles.squareNodeField}>
                        {expectedOutput.value}
                      </div>
                    </div>
                    <div className={styles.squareSection}>
                      <div className={styles.sectionLabel}>Address</div>
                      <div className={styles.squareNodeField}>
                        {expectedOutput.address}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      

      {/* Portal particles for vacuum effect */}
      <PortalParticles 
        portalInfo={portalInfo} 
      />
      <PortalComponent
        onPortalStateChange={handlePortalStateChange}
        isOpen={isPortalOpen}
      />
      <div 
        className={styles.rightSquare} 
        style={{ 
          outlineOffset: "5px",
          transform: `rotate(${cannonAngle}deg)`,
          transformOrigin: "bottom center"
        }} 
      >
        {/* Cannon Circle */}
        <div 
          className={styles.cannonCircle}
        >
          <span style={{ fontSize: '12px', color: '#fff' }}>
            •
          </span>
        </div>
      </div>

      {circles.map((circle) => (
        <div
          key={circle.id}
          className={`${styles.animatedCircle} ${
            suckingCircles.includes(circle.id) ? styles.beingSucked : ""
          }`}
          style={{
            left: `${circle.x - (circle.isBullet ? 15 : 30)}px`,
            top: `${circle.y - (circle.isBullet ? 15 : 30)}px`,
            width: circle.isBullet ? '30px' : '60px',
            height: circle.isBullet ? '30px' : '60px',
            backgroundColor: circle.isBullet ? '#ff6b6b' : '#d3d3d3',
            cursor: circle.isLaunched 
              ? "default" 
              : (draggedCircle && circle.id === draggedCircle.id
                ? "grabbing"
                : "grab"),
            opacity: circle.isLaunched ? 0.9 : 1,
            boxShadow: circle.isLaunched 
              ? "0 0 15px rgba(255, 255, 0, 0.6)" 
              : "0 4px 8px rgba(0, 0, 0, 0.3)",
          }}
          onMouseDown={(e) => handleMouseDown(e, circle)}
        >
          {!circle.isBullet && (
            <>
              <span className={styles.circleValue}>{circle.value}</span>
              <span className={styles.circleAddress}>{circle.address}</span>
            </>
          )}
        </div>
      ))}
      
      <svg className={styles.connectionLines}>
        {connections.map((connection) => {
          // Only remove the line if BOTH nodes have been sucked
          const fromSucked = suckedCircles.includes(connection.from);
          const toSucked = suckedCircles.includes(connection.to);
          if (fromSucked && toSucked) return null;

          // Only anchor to portal entrance if a node has been sucked; otherwise, skip the line if either node is missing (e.g., during launch)
          const fromCircle = circles.find((c) => c.id === connection.from);
          const toCircle = circles.find((c) => c.id === connection.to);
          const entranceX = 10 + portalInfo.canvasWidth / 2;
          const entranceY = window.innerHeight / 2;
          // If neither node is present and neither is sucked, don't render the line (prevents portal-anchored lines during launch)
          if (!fromCircle && !fromSucked) return null;
          if (!toCircle && !toSucked) return null;
          const fromX = fromCircle ? fromCircle.x : entranceX;
          const fromY = fromCircle ? fromCircle.y : entranceY;
          const toX = toCircle ? toCircle.x : entranceX;
          const toY = toCircle ? toCircle.y : entranceY;
          return (
            <g key={connection.id}>
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                className={styles.animatedLine}
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="16"
            refY="4"
            orient="auto"
            fill="#fff"
            stroke="#fff"
            strokeWidth="0.5"
          >
            <path d="M0,0 L0,8 L8,4 z" fill="#fff" />
          </marker>
        </defs>
      </svg>

      {/* Validation Overlay */}
      {showValidationResult && validationResult && (
        <div className={styles.validationOverlay}>
          <div className={styles.validationContent}>
            <div className={styles.validationHeader}>
              <div className={styles.scoreSection}>
                <span className={styles.scoreLabel}>
                  Score: {validationResult.score}/100
                </span>
              </div>
            </div>

            <div className={styles.expectedResultsSection}>
              <div className={styles.expectedLabel}>
                Expected <br /> Results
              </div>

              {currentExercise && currentExercise.expectedStructure && (
                <table className={styles.validationTable}>
                  <tbody>
                    <tr className={styles.expectedRow}>
                      {currentExercise.expectedStructure.map(
                        (expectedNode, index) => (
                          <React.Fragment
                            key={`expected-${expectedNode.value}`}
                          >
                            <td className={styles.expectedCell}>
                              <div className={styles.expectedValue}>
                                {expectedNode.value}
                              </div>
                              <div className={styles.expectedAddress}>
                                {expectedNode.address}
                              </div>
                            </td>
                            {index <
                              currentExercise.expectedStructure.length - 1 && (
                              <td className={styles.arrowCellEmpty}></td>
                            )}
                          </React.Fragment>
                        )
                      )}
                    </tr>
                    <tr className={styles.userRow}>
                      {(() => {
                        // Prefer validated userCircles to ensure UI matches scoring
                        const validated =
                          validationResult &&
                          Array.isArray(validationResult.userCircles)
                            ? validationResult.userCircles
                            : null;
                        let userOrder =
                          validated && validated.length > 0
                            ? validated
                            : suckedCirclesRef.current || [];
                        return currentExercise.expectedStructure.map(
                          (expectedNode, index) => {
                            const userNode = userOrder[index];
                            const isCorrect =
                              userNode &&
                              parseInt(userNode.value) ===
                                parseInt(expectedNode.value);
                            return (
                              <React.Fragment
                                key={`user-${expectedNode.value}`}
                              >
                                <td className={styles.userCell}>
                                  {userNode ? (
                                    <div
                                      className={`${styles.userNode} ${
                                        isCorrect
                                          ? styles.userNodeCorrect
                                          : styles.userNodeIncorrect
                                      }`}
                                    >
                                      <div className={styles.userNodeValue}>
                                        {userNode.value}
                                      </div>
                                      <div className={styles.userNodeAddress}>
                                        {userNode.address}
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className={`${styles.userNode} ${styles.userNodeMissing}`}
                                    >
                                      <div className={styles.userNodeValue}>
                                        ?
                                      </div>
                                      <div className={styles.userNodeAddress}>
                                        ?
                                      </div>
                                    </div>
                                  )}
                                </td>
                                {index <
                                  currentExercise.expectedStructure.length -
                                    1 && (
                                  <td className={styles.arrowCell}>→</td>
                                )}
                              </React.Fragment>
                            );
                          }
                        );
                      })()}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.validationButtons}>
              <button
                onClick={() => {
                  setShowValidationResult(false);
                  setIsPortalOpen(false);
                  setPortalInfo((prev) => ({ ...prev, isVisible: false }));
                  // Clear refs and local entry state for a clean retry/next
                  if (entryOrderRef) entryOrderRef.current = [];
                  if (suckedCirclesRef) suckedCirclesRef.current = [];
                  setSuckedCircles([]);
                  setCurrentEntryOrder([]);
                  
                  // Handle level progression for new system
                  if (validationResult && validationResult.isCorrect) {
                    const nextLevel = exerciseManagerRef.current.getNextLevel(exerciseKey);
                    if (nextLevel) {
                      loadExercise(nextLevel);
                    } 
                  }
                }}
                className={styles.continueButton}
              >
                {validationResult && validationResult.isCorrect 
                  ? (exerciseManagerRef.current.hasNextLevel(exerciseKey) 
                      ? "NEXT LEVEL" 
                      : "GAME COMPLETE") 
                  : "CONTINUE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circle Detail Popup */}
      {selectedCircle && (
        <div className={styles.popupOverlay} onClick={closePopup}>
          <div
            className={styles.popupContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.popupCloseBtn} onClick={closePopup}>
              ×
            </button>

            <div className={styles.popupCircle}>
              <span className={styles.popupCircleValue}>
                {selectedCircle.value}
              </span>
              <span className={styles.popupCircleAddress}>
                {selectedCircle.address}
              </span>
            </div>
            <div className={styles.popupFormContainer}>
              <div className={styles.popupText}>Connect to?</div>
              <input
                type="text"
                placeholder="Enter Address"
                value={connectToAddress}
                onChange={(e) => setConnectToAddress(e.target.value)}
                className={styles.popupInput}
                disabled={true}
                autoFocus
              />
              <div className={styles.popupButtons}>
                <button
                  onClick={handleConnect}
                  className={`${styles.popupButton} ${styles.connectBtn}`}
                  disabled={true}
                >
                  CONNECT
                </button>
                <button
                  onClick={handleDeleteCircle}
                  className={`${styles.popupButton} ${styles.deleteBtn}`}
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* Interactive Square Node (bottom-center) */}
      <div className={styles.interactiveSquareWrapper}>
        {isLevelCompleted && (
          <div className={styles.completionMessage}>
            {completionMessage}
          </div>
        )}
        <div className={`${styles.squareNode} ${isLevelCompleted ? styles.completedSquare : ''}`}>
          <div className={styles.squareSection}>
            <div className={styles.sectionLabel}>Value</div>
            <div className={`${styles.squareNodeField} ${!squareNode.value ? styles.empty : ''}`}>
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

      {/* Floating Circles */}
      {floatingCircles.map(circle => (
        <div
          key={circle.id}
          className={`${styles.floatingCircle} ${circle.type === 'value' ? styles.valueCircle : styles.addressCircle}`}
          style={{
            left: `${circle.x}px`,
            top: `${circle.y}px`,
          }}
        >
          {circle.content}
        </div>
      ))}
    </div>
  );
}

// Main Tutorial Wrapper Component
function GalistNodeCreation() {
  const [currentScene, setCurrentScene] = useState('scene1');

  const handleSceneTransition = () => {
    if (currentScene === 'scene1') {
      setCurrentScene('scene2');
    } else if (currentScene === 'scene2') {
      setCurrentScene('scene3');
    } else if (currentScene === 'scene3') {
      setCurrentScene('mainGame');
    }
  };

  const handleValueShoot = () => {
    // Value was shot in tutorial, could add logic here if needed
  };

  if (currentScene === 'scene1' || currentScene === 'scene2' || currentScene === 'scene3') {
    return (
      <TutorialScene 
        scene={currentScene}
        onContinue={handleSceneTransition}
        onValueShoot={handleValueShoot}
      />
    );
  }

  if (currentScene === 'mainGame') {
    return <MainGameComponent />;
  }

  return null;
}

export default GalistNodeCreation;
