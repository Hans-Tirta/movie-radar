import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, JSX } from "react";
import {
  Menu,
  X,
  Film,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

function NavBar(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Function to check if current path matches the link
  const isActiveLink = (path: string): boolean => {
    return location.pathname === path;
  };

  // Function to get user name from JWT token
  const getUserName = (): string => {
    try {
      const token = localStorage.getItem("token"); // or however you store your JWT
      if (!token) return "User";

      // Parse JWT without verification (since verification happens on backend)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const decoded = JSON.parse(jsonPayload);
      return decoded.username || "User"; // Based on your JwtPayload interface
    } catch (error) {
      console.error("Error parsing token:", error);
      return "User";
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userName = getUserName();
  const userInitials = getUserInitials(userName);

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="w-full flex justify-between items-center">
        {/* Logo and Brand */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors"
        >
          <Film size={28} className="text-blue-500" />
          <span>Movie Radar</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className={`hover:text-blue-400 font-medium transition-colors relative ${
                isActiveLink("/")
                  ? "text-blue-400 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-400"
                  : "text-gray-300"
              }`}
            >
              Home
            </Link>
            <Link
              to="/favorites"
              className={`hover:text-blue-400 font-medium transition-colors relative ${
                isActiveLink("/favorites")
                  ? "text-blue-400 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-400"
                  : "text-gray-300"
              }`}
            >
              Favorites
            </Link>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-3 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-md font-semibold">
                {userInitials}
              </div>
              <span className="text-md font-medium">{userName}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 py-2 z-50">
                <Link
                  to="/"
                  className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User size={16} />
                  <span>Profile (Unfinished)</span>
                </Link>
                <Link
                  to="/"
                  className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings size={16} />
                  <span>Settings (Unfinished)</span>
                </Link>
                <div className="border-t border-gray-600 my-2"></div>
                <Link
                  to="/logout"
                  className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 text-red-400 hover:text-red-300 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
          <div className="flex flex-col space-y-4 pt-4">
            {/* Mobile Navigation Links */}
            <Link
              to="/"
              className={`text-xl font-medium transition-colors ${
                isActiveLink("/")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/favorites"
              className={`text-xl font-medium transition-colors ${
                isActiveLink("/favorites")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Favorites
            </Link>

            {/* Mobile User Section */}
            <div className="border-t border-gray-600 pt-4 mt-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {userInitials}
                </div>
                <span className="text-lg font-medium">{userName}</span>
              </div>

              <Link
                to="/"
                className="flex items-center space-x-3 text-lg hover:text-blue-400 font-medium transition-colors mb-3"
                onClick={() => setIsOpen(false)}
              >
                <User size={20} />
                <span>Profile</span>
              </Link>

              <Link
                to="/"
                className="flex items-center space-x-3 text-lg hover:text-blue-400 font-medium transition-colors mb-3"
                onClick={() => setIsOpen(false)}
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>

              <Link
                to="/logout"
                className="flex items-center space-x-3 text-lg hover:text-red-400 font-medium transition-colors text-red-400"
                onClick={() => setIsOpen(false)}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
