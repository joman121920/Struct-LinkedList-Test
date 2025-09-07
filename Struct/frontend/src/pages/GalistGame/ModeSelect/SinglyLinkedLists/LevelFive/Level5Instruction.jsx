
import PropTypes from 'prop-types';
import styles from './AbstractDataType.module.css';

const Level5Instruction = ({ 
  showInstructionPopup, 
  currentExercise, 
  startExercise 
}) => {
  if (!showInstructionPopup || !currentExercise || !currentExercise.expectedStructure) {
    return null;
  }

  return (
    <div className={styles.instructionPopup}>
      <div className={styles.instructionContent}>
        <h1>{currentExercise.title}</h1>
        <div className={styles.instructionList}>
          {currentExercise.expectedStructure.map((node, index) => (
            <div key={index} className={styles.instructionItem}>
              <span className={styles.instructionValue}>
                Value: {node.value}
              </span>
              <span className={styles.instructionArrow}>→</span>
              <span className={styles.instructionAddress}>
                Address: {node.address}
              </span>
            </div>
          ))}
        </div>
        <button className={styles.startButton} onClick={startExercise}>
          Start
        </button>
      </div>
    </div>
  );
};

Level5Instruction.propTypes = {
  showInstructionPopup: PropTypes.bool.isRequired,
  currentExercise: PropTypes.shape({
    title: PropTypes.string.isRequired,
    expectedStructure: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        address: PropTypes.string.isRequired,
      })
    ).isRequired,
  }),
  startExercise: PropTypes.func.isRequired,
};

export default Level5Instruction;