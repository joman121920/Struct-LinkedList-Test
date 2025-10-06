import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./GalistDeletion.module.css";
import { ExerciseManager } from "./GalistDeletionExercise.js";
import TutorialScene from "./TutorialScene.jsx";

import LoadingScreen from "../../../LoadingScreen/LoadingScreen";

// Main Game Component (your existing game)
function MainGameComponent() {
  const navigate = useNavigate();
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
  // Track which level we've already generated nodes for to avoid regeneration on stage changes
  const generatedLevelRef = useRef(null);
  // Track deleted node keys (value|address) to enforce visual removal even if a stale circle lingers
  const deletedNodeKeysRef = useRef(new Set());
  // Track last passive auto-advance to avoid duplicate triggers
  const lastAutoAdvanceRef = useRef({ level: null, stage: -1 });

  // --- NEW: Challenge Mode Features ---
  // Track which nodes each bullet has hit to create connections
  // eslint-disable-next-line no-unused-vars
  const [_bulletHitSequences, setBulletHitSequences] = useState(new Map());
  // Track activated (color-changed) nodes
  const [activatedNodes, setActivatedNodes] = useState(new Set());
  // Track player-created connections
  const [playerConnections, setPlayerConnections] = useState([]);

  // --- Drag (one-time reposition) for list nodes ---
  // Track what collection initiated the drag ('floating' vs default circle bullets)
  const dragSourceRef = useRef(null);
  // Set of node ids that have already been repositioned once
  const draggedOnceIdsRef = useRef(new Set());
  // Starting position of current drag (for movement distance measuring)
  const dragStartPosRef = useRef(null);
  // Version bump to force re-render when a node consumes its drag
  const [draggedOnceVersion, setDraggedOnceVersion] = useState(0);
  // Fixed drag allowance (non-configurable by player)
  const MAX_DRAGS = 1;
  // History of completed drags for undo (stack)
  const dragHistoryRef = useRef([]);
  // Tooltip state for locked nodes
  const [lockedTooltip, setLockedTooltip] = useState(null); // {x,y,text}
  // Track if undo has been consumed (single-use undo)
  const [undoUsed, setUndoUsed] = useState(false);
  // Collapsible instructions panel state
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);

  // Level completion UI states
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const [completedLevelKey, setCompletedLevelKey] = useState(null);
  const [allLevelsComplete, setAllLevelsComplete] = useState(false);
  const nextLevelTimerRef = useRef(null); // manage auto transition timer

  // Update ref whenever floating circles change
  useEffect(() => {
    floatingCirclesRef.current = floatingCircles;
  }, [floatingCircles]);

  // no expectedOutput for deletion; target is inside currentExercise

  // Generate floating circles only once per level (not every stage change)
  useEffect(() => {
    if (!currentExercise) return;

    const currentLevel = exerciseManagerRef.current.currentLevel;

    // If we switched to a new level OR we have no circles yet, (re)generate
    const needGeneration =
      generatedLevelRef.current !== currentLevel ||
      floatingCircles.length === 0;

    if (!needGeneration) return; // Skip regeneration on mere stage updates

    const circleData =
      exerciseManagerRef.current.generateFloatingCircles(exerciseKey);

    const circles = circleData.map((node) => ({
      id: node.id,
      type: "node",
      value: node.value,
      address: node.address,
      isInList: node.isInList,
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 300) + 150,
      vx: 0,
      vy: 0,
    }));

    setFloatingCircles(circles);
    generatedLevelRef.current = currentLevel;
  }, [currentExercise, exerciseKey, floatingCircles.length]);

  // Initialize history state and handle browser back/forward (run once on mount)
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

  // Validation function removed; immediate deletion now drives gameplay.

  // Define loadExercise BEFORE createPlayerConnection to avoid temporal dead zone when referenced inside callbacks.
  const loadExercise = useCallback((key = "level_1") => {
    setCircles([]);
    setConnections([]);
    setSuckingCircles([]);
    if (entryOrderRef) entryOrderRef.current = [];
    if (suckedCirclesRef) suckedCirclesRef.current = [];
    setShowValidationResult(false);
    setPlayerConnections([]);
    setActivatedNodes(new Set());
    setBulletHitSequences(new Map());
    pendingValidationRef.current = null;
    correctHitRef.current = false;
    // FULL RESET for (re)starting a level or replaying from start
    // Clear any persisted deletion metadata so a replay shows the original full list
    if (deletedNodeKeysRef?.current) {
      deletedNodeKeysRef.current.clear();
    }
    // Clear manager-level deletedNodes so augmentation recalculates from a pristine list
    if (exerciseManagerRef.current) {
      exerciseManagerRef.current.deletedNodes = [];
    }
    // Reset passive auto-advance sentinel so first stage can advance normally later
    lastAutoAdvanceRef.current = { level: null, stage: -1 };
    // Clear floating circles explicitly so generation hook repopulates with fresh node objects
    setFloatingCircles([]);
    // Reset per-level drag usage (allow one node drag again)
    if (draggedOnceIdsRef.current) {
      draggedOnceIdsRef.current.clear();
      setDraggedOnceVersion((v) => v + 1);
    }
    // Reset single-use undo availability
    setUndoUsed(false);
    const exercise = exerciseManagerRef.current.loadExercise(key);
    setCurrentExercise(exercise);
    setStageProgress(exerciseManagerRef.current.getStageProgress());
    setExerciseKey(key);
    generatedLevelRef.current = null; // force regeneration
  }, []);

  const createPlayerConnection = useCallback(
    (fromNodeId, toNodeId) => {
      // Instrumentation: entry log
      try {
        console.log("🧪 [createPlayerConnection] invoked", {
          fromNodeId,
          toNodeId,
          existingPlayerConnections: playerConnections.length,
          ts: Date.now(),
        });
      } catch {
        // ignore logging errors
      }
      const fromNode = floatingCircles.find((c) => c.id === fromNodeId);
      const toNode = floatingCircles.find((c) => c.id === toNodeId);
      if (!fromNode || !toNode) {
        console.warn(
          "Could not find nodes for connection",
          fromNodeId,
          toNodeId
        );
        return;
      }

      // 1. Add the connection if it does not already exist
      const newConnection = {
        id: `player-${fromNodeId}-to-${toNodeId}-${Date.now()}`,
        from: fromNodeId,
        to: toNodeId,
        fromNode,
        toNode,
        isPlayerCreated: true,
      };

      // Synchronous duplicate check BEFORE scheduling state update to avoid race (React async setState)
      const duplicateExists = playerConnections.some(
        (conn) => conn.from === fromNodeId && conn.to === toNodeId
      );
      if (duplicateExists) {
        console.log(
          "🧪 [createPlayerConnection] duplicate connection detected – skipping deletion logic",
          { fromNodeId, toNodeId }
        );
        return;
      }
      setPlayerConnections((prev) => [...prev, newConnection]);
      console.log(
        `🔗 Player connection created: ${fromNode.value}(${fromNode.address}) → ${toNode.value}(${toNode.address})`
      );

      // 2. APPLY DELETION RULES
      // Rule: When a bullet links two nodes in the list, delete all nodes that lie between them
      //       in the original (current remaining) linked list.
      //       If the nodes are adjacent (e.g. B→C), delete the node that comes BEFORE them instead.
      //       After deletion, list reconnects so origin points directly to target (connection already represents this).

      try {
        const exerciseMgr = exerciseManagerRef.current;
        const levelKey = exerciseMgr.currentLevel;
        const exerciseDef = exerciseMgr.exercises[levelKey];
        if (!exerciseDef) {
          console.log("🧪 [deletion] early-exit: no exerciseDef", levelKey);
          return;
        }
        // --- NEW v2 Deletion Logic (order derived from original list) ---
        const originalOrder = exerciseDef.initialList; // authoritative ordering
        const isPresent = (meta) =>
          floatingCirclesRef.current.some(
            (c) => c.value === meta.value && c.address === meta.address
          );
        // Current live nodes in original order
        const liveOrdered = originalOrder.filter(isPresent);

        const indexInOriginal = (circle) =>
          originalOrder.findIndex(
            (n) => n.value === circle.value && n.address === circle.address
          );
        const fromOrigIdx = indexInOriginal(fromNode);
        const toOrigIdx = indexInOriginal(toNode);
        if (fromOrigIdx === -1 || toOrigIdx === -1) {
          console.warn("⚠️ Node not found in original ordering", {
            fromOrigIdx,
            toOrigIdx,
            fromNode,
            toNode,
          });
          return;
        }
        console.log("🧪 [deletion] indices resolved", {
          fromValue: fromNode.value,
          toValue: toNode.value,
          fromOrigIdx,
          toOrigIdx,
          liveOrdered: liveOrdered.map((n) => n.value),
        });
        let startOrig = Math.min(fromOrigIdx, toOrigIdx);
        let endOrig = Math.max(fromOrigIdx, toOrigIdx);
        const distance = endOrig - startOrig;
        const nodesToDelete = [];
        if (distance === 1) {
          // Adjacent in original list: delete preceding original node if still present
          const preceding = startOrig - 1;
          if (preceding >= 0) {
            const candidate = originalOrder[preceding];
            if (isPresent(candidate)) {
              nodesToDelete.push(candidate);
            } else {
              console.log(
                "ℹ️ Preceding node already gone; nothing to delete for adjacency"
              );
            }
          } else {
            console.log(
              "ℹ️ Adjacent pair includes original head; no preceding node"
            );
          }
        } else if (distance > 1) {
          // Delete all strictly between that are still present
          for (let i = startOrig + 1; i < endOrig; i++) {
            const candidate = originalOrder[i];
            if (isPresent(candidate)) nodesToDelete.push(candidate);
          }
        }

        // Special fallback: explicitly handle case connecting nodes at original indices 1 and 2
        // (values 25 and 33 in level_1) should remove original index 0 (value 10) if still present.
        if (
          nodesToDelete.length === 0 &&
          distance === 1 &&
          startOrig === 1 &&
          endOrig === 2
        ) {
          const headCandidate = originalOrder[0];
          if (isPresent(headCandidate)) {
            console.warn(
              "⚠️ Fallback forced deletion of head node due to adjacency (25↔33) not producing deletion earlier.",
              headCandidate
            );
            nodesToDelete.push(headCandidate);
          }
        }
        console.log(
          "🧪 v2 Deletion evaluation",
          JSON.stringify({
            fromOrigIdx,
            toOrigIdx,
            startOrig,
            endOrig,
            distance,
            liveOrdered: liveOrdered.map((n) => n.value),
            nodesToDelete: nodesToDelete.map((n) => n.value),
          })
        );

        if (nodesToDelete.length === 0) {
          // Even if no deletions (e.g., connecting head and its next), still keep connection visually.
          console.log("🧪 [deletion] evaluation produced no nodesToDelete", {
            fromValue: fromNode.value,
            toValue: toNode.value,
            distance,
            startOrig,
            endOrig,
          });
          return;
        }

        // Log deletions for debugging
        console.log(
          `🗑 Deleting ${nodesToDelete.length} node(s) due to connection ${fromNode.value}->${toNode.value}:`,
          nodesToDelete.map((n) => `${n.value}(${n.address})`).join(", ")
        );

        // 3. Remove deleted nodes visually (floatingCircles) & keep ref synced immediately
        setFloatingCircles((prev) => {
          let filtered = prev.filter(
            (c) =>
              !nodesToDelete.some(
                (n) => n.value === c.value && n.address === c.address
              )
          );
          // Safety: if head (value '10') flagged for deletion but still present, force remove
          if (
            filtered.some(
              (c) =>
                c.value === "10" && nodesToDelete.some((n) => n.value === "10")
            )
          ) {
            console.warn(
              "⚠️ Forcing removal of stray head node '10' still present after deletion filter."
            );
            filtered = filtered.filter((c) => c.value !== "10");
          }
          floatingCirclesRef.current = filtered; // sync ref
          return filtered;
        });

        // 3b. ALSO purge from auxiliary moving/aim collections to prevent ghost targeting
        try {
          // Purge from generic circles (bullets + draggable) while preserving bullets
          setCircles((prev) =>
            prev.filter(
              (c) =>
                c.isBullet ||
                !nodesToDelete.some(
                  (n) => n.value === c.value && n.address === c.address
                )
            )
          );
          // Purge suckedCirclesRef list if used for ordering
          if (suckedCirclesRef?.current) {
            const beforeLen = suckedCirclesRef.current.length;
            suckedCirclesRef.current = suckedCirclesRef.current.filter(
              (c) =>
                !nodesToDelete.some(
                  (n) => n.value === c.value && n.address === c.address
                )
            );
            if (beforeLen !== suckedCirclesRef.current.length) {
              console.log(
                "🧹 Purged",
                beforeLen - suckedCirclesRef.current.length,
                "entries from suckedCirclesRef due to deletion"
              );
            }
          }
          // Purge any lingering non-player structural connections list (connections state) if present
          setConnections((prev) =>
            prev.filter(
              (conn) =>
                !nodesToDelete.some(
                  (n) =>
                    (conn.fromNode &&
                      conn.fromNode.value === n.value &&
                      conn.fromNode.address === n.address) ||
                    (conn.toNode &&
                      conn.toNode.value === n.value &&
                      conn.toNode.address === n.address)
                )
            )
          );
        } catch (auxErr) {
          console.warn("Non-fatal auxiliary purge error", auxErr);
        }

        // 4. Remove any player connections that reference deleted nodes (using value/address snapshots)
        setPlayerConnections((prev) => {
          const currentCircles = floatingCirclesRef.current;
          return prev.filter((conn) => {
            const fromMeta =
              conn.fromNode || currentCircles.find((c) => c.id === conn.from);
            const toMeta =
              conn.toNode || currentCircles.find((c) => c.id === conn.to);
            const fromDeleted =
              fromMeta &&
              nodesToDelete.some(
                (n) =>
                  n.value === fromMeta.value && n.address === fromMeta.address
              );
            const toDeleted =
              toMeta &&
              nodesToDelete.some(
                (n) => n.value === toMeta.value && n.address === toMeta.address
              );
            return !(fromDeleted || toDeleted);
          });
        });

        // Track deleted keys (value|address) for guaranteed visual filtering
        nodesToDelete.forEach((n) => {
          deletedNodeKeysRef.current.add(`${n.value}|${n.address}`);
        });

        // 5. Update exercise manager deletedNodes tracking
        nodesToDelete.forEach((n) => {
          if (
            !exerciseMgr.deletedNodes.some(
              (d) => d.value === n.value && d.address === n.address
            )
          ) {
            exerciseMgr.deletedNodes.push({
              value: n.value,
              address: n.address,
            });
          }
        });

        // 6. Re-augment currentExercise so target/remainingList update
        const updatedExercise = exerciseMgr._augmentExercise(
          exerciseDef,
          exerciseMgr.currentStage
        );
        setCurrentExercise(updatedExercise);
        setStageProgress(exerciseMgr.getStageProgress());

        // 7. If the deletion removed the current target node, we might auto-advance stage
        const targetNodeSnapshot = currentExercise?.targetNode;
        if (targetNodeSnapshot) {
          const targetDeleted = nodesToDelete.some(
            (n) =>
              n.value === targetNodeSnapshot.value &&
              n.address === targetNodeSnapshot.address
          );
          if (targetDeleted) {
            const advanced = exerciseMgr.advanceStage(targetNodeSnapshot);
            if (advanced) {
              console.log(
                "🏁 Target node deleted via connection – advancing stage."
              );
              setCurrentExercise(advanced);
              setStageProgress(exerciseMgr.getStageProgress());
            } else {
              console.log("✅ Level complete – no more stages.");
              // Trigger level completion UI overlay
              setCompletedLevelKey(levelKey);
              const nextLevel = exerciseMgr.getNextLevel(levelKey);
              const allDone = !nextLevel;
              setAllLevelsComplete(allDone);
              setShowLevelCompletion(true);
              // Schedule auto advance if there is a next level
              if (nextLevel) {
                if (nextLevelTimerRef.current)
                  clearTimeout(nextLevelTimerRef.current);
                nextLevelTimerRef.current = setTimeout(() => {
                  // Safety: hide overlay then load
                  setShowLevelCompletion(false);
                  loadExercise(nextLevel);
                }, 3000);
              }
            }
          }
        }

        // 7b. Fallback auto-validation: if structure already matches expected and target gone, advance.
        try {
          const remainingLive = exerciseDef.initialList.filter((n) =>
            floatingCirclesRef.current.some(
              (c) => c.value === n.value && c.address === n.address
            )
          );
          const stageCheck = exerciseMgr.validateAndAdvanceStage(
            remainingLive,
            targetNodeSnapshot || updatedExercise.targetNode
          );
          if (stageCheck) {
            console.log("🟢 Fallback validation advanced stage.");
            setCurrentExercise(stageCheck);
            setStageProgress(exerciseMgr.getStageProgress());
          }
        } catch (e) {
          console.log("(non-fatal) fallback validation error", e);
        }
      } catch (err) {
        console.error("Error applying deletion rule after connection:", err);
      }
    },
    [floatingCircles, currentExercise, playerConnections, loadExercise]
  );

  // No head/tail logic needed for node creation level

  // (loadExercise declared earlier)

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
  // Start drag for floating (list) nodes with one-time restriction
  const handleFloatingMouseDown = (e, circle) => {
    if (!circle || circle.isBullet) return;
    // Block if drag allowance consumed
    if (draggedOnceIdsRef.current.size >= MAX_DRAGS) return;
    // Only allow a single reposition per node
    if (draggedOnceIdsRef.current.has(circle.id)) return;
    dragSourceRef.current = "floating";
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedCircle(circle);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    dragStartPosRef.current = { x: circle.x, y: circle.y };
    mouseHistoryRef.current = [
      { x: e.clientX, y: e.clientY, time: Date.now() },
    ];
  };

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

            // Get real-time floating circle positions (filter out deleted nodes defensively)
            const currentFloatingCircles = floatingCirclesRef.current.filter(
              (fc) =>
                !deletedNodeKeysRef.current.has(`${fc.value}|${fc.address}`)
            );
            // Periodically scrub activatedNodes so a deleted node cannot remain activated/aimable
            setActivatedNodes((prev) => {
              let changed = false;
              const next = new Set();
              prev.forEach((id) => {
                const meta = floatingCirclesRef.current.find(
                  (c) => c.id === id
                );
                if (
                  meta &&
                  !deletedNodeKeysRef.current.has(
                    `${meta.value}|${meta.address}`
                  )
                ) {
                  next.add(id);
                } else if (meta) {
                  changed = true;
                }
              });
              return changed ? next : prev;
            });
            for (let i = 0; i < currentFloatingCircles.length; i++) {
              const floatingCircle = currentFloatingCircles[i];

              // Skip if this circle was deleted mid-loop
              if (
                deletedNodeKeysRef.current.has(
                  `${floatingCircle.value}|${floatingCircle.address}`
                )
              ) {
                continue;
              }

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
                      // Guard: ignore activation of deleted / phantom circle
                      if (
                        deletedNodeKeysRef.current.has(
                          `${floatingCircle.value}|${floatingCircle.address}`
                        )
                      ) {
                        console.log(
                          "👻 Skipping activation of deleted node (phantom collision)",
                          floatingCircle
                        );
                        return newSequences;
                      }
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
                        if (
                          deletedNodeKeysRef.current.has(
                            `${floatingCircle.value}|${floatingCircle.address}`
                          )
                        ) {
                          console.log(
                            "👻 Skipping connection to deleted node (phantom collision)",
                            floatingCircle
                          );
                          return newSequences;
                        }
                        console.log(
                          `🔗 Linking nodes: ${previousNodeId} → ${floatingCircle.id}`
                        );

                        // Create connection between the two nodes
                        createPlayerConnection(
                          previousNodeId,
                          floatingCircle.id
                        );

                        // Activate current node and add to sequence
                        setActivatedNodes((prev) => {
                          if (
                            deletedNodeKeysRef.current.has(
                              `${floatingCircle.value}|${floatingCircle.address}`
                            )
                          ) {
                            return prev; // do not activate deleted node
                          }
                          return new Set([...prev, floatingCircle.id]);
                        });
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

      // Drag logic
      if (draggedCircle) {
        // Floating list node drag path (top-left anchored)
        if (dragSourceRef.current === "floating") {
          const newX = e.clientX - dragOffset.x;
          const newY = e.clientY - dragOffset.y;
          const maxX = window.innerWidth - 60;
          const maxY = window.innerHeight - 60;
          const clampedX = Math.min(Math.max(0, newX), maxX);
          const clampedY = Math.min(Math.max(0, newY), maxY);
          setFloatingCircles((prev) =>
            prev.map((c) =>
              c.id === draggedCircle.id ? { ...c, x: clampedX, y: clampedY } : c
            )
          );
          return; // Skip bullet/list circle path below
        }
        // Existing circle dragging logic (only for non-launched circles)
        if (draggedCircle.isLaunched) return;
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
        // Floating node finalization: mark one-time drag if moved
        if (dragSourceRef.current === "floating") {
          const start = dragStartPosRef.current;
          const current = floatingCirclesRef.current.find(
            (c) => c.id === draggedCircle.id
          );
          if (start && current) {
            const dx = current.x - start.x;
            const dy = current.y - start.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 3 && !draggedOnceIdsRef.current.has(draggedCircle.id)) {
              draggedOnceIdsRef.current.add(draggedCircle.id);
              setDraggedOnceVersion((v) => v + 1);
              // Record in history
              dragHistoryRef.current.push({
                nodeId: draggedCircle.id,
                from: { x: start.x, y: start.y },
                to: { x: current.x, y: current.y },
              });
            }
          }
        } else {
          // Original fling inertia for non-floating circles
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
      }
      setDraggedCircle(null);
      setDragOffset({ x: 0, y: 0 });
      dragSourceRef.current = null;
      dragStartPosRef.current = null;
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
    draggedOnceVersion,
  ]);

  // Passive safety net: auto-advance stage if target already deleted & remaining structure matches expected
  useEffect(() => {
    try {
      const exerciseMgr = exerciseManagerRef.current;
      if (!exerciseMgr || !currentExercise) return;
      const { currentLevel, currentStage } = exerciseMgr;
      if (
        lastAutoAdvanceRef.current.level === currentLevel &&
        lastAutoAdvanceRef.current.stage === currentStage
      ) {
        return;
      }
      const targetNode = currentExercise.targetNode;
      if (!targetNode) return;
      const stillPresent = floatingCirclesRef.current.some(
        (c) => c.value === targetNode.value && c.address === targetNode.address
      );
      if (stillPresent) return;
      const exerciseDef = exerciseMgr.exercises[currentLevel];
      if (!exerciseDef) return;
      const remainingLive = exerciseDef.initialList.filter((n) =>
        floatingCirclesRef.current.some(
          (c) => c.value === n.value && c.address === n.address
        )
      );
      const expected = currentExercise.expectedStructure || [];
      const structureMatches =
        remainingLive.length === expected.length &&
        remainingLive.every(
          (n, i) =>
            n.value === expected[i]?.value && n.address === expected[i]?.address
        );
      if (!structureMatches) return;
      const advanced = exerciseMgr.advanceStage({ ...targetNode });
      if (advanced) {
        console.log(
          "🟣 Passive auto-advance: target already deleted & structure matches; advancing stage.",
          { fromStage: currentStage, toStage: exerciseMgr.currentStage }
        );
        lastAutoAdvanceRef.current = {
          level: currentLevel,
          stage: exerciseMgr.currentStage,
        };
        setCurrentExercise(advanced);
        setStageProgress(exerciseMgr.getStageProgress());
      } else {
        // No more stages: level completed via passive check
        console.log("✅ Level complete (passive) – no more stages.");
        setCompletedLevelKey(currentLevel);
        const nextLevel = exerciseMgr.getNextLevel(currentLevel);
        const allDone = !nextLevel;
        setAllLevelsComplete(allDone);
        setShowLevelCompletion(true);
        if (nextLevel) {
          if (nextLevelTimerRef.current)
            clearTimeout(nextLevelTimerRef.current);
          nextLevelTimerRef.current = setTimeout(() => {
            setShowLevelCompletion(false);
            loadExercise(nextLevel);
          }, 3000);
        }
      }
    } catch (e) {
      console.warn("Passive auto-advance check failed (non-fatal)", e);
    }
  }, [floatingCircles, currentExercise, loadExercise]);

  // Cleanup any pending next-level transition timer when component unmounts or level changes
  useEffect(() => {
    return () => {
      if (nextLevelTimerRef.current) {
        clearTimeout(nextLevelTimerRef.current);
        nextLevelTimerRef.current = null;
      }
    };
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

      {/* Challenge Mode Instructions (Collapsible) */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 20,
          background: "rgba(0,0,0,0.8)",
          border: "2px solid #00ff88",
          borderRadius: 10,
          padding: instructionsCollapsed ? "8px 10px" : "15px",
          color: "#fff",
          fontSize: 14,
          maxWidth: 350,
          zIndex: 15,
          transition: "height 0.25s, padding 0.25s",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              color: "#00ff88",
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🚀 Progressive Deletion
          </div>
          <button
            onClick={() => setInstructionsCollapsed((c) => !c)}
            aria-label={
              instructionsCollapsed
                ? "Expand instructions"
                : "Collapse instructions"
            }
            style={{
              background: "#00ff88",
              border: "none",
              color: "#000",
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 0 8px rgba(0,255,136,0.4)",
            }}
          >
            {instructionsCollapsed ? "Show" : "Hide"}
          </button>
        </div>
        {!instructionsCollapsed && (
          <div style={{ marginTop: 8 }}>
            <div>Right-click to shoot balls at nodes.</div>
            <div style={{ color: "#00ff88" }}>
              • First hit: Activates node (turns green)
            </div>
            <div style={{ color: "#00ff88" }}>
              • Second hit: Creates connection!
            </div>
            <div style={{ color: "#ff6600", fontSize: 12, marginTop: 5 }}>
              🎯 Goal: Delete target node by excluding it from connections
            </div>
            <div style={{ color: "#ff6600", fontSize: 12 }}>
              🔗 Connected nodes form the new linked list
            </div>
            <div style={{ color: "#ffaa00", fontSize: 12 }}>
              ⭐ Complete each stage to unlock the next target!
            </div>
            <div style={{ color: "#ffaa00", fontSize: 12, marginTop: 3 }}>
              💡 Don&apos;t connect the target node to delete it
            </div>
            <div style={{ color: "#00bbee", fontSize: 12, marginTop: 6 }}>
              🔧 You may reposition only <strong>one</strong> node (single-use
              drag).
            </div>
            <div style={{ color: "#cccccc", fontSize: 11, marginTop: 4 }}>
              ↩️ Drag is one-time per node; once limit is reached others lock.
            </div>
            <div style={{ color: "#cccccc", fontSize: 11, marginTop: 4 }}>
              ↩️ You have a single Undo (top-right) — use it before creating
              connections.
            </div>
            <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>
              🛈 Hover a locked node to see why it was locked.
            </div>
          </div>
        )}
      </div>

      {/* Drag Status / Undo Panel (configuration removed - fixed limit) */}
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 20,
          background: "rgba(20,20,25,0.9)",
          border: "1px solid #444",
          borderRadius: 12,
          padding: "14px 16px 12px",
          color: "#eee",
          fontSize: 12,
          minWidth: 220,
          zIndex: 20,
          boxShadow: "0 0 12px rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
          Node Repositioning (Fixed Limit)
        </div>
        <div style={{ marginBottom: 4, fontSize: 12 }}>
          <span style={{ opacity: 0.75 }}>Used:</span>{" "}
          <strong
            style={{
              color:
                draggedOnceIdsRef.current.size >= MAX_DRAGS
                  ? "#ff5555"
                  : "#00ff88",
            }}
          >
            {draggedOnceIdsRef.current.size}
          </strong>{" "}
          / <strong>{MAX_DRAGS}</strong>
        </div>
        <button
          onClick={() => {
            if (undoUsed) return;
            if (dragHistoryRef.current.length === 0) return;
            const last = dragHistoryRef.current.pop();
            setFloatingCircles((prev) =>
              prev.map((c) =>
                c.id === last.nodeId
                  ? { ...c, x: last.from.x, y: last.from.y }
                  : c
              )
            );
            if (draggedOnceIdsRef.current.has(last.nodeId)) {
              draggedOnceIdsRef.current.delete(last.nodeId);
              setDraggedOnceVersion((v) => v + 1);
            }
            setUndoUsed(true);
          }}
          disabled={
            undoUsed ||
            dragHistoryRef.current.length === 0 ||
            playerConnections.length > 0
          }
          style={{
            width: "100%",
            marginTop: 6,
            background:
              undoUsed ||
              dragHistoryRef.current.length === 0 ||
              playerConnections.length > 0
                ? "#222"
                : "#0a4",
            color:
              undoUsed ||
              dragHistoryRef.current.length === 0 ||
              playerConnections.length > 0
                ? "#666"
                : "#fff",
            border: "1px solid #055",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
            cursor:
              undoUsed ||
              dragHistoryRef.current.length === 0 ||
              playerConnections.length > 0
                ? "not-allowed"
                : "pointer",
            fontWeight: 600,
            transition: "background 0.2s",
          }}
          title={
            playerConnections.length > 0
              ? "Cannot undo after creating connections"
              : undoUsed
              ? "Undo already used"
              : dragHistoryRef.current.length === 0
              ? "No drag to undo"
              : "Undo drag (single use)"
          }
        >
          {undoUsed ? "↩️ Undo Used" : "↩️ Undo Last Drag"}
        </button>
        <button
          onClick={() => {
            if (!currentExercise) return;
            loadExercise(exerciseKey);
          }}
          disabled={!currentExercise}
          style={{
            width: "100%",
            marginTop: 8,
            background: "#444",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
            cursor: currentExercise ? "pointer" : "not-allowed",
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 0 6px rgba(0,0,0,0.35)',
            transition: 'background 0.2s, transform 0.15s',
          }}
          title="Restart this level from the beginning (resets nodes, progress, drag + undo)"
        >
          🔄 Restart Level
        </button>
        {draggedOnceIdsRef.current.size >= MAX_DRAGS && (
          <div style={{ color: "#ff7777", fontSize: 11 }}>
            Drag limit reached – further nodes locked.
          </div>
        )}
      </div>

      {/* Connection counter & manual validation removed */}
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

          // Build node obstacle list for prediction, excluding any deleted keys (prevents ghost bounces)
          const nodes = floatingCircles
            .filter((c) => {
              if (!c || c.type !== "node" || !c.isInList) return false;
              const deleted = deletedNodeKeysRef.current.has(
                `${c.value}|${c.address}`
              );
              return !deleted;
            })
            .map((c) => ({
              id: c.id,
              cx: (c.x || 0) + 30,
              cy: (c.y || 0) + 30,
            }));
          // Debug & remediation: purge any ghost nodes (deleted but lingering in floatingCircles)
          try {
            const ghost = floatingCircles.filter(
              (c) =>
                c && deletedNodeKeysRef.current.has(`${c.value}|${c.address}`)
            );
            if (ghost.length > 0) {
              // Throttle log: only emit once per animation second
              const nowTs = Date.now();
              if (
                !window.__lastGhostLogTs ||
                nowTs - window.__lastGhostLogTs > 1000
              ) {
                window.__lastGhostLogTs = nowTs;
                console.warn(
                  "👻 Auto-purging ghost nodes from floatingCircles",
                  ghost.map((g) => `${g.value}(${g.address})`)
                );
              }
              // Actively purge them so they cannot reappear in subsequent frames
              setFloatingCircles((prev) =>
                prev.filter(
                  (c) =>
                    !ghost.some(
                      (g) => g.value === c.value && g.address === c.address
                    )
                )
              );
              floatingCirclesRef.current = floatingCirclesRef.current.filter(
                (c) =>
                  !ghost.some(
                    (g) => g.value === c.value && g.address === c.address
                  )
              );
              // Also remove from generic circles (defensive)
              setCircles((prev) =>
                prev.filter(
                  (c) =>
                    c.isBullet ||
                    !ghost.some(
                      (g) => g.value === c.value && g.address === c.address
                    )
                )
              );
            }
          } catch {
            // Ignore diagnostics errors
          }

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
            // Skip if deleted (defensive: should already be gone from floatingCircles render list)
            if (deletedNodeKeysRef.current.has(`${c.value}|${c.address}`))
              return;
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
                {pairs.map((p) => {
                  // Defensive: skip if either endpoint now marked deleted
                  if (
                    deletedNodeKeysRef.current.has(
                      `${p.from.value}|${p.from.address}`
                    ) ||
                    deletedNodeKeysRef.current.has(
                      `${p.to.value}|${p.to.address}`
                    )
                  ) {
                    return null;
                  }
                  const hasPlayerConn = playerConnections.some(
                    (pc) => pc.from === p.from.id && pc.to === p.to.id
                  );
                  if (hasPlayerConn) return null;
                  return (
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
                  );
                })}
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
            // Skip if endpoints were deleted but playerConnections not yet GC'd
            if (
              deletedNodeKeysRef.current.has(
                `${fromNode.value}|${fromNode.address}`
              ) ||
              deletedNodeKeysRef.current.has(
                `${toNode.value}|${toNode.address}`
              )
            ) {
              return null;
            }

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
      {floatingCircles
        .filter(
          (circle) =>
            !deletedNodeKeysRef.current.has(`${circle.value}|${circle.address}`)
        )
        .map((circle) => {
          const moved = draggedOnceIdsRef.current.has(circle.id);
          const globalDragUsed =
            draggedOnceIdsRef.current.size >= MAX_DRAGS && !moved;
          return (
            <div
              key={circle.id}
              data-node-id={circle.id}
              className={`${styles.floatingCircle} ${styles.valueCircle} ${
                activatedNodes.has(circle.id) ? styles.activated : ""
              }`}
              style={{
                left: `${circle.x}px`,
                top: `${circle.y}px`,
                cursor:
                  moved || globalDragUsed
                    ? "not-allowed"
                    : draggedCircle && draggedCircle.id === circle.id
                    ? "grabbing"
                    : "grab",
                // Keep original appearance regardless of moved/lock state
                opacity: 1,
                filter: "none",
              }}
              onMouseDown={(e) => handleFloatingMouseDown(e, circle)}
              onMouseEnter={(e) => {
                if (moved || globalDragUsed) {
                  const reason = moved
                    ? "This node was already repositioned."
                    : draggedOnceIdsRef.current.size >= MAX_DRAGS
                    ? `Drag limit (${MAX_DRAGS}) reached.`
                    : "Locked.";
                  const rect = e.currentTarget.getBoundingClientRect();
                  setLockedTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                    text: reason + " Fixed single drag limit.",
                  });
                }
              }}
              onMouseLeave={() => {
                setLockedTooltip((prev) =>
                  prev && prev.text.includes("repositioned") ? null : null
                );
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 800 }}>
                {circle.value}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {circle.address}
              </div>
              {moved && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -14,
                    fontSize: 9,
                    color: "#ffaa00",
                    fontWeight: 700,
                  }}
                >
                  moved
                </div>
              )}
              {!moved && globalDragUsed && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -14,
                    fontSize: 9,
                    color: "#888",
                    fontWeight: 600,
                  }}
                >
                  locked
                </div>
              )}
            </div>
          );
        })}

      {/* Locked Tooltip */}
      {lockedTooltip && (
        <div
          style={{
            position: "fixed",
            left: lockedTooltip.x,
            top: lockedTooltip.y,
            transform: "translate(-50%, -100%)",
            background: "linear-gradient(135deg,#222,#111)",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 11,
            color: "#eee",
            border: "1px solid #444",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            pointerEvents: "none",
            zIndex: 50,
            maxWidth: 220,
            lineHeight: 1.25,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, color: "#ffb347", marginBottom: 2 }}>
            Locked
          </div>
          <span style={{ opacity: 0.9 }}>{lockedTooltip.text}</span>
        </div>
      )}

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

      {/* Level Completion Overlay */}
      {showLevelCompletion && (
        <div className={styles.completionOverlay}>
          <div className={styles.completionPopup}>
            <div className={styles.completionContent}>
              <h2 style={{ textAlign: "center" }}>
                {allLevelsComplete
                  ? "🥳 All Deletion Levels Complete!"
                  : `Level ${completedLevelKey?.split("_")[1]} Complete!`}
              </h2>
              {!allLevelsComplete && (
                <p style={{ textAlign: "center", marginTop: 10 }}>
                  Loading next level in <strong>3</strong> seconds...
                </p>
              )}
              {allLevelsComplete && (
                <p style={{ textAlign: "center", marginTop: 10 }}>
                  You mastered progressive, mixed, and advanced deletions.
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "18px",
                  marginTop: 30,
                  flexWrap: "wrap",
                }}
              >
                {!allLevelsComplete && (
                  <button
                    className={styles.completionButton}
                    onClick={() => {
                      // Skip timer & go now
                      if (nextLevelTimerRef.current)
                        clearTimeout(nextLevelTimerRef.current);
                      const mgr = exerciseManagerRef.current;
                      const nextLevel = mgr.getNextLevel(completedLevelKey);
                      setShowLevelCompletion(false);
                      if (nextLevel) loadExercise(nextLevel);
                    }}
                  >
                    Skip Wait → Next Level
                  </button>
                )}
                {allLevelsComplete && (
                  <button
                    className={styles.completionButton}
                    onClick={() => {
                      // Restart first level for replay
                      setShowLevelCompletion(false);
                      setAllLevelsComplete(false);
                      setCompletedLevelKey(null);
                      loadExercise("level_1");
                    }}
                  >
                    Replay From Start
                  </button>
                )}
                <button
                  className={styles.completionButton}
                  style={{ background: "#555" }}
                  onClick={() => {
                    if (nextLevelTimerRef.current)
                      clearTimeout(nextLevelTimerRef.current);
                    setShowLevelCompletion(false);
                    // Navigate back to previous page (main menu / selection)
                    try {
                      navigate(-1);
                    } catch (e) {
                      // Fallback if navigation not available
                      console.warn("Navigation failed, reloading root", e);
                      window.location.href = "/";
                    }
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Tutorial Wrapper Component
function GalistGameDeletion() {
  const [isLoading, setIsLoading] = useState(true);
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

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

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
