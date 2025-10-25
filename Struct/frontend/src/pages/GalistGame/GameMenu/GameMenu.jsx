import PropTypes from "prop-types";
import styles from "./GameMenu.module.css";
import { useNavigate } from "react-router-dom";

function GameMenu({ onStart }) {
  const navigate = useNavigate();

  const handleCompetitiveMode = () => {
    navigate("/competitive-mode");
  }

  const handleLeaderboard = () => {
    navigate("/galist-game-leaderboard");
  }

  const handleBackToGames = () => {
    navigate("/games");
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

      {/* Back Button */}
      <button 
        className={styles.backButton}
        onClick={handleBackToGames}
        aria-label="Back to games"
      >
        ← Back
      </button>

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
            Competitive Mode
          </button>
          <button
            className={`${styles.menuBtn} ${styles.primary}`}
            onClick={handleLeaderboard}
          >
            Leaderboards
          </button>
        </div>
      </div>
    </div>
  );
}
GameMenu.propTypes = {
  onStart: PropTypes.func.isRequired,
};

export default GameMenu;
