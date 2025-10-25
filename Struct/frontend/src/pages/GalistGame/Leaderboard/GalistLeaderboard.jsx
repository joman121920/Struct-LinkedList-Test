import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './galistLeaderboard.module.css';
import { api } from "../../../data/api";

function GalistLeaderboard() {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
       const data = await api.get('/galist/leaderboard/', {
        params: { limit: 10 }
      });

      const seen = new Set();
      const uniqueEntries = data.filter((entry) => {
        const key = `${entry.score}|${entry.formatted_time}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 10);
      
      // Transform data to match component structure
      const formattedData = uniqueEntries.map((entry, index) => ({
        rank: index + 1,
        name: entry.username,
        score: entry.score,
        time: entry.formatted_time,
        profilePhoto: entry.profile_photo_url
      }));

      setLeaderboardData(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
      setLoading(false);
    }
  };

  const handleLeaderboard = () => {
    navigate("/galist-game");
  };

  if (loading) {
    return (
      <div className={styles.leaderboardOverlay}>
        <video
          className={styles.leaderboardVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/space.mp4" type="video/mp4" />
        </video>
        <div className={styles.leaderboardContent}>
          <p style={{ color: '#fff', fontSize: '20px' }}>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.leaderboardOverlay}>
        <video
          className={styles.leaderboardVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="./video/space.mp4" type="video/mp4" />
        </video>
        <div className={styles.leaderboardContent}>
          <p style={{ color: '#ff4444', fontSize: '20px' }}>{error}</p>
          <button className={styles.backButton} onClick={handleLeaderboard}>
            BACK TO MENU
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.leaderboardOverlay}>
      <video
        className={styles.leaderboardVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="./video/space.mp4" type="video/mp4" />
      </video>

      <div className={styles.leaderboardContent}>
        <h1 className={styles.leaderboardTitle}>LEADERBOARD</h1>
        <p className={styles.leaderboardSubtitle}>TOP PERFORMERS</p>

        <div className={styles.leaderboardTable}>
          <div className={styles.tableHeader}>
            <span className={styles.headerRank}>RANK</span>
            <span className={styles.headerName}>PLAYER</span>
            <span className={styles.headerScore}>SCORE</span>
            <span className={styles.headerTime}>TIME</span>
          </div>

          <div className={styles.tableBody}>
            {leaderboardData.length === 0 ? (
              <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>
                No scores yet. Be the first to play!
              </div>
            ) : (
              leaderboardData.map((player) => (
                <div 
                  key={player.rank} 
                  className={`${styles.tableRow} ${
                    player.rank <= 3 ? styles.topThree : ''
                  }`}
                >
                  <span className={styles.cellRank}>
                    {player.rank <= 3 ? (
                      <span className={styles.medalIcon}>
                        {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      player.rank
                    )}
                  </span>
                  <span className={styles.cellName}>{player.name}</span>
                  <span className={styles.cellScore}>{player.score.toLocaleString()}</span>
                  <span className={styles.cellTime}>{player.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <button className={styles.backButton} onClick={handleLeaderboard}>
          BACK TO MENU
        </button>
      </div>
    </div>
  );
}

export default GalistLeaderboard;