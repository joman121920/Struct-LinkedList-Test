
import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Level5Instruction.module.css';
import { EXERCISE_TEMPLATES } from './AbstractExercise.js';

const Level5Instruction = ({ 
  showInstructionPopup, 
  // currentExercise, 
  startExercise 
}) => {
  const [activeTab, setActiveTab] = useState('learn');
  const [currentPortal, setCurrentPortal] = useState(0); // For portal navigation
  
  const portals = [
    {
      name: "First Portal",
      exercise: EXERCISE_TEMPLATES.exercise_one,
      description: "Create a linked lists that consists of 5 nodes. Using only the insertion methods"
    },
    {
      name: "Second Portal", 
      exercise: EXERCISE_TEMPLATES.exercise_two,
      description: "Create a linked lists that consists of 6 nodes. Using only the insertion methods"
    },
    {
      name: "Third Portal",
      exercise: EXERCISE_TEMPLATES.exercise_tree,
      description: "Create a linked lists that consists of 6 nodes. Using only the insertion methods"
    }
  ];

  const handleNextPortal = () => {
    setCurrentPortal((prev) => (prev + 1) % portals.length);
  };

  const handlePrevPortal = () => {
    setCurrentPortal((prev) => (prev - 1 + portals.length) % portals.length);
  }; // 'learn' or 'mechanics'

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

        {/* Tab navigation */}
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tab} ${activeTab === 'learn' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            Learn Linked List
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'mechanics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('mechanics')}
          >
            Game Mechanics
          </button>
        </div>

        {/* Tab content */}
        <div className={styles.tabContent}>
          {activeTab === 'learn' && (
            <div className={styles.learnContent}>
              <div className={styles.learningSection}>
                <h2 className={styles.sectionTitle}>Learning Objective:</h2>
                <p className={styles.objective}>By the end of this level, learners will be able to:</p>
                <ul className={styles.objectiveList}>
                  <li>Understand how a Queue ADT works using a linked list.</li>
                  <li>Differentiate between enqueue (insertion) and dequeue (deletion) operations.</li>
                  <li>Conceptually trace how the front and rear pointers move when performing operations.</li>
                </ul>
              </div>

              <div className={styles.conceptSection}>
                <h2 className={styles.sectionTitle}>Concept Explanation:</h2>
                <p className={styles.conceptIntro}>
                  A Queue is an Abstract Data Type (ADT) that follows the FIFO principle: 
                  First In, First Out – the first element inserted is the first to be removed.
                </p>
                
                <p className={styles.conceptSubtitle}>There are three main cases of deletion:</p>
                
                <div className={styles.operationsList}>
                  <div className={styles.operation}>
                    <h3 className={styles.operationTitle}>1. Enqueue (Insertion at the Rear)</h3>
                    <ul className={styles.operationDetails}>
                      <li>A new node is added at the rear of the queue.</li>
                      <li>Example: Start with 10 → 20. Enqueue 30 → new queue becomes 10 → 20 → 30.</li>
                    </ul>
                  </div>

                  <div className={styles.operation}>
                    <h3 className={styles.operationTitle}>2. Dequeue (Deletion at the Front)</h3>
                    <ul className={styles.operationDetails}>
                      <li>The node at the front is removed.</li>
                      <li>The front pointer moves to the next node.</li>
                      <li>If the queue becomes empty, both front and rear are set to null.</li>
                      <li>Example: Start with 10 → 20 → 30. Dequeue → new queue becomes 20 → 30.</li>
                    </ul>
                  </div>

                  <div className={styles.operation}>
                    <h3 className={styles.operationTitle}>3. Peek (Access the Front Element)</h3>
                    <ul className={styles.operationDetails}>
                      <li>Returns the value at the front without removing it.</li>
                      <li>Example: Queue 10 → 20 → 30. Peek → returns 10, queue remains 10 → 20 → 30.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mechanics' && (
            <div className={styles.mechanicsContent}>
              <div className={styles.portalDisplay}>
                <h1 className={styles.portalTitle}>{portals[currentPortal].name}</h1>
                <p className={styles.portalDescription}>{portals[currentPortal].description}</p>
                
                <div className={styles.linkedListVisualization}>
                  {portals[currentPortal].exercise.sequence.map((value, index) => (
                    <div key={index} className={styles.nodeContainer}>
                      <div className={styles.nodeCircle}>
                        <div className={styles.nodeValue}>{value}</div>
                        <div className={styles.nodeAddress}>
                          {portals[currentPortal].exercise.addresses[value]}
                        </div>
                      </div>
                      {index < portals[currentPortal].exercise.sequence.length - 1 && (
                        <div className={styles.nodeArrow}>→</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className={styles.sequentialNote}>Make sure to pass the nodes sequentially</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons for Game Mechanics tab */}
        <div className={styles.buttonContainer}>
          {activeTab === 'mechanics' && (
            <>
              <button 
                className={styles.navButton} 
                onClick={handlePrevPortal}
                disabled={currentPortal === 0}
                style={{ visibility: currentPortal === 0 ? 'hidden' : 'visible' }}
              >
                Previous
              </button>
              <div></div> {/* Spacer element */}
              <button 
                className={styles.navButton} 
                onClick={handleNextPortal}
                disabled={currentPortal === portals.length - 1}
                style={{ visibility: currentPortal === portals.length - 1 ? 'hidden' : 'visible' }}
              >
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

Level5Instruction.propTypes = {
  showInstructionPopup: PropTypes.bool.isRequired,
  currentExercise: PropTypes.object,
  startExercise: PropTypes.func.isRequired,
};

export default Level5Instruction;