import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { collisionDetection } from "../../../CollisionDetection";
import styles from "./AbstractDataType.module.css";
import tutorialStyles from "./TutorialScene.module.css";

function TutorialScene({ scene, onContinue, onValueShoot }) {
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "42", address: "aa10" });
  const [currentMode, setCurrentMode] = useState("enqueue");

  const enqueueTexts = [
    "In enqueue mode, every shot attaches a new node to the tail of the list.",
    "Right-click to shoot. Watch the new node link in at the end.",
    "Great shot! The old tail now points to the new node, and the tail label moves.",
    "Keep adding nodes to see the list grow."
  ];
  const dequeueTexts = [
    "Dequeue mode removes the node at the head of the list.",
    "Right-click to fire a dequeue pulse and watch the head disappear.",
    "Nice! The next node becomes the new head, keeping the list consistent."
  ];
  const [typedInstruction, setTypedInstruction] = useState("");
  const [instructionStep, setInstructionStep] = useState(0);

  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  useEffect(() => {
    if (scene === "scene2") {
      setCurrentMode("enqueue");
      onValueShoot?.("enqueue");
      buildInitialEnqueueScene();
    } else if (scene === "scene3") {
      setCurrentMode("dequeue");
      onValueShoot?.("dequeue");
      buildInitialDequeueScene();
    } else {
      setTutorialCircles([]);
      setTutorialConnections([]);
      setTutorialBullets([]);
    }
    setInstructionStep(0);
  }, [scene, onValueShoot]);

  const buildInitialEnqueueScene = () => {
    const randomValue = Math.floor(Math.random() * 100) + 1;
    const addressTypes = ["aa", "bb", "cc", "dd", "ee", "ff", "gg", "hh", "ii", "jj"];
    const numbers = ["10", "20", "30", "40", "50", "60", "70", "80", "90"];
    const randomAddress =
      addressTypes[Math.floor(Math.random() * addressTypes.length)] +
      numbers[Math.floor(Math.random() * numbers.length)];

    const headNode = {
      id: "enqueue_head",
      x: 260,
      y: 220,
      value: randomValue.toString(),
      address: randomAddress,
      velocityX: 0,
      velocityY: 0,
      isLaunched: false
    };

    setTutorialCircles([headNode]);
    setTutorialConnections([]);

    const cannonValue = Math.floor(Math.random() * 100) + 1;
    const cannonAddress =
      addressTypes[Math.floor(Math.random() * addressTypes.length)] +
      numbers[Math.floor(Math.random() * numbers.length)];
    setCannonCircle({ value: cannonValue.toString(), address: cannonAddress });
  };

  const buildInitialDequeueScene = () => {
    const addressTypes = ["aa", "bb", "cc", "dd", "ee", "ff", "gg", "hh", "ii", "jj"];
    const numbers = ["10", "20", "30", "40", "50", "60", "70", "80", "90"];
    const nodeCount = 3;
    const baseX = 240;
    const spacing = 140;

    const nodes = Array.from({ length: nodeCount }).map((_, idx) => ({
      id: `dequeue_${idx}`,
      x: baseX + idx * spacing,
      y: 220,
      value: (Math.floor(Math.random() * 90) + 10).toString(),
      address:
        addressTypes[Math.floor(Math.random() * addressTypes.length)] +
        numbers[Math.floor(Math.random() * numbers.length)],
      velocityX: 0,
      velocityY: 0,
      isLaunched: false
    }));

    const conns = nodes.slice(0, -1).map((node, idx) => ({
      id: `conn_${idx}`,
      from: node.id,
      to: nodes[idx + 1].id
    }));

    setTutorialCircles(nodes);
    setTutorialConnections(conns);
    setCannonCircle({ value: "", address: "" });
  };

  useEffect(() => {
    if (scene !== "scene2" && scene !== "scene3") return;
    const interval = setInterval(() => {
      setTutorialCircles(prevCircles =>
        prevCircles.map(circle => {
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
          const linked = tutorialConnections.some(
            conn => conn.from === circle.id || conn.to === circle.id
          );
          if (circle.isLaunched && !linked && now - (circle.launchTime || 0) > 3000) {
            return false;
          }
          return true;
        });
      });
    }, 200);
    return () => clearInterval(interval);
  }, [scene, tutorialConnections]);

  useEffect(() => {
    if (scene !== "scene2" && scene !== "scene3") return;
    let animationFrameId;
    const animate = () => {
      if (scene === "scene2") {
        runEnqueueAnimation();
      } else if (scene === "scene3") {
        runDequeueAnimation();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [scene, instructionStep]);

  const runEnqueueAnimation = () => {
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

        const updatedBullet = {
          ...bullet,
          x: newX,
          y: newY,
          velocityX: newVelocityX,
          velocityY: newVelocityY
        };

        const circles = tutorialCirclesRef.current;
        if (circles.length >= 1) {
          const tailNode = circles[circles.length - 1];
          const dx = updatedBullet.x - tailNode.x;
          const dy = updatedBullet.y - tailNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 70 && !didConnect) {
            didConnect = true;
            const approachNorm = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));
            const offset = 60;
            const nx = dx / approachNorm;
            const ny = dy / approachNorm;
            const placedX = tailNode.x + nx * offset;
            const placedY = tailNode.y + ny * offset;

            const newCircle = {
              id: `enqueue_inserted_${Date.now()}`,
              x: placedX,
              y: placedY,
              value: bullet.value,
              address: bullet.address,
              velocityX: updatedBullet.velocityX * 0.6 + nx * 2,
              velocityY: updatedBullet.velocityY * 0.6 + ny * 2,
              isLaunched: true,
              launchTime: Date.now(),
              connected: true
            };

            setTutorialCircles(prevCircles => {
              const updatedTail = {
                ...prevCircles[prevCircles.length - 1],
                velocityX: updatedBullet.velocityX * 0.4,
                velocityY: updatedBullet.velocityY * 0.4
              };
              const arr = [...prevCircles.slice(0, -1), updatedTail, newCircle];

              const minDist = 60;
              for (let i = 0; i < arr.length - 1; i++) {
                const a = arr[i];
                const b = arr[i + 1];
                let ddx = b.x - a.x;
                let ddy = b.y - a.y;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.0001;
                if (dist < minDist) {
                  const overlap = (minDist - dist) + 4;
                  const nnx = ddx / dist;
                  const nny = ddy / dist;
                  a.x -= nnx * (overlap / 2);
                  a.y -= nny * (overlap / 2);
                  b.x += nnx * (overlap / 2);
                  b.y += nny * (overlap / 2);
                  a.velocityX = (a.velocityX || 0) - nnx * 1.2;
                  a.velocityY = (a.velocityY || 0) - nny * 1.2;
                  b.velocityX = (b.velocityX || 0) + nnx * 1.2;
                  b.velocityY = (b.velocityY || 0) + nny * 1.2;
                }
              }

              try {
                return collisionDetection.updatePhysics(arr);
              } catch {
                return arr;
              }
            });

            setTutorialConnections(prevConns => [
              ...prevConns,
              {
                id: `enqueue_conn_${Date.now()}`,
                from: tailNode.id,
                to: newCircle.id
              }
            ]);

            if (instructionStep < 2) setInstructionStep(2);
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
        const linked = tutorialConnections.some(
          conn => conn.from === circle.id || conn.to === circle.id
        );
        if (circle.isLaunched && (!linked || linked === false) && now - (circle.launchTime || 0) > 3000) {
          return false;
        }
        return true;
      });

      if (filtered.length > 1) {
        try {
          return collisionDetection.updatePhysics(filtered);
        } catch {
          return filtered;
        }
      }
      return filtered;
    });
  };

  const runDequeueAnimation = () => {
    setTutorialBullets(prevBullets => {
      const updatedBullets = [];
      let headRemoved = false;

      prevBullets.forEach(bullet => {
        let newX = bullet.x + bullet.velocityX;
        let newY = bullet.y + bullet.velocityY;
        let newVelocityX = bullet.velocityX;
        let newVelocityY = bullet.velocityY;

        if (newX <= 0 || newX >= window.innerWidth - 36) {
          newVelocityX = -newVelocityX;
          newX = Math.max(0, Math.min(window.innerWidth - 36, newX));
        }
        if (newY <= 0 || newY >= window.innerHeight - 36) {
          newVelocityY = -newVelocityY;
          newY = Math.max(0, Math.min(window.innerHeight - 36, newY));
        }

        const updatedBullet = {
          ...bullet,
          x: newX,
          y: newY,
          velocityX: newVelocityX,
          velocityY: newVelocityY
        };

        const circles = tutorialCirclesRef.current;
        if (circles.length > 0) {
          const headNode = circles[0];
          const dx = (updatedBullet.x + 18) - headNode.x;
          const dy = (updatedBullet.y + 18) - headNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 65 && !headRemoved) {
            headRemoved = true;
            const nextNode = circles[1];
            setTutorialCircles(prevCircles => prevCircles.slice(1));

            setTutorialConnections(prevConns => {
              const filtered = prevConns.filter(conn => conn.from !== headNode.id && conn.to !== headNode.id);
              if (nextNode && circles.length > 2) {
                const restHead = circles[1];
                const following = circles[2];
                return [
                  {
                    id: `dequeue_conn_${Date.now()}`,
                    from: nextNode.id,
                    to: following.id
                  },
                  ...filtered.filter(conn => conn.from !== nextNode.id)
                ];
              }
              return filtered;
            });

            if (instructionStep < 2) setInstructionStep(2);
          } else {
            updatedBullets.push(updatedBullet);
          }
        } else {
          updatedBullets.push(updatedBullet);
        }
      });

      return updatedBullets;
    });

    setTutorialCircles(prev => {
      if (prev.length > 1) {
        try {
          return collisionDetection.updatePhysics(prev);
        } catch {
          return prev;
        }
      }
      return prev;
    });
  };

  useEffect(() => {
    if (scene !== "scene2" && scene !== "scene3") {
      setTypedInstruction("");
      return;
    }

    const texts = scene === "scene2" ? enqueueTexts : dequeueTexts;
    let interval;
    let idx = 0;

    const runTypewriter = () => {
      setTypedInstruction("");
      idx = 0;
      const text = texts[instructionStep] || texts[texts.length - 1];
      const duration = 2200;
      const delay = Math.max(30, duration / Math.max(text.length, 1));

      interval = setInterval(() => {
        idx += 1;
        setTypedInstruction(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(interval);
        }
      }, delay);
    };

    runTypewriter();
    return () => clearInterval(interval);
  }, [scene, instructionStep]);

  const handleTutorialRightClick = useCallback(
    e => {
      if (scene !== "scene2" && scene !== "scene3") return;
      e.preventDefault();
      onValueShoot?.(currentMode);

      const cannonTipX = window.innerWidth - 35;
      const cannonTipY = window.innerHeight - 1;
      const tipDistance = 55;
      const angleRad = cannonAngle * (Math.PI / 180);
      const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
      const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;

      const launchSpeed = currentMode === "dequeue" ? 10 : 12;
      const velocityX = Math.sin(angleRad) * launchSpeed;
      const velocityY = -Math.cos(angleRad) * launchSpeed;

      if (currentMode === "dequeue") {
        const newPulse = {
          id: Date.now(),
          x: tipX - 18,
          y: tipY - 18,
          velocityX,
          velocityY,
          isDequeueBullet: true
        };
        setTutorialBullets(prev => [...prev, newPulse]);
      } else {
        const addressTypes = ["aa", "bb", "cc", "dd", "ee", "ff", "gg", "hh", "ii", "jj"];
        const numbers = ["10", "20", "30", "40", "50", "60", "70", "80", "90"];
        const randomValue = Math.floor(Math.random() * 100) + 1;
        const randomAddress =
          addressTypes[Math.floor(Math.random() * addressTypes.length)] +
          numbers[Math.floor(Math.random() * numbers.length)];
        const newBullet = {
          id: Date.now(),
          x: tipX - 30,
          y: tipY - 30,
          value: randomValue.toString(),
          address: randomAddress,
          velocityX,
          velocityY,
          isBullet: true,
          connected: false,
          isLaunched: true,
          launchTime: Date.now()
        };
        setTutorialBullets(prev => [...prev, newBullet]);
        if (instructionStep === 0) setInstructionStep(1);
      }
    },
    [scene, cannonAngle, currentMode, instructionStep, onValueShoot]
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

  const renderHeadTailLabel = (idx, length) => {
    if (length === 1) return "Head/Tail";
    if (length > 1) {
      if (idx === 0) return "Head";
      if (idx === length - 1) return "Tail";
    }
    return null;
  };

  if (scene === "scene1") {
    return (
      <div className={styles.app}>
        <video className={styles.videoBackground} autoPlay loop muted playsInline preload="auto">
          <source src="./video/bubble_bg.mp4" type="video/mp4" />
        </video>
        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Abstract Data Type: Queue Mechanics</h2>
              <p>In this mission you will practice enqueueing new nodes at the tail and dequeueing nodes from the head.</p>
              <p>Let&apos;s explore how each operation affects the linked structure before you dive into the challenge.</p>
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
          style={{ outlineOffset: "5px", transform: `rotate(${cannonAngle}deg)`, transformOrigin: "bottom center" }}
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: "10px" }}>{cannonCircle.value}</span>
            <span style={{ fontSize: "8px" }}>{cannonCircle.address}</span>
          </div>
        </div>

        {tutorialCircles.map((circle, idx) => {
          const label = renderHeadTailLabel(idx, tutorialCircles.length);
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
                  className={styles.headTailLabel}
                  style={{
                    position: "absolute",
                    top: "-25px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#ff6b35",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    zIndex: 1000,
                    border: "1px solid #fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
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
              boxShadow: "0 0 15px rgba(255, 255, 0, 0.6)"
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

        {tutorialCircles.length >= 4 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Awesome Enqueueing!</h2>
                <p>You just attached multiple nodes to the tail. The head never moves, but the tail keeps updating to the newest node.</p>
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

        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>{typedInstruction}</h3>
        </div>

        <div
          className={styles.rightSquare}
          style={{ outlineOffset: "5px", transform: `rotate(${cannonAngle}deg)`, transformOrigin: "bottom center" }}
        >
          <div className={styles.cannonCircle} style={{ backgroundColor: "#ff4040", color: "#fff" }}>
            <span style={{ fontSize: "9px" }}>Dequeue</span>
          </div>
        </div>

        {tutorialCircles.map((circle, idx) => {
          const label = renderHeadTailLabel(idx, tutorialCircles.length);
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
                  className={styles.headTailLabel}
                  style={{
                    position: "absolute",
                    top: "-25px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#ff6b35",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    zIndex: 1000,
                    border: "1px solid #fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
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
            style={{
              position: "absolute",
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#ff4040",
              boxShadow: "0 0 12px rgba(255, 80, 80, 0.9)"
            }}
          />
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

        {instructionStep >= 2 && tutorialCircles.length <= 2 && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Dequeue Complete!</h2>
                <p>The head node was removed, and the next node automatically took over as the new head.</p>
                <button className={tutorialStyles.tutorialButton} onClick={onContinue}>
                  Start Mission
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
  onValueShoot: PropTypes.func
};

export default TutorialScene;