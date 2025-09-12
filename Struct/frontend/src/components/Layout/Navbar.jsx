import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaSignOutAlt,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBars,
  FaTimes,
  FaUser,
  FaUserCog,
  FaCaretDown,
  FaHeart,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  // Class management disabled: join/create modal state removed
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Add heart state variables
  const [hearts, setHearts] = useState(0);
  const [maxHearts, setMaxHearts] = useState(5);
  const [nextHeartIn, setNextHeartIn] = useState(null);
  // Removed heartIntervalId state; using local interval handles instead

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Function to format remaining time
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return null;

    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }

    return `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
  };

  // Function to fetch heart data
  const fetchHeartData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const API_BASE_URL = "http://localhost:8000";
      const response = await axios.get(`${API_BASE_URL}/api/user/hearts/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const { hearts: userHearts, max_hearts, next_heart_in } = response.data;

      setHearts(userHearts);
      setMaxHearts(max_hearts || 5);
      setNextHeartIn(next_heart_in);
    } catch (error) {
      console.error("Error fetching heart data:", error);
    }
  }, [isAuthenticated]);

  // Removed minute-based countdown effect (redundant with per-second countdown below)

  // Update countdown timer every second
  useEffect(() => {
    if (isAuthenticated && nextHeartIn !== null && nextHeartIn > 0) {
      const countdownInterval = setInterval(() => {
        setNextHeartIn((prev) => {
          if (prev <= 1000) {
            // If we're below 1 second, fetch new data
            fetchHeartData();
            return null;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isAuthenticated, nextHeartIn, fetchHeartData]);

  // Periodically refresh heart data from server
  useEffect(() => {
    if (isAuthenticated) {
      fetchHeartData();

      // Set up interval to update the countdown timer
      const intervalId = setInterval(() => {
        fetchHeartData();
      }, 60 * 1000); // Refresh every minute

      // Clear interval on component unmount
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isAuthenticated, fetchHeartData]);

  // Close the user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className="w-full px-4 py-3 flex items-center justify-between fixed top-0 left-0 z-50 border-b border-white/10 bg-[#0A0F2A]/70 backdrop-blur-md shadow-[0_0_40px_rgba(16,24,64,0.4)]">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            {/* Logo disabled while focusing on space-themed text brand */}
            <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300 drop-shadow">
              STRUCT | ACADEMY
            </h2>
          </Link>
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          className="lg:hidden text-amber-300 text-2xl focus:outline-none"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Menu Section */}
        <div
          className={`${
            isMenuOpen ? "block" : "hidden"
          } lg:flex lg:items-center lg:gap-4 absolute lg:static top-16 left-0 w-full lg:w-auto bg-[#0A0F2A] lg:bg-transparent shadow-2xl shadow-indigo-900/20 lg:shadow-none px-4 lg:px-0 border-b border-white/10 lg:border-none`}
        >
          {isAuthenticated ? (
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* <ClassSelector
                onJoinClick={() => setIsJoinModalOpen(true)}
                onCreateClick={() => setIsCreateModalOpen(true)}
              /> */}

              {/* Heart counter and countdown */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center px-2 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/30 text-amber-200">
                  <span className="text-xs font-semibold">{hearts}</span>
                  <FaHeart className="text-[11px] text-rose-400 ml-1" />
                  <span className="text-[10px] text-slate-300 ml-1">
                    /{maxHearts}
                  </span>
                </div>

                {nextHeartIn && hearts < maxHearts && (
                  <div className="text-[10px] text-indigo-200 bg-indigo-500/10 border border-indigo-400/30 px-2 py-1 rounded-md mt-1">
                    {formatTimeRemaining(nextHeartIn)}
                  </div>
                )}
              </div>

              {/* Username with dropdown menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 text-sm text-slate-200 hover:text-amber-300 transition-colors focus:outline-none"
                >
                  {user?.userType === "teacher" ? (
                    <FaChalkboardTeacher className="text-indigo-300" />
                  ) : (
                    <FaUserGraduate className="text-indigo-300" />
                  )}
                  <span className="font-medium">{user?.username}</span>
                  <span className="text-slate-500">|</span>
                  <span className="capitalize text-fuchsia-300">
                    {user?.userType}
                  </span>
                  <FaCaretDown
                    className={`text-amber-300 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0F1536] border border-white/10 rounded-md shadow-2xl py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-amber-300"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaUserCog />
                      Manage Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-amber-300 w-full text-left"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-amber-300 font-medium py-2 px-4 rounded-md border border-amber-300/50 hover:bg-amber-300/10 transition"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-gradient-to-r from-amber-400 to-fuchsia-500 text-white py-2 px-4 rounded-md hover:from-indigo-400 hover:to-amber-300 transition shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Class management modals removed while feature is disabled */}
    </>
  );
};

export default Navbar;
