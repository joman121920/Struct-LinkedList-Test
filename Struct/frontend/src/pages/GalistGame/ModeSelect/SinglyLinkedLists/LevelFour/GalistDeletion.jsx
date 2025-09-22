// --- Add refs to reliably track entry order and sucked circles ---

import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./GalistDeletion.module.css";
import { ExerciseManager } from "./GalistDeletionExercise.js";
import { collisionDetection } from "../../../CollisionDetection.js";
import PortalComponent from "../../../PortalComponent.jsx";
import PortalParticles from "../../../Particles.jsx";
import TutorialScene from "./TutorialScene.jsx";

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
  // Ricochet/validation helpers
  const pendingValidationRef = useRef(null);
  const correctHitRef = useRef(false);

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

  // Deletion mode does not track a bottom square; validation happens immediately on hit

  // Level completion handled via validation overlay only

  // Floating target circles - some with values, some with addresses
  // Floating circles state and ref for performance optimization
  const [floatingCircles, setFloatingCircles] = useState([]);
  const floatingCirclesRef = useRef([]);

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

  // Animate floating circles with collision detection and real-time position tracking
  useEffect(() => {
    // Floating circles are static now; no animation interval needed.
  }, []);

  // No auto-completion check for deletion; handled on bullet hit
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
    pendingValidationRef.current = null;
    correctHitRef.current = false;
    // Reset validation-related UI

    // Now load the new exercise
    const exercise = exerciseManagerRef.current.loadExercise(key);
    setCurrentExercise(exercise);
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

  // (Removed unused getChainOrder for node creation)

  // No chain suction effect for deletion

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
        const allCirclesForCollision = circlesWithSpecialBehavior.filter(
          (circle) => !circle.isBullet
        );
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
        const bullets = circlesWithSpecialBehavior.filter(
          (circle) => circle.isBullet
        );
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

  // Auto-suction effect when portal opens - not used in deletion
  useEffect(() => {
    if (portalInfo.isVisible && circles.length > 0) {
      // No-op for deletion (circles array mainly holds bullets)
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
    // Disabled in deletion mode
    setSelectedCircle(null);
    setConnectToAddress("");
  };

  const closePopup = () => {
    setSelectedCircle(null);
    setConnectToAddress("");
  };

  const handleDeleteCircle = () => {
    // Disabled in deletion mode
    closePopup();
  };

  // No completion popup handlers in deletion mode; handled by validation overlay

  // Cannon firing handled via global right-click

  // Global right-click handler for launching circles
  const handleGlobalRightClick = useCallback(
    (e) => {
      e.preventDefault(); // Prevent context menu

      // Calculate launch position from cannon tip
      const cannonTipX = window.innerWidth + 40 - 35; // Cannon base X
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

      // Create new bullet (simple circle)
      const newBullet = {
        id: Date.now(),
        // Spawn bullet at tip center so preview matches
        x: tipX,
        y: tipY,
        isBullet: true, // Flag to indicate this is a bullet
        velocityX: velocityX,
        velocityY: velocityY,
        isLaunched: true,
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
          // Skip bullets that are already marked for deletion
          if (
            circle.isLaunched &&
            (circle.velocityX || circle.velocityY) &&
            !circle.markedForDeletion
          ) {
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
              velocityY: bounceVelocityY,
              remainingBounces:
                typeof circle.remainingBounces === "number"
                  ? circle.remainingBounces - 0
                  : 30,
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

                  // --- Two-hit linking mechanic ---
                  if (floatingCircle.type === "node") {
                    const isInListNode = !!floatingCircle.isInList;
                    if (isInListNode) {
                      if (!updatedCircle.firstHitNodeId) {
                        // First node hit by this bullet
                        updatedCircle.firstHitNodeId = floatingCircle.id;
                        updatedCircle.firstHitAddress = floatingCircle.address;
                      } else if (
                        updatedCircle.firstHitNodeId !== floatingCircle.id
                      ) {
                        // Second distinct node hit, trigger deletion
                        const initialList = currentExercise?.initialList || [];
                        const getIndexByAddress = (addr) =>
                          initialList.findIndex(
                            (n) => String(n.address) === String(addr)
                          );

                        const idxA = getIndexByAddress(
                          updatedCircle.firstHitAddress
                        );
                        const idxB = getIndexByAddress(floatingCircle.address);

                        if (idxA !== -1 && idxB !== -1) {
                          const start = Math.min(idxA, idxB);
                          const end = Math.max(idxA, idxB);
                          const toRemoveAddr = new Set();

                          // Collect addresses of nodes to remove (between start and end, exclusive)
                          for (let k = start + 1; k < end; k++) {
                            toRemoveAddr.add(String(initialList[k].address));
                          }

                          if (toRemoveAddr.size > 0) {
                            // Find the circles that need to be removed
                            const circlesToRemove =
                              currentFloatingCircles.filter(
                                (c) =>
                                  c.type === "node" &&
                                  !!c.isInList &&
                                  toRemoveAddr.has(String(c.address))
                              );

                            if (circlesToRemove.length > 0) {
                              const toRemoveIds = new Set(
                                circlesToRemove.map((c) => c.id)
                              );

                              // Validate the deletion against the nodes we've identified
                              let isDeletionCorrect = false;
                              for (const fc of circlesToRemove) {
                                const res =
                                  exerciseManagerRef.current.validateDeletion(
                                    exerciseKey,
                                    {
                                      value: fc.value,
                                      address: fc.address,
                                      isInList: true,
                                    }
                                  );

                                if (res?.isCorrect) {
                                  isDeletionCorrect = true;
                                  resultToShow = res; // Show validation immediately
                                  break; // Exit after first correct validation
                                } else {
                                  pendingValidationRef.current = res; // Log incorrect attempt
                                }
                              }

                              if (isDeletionCorrect) {
                                correctHitRef.current = true;
                                // Remove the deleted nodes from the UI
                                setFloatingCircles((prevFloating) =>
                                  prevFloating.filter(
                                    (fc) => !toRemoveIds.has(fc.id)
                                  )
                                );
                              }
                            }
                          } else {
                            // No nodes between the two hit nodes - they are adjacent
                            // This is likely an invalid deletion attempt
                            const res =
                              exerciseManagerRef.current.validateDeletion(
                                exerciseKey,
                                {
                                  value: -1, // Invalid deletion
                                  address: "invalid",
                                  isInList: false,
                                }
                              );
                            pendingValidationRef.current = res;
                          }
                        }
                        // Mark bullet for deletion after the two-hit action
                        updatedCircle.markedForDeletion = true;
                      }
                    }
                  }
                  break; // Processed a hit, exit loop for this frame
                }
              }
            }

            // Decrement remaining bounces when we reflect off walls or nodes
            if (reflectedThisStep) {
              updatedCircle.remainingBounces -= 1;
            }

            // Remove bullet if out of bounces or marked for deletion
            if (
              (typeof updatedCircle.remainingBounces === "number" &&
                updatedCircle.remainingBounces <= 0) ||
              updatedCircle.markedForDeletion
            ) {
              // End of bullet life: if no correct hit but we have pending incorrect, show it
              if (
                !correctHitRef.current &&
                pendingValidationRef.current &&
                !showValidationResult
              ) {
                resultToShow = pendingValidationRef.current;
                pendingValidationRef.current = null;
              }
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
        setValidationResult(resultToShow);
        setShowValidationResult(true);
      }
    };

    const intervalId = setInterval(animationFrame, 8); // ~120fps for smoother movement
    return () => clearInterval(intervalId);
  }, [exerciseKey, showValidationResult, currentExercise]);

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
                      <div className={styles.sectionLabel}>Target</div>
                      <div className={styles.squareNodeField}>
                        {currentExercise.target?.type === "head"
                          ? "Delete Head"
                          : currentExercise.target?.type === "tail"
                          ? "Delete Tail"
                          : `Delete value ${currentExercise.target?.value}`}
                      </div>
                    </div>
                    <div className={styles.squareSection}>
                      <div className={styles.sectionLabel}>Node</div>
                      <div className={styles.squareNodeField}>
                        {currentExercise.target?.type === "value"
                          ? "-"
                          : `${currentExercise.targetNode?.value} / ${currentExercise.targetNode?.address}`}
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
      <PortalParticles portalInfo={portalInfo} />
      <PortalComponent
        onPortalStateChange={handlePortalStateChange}
        isOpen={isPortalOpen}
      />
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
        const previewX = cannonBaseX + Math.sin(angleRad) * tipDistance;
        const previewY = cannonBaseY - Math.cos(angleRad) * tipDistance;
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
                          validated && validated.length > 0 ? validated : [];
                        return currentExercise.expectedStructure.map(
                          (expectedNode, index) => {
                            const userNode = userOrder[index];
                            const isCorrect =
                              userNode &&
                              String(userNode.value) ===
                                String(expectedNode.value);
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
                    const nextLevel =
                      exerciseManagerRef.current.getNextLevel(exerciseKey);
                    if (nextLevel) {
                      loadExercise(nextLevel);
                    }
                  }
                }}
                className={styles.continueButton}
              >
                {validationResult && validationResult.isCorrect
                  ? exerciseManagerRef.current.hasNextLevel(exerciseKey)
                    ? "NEXT LEVEL"
                    : "GAME COMPLETE"
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

      {/* No interactive square node in deletion mode */}

      {/* No completion popups in deletion mode */}

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

      {/* Floating Node Circles (value + address) */}
      {floatingCircles.map((circle) => (
        <div
          key={circle.id}
          className={`${styles.floatingCircle} ${styles.valueCircle}`}
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
