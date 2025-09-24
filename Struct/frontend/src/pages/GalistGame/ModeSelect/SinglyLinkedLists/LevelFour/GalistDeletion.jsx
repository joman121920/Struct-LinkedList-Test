import { useState, useEffect, useRef, useCallback } from "react";

import styles from "./GalistDeletion.module.css";
import { ExerciseManager } from "./GalistDeletionExercise.js";
import TutorialScene from "./TutorialScene.jsx";

// Main Game Component (your existing game)
function MainGameComponent() {
  const entryOrderRef = useRef([]);
  const suckedCirclesRef = useRef([]); // Will store the actual circle objects in order
  // Track which exercise is active
  const [exerciseKey, setExerciseKey] = useState("level_1");
  const [circles, setCircles] = useState([]);
  const [draggedCircle, setDraggedCircle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connections, setConnections] = useState([]);
  const mouseHistoryRef = useRef([]);
  const [suckingCircles, setSuckingCircles] = useState([]);
  const pendingValidationRef = useRef(null);
  const correctHitRef = useRef(false);

  // Exercise system states
  const exerciseManagerRef = useRef(new ExerciseManager());
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  // Multi-stage progress tracking
  const [stageProgress, setStageProgress] = useState(null);

  // Cannon angle state for dynamic cannon rotation
  const [cannonAngle, setCannonAngle] = useState(0);

  // Floating circles state and ref for performance optimization
  const [floatingCircles, setFloatingCircles] = useState([]);
  const floatingCirclesRef = useRef([]);

  // --- NEW: Challenge Mode Features ---
  // Track which nodes each bullet has hit to create connections
  // eslint-disable-next-line no-unused-vars
  const [_bulletHitSequences, setBulletHitSequences] = useState(new Map());
  // Track activated (color-changed) nodes
  const [activatedNodes, setActivatedNodes] = useState(new Set());
  // Track player-created connections
  const [playerConnections, setPlayerConnections] = useState([]);

  // Update ref whenever floating circles change
  useEffect(() => {
    floatingCirclesRef.current = floatingCircles;
  }, [floatingCircles]);

  // no expectedOutput for deletion; target is inside currentExercise

  // Generate floating circles on mount and when level changes
  useEffect(() => {
    const generateFloatingCircles = () => {
      if (!currentExercise) return;

      const circleData =
        exerciseManagerRef.current.generateFloatingCircles(exerciseKey);

      // Map nodes to animated floating circles
      const circles = circleData.map((node) => {
        return {
          id: node.id,
          type: "node",
          value: node.value,
          address: node.address,
          isInList: node.isInList,
          x: Math.random() * (window.innerWidth - 200) + 100,
          y: Math.random() * (window.innerHeight - 300) + 150,
          // Keep nodes static: no velocities
          vx: 0,
          vy: 0,
        };
      });

      setFloatingCircles(circles);
    };

    generateFloatingCircles();
  }, [currentExercise, exerciseKey]);

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
        setShowValidationResult(false);

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

  // --- NEW: Function to validate challenge mode completion ---
  const validateChallengeCompletion = useCallback(
    (playerLinkedList, updatedFloatingCircles = null) => {
      if (!currentExercise) return;

      // Check if the player's linked list matches the expected structure after deletion
      const { expectedStructure, targetNode } = currentExercise;

      console.log("🔍 Validating challenge completion...");
      console.log("Player linked list:", playerLinkedList);
      console.log("Expected structure:", expectedStructure);
      console.log("Target to delete:", targetNode);

      // Debug: Show detailed comparison
      console.log("🔍 Detailed comparison:");
      playerLinkedList.forEach((playerNode, index) => {
        const expectedNode = expectedStructure[index];
        if (expectedNode) {
          console.log(`Index ${index}:`);
          console.log(`  Player: ${playerNode.value}(${playerNode.address})`);
          console.log(
            `  Expected: ${expectedNode.value}(${expectedNode.address})`
          );
          console.log(
            `  Value match: ${playerNode.value === expectedNode.value}`
          );
          console.log(
            `  Address match: ${playerNode.address === expectedNode.address}`
          );
        }
      });

      // Use the provided floating circles or current state
      const currentFloatingCircles = updatedFloatingCircles || floatingCircles;

      // Check if the target node has been successfully excluded (deleted)
      // The target node should not be in the player's linked list
      const targetNodeInLinkedList = playerLinkedList.some(
        (node) =>
          node.value === targetNode.value && node.address === targetNode.address
      );

      // For challenge mode: if there are player connections, check if target node is connected
      // If no connections exist, fall back to checking floating circles
      let targetNodeDeleted = false;

      if (playerConnections.length > 0) {
        // Check if target node is part of any player connection
        const targetNodeId = currentFloatingCircles.find(
          (c) =>
            c.value === targetNode.value && c.address === targetNode.address
        )?.id;

        const targetNodeConnected =
          targetNodeId &&
          playerConnections.some(
            (conn) => conn.from === targetNodeId || conn.to === targetNodeId
          );

        // Target is "deleted" if it's not in the linked list AND not connected
        targetNodeDeleted = !targetNodeInLinkedList && !targetNodeConnected;
      } else {
        // Fallback: check floating circles (original logic)
        const targetNodeInFloatingCircles = currentFloatingCircles.some(
          (circle) =>
            circle.value === targetNode.value &&
            circle.address === targetNode.address &&
            circle.isInList // Only check list nodes, not distractors
        );
        targetNodeDeleted =
          !targetNodeInLinkedList && !targetNodeInFloatingCircles;
      }

      console.log("🎯 Target node in linked list:", targetNodeInLinkedList);
      console.log("🎯 Target node deleted:", targetNodeDeleted);

      if (playerConnections.length > 0) {
        const targetNodeId = currentFloatingCircles.find(
          (c) =>
            c.value === targetNode.value && c.address === targetNode.address
        )?.id;

        const targetNodeConnected =
          targetNodeId &&
          playerConnections.some(
            (conn) => conn.from === targetNodeId || conn.to === targetNodeId
          );
        console.log("🎯 Target node connected:", targetNodeConnected);
      }

      // Compare player's linked list with expected structure
      let isCorrect = false;

      if (
        targetNodeDeleted &&
        playerLinkedList.length === expectedStructure.length
      ) {
        isCorrect = playerLinkedList.every((playerNode, index) => {
          const expectedNode = expectedStructure[index];
          return (
            playerNode.value === expectedNode.value &&
            playerNode.address === expectedNode.address
          );
        });
      } else {
        console.log(
          "🔍 Length mismatch or target not deleted:",
          "Expected length:",
          expectedStructure.length,
          "Player length:",
          playerLinkedList.length,
          "Target deleted:",
          targetNodeDeleted
        );
      }

      console.log("🔍 Structure match:", isCorrect);
      console.log("🔍 Expected length:", expectedStructure.length);
      console.log("🔍 Player length:", playerLinkedList.length);
      console.log(
        "🔍 Current floating circles count:",
        currentFloatingCircles.length
      );
      console.log(
        "🔍 Floating circles that are list nodes:",
        currentFloatingCircles
          .filter((c) => c.isInList)
          .map((c) => `${c.value}(${c.address})`)
      );

      if (isCorrect) {
        // Check if this completes the current stage and advance if needed
        const nextExercise = exerciseManagerRef.current.validateAndAdvanceStage(
          playerLinkedList,
          targetNode
        );

        if (nextExercise) {
          // Advanced to next stage
          console.log("🎉 Stage completed! Advancing to next stage...");
          setCurrentExercise(nextExercise);
          setStageProgress(exerciseManagerRef.current.getStageProgress());

          // Clear current connections and activated nodes for new stage
          setPlayerConnections([]);
          setActivatedNodes(new Set());

          if (nextExercise.isLastStage) {
            // This was the final stage
            pendingValidationRef.current = {
              isCorrect: true,
              message: "Perfect! All stages completed! Level finished!",
              score: 100,
              expectedStructure,
              userCircles: playerLinkedList,
            };
          } else {
            // More stages to go
            pendingValidationRef.current = {
              isCorrect: true,
              message: `Stage ${nextExercise.currentStage}/${nextExercise.totalStages} completed! New target: Delete ${nextExercise.targetNode?.value}`,
              score: 100,
              expectedStructure: nextExercise.expectedStructure,
              userCircles: playerLinkedList,
            };
          }
        } else {
          // Stage validation failed or no more stages
          pendingValidationRef.current = {
            isCorrect: true,
            message: "Perfect! Challenge completed successfully!",
            score: 100,
            expectedStructure,
            userCircles: playerLinkedList,
          };
        }

        // Auto-show validation result
        if (!showValidationResult) {
          setShowValidationResult(true);
        }

        console.log("🎉 Challenge completed successfully!");
      } else {
        console.log("❌ Challenge not yet completed");
        // Don't show validation result for incomplete challenges
        // Let player continue working
      }
    },
    [currentExercise, showValidationResult, floatingCircles, playerConnections]
  );

  const createPlayerConnection = useCallback(
    (fromNodeId, toNodeId) => {
      const fromNode = floatingCircles.find(
        (circle) => circle.id === fromNodeId
      );
      const toNode = floatingCircles.find((circle) => circle.id === toNodeId);

      if (!fromNode || !toNode) {
        console.warn(
          "Could not find nodes for connection:",
          fromNodeId,
          toNodeId
        );
        return;
      }

      const newConnection = {
        id: `player-${fromNodeId}-to-${toNodeId}-${Date.now()}`,
        from: fromNodeId,
        to: toNodeId,
        fromNode: fromNode,
        toNode: toNode,
        isPlayerCreated: true,
      };

      setPlayerConnections((prevConnections) => {
        const exists = prevConnections.some(
          (conn) => conn.from === fromNodeId && conn.to === toNodeId
        );

        if (!exists) {
          console.log(
            `🔗 Player connection created: ${fromNode.value}(${fromNode.address}) → ${toNode.value}(${toNode.address})`
          );
          // Simply add the connection without triggering any game state changes
          return [...prevConnections, newConnection];
        }

        return prevConnections;
      });
    },
    [floatingCircles]
  );

  // No head/tail logic needed for node creation level

  const loadExercise = useCallback((key = "level_1") => {
    // Always clear circles/connections and reset launch state before loading new exercise
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    // Clear persistent refs to avoid stale data between runs
    if (entryOrderRef) entryOrderRef.current = [];
    if (suckedCirclesRef) suckedCirclesRef.current = [];
    setShowValidationResult(false);

    // Reset challenge mode states
    setPlayerConnections([]);
    setActivatedNodes(new Set());
    setBulletHitSequences(new Map());

    pendingValidationRef.current = null;
    correctHitRef.current = false;
    // Reset validation-related UI

    // Now load the new exercise
    const exercise = exerciseManagerRef.current.loadExercise(key);
    setCurrentExercise(exercise);
    setStageProgress(exerciseManagerRef.current.getStageProgress());
    setExerciseKey(key);
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

  // No completion popup handlers in deletion mode; handled by validation overlay

  // Cannon firing handled via global right-click

  // Global right-click handler for launching circles
  const handleGlobalRightClick = useCallback(
    (e) => {
      e.preventDefault(); // Prevent context menu

      // Calculate launch position from cannon tip
      const cannonTipX = window.innerWidth + 40 - 35; // CSS: right: -40px, so base is at window.innerWidth + 40, center at -35
      const cannonTipY = window.innerHeight - 1; // Cannon base Y

      // Calculate tip position based on cannon angle
      const tipDistance = 55; // Distance from base to tip
      const angleRad = cannonAngle * (Math.PI / 180);
      const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
      const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;

      // Calculate launch velocity based on cannon direction
      const launchSpeed = 8; // Reduced speed for better control and accuracy
      const velocityX = Math.sin(angleRad) * launchSpeed;
      const velocityY = -Math.cos(angleRad) * launchSpeed; // Negative because Y increases downward

      // Ensure bullet spawns within screen bounds (like TutorialScene)
      // If tip is outside screen, move spawn point to screen edge
      let spawnX = tipX;
      let spawnY = tipY;

      // Constrain spawn position to be within screen bounds with margin
      const margin = 15;
      spawnX = Math.max(margin, Math.min(window.innerWidth - margin, spawnX));
      spawnY = Math.max(margin, Math.min(window.innerHeight - margin, spawnY));

      // Create new bullet (simple circle)
      const newBullet = {
        id: Date.now(),
        // Spawn bullet at constrained position
        x: spawnX,
        y: spawnY,
        isBullet: true, // Flag to indicate this is a bullet
        velocityX: velocityX,
        velocityY: velocityY,
        isLaunched: true,
        remainingBounces: 2, // Allow 2 bounces total, disappears on third
      };

      setCircles((prev) => [...prev, newBullet]);
    },
    [cannonAngle]
  );

  // Animation loop for launched circles and bullet-node collision
  useEffect(() => {
    const animationFrame = () => {
      let resultToShow = null;
      setCircles((prevCircles) => {
        const updatedCircles = [];

        prevCircles.forEach((circle) => {
          // Only process launched bullets that are still moving
          if (circle.isLaunched && (circle.velocityX || circle.velocityY)) {
            // Update position based on velocity (no gravity - straight line movement)
            const newX = circle.x + circle.velocityX;
            const newY = circle.y + circle.velocityY;

            // Screen boundary collision detection - bullets bounce off edges
            let bounceVelocityX = circle.velocityX;
            let bounceVelocityY = circle.velocityY;
            let finalX = newX;
            let finalY = newY;
            let hitWall = false;

            // Check horizontal boundaries (left and right edges)
            if (newX <= 15 || newX >= window.innerWidth - 15) {
              bounceVelocityX = -bounceVelocityX; // Reverse horizontal velocity
              finalX = newX <= 15 ? 15 : window.innerWidth - 15; // Keep within bounds
              hitWall = true;
            }

            // Check vertical boundaries (top and bottom edges)
            if (newY <= 15 || newY >= window.innerHeight - 15) {
              bounceVelocityY = -bounceVelocityY; // Reverse vertical velocity
              finalY = newY <= 15 ? 15 : window.innerHeight - 15; // Keep within bounds
              hitWall = true;
            }

            const updatedCircle = {
              ...circle,
              x: finalX,
              y: finalY,
              velocityX: bounceVelocityX,
              velocityY: bounceVelocityY,
              remainingBounces:
                circle.remainingBounces !== undefined
                  ? circle.remainingBounces
                  : 2,
            };

            // Check for collisions with floating node circles
            let reflectedThisStep = false;

            // Get real-time floating circle positions
            const currentFloatingCircles = floatingCirclesRef.current;
            for (let i = 0; i < currentFloatingCircles.length; i++) {
              const floatingCircle = currentFloatingCircles[i];

              // Use visual radii for collision
              const bulletRadius = 15;
              const circleRadius = 30;
              const combinedRadius = bulletRadius + circleRadius;

              // Calculate current positions (centers)
              const currentCircleX = floatingCircle.x + circleRadius;
              const currentCircleY = floatingCircle.y + circleRadius;
              const currentBulletX = updatedCircle.x;
              const currentBulletY = updatedCircle.y;

              // Optional short cooldown to avoid re-hitting the same node immediately
              const nowTs = performance.now();
              if (
                circle.lastHitNodeId &&
                circle.lastHitNodeId === floatingCircle.id &&
                circle.lastHitTime &&
                nowTs - circle.lastHitTime < 30
              ) {
                continue; // skip this node this frame
              }

              // Align bullet reflection logic EXACTLY with aim-line prediction
              const vlen =
                Math.hypot(updatedCircle.velocityX, updatedCircle.velocityY) ||
                1;
              const ux = updatedCircle.velocityX / vlen;
              const uy = updatedCircle.velocityY / vlen;

              // Ray-circle intersection math
              const ox = currentBulletX - currentCircleX;
              const oy = currentBulletY - currentCircleY;
              const b = ox * ux + oy * uy;
              const c = ox * ox + oy * oy - combinedRadius * combinedRadius;
              const disc = b * b - c;

              if (disc > 0) {
                const t = -b - Math.sqrt(disc);
                // Check if intersection is in front of the bullet and within this frame's movement
                if (t > 0.01 && t <= vlen) {
                  // We have a valid hit, reflect the bullet
                  const hitX = currentBulletX + ux * t;
                  const hitY = currentBulletY + uy * t;

                  // Normal at hit point
                  const nx = (hitX - currentCircleX) / combinedRadius;
                  const ny = (hitY - currentCircleY) / combinedRadius;

                  // Reflect velocity
                  const vdotn =
                    updatedCircle.velocityX * nx + updatedCircle.velocityY * ny;
                  const rvx = updatedCircle.velocityX - 2 * vdotn * nx;
                  const rvy = updatedCircle.velocityY - 2 * vdotn * ny;

                  updatedCircle.velocityX = rvx;
                  updatedCircle.velocityY = rvy;

                  // Move bullet to hit point and push out slightly
                  const push = 2.0;
                  const rlen = Math.hypot(rvx, rvy) || 1;
                  updatedCircle.x = hitX + (rvx / rlen) * push;
                  updatedCircle.y = hitY + (rvy / rlen) * push;
                  updatedCircle.lastHitNodeId = floatingCircle.id;
                  updatedCircle.lastHitTime = nowTs;
                  reflectedThisStep = true;

                  // --- NEW: Challenge Mode Logic ---
                  // Track which nodes this bullet has hit and create connections
                  setBulletHitSequences((prevSequences) => {
                    const newSequences = new Map(prevSequences);
                    const bulletId = circle.id;

                    if (!newSequences.has(bulletId)) {
                      // First hit - activate the node (change color)
                      newSequences.set(bulletId, [floatingCircle.id]);
                      setActivatedNodes(
                        (prev) => new Set([...prev, floatingCircle.id])
                      );
                      console.log(
                        `🎯 Node ${floatingCircle.value}(${floatingCircle.address}) activated!`
                      );
                    } else {
                      // Subsequent hit - create connection from previous node to current node
                      const hitSequence = newSequences.get(bulletId);
                      const previousNodeId =
                        hitSequence[hitSequence.length - 1];

                      if (previousNodeId !== floatingCircle.id) {
                        console.log(
                          `🔗 Linking nodes: ${previousNodeId} → ${floatingCircle.id}`
                        );

                        // Create connection between the two nodes
                        createPlayerConnection(
                          previousNodeId,
                          floatingCircle.id
                        );

                        // Activate current node and add to sequence
                        setActivatedNodes(
                          (prev) => new Set([...prev, floatingCircle.id])
                        );
                        hitSequence.push(floatingCircle.id);
                        newSequences.set(bulletId, hitSequence);
                      }
                    }

                    return newSequences;
                  });

                  break; // Processed a hit, exit loop for this frame
                }
              }
            }

            // Decrement remaining bounces when we reflect off walls or nodes
            if (reflectedThisStep || hitWall) {
              updatedCircle.remainingBounces -= 1;
            }

            // Remove bullet if out of bounces (after 2 bounces total, disappears on third impact)
            if (updatedCircle.remainingBounces <= 0) {
              // End of bullet life: if no correct hit but we have pending incorrect, show it
              if (
                !correctHitRef.current &&
                pendingValidationRef.current &&
                !showValidationResult
              ) {
                resultToShow = pendingValidationRef.current;
                pendingValidationRef.current = null;
              }

              console.log(`💥 Bullet ${circle.id} disappeared after 2 bounces`);

              // --- NEW: Clean up bullet hit sequence when bullet disappears ---
              setBulletHitSequences((prevSequences) => {
                const newSequences = new Map(prevSequences);
                newSequences.delete(circle.id);
                return newSequences;
              });

              // Don't keep this bullet
            } else {
              updatedCircles.push(updatedCircle);
            }
          } else {
            // Keep non-launched circles as they are
            updatedCircles.push(circle);
          }
        });

        return updatedCircles;
      });
      if (resultToShow) {
        setShowValidationResult(true);
      }
    };

    const intervalId = setInterval(animationFrame, 8); // ~120fps for smoother movement
    return () => clearInterval(intervalId);
  }, [
    exerciseKey,
    showValidationResult,
    currentExercise,
    createPlayerConnection,
  ]);

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
          const nodeRadius = 30;
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
              // Relaxed collision detection: check if distance is less than node radius + a small buffer
              if (distance < nodeRadius + 5) {
                // Increased hitbox for easier ricochet
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
  }, [
    draggedCircle,
    dragOffset,
    findConnectedCircles,
    circles,
    handleGlobalRightClick,
  ]);

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
                      <div className={styles.sectionLabel}>
                        Stage {stageProgress?.currentStage || 1}/
                        {stageProgress?.totalStages || 1}
                      </div>
                      <div className={styles.squareNodeField}>
                        {(() => {
                          // Get current stage target info
                          const target = currentExercise.targetNode;
                          if (!target) return "No Target";

                          // Determine target type from the remaining list
                          const remainingList =
                            currentExercise.remainingList || [];
                          if (remainingList.length === 0) return "Complete";

                          const isHead =
                            remainingList[0]?.value === target.value &&
                            remainingList[0]?.address === target.address;
                          const isTail =
                            remainingList[remainingList.length - 1]?.value ===
                              target.value &&
                            remainingList[remainingList.length - 1]?.address ===
                              target.address;

                          if (isHead) return "Delete Head";
                          if (isTail) return "Delete Tail";
                          return `Delete ${target.value}`;
                        })()}
                      </div>
                    </div>
                    <div className={styles.squareSection}>
                      <div className={styles.sectionLabel}>Target Node</div>
                      <div className={styles.squareNodeField}>
                        {currentExercise.targetNode
                          ? `${currentExercise.targetNode.value} / ${currentExercise.targetNode.address}`
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Challenge Mode Instructions */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          border: "2px solid #00ff88",
          borderRadius: "10px",
          padding: "15px",
          color: "#fff",
          fontSize: "14px",
          maxWidth: "350px",
          zIndex: 15,
        }}
      >
        <div
          style={{ color: "#00ff88", fontWeight: "bold", marginBottom: "8px" }}
        >
          🚀 Progressive Deletion Challenge
        </div>
        <div>Right-click to shoot balls at nodes.</div>
        <div style={{ color: "#00ff88" }}>
          • First hit: Activates node (turns green)
        </div>
        <div style={{ color: "#00ff88" }}>
          • Second hit: Creates connection!
        </div>
        <div style={{ color: "#ff6600", fontSize: "12px", marginTop: "5px" }}>
          🎯 Goal: Delete target node by excluding it from connections
        </div>
        <div style={{ color: "#ff6600", fontSize: "12px" }}>
          🔗 Connected nodes form the new linked list
        </div>
        <div style={{ color: "#ffaa00", fontSize: "12px" }}>
          ⭐ Complete each stage to unlock the next target!
        </div>
        <div style={{ color: "#ffaa00", fontSize: "12px", marginTop: "3px" }}>
          💡 Don&apos;t connect the target node to delete it
        </div>
      </div>

      {/* Connection Counter and Manual Validation */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 15,
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            border: "2px solid #00ff88",
            borderRadius: "8px",
            padding: "10px 15px",
            color: "#00ff88",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          🔗 Connections: {playerConnections.length}
        </div>
        <button
          onClick={() => {
            // Manual validation
            console.log("🔴 Manual validation triggered");
            console.log("🔴 Current playerConnections:", playerConnections);
            console.log(
              "🔴 Current floatingCircles:",
              floatingCircles.map((c) => `${c.value}(${c.address})`)
            );

            if (currentExercise && playerConnections.length > 0) {
              // Build the current linked list from connections
              const connectedNodeIds = new Set();
              playerConnections.forEach((conn) => {
                connectedNodeIds.add(conn.from);
                connectedNodeIds.add(conn.to);
              });

              const nodeMap = new Map();
              playerConnections.forEach((conn) => {
                const fromNode = floatingCircles.find(
                  (c) => c.id === conn.from
                );
                const toNode = floatingCircles.find((c) => c.id === conn.to);
                if (fromNode && toNode) {
                  nodeMap.set(conn.from, { ...fromNode, next: conn.to });
                  if (!nodeMap.has(conn.to)) {
                    nodeMap.set(conn.to, { ...toNode, next: null });
                  }
                }
              });

              console.log(
                "🔴 NodeMap built:",
                [...nodeMap.entries()].map(
                  ([id, node]) =>
                    `${id}: ${node.value}(${node.address}) -> ${node.next}`
                )
              );

              // Find head and build list
              const hasIncoming = new Set();
              playerConnections.forEach((conn) => hasIncoming.add(conn.to));
              const headNodes = [...nodeMap.keys()].filter(
                (id) => !hasIncoming.has(id)
              );

              console.log("🔴 Head nodes found:", headNodes);

              if (headNodes.length === 1) {
                const linkedList = [];
                let currentId = headNodes[0];
                while (currentId && nodeMap.has(currentId)) {
                  const node = nodeMap.get(currentId);
                  linkedList.push({ value: node.value, address: node.address });
                  currentId = node.next;
                }
                console.log("🔴 Built linked list:", linkedList);
                validateChallengeCompletion(linkedList);
              } else {
                console.log("🔴 Invalid head count:", headNodes.length);
              }
            } else {
              console.log("🔴 No exercise or no connections");
            }
          }}
          style={{
            background: "rgba(255, 165, 0, 0.8)",
            border: "2px solid #ffaa00",
            borderRadius: "8px",
            padding: "8px 12px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          ✅ Check Solution
        </button>
      </div>

      <div
        className={styles.rightSquare}
        style={{
          outlineOffset: "5px",
          transform: `rotate(${cannonAngle}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        {/* Cannon Circle */}
        <div className={styles.cannonCircle}>
          <span style={{ fontSize: "12px", color: "#fff" }}>•</span>
        </div>
      </div>

      {/* Angle Indicator */}
      <div className={styles.angleIndicator}>
        <div className={styles.angleValue}>{Math.round(cannonAngle)}°</div>
        <div className={styles.angleLabel}>Angle</div>
      </div>

      {/* Aim line guide: show ONLY the cannon preview when no bullets are active; hide after shot */}
      {(() => {
        // Shared segment computation for a start point and direction
        const computeSegments = (startX, startY, dirX, dirY) => {
          const bulletRadius = 15;
          const nodeRadius = 30;
          // Use the same effective radius as the runtime collision
          const R = bulletRadius + nodeRadius;
          // Small epsilon avoids self-hit without skewing prediction
          const minT = 0.01;

          const segments = [];
          const maxBounces = 2; // only first hit + one bounce
          const minX = 15,
            maxX = window.innerWidth - 15,
            minY = 15,
            maxY = window.innerHeight - 15;
          let x = startX,
            y = startY;
          let lastCircleId = null;

          const firstWallHit = (x0, y0, ux, uy) => {
            const cands = [];
            if (ux > 0) cands.push({ t: (maxX - x0) / ux, wall: "right" });
            if (ux < 0) cands.push({ t: (minX - x0) / ux, wall: "left" });
            if (uy > 0) cands.push({ t: (maxY - y0) / uy, wall: "bottom" });
            if (uy < 0) cands.push({ t: (minY - y0) / uy, wall: "top" });
            const positives = cands.filter(
              (c) => c.t > 0 && Number.isFinite(c.t)
            );
            if (positives.length === 0) return null;
            return positives.reduce((a, b) => (a.t < b.t ? a : b));
          };

          const nodes = floatingCircles
            .filter((c) => c && c.type === "node" && c.isInList)
            // floatingCircles.x/y are top-left of a 60px node; convert to center
            .map((c) => ({
              id: c.id,
              cx: (c.x || 0) + 30, // Use hardcoded 30 for nodeRadius
              cy: (c.y || 0) + 30, // Use hardcoded 30 for nodeRadius
            }));

          const firstCircleHit = (x0, y0, ux, uy) => {
            let best = null;
            const a = 1;
            for (let i = 0; i < nodes.length; i++) {
              const { id, cx, cy } = nodes[i];
              if (id === lastCircleId) continue;
              const ox = x0 - cx;
              const oy = y0 - cy;
              const b = ox * ux + oy * uy;
              const c = ox * ox + oy * oy - R * R;
              const disc = b * b - a * c;
              if (disc <= 0) continue;
              const sqrtD = Math.sqrt(disc);
              const t1 = -b - sqrtD;
              const t2 = -b + sqrtD;
              let t = Number.POSITIVE_INFINITY;
              if (t1 > minT && t1 < t) t = t1;
              if (t2 > minT && t2 < t) t = t2;
              if (!Number.isFinite(t)) continue;
              if (t <= 0) continue;
              if (!best || t < best.t) best = { t, id, cx, cy };
            }
            return best;
          };

          for (let i = 0; i < maxBounces; i++) {
            const len = Math.hypot(dirX, dirY) || 1;
            let ux = dirX / len;
            let uy = dirY / len;

            const wall = firstWallHit(x, y, ux, uy);
            const circ = firstCircleHit(x, y, ux, uy);

            if (circ && (!wall || circ.t < wall.t)) {
              const hx = x + ux * circ.t;
              const hy = y + uy * circ.t;
              segments.push({ x1: x, y1: y, x2: hx, y2: hy });

              const nxv = (hx - circ.cx) / R;
              const nyv = (hy - circ.cy) / R;
              const vdotn = ux * nxv + uy * nyv;
              ux = ux - 2 * vdotn * nxv;
              uy = uy - 2 * vdotn * nyv;
              // small push along the reflected direction to avoid immediate re-hit
              const push = 2.0;
              x = hx + ux * push;
              y = hy + uy * push;
              dirX = ux;
              dirY = uy;
              lastCircleId = circ.id;

              const nextWall = firstWallHit(x, y, dirX, dirY);
              if (nextWall) {
                const nlen = Math.hypot(dirX, dirY) || 1;
                const nwx = x + (dirX / nlen) * nextWall.t;
                const nwy = y + (dirY / nlen) * nextWall.t;
                segments.push({ x1: x, y1: y, x2: nwx, y2: nwy });
              }
              break;
            }

            if (wall) {
              const len0 = Math.hypot(dirX, dirY) || 1;
              const wx = x + (dirX / len0) * wall.t;
              const wy = y + (dirY / len0) * wall.t;
              segments.push({ x1: x, y1: y, x2: wx, y2: wy });
              let rdx = dirX;
              let rdy = dirY;
              if (wall.wall === "left" || wall.wall === "right") rdx = -rdx;
              if (wall.wall === "top" || wall.wall === "bottom") rdy = -rdy;
              const rlen = Math.hypot(rdx, rdy) || 1;
              const px = wx + (rdx / rlen) * 2.0;
              const py = wy + (rdy / rlen) * 2.0;
              const nextWall = firstWallHit(px, py, rdx / rlen, rdy / rlen);
              if (nextWall) {
                const nwx = px + (rdx / rlen) * nextWall.t;
                const nwy = py + (rdy / rlen) * nextWall.t;
                segments.push({ x1: px, y1: py, x2: nwx, y2: nwy });
              }
              break;
            }

            break;
          }

          return segments;
        };

        // Always build a preview from the cannon tip (even while bullets are active)
        const cannonBaseX = window.innerWidth + 40 - 35;
        const cannonBaseY = window.innerHeight - 1;
        const angleRad = cannonAngle * (Math.PI / 180);
        const tipDistance = 55;
        const uncConstrainedX = cannonBaseX + Math.sin(angleRad) * tipDistance;
        const uncConstrainedY = cannonBaseY - Math.cos(angleRad) * tipDistance;

        // Apply the same constraint logic as bullet firing
        const margin = 15;
        const previewX = Math.max(
          margin,
          Math.min(window.innerWidth - margin, uncConstrainedX)
        );
        const previewY = Math.max(
          margin,
          Math.min(window.innerHeight - margin, uncConstrainedY)
        );

        const previewDirX = Math.sin(angleRad);
        const previewDirY = -Math.cos(angleRad);
        const previewSegments = computeSegments(
          previewX,
          previewY,
          previewDirX,
          previewDirY
        );

        return (
          <svg className={styles.aimLines} aria-hidden>
            {previewSegments.map((s, idx) => (
              <line
                key={`preview-seg-${idx}`}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                className={styles.aimLine}
              />
            ))}
          </svg>
        );
      })()}

      {circles.map((circle) => (
        <div
          key={circle.id}
          className={`${styles.animatedCircle} ${
            suckingCircles.includes(circle.id) ? styles.beingSucked : ""
          }`}
          style={{
            left: `${circle.x - (circle.isBullet ? 15 : 30)}px`,
            top: `${circle.y - (circle.isBullet ? 15 : 30)}px`,
            width: circle.isBullet ? "30px" : "60px",
            height: circle.isBullet ? "30px" : "60px",
            backgroundColor: circle.isBullet ? "#ff6b6b" : "#d3d3d3",
            cursor: circle.isLaunched
              ? "default"
              : draggedCircle && circle.id === draggedCircle.id
              ? "grabbing"
              : "grab",
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

      {/* Linked List Connections (between present list nodes) */}
      {currentExercise &&
        floatingCircles.length > 0 &&
        (() => {
          const key = (n) => `${n.value}-${n.address}`;
          const presentMap = new Map();
          floatingCircles.forEach((c) => {
            if (c.isInList) presentMap.set(key(c), c);
          });

          const list = currentExercise.initialList || [];
          const pairs = [];
          let headCircle = null;
          const R = 30; // approximate radius for positioning (matches 60px circle)

          // Find first present as head
          for (let i = 0; i < list.length; i++) {
            const c = presentMap.get(key(list[i]));
            if (c) {
              headCircle = c;
              break;
            }
          }

          // Build pairs from each present node to the next present node
          for (let i = 0; i < list.length; i++) {
            const fromC = presentMap.get(key(list[i]));
            if (!fromC) continue;
            let nextC = null;
            for (let j = i + 1; j < list.length; j++) {
              const cand = presentMap.get(key(list[j]));
              if (cand) {
                nextC = cand;
                break;
              }
            }
            if (nextC) pairs.push({ from: fromC, to: nextC });
          }

          if (pairs.length === 0 && !headCircle) return null;

          return (
            <>
              <svg
                className={styles.connectionLines}
                style={{ pointerEvents: "none" }}
              >
                {pairs.map((p) => (
                  <g key={`${p.from.id}->${p.to.id}`}>
                    <line
                      x1={(p.from.x || 0) + R}
                      y1={(p.from.y || 0) + R}
                      x2={(p.to.x || 0) + R}
                      y2={(p.to.y || 0) + R}
                      className={styles.animatedLine}
                      markerEnd="url(#arrowhead-linked)"
                    />
                  </g>
                ))}
                <defs>
                  <marker
                    id="arrowhead-linked"
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

              {/* Head label */}
              {headCircle && (
                <div
                  style={{
                    position: "absolute",
                    left: `${(headCircle.x || 0) + R - 15}px`,
                    top: `${(headCircle.y || 0) - 20}px`,
                    color: "#00ff88",
                    background: "rgba(0,0,0,0.6)",
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    zIndex: 9,
                    border: "1px solid #00ff88",
                    boxShadow: "0 0 6px rgba(0,255,136,0.6)",
                    pointerEvents: "none",
                  }}
                >
                  HEAD
                </div>
              )}
            </>
          );
        })()}

      {/* Player-created connections */}
      {playerConnections.length > 0 && (
        <svg
          className={styles.connectionLines}
          style={{ pointerEvents: "none" }}
        >
          {playerConnections.map((connection) => {
            const fromNode = floatingCircles.find(
              (c) => c.id === connection.from
            );
            const toNode = floatingCircles.find((c) => c.id === connection.to);

            if (!fromNode || !toNode) return null;

            const fromX = fromNode.x + 30; // Center of 60px circle
            const fromY = fromNode.y + 30;
            const toX = toNode.x + 30;
            const toY = toNode.y + 30;

            return (
              <line
                key={connection.id}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="#00ff88"
                strokeWidth="4"
                strokeDasharray="8 4"
                markerEnd="url(#arrowhead-player)"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(0, 255, 136, 0.8))",
                }}
              />
            );
          })}
          <defs>
            <marker
              id="arrowhead-player"
              markerWidth="10"
              markerHeight="10"
              refX="18"
              refY="5"
              orient="auto"
              fill="#00ff88"
              stroke="#00ff88"
              strokeWidth="0.5"
            >
              <path d="M0,0 L0,10 L10,5 z" fill="#00ff88" />
            </marker>
          </defs>
        </svg>
      )}

      {/* Floating Node Circles (value + address) */}
      {floatingCircles.map((circle) => (
        <div
          key={circle.id}
          data-node-id={circle.id}
          className={`${styles.floatingCircle} ${styles.valueCircle} ${
            activatedNodes.has(circle.id) ? styles.activated : ""
          }`}
          style={{
            left: `${circle.x}px`,
            top: `${circle.y}px`,
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 800 }}>
            {circle.value}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.9 }}>{circle.address}</div>
        </div>
      ))}

      {/* Validation Overlay */}
      {showValidationResult && pendingValidationRef.current && (
        <div className={styles.validationOverlay}>
          <div className={styles.validationContent}>
            <div className={styles.validationHeader}>
              <div className={styles.scoreSection}>
                <span className={styles.scoreLabel}>
                  {pendingValidationRef.current.isCorrect
                    ? "✅ Success!"
                    : "❌ Try Again"}
                </span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2
                style={{
                  color: pendingValidationRef.current.isCorrect
                    ? "#00ff88"
                    : "#ff4444",
                  marginBottom: "10px",
                }}
              >
                {pendingValidationRef.current.message}
              </h2>
              {pendingValidationRef.current.isCorrect && (
                <div style={{ color: "#00ff88", fontSize: "18px" }}>
                  🎉 Challenge Complete! Score:{" "}
                  {pendingValidationRef.current.score}
                </div>
              )}
            </div>

            {/* Show the resulting linked list structure */}
            {pendingValidationRef.current.isCorrect &&
              pendingValidationRef.current.userCircles && (
                <div style={{ marginBottom: "30px" }}>
                  <h3
                    style={{
                      color: "#00ff88",
                      textAlign: "center",
                      marginBottom: "20px",
                      fontSize: "18px",
                    }}
                  >
                    ✅ Your New Linked List:
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "20px",
                      flexWrap: "wrap",
                      padding: "20px",
                      background: "rgba(0, 255, 136, 0.1)",
                      border: "2px solid #00ff88",
                      borderRadius: "15px",
                      margin: "0 auto",
                      maxWidth: "80%",
                    }}
                  >
                    {pendingValidationRef.current.userCircles.map(
                      (node, index) => (
                        <div
                          key={`result-${index}`}
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          {/* Node circle */}
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)",
                              border: "3px solid #fff",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#000",
                              fontWeight: "bold",
                              boxShadow: "0 0 20px rgba(0, 255, 136, 0.6)",
                            }}
                          >
                            <div style={{ fontSize: "18px", fontWeight: 800 }}>
                              {node.value}
                            </div>
                            <div style={{ fontSize: "12px", opacity: 0.8 }}>
                              {node.address}
                            </div>
                          </div>

                          {/* Arrow (if not the last node) */}
                          {index <
                            pendingValidationRef.current.userCircles.length -
                              1 && (
                            <div
                              style={{
                                margin: "0 15px",
                                color: "#00ff88",
                                fontSize: "24px",
                                fontWeight: "bold",
                              }}
                            >
                              →
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {/* NULL indicator */}
                    <div
                      style={{
                        margin: "0 15px",
                        color: "#00ff88",
                        fontSize: "24px",
                        fontWeight: "bold",
                      }}
                    >
                      → NULL
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "15px",
                      color: "#00ff88",
                      fontSize: "14px",
                    }}
                  >
                    {currentExercise.target?.type === "head"
                      ? "🎯 Head node successfully deleted!"
                      : currentExercise.target?.type === "tail"
                      ? "🎯 Tail node successfully deleted!"
                      : `🎯 Node with value ${currentExercise.target?.value} successfully deleted!`}
                  </div>
                </div>
              )}

            <div className={styles.validationButtons}>
              <button
                className={styles.continueButton}
                onClick={() => {
                  if (pendingValidationRef.current.isCorrect) {
                    // Check if there's a next level
                    const nextLevel =
                      exerciseManagerRef.current.getNextLevel(exerciseKey);
                    if (nextLevel) {
                      // Reset states and load next level
                      setPlayerConnections([]);
                      setActivatedNodes(new Set());
                      setBulletHitSequences(new Map());
                      setCircles([]);
                      loadExercise(nextLevel);
                    } else {
                      console.log("🎉 All levels completed!");
                    }
                  }
                  setShowValidationResult(false);
                  pendingValidationRef.current = null;
                }}
                style={{
                  background: pendingValidationRef.current.isCorrect
                    ? "#00ff88"
                    : "#666",
                  color: "#000",
                  border: "none",
                  padding: "12px 30px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {pendingValidationRef.current.isCorrect
                  ? "Continue"
                  : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Tutorial Wrapper Component
function GalistGameDeletion() {
  const [currentScene, setCurrentScene] = useState("scene1");

  const handleSceneTransition = () => {
    if (currentScene === "scene1") {
      setCurrentScene("scene2");
    } else if (currentScene === "scene2") {
      setCurrentScene("scene3");
    } else if (currentScene === "scene3") {
      setCurrentScene("scene4");
    } else if (currentScene === "scene4") {
      setCurrentScene("mainGame");
    }
  };

  const handleValueShoot = () => {
    // Value was shot in tutorial, could add logic here if needed
  };

  if (
    currentScene === "scene1" ||
    currentScene === "scene2" ||
    currentScene === "scene3" ||
    currentScene === "scene4"
  ) {
    return (
      <TutorialScene
        scene={currentScene}
        onContinue={handleSceneTransition}
        onValueShoot={handleValueShoot}
      />
    );
  }

  if (currentScene === "mainGame") {
    return <MainGameComponent />;
  }

  return null;
}

export default GalistGameDeletion;
