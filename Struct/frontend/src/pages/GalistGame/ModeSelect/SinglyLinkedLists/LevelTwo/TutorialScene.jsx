import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./LinkingNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";

// Tutorial Scene Component for Linking Nodes
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // State for tutorial circles and connections
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "42", address: "aa10" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const [demoStep, setDemoStep] = useState(0);
  const tutorialCirclesRef = useRef([]);
  
  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Initialize tutorial circles for linking demonstration
  useEffect(() => {
    if (scene === 'scene2') {
      // Create two isolated circles for linking demo
      const circles = [
        {
          id: 'demo1',
          x: 200,
          y: 200,
          value: "10",
          address: "bb20",
          velocityX: 0,
          velocityY: 0,
          isLaunched: false
        },
        {
          id: 'demo2',
          x: 400,
          y: 200,
          value: "20",
          address: "cc30",
          velocityX: 0,
          velocityY: 0,
          isLaunched: false
        }
      ];
      
      setTutorialCircles(circles);
      setTutorialConnections([]);
      setDemoStep(0);
    } else if (scene === 'scene3') {
      // Create a simple chain for collision demo
      const circles = [
        {
          id: 'chain1',
          x: 150,
          y: 300,
          value: "5",
          address: "dd40",
          velocityX: 0,
          velocityY: 0,
          isLaunched: false
        },
        {
          id: 'chain2',
          x: 300,
          y: 300,
          value: "15",
          address: "ee50",
          velocityX: 0,
          velocityY: 0,
          isLaunched: false
        }
      ];
      
      setTutorialCircles(circles);
      setTutorialConnections([{
        id: 'conn1',
        from: 'chain1',
        to: 'chain2'
      }]);
      
      // Update cannon with a new node to insert
      setCannonCircle({ value: "25", address: "ff60" });
    }
  }, [scene]);

  // Demo animation for scene2 - show automatic linking
  useEffect(() => {
    if (scene === 'scene2' && demoStep === 0) {
      const timer = setTimeout(() => {
        // Simulate collision and linking
        setTutorialConnections([{
          id: 'demo_conn',
          from: 'demo1',
          to: 'demo2'
        }]);
        setDemoStep(1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [scene, demoStep]);

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
          
          const updatedBullet = {
            ...bullet,
            x: newX,
            y: newY
          };

          // Check for collisions with tutorial circles
          let bulletHitSomething = false;
          
          const currentTutorialCircles = tutorialCirclesRef.current;
          for (let i = 0; i < currentTutorialCircles.length; i++) {
            const circle = currentTutorialCircles[i];

            const dx = updatedBullet.x - circle.x;
            const dy = updatedBullet.y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 70) { // Collision threshold
              bulletHitSomething = true;

              // Add the bullet as a new circle (simulating node insertion)
              const newCircle = {
                id: `inserted_${Date.now()}`,
                x: circle.x + 100,
                y: circle.y,
                value: bullet.value,
                address: bullet.address,
                velocityX: 0,
                velocityY: 0,
                isLaunched: false
              };

              setTutorialCircles(prevCircles => [...prevCircles, newCircle]);

              // Create new connection (extend the chain)
              setTutorialConnections(prevConns => [
                ...prevConns,
                {
                  id: `new_conn_${Date.now()}`,
                  from: 'chain2', // Connect from the tail
                  to: newCircle.id
                }
              ]);

              // Notify parent component
              onValueShoot?.('collision');
              break;
            }
          }

          // Remove bullets that go off screen or hit something
          if (!bulletHitSomething && 
              newX > -50 && newX < window.innerWidth + 50 && 
              newY > -50 && newY < window.innerHeight + 50) {
            updatedBullets.push(updatedBullet);
          }
        });
        
        return updatedBullets;
      });
    };

    const intervalId = setInterval(animateFrame, 16);
    return () => clearInterval(intervalId);
  }, [scene, onValueShoot]);

  // Mouse movement for cannon rotation
  useEffect(() => {
  if (scene !== 'scene3') return;
  
  const handleMouseMove = (e) => {
    const cannonBaseX = window.innerWidth - 35;
    const cannonBaseY = window.innerHeight - 1;
    
    const deltaX = e.clientX - cannonBaseX;
    const deltaY = e.clientY - cannonBaseY;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    // Remove the angle constraint to allow full 90-degree left rotation
    angle = Math.max(-90, Math.min(90, angle)); // Changed from -60,60 to -90,90
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
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial Popup for Scene 1 */}
        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Linking Nodes!</h2>
              <p>In this level, you'll learn how to connect nodes together to form a linked list.</p>
              <p>When two nodes collide, they automatically link together, creating a chain of connected data.</p>
              <p>Your goal is to create the exact linked list structure shown in the expected results.</p>
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
          <h3>Watch how nodes automatically link when they collide</h3>
        </div>

        {/* Tutorial Circles */}
        {tutorialCircles.map(circle => (
          <div
            key={circle.id}
            className={styles.animatedCircle}
            style={{
              left: `${circle.x - 30}px`,
              top: `${circle.y - 30}px`,
              cursor: 'default'
            }}
          >
            <span className={styles.circleValue}>{circle.value}</span>
            <span className={styles.circleAddress}>{circle.address}</span>
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

        {/* Continue button appears after linking demo */}
        {demoStep >= 1 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Perfect!</h2>
                <p>You can see how the two nodes automatically connected when they came close together.</p>
                <p>The arrow shows the direction of the link - from the first node to the second node.</p>
                <p>Now let's learn how to add new nodes to an existing chain.</p>
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
          <h3>Right-click to shoot a new node and extend the chain</h3>
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
              opacity: circle.id.startsWith('inserted') ? 1 : 0.9,
              boxShadow: circle.id.startsWith('inserted') ? '0 0 15px rgba(0, 255, 0, 0.6)' : '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span className={styles.circleValue}>{circle.value}</span>
            <span className={styles.circleAddress}>{circle.address}</span>
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
        {tutorialCircles.length > 2 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Excellent!</h2>
                <p>You successfully added a new node to the chain! Notice how it automatically connected to the tail node.</p>
                <p>The green glow shows the newly inserted node, and the arrow shows the new connection.</p>
                <p>Now you're ready to start the real challenges!</p>
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
              <h2>Linking Nodes - Game Instructions</h2>
            </div>
            
            <div className={tutorialStyles.gameInstructionsBody}>
              <ul>
                <li><strong>Objective:</strong> Create the exact linked list structure shown in the expected results</li>
                <li><strong>Controls:</strong> Click the cannon to select bullets, right-click to shoot</li>
                <li><strong>Linking:</strong> Nodes automatically connect when they collide</li>
                <li><strong>Chain Rules:</strong> New nodes extend from the tail, colliding with head removes the node</li>
                <li><strong>Deletion:</strong> Click a node 5 times to delete it (shows progress circle)</li>
                <li><strong>Challenges:</strong> Avoid black holes that can destroy your nodes!</li>
                <li><strong>Portal:</strong> Complete chains get sucked into the portal for scoring</li>
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