import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './LoadingScreen.css';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageFading, setIsImageFading] = useState(false);
  
  // Array of loading images
  const loadingImages = [
    '/images/loading_images/loading.jpg',
    '/images/loading_images/loading2.jpg',
    '/images/loading_images/loading3.jpg',
    '/images/loading_images/loading4.jpg',
    '/images/loading_images/loading5.jpg'
  ];

  // Initialize with random starting image
  useEffect(() => {
    const randomStartIndex = Math.floor(Math.random() * loadingImages.length);
    setCurrentImageIndex(randomStartIndex);
  }, [loadingImages.length]);

  // Progress bar effect
  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50; // Update every 50ms for smooth animation
    const increment = (100 * interval) / duration;

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onLoadingComplete();
          }, 200); // Small delay after completion
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  // Image rotation effect
  useEffect(() => {
    const imageRotationTimer = setInterval(() => {
      setIsImageFading(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => {
          // Get next random index that's different from current
          let newIndex;
          do {
            newIndex = Math.floor(Math.random() * loadingImages.length);
          } while (newIndex === prevIndex && loadingImages.length > 1);
          return newIndex;
        });
        
        // End fade effect after image change
        setTimeout(() => {
          setIsImageFading(false);
        }, 50);
      }, 400); // Half of the total fade transition duration
      
    }, 3000); // Switch every 3 seconds

    return () => clearInterval(imageRotationTimer);
  }, [currentImageIndex, loadingImages.length]);

  return (
    <div className="loading-screen">
      <div 
        className={`loading-background ${isImageFading ? 'fading' : ''}`}
        style={{ 
          backgroundImage: `url('${loadingImages[currentImageIndex]}')` 
        }}
      ></div>
      <div className={`loading-fade-overlay ${isImageFading ? 'active' : ''}`}></div>
      <div className="loading-content">
        <div className="loading-header">
          <h1 className="loading-title">GALIST</h1>
        </div>
        
        <div className="loading-progress-container">
          <div className="loading-progress-bar">
            <div 
              className="loading-progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="loading-percentage">{Math.round(progress)}%</div>
        </div>
        
        <div className="loading-message">
          <p>Initializing cosmic data structures...</p>
        </div>
      </div>
      
      {/* Animated particles for visual appeal */}
      <div className="loading-particles">
        {[...Array(20)].map((_, index) => (
          <div 
            key={index}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

LoadingScreen.propTypes = {
  onLoadingComplete: PropTypes.func.isRequired,
};

export default LoadingScreen;
