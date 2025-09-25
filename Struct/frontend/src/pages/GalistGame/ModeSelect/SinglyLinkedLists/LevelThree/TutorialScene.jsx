import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./InsertionNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";

/// ...existing imports...

function TutorialScene({ scene, onContinue, onValueShoot }) {
  // State for tutorial circles and connections
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "30", address: "cc20" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const [demoStep, setDemoStep] = useState(0);
  const [insertionMode, setInsertionMode] = useState('right'); // Track insertion mode like main game
  const tutorialCirclesRef = useRef([]);
  
  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Initialize tutorial circles for insertion demonstration
  useEffect(() => {
    if (scene === 'scene2') {
      // Create initial head and tail nodes
      const headNode = {
        id: 'tutorial_head',
        x: window.innerWidth * 0.3,
        y: window.innerHeight / 2,
        value: "10",
        address: "aa10",
        isHead: true
      };
      
      const tailNode = {
        id: 'tutorial_tail',
        x: window.innerWidth * 0.7,
        y: window.innerHeight / 2,
        value: "50",
        address: "ee50",
        isTail: true
      };

      setTutorialCircles([headNode, tailNode]);
      
      // Create connection between head and tail
      setTutorialConnections([{
        id: 'head_to_tail',
        from: 'tutorial_head',
        to: 'tutorial_tail'
      }]);
      
      setDemoStep(0);
    } else if (scene === 'scene3') {
      // Reset for interactive scene
      const headNode = {
        id: 'tutorial_head_3',
        x: window.innerWidth * 0.25,
        y: window.innerHeight / 2,
        value: "10",
        address: "aa10",
        isHead: true
      };
      
      const tailNode = {
        id: 'tutorial_tail_3',
        x: window.innerWidth * 0.75,
        y: window.innerHeight / 2,
        value: "50",
        address: "ee50",
        isTail: true
      };

      setTutorialCircles([headNode, tailNode]);
      setTutorialConnections([{
        id: 'head_to_tail_3',
        from: 'tutorial_head_3',
        to: 'tutorial_tail_3'
      }]);
      
      setTutorialBullets([]);
      setDemoStep(0);
    }
  }, [scene]);

  // Demo animation for scene2 - show automatic insertion
  useEffect(() => {
    if (scene === 'scene2' && demoStep === 0) {
      const timer = setTimeout(() => {
        // Create a demo bullet that will hit the head node
        const demoBullet = {
          id: 'demo_bullet',
          x: window.innerWidth * 0.15,
          y: window.innerHeight / 2,
          value: "25",
          address: "bb25",
          velocityX: 3,
          velocityY: 0,
          isDemoBullet: true
        };
        
        setTutorialBullets([demoBullet]);
        
        // Animate the bullet moving toward the head node
        const animateDemo = () => {
          setTutorialBullets(prev => {
            const bullet = prev[0];
            if (!bullet) return prev;
            
            const newX = bullet.x + bullet.velocityX;
            const headNode = tutorialCircles.find(c => c.id === 'tutorial_head');
            
            // Check if bullet reached the head node
            if (newX >= headNode.x - 40) {
              // Simulate insertion after head node
              setTimeout(() => {
                // Add the new node between head and tail
                const newNode = {
                  id: 'inserted_node',
                  x: window.innerWidth * 0.5,
                  y: window.innerHeight / 2,
                  value: bullet.value,
                  address: bullet.address,
                  isInserted: true
                };
                
                setTutorialCircles(prev => [...prev, newNode]);
                
                // Update connections: head -> newNode -> tail
                setTutorialConnections([
                  {
                    id: 'head_to_new',
                    from: 'tutorial_head',
                    to: 'inserted_node'
                  },
                  {
                    id: 'new_to_tail',
                    from: 'inserted_node',
                    to: 'tutorial_tail'
                  }
                ]);
                
                setTutorialBullets([]);
                setDemoStep(1);
              }, 300);
              
              return [];
            }
            
            return [{...bullet, x: newX}];
          });
        };
        
        const demoInterval = setInterval(() => {
          animateDemo();
          if (demoStep === 1) {
            clearInterval(demoInterval);
          }
        }, 16);
        
        setTimeout(() => clearInterval(demoInterval), 3000);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [scene, demoStep, tutorialCircles]);

  // Handle right-click shooting in tutorial
  const handleTutorialRightClick = useCallback((e) => {
    if (scene !== 'scene3') return;
    
    e.preventDefault();
    
    // Calculate launch position from cannon tip
    const cannonTipX = window.innerWidth - 35;
    const cannonTipY = window.innerHeight - 1;
    
    // Calculate tip position based on cannon angle
    const tipDistance = 55;
    const angleRad = (cannonAngle) * (Math.PI / 180);
    const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
    const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;
    
    // Calculate launch velocity based on cannon direction
    const launchSpeed = 6;
    const velocityX = Math.sin(angleRad) * launchSpeed;
    const velocityY = -Math.cos(angleRad) * launchSpeed;
    
    // Create new bullet with cannon values
    const newBullet = {
      id: Date.now(),
      x: tipX - 30,
      y: tipY - 30,
      value: cannonCircle.value,
      address: cannonCircle.address,
      velocityX: velocityX,
      velocityY: velocityY,
      isBullet: true,
      isLaunched: true,
    };
    
    setTutorialBullets(prev => [...prev, newBullet]);
  }, [scene, cannonAngle, cannonCircle]);

  // Bullet animation and collision detection for tutorial
  useEffect(() => {
    if (scene !== 'scene3') return;
    
    const animateFrame = () => {
      setTutorialBullets(prevBullets => {
        const updatedBullets = [];
        
        prevBullets.forEach(bullet => {
          // Update bullet position
          const newX = bullet.x + bullet.velocityX;
          const newY = bullet.y + bullet.velocityY;
          
          // Boundary collision - bullets bounce off edges
          let newVelocityX = bullet.velocityX;
          let newVelocityY = bullet.velocityY;
          let finalX = newX;
          let finalY = newY;
          
          if (newX <= 15 || newX >= window.innerWidth - 15) {
            newVelocityX = -newVelocityX;
            finalX = newX <= 15 ? 15 : window.innerWidth - 15;
          }
          
          if (newY <= 15 || newY >= window.innerHeight - 15) {
            newVelocityY = -newVelocityY;
            finalY = newY <= 15 ? 15 : window.innerHeight - 15;
          }
          
          // Check collision with existing nodes for insertion
          const currentCircles = tutorialCirclesRef.current;
          let bulletHit = false;
          
          for (const circle of currentCircles) {
            const dx = finalX - circle.x;
            const dy = finalY - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 70) { // Collision threshold
              bulletHit = true;
              
              // Simulate insertion logic
              if (circle.isHead || circle.isTail) {
                // Insert new node
                const newNodeX = insertionMode === 'right' 
                  ? (circle.isHead ? window.innerWidth * 0.5 : window.innerWidth * 0.6)
                  : (circle.isHead ? window.innerWidth * 0.4 : window.innerWidth * 0.5);
                
                const insertedNode = {
                  id: `inserted_${Date.now()}`,
                  x: newNodeX,
                  y: circle.y,
                  value: bullet.value,
                  address: bullet.address,
                  isInserted: true
                };
                
                setTutorialCircles(prev => [...prev, insertedNode]);
                
                // Update connections based on insertion mode and target
                setTimeout(() => {
                  const currentTutorialCircles = tutorialCirclesRef.current;
                  if (insertionMode === 'right') {
                    if (circle.isHead) {
                      // Insert after head: head -> new -> tail
                      setTutorialConnections([
                        {
                          id: 'head_to_new',
                          from: circle.id,
                          to: insertedNode.id
                        },
                        {
                          id: 'new_to_tail',
                          from: insertedNode.id,
                          to: currentTutorialCircles.find(c => c.isTail)?.id
                        }
                      ]);
                    }
                  } else {
                    if (circle.isTail) {
                      // Insert before tail: head -> new -> tail
                      setTutorialConnections([
                        {
                          id: 'head_to_new',
                          from: currentTutorialCircles.find(c => c.isHead)?.id,
                          to: insertedNode.id
                        },
                        {
                          id: 'new_to_tail',
                          from: insertedNode.id,
                          to: circle.id
                        }
                      ]);
                    }
                  }
                }, 0);
              }
              break;
            }
          }
          
          // Only keep the bullet if it didn't hit anything
          if (!bulletHit) {
            updatedBullets.push({
              ...bullet,
              x: finalX,
              y: finalY,
              velocityX: newVelocityX,
              velocityY: newVelocityY
            });
          }
        });
        
        return updatedBullets;
      });
    };

    const intervalId = setInterval(animateFrame, 16);
    return () => clearInterval(intervalId);
  }, [scene, insertionMode]);

  // Mouse movement for cannon rotation and insertion mode
  useEffect(() => {
    if (scene !== 'scene3') return;
    
    const handleMouseMove = (e) => {
      const cannonBaseX = window.innerWidth - 35;
      const cannonBaseY = window.innerHeight - 1;
      
      const deltaX = e.clientX - cannonBaseX;
      const deltaY = e.clientY - cannonBaseY;
      
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      setCannonAngle(angle);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setInsertionMode('left');
      } else {
        setInsertionMode('right');
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("contextmenu", handleTutorialRightClick);
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("contextmenu", handleTutorialRightClick);
      document.removeEventListener("wheel", handleWheel);
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
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial Popup for Scene 1 */}
        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Node Insertion!</h2>
              <p>In this level, you'll learn to insert new nodes into an existing linked list chain.</p>
              <p>You can insert nodes before or after existing nodes, expanding your linked list strategically.</p>
              <button 
                onClick={onContinue}
                className={tutorialStyles.tutorialButton}
              >
                Continue
              </button>
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
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Watch how a new node inserts between existing nodes</h3>
        </div>

        {/* Tutorial Circles */}
        {tutorialCircles.map(circle => (
          <div
            key={circle.id}
            className={styles.animatedCircle}
            style={{
              left: `${circle.x - 30}px`,
              top: `${circle.y - 30}px`,
              cursor: 'default',
              opacity: circle.isInserted ? 1 : 0.9,
              boxShadow: circle.isInserted 
                ? '0 0 15px rgba(0, 255, 0, 0.6)' 
                : circle.isHead 
                  ? '0 0 15px rgba(255, 100, 0, 0.6)'
                  : circle.isTail 
                    ? '0 0 15px rgba(0, 100, 255, 0.6)'
                    : '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span className={styles.circleValue}>{circle.value}</span>
            <span className={styles.circleAddress}>{circle.address}</span>
            
            {/* Head/Tail labels */}
            {(circle.isHead || circle.isTail) && (
              <div 
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: circle.isHead ? '#ff6435' : '#3564ff',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  zIndex: 1000
                }}
              >
                {circle.isHead ? 'head' : 'tail'}
              </div>
            )}
          </div>
        ))}

        {/* Demo Bullets */}
        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          >
            <span className={styles.circleValue}>{bullet.value}</span>
            <span className={styles.circleAddress}>{bullet.address}</span>
          </div>
        ))}

        {/* Tutorial Connections */}
        <svg className={styles.connectionLines}>
          {tutorialConnections.map((connection) => {
            const fromCircle = tutorialCircles.find(c => c.id === connection.from);
            const toCircle = tutorialCircles.find(c => c.id === connection.to);
            
            if (!fromCircle || !toCircle) return null;
            
            return (
              <g key={connection.id}>
                <line
                  x1={fromCircle.x}
                  y1={fromCircle.y}
                  x2={toCircle.x}
                  y2={toCircle.y}
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

        {/* Continue button appears after demo insertion */}
        {demoStep >= 1 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Perfect!</h2>
                <p>You can see how the new node was inserted between the head and tail nodes.</p>
                <p>The connections were automatically updated: Head → New Node → Tail</p>
                <p>Now let's try it yourself with manual control!</p>
                <button 
                  onClick={onContinue}
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
    const hasInsertedNode = tutorialCircles.some(c => c.isInserted);
    
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
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Right-click to insert a node. Scroll to change insertion mode!</h3>
        </div>

        {/* Insertion mode indicator */}
        <div style={{ 
          position: 'absolute', 
          top: 12, 
          left: 12, 
          zIndex: 1000, 
          background: 'rgba(0,0,0,0.8)', 
          color: '#fff', 
          padding: '6px 12px', 
          borderRadius: 12, 
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Insert: {insertionMode === 'left' ? 'Before (←)' : 'After (→)'}
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
            <span style={{ fontSize: '10px' }}>
              {cannonCircle.value}
            </span>
            <span style={{ fontSize: '8px' }}>
              {cannonCircle.address}
            </span>
          </div>
        </div>

        {/* Tutorial Circles */}
        {tutorialCircles.map(circle => (
          <div
            key={circle.id}
            className={styles.animatedCircle}
            style={{
              left: `${circle.x - 30}px`,
              top: `${circle.y - 30}px`,
              cursor: 'default',
              opacity: circle.isInserted ? 1 : 0.9,
              boxShadow: circle.isInserted 
                ? '0 0 15px rgba(0, 255, 0, 0.6)' 
                : circle.isHead 
                  ? '0 0 15px rgba(255, 100, 0, 0.6)'
                  : circle.isTail 
                    ? '0 0 15px rgba(0, 100, 255, 0.6)'
                    : '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span className={styles.circleValue}>{circle.value}</span>
            <span className={styles.circleAddress}>{circle.address}</span>
            
            {/* Head/Tail labels */}
            {(circle.isHead || circle.isTail) && (
              <div 
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: circle.isHead ? '#ff6435' : '#3564ff',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  zIndex: 1000
                }}
              >
                {circle.isHead ? 'head' : 'tail'}
              </div>
            )}
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
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          >
            <span className={styles.circleValue}>{bullet.value}</span>
            <span className={styles.circleAddress}>{bullet.address}</span>
          </div>
        ))}

        {/* Tutorial Connections */}
        <svg className={styles.connectionLines}>
          {tutorialConnections.map((connection) => {
            const fromCircle = tutorialCircles.find(c => c.id === connection.from);
            const toCircle = tutorialCircles.find(c => c.id === connection.to);
            
            if (!fromCircle || !toCircle) return null;
            
            return (
              <g key={connection.id}>
                <line
                  x1={fromCircle.x}
                  y1={fromCircle.y}
                  x2={toCircle.x}
                  y2={toCircle.y}
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

        {/* Continue button appears after successful insertion */}
        {hasInsertedNode && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Excellent!</h2>
                <p>You successfully inserted a new node into the existing chain!</p>
                <p>Notice how the connections automatically updated to include your new node in the sequence.</p>
                <p>Now you're ready for the real insertion challenges!</p>
                <button 
                  onClick={onContinue}
                  className={tutorialStyles.tutorialButton}
                >
                  Start Game
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
      <div className={styles.app}>
        <video
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Game Instructions Popup */}
        <div className={tutorialStyles.gameInstructionsOverlay}>
          <div className={tutorialStyles.gameInstructionsPopup}>
            <div className={tutorialStyles.gameInstructionsContent}>
              <div className={tutorialStyles.gameInstructionsHeader}>
                <h2>Node Insertion - Game Instructions</h2>
              </div>
              
              <div className={tutorialStyles.gameInstructionsBody}>
                <ul>
                  <li><strong>Objective:</strong> Insert nodes into the existing linked list to match the expected structure</li>
                  <li><strong>Controls:</strong> Click the cannon to select bullets, right-click to shoot</li>
                  <li><strong>Insertion Modes:</strong> Scroll wheel to switch between "Before" and "After" insertion</li>
                  <li><strong>Strategy:</strong> Hit head/tail nodes to extend the list, hit middle nodes to insert between</li>
                  <li><strong>Deletion:</strong> Click any node 5 times to remove it (bridges connections automatically)</li>
                  <li><strong>Challenges:</strong> Avoid black holes and manage the 2-minute timer!</li>
                  <li><strong>Portal:</strong> Complete chains get sucked into the portal for validation</li>
                </ul>
              </div>
              
              <div className={tutorialStyles.gameInstructionsFooter}>
                <button 
                  onClick={onContinue}
                  className={tutorialStyles.tutorialButton}
                >
                  Continue to Practice
                </button>
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