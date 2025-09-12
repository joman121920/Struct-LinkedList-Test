import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaHeart, FaCamera, FaCheck, FaTimes } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";

// Throttle to avoid duplicate profile fetches (e.g., StrictMode double-mount)
let lastProfileFetchAt = 0;

const Profile = () => {
  const { isAuthenticated, user: authUser } = useAuth();
  const updateUserFromContext = useAuth().updateUser;
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localProfilePhoto, setLocalProfilePhoto] = useState(null);
  const [profileData, setProfileData] = useState({
    points: 0,
    hearts: 0,
    modules: [],
    badges: [],
  });

  const [isDataLoading, setIsDataLoading] = useState(false);

  // Add these state variables alongside your other useState declarations
  const [nextHeartIn, setNextHeartIn] = useState(null);
  const [maxHearts, setMaxHearts] = useState(5);
  const [heartsGainedToday, setHeartsGainedToday] = useState(0);
  const [maxDailyHearts, setMaxDailyHearts] = useState(null);
  const [heartJustAdded, setHeartJustAdded] = useState(false);

  useEffect(() => {
    // Prevent scrolling on the body when this component is mounted
    document.body.style.overflow = "hidden";

    // Cleanup: restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Enhanced fetch user data function
  const fetchInProgressRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    if (isAuthenticated) {
      // Cooldown: skip if a recent fetch happened very recently
      const now = Date.now();
      if (now - lastProfileFetchAt < 800) {
        return;
      }
      // Skip if another fetch is in progress
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      lastProfileFetchAt = now;

      setIsDataLoading(true);

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const API_BASE_URL = "http://localhost:8000";

        // Fetch the latest user data directly from the API
        const response = await axios.get(`${API_BASE_URL}/api/user/profile/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        console.log("Fetched user data:", response.data);

        if (response.data) {
          // Update user in context if needed
          if (typeof updateUserFromContext === "function") {
            updateUserFromContext(response.data);
          }

          // Update profile data with real values from the database
          setProfileData((prevData) => ({
            ...prevData,
            points: response.data.points || 0,
            hearts: response.data.hearts || 0,
          }));

          // Set profile photo if available
          if (response.data.profile_photo_url) {
            setLocalProfilePhoto(response.data.profile_photo_url);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsDataLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [isAuthenticated, updateUserFromContext]);

  // Fetch profile data on auth changes (guarded against duplicates)
  useEffect(() => {
    fetchUserData();
  }, [isAuthenticated, fetchUserData]);

  // Seed sample modules/badges once, without retriggering fetch
  useEffect(() => {
    setProfileData((prevData) => {
      if (prevData.modules && prevData.modules.length > 0) return prevData;
      return {
        ...prevData,
        modules: [
          { id: 1, name: "Arrays", progress: 100, completed: true },
          { id: 2, name: "Stacks", progress: 63, completed: false },
        ],
        badges: [
          {
            id: 1,
            name: "Array Novice",
            icon: "/path/to/array-badge.png",
            earned: true,
          },
        ],
      };
    });
  }, []);

  // Add window focus event listener to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused - refreshing user data");
      fetchUserData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Tab became visible - refreshing user data");
        fetchUserData();
      }
    };

    // Add event listeners
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up periodic refresh every 30 seconds while user is active
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        fetchUserData();
      }
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, fetchUserData]);

  // Listen for custom events from other components (like quiz completion)
  useEffect(() => {
    const handleScoreUpdate = (event) => {
      console.log("Score update event received:", event.detail);
      // Refresh data immediately when score is updated
      setTimeout(() => {
        fetchUserData();
      }, 1000); // Small delay to ensure backend has processed the update
    };

    // Listen for custom score update events
    window.addEventListener("scoreUpdated", handleScoreUpdate);

    return () => {
      window.removeEventListener("scoreUpdated", handleScoreUpdate);
    };
  }, [fetchUserData]);

  // Heart regeneration logic
  const checkAndRegenerateHearts = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const API_BASE_URL = "http://localhost:8000";
      const response = await axios.get(`${API_BASE_URL}/api/user/hearts/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const {
        hearts,
        max_hearts,
        hearts_gained_today,
        max_daily_hearts,
        next_heart_in,
      } = response.data;

      // Update local state
      setProfileData((prevData) => ({
        ...prevData,
        hearts: hearts,
      }));

      setMaxHearts(max_hearts || 5);
      setHeartsGainedToday(hearts_gained_today || 0);
      setMaxDailyHearts(max_daily_hearts ?? null);

      // Set next_heart_in directly from the API if available
      // This ensures we respect the backend's decision about regeneration
      if (next_heart_in === null) {
        setNextHeartIn(null); // No regeneration needed (at max or daily limit)
      } else {
        setNextHeartIn(next_heart_in);
      }

      if (hearts > profileData.hearts) {
        setHeartJustAdded(true);
        setTimeout(() => setHeartJustAdded(false), 2000);
      }
    } catch (error) {
      console.error("Error checking heart regeneration:", error);
    }
  };

  // (Removed unused calculateNextHeartTime)

  // Set up heart regeneration timer
  useEffect(() => {
    if (isAuthenticated) {
      // Initial check for hearts
      checkAndRegenerateHearts();

      // Set up interval to decrement timer locally every second
      const intervalId = setInterval(() => {
        if (nextHeartIn !== null && nextHeartIn > 0) {
          setNextHeartIn((prev) => {
            if (prev - 1000 <= 0) {
              // Only call API when timer reaches zero
              checkAndRegenerateHearts();
              return null;
            }
            return prev - 1000;
          });
        }
      }, 1000); // Check every second for smoother countdown

      // Cleanup on unmount
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
    // Only depend on isAuthenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Handler to open file dialog
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  // Handler for file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handler to cancel photo upload
  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handler to confirm and upload photo
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("photo", selectedFile);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setUploadError("Authentication token is missing. Please log in again.");
        setIsUploading(false);
        return;
      }

      const API_BASE_URL = "http://localhost:8000";

      const response = await axios.post(
        `${API_BASE_URL}/api/user/update-profile-photo/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${token}`,
          },
        }
      );

      console.log("Upload response:", response.data);

      if (response.data.success && response.data.profile_photo_url) {
        // Update context if possible
        if (typeof updateUserFromContext === "function") {
          try {
            // Only update the current user's profile photo in context
            updateUserFromContext({
              ...authUser,
              profile_photo_url: response.data.profile_photo_url,
            });
          } catch (err) {
            console.warn("Could not update user in context:", err);
          }
        }

        // Update local state for current user's profile photo
        setLocalProfilePhoto(response.data.profile_photo_url);

        // Reset file selection
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setUploadError("Failed to upload photo. Please try again later.");
    } finally {
      setIsUploading(false);
    }
  };

  // Format time remaining until next heart
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

  if (!isAuthenticated || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-100 bg-gradient-to-b from-[#070B1A] via-[#0B1030] to-[#0E163D]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
        </div>
        <div className="relative z-10 text-center px-6">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300">
            Please log in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-100 bg-gradient-to-b from-[#070B1A] via-[#0B1030] to-[#0E163D]">
      {/* Cosmic background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300">
            Profile
          </h1>
          <button
            onClick={fetchUserData}
            disabled={isDataLoading}
            className="py-2 px-4 rounded-md text-sm font-semibold bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 text-white transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.25)] disabled:opacity-60"
          >
            {isDataLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl text-center"
          >
            <div className="w-36 h-36 mx-auto relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400/40 to-fuchsia-500/40 blur-lg" />
              <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-r from-amber-400/60 to-fuchsia-500/60">
                <div className="w-full h-full rounded-full overflow-hidden bg-black/20">
                  <img
                    src={
                      previewUrl ||
                      localProfilePhoto ||
                      authUser?.profile_photo_url ||
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"
                    }
                    alt={authUser?.username || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onError = null;
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              {!previewUrl && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handlePhotoClick}
                >
                  <div className="rounded-full bg-black/50 w-36 h-36 flex items-center justify-center">
                    <FaCamera className="text-white text-2xl" />
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
              />
            </div>

            {isUploading && (
              <p className="text-amber-300 mt-2 text-sm">Uploading...</p>
            )}
            {uploadError && (
              <p className="text-red-400 mt-2 text-sm">{uploadError}</p>
            )}

            <h2 className="text-2xl font-bold mt-4">{authUser.username}</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-300 mt-1">
              <span className="capitalize text-amber-300/90">
                {authUser.user_type}
              </span>
            </div>

            {selectedFile ? (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={handleCancelUpload}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-slate-100 hover:bg-white/15 transition"
                  disabled={isUploading}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-white font-medium bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 transition shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                  disabled={isUploading}
                >
                  <FaCheck /> Save
                </button>
              </div>
            ) : (
              <button
                onClick={handlePhotoClick}
                className="mt-4 px-6 py-2 rounded-full text-white font-medium bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 mx-auto shadow-[0_0_20px_rgba(251,191,36,0.25)]"
              >
                <FaCamera /> Upload Photo
              </button>
            )}
          </motion.div>

          {/* Points & Hearts Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl relative"
          >
            <div className="absolute top-4 right-4">
              <Link
                to="/store"
                className="flex items-center gap-2 text-slate-200 hover:text-amber-300 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 drop-shadow-[0_0_6px_rgba(250,204,21,0.35)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-sm">Store</span>
              </Link>
            </div>

            <div className="text-center mb-6">
              <div className="w-36 h-36 rounded-full mx-auto flex items-center justify-center relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400/40 to-fuchsia-500/40 blur-lg" />
                <div className="relative w-full h-full rounded-full bg-black/20 border border-white/10 flex items-center justify-center">
                  <span className="text-4xl font-extrabold drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                    {profileData.points}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-slate-300">Points</p>
              {isDataLoading && (
                <p className="text-sm text-amber-300">Updating...</p>
              )}
            </div>

            <div className="flex justify-center text-center">
              <div>
                <div className="flex items-center justify-center text-xl mb-1">
                  <span className="mr-2 text-2xl font-bold">
                    {profileData.hearts}
                  </span>
                  <FaHeart
                    className={`${
                      heartJustAdded ? "animate-pulse" : ""
                    } text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.45)]`}
                  />
                </div>
                <p className="text-sm text-slate-300">
                  Hearts Available{" "}
                  <span className="text-slate-400">
                    ({profileData.hearts}/{maxHearts})
                  </span>
                </p>
                <div className="mt-2 h-2 w-56 bg-white/10 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-fuchsia-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (profileData.hearts / (maxHearts || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
                {/* Show next heart timer if applicable */}
                {nextHeartIn !== null && nextHeartIn > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Next heart in:{" "}
                    <span className="font-semibold text-slate-200">
                      {formatTimeRemaining(nextHeartIn)}
                    </span>
                  </p>
                )}
                {maxDailyHearts !== null && (
                  <p className="text-xs text-slate-400 mt-1">
                    Today:{" "}
                    <span className="font-semibold text-slate-200">
                      {heartsGainedToday}
                    </span>{" "}
                    / {maxDailyHearts}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
