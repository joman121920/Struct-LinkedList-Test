import PropTypes from "prop-types";
import styles from "./ModeSelect.module.css";
import { useEffect } from "react";
import { playMenuBgMusic, stopMenuBgMusic, playFirstClickSound } from "../Sounds.jsx";
function ModeSelect({ onSelect }) {
  
  // Start menu background music when component mounts
  useEffect(() => {
    playMenuBgMusic();
    
    // Cleanup: stop menu music when component unmounts
    return () => {
      stopMenuBgMusic();
    };
  }, []);
  
  // Handle mode selection with sound effects
  const handleModeSelect = (mode) => {
    playFirstClickSound(); // Play game start sound
    stopMenuBgMusic(); // Stop menu music
    
    if (onSelect) {
      onSelect(mode);
    }
  };
  
  // const handleBackToGames = () => {
  //   navigate("/galist-game");
  // }
  return (
    <div className={styles.modeOverlay} role="dialog" aria-modal="true">
      <img
        className={styles.modeVideo}
        src="./images/bg_menu.gif"
        alt="Background"
      />
      {/* <button
              className={styles.backButton}
              onClick={handleBackToGames}
              aria-label="Back to games"
            >
              ← Back
      </button> */}

      <div className={styles.modeContent}>
        <h2 className={styles.modeTitle}>Choose Mode</h2>
        <p className={styles.modeSubtitle}>Select your linked list challenge</p>
        <div className={styles.modeOptions}>
          <button
            className={styles.modeCard}
            onClick={() => handleModeSelect("singly")}
            aria-label="Singly Linked List"
          >
            <div className={styles.modeCardTitle}>Singly Linked List</div>
            <div className={styles.modeCardDesc}>
              One-way pointers. Classic fundamentals.
            </div>
          </button>
          <button
            className={styles.modeCard}
            onClick={() => handleModeSelect("doubly")}
            aria-label="Doubly Linked List"
          >
            <div className={styles.modeCardTitle}>Doubly Linked List</div>
            <div className={styles.modeCardDesc}>
              Prev and next pointers. Extra control.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
ModeSelect.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default ModeSelect;
