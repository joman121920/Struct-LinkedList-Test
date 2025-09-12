import React from "react";
import { Link } from "react-router-dom";
import { FaRocket, FaGamepad, FaBook } from "react-icons/fa";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-100 bg-gradient-to-b from-[#070B1A] via-[#0B1030] to-[#0E163D]">
      {/* Cosmic background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
      </div>

      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 py-10 text-center">
        {/* Hero */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300">
          Chart Your Course
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8">
          Learn, play, and master Linked List with cosmic missions, challenges,
          and gamified progress.
        </p>

        {/* Gamified badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-200 text-sm">
            <FaGamepad /> Play & Compete
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-sm">
            <FaRocket /> Level Up Fast
          </span>
        </div>

        {/* Call to Action Section */}
        <div className="flex items-center justify-center">
          <Link
            to="/galist-game"
            className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 text-white transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
          >
            Launch Galist Game
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
