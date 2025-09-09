import PropTypes from 'prop-types';
import styles from './Instruction.module.css';

const CompetitiveInstruction = ({ 
  showInstructionPopup, 
  startExercise 
}) => {

  if (!showInstructionPopup) {
    return null;
  }

  return (
    <div className={styles.instructionOverlay}>
      <div className={styles.instructionModal}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={startExercise}>
          ×
        </button>

        {/* Tab content - Only Game Mechanics */}
        <div className={styles.tabContent}>
          <div className={styles.mechanicsContent}>
            <div className={styles.howToPlayContainer}>
              <div className={styles.howToPlaySection}>
                <div className={styles.howToPlayLeft}>
                  <h2 className={styles.howToPlayTitle}>How to play Competitive Mode</h2>
                  <div className={styles.howToPlaySteps}>
                    <p><strong>⏱️ Time Pressure:</strong> You have exactly 3 minutes to complete as many exercises as possible.</p>
                    <p><strong>🎯 Perfect Score Required:</strong> Each exercise requires a score of 100 points to advance to the next random challenge.</p>
                    <p><strong>🔀 Random Generation:</strong> Every exercise is randomly generated with different node values and memory addresses.</p>
                    <p><strong>🏆 Competitive Goal:</strong> Complete as many linked list exercises as possible before time runs out!</p>
                    <p><strong>🌀 Portal Submission:</strong> After creating your linked list, open the portal to submit and validate your solution.</p>
                  </div>
                </div>
               
              </div>
              <p className={styles.howToPlayNote}>
                Remember to pass the circles sequentially through the portal to proceed to the next exercise!
              </p>
            </div>
          </div>
        </div>

        {/* Start button */}
        <div className={styles.buttonContainer}>
          <button className={styles.startButton} onClick={startExercise}>
            START COMPETITIVE MODE
          </button>
        </div>
      </div>
    </div>
  );
};

CompetitiveInstruction.propTypes = {
  showInstructionPopup: PropTypes.bool.isRequired,
  startExercise: PropTypes.func.isRequired,
};

export default CompetitiveInstruction;
