import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./GalistDeletion.module.css";
import tutorialStyles from "./TutorialScene.module.css";

// Tutorial Scene Component
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // State for tutorial floating circles (4 random values)
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [squareNode, setSquareNode] = useState({ value: "", address: "" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  // const [fadeIn, setFadeIn] = useState(false);
  const tutorialCirclesRef = useRef([]);

  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Handle fade-in animation for scene4
  //   if (scene === 'scene4') {
  //     setFadeIn(false);
  //     const timer = setTimeout(() => {
  //       setFadeIn(true);
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [scene]);

  // Generate 4 random tutorial circles
  useEffect(() => {
    if (scene === "scene2") {
      const randomValues = [];
      while (randomValues.length < 4) {
        const val = Math.floor(Math.random() * 100) + 1;
        if (!randomValues.includes(val)) {
          randomValues.push(val);
        }
      }

      const circles = randomValues.map((value, index) => ({
        id: Date.now() + index,
        content: value.toString(),
        type: "value",
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        // Keep tutorial nodes static
        vx: 0,
        vy: 0,
      }));

      setTutorialCircles(circles);
    } else if (scene === "scene3") {
      // Generate 4 random address circles for scene 3
      const addressLetters = ["a", "b", "c", "d", "e", "f"];
      const randomAddresses = [];
      while (randomAddresses.length < 4) {
        const letter =
          addressLetters[Math.floor(Math.random() * addressLetters.length)];
        const number = Math.floor(Math.random() * 9) + 1;
        const address = `${letter}b${number}`;
        if (!randomAddresses.includes(address)) {
          randomAddresses.push(address);
        }
      }

      const circles = randomAddresses.map((address, index) => ({
        id: Date.now() + index,
        content: address,
        type: "address",
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        // Keep tutorial nodes static
        vx: 0,
        vy: 0,
      }));

      setTutorialCircles(circles);
      // Reset bullets for new scene
      setTutorialBullets([]);
    }
  }, [scene]);

  // Tutorial circles are static; disable animation loop
  useEffect(() => {
    // no-op to keep consistent effect hooks
  }, [scene]);

  // Handle right-click shooting in tutorial
  const handleTutorialRightClick = useCallback(
    (e) => {
      if (scene !== "scene2" && scene !== "scene3") return;

      e.preventDefault();

      // Calculate launch position from cannon tip
      const cannonTipX = window.innerWidth + 40 - 35;
      const cannonTipY = window.innerHeight - 1;

      // Calculate tip position based on cannon angle
      const tipDistance = 55;
      const angleRad = cannonAngle * (Math.PI / 180);
      const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
      const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;

      // Calculate launch velocity based on cannon direction
      const launchSpeed = 8;
      const velocityX = Math.sin(angleRad) * launchSpeed;
      const velocityY = -Math.cos(angleRad) * launchSpeed;

      // Create new bullet
      const newBullet = {
        id: Date.now(),
        x: tipX - 15,
        y: tipY - 15,
        velocityX: velocityX,
        velocityY: velocityY,
        isBullet: true,
        isLaunched: true,
      };

      setTutorialBullets((prev) => [...prev, newBullet]);
    },
    [scene, cannonAngle]
  );

  // Bullet animation and collision detection for tutorial with ricochet
  useEffect(() => {
    if (scene !== "scene2" && scene !== "scene3") return;

    const animateFrame = () => {
      setTutorialBullets((prevBullets) => {
        const updatedBullets = [];

        prevBullets.forEach((bullet) => {
          // Update bullet position
          const newX = bullet.x + bullet.velocityX;
          const newY = bullet.y + bullet.velocityY;

          // Screen boundary collision detection - bullets bounce off edges
          let bounceVelocityX = bullet.velocityX;
          let bounceVelocityY = bullet.velocityY;
          let finalX = newX;
          let finalY = newY;

          // Check horizontal boundaries
          if (newX <= 15 || newX >= window.innerWidth - 15) {
            bounceVelocityX = -bounceVelocityX;
            finalX = newX <= 15 ? 15 : window.innerWidth - 15;
          }

          // Check vertical boundaries
          if (newY <= 15 || newY >= window.innerHeight - 15) {
            bounceVelocityY = -bounceVelocityY;
            finalY = newY <= 15 ? 15 : window.innerHeight - 15;
          }

          const updatedBullet = {
            ...bullet,
            x: finalX,
            y: finalY,
            velocityX: bounceVelocityX,
            velocityY: bounceVelocityY,
          };

          // Check for collisions with tutorial circles
          // ricochet handled by adjusting velocity and nudging out; no need to track flag here

          const currentTutorialCircles = tutorialCirclesRef.current;
          for (let i = 0; i < currentTutorialCircles.length; i++) {
            const circle = currentTutorialCircles[i];

            const bulletRadius = 15;
            const circleRadius = 30;
            const combinedRadius = bulletRadius + circleRadius;

            const dx = updatedBullet.x - circle.x;
            const dy = updatedBullet.y - circle.y;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);

            const collisionThreshold = combinedRadius * 0.9;

            if (centerDistance < collisionThreshold) {
              // Reflect off node and continue
              const nx = (updatedBullet.x - circle.x) / (centerDistance || 1);
              const ny = (updatedBullet.y - circle.y) / (centerDistance || 1);
              const vdotn =
                updatedBullet.velocityX * nx + updatedBullet.velocityY * ny;
              const rvx = updatedBullet.velocityX - 2 * vdotn * nx;
              const rvy = updatedBullet.velocityY - 2 * vdotn * ny;
              updatedBullet.velocityX = rvx;
              updatedBullet.velocityY = rvy;
              const pushOut = combinedRadius - centerDistance + 1;
              updatedBullet.x = updatedBullet.x + nx * pushOut;
              updatedBullet.y = updatedBullet.y + ny * pushOut;
              // ricochet applied

              // Add value or address to square node based on scene
              if (scene === "scene2" && circle.type === "value") {
                setSquareNode((prev) => ({ ...prev, value: circle.content }));
              } else if (scene === "scene3" && circle.type === "address") {
                setSquareNode((prev) => ({ ...prev, address: circle.content }));
              }

              // Remove hit circle
              setTutorialCircles((prevCircles) =>
                prevCircles.filter((c) => c.id !== circle.id)
              );

              // Notify parent component
              onValueShoot?.(circle.content);
              break;
            }
          }

          // Keep bullet alive; it can ricochet multiple times in tutorial
          updatedBullets.push(updatedBullet);
        });

        return updatedBullets;
      });
    };

    const intervalId = setInterval(animateFrame, 8);
    return () => clearInterval(intervalId);
  }, [scene, onValueShoot]);

  // Mouse movement for cannon rotation
  useEffect(() => {
    if (scene !== "scene2" && scene !== "scene3") return;

    const handleMouseMove = (e) => {
      const cannonBaseX = window.innerWidth + 40 - 35;
      const cannonBaseY = window.innerHeight - 1;

      const deltaX = e.clientX - cannonBaseX;
      const deltaY = e.clientY - cannonBaseY;

      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
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
        <video
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial Popup for Scene 1 */}
        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Node Deletion!</h2>
              <p>
                In a singly linked list, deleting means removing a specific node
                (head, tail, or by value) while preserving the connections of
                the remaining nodes.
              </p>
              <p>
                <strong>Let&apos;s practice aiming and shooting first.</strong>
              </p>
              <button
                onClick={onContinue}
                className={tutorialStyles.tutorialButton}
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Square Node (bottom-center) */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === "scene2") {
    return (
      <div className={styles.app}>
        <video
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Aim with your mouse and right-click to shoot a node</h3>
        </div>

        {/* Cannon */}
        <div
          className={styles.rightSquare}
          style={{
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: "12px", color: "#fff" }}>•</span>
          </div>
        </div>

        {/* Aim line: show to first node, then one bounce (or stop at first wall) */}
        {(() => {
          const cannonBaseX = window.innerWidth + 40 - 35;
          const cannonBaseY = window.innerHeight - 1;
          const angleRad = cannonAngle * (Math.PI / 180);
          const tipDistance = 55;
          const tipX = cannonBaseX + Math.sin(angleRad) * tipDistance;
          const tipY = cannonBaseY - Math.cos(angleRad) * tipDistance;

          let dx = Math.sin(angleRad);
          let dy = -Math.cos(angleRad);
          const bulletRadius = 15;
          const nodeRadius = 30;
          const R = bulletRadius + nodeRadius - 2;
          const minT = 1.5;
          const maxBounces = 2; // limit to first node + one bounce
          const minX = 15,
            maxX = window.innerWidth - 15,
            minY = 15,
            maxY = window.innerHeight - 15;
          let x = tipX,
            y = tipY;
          let lastCircleId = null;
          const segments = [];

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

          const nodes = tutorialCircles.map((c) => ({
            id: c.id,
            cx: c.x,
            cy: c.y,
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
              if (!Number.isFinite(t) || t <= 0) continue;
              if (!best || t < best.t) best = { t, id, cx, cy };
            }
            return best;
          };

          for (let i = 0; i < maxBounces; i++) {
            const len = Math.hypot(dx, dy) || 1;
            let ux = dx / len;
            let uy = dy / len;
            const wall = firstWallHit(x, y, ux, uy);
            const circ = firstCircleHit(x, y, ux, uy);

            if (circ && (!wall || circ.t < wall.t)) {
              const nx = x + ux * circ.t;
              const ny = y + uy * circ.t;
              segments.push({ x1: x, y1: y, x2: nx, y2: ny });
              const nxv = (nx - circ.cx) / (R || 1);
              const nyv = (ny - circ.cy) / (R || 1);
              const vdotn = ux * nxv + uy * nyv;
              ux = ux - 2 * vdotn * nxv;
              uy = uy - 2 * vdotn * nyv;
              const push = 2.0;
              x = nx + ux * push;
              y = ny + uy * push;
              dx = ux;
              dy = uy;
              lastCircleId = circ.id;
              // After reflecting, draw one more segment to the next wall and stop
              const nextWall = firstWallHit(x, y, dx, dy);
              if (nextWall) {
                const nlen = Math.hypot(dx, dy) || 1;
                const nwx = x + (dx / nlen) * nextWall.t;
                const nwy = y + (dy / nlen) * nextWall.t;
                segments.push({ x1: x, y1: y, x2: nwx, y2: nwy });
              }
              break;
            }

            if (wall) {
              const nx = x + (dx / len) * wall.t;
              const ny = y + (dy / len) * wall.t;
              segments.push({ x1: x, y1: y, x2: nx, y2: ny });
              // Reflect off this wall and draw one more segment to next wall
              let rdx = dx;
              let rdy = dy;
              if (wall.wall === "left" || wall.wall === "right") rdx = -rdx;
              if (wall.wall === "top" || wall.wall === "bottom") rdy = -rdy;
              const rlen = Math.hypot(rdx, rdy) || 1;
              const px = nx + (rdx / rlen) * 2.0;
              const py = ny + (rdy / rlen) * 2.0;
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
          return (
            <svg className={styles.aimLines} aria-hidden>
              {segments.map((s, idx) => (
                <line
                  key={`seg-${idx}`}
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

        {/* Tutorial Floating Circles */}
        {tutorialCircles.map((circle) => (
          <div
            key={circle.id}
            className={`${styles.floatingCircle} ${styles.valueCircle}`}
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
            }}
          >
            {circle.content}
          </div>
        ))}

        {/* Tutorial Bullets */}
        {tutorialBullets.map((bullet) => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: "30px",
              height: "30px",
              backgroundColor: "#ff6b6b",
              cursor: "default",
              opacity: 0.9,
              boxShadow: "0 0 15px rgba(255, 255, 0, 0.6)",
            }}
          />
        ))}

        {/* Interactive Square Node (bottom-center) */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div
                className={`${styles.squareNodeField} ${
                  !squareNode.value ? styles.empty : ""
                }`}
              >
                {squareNode.value || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>

        {/* Continue button appears after shooting a value */}
        {squareNode.value && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Good job!</h2>
                <div
                  className={styles.expectedOutputSquare}
                  style={{ marginBottom: "20px" }}
                >
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.value}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Address</div>
                    <div
                      className={`${styles.squareNodeField} ${styles.empty}`}
                    >
                      -
                    </div>
                  </div>
                </div>
                <p>
                  Nice shot! In the game, you will shoot the target node to
                  delete it from the list.
                </p>
                <button
                  onClick={onContinue}
                  className={tutorialStyles.tutorialButton}
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
        <video
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Tutorial instruction bar */}
        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Try hitting another node to get the feel</h3>
        </div>

        {/* Cannon */}
        <div
          className={styles.rightSquare}
          style={{
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: "12px", color: "#fff" }}>•</span>
          </div>
        </div>

        {/* Aim line: show to first node, then one bounce (or stop at first wall) */}
        {(() => {
          const cannonBaseX = window.innerWidth + 40 - 35;
          const cannonBaseY = window.innerHeight - 1;
          const angleRad = cannonAngle * (Math.PI / 180);
          const tipDistance = 55;
          const tipX = cannonBaseX + Math.sin(angleRad) * tipDistance;
          const tipY = cannonBaseY - Math.cos(angleRad) * tipDistance;

          let dx = Math.sin(angleRad);
          let dy = -Math.cos(angleRad);
          const bulletRadius = 15;
          const nodeRadius = 30;
          const R = bulletRadius + nodeRadius - 2;
          const minT = 1.5;
          const maxBounces = 2; // limit to first node + one bounce
          const minX = 15,
            maxX = window.innerWidth - 15,
            minY = 15,
            maxY = window.innerHeight - 15;
          let x = tipX,
            y = tipY;
          let lastCircleId = null;
          const segments = [];

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

          const nodes = tutorialCircles.map((c) => ({
            id: c.id,
            cx: c.x,
            cy: c.y,
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
              if (!Number.isFinite(t) || t <= 0) continue;
              if (!best || t < best.t) best = { t, id, cx, cy };
            }
            return best;
          };

          for (let i = 0; i < maxBounces; i++) {
            const len = Math.hypot(dx, dy) || 1;
            let ux = dx / len;
            let uy = dy / len;
            const wall = firstWallHit(x, y, ux, uy);
            const circ = firstCircleHit(x, y, ux, uy);

            if (circ && (!wall || circ.t < wall.t)) {
              const nx = x + ux * circ.t;
              const ny = y + uy * circ.t;
              segments.push({ x1: x, y1: y, x2: nx, y2: ny });
              const nxv = (nx - circ.cx) / (R || 1);
              const nyv = (ny - circ.cy) / (R || 1);
              const vdotn = ux * nxv + uy * nyv;
              ux = ux - 2 * vdotn * nxv;
              uy = uy - 2 * vdotn * nyv;
              const push = 2.0;
              x = nx + ux * push;
              y = ny + uy * push;
              dx = ux;
              dy = uy;
              lastCircleId = circ.id;
              // After reflecting, draw one more segment to the next wall and stop
              const nextWall = firstWallHit(x, y, dx, dy);
              if (nextWall) {
                const nlen = Math.hypot(dx, dy) || 1;
                const nwx = x + (dx / nlen) * nextWall.t;
                const nwy = y + (dy / nlen) * nextWall.t;
                segments.push({ x1: x, y1: y, x2: nwx, y2: nwy });
              }
              break;
            }

            if (wall) {
              const nx = x + (dx / len) * wall.t;
              const ny = y + (dy / len) * wall.t;
              segments.push({ x1: x, y1: y, x2: nx, y2: ny });
              // Reflect off this wall and draw one more segment to next wall
              let rdx = dx;
              let rdy = dy;
              if (wall.wall === "left" || wall.wall === "right") rdx = -rdx;
              if (wall.wall === "top" || wall.wall === "bottom") rdy = -rdy;
              const rlen = Math.hypot(rdx, rdy) || 1;
              const px = nx + (rdx / rlen) * 2.0;
              const py = ny + (rdy / rlen) * 2.0;
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
          return (
            <svg className={styles.aimLines} aria-hidden>
              {segments.map((s, idx) => (
                <line
                  key={`seg-${idx}`}
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

        {/* Tutorial Floating Circles (Addresses) */}
        {tutorialCircles.map((circle) => (
          <div
            key={circle.id}
            className={`${styles.floatingCircle} ${styles.addressCircle}`}
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
            }}
          >
            {circle.content}
          </div>
        ))}

        {/* Tutorial Bullets */}
        {tutorialBullets.map((bullet) => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: "30px",
              height: "30px",
              backgroundColor: "#ff6b6b",
              cursor: "default",
              opacity: 0.9,
              boxShadow: "0 0 15px rgba(255, 255, 0, 0.6)",
            }}
          />
        ))}

        {/* Interactive Square Node (bottom-center) */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={styles.squareNodeField}>
                {squareNode.value || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div
                className={`${styles.squareNodeField} ${
                  !squareNode.address ? styles.empty : ""
                }`}
              >
                {squareNode.address || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Continue button appears after shooting an address */}
        {squareNode.address && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Perfect!</h2>
                <div
                  className={styles.expectedOutputSquare}
                  style={{ marginBottom: "30px" }}
                >
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.value}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Address</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.address}
                    </div>
                  </div>
                </div>
                <p>
                  Great! You&apos;re ready to target specific nodes. In the next
                  screen, you&apos;ll delete the requested node (head, tail, or
                  a node by value).
                </p>
                <p>
                  <strong>Let&apos;s head to the game.</strong>
                </p>
                <button
                  onClick={onContinue}
                  className={tutorialStyles.tutorialButton}
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

  if (scene === "scene4") {
    return (
      <div
        className={styles.app}
        // style={{
        //   opacity: fadeIn ? 1 : 0,
        //   transition: 'opacity 1.2s ease-in-out',
        //   transform: fadeIn ? 'scale(1)' : 'scale(0.95)',
        // }}
      >
        <video
          className={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/node_creation_bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Game Instructions Popup */}
        <div className={tutorialStyles.gameInstructionsOverlay}>
          <div className={tutorialStyles.gameInstructionsPopup}>
            <div className={tutorialStyles.gameInstructionsContent}>
              <div className={tutorialStyles.gameInstructionsHeader}>
                <h2>Game Instructions</h2>
              </div>

              <div className={tutorialStyles.gameInstructionsBody}>
                <ul>
                  <li>
                    <strong>Objective:</strong> Delete the target node from the
                    list (Head, Tail, or a specific Value)
                  </li>
                  <li>
                    <strong>Controls:</strong> Use your mouse to aim the cannon
                    and right-click to shoot bullets
                  </li>
                  <li>
                    <strong>Levels:</strong> Complete 3 deletion levels
                  </li>
                  <li>
                    <strong>Scoring:</strong> Earn points for each correct
                    deletion
                  </li>
                  <li>
                    <strong>Strategy:</strong> Plan your shots carefully —
                    bullets bounce off walls! Don&apos;t hit the wrong node.
                  </li>
                </ul>
              </div>

              <div className={tutorialStyles.gameInstructionsFooter}>
                <button
                  onClick={onContinue}
                  className={tutorialStyles.tutorialButton}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Square Node (bottom-center) - Show completed node from tutorial */}
        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={styles.squareNodeField}>
                {squareNode.value || "42"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Address</div>
              <div className={styles.squareNodeField}>
                {squareNode.address || "ab3"}
              </div>
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
