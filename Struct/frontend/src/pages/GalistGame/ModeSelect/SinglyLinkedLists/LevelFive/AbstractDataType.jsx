import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./AbstractDataType.module.css";
import { ExerciseManager, INITIAL_CIRCLES, INITIAL_CIRCLES_TWO, INITIAL_CIRCLES_THREE} from "./AbstractExercise";
import { collisionDetection } from "../../../CollisionDetection";
import PortalComponent from "../../../PortalComponent";
import PortalParticles from "../../../Particles.jsx";
import ExplodeParticles from "../../../ExplodeParticles.jsx";
import Level5Instruction from "./Level5Instruction.jsx";



function GalistAbstractDataType() {

  // --- Move all useState declarations to the top ---
  // Portal state management (move above useEffect that uses isPortalOpen)
  const [portalInfo, setPortalInfo] = useState({
    isVisible: false,
    canvasWidth: 45,
  });
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  // --- Background music effect (local to this component) ---
  useEffect(() => {
    let bgAudio;
    const playMusic = () => {
      if (bgAudio) {
        bgAudio.play().catch(() => {});
      }
      window.removeEventListener('click', playMusic);
    };
    try {
      bgAudio = new window.Audio('/sounds/bg_music.mp3');
      bgAudio.loop = true;
      bgAudio.volume = 0.3;
      window.addEventListener('click', playMusic);
    } catch {
      // Ignore audio errors
    }
    return () => {
      if (bgAudio) {
        bgAudio.pause();
        bgAudio.currentTime = 0;
      }
      window.removeEventListener('click', playMusic);
    };
  }, []);

  // --- Portal sound effect (loop while portal is open) ---
  const portalAudioRef = useRef(null);
  useEffect(() => {
    if (isPortalOpen) {
      if (!portalAudioRef.current) {
        try {
          const audio = new window.Audio('/sounds/portal.mp3');
          audio.loop = true;
          audio.volume = 1;
          portalAudioRef.current = audio;
          // Play with promise catch for browser compatibility
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } catch {
          // Ignore audio errors
        }
      } else {
        // If already created, just play
        portalAudioRef.current.currentTime = 0;
        portalAudioRef.current.play().catch(() => {});
      }
    } else {
      if (portalAudioRef.current) {
        portalAudioRef.current.pause();
        portalAudioRef.current.currentTime = 0;
        portalAudioRef.current = null;
      }
    }
    // Clean up on unmount
    return () => {
      if (portalAudioRef.current) {
        portalAudioRef.current.pause();
        portalAudioRef.current.currentTime = 0;
        portalAudioRef.current = null;
      }
    };
  }, [isPortalOpen]);

  // Track which exercise is active
  const [exerciseKey, setExerciseKey] = useState("exercise_one");
  const [address, setAddress] = useState("");
  const [value, setValue] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showInsertButton, setShowInsertButton] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [insertIndex, setInsertIndex] = useState("");
  const [hoverTimer, setHoverTimer] = useState(null);
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
  // Explosion particle system
  const [explosions, setExplosions] = useState([]);
  const explosionIdRef = useRef(0);

  // Energy-based brightness system for PEEK game mechanic
  const [energy, setEnergy] = useState(50); // Start with 50 energy
  const [screenOpacity, setScreenOpacity] = useState(1); // 1 = fully bright, 0 = completely dark
  const energyTimerRef = useRef(null);
  const lowEnergySoundPlayedRef = useRef(false); // Track if low energy sound has been played
  const alarmAudioRef = useRef(null); // Track alarm audio to stop it when needed
  
  // Energy system constants
  const MAX_ENERGY = 50;
  const MIN_ENERGY = 0;
  const DIMMING_START_ENERGY = 40; // Start dimming when energy drops to 40
  const ENERGY_DECAY_RATE = 0.5;
  const PEEK_ENERGY_GAIN = 15; // Gain 10 energy when using PEEK
  const ENERGY_UPDATE_INTERVAL = 300; // Update energy every 500ms (twice as fast)
  const LOW_ENERGY_THRESHOLD = 20; // Play warning sound when energy reaches this level
    // Exercise progress indicator logic
  const EXERCISE_KEYS = ["exercise_one", "exercise_two", "exercise_tree"];
  const currentExerciseNumber = EXERCISE_KEYS.indexOf(exerciseKey) + 1;
  const totalExercises = EXERCISE_KEYS.length;

  // --- Launch initial circles from the correct INITIAL_CIRCLES array ---
  const launchTimeoutRef = useRef(null);
  const launchTokenRef = useRef(0);
  const hasLaunchedRef = useRef(false);
  const launchInitialCircles = useCallback(() => {
    // Invalidate any previous launches
    launchTokenRef.current += 1;
    const myToken = launchTokenRef.current;
    if (launchTimeoutRef.current) {
      clearTimeout(launchTimeoutRef.current);
      launchTimeoutRef.current = null;
    }
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    setSuckedCircles([]);
    setCurrentEntryOrder([]);
    setOriginalSubmission(null);
    setShowValidationResult(false);
    setValidationResult(null);
    hasLaunchedRef.current = true;

    let initialCircles;
    if (exerciseKey === "exercise_one") {
      initialCircles = INITIAL_CIRCLES;
    } else if (exerciseKey === "exercise_two") {
      initialCircles = INITIAL_CIRCLES_TWO;
    } else if (exerciseKey === "exercise_tree") {
      initialCircles = INITIAL_CIRCLES_THREE;
    } else {
      initialCircles = [];
    }
    // Launch after a short delay to ensure state is cleared
    launchTimeoutRef.current = setTimeout(() => {
      // If a new launch was triggered, abort this one
      if (launchTokenRef.current !== myToken) return;
      // Find the true head: node whose address is not referenced by any 'next' in initialCircles
      const referencedAddresses = initialCircles.map(n => n.next).filter(Boolean);
      const headNode = initialCircles.find(n => !referencedAddresses.includes(n.id));
      // Traverse the list using 'next' pointers to get the launch order
      const launchOrder = [];
      let current = headNode;
      const addressToNode = Object.fromEntries(initialCircles.map(n => [n.id, n]));
      while (current) {
        launchOrder.push(current);
        current = current.next ? addressToNode[current.next] : null;
      }
      // Add any remaining nodes not in the main chain (disconnected/extra nodes)
      const mainChainIds = new Set(launchOrder.map(n => n.id));
      const restNodes = initialCircles.filter(n => !mainChainIds.has(n.id));
      const finalLaunchOrder = [...launchOrder, ...restNodes];
      let idx = 0;
      function launchNext() {
        if (launchTokenRef.current !== myToken) return;
        if (idx >= finalLaunchOrder.length) return;
        const c = finalLaunchOrder[idx];
        const newCircle = {
          id: c.id,
          address: c.address,
          value: c.value,
          x: window.innerWidth - 10,
          y: window.innerHeight - 55,
          velocityX: -8 - Math.random() * 5,
          velocityY: -5 - Math.random() * 3,
        };
        // Play audio effect for launching a circle
        try {
          const audio = new window.Audio('/sounds/explode.mp3');
          audio.currentTime = 0;
          // Use promise for play() to avoid uncaught errors in modern browsers
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {/* Ignore play errors */});
          }
        } catch {
          // Ignore audio errors
        }
        setCircles(prev => [...prev, newCircle]);
        // Add connection if this node has a next
        if (c.next) {
          const nextNode = initialCircles.find(n => n.address === c.next);
          if (nextNode) {
            setConnections(prev => [
              ...prev,
              {
                id: `conn-${c.id}-${nextNode.id}`,
                from: c.id,
                to: nextNode.id,
              }
            ]);
          }
        }
        idx++;
        launchTimeoutRef.current = setTimeout(launchNext, 750);
      }
      launchNext();
    }, 50);
  }, [exerciseKey]);

  useEffect(() => {
    hasLaunchedRef.current = false;
    launchInitialCircles();
    return () => {
      if (launchTimeoutRef.current) {
        clearTimeout(launchTimeoutRef.current);
        launchTimeoutRef.current = null;
      }
    };
  }, [exerciseKey, launchInitialCircles]);



  // Wrap setPortalInfo in useCallback to prevent unnecessary re-renders
  const handlePortalStateChange = useCallback((newPortalInfo) => {
    setPortalInfo(newPortalInfo);
  }, []);

  // Portal toggle function
  const togglePortal = useCallback(() => {
    setIsPortalOpen(!isPortalOpen);
  }, [isPortalOpen]);

  // Exercise system states
  const exerciseManagerRef = useRef(new ExerciseManager());
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  // Create explosion effect at circle position
  const createExplosion = useCallback((circle, color = '#ff6b6b') => {
    explosionIdRef.current += 1;
    const explosion = {
      id: `explosion-${explosionIdRef.current}`,
      x: circle.x, // Circle center is at circle.x (the element offset is handled in CSS)
      y: circle.y, // Circle center is at circle.y
      color,
    };

    setExplosions(prev => [...prev, explosion]);

    // Clean up explosion after animation
    setTimeout(() => {
      setExplosions(prev => prev.filter(exp => exp.id !== explosion.id));
    }, 2500);
  }, []);

  // Energy-based brightness management system
  const updateBrightnessFromEnergy = useCallback(() => {
    if (energy >= DIMMING_START_ENERGY) {
      // Full brightness when energy is above 40
      setScreenOpacity(1);
    } else {
      // Gradual dimming from energy 40 to 0
      const energyRange = DIMMING_START_ENERGY - MIN_ENERGY; // 40
      const currentEnergyInRange = energy - MIN_ENERGY; // How much energy above minimum
      const brightnessRatio = currentEnergyInRange / energyRange; // 0 to 1 scale
      const opacity = Math.max(0.05, brightnessRatio); // Never go completely black
      setScreenOpacity(opacity);
    }
  }, [energy, DIMMING_START_ENERGY, MIN_ENERGY]);

  // Energy decay system
  const startEnergyDecay = useCallback(() => {
    // Clear existing timer
    if (energyTimerRef.current) {
      clearInterval(energyTimerRef.current);
    }

    // Start energy decay timer
    energyTimerRef.current = setInterval(() => {
      setEnergy(prevEnergy => {
        const newEnergy = Math.max(MIN_ENERGY, prevEnergy - ENERGY_DECAY_RATE);
        
        // Play warning sound when energy drops to low threshold (only once)
        if (newEnergy <= LOW_ENERGY_THRESHOLD && !lowEnergySoundPlayedRef.current) {
          lowEnergySoundPlayedRef.current = true;
          try {
            const audio = new window.Audio('/sounds/alarm.mp3');
            audio.loop = true; // Loop the alarm while energy is low
            audio.volume = 0.4;
            alarmAudioRef.current = audio; // Store reference to stop later
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {/* Ignore play errors */});
            }
          } catch {
            // Ignore audio errors
          }
        }
        
        // Stop alarm when energy goes above threshold
        if (newEnergy > LOW_ENERGY_THRESHOLD && alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current.currentTime = 0;
          alarmAudioRef.current = null;
          lowEnergySoundPlayedRef.current = false;
        }
        
        return newEnergy;
      });
    }, ENERGY_UPDATE_INTERVAL);
  }, [MIN_ENERGY, ENERGY_DECAY_RATE, ENERGY_UPDATE_INTERVAL, LOW_ENERGY_THRESHOLD]);

  // Pause energy decay system
  const pauseEnergyDecay = useCallback(() => {
    if (energyTimerRef.current) {
      clearInterval(energyTimerRef.current);
      energyTimerRef.current = null;
    }
    // Stop alarm when pausing
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }
    lowEnergySoundPlayedRef.current = false;
  }, []);

  // Reset energy to maximum and restart decay
  const resetEnergySystem = useCallback(() => {
    setEnergy(MAX_ENERGY);
    setScreenOpacity(1);
    lowEnergySoundPlayedRef.current = false;
    // Stop any existing alarm
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }
    // Restart energy decay
    startEnergyDecay();
  }, [MAX_ENERGY, startEnergyDecay]);

  // PEEK energy boost function
  const boostEnergyWithPeek = useCallback(() => {
    setEnergy(prevEnergy => {
      const newEnergy = Math.min(MAX_ENERGY, prevEnergy + PEEK_ENERGY_GAIN);
      // Stop alarm and reset flag if energy is restored above threshold
      if (newEnergy > LOW_ENERGY_THRESHOLD) {
        if (alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current.currentTime = 0;
          alarmAudioRef.current = null;
        }
        lowEnergySoundPlayedRef.current = false;
      }
      return newEnergy;
    });
  }, [MAX_ENERGY, PEEK_ENERGY_GAIN, LOW_ENERGY_THRESHOLD]);

  // Update screen brightness whenever energy changes
  useEffect(() => {
    updateBrightnessFromEnergy();
  }, [energy, updateBrightnessFromEnergy]);

  // Initialize energy system on component mount
  useEffect(() => {
    startEnergyDecay();
    
    return () => {
      if (energyTimerRef.current) {
        clearInterval(energyTimerRef.current);
      }
      // Stop alarm on cleanup
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current = null;
      }
    };
  }, [startEnergyDecay]);

    // Stop portal sound when validation overlay is open
  useEffect(() => {
    if (showValidationResult && portalAudioRef.current) {
      portalAudioRef.current.pause();
      portalAudioRef.current.currentTime = 0;
    }
  }, [showValidationResult]);

  // Close portal when validation overlay is open
  useEffect(() => {
    if (showValidationResult) {
      setIsPortalOpen(false);
    }
  }, [showValidationResult]);

  // Pause energy system and reset energy when validation modal appears
  useEffect(() => {
    if (showValidationResult) {
      // Pause energy decay and reset energy to maximum
      pauseEnergyDecay();
      setEnergy(MAX_ENERGY);
      setScreenOpacity(1);
    } else {
      // Resume energy decay when validation modal is closed
      resetEnergySystem();
    }
  }, [showValidationResult, pauseEnergyDecay, resetEnergySystem, MAX_ENERGY]);
  
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
        setAddress("");
        setValue("");
        setShowDuplicateModal(false);
        setShowInsertButton(false);
        setShowInsertModal(false);
        setShowIndexModal(false);
        setInsertIndex("");
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

  // Check if portal button should be enabled (requires at least one head AND one tail node)
  const hasHeadNode = useCallback(() => {
    return circles.some((circle) => isHeadNode(circle.id));
  }, [circles, isHeadNode]);

  const hasTailNode = useCallback(() => {
    return circles.some((circle) => isTailNode(circle.id));
  }, [circles, isTailNode]);

  const isPortalButtonEnabled =
    isPortalOpen || (hasHeadNode() && hasTailNode());

  // Helper functions to determine if queue operations should be disabled
  const isOnlyOneCircle = circles.length === 1;
  const isSingleHeadTail = isOnlyOneCircle && circles.length > 0;
  
  // Disable PEEK when no head exists or only one circle (head/tail)
  const isPeekDisabled = !hasHeadNode() || isSingleHeadTail;
  
  // Disable DEQUEUE when no head exists or only one circle (head/tail) 
  const isDequeueDisabled = !hasHeadNode() || isSingleHeadTail;
  
  // ENQUEUE is always available when we have address and value

  

  const loadExercise = useCallback((key = "exercise_one") => {
    // Always clear circles/connections and reset launch state before loading new exercise
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    setSuckedCircles([]);
    setCurrentEntryOrder([]);
    setOriginalSubmission(null);
    setShowValidationResult(false);
    setValidationResult(null);
    hasLaunchedRef.current = false;
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

  // Initialize exercise on component mount
  useEffect(() => {
    if (!currentExercise) {
      loadExercise("exercise_one");
    }
  }, [currentExercise, loadExercise]);

  // Initialize with basic exercise when instruction popup is closed
  useEffect(() => {
    if (!showInstructionPopup && !currentExercise) {
      loadExercise();
    }
  }, [showInstructionPopup, currentExercise, loadExercise]);

  // Helper function to get the complete chain order from head to tail
  const getChainOrder = useCallback(
    (startCircleId) => {
      const chainOrder = [];
      let currentId = startCircleId;
      const visited = new Set();

      // If starting circle is not a head, find the head first
      if (!isHeadNode(startCircleId)) {
        // Traverse backwards to find the head
        let searchId = startCircleId;
        const backwardVisited = new Set();

        while (searchId && !backwardVisited.has(searchId)) {
          backwardVisited.add(searchId);
          const incomingConnection = connections.find(
            (conn) => conn.to === searchId
          );
          if (incomingConnection && !isHeadNode(incomingConnection.from)) {
            searchId = incomingConnection.from;
          } else if (incomingConnection) {
            currentId = incomingConnection.from; // Found the head
            break;
          } else {
            break;
          }
        }
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
        circles: circles.map((c) => ({ ...c })), // Deep copy
        connections: connections.map((c) => ({ ...c })), // Deep copy
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
        // Head nodes get sucked first (faster), tail last (slower)
        const delay = (index + 1) * 150; // Start from 150ms for the first remaining circle

        setTimeout(() => {
          // Add circle to sucking list (this will make it get pulled toward entrance)
          setSuckingCircles((prev) => [...prev, circleId]);
        }, delay);
      });
    },
    [getChainOrder, circles, connections]
  );

  // PHYSICS SYSTEM - Optimized animation loop for better performance
  useEffect(() => {
    let isAnimating = true;
    let lastTime = 0;
    const targetFPS = 30; // Reduced from ~60fps to 30fps
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (currentTime) => {
      if (!isAnimating) return;

      // Throttle frame rate for better performance
      if (currentTime - lastTime < frameInterval) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastTime = currentTime;

      // Only run expensive calculations if there are circles to process
      if (circles.length === 0 && suckingCircles.length === 0) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      setCircles((prevCircles) => {
        const circlesWithSpecialBehavior = prevCircles.map((circle) => {
          if (draggedCircle && circle.id === draggedCircle.id) {
            return circle;
          }

          // Sucking effect (GalistGame logic)
          if (suckingCircles.includes(circle.id)) {
            const portalCenterX = 10 + portalInfo.canvasWidth / 2;
            const portalCenterY = window.innerHeight / 2;
            const dx = portalCenterX - circle.x;
            const dy = portalCenterY - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

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
                setCircles((prevCircles) => {
                  // Find the current position of the circle right before deletion
                  const currentCircle = prevCircles.find((c) => c.id === circle.id);
                  if (currentCircle) {
                    // Create explosion effect with current position
                    // createExplosion(currentCircle, '#b90accff'); // Purple explosion for portal entry
                  }
                  
                  const newCircles = prevCircles.filter((c) => c.id !== circle.id);
                  // If last circle, validate
                  if (newCircles.length === 0 && currentExercise) {
                    if (!exerciseManagerRef.current.currentExercise) {
                      exerciseManagerRef.current.loadExercise("exercise_one");
                    }
                    const finalEntryOrder = [...currentEntryOrder, circle.id];
                    const submissionData = originalSubmission || {
                      circles: [...prevCircles],
                      connections: [...connections],
                    };
                    setTimeout(() => {
                      try {
                        const result =
                          exerciseManagerRef.current.validateSubmission(
                            submissionData.circles,
                            submissionData.connections,
                            finalEntryOrder
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
                    }, 500);
                  }
                  return newCircles;
                });
                setSuckedCircles((prev) => {
                  if (!prev.includes(circle.id)) return [...prev, circle.id];
                  return prev;
                });
                setCurrentEntryOrder((prev) => {
                  if (!prev.includes(circle.id)) return [...prev, circle.id];
                  return prev;
                });
                setSuckingCircles((prev) => prev.filter((id) => id !== circle.id));
              }, 50);
              return circle;
            }

            // Suction force
            const baseForce = 2.0;
            const headBoost = 2.0;
            const suctionForce = baseForce + headBoost;
            const newVelocityX = (dx / distance) * suctionForce;
            const newVelocityY = (dy / distance) * suctionForce;
            return {
              ...circle,
              x: circle.x + newVelocityX,
              y: circle.y + newVelocityY,
              velocityX: newVelocityX,
              velocityY: newVelocityY,
            };
          }

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
              const isHead = isHeadNode(circle.id);
              const hasAnyHeadNode = prevCircles.some((c) => isHeadNode(c.id));
              if (isHead || !hasAnyHeadNode) {
                startChainSuction(circle.id);
              }
              return circle;
            }
          }
          return circle;
        });

        // Optimized collision detection - only run when needed
        const allCirclesForCollision = circlesWithSpecialBehavior;
        const draggedCircleData = draggedCircle
          ? allCirclesForCollision.find((circle) => circle.id === draggedCircle.id)
          : null;
        
        // Only run expensive collision detection if circles are actually moving
        const hasMovingCircles = allCirclesForCollision.some(c => 
          Math.abs(c.velocityX || 0) > 0.1 || Math.abs(c.velocityY || 0) > 0.1
        );
        
        const updatedAllCircles = hasMovingCircles && allCirclesForCollision.length > 0
          ? collisionDetection.updatePhysics(allCirclesForCollision, suckingCircles)
          : allCirclesForCollision;
        let finalCircles = updatedAllCircles;
        if (draggedCircleData) {
          finalCircles = updatedAllCircles.map((circle) => {
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
    isHeadNode,
    startChainSuction,
    findConnectedCircles,
    connections,
    currentExercise,
    suckedCircles,
    originalSubmission,
    currentEntryOrder,
    circles.length,
    createExplosion,
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
        const headNodes = circles.filter((circle) => isHeadNode(circle.id));
  
        if (headNodes.length > 0) {
          headNodes.forEach((headNode, index) => {
            setTimeout(() => {
              startChainSuction(headNode.id);
            }, index * 1000);
          });
        } else {
          const isolatedNodes = circles.filter(
            (circle) =>
              !connections.some(
                (conn) => conn.from === circle.id || conn.to === circle.id
              )
          );
  
          if (isolatedNodes.length > 0) {
            isolatedNodes.forEach((node, index) => {
              setTimeout(() => {
                setSuckingCircles((prev) => {
                  if (!prev.includes(node.id)) {
                    return [...prev, node.id];
                  }
                  return prev;
                });
              }, index * 200);
            });
          }
        }
      } else if (!portalInfo.isVisible) {
        setSuckingCircles([]);
      }
    }, [
      portalInfo.isVisible,
      circles,
      connections,
      isHeadNode,
      startChainSuction,
    ]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e, circle) => {
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

  const handleDoubleClick = (circle) => {
    setSelectedCircle(circle);
    setConnectToAddress("");
  };

  const handleConnect = () => {
    if (!selectedCircle || !connectToAddress.trim()) return;

    const targetCircle = circles.find(
      (c) => c.address === connectToAddress.trim()
    );
    if (targetCircle && targetCircle.id !== selectedCircle.id) {
      const newConnection = {
        id: Date.now(),
        from: selectedCircle.id,
        to: targetCircle.id,
      };
      setConnections((prev) => [...prev, newConnection]);
    }

    setSelectedCircle(null);
    setConnectToAddress("");
  };

  const closePopup = () => {
    setSelectedCircle(null);
    setConnectToAddress("");
  };

  const closeDuplicateModal = () => {
    setShowDuplicateModal(false);
  };

  const handleInsert = () => {
    setShowInsertButton(false);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowInsertModal(true);
  };

  const closeInsertModal = () => {
    setShowInsertModal(false);
  };

  const closeIndexModal = () => {
    setShowIndexModal(false);
    setInsertIndex("");
  };

  const handleIndexSubmit = () => {
    const index = parseInt(insertIndex.trim());
    if (isNaN(index) || index < 1) {
      alert("Please enter a valid index (must be >= 1)");
      return;
    }
    const maxIndex = circles.length;
    if (index > maxIndex) {
      alert(`Index too large. Maximum index is ${maxIndex}`);
      return;
    }
  // handleSpecificInsertion removed
    closeIndexModal();
    closeInsertModal();
  };


  // --- QUEUE OPERATIONS ---
  // PEEK: Highlight the value at the head/front of the queue (first node in the chain)
  const [highlightedCircleId, setHighlightedCircleId] = useState(null);
  const handlePeek = () => {
    // Boost energy when PEEK is used
    boostEnergyWithPeek();
    
    // Find the head node (no incoming connections, has outgoing)
    const head = circles.find((circle) => isHeadNode(circle.id));
   
    closeInsertModal(); // Close insert modal after clicking peek
    if (head) {
       try {
          const audio = new window.Audio('/sounds/charged.mp3');
          audio.loop = false;
          audio.volume = 1;
          portalAudioRef.current = audio;
          // Play with promise catch for browser compatibility
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } catch {
          // Ignore audio errors
        }
      setHighlightedCircleId(head.id);
      setTimeout(() => setHighlightedCircleId(null), 1500);
    } else {
      setHighlightedCircleId(null);
    }
  };

  // ENQUEUE: Add a new node to the tail/end of the queue
  const handleEnqueue = () => {

    // Play audio effect for enqueue
    try {
      const audio = new window.Audio('/sounds/explode.mp3');
      audio.currentTime = 0;
      audio.play().catch(() => {/* Ignore play errors */});
    } catch {
      // Ignore audio errors
    }
    if (!address.trim() || !value.trim()) {
      alert("Please enter both address and value before enqueueing");
      return;
    }
    const addressExists = circles.some((circle) => circle.address === address.trim());
    if (addressExists) {
      setShowDuplicateModal(true);
      closeInsertModal();
      return;
    }

    // Find the current tail node (has incoming but no outgoing connection)
    let tail = circles.find((circle) => isTailNode(circle.id));

    // If only one node exists, treat it as both head and tail
    if (circles.length === 1) {
      tail = circles[0];
    }

    // Create new circle
    const newCircle = {
      id: Date.now(),
      address: address.trim(),
      value: value.trim(),
      x: window.innerWidth - 10,
      y: window.innerHeight - 55,
      velocityX: -8 - Math.random() * 5,
      velocityY: -5 - Math.random() * 3,
    };

    setCircles((prev) => [...prev, newCircle]);

    // If there is a tail, connect it to the new node
    if (tail) {
      setConnections((prev) => [
        ...prev,
        {
          id: `conn-${tail.id}-${newCircle.id}`,
          from: tail.id,
          to: newCircle.id,
        },
      ]);
    }

    setAddress("");
    setValue("");
    closeInsertModal();
  };

  // DEQUEUE: Remove the node at the head/front of the queue
  const handleDequeue = () => {
    try{
      const audio = new window.Audio('/sounds/dequeue_sound.mp3');
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {/* Ignore play errors */});
      }
    } catch {
      // Ignore audio errors
    }
    // Find the head node (no incoming connections, has outgoing)
    const head = circles.find((circle) => isHeadNode(circle.id));
    if (!head) {
      setHighlightedCircleId(null);
      closeInsertModal();
      return;
    }
    setHighlightedCircleId(head.id);
    closeInsertModal();
    
    // Prevent double explosions by using a unique identifier
    const explosionId = `dequeue-${head.id}-${Date.now()}`;
    
    setTimeout(() => {
      setHighlightedCircleId(null);
      setCircles((prev) => {
        // Find the current position of the head node right before deletion
        const currentHead = prev.find((c) => c.id === head.id);
        if (currentHead) {
          // Create explosion effect with current position - use unique identifier
          const explosion = {
            id: explosionId,
            x: currentHead.x,
            y: currentHead.y,
            color: '#e9e2e1ff',
          };
          
          setExplosions(prevExplosions => {
            // Check if explosion with this ID already exists
            const alreadyExists = prevExplosions.some(exp => exp.id === explosionId);
            if (!alreadyExists) {
              return [...prevExplosions, explosion];
            }
            return prevExplosions;
          });

          // Clean up explosion after animation
          setTimeout(() => {
            setExplosions(prev => prev.filter(exp => exp.id !== explosionId));
          }, 2500);
        }
        
        // Remove the head node
        const newCircles = prev.filter((c) => c.id !== head.id);
        return newCircles;
      });
      setConnections((prev) => {
        // Remove all connections to/from head
        let updated = prev.filter((conn) => conn.from !== head.id && conn.to !== head.id);
        return updated;
      });
    }, 1000);
  };

  // Updated handleInsertOption to use queue operations
  const handleInsertOption = (option) => {
    switch (option) {
      case "head":
        handlePeek();
        break;
      case "specific":
        handleEnqueue();
        break;
      case "tail":
        handleDequeue();
        break;
      default:
        break;
    }
  };


  const optimizeConnectionsAfterDeletion = (connections) => {
    const connectionMap = new Map();
    connections.forEach((conn) => {
      const key = `${conn.from}-${conn.to}`;
      if (!connectionMap.has(key)) {
        connectionMap.set(key, conn);
      }
    });
    return Array.from(connectionMap.values());
  };

  const handleDeleteCircle = () => {
    if (!selectedCircle) return;
    
    // Create explosion effect before deleting

    
    const nodeToDelete = selectedCircle.id;
    const incomingConnections = connections.filter(
      (conn) => conn.to === nodeToDelete
    );
    const outgoingConnections = connections.filter(
      (conn) => conn.from === nodeToDelete
    );
    const isHead = isHeadNode(nodeToDelete);
    const isTail = isTailNode(nodeToDelete);
    const isMiddle =
      incomingConnections.length > 0 && outgoingConnections.length > 0;

    setCircles((prevCircles) =>
      prevCircles.filter((circle) => circle.id !== nodeToDelete)
    );

    setConnections((prevConnections) => {
      let updatedConnections = prevConnections.filter(
        (conn) => conn.from !== nodeToDelete && conn.to !== nodeToDelete
      );

      if (isMiddle) {
        const newConnections = [];
        incomingConnections.forEach((inConn) => {
          outgoingConnections.forEach((outConn) => {
            if (inConn.from !== outConn.to) {
              newConnections.push({
                id: Date.now() + Math.random(),
                from: inConn.from,
                to: outConn.to,
              });
            }
          });
        });
        updatedConnections = [...updatedConnections, ...newConnections];
      } else if (isHead && outgoingConnections.length > 0) {
        // next nodes become heads
      } else if (isTail && incomingConnections.length > 0) {
        // previous nodes become tails
      }

      return optimizeConnectionsAfterDeletion(updatedConnections);
    });

    closePopup();
  };

  useEffect(() => {
    const handleMouseMoveGlobal = (e) => {
      if (draggedCircle) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const findValidPosition = (targetX, targetY, currentX, currentY) => {
          const circleRadius = 30;

          const isValid = (x, y) => {
            const controlsHeight = 55;
            const controlsWidth = 1320;
            const controlsLeft = window.innerWidth * 0.45 - controlsWidth / 2;
            const controlsRight = controlsLeft + controlsWidth;
            const controlsTop = window.innerHeight - 5 - controlsHeight;
            const controlsBottom = window.innerHeight - 10;

            if (
              x + circleRadius >= controlsLeft &&
              x - circleRadius <= controlsRight &&
              y + circleRadius >= controlsTop &&
              y - circleRadius <= controlsBottom
            ) {
              return false;
            }

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

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveGlobal);
      document.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, [draggedCircle, dragOffset, findConnectedCircles, circles]);

  return (
    
    <div 
      className={styles.app}
      style={{
        filter: `brightness(${screenOpacity})`,
        transition: screenOpacity === 1 ? 'filter 0.5s ease-out' : 'none', // Smooth brighten, gradual dim
      }}
    >
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
        <source src="./video/mars.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>


      <button
        className={styles.instructionButton}
        onClick={() => setShowInstructionPopup(!showInstructionPopup)}
      >
        i
      </button>

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
                        <div className={styles.expectedBarValue}>{node.value}</div>
                        <div className={styles.expectedBarAddress}>{node.address}</div>
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
      
      <Level5Instruction 
        showInstructionPopup={showInstructionPopup}
        currentExercise={currentExercise}
        startExercise={startExercise}
      />
     
      <PortalComponent
        onPortalStateChange={handlePortalStateChange}
        isOpen={isPortalOpen}
      />
      
      {/* Portal particles for vacuum effect */}
      <PortalParticles 
        portalInfo={portalInfo} 
      />
      
      {/* Explosion particles for circle deletion/destruction */}
      <ExplodeParticles 
        explosions={explosions}
      />
      
      <div
        className={styles.rightSquare}
        style={{ outlineOffset: "5px" }}
      />
      
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="ENTER ADDRESS"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="ENTER VALUE"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.inputField}
        />
        <div className={styles.buttonContainer}>
          {showInsertButton && (
            <button
              onClick={handleInsert}
              className={styles.insertButton}
            >
              QUEUE MENU
            </button>
          )}
          <button
            onClick={handleInsert}
            className={styles.launchButton}
          >
            QUEUE MENU
          </button>
        </div>
        <button
          onClick={isPortalButtonEnabled ? togglePortal : undefined}
          className={`${styles.portalButton} ${
            !isPortalButtonEnabled ? styles.portalButtonDisabled : ""
          } ${isPortalOpen ? styles.portalButtonOpen : ""}`}
          disabled={!isPortalButtonEnabled}
        >
          {isPortalOpen ?"CLOSE PORTAL" : "OPEN PORTAL"}
        </button>
      </div>
      
  {circles.map((circle) => {
        // Only label as head the unique node with outgoing connections and no incoming connections
        // that is also the start of a connected component (reachable by others)
        const hasOutgoing = connections.some(conn => conn.from === circle.id);
        const hasIncoming = connections.some(conn => conn.to === circle.id);
        const isConnected = hasOutgoing || hasIncoming;
        // Find all possible heads (connected, has outgoing, no incoming)
        const possibleHeads = circles.filter(c => {
          const out = connections.some(conn => conn.from === c.id);
          const inc = connections.some(conn => conn.to === c.id);
          return (out && !inc && (out || inc));
        });
        // Only one node should be labeled as head: the first in possibleHeads
        const isHead = isConnected && hasOutgoing && !hasIncoming && possibleHeads.length > 0 && possibleHeads[0].id === circle.id;
        const isTail = isConnected && hasIncoming && !hasOutgoing;
        const isSingle = circles.length === 1;

        return (
          <div
            key={circle.id}
            className={[
              styles.animatedCircle,
              suckingCircles.includes(circle.id) ? styles.beingSucked : "",
              highlightedCircleId === circle.id ? styles.highlightedCircle : ""
            ].join(" ")}
            style={{
              left: `${circle.x - 30}px`,
              top: `${circle.y - 30}px`,
              cursor:
                draggedCircle && circle.id === draggedCircle.id
                  ? "grabbing"
                  : "grab",
            }}
            onMouseDown={(e) => handleMouseDown(e, circle)}
            onDoubleClick={() => handleDoubleClick(circle)}
          >
            {(isSingle || isHead || isTail) && (
              <span className={styles.nodeTypeLabel}>
                {isSingle ? "Head/Tail" : isHead ? "Head" : "Tail"}
              </span>
            )}
            <span className={styles.circleValue}>{circle.value}</span>
            <span className={styles.circleAddress}>{circle.address}</span>
          </div>
        );
      })}
      
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

              {currentExercise &&
                currentExercise.expectedStructure &&
                originalSubmission &&
                originalSubmission.circles && (
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
                                currentExercise.expectedStructure.length -
                                  1 && (
                                <td className={styles.arrowCellEmpty}></td>
                              )}
                            </React.Fragment>
                          )
                        )}
                      </tr>

                      <tr className={styles.userRow}>
                        {(() => {
                          // Show the actual sucked order (portal entry order)
                          const suckedOrder = suckedCircles
                            .map(id => originalSubmission.circles.find(c => c.id === id))
                            .filter(Boolean);
                          return currentExercise.expectedStructure.map(
                            (expectedNode, index) => {
                              const userNode = suckedOrder[index];
                              const isCorrect =
                                userNode && parseInt(userNode.value) === expectedNode.value;
                              return (
                                <React.Fragment key={`user-${expectedNode.value}`}>
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
                                      <div className={`${styles.userNode} ${styles.userNodeMissing}`}>
                                        <div className={styles.userNodeValue}>?</div>
                                        <div className={styles.userNodeAddress}>?</div>
                                      </div>
                                    )}
                                  </td>
                                  {index < currentExercise.expectedStructure.length - 1 && (
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
                  // Always close the portal after submitting/validation
                  setIsPortalOpen(false);
                  setPortalInfo((prev) => ({ ...prev, isVisible: false }));
                  // If perfected and on exercise_one, go to exercise_two
                  if (validationResult && validationResult.isCorrect && exerciseKey === "exercise_one") {
                    loadExercise("exercise_two");
                  } else if (validationResult && validationResult.isCorrect && exerciseKey === "exercise_two") {
                    loadExercise("exercise_tree");
                  }
                }}
                className={styles.continueButton}
              >
                {validationResult && validationResult.isCorrect && exerciseKey === "exercise_one" ? "NEXT EXERCISE" :
                 validationResult && validationResult.isCorrect && exerciseKey === "exercise_two" ? "NEXT EXERCISE" : "CONTINUE"}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                placeholder={(() => {
                  const outgoingConn = connections.find(conn => conn.from === selectedCircle.id);
                  if (outgoingConn) {
                    const targetCircle = circles.find(c => c.id === outgoingConn.to);
                    return targetCircle ? `${targetCircle.address}` : "Enter Address";
                  }
                  return "Enter Address";
                })()}
                value={connectToAddress}
                disabled={true}
                onChange={(e) => setConnectToAddress(e.target.value)}
                className={styles.popupInput}
                autoFocus
              />
              <div className={styles.popupButtons}>
                <button
                  onClick={handleConnect}
                  disabled={true}
                  className={`${styles.popupButton} ${styles.connectBtn}`}
                  
                >
                  CONNECT
                </button>
                <button
                  onClick={handleDeleteCircle}
                  className={`${styles.popupButton} ${styles.deleteBtn}`}
                  disabled={true}
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className={styles.errorModalOverlay} onClick={closeDuplicateModal}>
          <div
            className={styles.errorModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.errorModalCloseBtn}
              onClick={closeDuplicateModal}
            >
              ×
            </button>
            <div className={styles.errorIcon}>
              <span className={styles.exclamation}>!</span>
            </div>
            <div className={styles.errorTitle}>Duplicate Address</div>
            <div className={styles.errorMessageText}>
              Nodes cannot have the same address
            </div>
          </div>
        </div>
      )}

      {showInsertModal && (
        <div className={styles.insertModalOverlay} onClick={closeInsertModal}>
          <div
            className={styles.insertModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.insertModalCloseBtn}
              onClick={closeInsertModal}
            >
              ×
            </button>

            <div className={styles.insertOptions}>
              <button
                className={`${styles.insertOptionBtn} head-btn ${isPeekDisabled ? styles.disabledBtn : ''}`}
                onClick={() => !isPeekDisabled && handleInsertOption("head")}
                disabled={isPeekDisabled}
              >
                <div className={styles.optionTitle}>PEEK</div>
                <div className={styles.optionSubtitle}>
                  {isPeekDisabled 
                    ? "No head node available or only one circle remaining" 
                    : "Returns the element at the front (head) of the queue."
                  }
                </div>
              </button>

              <button
                className={`${styles.insertOptionBtn} specific-btn`}
                onClick={() => handleInsertOption("specific")}
              >
                <div className={styles.optionTitle}>ENQUEUE</div>
                <div className={styles.optionSubtitle}>
                  Adds an element to the back of a queue.
                </div>
              </button>

              <button
                className={`${styles.insertOptionBtn} tail-btn ${isDequeueDisabled ? styles.disabledBtn : ''}`}
                onClick={() => !isDequeueDisabled && handleInsertOption("tail")}
                disabled={isDequeueDisabled}
              >
                <div className={styles.optionTitle}>DEQUEUE</div>
                <div className={styles.optionSubtitle}>
                  {isDequeueDisabled 
                    ? "No head node available or only one circle remaining" 
                    : "Removes the element at the front of the queue."
                  }
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showIndexModal && (
        <div className={styles.indexModalOverlay} onClick={closeIndexModal}>
          <div
            className={styles.indexModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.indexModalCloseBtn}
              onClick={closeIndexModal}
            >
              ×
            </button>
            <div className={styles.indexModalTitle}>Index</div>
            <div className={styles.indexInputContainer}>
              <input
                type="text"
                placeholder="Enter Index"
                value={insertIndex}
                onChange={(e) => setInsertIndex(e.target.value)}
                className={styles.indexInput}
                autoFocus
              />
              <button onClick={handleIndexSubmit} className={styles.indexGoBtn}>
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalistAbstractDataType;
