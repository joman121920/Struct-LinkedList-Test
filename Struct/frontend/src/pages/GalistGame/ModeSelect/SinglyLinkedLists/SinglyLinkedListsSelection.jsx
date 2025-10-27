import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SinglyLinkedListsSelection.module.css";
import { playMenuBgMusic, stopMenuBgMusic, playGameStartSound, playFirstClickSound, playHoverSound } from "../../Sounds.jsx";

const levelsPage1 = [
  { level: 1, title: "Creating Node" },
  { level: 2, title: "Linking Nodes" },
  { level: 3, title: "Insertion of Nodes" },
];

const levelsPage2 = [
  { level: 4, title: "Deletion of Node" },
  { level: 5, title: "Abtract Data Types" },
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
              <div className={styles.levelNumber}>Level {lvl.level}</div>
              <div className={styles.levelTitle}>{lvl.title}</div>
            </button>
          ))}
        </div>
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