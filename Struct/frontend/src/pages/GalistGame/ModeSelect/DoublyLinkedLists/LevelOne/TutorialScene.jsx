import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./NodeCreation.module.css";
import tutorialStyles from "./TutorialScene.module.css";

// Tutorial Scene Component
function TutorialScene({ scene, onContinue, onValueShoot }) {
  // State for tutorial floating circles
  const [tutorialCircles, setTutorialCircles] = useState([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [squareNode, setSquareNode] = useState({ prevAddress: "", value: "", address: "" });
  const [tutorialBullets, setTutorialBullets] = useState([]);
  const tutorialCirclesRef = useRef([]);
  
  // Update ref whenever tutorial circles change
  useEffect(() => {
    tutorialCirclesRef.current = tutorialCircles;
  }, [tutorialCircles]);

  // Generate tutorial circles based on scene
  useEffect(() => {
    if (scene === 'scene2') {
      // Scene 2: Generate prev address circles (green)
      const addressLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
      const randomAddresses = [];
      while (randomAddresses.length < 4) {
        const letter = addressLetters[Math.floor(Math.random() * addressLetters.length)];
        const number = Math.floor(Math.random() * 9) + 1;
        const address = `${letter}b${number}`;
        if (!randomAddresses.includes(address)) {
          randomAddresses.push(address);
        }
      }

      const circles = randomAddresses.map((address, index) => ({
        id: Date.now() + index,
        content: address,
        type: 'prevAddress',
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      }));

      setTutorialCircles(circles);
      setTutorialBullets([]);
    } else if (scene === 'scene3') {
      // Scene 3: Generate value circles (red)
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
        type: 'value',
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      }));

      setTutorialCircles(circles);
      setTutorialBullets([]);
    } else if (scene === 'scene4') {
      // Scene 4: Generate next address circles (purple)
      const addressLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
      const randomAddresses = [];
      while (randomAddresses.length < 4) {
        const letter = addressLetters[Math.floor(Math.random() * addressLetters.length)];
        const number = Math.floor(Math.random() * 9) + 1;
        const address = `${letter}b${number}`;
        if (!randomAddresses.includes(address)) {
          randomAddresses.push(address);
        }
      }

      const circles = randomAddresses.map((address, index) => ({
        id: Date.now() + index,
        content: address,
        type: 'address',
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 300) + 150,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      }));

      setTutorialCircles(circles);
      setTutorialBullets([]);
    } else {
      setTutorialCircles([]);
      setTutorialBullets([]);
    }
  }, [scene]);

  // Animate tutorial circles
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3' && scene !== 'scene4') return;
    
    const animateInterval = setInterval(() => {
      setTutorialCircles(prev => prev.map(circle => {
        let newX = circle.x + circle.vx;
        let newY = circle.y + circle.vy;
        let newVx = circle.vx;
        let newVy = circle.vy;

        // Bounce off walls
        if (newX <= 60 || newX >= window.innerWidth - 120) {
          newVx = -newVx;
          newX = Math.max(60, Math.min(window.innerWidth - 120, newX));
        }
        if (newY <= 100 || newY >= window.innerHeight - 200) {
          newVy = -newVy;
          newY = Math.max(100, Math.min(window.innerHeight - 200, newY));
        }

        return { ...circle, x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 16);

    return () => clearInterval(animateInterval);
  }, [scene]);

  // Handle right-click shooting in tutorial
  const handleTutorialRightClick = useCallback((e) => {
    if (scene !== 'scene2' && scene !== 'scene3' && scene !== 'scene4') return;
    
    e.preventDefault();
    
    const cannonTipX = window.innerWidth + 40 - 35;
    const cannonTipY = window.innerHeight - 1;
    
    const tipDistance = 55;
    const angleRad = (cannonAngle) * (Math.PI / 180);
    const tipX = cannonTipX + Math.sin(angleRad) * tipDistance;
    const tipY = cannonTipY - Math.cos(angleRad) * tipDistance;
    
    const launchSpeed = 8;
    const velocityX = Math.sin(angleRad) * launchSpeed;
    const velocityY = -Math.cos(angleRad) * launchSpeed;
    
    const newBullet = {
      id: Date.now(),
      x: tipX - 15,
      y: tipY - 15,
      velocityX: velocityX,
      velocityY: velocityY,
      isBullet: true,
      isLaunched: true,
    };
    
    setTutorialBullets(prev => [...prev, newBullet]);
  }, [scene, cannonAngle]);

  // Bullet animation and collision detection for tutorial
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3' && scene !== 'scene4') return;
    
    const animateFrame = () => {
      setTutorialBullets(prevBullets => {
        const updatedBullets = [];
        
        prevBullets.forEach(bullet => {
          const newX = bullet.x + bullet.velocityX;
          const newY = bullet.y + bullet.velocityY;
          
          let bounceVelocityX = bullet.velocityX;
          let bounceVelocityY = bullet.velocityY;
          let finalX = newX;
          let finalY = newY;
          
          if (newX <= 15 || newX >= window.innerWidth - 15) {
            bounceVelocityX = -bounceVelocityX;
            finalX = newX <= 15 ? 15 : window.innerWidth - 15;
          }
          
          if (newY <= 15 || newY >= window.innerHeight - 15) {
            bounceVelocityY = -bounceVelocityY;
            finalY = newY <= 15 ? 15 : window.innerHeight - 15;
          }
          
          const updatedBullet = {
            ...bullet,
            x: finalX,
            y: finalY,
            velocityX: bounceVelocityX,
            velocityY: bounceVelocityY
          };

          let bulletHitSomething = false;
          
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
              bulletHitSomething = true;

              // Add to appropriate field based on scene and type
              if (scene === 'scene2' && circle.type === 'prevAddress') {
                setSquareNode(prev => ({ ...prev, prevAddress: circle.content }));
              } else if (scene === 'scene3' && circle.type === 'value') {
                setSquareNode(prev => ({ ...prev, value: circle.content }));
              } else if (scene === 'scene4' && circle.type === 'address') {
                setSquareNode(prev => ({ ...prev, address: circle.content }));
              }
              
              setTutorialCircles(prevCircles =>
                prevCircles.filter(c => c.id !== circle.id)
              );

              onValueShoot?.(circle.content);
              break;
            }
          }

          if (!bulletHitSomething) {
            updatedBullets.push(updatedBullet);
          }
        });
        
        return updatedBullets;
      });
    };

    const intervalId = setInterval(animateFrame, 8);
    return () => clearInterval(intervalId);
  }, [scene, onValueShoot]);

  // Mouse movement for cannon rotation
  useEffect(() => {
    if (scene !== 'scene2' && scene !== 'scene3' && scene !== 'scene4') return;
    
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

  if (scene === 'scene1') {
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
          <source src="./video/earth.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className={tutorialStyles.tutorialOverlay}>
          <div className={tutorialStyles.tutorialPopup}>
            <div className={tutorialStyles.tutorialContent}>
              <h2>Welcome to Doubly Linked List Node Creation!</h2>
              <p>In a doubly linked list, each node has THREE parts:</p>
              <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
                <li><strong>Previous Address:</strong> Points to the previous node</li>
                <li><strong>Value:</strong> The data stored in the node</li>
                <li><strong>Next Address:</strong> Points to the next node</li>
              </ul>
              <p><strong>Let&apos;s build one!</strong></p>
              <button 
                onClick={onContinue}
                className={tutorialStyles.tutorialButton}
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Prev</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Next</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === 'scene2') {
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
          <source src="./video/earth.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Shoot any previous address to add to your node</h3>
        </div>

        <div 
          className={styles.rightSquare} 
          style={{ 
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center"
          }} 
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: '12px', color: '#fff' }}>
              •
            </span>
          </div>
        </div>

        {tutorialCircles.map(circle => (
          <div
            key={circle.id}
            className={`${styles.floatingCircle} ${styles.prevAddressCircle}`}
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
            }}
          >
            {circle.content}
          </div>
        ))}

        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: '30px',
              height: '30px',
              backgroundColor: '#ff6b6b',
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          />
        ))}

        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Prev</div>
              <div className={`${styles.squareNodeField} ${!squareNode.prevAddress ? styles.empty : ''}`}>
                {squareNode.prevAddress || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Next</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>

        {squareNode.prevAddress && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Great start!</h2>
                <div className={styles.expectedOutputSquare} style={{ marginBottom: '20px' }}>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Prev</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.prevAddress}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={`${styles.squareNodeField} ${styles.empty}`}>
                      -
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Next</div>
                    <div className={`${styles.squareNodeField} ${styles.empty}`}>
                      -
                    </div>
                  </div>
                </div>
                <p>You&apos;ve added a previous address. Now let&apos;s add a value to your node.</p>
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

  if (scene === 'scene3') {
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
          <source src="./video/earth.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Shoot any value to add to your node</h3>
        </div>

        <div 
          className={styles.rightSquare} 
          style={{ 
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center"
          }} 
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: '12px', color: '#fff' }}>
              •
            </span>
          </div>
        </div>

        {tutorialCircles.map(circle => (
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

        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: '30px',
              height: '30px',
              backgroundColor: '#ff6b6b',
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          />
        ))}

        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Prev</div>
              <div className={styles.squareNodeField}>
                {squareNode.prevAddress || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={`${styles.squareNodeField} ${!squareNode.value ? styles.empty : ''}`}>
                {squareNode.value || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Next</div>
              <div className={`${styles.squareNodeField} ${styles.empty}`}>
                -
              </div>
            </div>
          </div>
        </div>

        {squareNode.value && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Excellent!</h2>
                <div className={styles.expectedOutputSquare} style={{ marginBottom: '20px' }}>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Prev</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.prevAddress}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.value}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Next</div>
                    <div className={`${styles.squareNodeField} ${styles.empty}`}>
                      -
                    </div>
                  </div>
                </div>
                <p>You&apos;ve added a value. Now let&apos;s complete the node with a next address.</p>
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

  if (scene === 'scene4') {
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
          <source src="./video/earth.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className={tutorialStyles.tutorialInstructionBar}>
          <h3>Shoot any next address to complete your node</h3>
        </div>

        <div 
          className={styles.rightSquare} 
          style={{ 
            outlineOffset: "5px",
            transform: `rotate(${cannonAngle}deg)`,
            transformOrigin: "bottom center"
          }} 
        >
          <div className={styles.cannonCircle}>
            <span style={{ fontSize: '12px', color: '#fff' }}>
              •
            </span>
          </div>
        </div>

        {tutorialCircles.map(circle => (
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

        {tutorialBullets.map(bullet => (
          <div
            key={bullet.id}
            className={styles.animatedCircle}
            style={{
              left: `${bullet.x}px`,
              top: `${bullet.y}px`,
              width: '30px',
              height: '30px',
              backgroundColor: '#ff6b6b',
              cursor: 'default',
              opacity: 0.9,
              boxShadow: '0 0 15px rgba(255, 255, 0, 0.6)',
            }}
          />
        ))}

        <div className={styles.interactiveSquareWrapper}>
          <div className={styles.squareNode}>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Prev</div>
              <div className={styles.squareNodeField}>
                {squareNode.prevAddress || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Value</div>
              <div className={styles.squareNodeField}>
                {squareNode.value || "-"}
              </div>
            </div>
            <div className={styles.squareSection}>
              <div className={styles.sectionLabel}>Next</div>
              <div className={`${styles.squareNodeField} ${!squareNode.address ? styles.empty : ''}`}>
                {squareNode.address || "-"}
              </div>
            </div>
          </div>
        </div>

        {squareNode.address && (
          <div className={tutorialStyles.tutorialOverlay}>
            <div className={tutorialStyles.tutorialPopup}>
              <div className={tutorialStyles.tutorialContent}>
                <h2>Perfect! Node Complete!</h2>
                <div className={styles.expectedOutputSquare} style={{ marginBottom: '30px' }}>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Prev</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.prevAddress}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Value</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.value}
                    </div>
                  </div>
                  <div className={styles.squareSection}>
                    <div className={styles.sectionLabel}>Next</div>
                    <div className={styles.squareNodeField}>
                      {squareNode.address}
                    </div>
                  </div>
                </div>
                <p>You&apos;ve created your first doubly linked list node with previous address, value, and next address!</p>
                <p><strong>Remember: A doubly linked node always needs all three components.</strong></p>
                <button 
                  onClick={onContinue}
                  className={tutorialStyles.tutorialButton}
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        )}
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