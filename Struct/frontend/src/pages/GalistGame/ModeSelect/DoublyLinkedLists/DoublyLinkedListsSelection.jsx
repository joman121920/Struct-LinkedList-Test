import PropTypes from "prop-types";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DoublyLinkedListsSelection.module.css";
import { playMenuBgMusic, stopMenuBgMusic, playGameStartSound, playHoverSound } from "../../Sounds.jsx";

const levelsPage1 = [
  { 
    level: 1, 
    title: "Linking Nodes",
    visualization: "linking" // Two nodes with bidirectional arrow between them
  },
  { 
    level: 2, 
    title: "Insertion of Nodes",
    visualization: "insertion" // Shows insertion operation with arrow pointing down
  },
  { 
    level: 3, 
    title: "Abstract Data Types",
    visualization: "abstract" // Shows deque operations
  },
];

// const levelsPage2 = [
//   { level: 4, title: "Deletion of Node" },
//   { level: 5, title: "Abtract Data Types" },
// ];

function DoublyLinkedListsSelection({ onSelect }) {
  const navigate = useNavigate();

  // Start menu background music when component mounts
  useEffect(() => {
    playMenuBgMusic();
    
    // Cleanup: stop menu music when component unmounts
    
  }, []);

  const handleLevelSelect = (lvl) => {
    // Play game start sound and stop menu music when selecting a level
    playGameStartSound();
    stopMenuBgMusic();
    if (lvl.level === 4) {
      navigate("/galist-game-doubly-deletion");
    } else if(lvl.level ===1 ) {
      navigate("/galist-game-doubly-linking-node");
    } else if(lvl.level ===2 ) {
      navigate("/galist-game-doubly-insertion-node");
    }  else if(lvl.level ===3 ) {
      navigate("/galist-game-doubly-abstract-data-type");
    } else if(lvl.level ===5 ) {
      navigate("/galist-game-doubly-abstract-data-type");
    } else {
      if (onSelect) onSelect(lvl.level);
      // You can add navigation for other levels here if needed
    }
  };

  return (
    <div className={styles.selectionContainer} role="dialog" aria-modal="true">
      <img
        className={styles.modeVideo}
        src="./images/bg_menu.gif"
        alt="Background"
      />

      <div className={styles.modeContent}>
        <h2 className={styles.title}>Doubly Linked Lists</h2>
        <div className={styles.levelsRow}>
          {levelsPage1.map((lvl) => (
            <button
              key={lvl.level}
              className={styles.levelCard}
              onClick={() => handleLevelSelect(lvl)}
              onMouseEnter={()=>{
                  playHoverSound();
              }}
              tabIndex={0}
              aria-label={`Go to Level ${lvl.level}`}
            >
              <div className={styles.visualizationContainer}>
                {lvl.visualization === "linking" && (
                  <div className={styles.linkingVisualization}>
                    <div className={styles.nodeChain}>
                      <div className={styles.node}>1</div>
                      <div className={styles.doubleArrow}>↔</div>
                      <div className={styles.node}>2</div>
                      <div className={styles.doubleArrow}>↔</div>
                      <div className={styles.node}>3</div>
                    </div>
                  </div>
                )}
                {lvl.visualization === "insertion" && (
                  <div className={styles.insertionVisualization}>
                    <div className={styles.insertionContainer}>
                      <div className={styles.newNode}>2</div>
                      <div className={styles.downArrow}>↕</div>
                      <div className={styles.nodeChain}>
                        <div className={styles.node}>1</div>
                        <div className={styles.doubleArrow}>↔</div>
                        <div className={styles.node}>3</div>
                      </div>
                    </div>
                  </div>
                )}
                {lvl.visualization === "abstract" && (
                  <div className={styles.abstractVisualization}>
                    <div className={styles.dequeVisualization}>
                      <div className={styles.dequeLabel}>Queue</div>
                      <div className={styles.dequeElements}>
                        <div className={styles.dequeArrow}>↔</div>
                        <div className={styles.node}>A</div>
                        <div className={styles.node}>B</div>
                        <div className={styles.node}>C</div>
                        <div className={styles.dequeArrow}>↔</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.levelInfo}>
                <div className={styles.levelNumber}>Level {lvl.level}</div>
                <div className={styles.levelTitle}>{lvl.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

DoublyLinkedListsSelection.propTypes = {
  onSelect: PropTypes.func,
};

export default DoublyLinkedListsSelection;