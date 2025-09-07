// --- Add refs to reliably track entry order and sucked circles ---

import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./NodeCreation.module.css";
import { ExerciseManager } from "./NodeCreationExercise";
import { collisionDetection } from "../../../CollisionDetection";
import PortalComponent from "../../../PortalComponent";
import PortalParticles from "../../../Particles.jsx";

function GalistNodeCreation() {
  // --- Add refs to reliably track entry order and sucked circles ---
  const entryOrderRef = useRef([]);
  const suckedCirclesRef = useRef([]); // Will store the actual circle objects in order
  // Track which exercise is active
  const [exerciseKey, setExerciseKey] = useState("exercise_one");
  const [address, setAddress] = useState("");
  const [value, setValue] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  // const [showInsertButton, setShowInsertButton] = useState(false);
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

  // Exercise progress indicator logic
  const EXERCISE_KEYS = ["exercise_one", "exercise_two", "exercise_tree"];
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
        // setShowInsertButton(false);
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

        // Second pass: Apply collision detection and physics
        const allCirclesForCollision = circlesWithSpecialBehavior;
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

  // Auto-suction effect when portal opens - prioritize head nodes
  useEffect(() => {
    if (portalInfo.isVisible && circles.length > 0) {
      // For node creation, just suck in all circles (no head/tail logic)
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

  const handleLunchHoverStart = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    const timer = setTimeout(() => {
      // setShowInsertButton(true);
    }, 2000);
    setHoverTimer(timer);
  };

  const handleLunchHoverEnd = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    const hideTimer = setTimeout(() => {
      // setShowInsertButton(false);
    }, 100);
    setHoverTimer(hideTimer);
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
    handleSpecificInsertion(index);
    closeIndexModal();
    closeInsertModal();
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

    setCircles((prev) => [...prev, newHead]);
    // Do not clear suckedCirclesRef or entryOrderRef here
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

    setCircles((prev) => [...prev, newTail]);
    // Do not clear suckedCirclesRef or entryOrderRef here
    setAddress("");
    setValue("");
  };


  const handleSpecificInsertion = (index) => {
    const targetIndex = parseInt(index);
    if (isNaN(targetIndex) || targetIndex < 0) {
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

    setCircles((prev) => [...prev, newNode]);
    // Do not clear suckedCirclesRef or entryOrderRef here
    setAddress("");
    setValue("");
    setInsertIndex("");
  };

 

  const handleDeleteCircle = () => {
    if (!selectedCircle) return;
    const nodeToDelete = selectedCircle.id;
    
    setCircles((prevCircles) =>
      prevCircles.filter((circle) => circle.id !== nodeToDelete)
    );
    setConnections((prevConnections) =>
      prevConnections.filter(
        (conn) => conn.from !== nodeToDelete && conn.to !== nodeToDelete
      )
    );
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
    // Do not clear suckedCirclesRef or entryOrderRef here
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
        <source src="./video/node_creation_bg.mp4" type="video/mp4" />
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

      {showInstructionPopup &&
        currentExercise &&
        currentExercise.expectedStructure && (
          <div className={styles.instructionPopup}>
            <div className={styles.instructionContent}>
              <h1>{currentExercise.title}</h1>
              <div className={styles.instructionList}>
                {currentExercise.expectedStructure.map((node, index) => (
                  <div key={index} className={styles.instructionItem}>
                    <span className={styles.instructionValue}>
                      Value: {node.value}
                    </span>
                    <span className={styles.instructionArrow}>→</span>
                    <span className={styles.instructionAddress}>
                      Address: {node.address}
                    </span>
                  </div>
                ))}
              </div>
              <button className={styles.startButton} onClick={startExercise}>
                Start
              </button>
            </div>
          </div>
        )}

      {/* Portal particles for vacuum effect */}
      <PortalParticles 
        portalInfo={portalInfo} 
      />
      <PortalComponent
        onPortalStateChange={handlePortalStateChange}
        isOpen={isPortalOpen}
      />
      <div className={styles.rightSquare} style={{ outlineOffset: "5px" }} />

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
          
          <button
            onClick={launchCircle}
            className={styles.launchButton}
            onMouseEnter={handleLunchHoverStart}
            onMouseLeave={handleLunchHoverEnd}
          >
            LAUNCH
          </button>
        </div>
        <button
          onClick={togglePortal}
          className={`${styles.portalButton} ${
            isPortalOpen ? styles.portalButtonOpen : ""
          }`}
          disabled={circles.length === 0}
        >
          {isPortalOpen ? "CLOSE PORTAL" : "OPEN PORTAL"}
        </button>
      </div>

      {circles.map((circle) => (
        <div
          key={circle.id}
          className={`${styles.animatedCircle} ${
            suckingCircles.includes(circle.id) ? styles.beingSucked : ""
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
          // Double click disabled
        >
          <span className={styles.circleValue}>{circle.value}</span>
          <span className={styles.circleAddress}>{circle.address}</span>
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

export default GalistNodeCreation;
