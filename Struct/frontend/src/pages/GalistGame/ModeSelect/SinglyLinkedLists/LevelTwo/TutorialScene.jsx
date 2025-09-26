  // Floating mechanism for tutorial circles (scene2 only)

import { useState, useEffect, useRef, useCallback } from "react";
import { collisionDetection } from "../../../CollisionDetection";
import PropTypes from "prop-types";
import styles from "./LinkingNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";

// Tutorial Scene Component for Linking Nodes
function TutorialScene({ scene, onContinue, onValueShoot }) {
    useEffect(() => {
    if (scene !== 'scene2') return;
    const interval = setInterval(() => {
      setTutorialCircles(prevCircles => {
        return prevCircles.map((circle, idx) => {
          // Only float the initial head node
          if (idx === 0) {
            // Initialize gentle floating if not already set
            if (!circle.floatVelocityX || !circle.floatVelocityY) {
              const angle = Math.random() * 2 * Math.PI;
              const speed = 0.7 + Math.random() * 0.5; // Increased speed
              circle.floatVelocityX = Math.cos(angle) * speed;
              circle.floatVelocityY = Math.sin(angle) * speed;
            }
            // Apply gentle floating movement
            let newX = circle.x + circle.floatVelocityX;
            let newY = circle.y + circle.floatVelocityY;
            let newFloatVelocityX = circle.floatVelocityX;
            let newFloatVelocityY = circle.floatVelocityY;
            if (newX <= 30 || newX >= window.innerWidth - 30) {
              newFloatVelocityX = -newFloatVelocityX;
            }
            if (newY <= 30 || newY >= window.innerHeight - 30) {
              newFloatVelocityY = -newFloatVelocityY;
            }
            newX = Math.max(30, Math.min(window.innerWidth - 30, newX));
            newY = Math.max(30, Math.min(window.innerHeight - 30, newY));
            return {
              ...circle,
              x: newX,
              y: newY,
              floatVelocityX: newFloatVelocityX,
              floatVelocityY: newFloatVelocityY
            };
          }
          return circle;
        });
      });
    }, 16);
    return () => clearInterval(interval);
  }, [scene]);
  // Floating mechanism for tutorial circles (scene2 only)
  useEffect(() => {
    if (scene !== 'scene2') return;
    const interval = setInterval(() => {
      setTutorialCircles(prevCircles => {
        return prevCircles.map((circle, idx) => {
          // Only float the initial head node
          if (idx === 0) {
            // Initialize gentle floating if not already set
            if (!circle.floatVelocityX || !circle.floatVelocityY) {
              const angle = Math.random() * 2 * Math.PI;
              const speed = 0.2 + Math.random() * 0.3;
              circle.floatVelocityX = Math.cos(angle) * speed;
              circle.floatVelocityY = Math.sin(angle) * speed;
            }
            // Apply gentle floating movement
            let newX = circle.x + circle.floatVelocityX;
            let newY = circle.y + circle.floatVelocityY;
            let newFloatVelocityX = circle.floatVelocityX;
            let newFloatVelocityY = circle.floatVelocityY;
            if (newX <= 30 || newX >= window.innerWidth - 30) {
              newFloatVelocityX = -newFloatVelocityX;
            }
            if (newY <= 30 || newY >= window.innerHeight - 30) {
              newFloatVelocityY = -newFloatVelocityY;
            }
            newX = Math.max(30, Math.min(window.innerWidth - 30, newX));
            newY = Math.max(30, Math.min(window.innerHeight - 30, newY));
            return {
              ...circle,
              x: newX,
              y: newY,
              floatVelocityX: newFloatVelocityX,
              floatVelocityY: newFloatVelocityY
            };
          }
          // Nudge and bounce effect for the new node (scene2 only)
          if (scene === 'scene2' && circle.isLaunched && Math.abs(circle.velocityX) > 0.1) {
            const friction = 0.85;
            let velocityX = circle.velocityX * friction;
            let newX = circle.x + velocityX;
            // Bounce off the initial node if close
            const headNode = prevCircles[0];
            if (headNode) {
              const dx = newX - headNode.x;
              const dy = circle.y - headNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 60 && Math.abs(velocityX) > 1) {
                velocityX = -velocityX * 0.7; // reverse and dampen velocity
                newX = circle.x + velocityX;
              }
            }
            if (Math.abs(velocityX) < 0.1) velocityX = 0;
            return {
              ...circle,
              x: newX,
              velocityX
            };
          }
          return circle;
        });
      });
    }, 16);
    return () => clearInterval(interval);
  }, [scene]);

    // Typewriting effect for instruction bar (scene2)
    const instructionText = "The first node in a linked list is called the head. If it’s the only node, it also acts as the tail.";
    const secondText = "Shoot the node to see what happens.";
  const [typedInstruction, setTypedInstruction] = useState("");
  const [nodeAdded, setNodeAdded] = useState(false);
    useEffect(() => {
      if (scene !== 'scene2') {
        setTypedInstruction("");
        setNodeAdded(false);
        return;
      }
      if (nodeAdded) {
        // Typing effect for collision instruction
        const collisionText = "A new node is added. The tail now points to this node, making it the end of the list.";
        let idx = 0;
        setTypedInstruction("");
        const interval = setInterval(() => {
          idx++;
          setTypedInstruction(collisionText.slice(0, idx));
          if (idx >= collisionText.length) {
            clearInterval(interval);
          }
        }, 2000 / collisionText.length); // 2 seconds total duration
        return () => clearInterval(interval);
      }
      let currentIdx = 0;
      const totalDuration = 4000;
      const intervalTime = totalDuration / instructionText.length;
      setTypedInstruction("");
      let interval = setInterval(() => {
        currentIdx++;
        setTypedInstruction(instructionText.slice(0, currentIdx));
        if (currentIdx >= instructionText.length) {
          clearInterval(interval);
          setTimeout(() => {
            let secondIdx = 0;
            const secondDuration = 2000;
            const secondIntervalTime = secondDuration / secondText.length;
            interval = setInterval(() => {
              secondIdx++;
              setTypedInstruction(secondText.slice(0, secondIdx));
              if (secondIdx >= secondText.length) {
                clearInterval(interval);
              }
            }, secondIntervalTime);
          }, 3000);
        }
      }, intervalTime);
      return () => clearInterval(interval);
    }, [scene, nodeAdded]);
  // State for tutorial circles and connections
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "42", address: "aa10" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);
  
  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Initialize tutorial circles for linking demonstration
  useEffect(() => {
    if (scene === 'scene2') {
      // Generate random value and address for the head node
      const randomValue = Math.floor(Math.random() * 100) + 1;
      const addressTypes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj'];
      const numbers = ['10', '20', '30', '40', '50', '60', '70', '80', '90'];
      const randomAddress = addressTypes[Math.floor(Math.random() * addressTypes.length)] + numbers[Math.floor(Math.random() * numbers.length)];

      // Head node
      const headNode = {
        id: 'headNode',
        x: 250,
        y: 200,
        value: randomValue.toString(),
        address: randomAddress,
        velocityX: 0,
        velocityY: 0,
        isLaunched: false
      };

      setTutorialCircles([headNode]);
      setTutorialConnections([]);

      // Set up cannon with a new random node
      const cannonValue = Math.floor(Math.random() * 100) + 1;
      const cannonAddress = addressTypes[Math.floor(Math.random() * addressTypes.length)] + numbers[Math.floor(Math.random() * numbers.length)];
      setCannonCircle({ value: cannonValue.toString(), address: cannonAddress });
    }
  }, [scene]);

  // Scene2: Only connect the new node after bullet hits the initial node (smooth animation)
  useEffect(() => {
    if (scene !== 'scene2') return;
    let animationFrameId;
    const animate = () => {
      setTutorialBullets(prevBullets => {
        const updatedBullets = [];
        let didConnect = false;
        prevBullets.forEach(bullet => {
          let newX = bullet.x + bullet.velocityX;
          let newY = bullet.y + bullet.velocityY;
          let newVelocityX = bullet.velocityX;
          let newVelocityY = bullet.velocityY;
          // Bounce off left/right walls
          if (newX <= 0 || newX >= window.innerWidth - 60) {
            newVelocityX = -newVelocityX;
            newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
          }
          // Bounce off top/bottom walls
          if (newY <= 0 || newY >= window.innerHeight - 60) {
            newVelocityY = -newVelocityY;
            newY = Math.max(0, Math.min(window.innerHeight - 60, newY));
          }
          const updatedBullet = { ...bullet, x: newX, y: newY, velocityX: newVelocityX, velocityY: newVelocityY };
          const headNode = tutorialCirclesRef.current[0];
          if (headNode) {
            const dx = updatedBullet.x - headNode.x;
            const dy = updatedBullet.y - headNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70 && !didConnect) {
              didConnect = true;
              const amplify = 0.5;
              const retain = 0.7;
              const newCircle = {
                id: `inserted_${Date.now()}`,
                x: headNode.x + 100,
                y: headNode.y,
                value: bullet.value,
                address: bullet.address,
                velocityX: updatedBullet.velocityX * retain,
                velocityY: updatedBullet.velocityY * retain,
                isLaunched: true,
                launchTime: Date.now()
              };
              setTutorialCircles(prevCircles => {
                const updatedHead = {
                  ...prevCircles[0],
                  velocityX: updatedBullet.velocityX * amplify,
                  velocityY: updatedBullet.velocityY * amplify
                };
                return [
                  updatedHead,
                  ...prevCircles.slice(1),
                  newCircle
                ];
              });
              setNodeAdded(true);
              setTutorialConnections([{ id: `conn_${Date.now()}`, from: headNode.id, to: newCircle.id }]);
              onValueShoot?.('collision');
            }
          }
          if (!didConnect) {
            updatedBullets.push(updatedBullet);
          }
        });
        return updatedBullets;
      });
      // After bullet animation, apply collisionDetection to all tutorial circles for bouncing
      setTutorialCircles(prevCircles => {
        if (prevCircles.length > 1) {
          return collisionDetection.updatePhysics(prevCircles);
        }
        return prevCircles;
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [scene, onValueShoot]);

  // Handle right-click shooting in tutorial (scene2 and scene3)
  const handleTutorialRightClick = useCallback((e) => {
    if (scene !== 'scene2' && scene !== 'scene3') return;

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
  const launchSpeed = 12; // Match normal game speed
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

  // Bullet animation and collision detection for tutorial (scene3, smooth)
  useEffect(() => {
    if (scene !== 'scene3') return;
    let animationFrameId;
    const animate = () => {
      setTutorialBullets(prevBullets => {
        const updatedBullets = [];
        prevBullets.forEach(bullet => {
          let newX = bullet.x + bullet.velocityX;
          let newY = bullet.y + bullet.velocityY;
          let newVelocityX = bullet.velocityX;
          let newVelocityY = bullet.velocityY;
          // Bounce off left/right walls
          if (newX <= 0 || newX >= window.innerWidth - 60) {
            newVelocityX = -newVelocityX;
            newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
          }
          // Bounce off top/bottom walls
          if (newY <= 0 || newY >= window.innerHeight - 60) {
            newVelocityY = -newVelocityY;
            newY = Math.max(0, Math.min(window.innerHeight - 60, newY));
          }
          const updatedBullet = { ...bullet, x: newX, y: newY, velocityX: newVelocityX, velocityY: newVelocityY };
          let bulletHitSomething = false;
          const currentTutorialCircles = tutorialCirclesRef.current;
          for (let i = 0; i < currentTutorialCircles.length; i++) {
            const circle = currentTutorialCircles[i];
            const dx = updatedBullet.x - circle.x;
            const dy = updatedBullet.y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70) {
              bulletHitSomething = true;
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
              setTutorialConnections(prevConns => [
                ...prevConns,
                {
                  id: `new_conn_${Date.now()}`,
                  from: 'chain2',
                  to: newCircle.id
                }
              ]);
              onValueShoot?.('collision');
              break;
            }
          }
          if (!bulletHitSomething) {
            updatedBullets.push(updatedBullet);
          }
        });
        return updatedBullets;
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [scene, onValueShoot]);

  // Mouse movement for cannon rotation
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3') return;

    const handleMouseMove = (e) => {
      const cannonBaseX = window.innerWidth - 35;
      const cannonBaseY = window.innerHeight - 1;

      const deltaX = e.clientX - cannonBaseX;
      const deltaY = e.clientY - cannonBaseY;

      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      // Remove the angle constraint to allow full 90-degree left rotation
      angle = Math.max(-90, Math.min(90, angle));
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
              <p>In this level, you will learn how to connect nodes together to form a linked list.</p>
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

        {/* Tutorial instruction bar with typewriting effect, replacing first text with second */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>{typedInstruction}</h3>
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

        {/* Tutorial Circles with floating and label */}
        {tutorialCircles.map((circle, idx) => {
          let label = null;
          if (tutorialCircles.length === 1 && idx === 0) {
            label = 'Head/Tail';
          } else if (tutorialCircles.length === 2) {
            if (idx === 0) label = 'Head';
            if (idx === 1) label = 'Tail';
          }
          return (
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
              {label && (
                <div 
                  className={styles.headTailLabel}
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    border: '1px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {label}
                </div>
              )}
            </div>
          );
        })}

        {/* Tutorial Bullets (show shot node) */}
        {tutorialBullets && tutorialBullets.map(bullet => (
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