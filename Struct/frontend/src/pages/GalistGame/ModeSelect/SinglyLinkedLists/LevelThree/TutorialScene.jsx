import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { collisionDetection } from "../../../CollisionDetection";
import styles from "./InsertionNode.module.css";
import tutorialStyles from "./TutorialScene.module.css";
import { playTutorialBgMusic, stopTutorialBgMusic, playHitSound, playErrorSound, playKeyboardSound, playFirstClickSound } from "../../../Sounds.jsx";

function TutorialScene({ scene, onContinue, onValueShoot }) {
  const [typedInstruction, setTypedInstruction] = useState("");
  const [instructionStep, setInstructionStep] = useState(0);
  const [insertionMode, setInsertionMode] = useState("after");


  const instructionText =
    "Insertion happens where you aim. Hit a node and the new value is placed into the chain.";
  const secondText =
    "Try adding a new head to the linked list. Scroll to switch direction.";
  const firstCollisionText =
    "Great! You inserted a new head node.";
  const secondCollisionText =
    "Nice! You inserted a new tail.";
  const specificationText =
    "Now try inserting at index 2.";
  const tailInstructionText =
    "Now try inserting a new tail. Scroll to switch direction.";


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
      isTypingRef.current = true;
      interval = setInterval(() => {
        idx++;
        setTypedInstruction(text.slice(0, idx));
        // Play keyboard sound for each character typed
        playKeyboardSound();
        if (idx >= text.length) {
          clearInterval(interval);
          isTypingRef.current = false;
          if (typeof nextStep === "number") {
            setTimeout(() => setInstructionStep(nextStep), 1800);
          }
        }
      }, duration / text.length);
    };

  if (instructionStep === 0) runTypewriter(instructionText, 1, 3200);
  else if (instructionStep === 1) runTypewriter(secondText, null, 2000);
    else if (instructionStep === 2) {
      // Immediately display the collision confirmation, then after 1s
      // transition to the tail-phase so the second bullet logic becomes
      // active and the tail instruction types out.
      setTypedInstruction(firstCollisionText);
      const proceedTimer = setTimeout(() => {
        setInsertionMode("after");
        setInstructionStep(4);
      }, 1000);
      // ensure the timeout is cleared if the component unmounts or step
      // changes before the timer fires.
      interval = proceedTimer;
    }
    else if (instructionStep === 4) runTypewriter(tailInstructionText, null, 2200);
    else if (instructionStep === 5) {
      // After successful tail insertion we show the second collision text
      // instantly for a short moment then show the specification for index 2.
      setTypedInstruction(secondCollisionText);
      setTimeout(() => setInstructionStep(6), 1000);
    }
    else if (instructionStep === 6) runTypewriter(specificationText, null, 2200);

    return () => clearInterval(interval);
  }, [scene, instructionStep]);

  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [tutorialConnections, setTutorialConnections] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [cannonCircle, setCannonCircle] = useState({ value: "18", address: "aa40" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const [showInsertionMastered, setShowInsertionMastered] = useState(false);
  const tutorialCirclesRef = useRef([]);
  const isTypingRef = useRef(false);
  const [firstShotDone, setFirstShotDone] = useState(false);

  useEffect(() => {
    if (scene !== "scene2") return;
    const handleWheel = ev => {
      if (Math.abs(ev.deltaY) < 1) return;
      // Always allow the user to change insertion mode while the
      // typewriter animation runs - don't return early when typing.
      setInsertionMode(ev.deltaY < 0 ? "before" : "after");
      // Only advance the instruction step when we're not typing so the
      // typewriter doesn't get interrupted by a scroll.
      if (!isTypingRef.current) {
        setInstructionStep(prev => (prev < 3 ? 3 : prev));
      }
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

  // Cleanup tutorial background music when component unmounts or browser navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopTutorialBgMusic();
    };

    const handlePopState = () => {
      stopTutorialBgMusic();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      stopTutorialBgMusic();
    };
  }, []);

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
      // Allow changing insertion mode even while typing. We don't want
      // wheel to interrupt text, only to change the selected mode.
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
              
              if (dist < 46) {
                inserted = true;
                // Determine effective insertion mode. Use the current user-selected
                // insertionMode so scrolling immediately before shooting is honored.
                const effectiveMode = insertionMode;
                const isTargetHead = tutorialConnections.some(c => c.from === target.id) && !tutorialConnections.some(c => c.to === target.id);

                // For the first shot, require that the user hit the head AND that
                // their insertion mode is set to 'before'. We DO NOT force the mode.
                let modeToUse = effectiveMode;
                if (!firstShotDone) {
                  if (!isTargetHead) {
                    // First shot must target the head — but show a hit/nudge first.
                    // Create a temporary node to visually nudge the chain, then remove it.
                    const tempId = `temp_${Date.now()}`;
                    const tempCircle = {
                      id: tempId,
                      x: target.x + (effectiveMode === "after" ? 46 : -46),
                      y: target.y,
                      value: bullet.value,
                      address: bullet.address,
                      velocityX: updatedBullet.velocityX * 0.3,
                      velocityY: updatedBullet.velocityY * 0.3,
                      isLaunched: true,
                      launchTime: Date.now(),
                    };

                    // Insert a temporary visual node (no connections) to show the hit/nudge
                    setTutorialCircles(prev => {
                      const targetIndex = prev.findIndex(c => c.id === target.id);
                      if (targetIndex === -1) return prev;
                      const updatedCircles = [
                        ...prev.slice(0, targetIndex + (effectiveMode === "after" ? 1 : 0)),
                        tempCircle,
                        ...prev.slice(targetIndex + (effectiveMode === "after" ? 1 : 0)),
                      ];
                      try { return collisionDetection.updatePhysics(updatedCircles); } catch { return updatedCircles; }
                    });

                    // Nudge velocities for visible effect
                    setTutorialCircles(prev => prev.map(c => c.id === target.id ? { ...c, velocityX: (c.velocityX || 0) + (updatedBullet.velocityX || 0) * 0.6, velocityY: (c.velocityY || 0) + (updatedBullet.velocityY || 0) * 0.6 } : c));

                    // Remove the temporary node quickly so it doesn't persist and without creating any connections
                    setTimeout(() => {
                      setTutorialCircles(prev => prev.filter(c => c.id !== tempId));
                    }, 120);

                    playErrorSound(); // Play error sound for invalid head target
                    onValueShoot?.("invalid_head");
                    break;
                  }
                  if (effectiveMode !== "before") {
                    // User attempted to insert AFTER on the head for the first shot; same nudge behavior
                    const tempId = `temp_${Date.now()}`;
                    const tempCircle = {
                      id: tempId,
                      x: target.x + (effectiveMode === "after" ? 46 : -46),
                      y: target.y,
                      value: bullet.value,
                      address: bullet.address,
                      velocityX: updatedBullet.velocityX * 0.3,
                      velocityY: updatedBullet.velocityY * 0.3,
                      isLaunched: true,
                      launchTime: Date.now(),
                    };

                    // Insert a temporary visual node (no connections) to show the hit/nudge
                    setTutorialCircles(prev => {
                      const targetIndex = prev.findIndex(c => c.id === target.id);
                      if (targetIndex === -1) return prev;
                      const updatedCircles = [
                        ...prev.slice(0, targetIndex + (effectiveMode === "after" ? 1 : 0)),
                        tempCircle,
                        ...prev.slice(targetIndex + (effectiveMode === "after" ? 1 : 0)),
                      ];
                      try { return collisionDetection.updatePhysics(updatedCircles); } catch { return updatedCircles; }
                    });

                    // Nudge velocities for visible effect
                    setTutorialCircles(prev => prev.map(c => c.id === target.id ? { ...c, velocityX: (c.velocityX || 0) + (updatedBullet.velocityX || 0) * 0.6, velocityY: (c.velocityY || 0) + (updatedBullet.velocityY || 0) * 0.6 } : c));

                    // Remove the temporary node quickly so it doesn't persist and without creating any connections
                    setTimeout(() => {
                      setTutorialCircles(prev => prev.filter(c => c.id !== tempId));
                    }, 120);

                    playErrorSound(); // Play error sound for wrong insertion mode
                    onValueShoot?.("must_use_before_for_head");
                    break;
                  }
                }
                // Determine effective insertion mode based on tutorial step and current mode
                // let effectiveMode = insertionMode;
                // if (instructionStep < 2) {
                //   effectiveMode = "after"; // Force "after" for initial demonstration
                // }

                // If we're in the tail-phase of the tutorial (instructionStep 4)
                // and the first-shot has already been completed, enforce that
                // only hitting the tail with insertionMode 'after' will insert.
                // Otherwise, show a quick nudge effect and discard the bullet.
                const isTargetTail = tutorialConnections.some(c => c.to === target.id) && !tutorialConnections.some(c => c.from === target.id);
                if (instructionStep === 4 && firstShotDone) {
                  if (!(isTargetTail && effectiveMode === "after")) {
                    const tempId = `temp_${Date.now()}`;
                    const tempCircle = {
                      id: tempId,
                      x: target.x + (effectiveMode === "after" ? 46 : -46),
                      y: target.y,
                      value: bullet.value,
                      address: bullet.address,
                      velocityX: updatedBullet.velocityX * 0.3,
                      velocityY: updatedBullet.velocityY * 0.3,
                      isLaunched: true,
                      launchTime: Date.now(),
                    };

                    setTutorialCircles(prev => {
                      const targetIndex = prev.findIndex(c => c.id === target.id);
                      if (targetIndex === -1) return prev;
                      const updatedCircles = [
                        ...prev.slice(0, targetIndex + (effectiveMode === "after" ? 1 : 0)),
                        tempCircle,
                        ...prev.slice(targetIndex + (effectiveMode === "after" ? 1 : 0)),
                      ];
                      try { return collisionDetection.updatePhysics(updatedCircles); } catch { return updatedCircles; }
                    });

                    setTutorialCircles(prev => prev.map(c => c.id === target.id ? { ...c, velocityX: (c.velocityX || 0) + (updatedBullet.velocityX || 0) * 0.6, velocityY: (c.velocityY || 0) + (updatedBullet.velocityY || 0) * 0.6 } : c));

                    setTimeout(() => {
                      setTutorialCircles(prev => prev.filter(c => c.id !== tempId));
                    }, 120);

                    playErrorSound(); // Play error sound for invalid tail phase
                    onValueShoot?.("invalid_tail_phase");
                    break;
                  }
                }

                // If we're in the specification phase (instructionStep 6) where
                // the user must insert at index 2, enforce index-2-only insertion.
                if (instructionStep === 6) {
                  // Build ordered list from head using connections
                  const ordered = [];
                  const head = tutorialCirclesRef.current.find(c => tutorialConnections.some(conn => conn.from === c.id) && !tutorialConnections.some(conn => conn.to === c.id));
                  if (head) {
                    ordered.push(head);
                    let currId = head.id;
                    while (true) {
                      const nextConn = tutorialConnections.find(conn => conn.from === currId);
                      if (!nextConn) break;
                      const nextCircle = tutorialCirclesRef.current.find(c => c.id === nextConn.to);
                      if (!nextCircle) break;
                      ordered.push(nextCircle);
                      currId = nextCircle.id;
                    }
                  }
                  const indexTwo = ordered[2];
                  if (!indexTwo || indexTwo.id !== target.id) {
                    // invalid for index-2 phase: nudge and discard
                    const tempId = `temp_${Date.now()}`;
                    const tempCircle = {
                      id: tempId,
                      x: target.x + (effectiveMode === "after" ? 46 : -46),
                      y: target.y,
                      value: bullet.value,
                      address: bullet.address,
                      velocityX: updatedBullet.velocityX * 0.3,
                      velocityY: updatedBullet.velocityY * 0.3,
                      isLaunched: true,
                      launchTime: Date.now(),
                    };

                    setTutorialCircles(prev => {
                      const targetIndex = prev.findIndex(c => c.id === target.id);
                      if (targetIndex === -1) return prev;
                      const updatedCircles = [
                        ...prev.slice(0, targetIndex + (effectiveMode === "after" ? 1 : 0)),
                        tempCircle,
                        ...prev.slice(targetIndex + (effectiveMode === "after" ? 1 : 0)),
                      ];
                      try { return collisionDetection.updatePhysics(updatedCircles); } catch { return updatedCircles; }
                    });

                    setTutorialCircles(prev => prev.map(c => c.id === target.id ? { ...c, velocityX: (c.velocityX || 0) + (updatedBullet.velocityX || 0) * 0.6, velocityY: (c.velocityY || 0) + (updatedBullet.velocityY || 0) * 0.6 } : c));

                    setTimeout(() => {
                      setTutorialCircles(prev => prev.filter(c => c.id !== tempId));
                    }, 120);

                    playErrorSound(); // Play error sound for invalid index 2 phase
                    onValueShoot?.("invalid_index2_phase");
                    break;
                  }
                }

                // Create new node
                const newCircle = {
                  id: `inserted_${Date.now()}`,
                  // position the inserted node close enough so it appears like a collision
                  x: target.x,
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
                  if (modeToUse === "after") {
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

                // If this was the first successful shot and it inserted, mark it done
                if (!firstShotDone) setFirstShotDone(true);

                // Handle instruction step progression based on which phase we're in
                
                // If this insertion occurred in the tail-phase and the target
                // was the tail (inserting 'after' the tail), advance to the
                // second-collision step so the tail-confirmation text shows,
                // then the specification text will follow via the existing
                // instruction effect.
                const isTargetTailNow = tutorialConnections.some(c => c.to === target.id) && !tutorialConnections.some(c => c.from === target.id);
                if (instructionStep === 4 && isTargetTailNow && effectiveMode === "after") {
                  setInstructionStep(5);
                } else if (instructionStep === 6) {
                  // If this insertion happened during the index-2 specification
                  // phase (instructionStep 6) and the target matched the index-2
                  // node, show the 'Insertion Mastered' overlay so the player
                  // can proceed to the mission.
                  // Build ordered list from head to find index 2
                  const ordered = [];
                  const head = tutorialCirclesRef.current.find(c => tutorialConnections.some(conn => conn.from === c.id) && !tutorialConnections.some(conn => conn.to === c.id));
                  if (head) {
                    ordered.push(head);
                    let currId = head.id;
                    while (true) {
                      const nextConn = tutorialConnections.find(conn => conn.from === currId);
                      if (!nextConn) break;
                      const nextCircle = tutorialCirclesRef.current.find(c => c.id === nextConn.to);
                      if (!nextCircle) break;
                      ordered.push(nextCircle);
                      currId = nextCircle.id;
                    }
                  }
                  const indexTwo = ordered[2];
                  if (indexTwo && indexTwo.id === target.id) {
                    setShowInsertionMastered(true);
                    // Remove any on-screen instruction text while the overlay is visible
                    setTypedInstruction("");
                  }
                } else {
                  // Default case: show first-collision feedback (step 2)
                  setInstructionStep(2);
                }
                playHitSound(); // Play hit sound for successful node linking
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
  }, [scene, instructionStep, insertionMode, onValueShoot, tutorialConnections, firstShotDone]);

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
        <video className={styles.videoBackground2} autoPlay loop muted playsInline preload="auto">
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
        </video>

        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Node Insertion!</h2>
              <p>
                In a linked list, you can insert a new node between existing nodes by updating the addresses. This allows the list to grow not only at the end, but also in specific positions.
              </p>
              <p>Let’s insert a node and see how the chain adjusts!</p>
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
      </div>
    );
  }

  if (scene === "scene2") {
    return (
      <div className={styles.app}>
        <video className={styles.videoBackground2} autoPlay loop muted playsInline preload="auto">
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
        </video>

        {!showInsertionMastered && (
          <div className={tutorialStyles.tutorialInstructionBar}>
            <h3>{typedInstruction}</h3>
          </div>
        )}
        
        <div
          className={styles.tutorialCannon}
          style={{
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div className={styles.cannonCircle}>
            <div style={{ position: 'absolute', top: -34, color: '#004cff', zIndex: 1000, fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {insertionMode === 'before' ? 'Before' : 'After'}
            </div>
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

        {(showInsertionMastered) && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Insertion Mastered</h2>
                <p>
                  Well done! You’ve successfully practiced inserting nodes at the head, tail, and specific positions within a linked list. This shows how linked lists allow flexible data organization by adjusting pointers instead of shifting elements like in arrays.
                </p>
                <p>
                  Get ready to use this knowledge in the upcoming mission!
                </p>
                <button
                  className={tutorialStyles.tutorialButton}
                  onClick={() => {
                    setShowInsertionMastered(false);
                    onContinue();
                    playFirstClickSound();
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

  if (scene === "scene3") {
    return (
      <div className={styles.app}>
        <video className={styles.videoBackground2} autoPlay loop muted playsInline preload="auto">
          <source src="./video/insertion_bg.mp4" type="video/mp4" />
          </video>

        <div className={tutorialStyles.instructionOverlay}>
          <div className={tutorialStyles.instructionPopup}>
            <div className={tutorialStyles.instructionContent}>
              <h2>Game Instructions</h2>

              <div className={tutorialStyles.gameInstructionsBody}>
                <ul>
                  <li><strong>Objective:</strong> Insert nodes into the existing linked list to match the expected structure</li>
                  <li><strong>Controls:</strong> Click the cannon to select bullets, right-click to shoot</li>
                  <li><strong>Insertion Modes:</strong> Scroll wheel to switch between &quot;Before&quot; and &quot;After&quot; insertion</li>
                  <li><strong>Strategy:</strong> Hit head/tail nodes to extend the list, hit middle nodes to insert between</li>
                  <li><strong>Deletion:</strong> Click any node 5 times to remove it (bridges connections automatically)</li>
                  <li><strong>Challenges:</strong> Avoid black holes and manage the 2-minute timer!</li>
                  <li><strong>Portal:</strong> Complete chains get sucked into the portal for validation</li>
                </ul>
              </div>

              <button onClick={() => { onContinue(); playFirstClickSound(); }} className={tutorialStyles.instructionButton}>
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