import PropTypes from 'prop-types';
import styles from './Instruction.module.css';
import {  playHoverSound } from '../../Sounds.jsx';


const CompetitiveInstruction = ({ 
  showInstructionPopup, 
  startExercise,
  closeInstructionPopup,
  isGameActive = false
}) => {

  if (!showInstructionPopup) {
    return null;
  }

  return (
    <div className={styles.instructionOverlay}>
      <div className={styles.instructionModal}>
        {/* Close button - only show when game is active */}
        {isGameActive && (
          <button className={styles.closeButton} onClick={closeInstructionPopup}>
            ×
          </button>
        )}

        {/* Header */}
        <div className={styles.tabHeader}>
          <div className={styles.tabButton}>
            Competitive Mode
          </div>
        </div>

        {/* Tab content - Only Game Mechanics */}
        <div className={styles.tabContent}>
          <div className={styles.mechanicsContent}>
            <div className={styles.howToPlayContainer}>
              <div className={styles.howToPlaySection}>
                <div className={styles.howToPlayLeft}>
                  <h2 className={styles.howToPlayTitle}>How to play</h2>
                  <div className={styles.howToPlaySteps}>
                    <p>1. Meet the expected results</p>
                    <p>2. Launching A node</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Use you mouse to move around the cannon. Right-click to shoot a circle</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. Click the circle in the middle of the cannon to choose a node to launch.</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;c. Use scroll to select where the node will be inserted.</p>
                    <p>3. Collect collectibles</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Hit the timer collectible to add more time.</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. Avoid hitting the bomb to avoid losing time.</p>
                    <p>4. In order to be in the leaderboard, you need at least 500 points.</p>
                  </div>
                </div>
                <div className={styles.howToPlayRight}>
                  <h2 className={styles.gameButtonsTitle}>Game Mechanics</h2>
                  <div className={styles.gameButtonsSteps}>
                    <p>1. Score Calculation</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Points are awarded based on how quickly you build a linked list</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. The faster you finish, the more points you earn</p>
                    <p>2. Bombs on Nodes</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Use the scroll wheel to select the insertion point</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. Click a bomb node to open the defuse modal and solve the sorting challenge.</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;c. If you fail to defuse, the bombed node will be deleted and the list will reconnect automatically.</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;d. You cannot finish the task as long there is a bomb in your linked lists.</p>
                    <p>3. The game continues until you run out of time.</p>
                  </div>
                </div>
              </div>
              <p className={styles.howToPlayNote}>
                <em>Remember to always enter the circles sequentially</em>
              </p>
            </div>
          </div>
        </div>

        {/* Start button */}
        <div className={styles.buttonContainer}>
          <button 
            className={styles.startButton} 
            onClick={() => startExercise(isGameActive)}
            onMouseEnter={() => playHoverSound()}
          >
            {isGameActive ? 'RESTART' : 'Start Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

CompetitiveInstruction.propTypes = {
  showInstructionPopup: PropTypes.bool.isRequired,
  startExercise: PropTypes.func.isRequired,
  closeInstructionPopup: PropTypes.func.isRequired,
  isGameActive: PropTypes.bool,
};

export default CompetitiveInstruction;
