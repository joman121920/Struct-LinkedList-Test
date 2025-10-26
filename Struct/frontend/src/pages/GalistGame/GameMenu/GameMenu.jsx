import { useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./GameMenu.module.css";
import { playMenuBgMusic, stopMenuBgMusic, playGameStartSound, playFirstClickSound } from "../Sounds.jsx";
import { useNavigate } from "react-router-dom";

function GameMenu({ onStart }) {
  const navigate = useNavigate();

  // Start menu background music when component mounts
  useEffect(() => {
    playMenuBgMusic();
    
    // Stop menu music when component unmounts
    return () => {
      stopMenuBgMusic();
    };
  }, []);

  const handleCompetitiveMode = () => {
    playGameStartSound();
    navigate("/competitive-mode");
  }

  const handleLeaderboard = () => {
    playFirstClickSound();
    navigate("/galist-game-leaderboard");
  }

  const handleStartGame = () => {
    playFirstClickSound();
    onStart();
  }

  const handleBackToGames = () => {
    navigate("/games");
  }

   return (
    <div className={styles.gameMenuOverlay} role="dialog" aria-modal="true">
      {/* Background video */}
      <img
        className={styles.menuVideo}
        src="./images/bg_menu.gif"
        alt="Background"
      />

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
            onClick={handleStartGame}
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
