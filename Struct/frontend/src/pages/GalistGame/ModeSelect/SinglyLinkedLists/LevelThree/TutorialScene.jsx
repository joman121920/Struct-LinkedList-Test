import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { collisionDetection } from "../../../CollisionDetection";
import styles from "./InsertionNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";

function TutorialScene({ scene, onContinue, onValueShoot }) {
  const [typedInstruction, setTypedInstruction] = useState("");
  const [instructionStep, setInstructionStep] = useState(0);
  const [insertionMode, setInsertionMode] = useState("after");


  const instructionText =
    "Insertion happens where you aim. Hit a node and the new value is placed into the chain.";
  const secondText =
    "Shoot the highlighted node to insert the cannon value after it.";
  const collisionText =
    "Pointers shift to make room. The new node now follows the one you hit.";
  const nextText =
    "Scroll to switch direction. Try inserting another node before the head.";

  useEffect(() => {
    if (scene !== "scene2") {
      setTypedInstruction("");
      setInstructionStep(0);
      return;
    }

    let interval;
    const runTypewriter = (text, nextStep, duration = 2200) => {
      let idx = 0;
      setTypedInstruction("");
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(interval);
          if (typeof nextStep === "number") {
            setTimeout(() => setInstructionStep(nextStep), 1800);
          }
        }
      }, duration / text.length);
    };

    if (instructionStep === 0) runTypewriter(instructionText, 1, 3200);
    else if (instructionStep === 1) runTypewriter(secondText, null, 2000);
    else if (instructionStep === 2) runTypewriter(collisionText, 3, 2200);
    else if (instructionStep === 3) runTypewriter(nextText, null, 2000);

    return () => clearInterval(interval);
  }, [scene, instructionStep]);

  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "18", address: "aa40" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);

  useEffect(() => {
    if (scene !== "scene2") return;
    const handleWheel = ev => {
      if (Math.abs(ev.deltaY) < 1) return;
      setInsertionMode(ev.deltaY < 0 ? "before" : "after");
      setInstructionStep(prev => (prev < 3 ? 3 : prev));
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [scene]);

  const isHeadNode = useCallback(
    (id) => {
      const hasOut = tutorialConnections.some(c => c.from === id);
      const hasIn = tutorialConnections.some(c => c.to === id);
      return hasOut && !hasIn;
    },
    [tutorialConnections]
  );

  const isTailNode = useCallback(
    (id) => {
      const hasOut = tutorialConnections.some(c => c.from === id);
      const hasIn = tutorialConnections.some(c => c.to === id);
      return hasIn && !hasOut;
    },
    [tutorialConnections]
  );

  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  const randAddress = () => {
    const letters = ["aa", "bb", "cc", "dd", "ee", "ff", "gg", "hh", "ii", "jj"];
    const digits = ["10", "20", "30", "40", "50", "60", "70", "80", "90"];
    return letters[Math.floor(Math.random() * letters.length)] + digits[Math.floor(Math.random() * digits.length)];
  };

  useEffect(() => {
    if (scene === "scene2") {
      const headNode = {
        id: "headNode",
        x: 260,
        y: 220,
        value: (Math.floor(Math.random() * 90) + 10).toString(),
        address: randAddress(),
        velocityX: 0,
        velocityY: 0,
        isLaunched: false,
      };
      const tailNode = {
        id: "tailNode",
        x: 410,
        y: 220,
        value: (Math.floor(Math.random() * 90) + 10).toString(),
        address: randAddress(),
        velocityX: 0,
        velocityY: 0,
        isLaunched: false,
      };
      setTutorialCircles([headNode, tailNode]);
      setTutorialConnections([{ id: "conn_init", from: headNode.id, to: tailNode.id }]);
      setCannonCircle({
        value: (Math.floor(Math.random() * 90) + 10).toString(),
        address: randAddress(),
      });
    }
  }, [scene]);

  useEffect(() => {
    if (scene !== "scene2") return;
    const interval = setInterval(() => {
      setTutorialCircles(prev =>
        prev.map(circle => {
          let { floatVelocityX: fx, floatVelocityY: fy } = circle;
          if (fx === undefined || fy === undefined) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.4;
            fx = Math.cos(angle) * speed;
            fy = Math.sin(angle) * speed;
          }
          let newX = circle.x + fx;
          let newY = circle.y + fy;
          let newFx = fx;
          let newFy = fy;
          if (newX <= 30 || newX >= window.innerWidth - 30) newFx = -newFx;
          if (newY <= 30 || newY >= window.innerHeight - 30) newFy = -newFy;
          newX = Math.max(30, Math.min(window.innerWidth - 30, newX));
          newY = Math.max(30, Math.min(window.innerHeight - 30, newY));
          let vx = circle.velocityX || 0;
          let vy = circle.velocityY || 0;
          const speedMag = Math.sqrt(vx * vx + vy * vy);
          if (circle.isLaunched && speedMag < 0.12) {
            vx += newFx * 0.5;
            vy += newFy * 0.5;
          } else {
            vx *= 0.99;
            vy *= 0.99;
          }
          return {
            ...circle,
            x: newX,
            y: newY,
            floatVelocityX: newFx,
            floatVelocityY: newFy,
            velocityX: vx,
            velocityY: vy,
          };
        })
      );
    }, 16);
    return () => clearInterval(interval);
  }, [scene]);

  useEffect(() => {
    if (scene !== "scene2") return;
    const interval = setInterval(() => {
      setTutorialCircles(prev => {
        const now = Date.now();
        return prev.filter(circle => {
          const linked = tutorialConnections.some(conn => conn.from === circle.id || conn.to === circle.id);
          if (circle.isLaunched && !linked && now - (circle.launchTime || 0) > 3000) return false;
          return true;
        });
      });
    }, 200);
    return () => clearInterval(interval);
  }, [scene, tutorialConnections]);

  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  useEffect(() => {
    if (scene === "scene2") {
      setInsertionMode("after");
    }
  }, [scene]);

  useEffect(() => {
    if (scene !== "scene2") return undefined;
    const handleWheel = (ev) => {
      if (Math.abs(ev.deltaY) < 1 || instructionStep < 3) return;
      setInsertionMode(ev.deltaY < 0 ? "before" : "after");
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [scene, instructionStep]);

  useEffect(() => {
    if (scene !== "scene2") return;
    let frameId;
    const animate = () => {
      setTutorialBullets(prevBullets => {
        const updated = [];
        let inserted = false;

        prevBullets.forEach(bullet => {
          let newX = bullet.x + bullet.velocityX;
          let newY = bullet.y + bullet.velocityY;
          let vX = bullet.velocityX;
          let vY = bullet.velocityY;
          if (newX <= 0 || newX >= window.innerWidth - 60) {
            vX = -vX;
            newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - 60) {
            vY = -vY;
            newY = Math.max(0, Math.min(window.innerHeight - 60, newY));
          }
          const updatedBullet = { ...bullet, x: newX, y: newY, velocityX: vX, velocityY: vY };
          
          if (!inserted) {
            const circlesNow = tutorialCirclesRef.current;
            for (let i = 0; i < circlesNow.length; i++) {
              const target = circlesNow[i];
              const dx = updatedBullet.x - target.x;
              const dy = updatedBullet.y - target.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < 72) {
                inserted = true;
                const effectiveMode = bullet.insertionMode ?? insertionMode;
                // Determine effective insertion mode based on tutorial step and current mode
                // let effectiveMode = insertionMode;
                // if (instructionStep < 2) {
                //   effectiveMode = "after"; // Force "after" for initial demonstration
                // }

                // Create new node
                const newCircle = {
                  id: `inserted_${Date.now()}`,
                  x: target.x + (effectiveMode === "after" ? 80 : -80),
                  y: target.y,
                  value: bullet.value,
                  address: bullet.address,
                  velocityX: updatedBullet.velocityX * 0.3,
                  velocityY: updatedBullet.velocityY * 0.3,
                  isLaunched: true,
                  launchTime: Date.now(),
                };

                // Update circles and connections based on insertion mode
                setTutorialCircles(prev => {
                  const targetIndex = prev.findIndex(c => c.id === target.id);
                  if (targetIndex === -1) return prev;

                  let updatedCircles;
                  if (effectiveMode === "after") {
                    updatedCircles = [
                      ...prev.slice(0, targetIndex + 1),
                      newCircle,
                      ...prev.slice(targetIndex + 1),
                    ];
                  } else {
                    updatedCircles = [
                      ...prev.slice(0, targetIndex),
                      newCircle,
                      ...prev.slice(targetIndex),
                    ];
                  }

                  const minDist = 60;
                  for (let j = 0; j < updatedCircles.length - 1; j++) {
                    const a = updatedCircles[j];
                    const b = updatedCircles[j + 1];
                    let ddx = b.x - a.x;
                    let ddy = b.y - a.y;
                    const d = Math.sqrt(ddx * ddx + ddy * ddy) || 0.0001;
                    if (d < minDist) {
                      const overlap = (minDist - d) + 4;
                      const unitX = ddx / d;
                      const unitY = ddy / d;
                      a.x -= unitX * (overlap / 2);
                      a.y -= unitY * (overlap / 2);
                      b.x += unitX * (overlap / 2);
                      b.y += unitY * (overlap / 2);
                      a.velocityX = (a.velocityX || 0) - unitX * 1.1;
                      a.velocityY = (a.velocityY || 0) - unitY * 1.1;
                      b.velocityX = (b.velocityX || 0) + unitX * 1.1;
                      b.velocityY = (b.velocityY || 0) + unitY * 1.1;
                    }
                  }

                  try {
                    return collisionDetection.updatePhysics(updatedCircles);
                  } catch {
                    return updatedCircles;
                  }
                });

                // Update connections using the same logic as InsertionNode.jsx
                setTutorialConnections(prev => {
                  if (effectiveMode === "after") {
                    // Find existing outgoing connection from target
                    const oldNextConn = prev.find(conn => conn.from === target.id);
                    const oldNextId = oldNextConn ? oldNextConn.to : null;

                    // Remove old connection and create new ones
                    let updated = prev.filter(c => !(c.from === target.id && c.to === oldNextId));
                    
                    // Add target -> newNode
                    updated.push({ 
                      id: `conn_${Date.now()}_a`, 
                      from: target.id, 
                      to: newCircle.id 
                    });
                    
                    // Add newNode -> oldNext (if exists)
                    if (oldNextId) {
                      updated.push({ 
                        id: `conn_${Date.now()}_b`, 
                        from: newCircle.id, 
                        to: oldNextId 
                      });
                    }
                    
                    return updated;
                  } else {
                    // Insert before: find incoming connection to target
                    const incomingConn = prev.find(conn => conn.to === target.id);
                    const incomingFrom = incomingConn ? incomingConn.from : null;

                    // Remove old connection and create new ones
                    let updated = prev.filter(c => !(c.from === incomingFrom && c.to === target.id));
                    
                    // Add incoming -> newNode (if incoming exists)
                    if (incomingFrom) {
                      updated.push({ 
                        id: `conn_${Date.now()}_c`, 
                        from: incomingFrom, 
                        to: newCircle.id 
                      });
                    }
                    
                    // Add newNode -> target
                    updated.push({ 
                      id: `conn_${Date.now()}_d`, 
                      from: newCircle.id, 
                      to: target.id 
                    });
                    
                    return updated;
                  }
                });

                if (instructionStep < 2) setInstructionStep(2);
                onValueShoot?.("collision");
                break;
              }
            }
          }
          if (!inserted) updated.push(updatedBullet);
        });
        return updated;
      });

      setTutorialCircles(prev => {
        const now = Date.now();
        const filtered = prev.filter(circle => {
          const linked = tutorialConnections.some(conn => conn.from === circle.id || conn.to === circle.id);
          if (circle.isLaunched && !linked && now - (circle.launchTime || 0) > 3000) return false;
          return true;
        });
        if (filtered.length > 1) {
          return collisionDetection.updatePhysics(filtered);
        }
        return filtered;
      });

      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [scene, instructionStep, insertionMode, onValueShoot, tutorialConnections]);

  const handleTutorialRightClick = useCallback(
    e => {
      if (scene !== "scene2" && scene !== "scene3") return;
      e.preventDefault();

      const cannonTipX = window.innerWidth - 35;
      const cannonTipY = window.innerHeight - 1;
      const tipDistance = 55;
      const angleRad = (cannonAngle * Math.PI) / 180;
      const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
      const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;
      const speed = 11;
      const velocityX = Math.sin(angleRad) * speed;
      const velocityY = -Math.cos(angleRad) * speed;

     const newBullet = {
        id: Date.now(),
        x: tipX - 30,
        y: tipY - 30,
        value: (Math.floor(Math.random() * 90) + 10).toString(),
        address: randAddress(),
        velocityX,
        velocityY,
        isLaunched: true,
        insertionMode,
      };
      setTutorialBullets(prev => [...prev, newBullet]);
    },
    [scene, cannonAngle, insertionMode]
  );
  
  useEffect(() => {
    if (scene !== "scene2" && scene !== "scene3") return;
    const handleMouseMove = e => {
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

  if (scene === "scene1") {
    return (
      <div className={styles.app}>
        <video className={styles.videoBackground} autoPlay loop muted playsInline preload="auto">
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
        </video>

        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Node Insertion!</h2>
              <p>
                Insertion lets you drop new nodes before or after any target. The list rewires itself so the chain stays intact.
              </p>
              <p>Let&apos;s practice hitting nodes and watching the pointers adjust.</p>
              <button onClick={onContinue} className={tutorialStyles.tutorialButton}>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === "scene2") {
    return (
      <div className={styles.app}>
        <video className={styles.videoBackground} autoPlay loop muted playsInline preload="auto">
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
        </video>

        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>{typedInstruction}</h3>
        </div>
        
        <div
          className={styles.rightSquare}
          style={{
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: "10px" }}>{cannonCircle.value}</span>
            <span style={{ fontSize: "8px" }}>{cannonCircle.address}</span>
          </div>
        </div>

        {tutorialCircles.map(circle => {
          const head = isHeadNode(circle.id);
          const tail = isTailNode(circle.id);
          let label = null;
            if (head && tail) label = "head/tail";
            else if (head) label = "head";
            else if (tail) label = "tail";
          return (
            <div
              key={circle.id}
              className={styles.animatedCircle}
              style={{ left: `${circle.x - 30}px`, top: `${circle.y - 30}px`, cursor: "default" }}
            >
              <span className={styles.circleValue}>{circle.value}</span>
              <span className={styles.circleAddress}>{circle.address}</span>
              {label && (
                <div
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

        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              cursor: "default",
              opacity: 0.9,
              boxShadow: "0 0 15px rgba(255, 255, 0, 0.6)",
            }}
          >
            <span className={styles.circleValue}>{bullet.value}</span>
            <span className={styles.circleAddress}>{bullet.address}</span>
          </div>
        ))}

        <svg className={styles.connectionLines}>
          {tutorialConnections.map(connection => {
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
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="16" refY="4" orient="auto" fill="#fff" stroke="#fff" strokeWidth="0.5">
              <path d="M0,0 L0,8 L8,4 z" fill="#fff" />
            </marker>
          </defs>
        </svg>

        {tutorialCircles.length >= 5 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Insertion Mastered</h2>
                <p>
                  Great shots! You inserted nodes in different positions and kept the list ordered.
                  Time to apply this skill in the mission.
                </p>
                <button className={tutorialStyles.tutorialButton} onClick={onContinue}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (scene === "scene3") {
    return (
      <div className={styles.app}>
        <video className={styles.videoBackground} autoPlay loop muted playsInline preload="auto">
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
        </video>

        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Node Insertion - Game Instructions</h2>

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

              <button onClick={onContinue} className={tutorialStyles.tutorialButton}>
                Continue
              </button>
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