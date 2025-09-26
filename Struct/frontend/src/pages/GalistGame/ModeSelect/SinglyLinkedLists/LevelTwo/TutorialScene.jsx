

import { useState, useEffect, useRef, useCallback } from "react";
import { collisionDetection } from "../../../CollisionDetection";
import PropTypes from "prop-types";
import styles from "./LinkingNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";

// Tutorial Scene Component for Linking Nodes
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // Consolidated floating mechanism for tutorial circles (scene2 only)
  useEffect(() => {
    if (scene !== 'scene2') return;
    const interval = setInterval(() => {
      setTutorialCircles(prevCircles => {
        return prevCircles.map((circle) => {
          // Ensure every circle has a gentle float velocity so it never becomes static
          let floatVx = circle.floatVelocityX;
          let floatVy = circle.floatVelocityY;
          if (floatVx === undefined || floatVy === undefined) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = 0.2 + Math.random() * 0.5; // enough to keep motion
            floatVx = Math.cos(angle) * speed;
            floatVy = Math.sin(angle) * speed;
          }

          // Apply float to position
          let newX = circle.x + floatVx;
          let newY = circle.y + floatVy;
          let newFloatVx = floatVx;
          let newFloatVy = floatVy;
          if (newX <= 30 || newX >= window.innerWidth - 30) newFloatVx = -newFloatVx;
          if (newY <= 30 || newY >= window.innerHeight - 30) newFloatVy = -newFloatVy;
          newX = Math.max(30, Math.min(window.innerWidth - 30, newX));
          newY = Math.max(30, Math.min(window.innerHeight - 30, newY));

          // Keep launched nodes moving: if their velocity decays near zero, add a small impulse from float
          let vx = circle.velocityX || 0;
          let vy = circle.velocityY || 0;
          const speedMag = Math.sqrt(vx * vx + vy * vy);
          const minSpeed = 0.15;
          if (circle.isLaunched && speedMag < minSpeed) {
            // inject a small consistent impulse so nodes don't become static
            vx += newFloatVx * 0.6;
            vy += newFloatVy * 0.6;
          } else {
            // gentle damping so motion decays slowly
            vx *= 0.99;
            vy *= 0.99;
          }

          return {
            ...circle,
            x: newX,
            y: newY,
            floatVelocityX: newFloatVx,
            floatVelocityY: newFloatVy,
            velocityX: vx,
            velocityY: vy
          };
        });
      });
    }, 16);
    return () => clearInterval(interval);
  }, [scene]);

    // Typewriting effect for instruction bar (scene2)
  const instructionText = "The first node in a linked list is called the head. If it’s the only node, it also acts as the tail.";
  const secondText = "Shoot the node to see what happens.";
  const collisionText = "A new node is added. The tail now points to this node, making it the end of the list.";
  const nextText = "Now add another node. Watch how the list grows longer.";
  const [typedInstruction, setTypedInstruction] = useState("");
  const [instructionStep, setInstructionStep] = useState(0); // 0: initial, 1: secondText, 2: collision, 3: prompt add another
  useEffect(() => {
    if (scene !== 'scene2') {
      setTypedInstruction("");
      setInstructionStep(0);
      return;
    }
    let interval;
    if (instructionStep === 0) {
      // Initial typewriter effect
      let currentIdx = 0;
      const totalDuration = 4000;
      const intervalTime = totalDuration / instructionText.length;
      setTypedInstruction("");
      interval = setInterval(() => {
        currentIdx++;
        setTypedInstruction(instructionText.slice(0, currentIdx));
        if (currentIdx >= instructionText.length) {
          clearInterval(interval);
          setTimeout(() => setInstructionStep(1), 2000);
        }
      }, intervalTime);
    } else if (instructionStep === 1) {
      // Second text typewriter effect
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(secondText.slice(0, idx));
        if (idx >= secondText.length) {
          clearInterval(interval);
        }
      }, 2000 / secondText.length);
    } else if (instructionStep === 2) {
      // Collision text typewriter effect
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(collisionText.slice(0, idx));
        if (idx >= collisionText.length) {
          clearInterval(interval);
          setTimeout(() => setInstructionStep(3), 2000);
        }
      }, 2000 / collisionText.length);
    } else if (instructionStep === 3) {
      // Prompt to add another node
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(nextText.slice(0, idx));
        if (idx >= nextText.length) {
          clearInterval(interval);
        }
      }, 2000 / nextText.length);
    }
    return () => clearInterval(interval);
  }, [scene, instructionStep]);
  // State for tutorial circles and connections
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "42", address: "aa10" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);


  // Central expiry interval: scan for unlinked nodes older than 3s and remove instantly
  useEffect(() => {
    if (scene !== 'scene2') return;
    const interval = setInterval(() => {
      setTutorialCircles(prev => {
        const now = Date.now();
        const filtered = prev.filter(circle => {
           const isLinked = tutorialConnections.some(conn => conn.from === circle.id || conn.to === circle.id);
          if (circle.isLaunched && !isLinked && now - (circle.launchTime || 0) > 3000) {
            return false;
          }
          return true;
        });
        return filtered;
      });
    }, 200); // check 5x per second for instant removal
    return () => clearInterval(interval);
  }, [scene, tutorialConnections]);
  
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
          // Head node collision (first addition)
          if (tutorialCirclesRef.current.length === 1) {
            const headNode = tutorialCirclesRef.current[0];
            const dx = updatedBullet.x - headNode.x;
            const dy = updatedBullet.y - headNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70 && !didConnect) {
              didConnect = true;
              const amplify = 0.5;
              const retain = 0.7;
              // Place the new node along the approach vector so it doesn't overlap and stick
              const approachNorm = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));
              const offset = 60; // place new node just outside collision radius
              const nx = dx / approachNorm;
              const ny = dy / approachNorm;
              const newX = headNode.x + nx * offset;
              const newY = headNode.y + ny * offset;
              const newCircle = {
                id: `inserted_${Date.now()}`,
                x: newX,
                y: newY,
                value: bullet.value,
                address: bullet.address,
                velocityX: updatedBullet.velocityX * retain + nx * 2,
                velocityY: updatedBullet.velocityY * retain + ny * 2,
                isLaunched: true,
                launchTime: Date.now(),
                connected: true // Mark as connected
              };
              setTutorialCircles(prevCircles => {
                const updatedHead = {
                  ...prevCircles[0],
                  velocityX: updatedBullet.velocityX * amplify,
                  velocityY: updatedBullet.velocityY * amplify
                };
                let arr = [updatedHead, newCircle];
                // Immediate separation pass for adjacent nodes to avoid overlap/sticking
                const minDist = 60;
                for (let i = 0; i < arr.length - 1; i++) {
                  const a = arr[i];
                  const b = arr[i + 1];
                  let dx = b.x - a.x;
                  let dy = b.y - a.y;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                  if (dist < minDist) {
                    const overlap = (minDist - dist) + 4; // stronger push to avoid sticking
                    const nx = dx / dist;
                    const ny = dy / dist;
                    // Move them apart equally
                    a.x -= nx * (overlap / 2);
                    a.y -= ny * (overlap / 2);
                    b.x += nx * (overlap / 2);
                    b.y += ny * (overlap / 2);
                    // Stronger nudge velocities so they separate and bounce
                    a.velocityX = (a.velocityX || 0) - nx * 1.2;
                    a.velocityY = (a.velocityY || 0) - ny * 1.2;
                    b.velocityX = (b.velocityX || 0) + nx * 1.2;
                    b.velocityY = (b.velocityY || 0) + ny * 1.2;
                  }
                }
                // Run the physics solver immediately so the pair will bounce/separate this frame
                try {
                  const solved = collisionDetection.updatePhysics(arr);
                  return solved;
                } catch {
                  // Fallback: return the manually adjusted array if solver fails
                  return arr;
                }
              });
              // No expiry call needed; central interval handles removal
              setInstructionStep(2); // Show collision text only after hit
              setTutorialConnections([{ id: `conn_${Date.now()}`, from: headNode.id, to: newCircle.id }]);
              onValueShoot?.('collision');
            }
          } else if (tutorialCirclesRef.current.length > 1) {
            // Tail node collision (repeated addition)
            const tailIdx = tutorialCirclesRef.current.length - 1;
            const tailNode = tutorialCirclesRef.current[tailIdx];
            const dx = updatedBullet.x - tailNode.x;
            const dy = updatedBullet.y - tailNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70 && !didConnect) {
              didConnect = true;
              const amplify = 0.5;
              const retain = 0.7;
              // Place the new node along the approach vector so it doesn't overlap and stick
              const approachNorm = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));
              const offset = 60;
              const nx = dx / approachNorm;
              const ny = dy / approachNorm;
              const newX = tailNode.x + nx * offset;
              const newY = tailNode.y + ny * offset;
              const newCircle = {
                id: `inserted_${Date.now()}`,
                x: newX,
                y: newY,
                value: bullet.value,
                address: bullet.address,
                velocityX: updatedBullet.velocityX * retain + nx * 2,
                velocityY: updatedBullet.velocityY * retain + ny * 2,
                isLaunched: true,
                launchTime: Date.now(),
                connected: true // Mark as connected
              };
              setTutorialCircles(prevCircles => {
                const updatedTail = {
                  ...prevCircles[tailIdx],
                  velocityX: updatedBullet.velocityX * amplify,
                  velocityY: updatedBullet.velocityY * amplify
                };
                let arr = [
                  ...prevCircles.slice(0, tailIdx),
                  updatedTail,
                  newCircle
                ];
                // Immediate separation pass for adjacent nodes to avoid overlap/sticking
                const minDist = 60;
                for (let i = 0; i < arr.length - 1; i++) {
                  const a = arr[i];
                  const b = arr[i + 1];
                  let dx = b.x - a.x;
                  let dy = b.y - a.y;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                  if (dist < minDist) {
                    const overlap = (minDist - dist) + 4;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    a.x -= nx * (overlap / 2);
                    a.y -= ny * (overlap / 2);
                    b.x += nx * (overlap / 2);
                    b.y += ny * (overlap / 2);
                    a.velocityX = (a.velocityX || 0) - nx * 1.2;
                    a.velocityY = (a.velocityY || 0) - ny * 1.2;
                    b.velocityX = (b.velocityX || 0) + nx * 1.2;
                    b.velocityY = (b.velocityY || 0) + ny * 1.2;
                  }
                }
                // Run the physics solver immediately so the pair will bounce/separate this frame
                try {
                  const solved = collisionDetection.updatePhysics(arr);
                  return solved;
                } catch {
                  return arr;
                }
              });
              // No expiry call needed; central interval handles removal
              setTutorialConnections(prevConns => [
                ...prevConns,
                { id: `conn_${Date.now()}`, from: tailNode.id, to: newCircle.id }
              ]);
              setInstructionStep(3); // Show prompt after repeated addition
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
        // Remove orphaned nodes after 3 seconds
        const now = Date.now();
        const filtered = prevCircles.filter(circle => {
          // Remove node if it is launched, not connected, and older than 3 seconds
          if (circle.isLaunched && (!circle.connected || circle.connected === false) && now - (circle.launchTime || 0) > 3000) {
            return false;
          }
          return true;
        });
        // Update physics for remaining nodes
        if (filtered.length > 1) {
          return collisionDetection.updatePhysics(filtered);
        }
        return filtered;
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
      connected: false,
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
                connected: true,
                isLaunched: false
              };
              setTutorialCircles(prevCircles => [...prevCircles, newCircle]);
              // expiry handled by central interval
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
          const len = tutorialCircles.length;
          if (len === 1 && idx === 0) {
            label = 'Head/Tail';
          } else if (len === 2) {
            if (idx === 0) label = 'Head';
            if (idx === 1) label = 'Tail';
          } else if (len > 2) {
            if (idx === 0) label = 'Head';
            if (idx === len - 1) label = 'Tail';
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