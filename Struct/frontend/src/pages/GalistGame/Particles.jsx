import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const PortalParticles = React.memo(({ portalInfo }) => {
  const [portalParticles, setPortalParticles] = useState([]);

  // Portal particle system for vacuum effect
  useEffect(() => {
    if (portalInfo.isVisible) {
      const generateParticle = () => {
        const portalCenterX = 10 + portalInfo.canvasWidth / 2;
        const portalCenterY = window.innerHeight / 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200; // Start particles further out
        
        return {
          id: Date.now() + Math.random(),
          x: portalCenterX + Math.cos(angle) * distance,
          y: portalCenterY + Math.sin(angle) * distance,
          targetX: portalCenterX,
          targetY: portalCenterY,
          life: 1.0,
          speed: 2 + Math.random() * 3,
          size: 2 + Math.random() * 4,
          opacity: 0.6 + Math.random() * 0.4,
        };
      };

      // Generate initial particles (reduced from 30 to 15)
      const initialParticles = Array.from({ length: 40 }, generateParticle);
      setPortalParticles(initialParticles);

      // Continuously generate new particles (reduced frequency)
      const particleInterval = setInterval(() => {
        setPortalParticles((prev) => {
          // Remove old particles and add new ones
          const newParticles = prev.filter(p => p.life > 0);
          
          // Add 1-2 new particles (reduced from 2-3)
          for (let i = 0; i < 3 + Math.random() * 4; i++) {
            newParticles.push(generateParticle());
          }
          
          // Keep max 25 particles for performance (reduced from 50)
          return newParticles.slice(-25);
        });
      }, 150); // Increased interval from 100ms to 150ms

      return () => {
        clearInterval(particleInterval);
        setPortalParticles([]);
      };
    } else {
      setPortalParticles([]);
    }
  }, [portalInfo.isVisible, portalInfo.canvasWidth]);

  // Update particle physics in animation loop (optimized)
  useEffect(() => {
    let animationId;
    let lastUpdateTime = 0;
    const targetFPS = 30; // Reduced from 60fps
    const frameInterval = 1000 / targetFPS;
    
    const updateParticles = (currentTime) => {
      if (currentTime - lastUpdateTime >= frameInterval) {
        if (portalInfo.isVisible) {
          setPortalParticles((prevParticles) => {
            return prevParticles.map((particle) => {
              const dx = particle.targetX - particle.x;
              const dy = particle.targetY - particle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 8) { // Increased threshold from 5 to 8
                // Particle reached portal, fade it out faster
                return { ...particle, life: particle.life - 0.08 };
              }
              
              // Move particle toward portal
              const moveX = (dx / distance) * particle.speed;
              const moveY = (dy / distance) * particle.speed;
              
              return {
                ...particle,
                x: particle.x + moveX,
                y: particle.y + moveY,
                life: particle.life - 0.005, // Slightly faster fade
              };
            }).filter(particle => particle.life > 0);
          });
        }
        lastUpdateTime = currentTime;
      }
      animationId = requestAnimationFrame(updateParticles);
    };

    if (portalInfo.isVisible) {
      animationId = requestAnimationFrame(updateParticles);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [portalInfo.isVisible]);

  // Render particles
  return (
    <>
      {/* Portal particle animation styles */}
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
      
      {/* Portal particles for vacuum effect */}
      {portalInfo.isVisible && portalParticles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: '#b90accff',
            borderRadius: '50%',
            opacity: particle.opacity * particle.life,
            boxShadow: '0 0 6px #b90accff',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
});

PortalParticles.displayName = 'PortalParticles';

PortalParticles.propTypes = {
  portalInfo: PropTypes.shape({
    isVisible: PropTypes.bool.isRequired,
    canvasWidth: PropTypes.number.isRequired,
  }).isRequired,
};

export default PortalParticles;
