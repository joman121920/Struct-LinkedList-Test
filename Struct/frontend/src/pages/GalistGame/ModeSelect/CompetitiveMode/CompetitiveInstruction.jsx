import PropTypes from 'prop-types';
import styles from './Instruction.module.css';

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
                    <p>1. Input the address and the value of the node</p>
                    <p>2. Click launch to create a node</p>
                    <p>3. Double click to open up the circle</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Input the address of the circle inorder to connect them</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. Click delete if you want to delete the circle/node</p>
                    <p>4. Click open portal to open the portal. This is where you submit your answers.</p>
                  </div>
                </div>
                <div className={styles.howToPlayRight}>
                  <h2 className={styles.gameButtonsTitle}>Game buttons</h2>
                  <div className={styles.gameButtonsSteps}>
                    <p>1. Launch Button - To create a circle or a node</p>
                    <p>2. Open portal - To open the portal or to submit your answers</p>
                    <p>3. Insert Button - To open insert options. (Hover the launch button)</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Head - Insert in the head of the linked lists</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. Specific - Insert circle into a specific index</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;c. Tail - Insert in the tail of the linked lists</p>
                    <p>4. Queue Menu - To open queue options. (Hover the launch button)</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;a. Peek - To get the head of the linked lists. To generate energy</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;b. Enqueue - Insert at the last index of the linked lists</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;c. Dequeue - Remove the first index which is the head</p>
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
