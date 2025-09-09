import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./Competitive.module.css";
import { ExerciseManager } from "./CompetitiveExercise";
import { collisionDetection } from "../../CollisionDetection";
import PortalComponent from "../../PortalComponent";
import CompetitiveInstruction from "./CompetitiveInstruction";

function CompetitiveMode(){
  // Timer state - 3 minutes (180 seconds)
  const [timeLeft, setTimeLeft] = useState(180);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(0);
  
  // --- Move all useState declarations to the top ---
  const [address, setAddress] = useState("");
  const [value, setValue] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  

  const [showInsertButton, setShowInsertButton] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
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
  const explosionIdRef = useRef(0);
  const [suckingCircles, setSuckingCircles] = useState([]);
  const [suckedCircles, setSuckedCircles] = useState([]);
  const [currentEntryOrder, setCurrentEntryOrder] = useState([]);
  const [originalSubmission, setOriginalSubmission] = useState(null);
  
  // Explosion particle system and highlighting
  const [explosions, setExplosions] = useState([]);
  const [highlightedCircleId, setHighlightedCircleId] = useState(null);

    // Exercise progress indicator logic - now shows completed exercises instead of current/total
  // const EXERCISE_KEYS = ["exercise_one", "exercise_two", "exercise_three"];
  // const currentExerciseNumber = EXERCISE_KEYS.indexOf(exerciseKey) + 1;
  // const totalExercises = EXERCISE_KEYS.length;

  // Removed initial launch logic and related refs

  // useEffect(() => {
  //   hasLaunchedRef.current = false;
  //   launchInitialCircles();
  //   return () => {
  //     if (launchTimeoutRef.current) {
  //       clearTimeout(launchTimeoutRef.current);
  //       launchTimeoutRef.current = null;
  //     }
  //   };
  // }, [exerciseKey, launchInitialCircles]);

  // Timer effect - countdown from 3 minutes
  useEffect(() => {
    let timer;
    if (isGameActive && timeLeft > 0 && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            setGameOver(true);
            setIsGameActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGameActive, timeLeft, gameOver]);

  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the game timer
  const startGameTimer = useCallback(() => {
    setIsGameActive(true);
    setGameOver(false);
    setTimeLeft(180); // Reset to 3 minutes
    setCompletedExercises(0);
  }, []);

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

  // Portal toggle function
  const togglePortal = useCallback(() => {
    setIsPortalOpen(!isPortalOpen);
  }, [isPortalOpen]);

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

  // Exercise system states
  const exerciseManagerRef = useRef(new ExerciseManager());
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  // Game menu actions
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
        setAddress("");
        setValue("");
        setShowDuplicateModal(false);
        
       
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
    isGameActive && !gameOver && (isPortalOpen || (hasHeadNode() && hasTailNode()));

  // Helper functions to determine if queue operations should be disabled
  const isOnlyOneCircle = circles.length === 1;
  const isSingleHeadTail = isOnlyOneCircle && circles.length > 0;
  
  // Disable PEEK when no head exists or only one circle (head/tail)
  const isPeekDisabled = !hasHeadNode() || isSingleHeadTail;
  
  // Disable DEQUEUE when no head exists or only one circle (head/tail) 
  const isDequeueDisabled = !hasHeadNode() || isSingleHeadTail;
  
  // ENQUEUE is always available when we have address and value

  

  const loadExercise = useCallback(() => {
    // Always clear circles/connections and reset launch state before loading new exercise
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    setSuckedCircles([]);
    setCurrentEntryOrder([]);
    setOriginalSubmission(null);
    setShowValidationResult(false);
    setValidationResult(null);
  // removed hasLaunchedRef, no longer needed
    // Now load the new random exercise
    const exercise = exerciseManagerRef.current.loadRandomExercise();
    setCurrentExercise(exercise);
  }, []);

  const startExercise = useCallback(() => {
    setShowInstructionPopup(false);
    if (!currentExercise) {
      loadExercise();
    }
    // Start the competitive timer when user clicks Start
    startGameTimer();
  }, [loadExercise, currentExercise, startGameTimer]);

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
            const headBoost = 1.5;
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

        // Second pass: Apply collision detection and physics
        const allCirclesForCollision = circlesWithSpecialBehavior;
        const draggedCircleData = draggedCircle
          ? allCirclesForCollision.find((circle) => circle.id === draggedCircle.id)
          : null;
        const updatedAllCircles =
          allCirclesForCollision.length > 0
            ? collisionDetection.updatePhysics(allCirclesForCollision, suckingCircles)
            : [];
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
  const handleLunchHoverStart = () => {
    // Clear any existing timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Set a timer to show the buttons after 2 seconds
    const timer = setTimeout(() => {
      setShowInsertButton(true);
    }, 1000);
    setHoverTimer(timer);
  };

  const handleLunchHoverEnd = () => {
    // Don't immediately hide if buttons are visible - give time to move to them
    if (showInsertButton) {
      const hideTimer = setTimeout(() => {
        setShowInsertButton(false);
      }, 1000); // Give 1 full second to move to buttons
      setHoverTimer(hideTimer);
    } else {
      // If buttons aren't visible yet, just clear the show timer
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
    }
  };

  const handleInsertHover = () => {
    // Keep buttons visible - clear any hide timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const handleInsertLeave = () => {
    // Hide immediately when leaving the buttons container
    setShowInsertButton(false);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const handleInsert = () => {
    setShowInsertButton(false);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowInsertModal(true);
  };

  const handleQueue = () => {
    setShowInsertButton(false);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowQueueModal(true);
  };

  // --- QUEUE OPERATIONS ---
  // PEEK: Highlight the value at the head/front of the queue (first node in the chain)
  const handlePeek = () => {
    // Find the head node (no incoming connections, has outgoing)
    const head = circles.find((circle) => isHeadNode(circle.id));
   
    closeQueueModal(); // Close queue modal after clicking peek
    if (head) {
       try {
          const audio = new window.Audio('/sounds/charged.mp3');
          audio.loop = false;
          audio.volume = 1;
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
      closeQueueModal();
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
    closeQueueModal();
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
      closeQueueModal();
      return;
    }
    setHighlightedCircleId(head.id);
    closeQueueModal();
    
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

  const closeInsertModal = () => {
    setShowInsertModal(false);
  };

  const closeQueueModal = () => {
    setShowQueueModal(false);
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
    handleSpecificInsertion(index);
    closeIndexModal();
    closeInsertModal();
  };

  const handleSpecificInsertion = (index) => {
    const targetIndex = parseInt(index);
    if (isNaN(targetIndex) || targetIndex < 0) {
      alert("Please enter a valid index.");
      return;
    }

    const newNode = {
      id: Date.now(),
      address: address.trim(),
      value: value.trim(),
      x: window.innerWidth - 10,
      y: window.innerHeight - 55,
      velocityX: -8 - Math.random() * 5,
      velocityY: -5 - Math.random() * 3,
    };

    const headNodes = circles.filter((circle) => isHeadNode(circle.id));

    if (headNodes.length === 0) {
      // If no head exists, just add the new node
      setCircles((prev) => [...prev, newNode]);
    } else {
      // Handle specific insertion logic here
      const head = headNodes[0];
      const chainOrder = getChainOrder(head.id);
      
      if (targetIndex === 1) {
        // Insert at head
        handleHeadInsertion();
        return;
      } else if (targetIndex > chainOrder.length) {
        // Insert at tail
        handleTailInsertion();
        return;
      } else {
        // Insert at specific position
        setCircles((prev) => [...prev, newNode]);
        
        // Update connections for specific insertion
        const actualIndex = targetIndex - 1; // Convert to 0-based
        if (actualIndex > 0 && actualIndex < chainOrder.length) {
          const prevNodeId = chainOrder[actualIndex - 1];
          const nextNodeId = chainOrder[actualIndex];
          
          // Remove connection between prev and next
          setConnections((prev) =>
            prev.filter(
              (conn) => !(conn.from === prevNodeId && conn.to === nextNodeId)
            )
          );
          
          // Add connections prev -> new and new -> next
          setTimeout(() => {
            setConnections((prev) => [
              ...prev,
              { id: `${prevNodeId}-${newNode.id}`, from: prevNodeId, to: newNode.id },
              { id: `${newNode.id}-${nextNodeId}`, from: newNode.id, to: nextNodeId },
            ]);
          }, 100);
        }
      }
    }

    setAddress("");
    setValue("");
    setInsertIndex("");
  };

  const handleInsertOption = (option) => {
    if (!address.trim() || !value.trim()) {
      alert("Please enter both address and value before inserting");
      return;
    }

    const addressExists = circles.some(
      (circle) => circle.address === address.trim()
    );
    if (addressExists) {
      setShowDuplicateModal(true);
      closeInsertModal();
      return;
    }

    switch (option) {
      case "head":
        handleHeadInsertion();
        break;
      case "specific":
        setShowIndexModal(true);
        break;
      case "tail":
        handleTailInsertion();
        break;
      default:
        break;
    }

    closeInsertModal();
  };

  // --- QUEUE OPERATIONS ---
  const handleQueueOption = (option) => {
    switch (option) {
      case "peek":
        handlePeek();
        break;
      case "enqueue":
        handleEnqueue();
        break;
      case "dequeue":
        handleDequeue();
        break;
      default:
        break;
    }
  };

  const handleHeadInsertion = () => {
    const newHead = {
      id: Date.now(),
      address: address.trim(),
      value: value.trim(),
      x: window.innerWidth - 10,
      y: window.innerHeight - 55,
      velocityX: -8 - Math.random() * 5,
      velocityY: -5 - Math.random() * 3,
    };

    const currentHeads = circles.filter((circle) => isHeadNode(circle.id));

    setCircles((prev) => [...prev, newHead]);

    if (currentHeads.length > 0) {
      const newConnections = currentHeads.map((head) => ({
        id: Date.now() + Math.random(),
        from: newHead.id,
        to: head.id,
      }));

      setConnections((prev) => [...prev, ...newConnections]);
    }

    setAddress("");
    setValue("");
  };

  const handleTailInsertion = () => {
    const newTail = {
      id: Date.now(),
      address: address.trim(),
      value: value.trim(),
      x: window.innerWidth - 10,
      y: window.innerHeight - 55,
      velocityX: -8 - Math.random() * 5,
      velocityY: -5 - Math.random() * 3,
    };

    const currentTails = circles.filter((circle) => isTailNode(circle.id));

    setCircles((prev) => [...prev, newTail]);

    if (currentTails.length > 0) {
      const newConnections = currentTails.map((tail) => ({
        id: Date.now() + Math.random(),
        from: tail.id,
        to: newTail.id,
      }));

      setConnections((prev) => [...prev, ...newConnections]);
    }

    setAddress("");
    setValue("");
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

  const launchCircle = () => {
    // Prevent launching when game is not active or is over
    if (!isGameActive || gameOver) {
      return;
    }
    
    if (!address.trim() || !value.trim()) return;

    const addressExists = circles.some(
      (circle) => circle.address === address.trim()
    );
    if (addressExists) {
      setShowDuplicateModal(true);
      return;
    }

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
    setAddress("");
    setValue("");
  };

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
        <source src="./video/bubble_bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <button
        className={styles.instructionButton}
        onClick={() => setShowInstructionPopup(!showInstructionPopup)}
      >
        i
      </button>

      {/* Timer (top right) */}
      <div className={styles.timer}>
        <span className={`${styles.timerValue} ${timeLeft <= 30 ? styles.timerDanger : ''}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Score (top left) */}
      <div className={styles.scoreDisplay}>
        <span className={styles.progressLabel}>SCORE:</span>
        <span className={styles.progressValue}>{completedExercises * 100}</span>
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
      
      <CompetitiveInstruction 
        showInstructionPopup={showInstructionPopup}
        startExercise={startExercise}
      />
     
      <PortalComponent
        onPortalStateChange={handlePortalStateChange}
        isOpen={isPortalOpen}
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
          disabled={!isGameActive || gameOver}
        />
        <input
          type="text"
          placeholder="ENTER VALUE"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.inputField}
          disabled={!isGameActive || gameOver}
        />
        <div className={styles.buttonContainer}>
          <div
            className={styles.launchArea}
            onMouseEnter={handleLunchHoverStart}
            onMouseLeave={handleLunchHoverEnd}
          >
            <button
              onClick={launchCircle}
              className={styles.launchButton}
            >
              LAUNCH
            </button>
            {showInsertButton && (
              <div 
                className={styles.hoverButtonsContainer}
                onMouseEnter={handleInsertHover}
                onMouseLeave={handleInsertLeave}
              >
                <button
                  onClick={handleInsert}
                  className={styles.insertButton}
                >
                  INSERT
                </button>
                <button
                  onClick={handleQueue}
                  className={styles.queueButton}
                >
                  QUEUE
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={isPortalButtonEnabled ? togglePortal : undefined}
          className={`${styles.portalButton} ${
            !isPortalButtonEnabled ? styles.portalButtonDisabled : ""
          } ${isPortalOpen ? styles.portalButtonOpen : ""}`}
          disabled={!isPortalButtonEnabled}
        >
          {isPortalOpen ? "CLOSE PORTAL" : "OPEN PORTAL"}
        </button>
      </div>
      
      {circles.map((circle) => {
        // Only label as head the unique node with outgoing connections and no incoming connections
        // that is also the start of a connected component (reachable by others)
        const hasOutgoing = connections.some(conn => conn.from === circle.id);
        const hasIncoming = connections.some(conn => conn.to === circle.id);
        const isConnected = hasOutgoing || hasIncoming;
        
        // Special case: if there's only one circle, it should be labeled as "Head/Tail"
        const isSingleCircle = circles.length === 1;
        
        // Check if this circle is unconnected (not part of any connection)
        const isUnconnected = !hasOutgoing && !hasIncoming;
        
        // Find the first unconnected circle (should be the only one with Head/Tail label)
        const unconnectedCircles = circles.filter(c => {
          const out = connections.some(conn => conn.from === c.id);
          const inc = connections.some(conn => conn.to === c.id);
          return !out && !inc;
        });
        const isFirstUnconnected = isUnconnected && unconnectedCircles.length > 0 && unconnectedCircles[0].id === circle.id;
        
        // Find all possible heads (connected, has outgoing, no incoming)
        const possibleHeads = circles.filter(c => {
          const out = connections.some(conn => conn.from === c.id);
          const inc = connections.some(conn => conn.to === c.id);
          return (out && !inc && (out || inc));
        });
        
        // Logic for head/tail labeling
        const isHead = isConnected && hasOutgoing && !hasIncoming && possibleHeads.length > 0 && possibleHeads[0].id === circle.id;
        const isTail = isConnected && hasIncoming && !hasOutgoing;
        const isHeadTail = isSingleCircle || isFirstUnconnected;

        return (
          
          <div
            key={circle.id}
            className={`${styles.animatedCircle} ${
              suckingCircles.includes(circle.id) ? styles.beingSucked : ""
            } ${
              highlightedCircleId === circle.id ? styles.highlightedCircle : ""
            }`}
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
            {(isHead || isTail || isHeadTail) && (
              <span className={styles.nodeTypeLabel}>
                {isHeadTail ? "Head/Tail" : (isHead ? "Head" : "Tail")}
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

      {/* Explosion particles */}
      {explosions.map((explosion) => (
        <div
          key={explosion.id}
          className={styles.explosionParticle}
          style={{
            left: `${explosion.x - 30}px`,
            top: `${explosion.y - 30}px`,
            '--explosion-color': explosion.color,
          }}
        />
      ))}

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
                          const userCircles = originalSubmission.circles;
                          const userConnections =
                            originalSubmission.connections;

                          const userChain = [];
                          const visited = new Set();

                          let headCircle = userCircles.find((circle) => {
                            const hasOutgoing = userConnections.some(
                              (conn) => conn.from === circle.id
                            );
                            const hasIncoming = userConnections.some(
                              (conn) => conn.to === circle.id
                            );
                            return hasOutgoing && !hasIncoming;
                          });

                          if (headCircle) {
                            let currentId = headCircle.id;
                            while (currentId && !visited.has(currentId)) {
                              visited.add(currentId);
                              const currentCircle = userCircles.find(
                                (c) => c.id === currentId
                              );
                              if (currentCircle) {
                                userChain.push(currentCircle);
                              }
                              const nextConnection = userConnections.find(
                                (conn) => conn.from === currentId
                              );
                              currentId = nextConnection
                                ? nextConnection.to
                                : null;
                            }
                          }

                          userCircles.forEach((circle) => {
                            if (!visited.has(circle.id)) {
                              userChain.push(circle);
                            }
                          });

                          return currentExercise.expectedStructure.map(
                            (expectedNode, index) => {
                              const userNode = userChain.find(
                                (circle) =>
                                  parseInt(circle.value) === expectedNode.value
                              );

                              return (
                                <React.Fragment
                                  key={`user-${expectedNode.value}`}
                                >
                                  <td className={styles.userCell}>
                                    {userNode ? (
                                      <div
                                        className={`${styles.userNode} ${
                                          validationResult.isCorrect
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
                  setValidationResult(null);
                  // Always close the portal after submitting/validation
                  setIsPortalOpen(false);
                  setPortalInfo((prev) => ({ ...prev, isVisible: false }));
                  
                  // If score is 100, load next exercise and increment counter
                  if (validationResult && validationResult.score >= 100) {
                    setCompletedExercises(prev => prev + 1);
                    exerciseManagerRef.current.markExerciseCompleted();
                    loadExercise(); // Load new random exercise
                  }
                  // Otherwise just continue with current exercise
                }}
                className={styles.continueButton}
              >
                {validationResult && validationResult.score >= 100 ? "NEXT EXERCISE" : "CONTINUE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverContent}>
            <div className={styles.gameOverHeader}>
              <h1 className={styles.gameOverTitle}>TIME&apos;S UP!</h1>
            </div>
            <div className={styles.gameOverStats}>
              <div className={styles.gameOverStat}>
                <span className={styles.statLabel}>Exercises Completed:</span>
                <span className={styles.statValue}>{completedExercises}</span>
              </div>
              <div className={styles.gameOverStat}>
                <span className={styles.statLabel}>Final Score:</span>
                <span className={styles.statValue}>{completedExercises * 100}</span>
              </div>
            </div>
            <div className={styles.gameOverButtons}>
              <button 
                onClick={() => {
                  setGameOver(false);
                  setTimeLeft(180);
                  setCompletedExercises(0);
                  setIsGameActive(false);
                  exerciseManagerRef.current.reset();
                  loadExercise();
                }}
                className={styles.playAgainButton}
              >
                PLAY AGAIN
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
              {(() => {
                // Find if selectedCircle is already connected (has outgoing connection)
                const outgoingConn = connections.find(
                  (conn) => conn.from === selectedCircle.id
                );
                let connectedAddress = "";
                if (outgoingConn) {
                  const targetCircle = circles.find(
                    (c) => c.id === outgoingConn.to
                  );
                  connectedAddress = targetCircle ? targetCircle.address : "";
                }
                return (
                  <input
                    type="text"
                    placeholder={outgoingConn ? `${connectedAddress}` : "Enter Address"}
                    value={connectToAddress}
                    onChange={(e) => setConnectToAddress(e.target.value)}
                    className={styles.popupInput}
                    autoFocus
                    disabled={!!outgoingConn}
                  />
                );
              })()}
              <div className={styles.popupButtons}>
                {(() => {
                  const outgoingConn = connections.find(
                    (conn) => conn.from === selectedCircle.id
                  );
                  return (
                    <button
                      onClick={handleConnect}
                      disabled={!!outgoingConn}
                      className={`${styles.popupButton} ${styles.connectBtn}`}
                    >
                      CONNECT
                    </button>
                  );
                })()}
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
                className={`${styles.insertOptionBtn} head-btn`}
                onClick={() => handleInsertOption("head")}
              >
                <div className={styles.optionTitle}>HEAD</div>
                <div className={styles.optionSubtitle}>i = 0 (Head)</div>
              </button>

              <button
                className={`${styles.insertOptionBtn} specific-btn`}
                onClick={() => handleInsertOption("specific")}
              >
                <div className={styles.optionTitle}>SPECIFIC</div>
                <div className={styles.optionSubtitle}>
                  specify both i in [1, N-1]
                </div>
              </button>

              <button
                className={`${styles.insertOptionBtn} tail-btn`}
                onClick={() => handleInsertOption("tail")}
              >
                <div className={styles.optionTitle}>TAIL</div>
                <div className={styles.optionSubtitle}>i = N (After Tail)</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showQueueModal && (
        <div className={styles.insertModalOverlay} onClick={closeQueueModal}>
          <div
            className={styles.insertModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.insertModalCloseBtn}
              onClick={closeQueueModal}
            >
              ×
            </button>

            <div className={styles.insertOptions}>
              <button
                className={`${styles.insertOptionBtn} head-btn ${isPeekDisabled ? styles.disabledBtn : ''}`}
                onClick={() => handleQueueOption("peek")}
                disabled={isPeekDisabled}
              >
                <div className={styles.optionTitle}>PEEK</div>
                <div className={styles.optionSubtitle}>View Front/Head</div>
              </button>

              <button
                className={`${styles.insertOptionBtn} specific-btn ${!address.trim() || !value.trim() ? styles.disabledBtn : ''}`}
                onClick={() => handleQueueOption("enqueue")}
                disabled={!address.trim() || !value.trim()}
              >
                <div className={styles.optionTitle}>ENQUEUE</div>
                <div className={styles.optionSubtitle}>
                  Add to Rear/Tail
                </div>
              </button>

              <button
                className={`${styles.insertOptionBtn} tail-btn ${isDequeueDisabled ? styles.disabledBtn : ''}`}
                onClick={() => handleQueueOption("dequeue")}
                disabled={isDequeueDisabled}
              >
                <div className={styles.optionTitle}>DEQUEUE</div>
                <div className={styles.optionSubtitle}>Remove Front/Head</div>
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

export default CompetitiveMode;
