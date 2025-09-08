
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
  }; // 'learn' or 'exercise'

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
          <button 
            className={`${styles.tab} ${activeTab === 'exercise' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('exercise')}
          >
            Exercises
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
              <div className={styles.howToPlayContainer}>
                <div className={styles.howToPlaySection}>
                  <div className={styles.howToPlayLeft}>
                    <h2 className={styles.howToPlayTitle}>How to play</h2>
                    <div className={styles.howToPlaySteps}>
                      <p>1. Begin by carefully entering the correct address and value for each circle you want to connect. Each circle has a unique address that you must use to properly link them together in the correct sequence.</p>
                      <p>2. Once you have set up your circles, click the &quot;Queue Menu&quot; button to access the available queue operations (Enqueue, Dequeue, and Peek). These operations will help you manipulate and organize your linked list structure according to the queue principles.</p>
                      <p>3. After arranging your linked list in the correct order and performing the necessary queue operations, click the &quot;Open Portal&quot; button to submit your completed solution and advance to the next challenge.</p>
                    </div>
                    
                  </div>
                  
                  <div className={styles.howToPlayRight}>
                    <h2 className={styles.queueOptionsTitle}>Queue Options</h2>
                    <div className={styles.queueOptionsList}>
                      <div className={styles.queueOption}>
                        <span className={styles.bullet}>•</span>
                        <div className={styles.queueContent}>
                          <strong>Enqueue</strong> - Insert a new element at the tail (rear) of the queue. This operation adds data to the end of the linked list structure, maintaining the FIFO order where new elements wait their turn.
                        </div>
                      </div>
                      <div className={styles.queueOption}>
                        <span className={styles.bullet}>•</span>
                        <div className={styles.queueContent}>
                          <strong>Dequeue</strong> - Remove and return the element at the head (front) of the queue. This operation eliminates the oldest element in the queue, allowing the next element to move to the front position.
                        </div>
                      </div>
                      <div className={styles.queueOption}>
                        <span className={styles.bullet}>•</span>
                        <div className={styles.queueContent}>
                          <strong>Peek</strong> - View the front element without removing it from the queue, while simultaneously generating energy that brightens your screen. This operation helps you see the queue contents clearly without modifying the data structure.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className={styles.howToPlayNote}>
                      Remember pass the circles sequentially inorder to proceed to the next portal
                    </p>
              </div>
            </div>
          )}

          {activeTab === 'exercise' && (
            <div className={styles.exerciseContent}>
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

        {/* Navigation buttons for Game exercise tab */}
        <div className={styles.buttonContainer}>
          {activeTab === 'exercise' && (
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