import PropTypes from "prop-types";
import styles from "./GameMenu.module.css";
import { useNavigate } from "react-router-dom";

function GameMenu({ onStart }) {
  const navigate = useNavigate();

  const handleCompetitiveMode = () => {
    navigate("/competitive-mode");
  }
  return (
    <div className={styles.gameMenuOverlay} role="dialog" aria-modal="true">
      {/* Background video */}
      <video
        className={styles.menuVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="./video/space.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className={styles.menuContent}>
        <h1 className={styles.menuTitle}>Galist</h1>
        <p className={styles.menuSubtitle}>Galaxy Linked List</p>

        <div className={styles.menuButtons}>
          <button
            className={`${styles.menuBtn} ${styles.primary}`}
            onClick={onStart}
          >
            Start Game
          </button>
           <button
            className={`${styles.menuBtn} ${styles.primary}`}
            onClick={handleCompetitiveMode}
          >
            Competitve Mode
          </button>
          <button className={styles.menuBtn}>Leaderboards</button>
        </div>
      </div>
    </div>
  );
}
GameMenu.propTypes = {
  onStart: PropTypes.func.isRequired,
};

export default GameMenu;
