import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios"; // Make sure this is imported
import { API_BASE } from "../data/api"; // added
// Create context
export const AuthContext = createContext();

// Context provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the latest user data from API
  const fetchUserData = async (token) => {
    try {
      // API_BASE already ends with /api (from .env)
      const res = await fetch(`${API_BASE}/user/profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching user data from API:", error);
      return null;
    }
  };

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          // Parse user data
          let parsedUserData = JSON.parse(userData);
          
          // Check for profile photo data for this user
          const allPhotos = JSON.parse(localStorage.getItem('allProfilePhotos') || '{}');
          const userPhotoUrl = allPhotos[parsedUserData.id];
          
          // If we have a stored photo for this user and they don't have one in their data
          if (userPhotoUrl && !parsedUserData.profile_photo_url) {
            parsedUserData.profile_photo_url = userPhotoUrl;
          }
          
          // Try to fetch the latest data from the backend
          const latestUserData = await fetchUserData(token);
          if (latestUserData) {
            // Update with latest data from database, preserving existing values we want to keep
            parsedUserData = {
              ...parsedUserData,
              // Take hearts and hints directly from backend if available
              hearts: latestUserData.hearts !== undefined ? latestUserData.hearts : parsedUserData.hearts || 3,
              hints: latestUserData.hints !== undefined ? latestUserData.hints : parsedUserData.hints || 3,
              points: latestUserData.points !== undefined ? latestUserData.points : parsedUserData.points || 0
            };
          } else {
            // If API fetch failed, ensure we have defaults
            parsedUserData.hearts = parsedUserData.hearts !== undefined ? parsedUserData.hearts : 3;
            parsedUserData.hints = parsedUserData.hints !== undefined ? parsedUserData.hints : 3;
          }
          
          setIsAuthenticated(true);
          setUser(parsedUserData);
          
          // Save the updated user data with defaults back to localStorage
          localStorage.setItem("user", JSON.stringify(parsedUserData));
        } catch (error) {
          console.error("Error parsing authentication data:", error);
          // Reset auth state if there's an error
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (token, userData) => {
    try {
      // Try to fetch the most up-to-date user data from the backend
      const latestUserData = await fetchUserData(token);
      
      // Merge the latest data with the provided userData, prioritizing the backend values
      const updatedUserData = {
        ...userData,
        hearts: latestUserData?.hearts !== undefined ? latestUserData.hearts : (userData.hearts || 3),
        hints: latestUserData?.hints !== undefined ? latestUserData.hints : (userData.hints || 3),
        points: latestUserData?.points !== undefined ? latestUserData.points : (userData.points || 0)
      };
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setIsAuthenticated(true);
      
      // Check if we have a saved photo for this user
      try {
        const allPhotos = JSON.parse(localStorage.getItem('allProfilePhotos') || '{}');
        const userPhotoUrl = allPhotos[updatedUserData.id];
        
        // If we have a photo for this user and they don't have one in their data
        if (userPhotoUrl && !updatedUserData.profile_photo_url) {
          updatedUserData.profile_photo_url = userPhotoUrl;
        }
        
        setUser(updatedUserData);
      } catch (e) {
        console.error("Error processing saved photo during login:", e);
        setUser(updatedUserData);
      }
    } catch (error) {
      console.error("Error in login process:", error);
      // Fall back to the provided user data with defaults
      const fallbackUserData = {
        ...userData,
        hearts: userData.hearts !== undefined ? userData.hearts : 3,
        hints: userData.hints !== undefined ? userData.hints : 3
      };
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(fallbackUserData));
      setIsAuthenticated(true);
      setUser(fallbackUserData);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    // We don't remove profile photos as they should persist between sessions
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    // Update both state and localStorage
    const updatedUser = { 
      ...user, 
      ...updatedUserData,
      // Always ensure hearts and hints have values
      hearts: updatedUserData.hearts !== undefined ? updatedUserData.hearts : (user?.hearts || 3),
      hints: updatedUserData.hints !== undefined ? updatedUserData.hints : (user?.hints || 3)
    };
    
    setUser(updatedUser);
    
    // Also update in localStorage to persist across refreshes
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    // If profile photo is updated, store it separately too
    if (updatedUserData.profile_photo_url && user?.id) {
      try {
        // Store photos for all users in a single object keyed by user ID
        const allPhotos = JSON.parse(localStorage.getItem('allProfilePhotos') || '{}');
        allPhotos[user.id] = updatedUserData.profile_photo_url;
        localStorage.setItem('allProfilePhotos', JSON.stringify(allPhotos));
      } catch (error) {
        console.error("Error storing profile photo:", error);
      }
    }
    
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
