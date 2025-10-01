import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaHeart, FaArrowLeft, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { api } from "../../data/api";

const Store = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, item: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedItem, setPurchasedItem] = useState(null);
  const [successTimeoutId, setSuccessTimeoutId] = useState(null);

  // Get user data
  const [userData, setUserData] = useState({
    points: 0,
    hearts: 0,
    max_hearts: 5, // Add max_hearts to track the limit
  });

  // Fetch user data when component mounts
  useEffect(() => {
    if (isAuthenticated && authUser) {
      setUserData({
        points: authUser.points || 0,
        hearts: authUser.hearts || 0,
        max_hearts: authUser.max_hearts || 5, // Get max_hearts from auth user
      });
    }
  }, [isAuthenticated, authUser]);

  // Clear any lingering timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
    };
  }, [successTimeoutId]);

  // Define store items
  const storeItems = [
    {
      id: "heart",
      name: "Heart",
      icon: (
        <FaHeart
          size={64}
          className="drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]"
        />
      ),
      price: 300,
      type: "hearts",
    },
  ];

  // Check if an item can be purchased
  const canPurchaseItem = (item) => {
    // Check if user has enough points
    if (userData.points < item.price) {
      return {
        canPurchase: false,
        reason: `Not enough points to purchase ${item.name}`,
      };
    }

    // Special check for hearts - prevent purchase if already at max
    if (item.type === "hearts" && userData.hearts >= userData.max_hearts) {
      return {
        canPurchase: false,
        reason: `You already have the maximum number of hearts (${userData.max_hearts})`,
      };
    }

    return { canPurchase: true, reason: null };
  };

  // Open confirm modal
  const openConfirmModal = (item) => {
    const purchaseCheck = canPurchaseItem(item);

    if (!purchaseCheck.canPurchase) {
      setError(purchaseCheck.reason);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setConfirmModal({ show: true, item });
  };

  // Close confirm modal
  const closeConfirmModal = () => {
    setConfirmModal({ show: false, item: null });
  };

  // Handle purchase
  const handlePurchase = async () => {
    const item = confirmModal.item;
    if (!item) return;

    closeConfirmModal();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Calculate new values
      const newPoints = userData.points - item.price;
      const newItemValue =
        item.type === "hearts"
          ? Math.min(userData[item.type] + 1, userData.max_hearts)
          : userData[item.type] + 1;

      // Update user data in backend (api helper adds headers + token if present)
      const updated = await api.patch("/user/profile/", {
        points: newPoints,
        [item.type]: newItemValue,
      });

      if (updated) {
        setUserData((prev) => ({
          ...prev,
          points: newPoints,
          [item.type]: newItemValue,
        }));

        if (typeof updateUser === "function") {
          updateUser({
            ...authUser,
            points: newPoints,
            [item.type]: newItemValue,
          });
        }

        setPurchasedItem(item);
        setShowSuccessModal(true);

        const timeoutId = setTimeout(() => {
          setShowSuccessModal(false);
          setPurchasedItem(null);
        }, 5000);
        setSuccessTimeoutId(timeoutId);
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      setError("Failed to complete purchase. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        {/* Cosmic background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-slate-900 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_10%_10%,rgba(34,211,238,0.18),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(600px_240px_at_90%_20%,rgba(168,85,247,0.14),transparent)]" />
        </div>

        <div className="text-center p-8 backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.25)]">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Please log in to access the store
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-semibold py-2 px-5 rounded-lg shadow-lg transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16 overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_360px_at_10%_10%,rgba(34,211,238,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_280px_at_90%_20%,rgba(168,85,247,0.16),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_300px_at_50%_110%,rgba(59,130,246,0.12),transparent)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group relative inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-white/10 px-4 py-2 text-cyan-100 hover:text-white backdrop-blur transition-colors"
            >
              <span className="absolute -inset-px rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-fuchsia-500/0 opacity-0 group-hover:opacity-30 blur transition" />
              <FaArrowLeft className="text-cyan-300" />
              Back
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
              Store
            </h1>
          </div>
        </div>

        {/* User resources */}
        <div className="flex justify-center mb-10">
          <div className="relative rounded-2xl px-8 py-4 flex items-center gap-8 backdrop-blur bg-white/10 border border-white/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center rounded-full bg-cyan-500/20 p-2">
                <FaHeart className="text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white">
                  {userData.hearts}
                  <span className="text-white/60 text-base">
                    {" "}
                    / {userData.max_hearts}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wide text-white/60">
                  Hearts
                </div>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {userData.points}
              </div>
              <div className="text-xs uppercase tracking-wide text-white/60">
                Points
              </div>
            </div>
          </div>
        </div>

        {/* Notification messages */}
        {error && (
          <div className="mb-6 mx-auto max-w-xl rounded-xl border border-red-400/30 bg-red-500/10 text-red-200 px-4 py-3 text-center backdrop-blur">
            {error}
          </div>
        )}

        {/* Store items */}
        <div
          className={`grid gap-8 justify-items-center ${
            storeItems.length === 1
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {storeItems.map((item) => {
            const purchaseCheck = canPurchaseItem(item);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group relative w-[22rem] max-w-full rounded-2xl border border-cyan-400/20 bg-white/10 px-8 py-8 text-center backdrop-blur shadow-[0_0_30px_rgba(34,211,238,0.12)] hover:shadow-[0_0_50px_rgba(34,211,238,0.25)] transition-shadow"
              >
                {/* Glow ring */}
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-cyan-400/0 to-fuchsia-400/0 opacity-0 group-hover:opacity-20 blur-xl transition" />

                <div className="mb-3 inline-flex items-center rounded-full border border-cyan-300/30 bg-black/20 px-3 py-1 text-cyan-200">
                  <span className="text-sm font-semibold">
                    {item.price} points
                  </span>
                </div>

                <div className="my-6 text-white flex justify-center">
                  {item.icon}
                </div>
                <div className="mb-2 text-2xl font-extrabold text-white">
                  {item.name}
                </div>

                {item.type === "hearts" &&
                  userData.hearts >= userData.max_hearts && (
                    <div className="mb-4 text-sm text-white/70">
                      Maximum hearts reached ({userData.max_hearts})
                    </div>
                  )}

                <button
                  onClick={() => openConfirmModal(item)}
                  disabled={isLoading || !purchaseCheck.canPurchase}
                  className={`mt-2 inline-flex justify-center rounded-xl px-8 py-2.5 font-semibold text-white shadow-lg transition-all ${
                    isLoading || !purchaseCheck.canPurchase
                      ? "bg-white/10 cursor-not-allowed text-white/60"
                      : "bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400"
                  }`}
                >
                  {isLoading ? "Processing..." : "Buy"}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 text-center text-white backdrop-blur shadow-[0_0_40px_rgba(34,211,238,0.25)]"
            >
              <h2 className="text-2xl font-bold mb-6">Confirm Purchase</h2>
              <div className="flex justify-center mb-5">
                {confirmModal.item.icon}
              </div>
              <p className="text-lg mb-8">{confirmModal.item.name}</p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handlePurchase}
                  className="inline-flex justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-10 py-2.5 font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition"
                  disabled={isLoading}
                >
                  Buy
                </button>
                <button
                  onClick={closeConfirmModal}
                  className="inline-flex justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 font-semibold text-white/90 hover:bg-white/15 transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && purchasedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mx-4 w-full max-w-sm rounded-2xl border border-green-400/30 bg-white/10 p-8 text-center text-white backdrop-blur shadow-[0_0_50px_rgba(34,197,94,0.3)]"
            >
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-500/15 p-4">
                  <FaCheck
                    size={40}
                    className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Purchase Complete!</h3>
              <p className="text-white/80 mb-4">
                {purchasedItem.name} added to your account!
              </p>
              <button
                onClick={() => {
                  if (successTimeoutId) {
                    clearTimeout(successTimeoutId);
                    setSuccessTimeoutId(null);
                  }
                  setShowSuccessModal(false);
                  setPurchasedItem(null);
                }}
                className="inline-flex justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-10 py-2.5 font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;
