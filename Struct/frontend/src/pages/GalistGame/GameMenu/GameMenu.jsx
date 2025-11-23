import { useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./GameMenu.module.css";
import { playMenuBgMusic, stopMenuBgMusic, playGameStartSound, playFirstClickSound, playHoverSound } from "../Sounds.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../../../data/api";

function GameMenu({ onStart }) {
  const navigate = useNavigate();

  // Start menu background music when component mounts
  useEffect(() => {
    playMenuBgMusic();
    
    // Don't stop menu music on unmount - let individual actions handle it
  }, []);

  const handleCompetitiveMode = async () => {
    try {
      await api.post("user/hearts/", { hearts_to_use: 1 });
    } catch (error) {
      alert(error.message || "Unable to start Competitive Mode. Check your hearts.");
      return;
    }

    stopMenuBgMusic();
    playGameStartSound();
    navigate("/competitive-mode");
  };

  const handleLeaderboard = () => {
    playFirstClickSound();
    navigate("/galist-game-leaderboard");
  }

  const handleStartGame = () => {
    // Don't stop menu music here - let it continue to mode select
    playFirstClickSound();
    onStart();
  }

  const handleBackToGames = () => {
    stopMenuBgMusic(); // Stop menu music when leaving to games menu
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
            onMouseEnter={()=>{
              playHoverSound();
            }}
          >
            Start Game
          </button>
           <button
            className={`${styles.menuBtn} ${styles.primary}`}
            onClick={handleCompetitiveMode}
            onMouseEnter={()=>{
              playHoverSound();
            }}
          >
            Competitive Mode
          </button>
          <button
            className={`${styles.menuBtn} ${styles.primary}`}
            onClick={handleLeaderboard}
            onMouseEnter={()=>{
              playHoverSound();
            }}
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
