import PropTypes from 'prop-types';
import styles from './SettingsModal.module.css';
import { playHoverSound } from './Sounds.jsx';

const SettingsModal = ({ 
  showSettings, 
  musicEnabled, 
  soundEffectsEnabled, 
  onToggleMusic, 
  onToggleSoundEffects,
  onRestart,
  onContinue 
}) => {
  if (!showSettings) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>SETTINGS</h1>
        
        <div className={styles.settingsContainer}>
          {/* Music Toggle */}
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Music</span>
            <div 
              className={`${styles.toggle} ${musicEnabled ? styles.toggleOn : styles.toggleOff}`}
              onClick={onToggleMusic}
              onMouseEnter={() => playHoverSound()}
            >
              <div className={styles.toggleSlider}></div>
            </div>
          </div>
          
          {/* Sound Effects Toggle */}
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Sound Effects</span>
            <div 
              className={`${styles.toggle} ${soundEffectsEnabled ? styles.toggleOn : styles.toggleOff}`}
              onClick={onToggleSoundEffects}
              onMouseEnter={() => playHoverSound()}
            >
              <div className={styles.toggleSlider}></div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.button} ${styles.restartButton}`}
            onClick={onRestart}
            onMouseEnter={() => playHoverSound()}
          >
            RESTART
          </button>
          <button 
            className={`${styles.button} ${styles.continueButton}`}
            onClick={onContinue}
            onMouseEnter={() => playHoverSound()}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};

SettingsModal.propTypes = {
  showSettings: PropTypes.bool.isRequired,
  musicEnabled: PropTypes.bool.isRequired,
  soundEffectsEnabled: PropTypes.bool.isRequired,
  onToggleMusic: PropTypes.func.isRequired,
  onToggleSoundEffects: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};

export default SettingsModal;