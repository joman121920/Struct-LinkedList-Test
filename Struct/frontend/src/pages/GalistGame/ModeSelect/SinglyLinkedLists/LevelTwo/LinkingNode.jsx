// --- Add refs to reliably track entry order and sucked circles ---

import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./LinkingNode.module.css";
import { ExerciseManager } from "./LinkingNodeExercise.js";
import { collisionDetection } from "../../../CollisionDetection";
import PortalComponent from "../../../PortalComponent";
import PortalParticles from "../../../Particles.jsx";
import TutorialScene from "./TutorialScene";

function GalistGameLinkingNode() {
  // Completion modal state for all exercises done
  const [showAllCompletedModal, setShowAllCompletedModal] = useState(false);

  // Handler for Go Back button
  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);
  // --- Add refs to reliably track entry order and sucked circles ---
  const entryOrderRef = useRef([]);
  const suckedCirclesRef = useRef([]); // Will store the actual circle objects in order
  // Track which exercise is active
  const [exerciseKey, setExerciseKey] = useState("exercise_one");
  const [circles, setCircles] = useState([]);
  const [draggedCircle, setDraggedCircle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connections, setConnections] = useState([]);
  const animationRef = useRef();
  const mouseHistoryRef = useRef([]);
  const [suckingCircles, setSuckingCircles] = useState([]);
  const [suckedCircles, setSuckedCircles] = useState([]);
  const [currentEntryOrder, setCurrentEntryOrder] = useState([]);
  const [originalSubmission, setOriginalSubmission] = useState(null);

  // Exercise progress indicator logic
  const EXERCISE_KEYS = ["exercise_one", "exercise_two", "exercise_three"];
  const currentExerciseNumber = EXERCISE_KEYS.indexOf(exerciseKey) + 1;
  const totalExercises = EXERCISE_KEYS.length;

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
  const [showInstructionPopup, setShowInstructionPopup] = useState(true);

  // Cannon angle state for dynamic cannon rotation
  const [cannonAngle, setCannonAngle] = useState(0);

  // Cannon circle states - initialize with random values for testing
  const [cannonCircle, setCannonCircle] = useState({ 
    value: Math.floor(Math.random() * 100).toString(), 
    address: Math.floor(Math.random() * 1000).toString() 
  });

  // Black hole states for challenge mechanics
  const [blackHoles, setBlackHoles] = useState([]);
  const [headCircleId, setHeadCircleId] = useState(null);
  const [tailCircleId, setTailCircleId] = useState(null);

  // Bullet selection modal states
  const [showBulletModal, setShowBulletModal] = useState(false);
  const [bulletOptions, setBulletOptions] = useState([]);

  // Level completion modal state
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);

  // Basic helper functions first
  const createConnection = useCallback((fromId, toId) => {
    const newConnection = {
      id: Date.now(),
      from: fromId,
      to: toId
    };
    setConnections(prev => [...prev, newConnection]);
    return newConnection;
  }, []);

  const checkCircleCollision = useCallback((circle1, circle2, radius = 40) => {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= (radius * 1.5); // Slightly larger collision area for easier targeting
  }, []);

  // Generate random black hole positions
  const generateBlackHoles = useCallback(() => {
    const numBlackHoles = Math.floor(Math.random() * 3) + 2; // 1-3 black holes
    const newBlackHoles = [];

    for (let i = 0; i < numBlackHoles; i++) {
      let x, y;
      let attempts = 0;
      const maxAttempts = 50;

      // Try to find a position that doesn't overlap with other black holes
      do {
        x = Math.random() * (window.innerWidth - 200) + 100; // Keep away from edges
        y = Math.random() * (window.innerHeight - 200) + 100;
        attempts++;
      } while (attempts < maxAttempts &&
        newBlackHoles.some(bh => {
          const dx = x - bh.x;
          const dy = y - bh.y;
          return Math.sqrt(dx * dx + dy * dy) < 120; // Minimum distance between black holes
        })
      );

      newBlackHoles.push({
        id: `blackhole_${i}`,
        x,
        y,
        radius: 60 // Very large radius for testing - 120px diameter
      });
    }

    return newBlackHoles;
  }, []); // Remove circles dependency to prevent constant repositioning

  // Generate bullet options for the modal
  const generateBulletOptions = useCallback(() => {
    const options = [];
    const expectedNodes = currentExercise?.expectedStructure || [];
    const MAX_BULLETS = 15;
    
    // Add all expected nodes (correct answers)
    expectedNodes.forEach(node => {
      options.push({
        id: `expected_${node.value}`,
        value: node.value.toString(),
        address: node.address,
        isCorrect: true
      });
    });
    
    // Add random distractor bullets to reach exactly 15 total bullets
    const usedValues = new Set(expectedNodes.map(n => n.value));
    const usedAddresses = new Set(expectedNodes.map(n => n.address));
    
    // Calculate how many random bullets we need to reach exactly 15
    const numRandomBullets = Math.max(0, MAX_BULLETS - expectedNodes.length);
    
    for (let i = 0; i < numRandomBullets; i++) {
      let randomValue, randomAddress;
      
      // Generate unique random value
      do {
        randomValue = Math.floor(Math.random() * 100) + 1;
      } while (usedValues.has(randomValue));
      usedValues.add(randomValue);
      
      // Generate unique random address
      do {
        const addressTypes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj'];
        const numbers = ['10', '20', '30', '40', '50', '60', '70', '80', '90'];
        randomAddress = addressTypes[Math.floor(Math.random() * addressTypes.length)] + 
                       numbers[Math.floor(Math.random() * numbers.length)];
      } while (usedAddresses.has(randomAddress));
      usedAddresses.add(randomAddress);
      
      options.push({
        id: `random_${i}`,
        value: randomValue.toString(),
        address: randomAddress,
        isCorrect: false
      });
    }
    
    // Shuffle the options so correct answers aren't always in the same position
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
  }, [currentExercise]);

  // Handle cannon circle click to open bullet selection modal
  const handleCannonClick = useCallback(() => {
    const bullets = generateBulletOptions();
    setBulletOptions(bullets);
    setShowBulletModal(true);
  }, [generateBulletOptions]);

  // Handle bullet selection
  const handleBulletSelect = useCallback((selectedBullet) => {
    setCannonCircle({
      value: selectedBullet.value,
      address: selectedBullet.address
    });
    setShowBulletModal(false);
  }, []);

  // Close bullet modal
  const closeBulletModal = useCallback(() => {
    setShowBulletModal(false);
  }, []);

  // Function to check if a circle is a head node (has outgoing connections but no incoming)
  const isHeadNode = useCallback(
    (circleId) => {
      const hasOutgoing = connections.some((conn) => conn.from === circleId);
      const hasIncoming = connections.some((conn) => conn.to === circleId);
      return hasOutgoing && !hasIncoming;
    },
    [connections]
  );

  // Function to check if a circle is a tail node (has incoming connections but no outgoing)
  const isTailNode = useCallback(
    (circleId) => {
      const hasOutgoing = connections.some((conn) => conn.from === circleId);
      const hasIncoming = connections.some((conn) => conn.to === circleId);
      return hasIncoming && !hasOutgoing;
    },
    [connections]
  );

  // Helper functions for head/tail logic (depends on isHeadNode and isTailNode)
  const getCircleLabel = useCallback((circleId) => {
    // Check if this is the manually set head/tail (for single node case)
    if (headCircleId === circleId && tailCircleId === circleId) {
      return "head/tail";
    }
    
    // Use connection-based detection for multi-node cases
    const isHead = isHeadNode(circleId);
    const isTail = isTailNode(circleId);
    
    if (isHead && isTail) {
      return "head/tail"; // Single isolated node with connections (shouldn't happen normally)
    } else if (isHead || headCircleId === circleId) {
      return "head";
    } else if (isTail || tailCircleId === circleId) {
      return "tail";
    }
    
    return null;
  }, [headCircleId, tailCircleId, isHeadNode, isTailNode]);

  // Function to update head/tail IDs based on actual connections
  const updateHeadTailIds = useCallback(() => {
    if (circles.length === 0) {
      setHeadCircleId(null);
      setTailCircleId(null);
      return;
    }

    // Find actual head and tail nodes
    const headNode = circles.find(circle => isHeadNode(circle.id));
    const tailNode = circles.find(circle => isTailNode(circle.id));

    if (headNode) setHeadCircleId(headNode.id);
    if (tailNode) setTailCircleId(tailNode.id);

    // If no connections exist but we have circles, the first circle should be head/tail
    if (connections.length === 0 && circles.length > 0) {
      const firstCircle = circles[0];
      setHeadCircleId(firstCircle.id);
      setTailCircleId(firstCircle.id);
    }
  }, [circles, connections, isHeadNode, isTailNode]);

  // Update head/tail IDs whenever connections change
  useEffect(() => {
    updateHeadTailIds();
  }, [connections, circles, updateHeadTailIds]);

  // Check if portal button should be enabled (requires at least one head AND one tail node)
  // const hasHeadNode = useCallback(() => {
  //   return circles.some((circle) => isHeadNode(circle.id));
  // }, [circles, isHeadNode]);

  // const hasTailNode = useCallback(() => {
  //   return circles.some((circle) => isTailNode(circle.id));
  // }, [circles, isTailNode]);

  // const isPortalButtonEnabled = isPortalOpen || (hasHeadNode() && hasTailNode());

  // Helper function to get the complete chain order from head to tail
  const getChainOrder = useCallback(
    (startCircleId) => {
      const chainOrder = [];
      let currentId = startCircleId;
      const visited = new Set();

      // If starting circle is not a head, find the head first
      if (!isHeadNode(startCircleId)) {
        const backwardVisited = new Set();
        let searchId = startCircleId;

        while (searchId && !backwardVisited.has(searchId)) {
          backwardVisited.add(searchId);
          const incomingConnection = connections.find(
            (conn) => conn.to === searchId
          );
          if (incomingConnection) {
            searchId = incomingConnection.from;
          } else {
            break;
          }
        }
        currentId = searchId || startCircleId;
      }

      // Now traverse from head to tail
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        chainOrder.push(currentId);

        // Find the next node in the chain
        const nextConnection = connections.find(
          (conn) => conn.from === currentId
        );
        currentId = nextConnection ? nextConnection.to : null;
      }

      return chainOrder;
    },
    [connections, isHeadNode]
  );

  // Function to start chain suction effect
  const startChainSuction = useCallback(
    (startCircleId) => {
      // Reset sucked circles and entry order for new submission
      setSuckedCircles([]);
      setCurrentEntryOrder([]);

      // Capture the original submission data before any circles are sucked
      setOriginalSubmission({
        circles: circles.map((c) => ({ ...c })),
        connections: connections.map((c) => ({ ...c })),
      });

      // Get the proper head-to-tail chain order
      const chainOrder = getChainOrder(startCircleId);

      // Add the triggering circle to sucking list (don't remove it immediately)
      setSuckingCircles((prev) => {
        if (!prev.includes(startCircleId)) {
          return [...prev, startCircleId];
        }
        return prev;
      });

      // Start the chain reaction in proper order (head first, tail last)
      const remainingCircles = chainOrder.filter((id) => id !== startCircleId);

      remainingCircles.forEach((circleId, index) => {
        setTimeout(() => {
          setSuckingCircles((prev) => {
            if (!prev.includes(circleId)) {
              return [...prev, circleId];
            }
            return prev;
          });
        }, (index + 1) * 300); // 300ms delay between each circle
      });
    },
    [getChainOrder, circles, connections]
  );

  // // Portal toggle function
  // const togglePortal = useCallback(() => {
  //   setIsPortalOpen(!isPortalOpen);
  // }, [isPortalOpen]);

  
  // const startGame = useCallback(() => {
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
        setShowInstructionPopup(false);
        // Reset head/tail state
        setHeadCircleId(null);
        setTailCircleId(null);
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

  const loadExercise = useCallback((key = "exercise_one") => {
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
    // hasLaunchedRef.current = false;
    
    // Reset head/tail state
    setHeadCircleId(null);
    setTailCircleId(null);
    
    // Now load the new exercise
    const exercise = exerciseManagerRef.current.loadExercise(key);
    setCurrentExercise(exercise);
    setExerciseKey(key);
  }, []);

  const startExercise = useCallback(() => {
    setShowInstructionPopup(false);
    if (!currentExercise) {
      loadExercise();
    }
  }, [loadExercise, currentExercise]);

  // Initialize with basic exercise when instruction popup is closed
  useEffect(() => {
    if (!showInstructionPopup && !currentExercise) {
      loadExercise();
    }
  }, [showInstructionPopup, currentExercise, loadExercise]);

  // (Removed unused getChainOrder for node creation)

  // No chain suction effect for node creation

  // PHYSICS SYSTEM - Simple animation loop adapted for portal
  useEffect(() => {
    let isAnimating = true;

    const gameLoop = () => {
      if (!isAnimating) return;

      setCircles((prevCircles) => {
        const circlesWithSpecialBehavior = prevCircles.map((circle) => {
          if (draggedCircle && circle.id === draggedCircle.id) {
            return circle;
          }

          // Apply natural movement for launched circles - no friction in space!
          if (circle.isLaunched && (circle.velocityX || circle.velocityY)) {
            // No friction - circles float forever in space
            const newVelocityX = circle.velocityX;
            const newVelocityY = circle.velocityY;
            
            // Update position based on velocity
            const newX = circle.x + newVelocityX;
            const newY = circle.y + newVelocityY;
            
            // Remove circles that go off screen
            if (newX < -100 || newX > window.innerWidth + 100 || 
                newY < -100 || newY > window.innerHeight + 100) {
              return null; // Mark for removal
            }
            
            // Continue moving forever - no stopping in space!
            return {
              ...circle,
              x: newX,
              y: newY,
              velocityX: newVelocityX,
              velocityY: newVelocityY,
              launchTime: circle.launchTime || Date.now()
            };
          }

          // Add gentle floating movement to ALL circles (even stationary ones)
          if (!circle.isLaunched || (!circle.velocityX && !circle.velocityY)) {
            // Initialize gentle floating if not already set
            if (!circle.floatVelocityX || !circle.floatVelocityY) {
              // Random gentle drift in space
              const angle = Math.random() * 2 * Math.PI;
              const speed = 0.2 + Math.random() * 0.3; // Very slow floating speed (0.2 to 0.5 pixels per frame)
              circle.floatVelocityX = Math.cos(angle) * speed;
              circle.floatVelocityY = Math.sin(angle) * speed;
            }
            
            // Apply gentle floating movement
            const newX = circle.x + circle.floatVelocityX;
            const newY = circle.y + circle.floatVelocityY;
            
            // Gentle boundary bouncing for floating circles
            let newFloatVelocityX = circle.floatVelocityX;
            let newFloatVelocityY = circle.floatVelocityY;
            
            if (newX <= 30 || newX >= window.innerWidth - 30) {
              newFloatVelocityX = -newFloatVelocityX; // Reverse X direction
            }
            if (newY <= 30 || newY >= window.innerHeight - 30) {
              newFloatVelocityY = -newFloatVelocityY; // Reverse Y direction
            }
            
            // Keep within bounds
            const boundedX = Math.max(30, Math.min(window.innerWidth - 30, newX));
            const boundedY = Math.max(30, Math.min(window.innerHeight - 30, newY));
            
            return {
              ...circle,
              x: boundedX,
              y: boundedY,
              floatVelocityX: newFloatVelocityX,
              floatVelocityY: newFloatVelocityY
            };
          }

          // Sucking effect (GalistGame logic)
          if (suckingCircles.includes(circle.id)) {
            // Portal entrance coordinates
            const portalEntranceX = 10 + portalInfo.canvasWidth / 2;
            const portalEntranceY = window.innerHeight / 2;
            const dx = portalEntranceX - circle.x;
            const dy = portalEntranceY - circle.y;

            // Portal entrance area
            const portalTop = window.innerHeight / 2 - 50;
            const portalBottom = window.innerHeight / 2 + 50;
            const entranceTop = portalTop + 10;
            const entranceBottom = portalBottom - 10;

            // If circle is close enough to portal entrance, remove it and trigger validation
            const distanceToPortal = Math.sqrt(dx * dx + dy * dy);
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
              return null; // Remove the circle from rendering immediately
            }

            // CONSTANT suction speed for all circles (true constant speed, not force)
            const suctionSpeed = 2.5; // Faster suction for visible effect
            if (distanceToPortal < suctionSpeed) {
              return {
                ...circle,
                x: portalEntranceX,
                y: portalEntranceY,
                velocityX: 0,
                velocityY: 0,
              };
            }
            const newVelocityX = (dx / distanceToPortal) * suctionSpeed;
            const newVelocityY = (dy / distanceToPortal) * suctionSpeed;
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

          // Check for black hole collision - only affects launched circles WITHIN 3 seconds of launch and NOT already connected
          if (circle.isLaunched && blackHoles.length > 0 && circle.launchTime) {
            const timeSinceLaunch = Date.now() - circle.launchTime;
            const maxVulnerableTime = 3000; // 3 seconds in milliseconds
            // Check if circle is already connected in the linked list
            const connectedIds = findConnectedCircles(circle.id);
            const isConnected = connectedIds.length > 1; // More than itself means it's connected
            if (timeSinceLaunch <= maxVulnerableTime && !isConnected) {
              for (const blackHole of blackHoles) {
                const dx = circle.x - blackHole.x;
                const dy = circle.y - blackHole.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                // If freshly launched and unconnected circle hits black hole, remove it
                if (distance <= (20 + blackHole.radius)) {
                  console.log('Black hole collision detected!', { circle: circle.id, blackHole: blackHole.id, distance, timeSinceLaunch });
                  return null; // Remove the circle
                }
              }
            }
          }          return circle;
        });

        // Second pass: Apply collision detection and physics
        const allCirclesForCollision = circlesWithSpecialBehavior.filter(c => c !== null);
        const draggedCircleData = draggedCircle
          ? allCirclesForCollision.find(
              (circle) => circle && circle.id === draggedCircle.id
            )
          : null;
        const updatedAllCircles =
          allCirclesForCollision.length > 0
            ? collisionDetection.updatePhysics(
                allCirclesForCollision,
                suckingCircles
              )
            : [];
        let finalCircles = updatedAllCircles;
        if (draggedCircleData) {
          finalCircles = updatedAllCircles.map((circle) => {
            if (circle && circle.id === draggedCircle.id) {
              return {
                ...draggedCircleData,
                velocityX: circle.velocityX,
                velocityY: circle.velocityY,
              };
            }
            return circle;
          });
        }

        // Third pass: Check for collisions and auto-connect between ANY circles
        // Use indexed loops to avoid checking each pair twice
        for (let i = 0; i < finalCircles.length; i++) {
          for (let j = i + 1; j < finalCircles.length; j++) {
            const circle1 = finalCircles[i];
            const circle2 = finalCircles[j];
            if (!circle1 || !circle2) continue;
            // At least one circle should be moving for collision to occur
            const circle1Moving = circle1.isLaunched && (circle1.velocityX || circle1.velocityY);
            const circle2Moving = circle2.isLaunched && (circle2.velocityX || circle2.velocityY);
            if (!circle1Moving && !circle2Moving) continue; // Skip if both are stationary
            // Check collision distance
            const distance = Math.sqrt(
              Math.pow(circle1.x - circle2.x, 2) + 
              Math.pow(circle1.y - circle2.y, 2)
            );
            const collisionThreshold = 70; // Larger threshold for easier collision
            if (distance <= collisionThreshold) {
              // Check if connection already exists
              const connectionExists = connections.some(conn => 
                (conn.from === circle1.id && conn.to === circle2.id) ||
                (conn.from === circle2.id && conn.to === circle1.id)
              );
              if (!connectionExists) {
                // Count total circles and connections to understand current state
                const totalConnections = connections.length;
                // Check connection status of both circles
                const circle1HasOutgoing = connections.some(conn => conn.from === circle1.id);
                const circle1HasIncoming = connections.some(conn => conn.to === circle1.id);
                const circle2HasOutgoing = connections.some(conn => conn.from === circle2.id);
                const circle2HasIncoming = connections.some(conn => conn.to === circle2.id);
                // Determine if circles are head, tail, or middle
                const circle1IsHead = circle1HasOutgoing && !circle1HasIncoming;
                const circle1IsTail = circle1HasIncoming && !circle1HasOutgoing;
                const circle1IsMiddle = circle1HasIncoming && circle1HasOutgoing;
                const circle1IsIsolated = !circle1HasIncoming && !circle1HasOutgoing;
                const circle2IsHead = circle2HasOutgoing && !circle2HasIncoming;
                const circle2IsTail = circle2HasIncoming && !circle2HasOutgoing;
                const circle2IsMiddle = circle2HasIncoming && circle2HasOutgoing;
                const circle2IsIsolated = !circle2HasIncoming && !circle2HasOutgoing;
                
                // Check if there's already a complete linked list (head and tail exist)
                const existingHeadNodes = finalCircles.filter(c => {
                  const hasOut = connections.some(conn => conn.from === c.id);
                  const hasIn = connections.some(conn => conn.to === c.id);
                  return hasOut && !hasIn;
                });
                const existingTailNodes = finalCircles.filter(c => {
                  const hasOut = connections.some(conn => conn.from === c.id);
                  const hasIn = connections.some(conn => conn.to === c.id);
                  return !hasOut && hasIn;
                });
                const hasExistingLinkedList = existingHeadNodes.length > 0 && existingTailNodes.length > 0;
                
                // ENHANCED COLLISION PHYSICS: Make launched circles more powerful
                const movingCircle = circle1Moving ? circle1 : circle2;
                
                // Check if the moving circle is a recently launched one (high speed)
                const circle1Speed = Math.sqrt((circle1.velocityX || 0)**2 + (circle1.velocityY || 0)**2);
                const circle2Speed = Math.sqrt((circle2.velocityX || 0)**2 + (circle2.velocityY || 0)**2);
                const launchedThreshold = 3; // Speed threshold to identify launched circles
                
                const circle1IsLaunched = circle1.isLaunched && circle1Speed > launchedThreshold;
                const circle2IsLaunched = circle2.isLaunched && circle2Speed > launchedThreshold;
                // Enhanced collision physics
                if (circle1IsLaunched && !circle2IsLaunched) {
                  const transferRatio = 0.8;
                  const retentionRatio = 0.4;
                  circle2.velocityX = circle1.velocityX * transferRatio;
                  circle2.velocityY = circle1.velocityY * transferRatio;
                  circle1.velocityX = -circle1.velocityX * retentionRatio;
                  circle1.velocityY = -circle1.velocityY * retentionRatio;
                } else if (circle2IsLaunched && !circle1IsLaunched) {
                  const transferRatio = 0.8;
                  const retentionRatio = 0.4;
                  circle1.velocityX = circle2.velocityX * transferRatio;
                  circle1.velocityY = circle2.velocityY * transferRatio;
                  circle2.velocityX = -circle2.velocityX * retentionRatio;
                  circle2.velocityY = -circle2.velocityY * retentionRatio;
                } else {
                  // Default collision (both slow or both fast)
                  const bounceReduction = 0.6;
                  
                  if (movingCircle === circle1) {
                    circle1.velocityX = -circle1.velocityX * bounceReduction;
                    circle1.velocityY = -circle1.velocityY * bounceReduction;
                  } else {
                    circle2.velocityX = -circle2.velocityX * bounceReduction;
                    circle2.velocityY = -circle2.velocityY * bounceReduction;
                  }
                }
                
                // LINKED LIST LOGIC:
                let shouldConnect = false;
                let shouldDeleteCircle = null;
                let fromId = null;
                let toId = null;
                
                // Case 1: Two isolated circles - BUT only if no existing linked list exists
                if (circle1IsIsolated && circle2IsIsolated) {
                  if (!hasExistingLinkedList) {
                    shouldConnect = true;
                    fromId = circle1.id;
                    toId = circle2.id;
                    // ...existing code...
                  } else {
                    // Delete both circles if linked list already exists
                    shouldDeleteCircle = [circle1.id, circle2.id];
                    // ...existing code...
                  }
                }
                // Case 2: Hit head/tail with isolated circle - extend the list
                else if ((circle1IsHead || circle1IsTail) && circle2IsIsolated) {
                  shouldConnect = true;
                  if (circle1IsTail) {
                    // Extend from tail
                    fromId = circle1.id;
                    toId = circle2.id;
                  } else {
                    // Extend from head (add before head)
                    fromId = circle2.id;
                    toId = circle1.id;
                  }
                  // ...existing code...
                }
                else if ((circle2IsHead || circle2IsTail) && circle1IsIsolated) {
                  shouldConnect = true;
                  if (circle2IsTail) {
                    // Extend from tail
                    fromId = circle2.id;
                    toId = circle1.id;
                  } else {
                    // Extend from head (add before head)
                    fromId = circle1.id;
                    toId = circle2.id;
                  }
                  // ...existing code...
                }
                // Case 3: Hit head when list has 2+ circles - delete ONLY isolated new circle
                else if (totalConnections >= 1 && ((circle1IsHead && circle2IsIsolated) || (circle2IsHead && circle1IsIsolated))) {
                  shouldDeleteCircle = circle1IsHead ? circle2.id : circle1.id;
                  // ...existing code...
                }
                // Case 4: Hit middle node - delete ONLY isolated new circle  
                else if ((circle1IsMiddle && circle2IsIsolated) || (circle2IsMiddle && circle1IsIsolated)) {
                  shouldDeleteCircle = circle1IsMiddle ? circle2.id : circle1.id;
                  // ...existing code...
                }
                // Case 5: Two connected nodes colliding - BOUNCE ONLY (no deletion)
                else if (!circle1IsIsolated && !circle2IsIsolated) {
                  // Both circles are part of existing structures - just bounce, don't delete
                  // ...existing code...
                }
                // Default: No action (bounce only)
                else {
                  // ...existing code...
                }
                
                // Execute the decision
                if (shouldConnect) {
                  // Create connection
                  const newConnection = {
                    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    from: fromId,
                    to: toId
                  };
                  
                  // ...existing code...
                  
                  setConnections(prev => {
                    const updated = [...prev, newConnection];
                    // ...existing code...
                    return updated;
                  });
                } else if (shouldDeleteCircle) {
                  // Delete the specified circle(s)
                  if (Array.isArray(shouldDeleteCircle)) {
                    // Delete multiple circles
                    // ...existing code...
                    
                    setTimeout(() => {
                      setCircles(prev => prev.filter(c => !shouldDeleteCircle.includes(c.id)));
                    }, 100);
                  } else {
                    // Delete single circle
                    // ...existing code...
                    
                    setTimeout(() => {
                      setCircles(prev => prev.filter(c => c.id !== shouldDeleteCircle));
                    }, 100);
                  }
                }
                
                // Give the other circle a small push if it's stationary and not being deleted
                if (!shouldDeleteCircle) {
                  const otherCircle = circle1Moving ? circle2 : circle1;
                  const circle2MovingCheck = circle2Moving;
                  
                  setCircles(prev => prev.map(circle => {
                    if (circle.id === otherCircle.id && !circle2MovingCheck) {
                      return {
                        ...circle,
                        velocityX: movingCircle.velocityX * 0.3,
                        velocityY: movingCircle.velocityY * 0.3,
                        isLaunched: true,
                        launchTime: Date.now()
                      };
                    }
                    return circle;
                  }));
                }
              } else {
                // ...existing code...
              }
            }
          }
        }

        // Additional pass: Check for black hole collisions and remove affected circles
        let filteredCircles = finalCircles.filter(circle => {
          if (!circle || !circle.isLaunched) return true; // Keep non-launched circles

          // Check if circle is already connected in the linked list
          const connectedIds = findConnectedCircles(circle.id);
          const isConnected = connectedIds.length > 1; // More than itself means it's connected

          // Only allow deletion if NOT connected and within 3 seconds of launch
          if (!isConnected && circle.launchTime) {
            const timeSinceLaunch = Date.now() - circle.launchTime;
            const maxVulnerableTime = 3000; // 3 seconds in milliseconds
            if (timeSinceLaunch <= maxVulnerableTime) {
              for (const blackHole of blackHoles) {
                const dx = circle.x - blackHole.x;
                const dy = circle.y - blackHole.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= (20 + blackHole.radius)) {
                  // Only delete if not connected and within 3 seconds
                  return false;
                }
              }
            }
          }
          return true; // Keep this circle
        });

        return filteredCircles.filter(circle => circle !== null); // Remove null circles (fallback)
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
    findConnectedCircles,
    connections,
    currentExercise,
    suckedCircles,
    originalSubmission,
    currentEntryOrder,
    circles,
    headCircleId,
    tailCircleId,
    checkCircleCollision,
    createConnection,
    isHeadNode,
    isTailNode,
    getChainOrder,
    startChainSuction,
    blackHoles,
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

  // Auto-suction effect when portal opens - prioritize head nodes
  useEffect(() => {
    if (portalInfo.isVisible && circles.length > 0) {
      // Find head nodes and start chain suction from them
      const headNodes = circles.filter((circle) => isHeadNode(circle.id));
      
      if (headNodes.length > 0) {
        // Start chain suction from the first head node
        startChainSuction(headNodes[0].id);
      } else {
        // If no head nodes, just suck in all circles individually (fallback)
        circles.forEach((node, index) => {
          setTimeout(() => {
            setSuckingCircles((prev) => {
              if (!prev.includes(node.id)) {
                return [...prev, node.id];
              }
              return prev;
            });
          }, index * 200); // 200ms delay between each circle
        });
      }
    } else if (!portalInfo.isVisible) {
      setSuckingCircles([]);
    }
  }, [portalInfo.isVisible, circles, connections, isHeadNode, startChainSuction]);

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



  // Cannon circle event handlers - removed double-click editing for testing

  // Global right-click handler for launching circles
  const handleGlobalRightClick = useCallback((e) => {
    e.preventDefault(); // Prevent context menu
    
    
    // Launch circle from cannon if values are set
    if (cannonCircle.value && cannonCircle.address) {
      // Calculate launch position from cannon tip
      const cannonTipX = window.innerWidth + 40 - 35; // Cannon base X
      const cannonTipY = window.innerHeight - 1; // Cannon base Y
      
      // Calculate tip position based on cannon angle
      const tipDistance = 55; // Distance from base to tip
      const angleRad = (cannonAngle) * (Math.PI / 180);
      const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
      const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;
      
      // Calculate launch velocity based on cannon direction
      const launchSpeed = 6; // Pixels per frame - adjust this for faster/slower launch
      const velocityX = Math.sin(angleRad) * launchSpeed;
      const velocityY = -Math.cos(angleRad) * launchSpeed; // Negative because Y increases downward
      
      // Create new circle at cannon tip with launch velocity
      const newCircle = {
        id: Date.now(),
        x: tipX - 30, // Offset for circle radius
        y: tipY - 30,
        value: cannonCircle.value,
        address: cannonCircle.address,
        velocityX: velocityX,
        velocityY: velocityY,
        isLaunched: true, // Flag to indicate this circle was launched
        launchTime: Date.now(), // Track when it was launched
      };
      
      
      setCircles(prev => {
        // ...existing code...
        
        const newCircles = [...prev, newCircle];
        
        // If this is the first circle, make it head/tail
        if (prev.length === 0) {
          // ...existing code...
          setHeadCircleId(newCircle.id);
          setTailCircleId(newCircle.id);
        }
        
  return newCircles;
      });
      
      // Do NOT randomize cannonCircle after launch; keep the selected value/address
    } else {
  // ...existing code...
    }
  }, [cannonCircle, cannonAngle]);

  useEffect(() => {
    const handleMouseMoveGlobal = (e) => {
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
              if (distance < circleRadius * 2) {
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
  }, [draggedCircle, dragOffset, findConnectedCircles, circles, handleGlobalRightClick]);

  // Helper: Get current linked list structure as array of {value, address}
  const getCurrentLinkedList = useCallback(() => {
    // Find head node (no incoming connection)
    const head = circles.find(c => !connections.some(conn => conn.to === c.id));
    if (!head) return [];
    // Traverse from head using outgoing connections
    const result = [];
    let current = head;
    const visited = new Set();
    while (current && !visited.has(current.id)) {
      result.push({ value: current.value, address: current.address });
      visited.add(current.id);
      const nextConn = connections.find(conn => conn.from === current.id);
      current = nextConn ? circles.find(c => c.id === nextConn.to) : null;
    }
    return result;
  }, [circles, connections]);

  // Check for level completion after every connection/circle update
  useEffect(() => {
    if (!currentExercise) return;
    const expected = (currentExercise.expectedStructure || []).map(n => ({ value: n.value.toString(), address: n.address }));
    const actual = getCurrentLinkedList();
    // Compare arrays
    const isMatch = expected.length === actual.length && expected.every((node, i) => node.value === actual[i]?.value && node.address === actual[i]?.address);
    if (isMatch) {
      if (currentExerciseNumber < totalExercises) {
        setShowLevelCompleteModal(true);
      } else {
        setShowAllCompletedModal(true);
      }
    }
  }, [circles, connections, currentExercise, getCurrentLinkedList, currentExerciseNumber, totalExercises]);

  // Handler for Continue button
  const handleLevelContinue = () => {
    // Advance to next exercise if possible
    if (currentExerciseNumber < totalExercises) {
      setShowLevelCompleteModal(false);
      const nextKey = EXERCISE_KEYS[currentExerciseNumber];
      loadExercise(nextKey);
    } else {
      // All exercises completed: skip level complete modal for last exercise
      setShowLevelCompleteModal(false);
      setShowAllCompletedModal(true);
    }
  };

  // Update currentExercise when exerciseKey changes
  useEffect(() => {
    // Update currentExercise when exerciseKey changes
    const exercise = exerciseManagerRef.current.getCurrentExercise(exerciseKey);
    setCurrentExercise(exercise);
  }, [exerciseKey]);

  // Black hole repositioning timer - every 20 seconds
  useEffect(() => {
    const repositionBlackHoles = () => {
      setBlackHoles(generateBlackHoles());
    };

    // Initial positioning
    repositionBlackHoles();

    // Set up interval for repositioning every 20 seconds
    const interval = setInterval(repositionBlackHoles, Math.random() * 5000 + 5000); // Random interval between 5-10 seconds

    return () => clearInterval(interval);
  }, [generateBlackHoles]); // Include generateBlackHoles dependency

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
      >
        <source src="./video/bubble_bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      

      {/* Exercise progress indicator (top right) */}
      <div className={styles.exerciseProgressIndicator}>
        {currentExerciseNumber}/{totalExercises}
      </div>

      {/* Expected results bar */}
      {currentExercise && currentExercise.expectedStructure && (
        <div className={styles.expectedBarWrapper}>
          <table className={styles.expectedBarTable}>
            <tbody>
              <tr className={styles.expectedBarRow}>
                {currentExercise.expectedStructure.map((node, idx) => (
                  <React.Fragment key={node.address}>
                    <td className={styles.expectedBarCell}>
                      <div className={styles.expectedBarCircle}>
                        <div className={styles.expectedBarValue}>
                          {node.value}
                        </div>
                        <div className={styles.expectedBarAddress}>
                          {node.address}
                        </div>
                      </div>
                    </td>
                    {idx < currentExercise.expectedStructure.length - 1 && (
                      <td className={styles.expectedBarArrowCell}>
                        <span className={styles.expectedBarArrow}>→</span>
                      </td>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showInstructionPopup && (
          <TutorialScene 
            scene="scene1" 
            onContinue={startExercise}
          />
        )}

      {/* Portal particles for vacuum effect */}
      <PortalParticles 
        portalInfo={portalInfo} 
      />
      <PortalComponent
        onPortalStateChange={handlePortalStateChange}
        isOpen={isPortalOpen}
      />

      
      
      <div 
        className={styles.rightSquare} 
        style={{ 
          outlineOffset: "5px",
          transform: `rotate(${cannonAngle}deg)`,
          transformOrigin: "bottom center"
        }} 
      >
        {/* Cannon Circle */}
        <div 
          className={styles.cannonCircle}
          onClick={handleCannonClick}
          style={{ cursor: 'pointer' }}
        >
          <span style={{ fontSize: '10px' }}>
            {cannonCircle.value}
          </span>
          <span style={{ fontSize: '8px' }}>
            {cannonCircle.address}
          </span>
        </div>
      </div>

      {circles.map((circle) => {
        const label = getCircleLabel(circle.id);
        return (
          <div
            key={circle.id}
            className={`${styles.animatedCircle} ${
              suckingCircles.includes(circle.id) ? styles.beingSucked : ""
            }`}
            style={{
              left: `${circle.x - 30}px`,
              top: `${circle.y - 30}px`,
              cursor: circle.isLaunched 
                ? "default" 
                : (draggedCircle && circle.id === draggedCircle.id
                  ? "grabbing"
                  : "grab"),
              opacity: circle.isLaunched ? 0.9 : 1, // Slightly transparent for launched circles
              boxShadow: circle.isLaunched 
                ? "0 0 15px rgba(255, 255, 0, 0.6)" 
                : "0 4px 8px rgba(0, 0, 0, 0.3)", // Yellow glow for launched circles
            }}
            onMouseDown={(e) => handleMouseDown(e, circle)}
            // Double click disabled
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

      {/* Black holes for challenge */}
      {blackHoles.map((blackHole) => (
        <div
          key={blackHole.id}
          style={{
            position: 'absolute',
            left: `${blackHole.x - blackHole.radius}px`,
            top: `${blackHole.y - blackHole.radius}px`,
            width: `${blackHole.radius * 2}px`,
            height: `${blackHole.radius * 2}px`,
            borderRadius: '50%',
            backgroundColor: '#000',
            border: '4px solid #ff0000',
            boxShadow: '0 0 30px rgba(255, 0, 0, 1), inset 0 0 30px rgba(255, 0, 0, 0.5)',
            zIndex: 10,
            animation: 'blackHolePulse 2s infinite ease-in-out',
          }}
        />
      ))}

      <svg className={styles.connectionLines}>
        {(() => {
          return connections.map((connection) => {
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
            
            // ...existing code...
            
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
          });
        })()}
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
      {/* Validation Result Overlay */}
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

            {/* Debug: Show raw validationResult object */}
            {/* <div
              style={{
                color: "#aaa",
                fontSize: "12px",
                marginBottom: "10px",
                wordBreak: "break-all",
              }}
            >
              <strong>Debug validationResult:</strong>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  background: "#222",
                  color: "#eee",
                  padding: "6px",
                  borderRadius: "4px",
                }}
              >
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </div> */}

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
                          validated && validated.length > 0
                            ? validated
                            : suckedCirclesRef.current || [];
                        return currentExercise.expectedStructure.map(
                          (expectedNode, index) => {
                            const userNode = userOrder[index];
                            const isCorrect =
                              userNode &&
                              parseInt(userNode.value) ===
                                parseInt(expectedNode.value);
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
                  if (
                    validationResult &&
                    validationResult.isCorrect &&
                    exerciseKey === "exercise_one"
                  ) {
                    loadExercise("exercise_two");
                  } else if (
                    validationResult &&
                    validationResult.isCorrect &&
                    exerciseKey === "exercise_two"
                  ) {
                    loadExercise("exercise_tree");
                  }
                }}
                className={styles.continueButton}
              >
                {validationResult &&
                validationResult.isCorrect &&
                exerciseKey === "exercise_one"
                  ? "NEXT EXERCISE"
                  : validationResult &&
                    validationResult.isCorrect &&
                    exerciseKey === "exercise_two"
                  ? "NEXT EXERCISE"
                  : "CONTINUE"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Bullet Selection Modal */}
      {showBulletModal && (
        <div className={styles.popupOverlay} onClick={closeBulletModal}>
          <div
            className={styles.bulletModalContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1a1a',
              border: '3px solid #fff',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >

            <h2 style={{ 
              color: '#fff', 
              textAlign: 'center', 
              marginBottom: '30px',
              fontSize: '24px'
            }}>
              Choose Bullet
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '15px',
              justifyItems: 'center'
            }}>
              {bulletOptions.map((bullet) => (
                <div
                  key={bullet.id}
                  onClick={() => handleBulletSelect(bullet)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#d3d3d3',
                    border: '2px solid #bbb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                   
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>
                    {bullet.value}
                  </span>
                  <span style={{ fontSize: '10px', lineHeight: 1, color: '#333' }}>
                    {bullet.address}
                                   </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {showLevelCompleteModal && currentExerciseNumber < totalExercises && (
        <div className={styles.popupOverlay}>
          <div className={styles.bulletModalContent} style={{ backgroundColor: '#1a1a1a', border: '3px solid #ff00ff', borderRadius: '15px', padding: '30px', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '20px' }}>
              Level Complete: {currentExerciseNumber}/{totalExercises}
            </h2>
            <button
              style={{
                background: 'none',
                border: '2px solid #ff00ff',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                padding: '10px 30px',
                cursor: 'pointer',
                marginTop: '20px',
              }}
              onClick={handleLevelContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* All Exercises Completed Modal */}
      {showAllCompletedModal && (
        <div className={styles.popupOverlay}>
          <div className={styles.bulletModalContent} style={{ backgroundColor: '#000', border: '2px solid #fff', borderRadius: '15px', padding: '40px', maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '30px' }}>
              Linking Nodes Completed
            </h2>
            <button
              style={{
                background: 'none',
                border: '2px solid #fff',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                padding: '10px 30px',
                cursor: 'pointer',
                marginTop: '20px',
              }}
              onClick={handleGoBack}
            >
              Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
                
export default GalistGameLinkingNode;
