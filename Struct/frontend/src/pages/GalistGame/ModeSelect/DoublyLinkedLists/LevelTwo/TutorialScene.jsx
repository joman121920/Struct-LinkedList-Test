import { useState, useEffect, useRef, useCallback } from "react";
import { collisionDetection } from "../../../CollisionDetection";
import PropTypes from "prop-types";
import styles from "./LinkingNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";
import { playTutorialBgMusic, stopTutorialBgMusic, playHitSound, playFirstClickSound, playKeyboardSound } from "../../../Sounds.jsx";
const NULL_POINTER = "null";

// Tutorial Scene Component for Linking Nodes (Doubly Linked List)
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // Consolidated floating mechanism for tutorial circles (scene2 only)
  useEffect(() => {
    if (scene !== 'scene2') return;
    const interval = setInterval(() => {
      setTutorialCircles(prevCircles => {
        return prevCircles.map((circle) => {
          let floatVx = circle.floatVelocityX;
          let floatVy = circle.floatVelocityY;
          if (floatVx === undefined || floatVy === undefined) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = 0.2 + Math.random() * 0.5;
            floatVx = Math.cos(angle) * speed;
            floatVy = Math.sin(angle) * speed;
          }

          let newX = circle.x + floatVx;
          let newY = circle.y + floatVy;
          let newFloatVx = floatVx;
          let newFloatVy = floatVy;
          if (newX <= 30 || newX >= window.innerWidth - 30) newFloatVx = -newFloatVx;
          if (newY <= 30 || newY >= window.innerHeight - 30) newFloatVy = -newFloatVy;
          newX = Math.max(30, Math.min(window.innerWidth - 30, newX));
          newY = Math.max(30, Math.min(window.innerHeight - 30, newY));

          let vx = circle.velocityX || 0;
          let vy = circle.velocityY || 0;
          const speedMag = Math.sqrt(vx * vx + vy * vy);
          const minSpeed = 0.15;
          if (circle.isLaunched && speedMag < minSpeed) {
            vx += newFloatVx * 0.6;
            vy += newFloatVy * 0.6;
          } else {
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

  // Typewriting effect for instruction bar (scene2) - UPDATED TEXT
  const instructionText = "In a doubly linked list, each node has TWO pointers: one to the previous node and one to the next node.";
  const secondText = "Shoot the node to see how connections work in both directions.";
  const collisionText = "A new node is added. Notice how BOTH nodes now point to each other - forward AND backward!";
  const nextText = "Add another node to see the bidirectional chain grow longer.";
  const [typedInstruction, setTypedInstruction] = useState("");
  const [instructionStep, setInstructionStep] = useState(0);

  useEffect(() => {
    // Play tutorial background music when component mounts
    playTutorialBgMusic();

    // Cleanup: stop music when component unmounts or scene changes
    return () => {
      stopTutorialBgMusic();
    };
  }, []);

  useEffect(() => {
    const onPopState = (e) => {
      const st = e.state || { screen: "menu", mode: null };
      // If leaving gameplay via browser navigation, stop the music
      if (st.screen !== "play") {
        stopTutorialBgMusic();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (scene !== 'scene2') {
      setTypedInstruction("");
      setInstructionStep(0);
      return;
    }
    let interval;
    if (instructionStep === 0) {
      let currentIdx = 0;
      const totalDuration = 3000;
      const intervalTime = totalDuration / instructionText.length;
      setTypedInstruction("");
      interval = setInterval(() => {
        currentIdx++;
        setTypedInstruction(instructionText.slice(0, currentIdx));
        playKeyboardSound();
        if (currentIdx >= instructionText.length) {
          clearInterval(interval);
          setTimeout(() => setInstructionStep(1), 2000);
        }
      }, intervalTime);
    } else if (instructionStep === 1) {
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(secondText.slice(0, idx));
        playKeyboardSound();
        if (idx >= secondText.length) {
          clearInterval(interval);
        }
      }, 2000 / secondText.length);
    } else if (instructionStep === 2) {
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(collisionText.slice(0, idx));
        playKeyboardSound();
        if (idx >= collisionText.length) {
          clearInterval(interval);
          setTimeout(() => setInstructionStep(3), 2000);
        }
      }, 2000 / collisionText.length);
    } else if (instructionStep === 3) {
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(nextText.slice(0, idx));
        playKeyboardSound();
        if (idx >= nextText.length) {
          clearInterval(interval);
        }
      }, 2000 / nextText.length);
    }
    return () => clearInterval(interval);
  }, [scene, instructionStep]);
  
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "42", address: "aa10" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);

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
    }, 200);
    return () => clearInterval(interval);
  }, [scene, tutorialConnections]);
  
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Initialize tutorial circles - UPDATED WITH DOUBLY LINKED LIST STRUCTURE
  useEffect(() => {
    if (scene === 'scene2') {
      const randomValue = Math.floor(Math.random() * 100) + 1;
      const addressTypes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj'];
      const numbers = ['10', '20', '30', '40', '50', '60', '70', '80', '90'];
      const randomAddress = addressTypes[Math.floor(Math.random() * addressTypes.length)] + numbers[Math.floor(Math.random() * numbers.length)];

      const headNode = {
        id: 'headNode',
        x: 250,
        y: 200,
        value: randomValue.toString(),
        address: randomAddress,
        prevAddress: NULL_POINTER,  // Doubly linked list: prev pointer
        nextAddress: NULL_POINTER,  // Doubly linked list: next pointer
        velocityX: 0,
        velocityY: 0,
        isLaunched: false
      };

      setTutorialCircles([headNode]);
      setTutorialConnections([]);

      const cannonValue = Math.floor(Math.random() * 100) + 1;
      const cannonAddress = addressTypes[Math.floor(Math.random() * addressTypes.length)] + numbers[Math.floor(Math.random() * numbers.length)];
      setCannonCircle({ value: cannonValue.toString(), address: cannonAddress });
    }
  }, [scene]);

  // Scene2: Bullet collision and connection - UPDATED FOR DOUBLY LINKED LIST
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
          
          if (newX <= 0 || newX >= window.innerWidth - 60) {
            newVelocityX = -newVelocityX;
            newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - 60) {
            newVelocityY = -newVelocityY;
            newY = Math.max(0, Math.min(window.innerHeight - 60, newY));
          }
          const updatedBullet = { ...bullet, x: newX, y: newY, velocityX: newVelocityX, velocityY: newVelocityY };
          
          // First addition (head node collision)
          if (tutorialCirclesRef.current.length === 1) {
            const headNode = tutorialCirclesRef.current[0];
            const dx = updatedBullet.x - headNode.x;
            const dy = updatedBullet.y - headNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70 && !didConnect) {
              didConnect = true;
              
              // Add hit sound and keyboard sound on collision
              playHitSound();
              setTimeout(() => playKeyboardSound(), 200);
              
              const amplify = 0.5;
              const retain = 0.7;
              const approachNorm = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));
              const offset = 60;
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
                prevAddress: headNode.address,
                nextAddress: NULL_POINTER,
                velocityX: updatedBullet.velocityX * retain + nx * 2,
                velocityY: updatedBullet.velocityY * retain + ny * 2,
                isLaunched: true,
                launchTime: Date.now(),
                connected: true
              };
              
              setTutorialCircles(prevCircles => {
                const updatedHead = {
                  ...prevCircles[0],
                  nextAddress: newCircle.address,
                  velocityX: updatedBullet.velocityX * amplify,
                  velocityY: updatedBullet.velocityY * amplify
                };
                let arr = [updatedHead, newCircle];
                
                // Separation pass
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
                
                try {
                  const solved = collisionDetection.updatePhysics(arr);
                  return solved;
                } catch {
                  return arr;
                }
              });
              
              setInstructionStep(2);
              setTutorialConnections([{ id: `conn_${Date.now()}`, from: headNode.id, to: newCircle.id }]);
              onValueShoot?.('collision');
            }
          } 
          // Subsequent additions (tail node collision)
          else if (tutorialCirclesRef.current.length > 1) {
            const tailIdx = tutorialCirclesRef.current.length - 1;
            const tailNode = tutorialCirclesRef.current[tailIdx];
            const dx = updatedBullet.x - tailNode.x;
            const dy = updatedBullet.y - tailNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 70 && !didConnect) {
              didConnect = true;
              
              // Add hit sound and keyboard sound on collision
              playHitSound();
              setTimeout(() => playKeyboardSound(), 200);
              
              const amplify = 0.5;
              const retain = 0.7;
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
                prevAddress: tailNode.address,
                nextAddress: NULL_POINTER,
                velocityX: updatedBullet.velocityX * retain + nx * 2,
                velocityY: updatedBullet.velocityY * retain + ny * 2,
                isLaunched: true,
                launchTime: Date.now(),
                connected: true
              };
              
              setTutorialCircles(prevCircles => {
                const updatedTail = {
                  ...prevCircles[tailIdx],
                  nextAddress: newCircle.address,
                  velocityX: updatedBullet.velocityX * amplify,
                  velocityY: updatedBullet.velocityY * amplify
                };
                let arr = [
                  ...prevCircles.slice(0, tailIdx),
                  updatedTail,
                  newCircle
                ];
                
                // Separation pass
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
                
                try {
                  const solved = collisionDetection.updatePhysics(arr);
                  return solved;
                } catch {
                  return arr;
                }
              });
              
              setTutorialConnections(prevConns => [
                ...prevConns,
                { id: `conn_${Date.now()}`, from: tailNode.id, to: newCircle.id }
              ]);
              setInstructionStep(3);
              onValueShoot?.('collision');
            }
          }
          if (!didConnect) {
            updatedBullets.push(updatedBullet);
          }
        });
        return updatedBullets;
      });
      
      setTutorialCircles(prevCircles => {
        const now = Date.now();
        const filtered = prevCircles.filter(circle => {
          if (circle.isLaunched && (!circle.connected || circle.connected === false) && now - (circle.launchTime || 0) > 3000) {
            return false;
          }
          return true;
        });
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

  const handleTutorialRightClick = useCallback((e) => {
    if (scene !== 'scene2' && scene !== 'scene3') return;

    e.preventDefault();
    
    // Add shoot sound when firing a bullet
    playFirstClickSound();

    const cannonTipX = window.innerWidth - 35;
    const cannonTipY = window.innerHeight - 1;

    const tipDistance = 55;
    const angleRad = (cannonAngle) * (Math.PI / 180);
    const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
    const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;

    const launchSpeed = 12;
    const velocityX = Math.sin(angleRad) * launchSpeed;
    const velocityY = -Math.cos(angleRad) * launchSpeed;

    const addressTypes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj'];
    const numbers = ['10', '20', '30', '40', '50', '60', '70', '80', '90'];
    const randomValue = Math.floor(Math.random() * 100) + 1;
    const randomAddress = addressTypes[Math.floor(Math.random() * addressTypes.length)] + numbers[Math.floor(Math.random() * numbers.length)];

    const newBullet = {
      id: Date.now(),
      x: tipX - 30,
      y: tipY - 30,
      value: randomValue.toString(),
      address: randomAddress,
      prevAddress: NULL_POINTER,
      nextAddress: NULL_POINTER,
      velocityX: velocityX,
      velocityY: velocityY,
      isBullet: true,
      connected: false,
      isLaunched: true,
    };

    setTutorialBullets(prev => [...prev, newBullet]);
  }, [scene, cannonAngle]);
  // Bullet animation for scene3 (if needed)
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
          
          if (newX <= 0 || newX >= window.innerWidth - 60) {
            newVelocityX = -newVelocityX;
            newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
          }
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
              
              // Add hit sound and keyboard sound on collision
              playHitSound();
              setTimeout(() => playKeyboardSound(), 200);
              
              const newCircle = {
                id: `inserted_${Date.now()}`,
                x: circle.x + 100,
                y: circle.y,
                value: bullet.value,
                address: bullet.address,
                prevAddress: circle.address,
                nextAddress: NULL_POINTER,
                velocityX: 0,
                velocityY: 0,
                connected: true,
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
  
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3') return;

    const handleMouseMove = (e) => {
      const cannonBaseX = window.innerWidth - 35;
      const cannonBaseY = window.innerHeight - 1;

      const deltaX = e.clientX - cannonBaseX;
      const deltaY = e.clientY - cannonBaseY;

      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
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

        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Doubly Linked Lists!</h2>
              <p>In doubly linked lists, each node connects to BOTH the previous and next nodes through two pointers, allowing traversal in both directions.</p>
              <p>Let&apos;s build a bidirectional chain and see how nodes link together!</p>
              <button 
                onClick={() => {
                  playFirstClickSound();
                  playKeyboardSound();
                  onContinue();
                }}
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

        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>{typedInstruction}</h3>
        </div>

        <div 
          className={styles.rightSquare} 
          style={{ 
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center"
          }} 
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: '14px' }}>
              {cannonCircle.value}
            </span>
          </div>
        </div>

        {/* Tutorial Circles with DOUBLY LINKED LIST display */}
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
              {/* DOUBLY LINKED LIST: Show prev, value, next */}
              <span className={styles.circlePointer}>{circle.prevAddress}</span>
              <span className={styles.circleValue}>{circle.value}</span>
              <span className={styles.circlePointer}>{circle.nextAddress}</span>
              
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

        {/* Tutorial Bullets */}
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
            <span className={styles.circlePointer}>{bullet.prevAddress}</span>
            <span className={styles.circleValue}>{bullet.value}</span>
            <span className={styles.circlePointer}>{bullet.nextAddress}</span>
          </div>
        ))}

        {/* BIDIRECTIONAL arrow markers */}
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
                  markerStart="url(#arrowheadStart)"
                  markerEnd="url(#arrowheadEnd)"
                />
              </g>
            );
          })}
          <defs>
            {/* Start arrowhead (pointing left/backward) */}
            <marker
              id="arrowheadStart"
              markerWidth="10"
              markerHeight="10"
              refX="-8"
              refY="4"
              orient="auto"
              fill="#fff"
              stroke="#fff"
              strokeWidth="0.5"
            >
              <path d="M8,0 L0,4 L8,8 L4.5,4 Z" fill="#fff" />
            </marker>
            {/* End arrowhead (pointing right/forward) */}
            <marker
              id="arrowheadEnd"
              markerWidth="10"
              markerHeight="10"
              refX="15"
              refY="4"
              orient="auto"
              fill="#fff"
              stroke="#fff"
              strokeWidth="0.5"
            >
              <path d="M0,0 L8,4 L0,8 L3.5,4 Z" fill="#fff" />
            </marker>
          </defs>
        </svg>

        {/* Modal for 5 or more nodes */}
        {tutorialCircles.length >= 5 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Perfect!</h2>
                <p>
                  You've built a doubly linked list! Notice how each node points BOTH forward to the next node AND backward to the previous node.<br /><br />
                  This bidirectional structure allows traversal in both directions. Now let's test your skills!
                </p>
                <button
                  className={tutorialStyles.tutorialButton}
                  onClick={() => {
                    playFirstClickSound();
                    playKeyboardSound();
                    onContinue();
                  }}
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

TutorialScene.propTypes = {
  scene: PropTypes.string.isRequired,
  onContinue: PropTypes.func.isRequired,
  onValueShoot: PropTypes.func,
};

export default TutorialScene;