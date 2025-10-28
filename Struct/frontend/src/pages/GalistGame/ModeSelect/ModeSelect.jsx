import PropTypes from "prop-types";
import styles from "./ModeSelect.module.css";
import { playFirstClickSound, playHoverSound} from "../Sounds.jsx";
function ModeSelect({ onSelect }) {
  
  // Don't restart menu music - it should already be playing from GameMenu
  // Don't stop music on unmount - only stop when mode is selected
  
  // Handle mode selection with sound effects
  const handleModeSelect = (mode) => {
    playFirstClickSound(); // Play selection sound
    // Don't stop menu music here - let it continue until actual level/competition is entered
    
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
        <p className={styles.modeSubtitle}>Select Mode</p>
        <div className={styles.modeOptions}>
          <button
            className={styles.modeCard}
            onMouseEnter={()=>{
                playHoverSound();
            }}
            onClick={() => handleModeSelect("singly")}
            aria-label="Singly Linked List"
          >
            <div className={styles.linkedListVisualization}>
              <div className={styles.nodeChain}>
                <div className={styles.node}>1</div>
                <div className={styles.arrow}>→</div>
                <div className={styles.node}>2</div>
                <div className={styles.arrow}>→</div>
                <div className={styles.node}>3</div>
                <div className={styles.arrow}>→</div>
                <div className={styles.node}>4</div>
              </div>
            </div>
            <div className={styles.modeCardTitle}>Singly Linked Lists</div>
          </button>
          <button
            className={styles.modeCard}
            onMouseEnter={()=>{
                playHoverSound();
            }}
            onClick={() => handleModeSelect("doubly")}
            aria-label="Doubly Linked List"
          >
            <div className={styles.linkedListVisualization}>
              <div className={styles.nodeChain}>
                <div className={styles.node}>1</div>
                <div className={styles.doubleArrow}>↔</div>
                <div className={styles.node}>2</div>
                <div className={styles.doubleArrow}>↔</div>
                <div className={styles.node}>3</div>
                <div className={styles.doubleArrow}>↔</div>
                <div className={styles.node}>4</div>
              </div>
            </div>
            <div className={styles.modeCardTitle}>Doubly Linked Lists</div>
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
