import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ExplodeParticles = React.memo(({ explosions }) => {
  const [activeExplosions, setActiveExplosions] = useState([]);

  // Handle new explosions
  useEffect(() => {
    if (explosions.length > 0) {
      const newExplosions = explosions.map(explosion => {
        // Generate particles for this explosion
        const particles = Array.from({ length: 20 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 20; // Evenly distribute particles in circle
          const velocity = 3 + Math.random() * 4; // Random velocity
          const life = 1.0;
          const size = 3 + Math.random() * 5;
          
          return {
            id: `${explosion.id}-particle-${i}`,
            x: explosion.x,
            y: explosion.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life,
            maxLife: life,
            size,
            color: explosion.color || '#ff6b6b', // Default red explosion
            gravity: 0.1,
            bounce: 0.7,
          };
        });

        return {
          id: explosion.id,
          particles,
          startTime: Date.now(),
          duration: 2000, // 2 seconds
        };
      });

      setActiveExplosions(prev => [...prev, ...newExplosions]);
    }
  }, [explosions]);

  // Update particle physics
  useEffect(() => {
    if (activeExplosions.length === 0) return;

    let animationId;
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const updateParticles = (currentTime) => {
      if (currentTime - lastTime < frameInterval) {
        animationId = requestAnimationFrame(updateParticles);
        return;
      }
      lastTime = currentTime;

      setActiveExplosions(prev => {
        const now = Date.now();
        return prev.map(explosion => {
          const elapsedTime = now - explosion.startTime;
          
          // Remove explosion if duration exceeded
          if (elapsedTime > explosion.duration) {
            return null;
          }

          // Update particles
          const updatedParticles = explosion.particles.map(particle => {
            // Apply physics
            let newVx = particle.vx * 0.98; // Air resistance
            let newVy = particle.vy + particle.gravity; // Gravity
            let newX = particle.x + newVx;
            let newY = particle.y + newVy;

            // Bounce off screen edges
            if (newX < 0 || newX > window.innerWidth) {
              newVx = -newVx * particle.bounce;
              newX = Math.max(0, Math.min(window.innerWidth, newX));
            }
            if (newY > window.innerHeight) {
              newVy = -Math.abs(newVy) * particle.bounce;
              newY = window.innerHeight;
            }

            // Fade out over time
            const lifeProgress = elapsedTime / explosion.duration;
            const life = Math.max(0, particle.maxLife * (1 - lifeProgress));

            return {
              ...particle,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
              life,
            };
          }).filter(particle => particle.life > 0.1);

          return {
            ...explosion,
            particles: updatedParticles,
          };
        }).filter(explosion => explosion !== null && explosion.particles.length > 0);
      });

      animationId = requestAnimationFrame(updateParticles);
    };

    animationId = requestAnimationFrame(updateParticles);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [activeExplosions.length]);

  return (
    <>
      {activeExplosions.map(explosion => (
        explosion.particles.map(particle => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x - particle.size / 2}px`,
              top: `${particle.y - particle.size / 2}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
              opacity: particle.life,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              pointerEvents: 'none',
              zIndex: 15,
              transition: 'none',
            }}
          />
        ))
      ))}
    </>
  );
});

ExplodeParticles.displayName = 'ExplodeParticles';

ExplodeParticles.propTypes = {
  explosions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
};

export default ExplodeParticles;
