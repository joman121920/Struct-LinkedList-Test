import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Profile from "./pages/Profile/Profile";
import Store from "./pages/Store/Store";

import GameShowcase from "./pages/GameShowcase";
import GalistGame from "./pages/GalistGame/GalistGame";
import GalistGameDeletion from "./pages/GalistGame/ModeSelect/SinglyLinkedLists/LevelFour/GalistDeletion";
import GalistGameNodeCreation from "./pages/GalistGame/ModeSelect/SinglyLinkedLists/LevelOne/NodeCreation";
import GalistGameInsertionNode from "./pages/GalistGame/ModeSelect/SinglyLinkedLists/LevelThree/InsertionNode";
import GalistLinkingNode from "./pages/GalistGame/ModeSelect/SinglyLinkedLists/LevelTwo/LinkingNode";
import GalistAbstractDataType from "./pages/GalistGame/ModeSelect/SinglyLinkedLists/LevelFive/AbstractDataType";
import DoublyGalistGameNodeCreation from "./pages/GalistGame/ModeSelect/DoublyLinkedLists/LevelOne/NodeCreation";
import DoublyGalistLinkingNode from "./pages/GalistGame/ModeSelect/DoublyLinkedLists/LevelTwo/LinkingNode";
import DoublyGalistGameInsertionNode from "./pages/GalistGame/ModeSelect/DoublyLinkedLists/LevelThree/InsertionNode";
import DoublyGalistGameDeletion from "./pages/GalistGame/ModeSelect/DoublyLinkedLists/LevelFour/GalistDeletion";
import DoublyGalistAbstractDataType from "./pages/GalistGame/ModeSelect/DoublyLinkedLists/LevelFive/AbstractDataType";
import GalistLeaderboard from "./pages/GalistGame/Leaderboard/GalistLeaderboard";
import CompetitiveMode from "./pages/GalistGame/ModeSelect/CompetitiveMode/Competitive";

import TeacherDashboard from "./pages/TeacherDashboard";

import { AuthProvider, useAuth } from "./contexts/AuthContext";


import ProtectedRoute from "./routes/ProtectedRoute";
import TeacherRoute from "./routes/TeacherRoute";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Define routes that should have no navigation (full immersive game experience)
  const noNavRoutes = [
    "/galist-game-node-creation",
    "/galist-game-linking-node",
    "/galist-game-insertion-node",
    "/galist-game-deletion",
    "/galist-game-abstract-data-type",
    "/galist-game-doubly-node-creation",
    "/galist-game-doubly-linking-node",
    "/galist-game-doubly-insertion-node",
    "/galist-game-doubly-deletion",
    "/galist-game-doubly-abstract-data-type",
    "/competitive-mode",
  ];

  // Define routes that should only show the Header
  const headerOnlyRoutes = ["/galist-game"];

  // Check if the current route is in the no-nav routes
  const isNoNavRoute = noNavRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // Check if the current route is in the header-only routes
  const isHeaderOnlyRoute = headerOnlyRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // Only show sidebar if user is authenticated and not on a no-nav or header-only route
  const showSidebar = isAuthenticated && !isHeaderOnlyRoute && !isNoNavRoute;

  return (
    <div className="flex min-h-screen">
      {showSidebar && (
        <aside className="w-12 bg-gray-800 text-white z-10">
          <Sidebar />
        </aside>
      )}
      <div className={`flex-1 flex flex-col ${showSidebar ? "ml-0" : ""}`}>
        {isHeaderOnlyRoute && <Header />}
        {!isHeaderOnlyRoute && !isNoNavRoute && <Navbar />}
        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<LandingPage />} />

            {/* Protected routes */}
            <Route
              path="/store"
              element={
                <ProtectedRoute>
                  <Store />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <GameShowcase />
                </ProtectedRoute>
              }
            />

            <Route
              path="/galist-game"
              element={
                <ProtectedRoute>
                  <GalistGame />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-leaderboard"
              element={
                <ProtectedRoute>
                  <GalistLeaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-linking-node"
              element={
                <ProtectedRoute>
                  <GalistLinkingNode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-insertion-node"
              element={
                <ProtectedRoute>
                  <GalistGameInsertionNode />
                </ProtectedRoute>
              }
            />

            <Route
              path="/galist-game-deletion"
              element={
                <ProtectedRoute>
                  <GalistGameDeletion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-node-creation"
              element={
                <ProtectedRoute>
                  <GalistGameNodeCreation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/galist-game-abstract-data-type"
              element={
                <ProtectedRoute>
                  <GalistAbstractDataType />
                </ProtectedRoute>
              }
            />

            <Route
              path="/competitive-mode"
              element={
                <ProtectedRoute>
                  <CompetitiveMode />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher-dashboard"
              element={
                <TeacherRoute>
                  <TeacherDashboard />
                </TeacherRoute>
              }
            />

            <Route
              path="/galist-game-doubly-node-creation"
              element={
                <ProtectedRoute>
                  <DoublyGalistGameNodeCreation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-doubly-linking-node"
              element={
                <ProtectedRoute>
                  <DoublyGalistLinkingNode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-doubly-insertion-node"
              element={
                <ProtectedRoute>
                  <DoublyGalistGameInsertionNode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-doubly-deletion"
              element={
                <ProtectedRoute>
                  <DoublyGalistGameDeletion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-doubly-abstract-data-type"
              element={
                <ProtectedRoute>
                  <DoublyGalistAbstractDataType />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
       
        <AppLayout />
      
      </AuthProvider>
    </Router>
  );
}

export default App;
