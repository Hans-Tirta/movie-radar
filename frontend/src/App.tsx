import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { MovieProvider } from "./contexts/MovieContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  const location = useLocation();
  const hideNavPaths = ["/login", "/register"];

  const shouldHideNav = hideNavPaths.includes(location.pathname);

  return (
    <AuthProvider>
      <MovieProvider>
        {!shouldHideNav && <NavBar />}
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/logout" element={<Logout />} />
            </Route>

            {/* Redirect any unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        {!shouldHideNav && <Footer />}
      </MovieProvider>
    </AuthProvider>
  );
}

export default App;
