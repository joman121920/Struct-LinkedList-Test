// --- Add refs to reliably track entry order and sucked circles ---

import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./Competitive.module.css";
import { ExerciseManager, getRandomInitialNodes } from "./CompetitiveExercise.js";
import Collectibles from './Collectibles.jsx';
import CompetitiveInstruction from './CompetitiveInstruction.jsx';
import { collisionDetection } from "../../CollisionDetection.js";
// Portal visual components removed
// Tutorial removed: import kept out intentionally

function CompetitiveMode() {
  // Instruction modal state
  const [showInstructionPopup, setShowInstructionPopup] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [collectiblesEnabled, setCollectiblesEnabled] = useState(false);
  
  // Tutorial removed
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
  // setPortalInfo can be used directly to update portal visibility or size

  // Exercise system states
  const exerciseManagerRef = useRef(new ExerciseManager());
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  // Tutorial removed

  // Insertion mode: 'left' = insert before touched node, 'right' = insert after touched node
  const [insertionMode, setInsertionMode] = useState('right');

  // Timer for the challenge (2 minutes)
  const [timerSeconds, setTimerSeconds] = useState(120); // total seconds remaining
  const [timerRunning, setTimerRunning] = useState(false);
  const [showMissionFailed, setShowMissionFailed] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null); // Track when the game actually starts
  const [finalSurvivalTime, setFinalSurvivalTime] = useState(0); // Store final survival time when game ends

  // Countdown effect
  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          setTimerRunning(false);
          // Capture final survival time when game ends
          if (gameStartTime) {
            const survivalTimeMs = Date.now() - gameStartTime;
            setFinalSurvivalTime(Math.floor(survivalTimeMs / 1000));
          }
          setShowMissionFailed(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, gameStartTime]);

  // Cannon angle state for dynamic cannon rotation
  const [cannonAngle, setCannonAngle] = useState(0);

  // Cannon circle states - initialize with random values for testing
  const [cannonCircle, setCannonCircle] = useState({ 
    value: Math.floor(Math.random() * 100).toString(), 
    address: Math.floor(Math.random() * 1000).toString() 
  });


  const [headCircleId, setHeadCircleId] = useState(null);
  const [tailCircleId, setTailCircleId] = useState(null);

  // Bullet selection modal states
  const [showBulletModal, setShowBulletModal] = useState(false);
  const [bulletOptions, setBulletOptions] = useState([]);

  // Level completion modal state
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);

  // Points system states
  const [totalPoints, setTotalPoints] = useState(0);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(null); // Track when each round starts

  // Collectible collision states
  const [collectibles, setCollectibles] = useState([]);
  const [collectibleCollisions, setCollectibleCollisions] = useState([]);

  // Bomb defusing system states
  const [bombNode, setBombNode] = useState(null); // The node that will explode
  const [bombCountdown, setBombCountdown] = useState(0); // Countdown in seconds
  const [showDefuseModal, setShowDefuseModal] = useState(false);
  const [defuseNodes, setDefuseNodes] = useState([]); // Nodes to sort in defuse modal
  const [selectedDefuseNodes, setSelectedDefuseNodes] = useState([]); // Selected nodes for swapping
  const [defuseProgressCountdown, setDefuseProgressCountdown] = useState(0); // 3-minute countdown for checking
  const [isBombDefused, setIsBombDefused] = useState(false); // Success state
  const bombTimerRef = useRef(null);
  const bombSpawnTimerRef = useRef(null);
  const defuseProgressTimerRef = useRef(null);
  const performDeleteRef = useRef(null);
  
  // Notification system for wrong quiz answers
  const [showWrongAnswerNotification, setShowWrongAnswerNotification] = useState(false);
  const [showBombBlockingNotification, setShowBombBlockingNotification] = useState(false);
  
  // Quiz modal state from collectibles
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Wrap setters in useCallback to prevent unnecessary re-renders
  const setCollectiblesCallback = useCallback((updater) => {
    setCollectibles(updater);
  }, []);

  // Bomb defusing system functions
  const spawnBombNode = useCallback(() => {
    // Get all non-initial circles that are connected in the linked list
    const eligibleNodes = circles.filter(circle => 
      !circle.isInitial && 
      circle.isLaunched && 
      connections.some(conn => conn.from === circle.id || conn.to === circle.id)
    );
    
    if (eligibleNodes.length === 0) return;
    
    // Select random node
    const randomNode = eligibleNodes[Math.floor(Math.random() * eligibleNodes.length)];
    setBombNode(randomNode);
    setBombCountdown(30); // 30 seconds to defuse
    
    console.log(`Bomb spawned on node ${randomNode.id} with value ${randomNode.value}`);
    
    // Start countdown timer - capture the bomb node ID
    const bombNodeId = randomNode.id;
    bombTimerRef.current = setInterval(() => {
      setBombCountdown(prev => {
        if (prev <= 1) {
          // Bomb explodes - delete the node
          clearInterval(bombTimerRef.current);
          setBombNode(null);
          setBombCountdown(0);
          // Delete the bomb node instead of game over
          performDeleteRef.current?.(bombNodeId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [circles, connections]);

  const setCollisionCallback = useCallback((updater) => {
    setCollectibleCollisions(updater);
  }, []);

  // Generate random linked list for defuse modal
  const generateDefuseChallenge = useCallback(() => {
    const nodeCount = 5; // Always 5 nodes for sorting challenge
    const nodes = [];
    const usedValues = new Set();
    
    // Generate 5 unique random values between 10-99
    while (nodes.length < nodeCount) {
      const value = Math.floor(Math.random() * 90) + 10;
      if (!usedValues.has(value)) {
        usedValues.add(value);
        nodes.push({
          id: `defuse_${nodes.length}`,
          value: value.toString(),
          address: `0x${(100 + nodes.length * 100).toString(16).toUpperCase()}`,
          position: nodes.length, // Track original position
          isDefuseNode: true
        });
      }
    }
    
    // Shuffle the values to randomize their initial order
    const values = nodes.map(n => ({ value: n.value, address: n.address }));
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    
    // Assign shuffled values back to nodes
    nodes.forEach((node, index) => {
      node.value = values[index].value;
      node.address = values[index].address;
    });
    
    return nodes;
  }, []);

  // Check if defuse challenge is solved (nodes in ascending order)
  const checkDefuseSolution = useCallback(() => {
    // Sort by position and check if values are in ascending order
    const sortedByPosition = [...defuseNodes].sort((a, b) => a.position - b.position);
    const values = sortedByPosition.map(node => parseInt(node.value));
    
    // Check if values are in ascending order
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        return false;
      }
    }
    return true;
  }, [defuseNodes]);

  // Handle successful defuse
  const handleDefuseSuccess = useCallback(() => {
    // Clear bomb timer
    if (bombTimerRef.current) {
      clearInterval(bombTimerRef.current);
      bombTimerRef.current = null;
    }
    
    // Clear progress timer
    if (defuseProgressTimerRef.current) {
      clearInterval(defuseProgressTimerRef.current);
      defuseProgressTimerRef.current = null;
    }
    
    // Reset bomb states
    setBombNode(null);
    setBombCountdown(0);
    setShowDefuseModal(false);
    setDefuseNodes([]);
    setSelectedDefuseNodes([]);
    setDefuseProgressCountdown(0);
    setIsBombDefused(false);
    
    console.log('Bomb defused successfully! Node saved from deletion.');
  }, []);

  // Start 3-second countdown when solution is correct
  const startDefuseCountdown = useCallback(() => {
    setIsBombDefused(true);
    setDefuseProgressCountdown(3); // 3 seconds
    
    // Start timer immediately to prevent delay
    defuseProgressTimerRef.current = setInterval(() => {
      setDefuseProgressCountdown(prev => {
        if (prev <= 1) {
          clearInterval(defuseProgressTimerRef.current);
          defuseProgressTimerRef.current = null;
          handleDefuseSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleDefuseSuccess]);

  // Handle node click in defuse modal
  const handleDefuseNodeClick = useCallback((node) => {
    setSelectedDefuseNodes(prev => {
      if (prev.find(n => n.id === node.id)) {
        // Deselect if already selected
        return prev.filter(n => n.id !== node.id);
      } else if (prev.length === 0) {
        // Select first node
        return [node];
      } else if (prev.length === 1) {
        // Second node clicked - immediately swap and clear selection
        const [firstNode] = prev;
        
        // Swap the values and addresses
        setDefuseNodes(current => 
          current.map(n => {
            if (n.id === firstNode.id) {
              return { ...n, value: node.value, address: node.address };
            } else if (n.id === node.id) {
              return { ...n, value: firstNode.value, address: firstNode.address };
            }
            return n;
          })
        );
        
        // Check if solution is correct after swap
        setTimeout(() => {
          if (checkDefuseSolution()) {
            startDefuseCountdown();
          }
        }, 100);
        
        return []; // Clear selection after swap
      }
      return prev;
    });
  }, [checkDefuseSolution, startDefuseCountdown]);

  // Check solution immediately when defuse modal opens or nodes change
  useEffect(() => {
    if (showDefuseModal && defuseNodes.length > 0 && !isBombDefused && defuseProgressCountdown === 0) {
      if (checkDefuseSolution()) {
        startDefuseCountdown();
      }
    }
  }, [showDefuseModal, defuseNodes, checkDefuseSolution, startDefuseCountdown, isBombDefused, defuseProgressCountdown]);

  // Convert a regular node into a bomb node (for wrong quiz answers)
  const createBombFromNode = useCallback((targetNode) => {
    if (!targetNode) {
      console.log('No target node provided for bomb creation');
      return;
    }
    
    // Clear any existing bomb timer first
    if (bombTimerRef.current) {
      clearInterval(bombTimerRef.current);
      bombTimerRef.current = null;
    }
    
    console.log(`Converting node ${targetNode.id} with value ${targetNode.value} into a bomb`);
    
    // Set this node as the bomb node
    setBombNode(targetNode);
    setBombCountdown(30); // 5 seconds to defuse
    
    // Start countdown timer - capture the bomb node ID
    const bombNodeId = targetNode.id;
    bombTimerRef.current = setInterval(() => {
      setBombCountdown(prev => {
        if (prev <= 1) {
          // Bomb explodes - delete the node
          clearInterval(bombTimerRef.current);
          setBombNode(null);
          setBombCountdown(0);
          // Delete the bomb node instead of game over
          performDeleteRef.current?.(bombNodeId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);



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

  // Handle collectible pickup effects (delta seconds: +30 or -45 etc.)
  const handleCollect = useCallback((deltaSeconds) => {
    setTimerSeconds((s) => Math.max(0, (s || 0) + (deltaSeconds || 0)));
    if ((deltaSeconds || 0) > 0) setTimerRunning(true);
  }, []);

  // Handle quiz modal state changes
  const handleQuizModalChange = useCallback((isOpen) => {
    setShowQuizModal(isOpen);
  }, []);
  
  // Handle wrong quiz answers by creating bomb nodes
  const handleWrongQuizAnswer = useCallback(() => {
    // Get all eligible nodes (non-initial, connected nodes)
    const eligibleNodes = circles.filter(circle => 
      !circle.isInitial && 
      circle.isLaunched && 
      connections.some(conn => conn.from === circle.id || conn.to === circle.id)
    );
    
    if (eligibleNodes.length === 0) {
      console.log('No eligible nodes to convert to bomb');
      return;
    }
    
    // Select random eligible node
    const randomNode = eligibleNodes[Math.floor(Math.random() * eligibleNodes.length)];
    
    // Show notification about wrong answer and bomb creation
    setShowWrongAnswerNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowWrongAnswerNotification(false);
    }, 3000);
    
    // Convert it to a bomb node
    createBombFromNode(randomNode);
    
    console.log(`Wrong quiz answer! Node ${randomNode.id} (value: ${randomNode.value}) is now a bomb!`);
  }, [circles, connections, createBombFromNode]);

  // Instruction handlers
  const startExercise = useCallback(() => {
    setShowInstructionPopup(false);
    setIsGameStarted(true);
    
    // Reset game state
    setTimerSeconds(120); // Reset to 2 minutes
    setTimerRunning(true); // Start the timer
    setShowMissionFailed(false);
    setShowValidationResult(false);
    setValidationResult(null);
    
    // Start timing for the game and first round
    const startTime = Date.now();
    setGameStartTime(startTime);
    setRoundStartTime(startTime);
    

    
    // Disable collectibles initially, then enable after delay
    setCollectiblesEnabled(false);
    setTimeout(() => {
      setCollectiblesEnabled(true);
    }, 5000); // 5 second delay for collectibles
    
    // Load exercise will be called after this function is defined
  }, []);

  const closeInstructionPopup = useCallback(() => {
    setShowInstructionPopup(false);
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

  // Bomb spawning system - spawn bomb every 15-25 seconds during gameplay
  useEffect(() => {
    if (!isGameStarted || showMissionFailed || !timerRunning) return;
    
    const spawnBomb = () => {
      if (!bombNode && circles.length > 2) { // Only spawn if no active bomb and enough circles
        spawnBombNode();
      }
      
      // Schedule next bomb spawn (15-25 seconds)
      const nextSpawnDelay = (Math.random() * 10 + 15) * 1000;
      bombSpawnTimerRef.current = setTimeout(spawnBomb, nextSpawnDelay);
    };
    
    // Initial bomb spawn after 10-15 seconds
    const initialDelay = (Math.random() * 5 + 10) * 1000;
    bombSpawnTimerRef.current = setTimeout(spawnBomb, initialDelay);
    
    return () => {
      if (bombSpawnTimerRef.current) {
        clearTimeout(bombSpawnTimerRef.current);
      }
    };
  }, [isGameStarted, showMissionFailed, timerRunning, bombNode, circles.length, spawnBombNode]);

  // Clean up bomb timers when game ends
  useEffect(() => {
    if (showMissionFailed) {
      if (bombTimerRef.current) {
        clearInterval(bombTimerRef.current);
        bombTimerRef.current = null;
      }
      if (bombSpawnTimerRef.current) {
        clearTimeout(bombSpawnTimerRef.current);
        bombSpawnTimerRef.current = null;
      }
      setBombNode(null);
      setBombCountdown(0);
    }
  }, [showMissionFailed]);

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
  //   // tutorial removed
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
      setPortalInfo((prev) => ({ ...prev, isVisible: false }));
  // tutorial removed
        // Reset head/tail state
        setHeadCircleId(null);
        setTailCircleId(null);
      }
      // applyNavigationState(st);
    };
    window.addEventListener("popstate", onPopState);

    // Wheel handler: scroll up -> left mode, scroll down -> right mode
    const handleWheel = (ev) => {
      if (Math.abs(ev.deltaY) < 1) return;
      if (ev.deltaY < 0) setInsertionMode('left');
      else setInsertionMode('right');
    };
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener('wheel', handleWheel);
    };
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

  const loadExercise = useCallback((key = "exercise_one", launchInitial = false) => {
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

    // Generate between 1 and 3 initial circle(s) drawn from the exercise sequence
    const templateInit = getRandomInitialNodes(
      exercise.sequence || [],
      exercise.addresses || {},
      { min: 1, max: 3 }
    );
  if (templateInit && templateInit.length > 0) {
      // Create UI circle objects spaced horizontally and set up sequential connections
      const centerY = Math.floor(window.innerHeight / 2);
      const spacing = Math.max(100, Math.floor(window.innerWidth / (templateInit.length + 2)));
      const startX = 120;

      const uiCircles = templateInit.map((node, idx) => ({
        id: `initial_${key}_${node.id}`,
        x: startX + idx * spacing,
        y: centerY,
        value: node.value.toString(),
        address: node.address,
        velocityX: 0,
        velocityY: 0,
        isLaunched: false,
        isInitial: true,
      }));

      const uiConnections = [];
      for (let i = 0; i < uiCircles.length - 1; i++) {
        uiConnections.push({
          id: `${Date.now()}_${i}`,
          from: uiCircles[i].id,
          to: uiCircles[i + 1].id,
        });
      }

      setCircles(uiCircles);
      if (launchInitial) {
        // Promote the first template node to a launched protected initial
        const firstId = uiCircles[0].id;
        setTimeout(() => {
          setCircles((prev) =>
            (prev || []).map((c) =>
              c && c.id === firstId
                ? {
                    ...c,
                    isLaunched: true,
                    velocityX: 4,
                    velocityY: 0,
                    launchTime: Date.now(),
                    x: 120,
                    y: centerY,
                  }
                : c
            )
          );
        }, 20);
      }
      setConnections(uiConnections);
      if (uiCircles.length > 0) {
        setHeadCircleId(uiCircles[0].id);
        setTailCircleId(uiCircles[uiCircles.length - 1].id);
      }
    }
  }, []);

  
  // spawnInitialCircle removed - promotion handled via loadExercise(, launchInitial=true)

  // startExercise removed; use loadExercise() or handleRetry() to begin an exercise
  
  // Handle retry from mission failed overlay: reset level state and restart without tutorial
  const handleRetry = useCallback(() => {
    // Clear runtime state
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    setSuckedCircles([]);
    setCurrentEntryOrder([]);
    entryOrderRef.current = [];
    suckedCirclesRef.current = [];
    setOriginalSubmission(null);
    setValidationResult(null);
    setShowValidationResult(false);
  // tutorial removed
    // Reset points to zero
    setTotalPoints(0);
    
    // Restart exercise and timer
    setTimerSeconds(120);
    setTimerRunning(true);
    setShowMissionFailed(false);
    
    // Reset game start time and survival time for accurate time tracking
    setGameStartTime(Date.now());
    setFinalSurvivalTime(0);
    

    
    // Reset and delay collectibles
    setCollectiblesEnabled(false);
    setTimeout(() => {
      setCollectiblesEnabled(true);
    }, 5000); // 5 second delay for collectibles
    // Reload the current exercise and request promotion/launch of its template initial
    loadExercise(exerciseKey, true);
    // Ensure an initial launched circle exists after load (promote or create if needed)
    setTimeout(() => {
      setCircles((prev) => {
        const existing = prev || [];
        // If there's already an initial that is launched, keep it
        if (existing.some((c) => c && c.isInitial && c.isLaunched)) return existing;
        // If there's a template initial, promote the first one
        const templateIdx = existing.findIndex((c) => c && c.isInitial && !c.isLaunched);
        if (templateIdx >= 0) {
          return existing.map((c, i) =>
            i === templateIdx
              ? { ...c, isLaunched: true, velocityX: 4, velocityY: 0, launchTime: Date.now(), x: 120, y: Math.floor(window.innerHeight / 2) }
              : c
          );
        }
        // Otherwise append a fresh initial launched circle
        const initialCircle = {
          id: `initial_${Date.now()}`,
          x: 120,
          y: Math.floor(window.innerHeight / 2),
          value: (Math.floor(Math.random() * 100) + 1).toString(),
          address: `init${Math.floor(Math.random() * 900) + 100}`,
          velocityX: 4,
          velocityY: 0,
          isLaunched: true,
          isInitial: true,
          launchTime: Date.now(),
        };
        return [initialCircle, ...existing];
      });
    }, 60);
  }, [loadExercise, exerciseKey]);

  // Initialize with basic exercise if none loaded (but only if game has started)
  useEffect(() => {
    if (!currentExercise && !showInstructionPopup) {
      loadExercise();
    }
  }, [currentExercise, loadExercise, showInstructionPopup]);

  // Load exercise with initial circles when game starts
  useEffect(() => {
    if (isGameStarted && !currentExercise) {
      loadExercise("exercise_one", true);
    }
  }, [isGameStarted, currentExercise, loadExercise]);

  // (Removed duplicate spawnInitialCircle - definition moved above to avoid temporal dead zone)

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

          return circle;
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
                // SPECIAL CASE: Check for manually designated head/tail (for single node scenarios)
                const circle1IsManualHeadTail = (headCircleId === circle1.id && tailCircleId === circle1.id);
                const circle2IsManualHeadTail = (headCircleId === circle2.id && tailCircleId === circle2.id);
                
                const circle1IsHead = (circle1HasOutgoing && !circle1HasIncoming) || 
                                     (circle1IsManualHeadTail) || 
                                     (headCircleId === circle1.id && !circle1HasIncoming);
                const circle1IsTail = (circle1HasIncoming && !circle1HasOutgoing) || 
                                      (circle1IsManualHeadTail) || 
                                      (tailCircleId === circle1.id && !circle1HasOutgoing);
                const circle1IsMiddle = circle1HasIncoming && circle1HasOutgoing;
                const circle1IsIsolated = !circle1HasIncoming && !circle1HasOutgoing && !circle1IsManualHeadTail;
                
                const circle2IsHead = (circle2HasOutgoing && !circle2HasIncoming) || 
                                     (circle2IsManualHeadTail) || 
                                     (headCircleId === circle2.id && !circle2HasIncoming);
                const circle2IsTail = (circle2HasIncoming && !circle2HasOutgoing) || 
                                      (circle2IsManualHeadTail) || 
                                      (tailCircleId === circle2.id && !circle2HasOutgoing);
                const circle2IsMiddle = circle2HasIncoming && circle2HasOutgoing;
                const circle2IsIsolated = !circle2HasIncoming && !circle2HasOutgoing && !circle2IsManualHeadTail;
                
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
                  // existingNode = circle1, newNode = circle2
                  const existingNode = circle1;
                  const newNode = circle2;
                  const newNodeIsLaunched = !!newNode.isLaunched;

                  if (newNodeIsLaunched) {
                    // SPECIAL CASE: Single head/tail node (no existing connections)
                    const isSingleHeadTailNode = (headCircleId === existingNode.id && tailCircleId === existingNode.id);
                    
                    if (isSingleHeadTailNode) {
                      // For single head/tail node, create first connection
                      setConnections(prev => {
                        const newConnection = { 
                          id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, 
                          from: insertionMode === 'right' ? existingNode.id : newNode.id, 
                          to: insertionMode === 'right' ? newNode.id : existingNode.id 
                        };
                        return [...prev, newConnection];
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));
                      
                      // Update head/tail IDs for the new 2-node chain
                      if (insertionMode === 'right') {
                        setHeadCircleId(existingNode.id); // existing stays head
                        setTailCircleId(newNode.id);      // new becomes tail
                      } else {
                        setHeadCircleId(newNode.id);      // new becomes head
                        setTailCircleId(existingNode.id); // existing becomes tail
                      }
                      
                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    } else if (insertionMode === 'right') {
                      // Insert AFTER existingNode: rewire existing->newNode and newNode->oldNext
                      const oldNextConn = connections.find(conn => conn.from === existingNode.id);
                      const oldNextId = oldNextConn ? oldNextConn.to : null;

                      setConnections(prev => {
                        // Remove existing->oldNext if present
                        let updated = prev.filter(c => !(c.from === existingNode.id && c.to === oldNextId));
                        // Add existing -> newNode
                        updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: existingNode.id, to: newNode.id });
                        // If there was an old next, connect newNode -> oldNext
                        if (oldNextId) {
                          updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: newNode.id, to: oldNextId });
                        }
                        return updated;
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));
                      if (!oldNextId) setTailCircleId(newNode.id);
                      setHeadCircleId(prev => prev || existingNode.id);
                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    } else {
                      // insertionMode === 'left' -> insert BEFORE existingNode: rewire incoming -> newNode -> existing
                      const incomingConn = connections.find(conn => conn.to === existingNode.id);
                      const incomingFrom = incomingConn ? incomingConn.from : null;

                      setConnections(prev => {
                        let updated = prev.filter(c => !(incomingConn && c.from === incomingFrom && c.to === existingNode.id));
                        if (incomingFrom) {
                          updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: incomingFrom, to: newNode.id });
                        }
                        updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: newNode.id, to: existingNode.id });
                        return updated;
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));
                      if (!incomingConn) setHeadCircleId(newNode.id);
                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    }
                  } else {
                    shouldDeleteCircle = newNode.id;
                  }
                }
                else if ((circle2IsHead || circle2IsTail) && circle1IsIsolated) {
                  // existingNode = circle2, newNode = circle1
                  const existingNode = circle2;
                  const newNode = circle1;
                  const newNodeIsLaunched = !!newNode.isLaunched;

                  if (newNodeIsLaunched) {
                    // SPECIAL CASE: Single head/tail node (no existing connections)
                    const isSingleHeadTailNode = (headCircleId === existingNode.id && tailCircleId === existingNode.id);
                    
                    if (isSingleHeadTailNode) {
                      // For single head/tail node, create first connection
                      setConnections(prev => {
                        const newConnection = { 
                          id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, 
                          from: insertionMode === 'right' ? existingNode.id : newNode.id, 
                          to: insertionMode === 'right' ? newNode.id : existingNode.id 
                        };
                        return [...prev, newConnection];
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));
                      
                      // Update head/tail IDs for the new 2-node chain
                      if (insertionMode === 'right') {
                        setHeadCircleId(existingNode.id); // existing stays head
                        setTailCircleId(newNode.id);      // new becomes tail
                      } else {
                        setHeadCircleId(newNode.id);      // new becomes head
                        setTailCircleId(existingNode.id); // existing becomes tail
                      }
                      
                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    } else if (insertionMode === 'right') {
                      const oldNextConn = connections.find(conn => conn.from === existingNode.id);
                      const oldNextId = oldNextConn ? oldNextConn.to : null;

                      setConnections(prev => {
                        let updated = prev.filter(c => !(c.from === existingNode.id && c.to === oldNextId));
                        updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: existingNode.id, to: newNode.id });
                        if (oldNextId) {
                          updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: newNode.id, to: oldNextId });
                        }
                        return updated;
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));
                      if (!oldNextId) setTailCircleId(newNode.id);
                      setHeadCircleId(prev => prev || existingNode.id);
                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    } else {
                      const incomingConn = connections.find(conn => conn.to === existingNode.id);
                      const incomingFrom = incomingConn ? incomingConn.from : null;

                      setConnections(prev => {
                        let updated = prev.filter(c => !(incomingConn && c.from === incomingFrom && c.to === existingNode.id));
                        if (incomingFrom) {
                          updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: incomingFrom, to: newNode.id });
                        }
                        updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: newNode.id, to: existingNode.id });
                        return updated;
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));
                      if (!incomingConn) setHeadCircleId(newNode.id);
                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    }
                  } else {
                    shouldDeleteCircle = newNode.id;
                  }
                }
                // Case 3: Hit head when list has 2+ circles - delete ONLY isolated new circle
                else if (totalConnections >= 1 && ((circle1IsHead && circle2IsIsolated) || (circle2IsHead && circle1IsIsolated))) {
                  shouldDeleteCircle = circle1IsHead ? circle2.id : circle1.id;
                  // ...existing code...
                }
                // Case 4: Hit middle node - if a freshly launched isolated circle hits a middle node,
                // treat this as an insertion: insert the new circle AFTER the hit node instead of deleting it.
                else if ((circle1IsMiddle && circle2IsIsolated) || (circle2IsMiddle && circle1IsIsolated)) {
                  const existingNode = circle1IsMiddle ? circle1 : circle2; // node that's part of list
                  const newNode = circle1IsMiddle ? circle2 : circle1; // isolated/new circle

                  // Only perform insertion when the isolated circle was launched (player shot it)
                  const newNodeIsLaunched = !!newNode.isLaunched;

                  if (newNodeIsLaunched) {
                    // Find the existing outgoing connection (if any)
                    const oldNextConn = connections.find(conn => conn.from === existingNode.id);
                    const oldNextId = oldNextConn ? oldNextConn.to : null;

                    if (insertionMode === 'right') {
                      // Build new connections: existing -> newNode, newNode -> oldNext (if exists)
                      setConnections(prev => {
                        // Remove the old connection from existingNode to oldNextId (if present)
                        let updated = prev.filter(c => !(c.from === existingNode.id && c.to === oldNextId));

                        // Add connection existing -> newNode
                        updated = [
                          ...updated,
                          {
                            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            from: existingNode.id,
                            to: newNode.id,
                          },
                        ];

                        // If there was a previous next, add newNode -> oldNext
                        if (oldNextId) {
                          updated = [
                            ...updated,
                            {
                              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                              from: newNode.id,
                              to: oldNextId,
                            },
                          ];
                        }

                        return updated;
                      });

                      // Ensure the new node exists in circles state
                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));

                      setHeadCircleId(prev => prev || existingNode.id);
                      if (!oldNextId) setTailCircleId(newNode.id);

                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    } else {
                      // insertionMode === 'left' => insert BEFORE existingNode
                      // Find incoming connection(s) to existingNode
                      const incomingConn = connections.find(conn => conn.to === existingNode.id);
                      const incomingFrom = incomingConn ? incomingConn.from : null;

                      setConnections(prev => {
                        let updated = prev.filter(c => !(c.from === incomingFrom && c.to === existingNode.id));
                        // If there was an incoming, connect incomingFrom -> newNode
                        if (incomingFrom) {
                          updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: incomingFrom, to: newNode.id });
                        }
                        // Connect newNode -> existingNode
                        updated.push({ id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, from: newNode.id, to: existingNode.id });
                        return updated;
                      });

                      setCircles(prev => (prev.some(c => c.id === newNode.id) ? prev : [...prev, newNode]));

                      // If there was no incoming, the newNode becomes new head
                      if (!incomingConn) setHeadCircleId(newNode.id);

                      shouldDeleteCircle = null;
                      shouldConnect = false;
                    }
                  } else {
                    shouldDeleteCircle = newNode.id;
                  }
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

        // Check for collectible collisions with launched circles (only unconnected ones)
        const collectibleCollisionsThisFrame = [];
        const circlesToRemove = new Set(); // Track circles to remove due to collisions
        const processedPairs = new Set(); // Prevent duplicate collision processing
        
        finalCircles.forEach(circle => {
          if (!circle || !circle.isLaunched || circle.isInitial) return; // Skip non-launched and initial circles
          
          // Check if circle is already connected in the linked list
          const connectedIds = findConnectedCircles(circle.id);
          const isConnected = connectedIds.length > 1; // More than itself means it's connected
          
          console.log(`Circle ${circle.id} connected status: ${isConnected}, connected to: ${connectedIds.length} circles`);
          
          // Only allow collisions for unconnected circles
          if (isConnected) {
            console.log(`Skipping collision check for connected circle ${circle.id}`);
            return;
          }
          
          collectibles.forEach(collectible => {
            // Create unique pair identifier to prevent duplicate processing
            const pairId = `${circle.id}-${collectible.id}`;
            if (processedPairs.has(pairId)) return;
            
            const dx = circle.x - collectible.x;
            const dy = circle.y - collectible.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = 70; // Circle radius (30) + collectible radius (35) + buffer (5)
            
            console.log(`Checking collision: Circle ${circle.id} at (${circle.x}, ${circle.y}) vs ${collectible.type} at (${collectible.x}, ${collectible.y}), distance: ${distance.toFixed(2)}, threshold: ${collisionRadius}`);
            
            if (distance <= collisionRadius) {
              processedPairs.add(pairId);
              
              console.log(`Collision detected! Circle ${circle.id} hit ${collectible.type} collectible ${collectible.id}`);
              
              collectibleCollisionsThisFrame.push({
                circleId: circle.id,
                collectibleId: collectible.id,
                collectibleType: collectible.type
              });
              
              // For both timer and bomb collectibles, mark circle for removal
              circlesToRemove.add(circle.id);
            }
          });
        });
        
        // Update collectible collisions state immediately
        if (collectibleCollisionsThisFrame.length > 0) {
          console.log('Setting collectible collisions:', collectibleCollisionsThisFrame);
          setCollectibleCollisions(collectibleCollisionsThisFrame);
        }

        // Additional pass: Check for auto-deletion
        let filteredCircles = finalCircles.filter(circle => {
          if (!circle || !circle.isLaunched) return true; // Keep non-launched circles
          
          // ALWAYS keep initial circles - they are immune to all removal mechanisms
          if (circle.isInitial) {
            console.log(`Protecting initial circle ${circle.id} from all removal mechanisms`);
            return true;
          }
          
          // Remove circles that collided with bombs
          if (circlesToRemove.has(circle.id)) {
            console.log(`Removing circle ${circle.id} due to bomb collision`);
            return false;
          }

          // Check if circle is already connected in the linked list
          const connectedIds = findConnectedCircles(circle.id);
          const isConnected = connectedIds.length > 1; // More than itself means it's connected

          // Auto-delete unlinked circles after 3 seconds (but never delete initial circles)
          if (!isConnected && circle.launchTime && !circle.isInitial) {
            const timeSinceLaunch = Date.now() - circle.launchTime;
            const autoDeleteTime = 3000; // 3 seconds in milliseconds
            
            if (timeSinceLaunch > autoDeleteTime) {
              // Delete circle after 3 seconds if still unlinked
              return false;
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

    insertionMode,
    collectibles,
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
    // Prevent dragging launched circles or initial protected circles
    if (circle.isLaunched || circle.isInitial) {
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

  // Handle simple clicks on circles to increment a click-counter; delete after 5 clicks
  // Helper to perform deletion and bridge connections
  const performDelete = useCallback((circleId) => {
    setCircles(prev => {
      const remaining = prev.filter(c => c.id !== circleId);

      setConnections(prevConns => {
        const incoming = prevConns.filter(conn => conn.to === circleId);
        const outgoing = prevConns.filter(conn => conn.from === circleId);

        let newConns = prevConns.filter(conn => conn.from !== circleId && conn.to !== circleId);

        for (const inConn of incoming) {
          for (const outConn of outgoing) {
            const fromId = inConn.from;
            const toId = outConn.to;
            const exists = newConns.some(c => c.from === fromId && c.to === toId);
            if (fromId !== toId && !exists) {
              newConns = [
                ...newConns,
                {
                  id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  from: fromId,
                  to: toId,
                },
              ];
            }
          }
        }

        // Update head/tail IDs based on new connection set and remaining circles
        if (remaining.length === 0) {
          setHeadCircleId(null);
          setTailCircleId(null);
        } else {
          const headNode = remaining.find(c => !newConns.some(conn => conn.to === c.id));
          const tailNode = remaining.find(c => !newConns.some(conn => conn.from === c.id));
          setHeadCircleId(headNode ? headNode.id : remaining[0].id);
          setTailCircleId(tailNode ? tailNode.id : remaining[remaining.length - 1].id);
        }

        return newConns;
      });

      return remaining;
    });
  }, [setConnections, setHeadCircleId, setTailCircleId]);

  // Assign performDelete to ref for use in bomb timers
  useEffect(() => {
    performDeleteRef.current = performDelete;
  }, [performDelete]);

  const handleCircleClick = useCallback((circleId, e) => {
    e.stopPropagation();

    // Check if this is a bomb node - single click to open defuse modal
    if (bombNode && bombNode.id === circleId) {
      // Open defuse modal
      const challenge = generateDefuseChallenge();
      setDefuseNodes(challenge);
      setShowDefuseModal(true);
      console.log('Defuse modal opened for bomb node:', circleId);
      return;
    }

    setCircles(prev => {
      const updated = prev.map(c => {
        if (c.id === circleId) {
          // Do not change clickCount for initial circles or bomb nodes
          if (c.isInitial || (bombNode && bombNode.id === c.id)) return c;
          const nextCount = Math.min(5, (c.clickCount || 0) + 1);
          return { ...c, clickCount: nextCount, deletionReady: nextCount >= 5 ? true : (c.deletionReady || false) };
        }
        return c;
      });

      const clicked = updated.find(c => c.id === circleId);
      // If clicked circle is initial or bomb node, do nothing further
      if (clicked && (clicked.isInitial || (bombNode && bombNode.id === clicked.id))) {
        return updated;
      }

      // If deletionReady just became true, schedule the actual deletion after a short delay
      if (clicked && clicked.deletionReady) {
        setTimeout(() => {
          performDelete(circleId);
        }, 420); // small delay so user sees the filled background
      }

      return updated;
    });
  }, [performDelete, bombNode, generateDefuseChallenge]);



  // Cannon circle event handlers - removed double-click editing for testing

  // Global right-click handler for launching circles
  const handleGlobalRightClick = useCallback((e) => {
    e.preventDefault(); // Prevent context menu
  // tutorial removed - allow actions regardless
    
    // Prevent launching when any modal is open
    if (showDefuseModal || showBulletModal || showPointsModal || showLevelCompleteModal || showAllCompletedModal || showMissionFailed || showValidationResult || showWrongAnswerNotification || showBombBlockingNotification || showQuizModal) {
      return; // Don't launch when modals are open
    }

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
  }, [cannonCircle.value, cannonCircle.address, cannonAngle, showDefuseModal, showBulletModal, showPointsModal, showLevelCompleteModal, showAllCompletedModal, showMissionFailed, showValidationResult, showWrongAnswerNotification, showBombBlockingNotification, showQuizModal]);

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
      // Check if there's an active bomb - user must defuse it first before claiming points
      if (bombNode && bombCountdown > 0) {
        console.log('Expected result achieved but bomb is active! Defuse the bomb first to claim points.');
        // Show notification to user
        setShowBombBlockingNotification(true);
        setTimeout(() => {
          setShowBombBlockingNotification(false);
        }, 3000);
        return; // Don't show points modal until bomb is defused
      }
      // Calculate actual completion time in seconds
      const currentTime = Date.now();
      const completionTimeMs = roundStartTime ? (currentTime - roundStartTime) : 0;
      const completionTime = Math.floor(completionTimeMs / 1000); // Convert to seconds
      
      console.log(`Round completed in ${completionTime} seconds`); // Debug log
      
      // Time-based point system (maximum 100 points per expected result)
      let pointsEarned = 0;
      
      if (completionTime < 60) {
        // Under 1 minute: 100 points
        pointsEarned = 100;
      } else if (completionTime >= 60 && completionTime < 120) {
        // 1-2 minutes: 80 points
        pointsEarned = 80;
      } else {
        // Above 2 minutes: 60 points
        pointsEarned = 60;
      }
      
      setEarnedPoints(pointsEarned);
      setShowPointsModal(true);
    }
  }, [circles, connections, currentExercise, getCurrentLinkedList, currentExerciseNumber, totalExercises, timerSeconds, roundStartTime, bombNode, bombCountdown]);

  // Handler for claiming points and generating a new exercise
  const handleClaimPoints = () => {
    // Add earned points to total
    setTotalPoints(prev => prev + earnedPoints);
    
    // Close points modal
    setShowPointsModal(false);
    
    // Start timing for the new round
    setRoundStartTime(Date.now());
    
    // Generate new exercise and reset circles
    const exercise = exerciseManagerRef.current.loadRandomExercise();
    setCurrentExercise(exercise);
    
    // Generate new initial circles using the exercise data
    const initialNodes = getRandomInitialNodes(
      exercise.sequence || [],
      exercise.addresses || {},
      { min: 1, max: 3 } // Allow up to 3 initial circles with strategic selection
    );
    const gameHeight = window.innerHeight;
    
    const newCircles = initialNodes.map((node, index) => ({
      id: `initial_claim_${Date.now()}_${index}`,
      value: node.value.toString(),
      address: node.address,
      x: 150 + (index * 100), // Spread them out horizontally
      y: gameHeight - 200, // Position them near the bottom
      isInitial: true,
      isLaunched: false,
      velocityX: 0,
      velocityY: 0
    }));
    
    // Create connections between initial circles (like in loadExercise)
    const newConnections = [];
    for (let i = 0; i < newCircles.length - 1; i++) {
      newConnections.push({
        id: `claim_conn_${Date.now()}_${i}`,
        from: newCircles[i].id,
        to: newCircles[i + 1].id,
      });
    }
    
    setCircles(newCircles);
    setConnections(newConnections);
    
    // Set head and tail IDs if we have circles
    if (newCircles.length > 0) {
      setHeadCircleId(newCircles[0].id);
      setTailCircleId(newCircles[newCircles.length - 1].id);
    } else {
      setHeadCircleId(null);
      setTailCircleId(null);
    }
    
    // Reset cannon with new values
    setCannonCircle({
      value: Math.floor(Math.random() * 100).toString(),
      address: Math.floor(Math.random() * 1000).toString()
    });
  };

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

      

      {/* Game UI - only show when game has started */}
      {isGameStarted && (
        <>
          {/* Countdown timer (top right) */}
          <div className={styles.exerciseProgressIndicator} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Math.floor(timerSeconds / 60).toString().padStart(1, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>

          {/* Insertion mode indicator (top-left) */}
          {/* <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 10px', borderRadius: 12, border: '1px solid #fff' }}>
            Insert: {insertionMode === 'left' ? 'Before (←)' : 'After (→)'}
          </div> */}
        </>
      )}

      {/* Expected results bar - only show when game has started */}
      {isGameStarted && currentExercise && currentExercise.expectedStructure && (
        <div className={styles.expectedBarWrapper}>
          {/* Score indicator */}
          <div className={styles.scoreIndicator}>
            <span className={styles.scoreText}>Points: {totalPoints}</span>
          </div>
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

      {/* Game elements - only show when game has started */}
      {isGameStarted && (
        <>
          {/* Tutorial removed */}

          {/* Portal visuals removed */}

          
          
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
              <div style={{ position: 'absolute', top: -28, color: '#000000ff', zIndex:1000, fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {insertionMode === 'left' ? 'Before' : 'After'}
              </div>
              <span style={{ fontSize: '10px' }}>
                {cannonCircle.value}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Circles - only show when game has started */}
      {isGameStarted && circles.map((circle) => {
        const label = getCircleLabel(circle.id);
        const clickProgress = circle.isInitial ? 0 : Math.max(0, Math.min(1, (circle.clickCount || 0) / 5));
        
        // Check if circle is unlinked and approaching auto-deletion
        const connectedIds = findConnectedCircles(circle.id);
        const isConnected = connectedIds.length > 1;
        const timeSinceLaunch = circle.launchTime ? Date.now() - circle.launchTime : 0;
        const isApproachingDeletion = !isConnected && circle.isLaunched && !circle.isInitial && 
                                     timeSinceLaunch > 2000 && timeSinceLaunch <= 3000; // Warning in last second
        
        return (
          <div
            key={circle.id}
            className={`${styles.animatedCircle} ${
              suckingCircles.includes(circle.id) ? styles.beingSucked : ""
            } ${
              bombNode && bombNode.id === circle.id ? styles.bombNode : ""
            }`}
            style={{
              left: `${circle.x - 30}px`,
              top: `${circle.y - 30}px`,
              cursor: circle.isInitial ? 'default' : (circle.isLaunched 
                ? "default" 
                : (draggedCircle && circle.id === draggedCircle.id
                  ? "grabbing"
                  : "grab")),
              opacity: circle.isLaunched ? 0.9 : 1, // Slightly transparent for launched circles
              backgroundColor: bombNode && bombNode.id === circle.id 
                ? (bombCountdown % 2 === 0 ? '#ff4444' : '#ff8888') // Blinking red effect
                : (circle.color || '#d3d3d3'),
              boxShadow: bombNode && bombNode.id === circle.id 
                ? '0 0 20px rgba(255, 68, 68, 0.8), 0 0 40px rgba(255, 68, 68, 0.4)'
                : 'none',
              animation: circle.isInitial 
                ? "protectedGlow 2s ease-in-out infinite alternate" 
                : (bombNode && bombNode.id === circle.id 
                  ? "bomb-pulse 0.5s ease-in-out infinite alternate"
                  : (isApproachingDeletion ? "pulse 0.5s infinite alternate" : "none")),
            }}
            onMouseDown={(e) => handleMouseDown(e, circle)}
            {...(!circle.isInitial ? { onClick: (e) => handleCircleClick(circle.id, e) } : {})}
            // Double click disabled
          >
            <span className={styles.circleValue} style={{ position: 'relative', zIndex: 2 }}>{circle.value}</span>
            <span className={styles.circleAddress} style={{ position: 'relative', zIndex: 2 }}>{circle.address}</span>
            {bombNode && bombNode.id === circle.id && (
              <div className={styles.bombCountdown}>
                💣 {bombCountdown}
              </div>
            )}

            {/* Click-to-delete background circle fill (SVG) */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: '60px', height: '60px', zIndex: 0, pointerEvents: 'none' }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <defs>
                  <linearGradient id={`grad-${circle.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffcfb8" />
                    <stop offset="100%" stopColor="#ff6b35" />
                  </linearGradient>
                </defs>
                <circle cx="30" cy="30" r="28" fill="rgba(255,255,255,0.04)" />
                <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                {/* foreground arc representing progress - use stroke-dasharray trick */}
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  fill="none"
                  stroke={`url(#grad-${circle.id})`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                  style={{
                    strokeDasharray: 2 * Math.PI * 24,
                    strokeDashoffset: `${(1 - clickProgress) * 2 * Math.PI * 24}`,
                    transition: 'stroke-dashoffset 120ms linear'
                  }}
                />
              </svg>
            </div>

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



      {/* Connection lines - only show when game has started */}
      {isGameStarted && (
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
      )}
      
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
                    loadExercise("exercise_three");
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

      {/* Game Over Overlay */}
      {showMissionFailed && (
        <div className={styles.popupOverlay}>
          <div className={`${styles.bulletModalContent} ${styles.gameOverModal}`}>
            <h1 className={styles.gameOverTitle}>
              GAME OVER
            </h1>
            
            <div className={styles.gameOverStats}>
              <div className={styles.gameOverStat}>
                <div className={styles.gameOverStatValue}>
                  {totalPoints} pts
                </div>
                <div className={styles.gameOverStatLabel}>
                  TOTAL POINTS
                </div>
              </div>
              
              <div className={styles.gameOverDivider}></div>
              
              <div className={styles.gameOverStat}>
                <div className={styles.gameOverStatValue}>
                  {(() => {
                    const minutes = Math.floor(finalSurvivalTime / 60);
                    const seconds = finalSurvivalTime % 60;
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  })()}
                </div>
                <div className={styles.gameOverStatLabel}>
                  TIME SURVIVED
                </div>
              </div>
            </div>
            
            <div className={styles.gameOverButtons}>
              <button
                onClick={() => handleGoBack()}
                className={styles.gameOverButton}
              >
                Menu
              </button>
              
              <button
                onClick={() => {/* TODO: Add leaderboard functionality */}}
                className={styles.gameOverButton}
              >
                Leaderboard
              </button>
              
              <button
                onClick={() => handleRetry()}
                className={styles.gameOverButton}
              >
                Retry
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

      {/* Points Modal */}
      {showPointsModal && (
        <div className={styles.popupOverlay}>
          <div className={styles.bulletModalContent} style={{ 
            backgroundColor: '#000', 
            border: '3px solid #ff00ff', 
            borderRadius: '15px', 
            padding: '40px', 
            width: '500px',
            height: '280px', 
            textAlign: 'center' 
          }}>
            <h2 style={{ 
              color: '#ff00ff', 
              fontSize: '4.0rem', 
              marginBottom: '20px',
              textShadow: '0 0 20px rgba(255, 0, 255, 0.8)'
            }}>
              +{earnedPoints} pts
            </h2>
            <button
              onClick={handleClaimPoints}
              style={{
                background: 'transparent',
                border: '2px solid #ff00ff',
                borderRadius: '15px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                padding: '12px 30px',
                cursor: 'pointer',
                marginTop: '20px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 0, 255, 0.2)';
                e.target.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            >
              Claim
            </button>
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
              Insertion Nodes Completed
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

      {/* Collectibles layer - spawns floating timers and bombs - kept below modals */}
      {isGameStarted && collectiblesEnabled && (
        <div style={{ zIndex: 1 }}>
          <Collectibles 
            onCollect={handleCollect} 
            isGameActive={!!currentExercise && !showMissionFailed} 
            gameOver={showMissionFailed}
            collectibles={collectibles}
            setCollectibles={setCollectiblesCallback}
            collisions={collectibleCollisions}
            setCollisions={setCollisionCallback}
            onWrongQuizAnswer={handleWrongQuizAnswer}
            onQuizModalChange={handleQuizModalChange}
            showDefuseModal={showDefuseModal}
          />
        </div>
      )}
      
      
      
      {/* Bomb Defuse Modal */}
      {showDefuseModal && (
        <div className={styles.popupOverlay}>
          <div className={`${styles.popupContent} defuseModalContent`} style={{ 
            width: '71%', 
            height: '62%', 
            backgroundColor: '#000', 
            border: '4px solid #ff00ff', 
            borderRadius: '20px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}>
            
            {/* Title */}
            <h1 style={{ 
              color: 'white', 
              fontSize: '2.5em', 
              fontWeight: 'normal',
              textAlign: 'center',
              margin: '0 0 0px 0'
            }}>
              Sort the linked list in a ascending order.
            </h1>
            
            {/* Bomb Defused Message */}
            {isBombDefused && (
              <div style={{
                color: '#00ff00',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '-60px',
              }}>
                BOMB DEFUSED!
              </div>
            )}
            
            {/* Head and Tail labels */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '800px', marginTop: '-40px' }}>
              <div style={{ 
                position: 'absolute', 
                left: '-5px', 
                top: '-40px', 
                color: 'white', 
                fontSize: '1.2em',
                fontWeight: 'normal'
              }}>
                Head
              </div>
              
              <div style={{ 
                position: 'absolute', 
                right: '6px', 
                top: '-40px', 
                color: 'white', 
                fontSize: '1.2em',
                fontWeight: 'normal'
              }}>
                Tail
              </div>
              
              {/* Linked list nodes */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0px',
                width: '100%'
              }}>
                {defuseNodes.map((node, index) => (
                  <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: selectedDefuseNodes.find(n => n.id === node.id) ? '#ff00ff' : '#d3d3d3',
                        border: selectedDefuseNodes.find(n => n.id === node.id) ? '3px solid #ff00ff' : '2px solid #999',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedDefuseNodes.find(n => n.id === node.id) ? '0 0 20px rgba(255, 0, 255, 0.6)' : 'none'
                      }}
                      onClick={() => handleDefuseNodeClick(node)}
                    >
                      <div style={{ 
                        fontSize: '2.2em', 
                        fontWeight: 'bold', 
                        color: 'black',
                        lineHeight: '1'
                      }}>
                        {node.value}
                      </div>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: 'black',
                        lineHeight: '1',
                        marginTop: '2px'
                      }}>
                        {node.address}
                      </div>
                    </div>
                    {index < defuseNodes.length - 1 && (
                      <div style={{
                        fontSize: '2.5em',
                        color: 'white',
                        margin: '0 15px',
                        fontWeight: 'normal'
                      }}>
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              {isBombDefused && defuseProgressCountdown > 0 && (
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '870px',
                    height: '20px',
                    backgroundColor: '#333',
                    borderRadius: '10px',
                    border: '2px solid #FF00E6',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(defuseProgressCountdown / 3) * 100}%`,
                      height: '100%',
                      backgroundColor: '#FF00E6',
                      borderRadius: '8px',
                      transition: 'width 1s linear',
                    }} />
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
      
      {/* Bomb Blocking Notification */}
      {/* {showBombBlockingNotification && (
        <div 
          className={styles.notification}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ff6b6b',
            color: 'white',
            padding: '20px 30px',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 10000,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            border: '2px solid #ff5252',
            maxWidth: '400px'
          }}
        >
          <div style={{ marginBottom: '10px' }}>⚠️ BOMB ACTIVE! ⚠️</div>
          <div>Defuse the bomb first to claim your points!</div>
        </div>
      )} */}
      
      <CompetitiveInstruction
        showInstructionPopup={showInstructionPopup}
        startExercise={startExercise}
        closeInstructionPopup={closeInstructionPopup}
        isGameActive={isGameStarted}
      />
    </div>
  );
}
                
export default CompetitiveMode;