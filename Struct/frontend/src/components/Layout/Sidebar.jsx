import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaGamepad, FaBook, FaChalkboardTeacher } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="w-14 h-screen fixed top-0 left-0 bg-[#0A0F2A]/70 backdrop-blur-md flex flex-col items-center pt-24 space-y-4 border-r border-white/10 shadow-[0_0_40px_rgba(16,24,64,0.4)]">
      {/* Navigation Links */}
      <nav className="flex flex-col items-center space-y-4">
        {/* Game Icon */}
        <Link
          to="/games"
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 bg-white/5 border border-white/10 hover:bg-amber-300/10 hover:border-amber-300/40 hover:shadow-[0_0_24px_rgba(251,191,36,0.25)]"
        >
          <FaGamepad className="text-amber-300 text-lg" />
        </Link>

        {/* Teacher Dashboard Icon (Visible only for teachers) */}
        {user?.userType === "teacher" && (
          <Link
            to="/teacher-dashboard"
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 bg-white/5 border border-white/10 hover:bg-indigo-300/10 hover:border-indigo-300/40 hover:shadow-[0_0_24px_rgba(165,180,252,0.25)]"
          >
            <FaChalkboardTeacher className="text-indigo-300 text-lg" />
          </Link>
        )}
      </nav>
    </aside>
  );
};

const AppLayout = ({ children }) => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-14">{children}</div>
    </div>
  );
};

// Add PropTypes validation for children
AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Sidebar;
