import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DoublyLinkedListsSelection.module.css";

const levelsPage1 = [
  // { level: 1, title: "Creating Node" },
  // { level: 2, title: "Linking Nodes" },
  // { level: 3, title: "Insertion of Nodes" },
  { level: 1, title: "Linking Nodes" },
  { level: 2, title: "Insertion of Nodes" },
  { level: 3, title: "Abtract Data Types" },
];

// const levelsPage2 = [
//   { level: 4, title: "Deletion of Node" },
//   { level: 5, title: "Abtract Data Types" },
// ];

function DoublyLinkedListsSelection({ onSelect }) {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const handleLevelSelect = (lvl) => {
    if (lvl.level === 4) {
      navigate("/galist-game-doubly-deletion");
    } else if(lvl.level ===1 ) {
      navigate("/galist-game-doubly-node-creation");
    } else if(lvl.level ===2 ) {
      navigate("/galist-game-doubly-linking-node");
    }  else if(lvl.level ===3 ) {
      navigate("/galist-game-doubly-insertion-node");
    } else if(lvl.level ===5 ) {
      navigate("/galist-game-doubly-abstract-data-type");
    } else {
      if (onSelect) onSelect(lvl.level);
      // You can add navigation for other levels here if needed
    }
  };

  return (
    <div className={styles.selectionContainer} role="dialog" aria-modal="true">
      <video
        className={styles.modeVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="./video/space.mp4" type="video/mp4" />
      </video>

      <div className={styles.modeContent}>
        <h2 className={styles.title}>Doubly Linked Lists</h2>
        <div className={styles.levelsRow}>
          {levelsPage1.map((lvl) => (
            <button
              key={lvl.level}
              className={styles.levelCard}
              onClick={() => handleLevelSelect(lvl)}
              tabIndex={0}
              aria-label={`Go to Level ${lvl.level}`}
            >
              <div className={styles.levelNumber}>Level {lvl.level}</div>
              <div className={styles.levelTitle}>{lvl.title}</div>
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