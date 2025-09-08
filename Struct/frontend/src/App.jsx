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

import CompetitiveMode from "./pages/GalistGame/ModeSelect/CompetitiveMode/Competitive";

import TeacherDashboard from "./pages/TeacherDashboard";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ClassProvider } from "./contexts/ClassContext";

import ClassRequiredWrapper from "./components/ClassManagement/ClassRequiredWrapper";

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
    "/competitive-mode",
  ];

  // Define routes that should only show the Header
  const headerOnlyRoutes = [
    "/galist-game",
  ];

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
                  <ClassRequiredWrapper>
                    <Store />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <Profile />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GameShowcase />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/galist-game"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GalistGame />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-linking-node"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GalistLinkingNode />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/galist-game-insertion-node"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GalistGameInsertionNode />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/galist-game-deletion"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GalistGameDeletion />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />
             <Route
              path="/galist-game-node-creation"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GalistGameNodeCreation />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/galist-game-abstract-data-type"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <GalistAbstractDataType />
                  </ClassRequiredWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/competitive-mode"
              element={
                <ProtectedRoute>
                  <ClassRequiredWrapper>
                    <CompetitiveMode />
                  </ClassRequiredWrapper>
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
        <ClassProvider>
          <AppLayout />
        </ClassProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
