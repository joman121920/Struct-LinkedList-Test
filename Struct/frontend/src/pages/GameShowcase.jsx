import React from "react";
import { useNavigate } from "react-router-dom";
import { FaRocket, FaStar, FaMeteor } from "react-icons/fa";
import { motion } from "framer-motion";

const GameShowcase = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 1,
      name: "Galist Game",
      description:
        "Train your data-structures in orbit—link, launch, and learn among the stars.",
      route: "/galist-game",
      icon: (
        <FaRocket className="text-6xl text-amber-300 drop-shadow-[0_0_12px_rgba(255,200,80,0.7)]" />
      ),
      mission: "Singly Linked Lists",
      difficulty: "Cadet",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-100 relative overflow-hidden bg-gradient-to-b from-[#070B1A] via-[#0B1030] to-[#0E163D]">
      {/* Cosmic background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
      </div>

      <motion.div
        className="text-center mb-12 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl font-extrabold mb-3 tracking-wide drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300">
          🚀 Galactic Missions
        </h1>
        <p className="text-lg text-slate-300">
          Chart your course through the cosmos of algorithms. Train, compete,
          and level up your skills.
        </p>
      </motion.div>

      <motion.div
        className={`grid ${
          games.length === 1
            ? "grid-cols-1 place-items-center"
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        } gap-8 z-10`}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
          },
        }}
      >
        {games.map((game) => (
          <motion.div
            key={game.id}
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-10 px-4 flex flex-col items-center text-center transform transition duration-300 hover:scale-105 hover:border-amber-300/40 hover:shadow-[0_0_40px_rgba(251,191,36,0.2)]"
            whileHover={{ scale: 1.07 }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="mb-4">{game.icon}</div>
            <h2 className="text-2xl font-bold text-amber-200 mb-2 tracking-wide">
              {game.name}
            </h2>
            <p className="text-slate-300 text-sm mb-4">{game.description}</p>
            <div className="flex items-center gap-3 text-xs text-slate-300 mb-6">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30">
                <FaStar className="text-indigo-300" /> Mission: {game.mission}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/30">
                <FaMeteor className="text-fuchsia-300" /> Difficulty:{" "}
                {game.difficulty}
              </span>
            </div>
            <div className="mt-auto">
              {/* Use game.route for navigation */}
              <button
                onClick={() => navigate(game.route)}
                className="bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              >
                Start Game
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default GameShowcase;
