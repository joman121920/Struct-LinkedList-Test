import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SinglyLinkedListsSelection.module.css";
import { playMenuBgMusic, stopMenuBgMusic, playGameStartSound, playFirstClickSound, playHoverSound } from "../../Sounds.jsx";

const levelsPage1 = [
  { 
    level: 1, 
    title: "Creating Node",
    visualization: "creation" // Multiple scattered nodes
  },
  { 
    level: 2, 
    title: "Linking Nodes",
    visualization: "linking" // Two nodes with arrow between them
  },
  { 
    level: 3, 
    title: "Insertion of Nodes",
    visualization: "insertion" // Shows insertion operation with arrow pointing down
  },
];

const levelsPage2 = [
  { 
    level: 4, 
    title: "Deletion of Node",
    visualization: "deletion" // Shows node being deleted from chain
  },
  { 
    level: 5, 
    title: "Abstract Data Type",
    visualization: "abstract" // Shows stack/queue operations
  },
];

function SinglyLinkedListsSelection({ onSelect }) {
  
  const [page, setPage] = useState(1);
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
      navigate("/galist-game-deletion");
    } else if(lvl.level ===1 ) {
      navigate("/galist-game-node-creation");
    } else if(lvl.level ===2 ) {
      navigate("/galist-game-linking-node");
    }  else if(lvl.level ===3 ) {
      navigate("/galist-game-insertion-node");
    } else if(lvl.level ===5 ) {
      navigate("/galist-game-abstract-data-type");
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
        <h2 className={styles.title}>Singly Linked Lists</h2>
        <div className={styles.levelsRow}>
          {(page === 1 ? levelsPage1 : levelsPage2).map((lvl) => (
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
                {lvl.visualization === "creation" && (
                  <div className={styles.creationVisualization}>
                    <div className={styles.scatteredNodes}>
                      <div className={styles.node} style={{position: 'absolute', top: '20px', left: '40px'}}>42</div>
                      <div className={styles.node} style={{position: 'absolute', top: '5px', right: '30px'}}>11</div>
                      <div className={styles.node} style={{position: 'absolute', bottom: '15px', left: '15px'}}>31</div>
                      <div className={styles.node} style={{position: 'absolute', bottom: '5px', right: '15px'}}>46</div>
                    </div>
                  </div>
                )}
                {lvl.visualization === "linking" && (
                  <div className={styles.linkingVisualization}>
                    <div className={styles.nodeChain}>
                      <div className={styles.node}>13</div>
                      <div className={styles.arrow}>→</div>
                      <div className={styles.node}>44</div>
                    </div>
                  </div>
                )}
                {lvl.visualization === "insertion" && (
                  <div className={styles.insertionVisualization}>
                    <div className={styles.insertionContainer}>
                      <div className={styles.newNode}>12</div>
                      <div className={styles.downArrow}>↓</div>
                      <div className={styles.nodeChain}>
                        <div className={styles.node}>14</div>
                        <div className={styles.arrow}>→</div>
                        <div className={styles.node}>21</div>
                      </div>
                    </div>
                  </div>
                )}
                {lvl.visualization === "deletion" && (
                  <div className={styles.deletionVisualization}>
                    <div className={styles.nodeChain}>
                      <div className={styles.node}>2</div>
                      <div className={styles.arrow}>→</div>
                      <div className={styles.deletedNode}>6</div>
                      <div className={styles.arrow}>→</div>
                      <div className={styles.node}>10</div>
                    </div>
                  </div>
                )}
                {lvl.visualization === "abstract" && (
                  <div className={styles.abstractVisualization}>
                    <div className={styles.queueVisualization}>
                      <div className={styles.queueLabel}>Queue</div>
                      <div className={styles.queueElements}>
                        <div className={styles.queueArrow}>→</div>
                        <div className={styles.node}>1</div>
                        <div className={styles.node}>2</div>
                        <div className={styles.node}>3</div>
                        <div className={styles.queueArrow}>→</div>
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
        
        {/* Separate navigation arrows container */}
        <div className={styles.arrowRow}>
          {page === 2 && (
            <button
              className={styles.arrowBtn}
              onMouseEnter={()=>{
                  playHoverSound();
              }}
              onClick={() => { setPage(1); playFirstClickSound(); }}
              aria-label="Previous"
            >
              &#8592;
            </button>
          )}
          {page === 1 && (
            <button
              className={styles.arrowBtn}
              onMouseEnter={()=>{
                  playHoverSound();
              }}
              onClick={() => { setPage(2); playFirstClickSound(); }}
              aria-label="Next"
            >
              &#8594;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

SinglyLinkedListsSelection.propTypes = {
  onSelect: PropTypes.func,
};

export default SinglyLinkedListsSelection;